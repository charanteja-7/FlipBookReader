'use client';

import React, { useCallback } from 'react';
import { useLibrary } from '@/context/LibraryContext';
import { Upload } from 'lucide-react';

export default function BookUpload() {
    const { addBook } = useLibrary();

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = Array.from(e.dataTransfer.files);
        files.forEach(file => {
            if (file.type === 'application/pdf') {
                addBook(file);
            }
        });
    }, [addBook]);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if (file.type === 'application/pdf') {
                addBook(file);
            }
        });
    };

    return (
        <div
            className="upload-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            style={{
                border: '2px dashed var(--text-secondary)',
                borderRadius: '12px',
                padding: '2rem',
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
                multiple
            />
            <label htmlFor="book-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <Upload size={32} />
                <div>
                    <strong>Click to upload</strong> or drag and drop PDF books
                </div>
            </label>
        </div>
    );
}
