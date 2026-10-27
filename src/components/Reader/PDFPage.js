'use client';
import { forwardRef, useContext } from 'react';
import { Page } from 'react-pdf';
import { RenderContext } from './RenderContext';
const PDFPage = forwardRef(function PDFPage(
  { pageNumber, width, height, textLayer = false },
  ref,
) {
  const { page, pixelRatio } = useContext(RenderContext);
  const active = Math.abs(pageNumber - 1 - page) <= 3;
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
          devicePixelRatio={pixelRatio}
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
