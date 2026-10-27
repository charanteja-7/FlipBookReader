import { openDB } from 'idb';
// Keep the original database name and books store so existing libraries survive
// upgrades. Version 2 adds highlights and notes, indexed by book.
export const initDB = () =>
  openDB('book-reader-db', 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('books'))
        db.createObjectStore('books', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('annotations'))
        db.createObjectStore('annotations', { keyPath: 'id' }).createIndex(
          'bookId',
          'bookId',
        );
    },
  });
export const addBook = async (book) => (await initDB()).put('books', book);
export const getAllBooks = async () => (await initDB()).getAll('books');
export const getBook = async (id) => (await initDB()).get('books', id);
export async function deleteBook(id) {
  const tx = (await initDB()).transaction(
    ['books', 'annotations'],
    'readwrite',
  );
  const notes = tx.objectStore('annotations');
  for (const key of await notes.index('bookId').getAllKeys(id))
    await notes.delete(key);
  await tx.objectStore('books').delete(id);
  await tx.done;
}
export async function clearBooks() {
  const tx = (await initDB()).transaction(
    ['books', 'annotations'],
    'readwrite',
  );
  await tx.objectStore('annotations').clear();
  await tx.objectStore('books').clear();
  await tx.done;
}
export const getAnnotations = async (bookId) =>
  (await initDB()).getAllFromIndex('annotations', 'bookId', bookId);
export const getAllAnnotations = async () =>
  (await initDB()).getAll('annotations');
export const saveAnnotation = async (annotation) =>
  (await initDB()).put('annotations', annotation);
export const deleteAnnotation = async (id) =>
  (await initDB()).delete('annotations', id);
export async function importAnnotations(annotations) {
  const tx = (await initDB()).transaction(
    ['books', 'annotations'],
    'readwrite',
  );
  let count = 0;
  for (const annotation of annotations) {
    const book = await tx.objectStore('books').get(annotation.bookId);
    if (!book || annotation.page >= (book.numPages || Infinity)) continue;
    await tx.objectStore('annotations').put(annotation);
    count++;
  }
  await tx.done;
  return count;
}
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
