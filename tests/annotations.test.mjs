import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  pageRects,
  mergeRects,
  validateAnnotations,
  notesMarkdown,
} from '../src/lib/annotations.js';
import {
  addBook,
  clearBooks,
  deleteBook,
  getAnnotations,
  getAllAnnotations,
  saveAnnotation,
  importAnnotations,
} from '../src/lib/storage.js';
test('selection rectangles become zoom-independent page fractions', () => {
  const page = { left: 100, top: 50, width: 400, height: 600 };
  const rects = pageRects(
    [
      { left: 140, top: 110, width: 80, height: 12 },
      { left: 220, top: 111, width: 60, height: 11 },
      { left: 140, top: 130, width: 0.5, height: 12 },
      { left: 60, top: 150, width: 100, height: 12 },
    ],
    page,
  );
  assert.deepEqual(rects, [
    { x: 0.1, y: 0.1, w: 0.35, h: 0.02 },
    { x: 0, y: 0.1667, w: 0.15, h: 0.02 },
  ]);
});
test('runs on different lines stay separate', () => {
  const lines = mergeRects([
    { x: 0.1, y: 0.1, w: 0.2, h: 0.02 },
    { x: 0.1, y: 0.13, w: 0.2, h: 0.02 },
  ]);
  assert.equal(lines.length, 2);
});
test('imports keep only valid annotations for books on this device', () => {
  const ids = new Set(['a']);
  const valid = {
    id: 'h1',
    bookId: 'a',
    page: 2,
    kind: 'highlight',
    color: 'green',
    rects: [{ x: 0.1, y: 0.2, w: 0.3, h: 0.02 }],
    text: 'Quiet',
    note: 'Remember this',
  };
  const result = validateAnnotations(
    [valid, { ...valid, id: 'h2', bookId: 'gone' }],
    ids,
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].note, 'Remember this');
  assert.deepEqual(validateAnnotations(undefined, ids), []);
  assert.throws(() => validateAnnotations([{ ...valid, color: 'black' }], ids));
  assert.throws(() =>
    validateAnnotations(
      [{ ...valid, rects: [{ x: 2, y: 0, w: 0, h: 0 }] }],
      ids,
    ),
  );
});
test('notes export as Markdown grouped by page', () => {
  const md = notesMarkdown('Book', [
    { page: 3, kind: 'note', rects: [], text: '', note: 'Page thought' },
    {
      page: 0,
      kind: 'highlight',
      rects: [{ x: 0, y: 0.1, w: 0.1, h: 0.1 }],
      text: 'A line',
      note: 'Why',
    },
  ]);
  assert.match(md, /## Page 1\n\n> A line\n\nNote: Why/);
  assert.match(md, /## Page 4\n\nPage thought/);
});
test('deleting a book or clearing the library removes its annotations', async () => {
  await clearBooks();
  await addBook({ id: 'one', title: 'One', numPages: 5 });
  await addBook({ id: 'two', title: 'Two', numPages: 5 });
  await saveAnnotation({ id: 'x', bookId: 'one', page: 0, rects: [] });
  await saveAnnotation({ id: 'y', bookId: 'two', page: 1, rects: [] });
  await deleteBook('one');
  assert.deepEqual(await getAnnotations('one'), []);
  assert.equal((await getAnnotations('two')).length, 1);
  assert.equal(
    await importAnnotations([
      { id: 'z', bookId: 'two', page: 4, rects: [] },
      { id: 'late', bookId: 'two', page: 9, rects: [] },
      { id: 'lost', bookId: 'one', page: 0, rects: [] },
    ]),
    1,
  );
  await clearBooks();
  assert.deepEqual(await getAllAnnotations(), []);
});
