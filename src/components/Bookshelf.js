'use client';

import React from 'react';
import { useLibrary } from '@/context/LibraryContext';
import Link from 'next/link';
import { Trash2, BookOpen } from 'lucide-react';

export default function Bookshelf({ onSelectBook }) {
    const { books, loading, removeBook } = useLibrary();

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading library...</div>;
    }

    return (
        <div className="bookshelf-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '2rem',
            padding: '2rem 0'
        }}>
            {books.map((book) => (
                <div key={book.id} className="book-item" style={{ position: 'relative', group: 'group' }}>
                    <Link href={`/read/${book.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="book-cover" style={{
                            aspectRatio: '2/3',
                            backgroundColor: '#e2e8f0',
                            backgroundImage: book.coverImage ? `url(${book.coverImage})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            borderRadius: '6px',
                            boxShadow: 'var(--shadow-book)',
                            marginBottom: '1rem',
                            transition: 'transform 0.2s ease',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {!book.coverImage && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    <BookOpen color="var(--text-secondary)" />
                                </div>
                            )}
                        </div>
                        <h3 style={{
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: 'var(--text-primary)'
                        }}>
                            {book.title}
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {new Date(book.dateAdded).toLocaleDateString()}
                        </p>
                    </Link>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (confirm('Delete this book?')) removeBook(book.id);
                        }}
                        style={{
                            position: 'absolute',
                            top: '0.5rem',
                            right: '0.5rem',
                            background: 'rgba(255,255,255,0.8)',
                            border: 'none',
                            borderRadius: '50%',
                            padding: '0.4rem',
                            opacity: 0.8, // Should be hidden by default and shown on hover really
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        title="Delete Book"
                    >
                        <Trash2 size={16} color="#ef4444" />
                    </button>
                </div>
            ))}
        </div>
    );
}
