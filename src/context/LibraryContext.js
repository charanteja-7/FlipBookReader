'use client';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  getAllBooks,
  addBook as storeBook,
  deleteBook,
  updateBook,
} from '@/lib/storage';
import { inspectPDF } from '@/lib/pdf-utils';
const LibraryContext = createContext();
export const useLibrary = () => useContext(LibraryContext);
export function LibraryProvider({ children }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refreshBooks = useCallback(async () => {
    try {
      setBooks(
        (await getAllBooks()).sort(
          (a, b) =>
            new Date(b.lastReadDate || b.dateAdded) -
            new Date(a.lastReadDate || a.dateAdded),
        ),
      );
      setError('');
    } catch {
      setError(
        'Device storage is unavailable. Allow site storage, then reload to use your library.',
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refreshBooks();
  }, [refreshBooks]);
  async function addBook(file, genre = 'Uncategorized') {
    const details = await inspectPDF(file);
    try {
      await storeBook({
        id: crypto.randomUUID(),
        title: file.name.replace(/\.pdf$/i, ''),
        fileBlob: file,
        ...details,
        dateAdded: new Date(),
        lastReadPage: 0,
        bookmarks: [],
        genre: genre.trim() || 'Uncategorized',
        isFavorite: false,
      });
    } catch {
      throw new Error(
        'Could not save this PDF. Your device storage may be full or disabled.',
      );
    }
    await refreshBooks();
  }
  async function removeBook(id) {
    await deleteBook(id);
    await refreshBooks();
  }
  async function toggleFavorite(id) {
    const book = books.find((b) => b.id === id);
    await updateBook(id, { isFavorite: !book.isFavorite });
    await refreshBooks();
  }
  return (
    <LibraryContext.Provider
      value={{
        books,
        loading,
        error,
        addBook,
        removeBook,
        toggleFavorite,
        refreshBooks,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}
