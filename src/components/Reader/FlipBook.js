'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Document } from 'react-pdf';
import PDFPage from './PDFPage';
import { pdfjs } from 'react-pdf';

// Ensure worker is set (redundant check but safe)
if (typeof window !== 'undefined' && 'Worker' in window) {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export default function FlipBook({ file, onFlip, initialPage = 0 }) {
    const [numPages, setNumPages] = useState(null);
    const bookRef = useRef();

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    const handleFlip = useCallback((e) => {
        // react-pageflip events: e.data is the page number (index)
        if (onFlip) {
            onFlip(e.data);
        }
    }, [onFlip]);

    // Dimensions - hardcoded for MVP, should be responsive
    // A4 ratio roughly 1 : 1.414. Let's start with a fixed size that fits well.
    const width = 450;
    const height = 650;

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            perspective: '1500px'
        }}>
            <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div style={{ color: 'var(--text-secondary)' }}>Loading Book...</div>}
            >
                {numPages && (
                    <HTMLFlipBook
                        width={width}
                        height={height}
                        size="fixed"
                        minWidth={300}
                        maxWidth={1000}
                        minHeight={400}
                        maxHeight={1533}
                        maxShadowOpacity={0.5}
                        showCover={true}
                        mobileScrollSupport={true}
                        onFlip={handleFlip}
                        ref={bookRef}
                        className="flip-book"
                        style={{ margin: '0 auto' }}
                        startPage={initialPage}
                        drawShadow={true}
                        flippingTime={1000}
                        usePortrait={false} // Force spread for now, or detect
                        startZIndex={0}
                        autoSize={true}
                        clickEventForward={true}
                        useMouseEvents={true}
                        swipeDistance={30}
                        showPageCorners={true}
                        disableFlipByClick={false}
                    >
                        {/* 
                    We need to create a div for each page.
                    React-pageflip children are pages.
                */}
                        {Array.from(new Array(numPages), (el, index) => (
                            <PDFPage
                                key={`page_${index + 1}`}
                                pageNumber={index + 1}
                                width={width}
                                height={height}
                            />
                        ))}
                    </HTMLFlipBook>
                )}
            </Document>
        </div>
    );
}
