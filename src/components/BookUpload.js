'use client';

import React, { useState, useCallback } from 'react';
import { useLibrary } from '@/context/LibraryContext';
import { Upload, X, Check } from 'lucide-react';

export default function BookUpload() {
    const { addBook } = useLibrary();
    const [selectedFile, setSelectedFile] = useState(null);
    const [genre, setGenre] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleFile = (file) => {
        if (file && file.type === 'application/pdf') {
            setSelectedFile(file);
            setGenre(''); // Reset genre
        }
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files[0];
        handleFile(file);
    }, []);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        handleFile(file);
    };

    const handleConfirmUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        // Default to 'Uncategorized' if empty
        const finalGenre = genre.trim() || 'Uncategorized';
        await addBook(selectedFile, finalGenre);

        setIsUploading(false);
        setSelectedFile(null);
        setGenre('');
    };

    const handleCancel = () => {
        setSelectedFile(null);
        setGenre('');
    };

    if (selectedFile) {
        return (
            <div style={{
                border: '2px solid var(--text-secondary)',
                borderRadius: '12px',
                padding: '2rem',
                textAlign: 'center',
                backgroundColor: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                maxWidth: '500px',
                margin: '0 auto'
            }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Complete Upload</h3>

                <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                    <p style={{ marginBottom: '0.5rem', fontWeight: '500' }}>File:</p>
                    <div style={{
                        padding: '0.75rem',
                        background: '#f1f5f9',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flex: 1
                        }}>{selectedFile.name}</span>
                        <button onClick={handleCancel} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Genre:</label>
                    <input
                        type="text"
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        placeholder="e.g. Fantasy, Sci-Fi, Textbooks..."
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                    />
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                        Leave empty for "Uncategorized"
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={handleCancel}
                        disabled={isUploading}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: 'white',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmUpload}
                        disabled={isUploading}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'var(--primary-color, #2563eb)',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            opacity: isUploading ? 0.7 : 1
                        }}
                    >
                        {isUploading ? 'Uploading...' : 'Add Book'}
                        {!isUploading && <Check size={18} />}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="upload-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            style={{
                border: '2px dashed var(--text-secondary)',
                borderRadius: '12px',
                padding: '3rem 2rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: 'rgba(0,0,0,0.02)',
                color: 'var(--text-secondary)'
            }}
        >
            <input
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="book-upload"
            />
            <label htmlFor="book-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                    padding: '1rem',
                    borderRadius: '50%',
                    background: '#e0e7ff',
                    color: '#4338ca'
                }}>
                    <Upload size={32} />
                </div>
                <div>
                    <strong style={{ display: 'block', fontSize: '1.2rem', marginBottom: '0.5rem', color: '#1e293b' }}>Click to upload</strong>
                    <span style={{ fontSize: '0.95rem' }}>or drag and drop PDF books</span>
                </div>
            </label>
        </div>
    );
}
