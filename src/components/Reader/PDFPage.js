'use client';

import React, { forwardRef } from 'react';
import { Page } from 'react-pdf';

const PDFPage = forwardRef(({ pageNumber, width, height }, ref) => {
    return (
        <div ref={ref} className="page-wrapper" style={{
            backgroundColor: 'var(--bg-paper)',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.02)',
            height: '100%'
        }}>
            <div style={{ position: 'relative', height: '100%', width: '100%' }}>
                <Page
                    pageNumber={pageNumber}
                    width={width}
                    height={height}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="pdf-page-canvas"
                />
                <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px', // Or alternate left/right based on parity
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    opacity: 0.5
                }}>
                    {pageNumber}
                </div>
            </div>
        </div>
    );
});

PDFPage.displayName = 'PDFPage';

export default PDFPage;
