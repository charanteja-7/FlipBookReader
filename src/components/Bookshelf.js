'use client';

import React, { useState, useMemo } from 'react';
import { useLibrary } from '@/context/LibraryContext';
import Link from 'next/link';
import { Trash2, BookOpen, Heart, Filter } from 'lucide-react';

export default function Bookshelf() {
    const { books, loading, removeBook, toggleFavorite } = useLibrary();
    const [selectedGenre, setSelectedGenre] = useState('All');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    const genres = useMemo(() => {
        const uniqueGenres = new Set(books.map(book => book.genre || 'Uncategorized'));
        return ['All', ...Array.from(uniqueGenres).sort()];
    }, [books]);

    const filteredBooks = useMemo(() => {
        return books.filter(book => {
            const matchesGenre = selectedGenre === 'All' || (book.genre || 'Uncategorized') === selectedGenre;
            const matchesFavorite = !showFavoritesOnly || book.isFavorite;
            return matchesGenre && matchesFavorite;
        });
    }, [books, selectedGenre, showFavoritesOnly]);

    if (loading) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div className="loading-spinner" />
                <p>Loading your library...</p>
            </div>
        );
    }

    if (books.length === 0) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', background: '#f8fafc', borderRadius: '12px' }}>
                <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>Your library is empty. Upload some books to get started!</p>
            </div>
        );
    }

    return (
        <div>
            {/* Filter Bar */}
            <div style={{
                marginBottom: '2rem',
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                alignItems: 'center',
                padding: '1rem',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <Filter size={18} />
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Filters:</span>
                </div>

                <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: 'white',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        outline: 'none',
                        minWidth: '150px'
                    }}
                >
                    {genres.map(genre => (
                        <option key={genre} value={genre}>{genre}</option>
                    ))}
                </select>

                <button
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        border: showFavoritesOnly ? '1px solid #ef4444' : '1px solid #e2e8f0',
                        backgroundColor: showFavoritesOnly ? '#fef2f2' : 'white',
                        color: showFavoritesOnly ? '#ef4444' : 'var(--text-secondary)',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                    }}
                >
                    <Heart size={16} fill={showFavoritesOnly ? "currentColor" : "none"} />
                    Favorites
                </button>

                <div style={{ marginLeft: 'auto', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'}
                </div>
            </div>

            {/* Grid */}
            <div className="bookshelf-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '2.5rem 2rem',
                padding: '1rem 0'
            }}>
                {filteredBooks.map((book) => (
                    <div key={book.id} className="book-item" style={{ position: 'relative', group: 'group' }}>
                        <Link href={`/read/${book.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                            <div className="book-cover-wrapper" style={{ position: 'relative', marginBottom: '1rem' }}>
                                <div className="book-cover" style={{
                                    aspectRatio: '2/3',
                                    backgroundColor: '#e2e8f0',
                                    backgroundImage: book.coverImage ? `url(${book.coverImage})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {!book.coverImage && (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                            <BookOpen size={40} color="#94a3b8" />
                                        </div>
                                    )}

                                    {/* Hover Overlay */}
                                    <div className="hover-overlay" style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
                                        opacity: 0,
                                        transition: 'opacity 0.2s'
                                    }} />
                                </div>
                            </div>

                            <h3 style={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                color: 'var(--text-primary)',
                                marginBottom: '0.25rem'
                            }} title={book.title}>
                                {book.title}
                            </h3>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                <span style={{
                                    background: '#f1f5f9',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    color: '#475569',
                                    fontWeight: '500'
                                }}>
                                    {book.genre || 'Uncategorized'}
                                </span>
                            </div>
                        </Link>

                        {/* Action Buttons */}
                        <div style={{
                            position: 'absolute',
                            top: '0.75rem',
                            right: '0.75rem',
                            display: 'flex',
                            gap: '0.5rem',
                            zIndex: 10
                        }}>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleFavorite(book.id);
                                }}
                                style={{
                                    background: 'rgba(255,255,255,0.95)',
                                    border: '1px solid rgba(0,0,0,0.05)',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    color: book.isFavorite ? '#ef4444' : '#94a3b8'
                                }}
                                title={book.isFavorite ? "Remove from favorites" : "Add to favorites"}
                            >
                                <Heart size={16} fill={book.isFavorite ? "currentColor" : "none"} />
                            </button>

                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (confirm('Delete this book?')) removeBook(book.id);
                                }}
                                style={{
                                    background: 'rgba(255,255,255,0.95)',
                                    border: '1px solid rgba(0,0,0,0.05)',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    color: '#ef4444'
                                }}
                                title="Delete Book"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
