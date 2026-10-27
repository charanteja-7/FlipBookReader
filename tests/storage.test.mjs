import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearBooks,
  addBook,
  getBook,
  getAllBooks,
  updateBook,
  updateBookProgress,
  importReadingData,
} from '../src/lib/storage.js';
test('existing-schema books survive concurrent progress and favorite writes', async () => {
  await clearBooks();
  await addBook({
    id: 'legacy',
    fileBlob: new Blob(['pdf']),
    title: 'Legacy',
    numPages: 4,
  });
  await Promise.all([
    updateBookProgress('legacy', 2),
    updateBook('legacy', { isFavorite: true }),
  ]);
  const book = await getBook('legacy');
  assert.equal(book.lastReadPage, 2);
  assert.equal(book.isFavorite, true);
  assert.equal(await book.fileBlob.text(), 'pdf');
});
test('imports update only existing IDs, clamp positions, preserve PDF and title', async () => {
  const count = await importReadingData([
    {
      id: 'legacy',
      lastReadPage: 900,
      bookmarks: [0, 3, 8],
      isFavorite: false,
    },
    { id: 'missing', lastReadPage: 1, bookmarks: [] },
  ]);
  assert.equal(count, 1);
  const book = await getBook('legacy');
  assert.equal(book.lastReadPage, 3);
  assert.deepEqual(book.bookmarks, [0, 3]);
  assert.equal(book.title, 'Legacy');
  assert.equal((await getAllBooks()).length, 1);
});
test('clear removes books and associated reading data', async () => {
  await clearBooks();
  assert.deepEqual(await getAllBooks(), []);
});
