import { openDB } from 'idb';

const DB_NAME = 'book-reader-db';
const DB_VERSION = 1;
const STORE_NAME = 'books';

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
};

export const addBook = async (book) => {
  const db = await initDB();
  return db.put(STORE_NAME, book);
};

export const getAllBooks = async () => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

export const getBook = async (id) => {
  const db = await initDB();
  return db.get(STORE_NAME, id);
};

export const deleteBook = async (id) => {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
};

export const updateBookProgress = async (id, lastReadPage) => {
  const db = await initDB();
  const book = await db.get(STORE_NAME, id);
  if (book) {
    book.lastReadPage = lastReadPage;
    book.lastReadDate = new Date();
    await db.put(STORE_NAME, book);
  }
};

export const updateBook = async (id, updates) => {
  const db = await initDB();
  const book = await db.get(STORE_NAME, id);
  if (book) {
    const updatedBook = { ...book, ...updates };
    await db.put(STORE_NAME, updatedBook);
    return updatedBook;
  }
  return null;
};
