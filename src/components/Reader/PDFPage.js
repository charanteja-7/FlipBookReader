'use client';
import { forwardRef, useContext } from 'react';
import { Page } from 'react-pdf';
import { RenderContext } from './RenderContext';
const percent = (n) => `${n * 100}%`;
// Highlights sit under the text layer, so words stay selectable through them.
function Marks({ marks }) {
  let pins = 0;
  return (
    <div className="page-marks" aria-hidden="true">
      {marks.map((mark) =>
        mark.kind === 'note' ? (
          <span
            key={mark.id}
            className="mark page-note-pin"
            data-mark={mark.id}
            style={{ top: 10 + pins++ * 30 }}
          />
        ) : (
          mark.rects.map((rect, i) => (
            <span
              key={`${mark.id}-${i}`}
              className={`mark mark-${mark.color}${mark.note && i === mark.rects.length - 1 ? ' has-note' : ''}`}
              data-mark={mark.id}
              style={{
                left: percent(rect.x),
                top: percent(rect.y),
                width: percent(rect.w),
                height: percent(rect.h),
              }}
            />
          ))
        ),
      )}
    </div>
  );
}
const PDFPage = forwardRef(function PDFPage(
  { pageNumber, width, height, textLayer = false },
  ref,
) {
  const { page, pixelRatio, marks, selecting } = useContext(RenderContext);
  const active = Math.abs(pageNumber - 1 - page) <= 3;
  const own = marks?.[pageNumber - 1];
  return (
    <div
      ref={ref}
      className="pdf-sheet"
      role="group"
      data-page={pageNumber - 1}
      style={{ width, height }}
      aria-label={`Page ${pageNumber}`}
    >
      {active ? (
        <Page
          pageNumber={pageNumber}
          width={width}
          height={height}
          devicePixelRatio={pixelRatio}
          renderTextLayer={textLayer || selecting}
          renderAnnotationLayer={false}
          loading={
            <p className="page-loading">Rendering page {pageNumber}...</p>
          }
          error={<p role="alert">Page {pageNumber} could not be rendered.</p>}
        />
      ) : (
        <span className="page-loading">Page {pageNumber}</span>
      )}
      {active && own?.length > 0 && <Marks marks={own} />}
    </div>
  );
});
export default PDFPage;
