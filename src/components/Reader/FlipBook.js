'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Document, pdfjs } from 'react-pdf';
import PDFPage from './PDFPage';
import { basePath, pdfOptions } from '@/lib/pdf-utils';
import 'react-pdf/dist/Page/TextLayer.css';
pdfjs.GlobalWorkerOptions.workerSrc = `${basePath}/pdf.worker.min.mjs`;
const options = pdfOptions;
export default function FlipBook({
  file,
  currentPage,
  onPageChange,
  onLoad,
  layout,
  zoom,
  reducedMotion,
}) {
  const host = useRef(null);
  const flip = useRef(null);
  const touch = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [pdf, setPdf] = useState(null);
  const [ratio, setRatio] = useState(1.414);
  const [error, setError] = useState('');
  const single = layout === 'single' || size.width < 720;
  const width = Math.max(
    100,
    Math.floor(
      (Math.min(
        (size.width - 32) / (single ? 1 : 2),
        (size.height - 24) / ratio,
        560,
      ) *
        zoom) /
        100,
    ),
  );
  const height = Math.floor(width * ratio);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  const loaded = useCallback(
    async (document) => {
      setPdf(document);
      onLoad(document.numPages);
      try {
        const page = await document.getPage(1);
        const v = page.getViewport({ scale: 1 });
        setRatio(v.height / v.width);
      } catch {
        /* Default A4 fit remains usable. */
      }
    },
    [onLoad],
  );
  useEffect(() => {
    const controller = flip.current?.pageFlip();
    if (!controller || controller.getCurrentPageIndex() === currentPage) return;
    // turnToPage avoids animated travel across dozens of pages on direct jumps.
    if (
      reducedMotion ||
      Math.abs(controller.getCurrentPageIndex() - currentPage) > 2
    )
      controller.turnToPage(currentPage);
    else controller.flip(currentPage);
  }, [currentPage, reducedMotion, width]);
  function swipeEnd(event) {
    if (!touch.current || !single || window.getSelection()?.toString()) return;
    const dx = event.changedTouches[0].clientX - touch.current.x;
    const dy = event.changedTouches[0].clientY - touch.current.y;
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.8 && zoom === 100)
      onPageChange(currentPage + (dx < 0 ? 1 : -1));
    touch.current = null;
  }
  return (
    <div
      ref={host}
      className="reader-stage"
      tabIndex={0}
      role="region"
      aria-label="PDF pages"
      onTouchStart={(e) => {
        touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={swipeEnd}
    >
      <Document
        file={file}
        options={options}
        onLoadSuccess={loaded}
        onLoadError={() =>
          setError(
            'This PDF could not be opened. Return to the library and add an unlocked, valid PDF.',
          )
        }
        loading={
          <p className="reader-loading" role="status">
            Opening your book...
          </p>
        }
        error={
          <p role="alert" className="reader-loading">
            {error || 'Unable to open PDF.'}
          </p>
        }
      >
        {pdf &&
          size.width > 0 &&
          (single ? (
            <div
              className={'single-page' + (reducedMotion ? ' no-motion' : '')}
              key={currentPage}
              style={{ width, height }}
            >
              <PDFPage
                pageNumber={currentPage + 1}
                width={width}
                height={height}
                active
                textLayer
              />
            </div>
          ) : (
            <HTMLFlipBook
              key={`${width}-${height}`}
              ref={flip}
              width={width}
              height={height}
              size="fixed"
              minWidth={100}
              maxWidth={1000}
              minHeight={100}
              maxHeight={1600}
              startPage={currentPage}
              showCover
              usePortrait={false}
              drawShadow={!reducedMotion}
              maxShadowOpacity={0.12}
              flippingTime={reducedMotion ? 1 : 420}
              mobileScrollSupport
              useMouseEvents={!reducedMotion}
              showPageCorners={!reducedMotion}
              disableFlipByClick={reducedMotion}
              swipeDistance={50}
              onFlip={(event) => onPageChange(event.data)}
              className={
                'flip-book' + (currentPage === 0 ? ' closed-book' : '')
              }
            >
              {Array.from({ length: pdf.numPages }, (_, index) => (
                <PDFPage
                  key={index}
                  pageNumber={index + 1}
                  width={width}
                  height={height}
                  active={Math.abs(index - currentPage) <= 3}
                />
              ))}
            </HTMLFlipBook>
          ))}
      </Document>
    </div>
  );
}
