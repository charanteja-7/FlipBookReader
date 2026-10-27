'use client';
import { forwardRef } from 'react';
import { Page } from 'react-pdf';
const PDFPage = forwardRef(function PDFPage(
  { pageNumber, width, height, active, textLayer = false },
  ref,
) {
  return (
    <div
      ref={ref}
      className="pdf-sheet"
      role="group"
      style={{ width, height }}
      aria-label={`Page ${pageNumber}`}
    >
      {active ? (
        <Page
          pageNumber={pageNumber}
          width={width}
          height={height}
          devicePixelRatio={Math.min(
            typeof window === 'undefined' ? 1 : window.devicePixelRatio,
            2,
          )}
          renderTextLayer={textLayer}
          renderAnnotationLayer={false}
          loading={
            <p className="page-loading">Rendering page {pageNumber}...</p>
          }
          error={<p role="alert">Page {pageNumber} could not be rendered.</p>}
        />
      ) : (
        <span className="page-loading">Page {pageNumber}</span>
      )}
    </div>
  );
});
export default PDFPage;
