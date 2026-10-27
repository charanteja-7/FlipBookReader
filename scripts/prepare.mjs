import { copyFile, mkdir, cp } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pdfPackage = require.resolve('pdfjs-dist/package.json');
await mkdir('public', { recursive: true });
await copyFile(
  dirname(pdfPackage) + '/build/pdf.worker.min.mjs',
  'public/pdf.worker.min.mjs',
);

for (const folder of ['cmaps', 'standard_fonts', 'wasm']) {
  await cp(dirname(pdfPackage) + '/' + folder, 'public/pdf-assets/' + folder, {
    recursive: true,
  });
}
