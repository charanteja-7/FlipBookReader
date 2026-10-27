'use client';
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  useImperativeHandle,
} from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Document, pdfjs } from 'react-pdf';
import PDFPage from './PDFPage';
import { RenderContext } from './RenderContext';
import { basePath, pdfOptions } from '@/lib/pdf-utils';
import { zoomFromWheel, pinchZoom } from '@/lib/zoom';
import 'react-pdf/dist/Page/TextLayer.css';
pdfjs.GlobalWorkerOptions.workerSrc = `${basePath}/pdf.worker.min.mjs`;
const FlipBook = forwardRef(function FlipBook(
  {
    file,
    currentPage,
    onPageChange,
    onLoad,
    layout,
    zoom,
    onZoom,
    reducedMotion,
    immersive,
    onTurning,
    onReady,
  },
  apiRef,
) {
  const host = useRef(null);
  const flip = useRef(null);
  const touch = useRef(null);
  const pan = useRef(null);
  const engine = useRef(null);
  const zoomRef = useRef(zoom);
  const callbacks = useRef({ onZoom, onPageChange, onTurning, onReady });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [pdf, setPdf] = useState(null);
  const [ratio, setRatio] = useState(1.414);
  const [pixelRatio, setPixelRatio] = useState(1);
  const [turning, setTurning] = useState(false);
  const plain = layout === 'text' || reducedMotion || pdf?.numPages === 1;
  const single = plain || layout === 'single' || size.width < 720;
  const gutter = immersive ? 8 : 12;
  const width = Math.max(
    80,
    Math.floor(
      Math.min(
        (size.width - gutter * 2) / (single ? 1 : 2),
        (size.height - gutter * 2) / ratio,
      ),
    ),
  );
  const height = Math.floor(width * ratio);
  const scale = zoom / 100;
  useEffect(() => {
    callbacks.current = { onZoom, onPageChange, onTurning, onReady };
    zoomRef.current = zoom;
  }, [onZoom, onPageChange, onTurning, onReady, zoom]);
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
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setPixelRatio(
          Math.min(devicePixelRatio * Math.max(1, zoom / 100), 2.5),
        ),
      200,
    );
    return () => clearTimeout(timer);
  }, [zoom]);
  const requestZoom = useCallback((next, x, y) => {
    const position = host.current?.querySelector('.book-position');
    const before = position?.getBoundingClientRect();
    const previousScale = zoomRef.current / 100;
    zoomRef.current = next;
    callbacks.current.onZoom(next);
    if (before)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const after = position.getBoundingClientRect();
          host.current?.scrollBy({
            left:
              after.left +
              ((x - before.left) / previousScale) * (next / 100) -
              x,
            top:
              after.top + ((y - before.top) / previousScale) * (next / 100) - y,
          });
        }),
      );
  }, []);
  useEffect(() => {
    if (plain && pdf && size.width > 0) callbacks.current.onReady?.(true);
  }, [plain, pdf, size.width]);
  useEffect(() => {
    const element = host.current;
    function wheel(event) {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      requestZoom(
        zoomFromWheel(zoomRef.current, event.deltaY),
        event.clientX,
        event.clientY,
      );
    }
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [requestZoom]);
  const loaded = useCallback(
    async (document) => {
      setPdf(document);
      onLoad(document.numPages);
      try {
        const page = await document.getPage(1);
        const v = page.getViewport({ scale: 1 });
        setRatio(v.height / v.width);
      } catch {
        /* A4 fallback. */
      }
    },
    [onLoad],
  );
  const syncPage = useCallback(
    (event) => callbacks.current.onPageChange(event.data),
    [],
  );
  const stateChange = useCallback((event) => {
    const busy = event.data === 'flipping' || event.data === 'user_fold';
    setTurning(busy);
    callbacks.current.onTurning?.(busy);
  }, []);
  useImperativeHandle(
    apiRef,
    () => ({
      turnTo(target) {
        const last = (pdf?.numPages || 1) - 1;
        const next = Math.min(last, Math.max(0, target));
        const controller = flip.current?.pageFlip();
        if (plain || !controller) {
          callbacks.current.onPageChange(next);
          return;
        }
        if (controller.getState() === 'flipping') return;
        if (Math.abs(next - controller.getCurrentPageIndex()) > 2)
          controller.turnToPage(next);
        else controller.flip(next, 'bottom');
      },
      resetView() {
        host.current.scrollTo({ left: 0, top: 0 });
      },
    }),
    [pdf, plain],
  );
  // The engine keeps these exact child elements throughout a turn. Visible canvases
  // update through context so React never reloads its collection mid-animation.
  const pages = useMemo(
    () =>
      Array.from({ length: pdf?.numPages || 0 }, (_, i) => (
        <PDFPage key={i} pageNumber={i + 1} width={width} height={height} />
      )),
    [pdf?.numPages, width, height],
  );
  const initialPage = useRef(currentPage);
  useEffect(() => {
    initialPage.current = currentPage;
  }, [currentPage]);
  const initialized = useCallback(() => {
    engine.current = flip.current?.pageFlip();
    callbacks.current.onReady?.(true);
    callbacks.current.onTurning?.(false);
    setTurning(false);
    const current = engine.current?.getCurrentPageIndex();
    if (typeof current === 'number') callbacks.current.onPageChange(current);
  }, []);
  function touchStart(event) {
    event.stopPropagation();
    const points = event.touches;
    if (points.length === 2) {
      const distance = Math.hypot(
        points[0].clientX - points[1].clientX,
        points[0].clientY - points[1].clientY,
      );
      touch.current = { pinch: true, distance, zoom: zoomRef.current };
      return;
    }
    touch.current = {
      x: points[0].clientX,
      y: points[0].clientY,
      left: host.current.scrollLeft,
      top: host.current.scrollTop,
      zoom: zoomRef.current,
    };
  }
  function touchMove(event) {
    event.stopPropagation();
    const gesture = touch.current;
    if (!gesture) return;
    if (event.touches.length === 2) {
      if (!gesture.pinch) {
        touchStart(event);
        return;
      }
      const [a, b] = event.touches;
      requestZoom(
        pinchZoom(
          gesture.zoom,
          gesture.distance,
          Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        ),
        (a.clientX + b.clientX) / 2,
        (a.clientY + b.clientY) / 2,
      );
    } else if (!gesture.pinch && zoomRef.current > 100) {
      const point = event.touches[0];
      host.current.scrollLeft = gesture.left + gesture.x - point.clientX;
      host.current.scrollTop = gesture.top + gesture.y - point.clientY;
    }
  }
  function touchEnd(event) {
    event.stopPropagation();
    const gesture = touch.current;
    if (!gesture) return;
    if (gesture.pinch) {
      if (!event.touches.length) touch.current = null;
      return;
    }
    if (
      !event.touches.length &&
      gesture.zoom <= 100 &&
      !window.getSelection()?.toString()
    ) {
      const point = event.changedTouches[0],
        dx = point.clientX - gesture.x,
        dy = point.clientY - gesture.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        const target =
          currentPage +
          (dx < 0 ? (single || currentPage === 0 ? 1 : 2) : single ? -1 : -2);
        apiRef.current?.turnTo(target);
      }
    }
    touch.current = null;
  }
  return (
    <div
      ref={host}
      className={`reader-stage ${zoom > 100 ? 'zoomed' : ''} ${plain ? 'text-mode' : ''}`}
      tabIndex={0}
      role="region"
      aria-label="PDF pages"
      aria-busy={turning}
      onTouchStartCapture={touchStart}
      onTouchMoveCapture={touchMove}
      onTouchEndCapture={touchEnd}
      onTouchCancelCapture={() => {
        touch.current = null;
      }}
      onPointerDown={(event) => {
        if (
          event.pointerType !== 'mouse' ||
          zoom <= 100 ||
          event.button !== 0 ||
          layout === 'text'
        )
          return;
        pan.current = {
          x: event.clientX,
          y: event.clientY,
          left: host.current.scrollLeft,
          top: host.current.scrollTop,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.preventDefault();
      }}
      onPointerMove={(event) => {
        if (!pan.current) return;
        host.current.scrollLeft =
          pan.current.left + pan.current.x - event.clientX;
        host.current.scrollTop =
          pan.current.top + pan.current.y - event.clientY;
      }}
      onPointerUp={() => {
        pan.current = null;
      }}
      onPointerCancel={() => {
        pan.current = null;
      }}
      onDoubleClick={(event) => {
        if (layout === 'text') return;
        event.preventDefault();
        onZoom(zoom === 100 ? 200 : 100);
      }}
    >
      <Document
        file={file}
        options={pdfOptions}
        onLoadSuccess={loaded}
        loading={
          <p className="reader-loading" role="status">
            Opening your book...
          </p>
        }
        error={
          <p role="alert" className="reader-loading">
            This PDF could not be opened. Return to the library and add an
            unlocked, valid PDF.
          </p>
        }
      >
        {pdf && size.width > 0 && (
          <RenderContext.Provider value={{ page: currentPage, pixelRatio }}>
            <div
              className={'book-position' + (single ? ' portrait' : ' spread')}
              style={{
                width: width * (single ? 1 : 2) * scale,
                height: height * scale,
              }}
            >
              <div
                className="book-surface"
                style={{
                  width: width * (single ? 1 : 2),
                  height,
                  transform: `scale(${scale})`,
                }}
              >
                {plain ? (
                  <div className="single-page no-motion">
                    <PDFPage
                      pageNumber={currentPage + 1}
                      width={width}
                      height={height}
                      textLayer
                    />
                  </div>
                ) : (
                  <HTMLFlipBook
                    key={`${width}-${height}-${single}`}
                    ref={flip}
                    width={width}
                    height={height}
                    size="fixed"
                    minWidth={80}
                    maxWidth={2000}
                    minHeight={100}
                    maxHeight={3000}
                    startPage={initialPage.current}
                    showCover
                    usePortrait={single}
                    autoSize
                    drawShadow
                    maxShadowOpacity={0.48}
                    flippingTime={850}
                    mobileScrollSupport={false}
                    useMouseEvents
                    showPageCorners
                    disableFlipByClick={false}
                    swipeDistance={40}
                    onFlip={syncPage}
                    onChangeState={stateChange}
                    onInit={initialized}
                    className={`flip-book ${!single && currentPage === 0 ? 'closed-book' : ''}`}
                  >
                    {pages}
                  </HTMLFlipBook>
                )}
              </div>
            </div>
          </RenderContext.Provider>
        )}
      </Document>
    </div>
  );
});
export default FlipBook;
