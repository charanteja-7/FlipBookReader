import { writeFile, mkdir } from 'node:fs/promises';
// Original sample content; a tiny PDF fixture without a generator dependency.
const pages = [
  [
    'A little room',
    'to read.',
    'A field guide to slower reading',
    'FlipBookReader / Original sample',
    'Four pages. A few quiet minutes.',
  ],
  [
    'Begin with one page.',
    'Make a little space.',
    'Close a tab. Put down your phone.',
    'Choose a page, rather than a target.',
    'A good reading session can be ten minutes long.',
    'Use the arrow keys or the buttons below to turn pages.',
  ],
  [
    'Keep a thought.',
    'Give the words a moment.',
    'When a sentence stays with you, pause.',
    'You do not need to finish a chapter to find an idea.',
    'Bookmark this page with the bookmark button.',
    'Your place and bookmarks stay on this device.',
  ],
  [
    'Come back often.',
    'Leave the book open in your mind.',
    'A little reading, repeated, becomes a habit.',
    'There is no score to chase. Just another page.',
    'Add a PDF of your own when you are ready.',
    'Your library is yours. No account required.',
  ],
];
if (process.argv.includes('--long')) {
  await mkdir('tests/fixtures', { recursive: true });
  const originals = [...pages];
  while (pages.length < 120) pages.push(originals[1 + (pages.length % 3)]);
}
const objects = [];
const add = (s) => {
  objects.push(s);
  return objects.length;
};
add('<< /Type /Catalog /Pages 2 0 R >>');
add('');
add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
add('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>');
const kids = [];
for (let i = 0; i < pages.length; i++) {
  const lines = pages[i];
  let stream =
    i === 0
      ? '0.106 0.36 0.33 rg 0 0 480 680 re f\n0.97 0.98 0.96 rg\n'
      : '0.99 0.99 0.98 rg 0 0 480 680 re f\n0.12 0.14 0.12 rg\n';
  for (let j = 0; j < lines.length; j++) {
    const size = j < 2 ? 36 : 14;
    const y = j === 0 ? 540 : j === 1 ? 492 : 420 - (j - 2) * 36;
    stream += `BT /${j < 2 ? 'F2' : 'F1'} ${size} Tf 44 ${y} Td (${lines[j]}) Tj ET\n`;
  }
  stream += `BT /F1 11 Tf 44 36 Td (FlipBookReader) Tj ET\nBT /F1 11 Tf 420 36 Td (${i + 1}) Tj ET\n`;
  const content = add(
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`,
  );
  kids.push(
    add(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 480 680] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${content} 0 R >>`,
    ),
  );
}
objects[1] = `<< /Type /Pages /Kids [${kids.map((n) => n + ' 0 R').join(' ')}] /Count ${kids.length} >>`;
let output = '%PDF-1.4\n';
const offsets = [0];
objects.forEach((object, i) => {
  offsets.push(Buffer.byteLength(output));
  output += `${i + 1} 0 obj\n${object}\nendobj\n`;
});
const xref = Buffer.byteLength(output);
output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
  .slice(1)
  .map((n) => String(n).padStart(10, '0') + ' 00000 n ')
  .join(
    '\n',
  )}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
await writeFile(
  process.argv.includes('--long')
    ? 'tests/fixtures/long.pdf'
    : 'public/sample.pdf',
  output,
);
