import { openDB } from 'idb';
// Keep the original database name and schema so existing books survive the upgrade.
export const initDB = () =>
  openDB('book-reader-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('books'))
        db.createObjectStore('books', { keyPath: 'id' });
    },
  });
export const addBook = async (book) => (await initDB()).put('books', book);
export const getAllBooks = async () => (await initDB()).getAll('books');
export const getBook = async (id) => (await initDB()).get('books', id);
export const deleteBook = async (id) => (await initDB()).delete('books', id);
export const clearBooks = async () => (await initDB()).clear('books');
export async function updateBook(id, updates) {
  const tx = (await initDB()).transaction('books', 'readwrite');
  const book = await tx.store.get(id);
  if (book) await tx.store.put({ ...book, ...updates });
  await tx.done;
  return book ? { ...book, ...updates } : null;
}
export const updateBookProgress = (id, lastReadPage) =>
  updateBook(id, { lastReadPage, lastReadDate: new Date() });
export async function importReadingData(records) {
  const tx = (await initDB()).transaction('books', 'readwrite');
  let count = 0;
  for (const record of records) {
    const book = await tx.store.get(record.id);
    if (!book) continue;
    const max = (book.numPages || Number.MAX_SAFE_INTEGER) - 1;
    await tx.store.put({
      ...book,
      ...record,
      lastReadPage: Math.min(record.lastReadPage, max),
      bookmarks: record.bookmarks.filter((n) => n <= max),
    });
    count++;
  }
  await tx.done;
  return count;
}
