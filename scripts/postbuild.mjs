import { readdir, writeFile } from 'node:fs/promises';
const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    const path = dir + '/' + entry.name;
    if (entry.isDirectory()) paths.push(...(await walk(path)));
    else if (!path.endsWith('.map') && !path.endsWith('.txt'))
      paths.push(base + path.slice(3));
  }
  return paths;
}
const assets = await walk('out');
const version = Date.now().toString(36);
const cachePrefix = 'flipbook-' + (base || 'root').replaceAll('/', '_') + '-';
const worker = `
const CACHE = '${cachePrefix}${version}';
const ASSETS = ${JSON.stringify(assets)};
const ROOT = ${JSON.stringify(base + '/')};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('${cachePrefix}') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(ROOT)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(async () => {
      const cache = await caches.open(CACHE);
      return await cache.match(url.pathname + (url.pathname.endsWith('/') ? 'index.html' : '')) || await cache.match(ROOT + 'index.html');
    }));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
`;
await writeFile('out/sw.js', worker);
await writeFile('out/.nojekyll', '');
console.log(
  'Prepared offline shell: ' +
    assets.length +
    ' same-origin assets. Cache ' +
    version,
);
