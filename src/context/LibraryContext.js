'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAllBooks, addBook as dbAddBook, deleteBook as dbDeleteBook } from '@/lib/storage';
import { extractCover } from '@/lib/pdf-utils';
import { v4 as uuidv4 } from 'uuid';



const LibraryContext = createContext();

export const useLibrary = () => useContext(LibraryContext);

export const LibraryProvider = ({ children }) => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    const refreshBooks = async () => {
        setLoading(true);
        const loadedBooks = await getAllBooks();
        // Sort by date added desc
        loadedBooks.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        setBooks(loadedBooks);
        setLoading(false);
    };

    useEffect(() => {
        refreshBooks();
    }, []);

    const addBook = async (file) => {
        if (!file) return;

        try {
            const cover = await extractCover(file);
            const newBook = {
                id: uuidv4(),
                title: file.name.replace('.pdf', ''),
                fileBlob: file, // IDB can store Blobs
                coverImage: cover,
                dateAdded: new Date(),
                lastReadPage: 0,
            };

            await dbAddBook(newBook);
            await refreshBooks();
        } catch (error) {
            console.error("Failed to add book:", error);
        }
    };

    const removeBook = async (id) => {
        await dbDeleteBook(id);
        await refreshBooks();
    };

    return (
        <LibraryContext.Provider value={{ books, loading, addBook, removeBook }}>
            {children}
        </LibraryContext.Provider>
    );
};
