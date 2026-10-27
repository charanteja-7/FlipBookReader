import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('out');
const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (base && url.pathname === base) {
      res.writeHead(301, { Location: base + '/' });
      return res.end();
    }
    if (base && !url.pathname.startsWith(base + '/')) throw new Error();
    let file = resolve(
      root,
      '.' + decodeURIComponent(url.pathname.slice(base.length)),
    );
    if (file !== root && !file.startsWith(root + sep)) throw new Error();
    if ((await stat(file)).isDirectory()) file += '/index.html';
    const data = await readFile(file);
    res.writeHead(200, {
      'Content-Type': mime[extname(file)] || 'application/octet-stream',
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(4173, '127.0.0.1', () =>
  console.log('Static preview: http://127.0.0.1:4173' + base + '/'),
);
