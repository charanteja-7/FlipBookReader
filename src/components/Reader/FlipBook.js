'use client';
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  useImperativeHandle,
  useLayoutEffect,
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
  const mouse = useRef(null);
  const zoomAnchor = useRef(null);
  const resetRequested = useRef(false);
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
  const captureZoomAnchor = useCallback((x, y) => {
    const position = host.current?.querySelector('.book-position');
    const surface = host.current?.querySelector('.book-surface');
    if (!position || !surface) return;
    const before = position.getBoundingClientRect();
    const actualScale =
      surface.getBoundingClientRect().width / surface.offsetWidth;
    zoomAnchor.current = {
      x,
      y,
      contentX: (x - before.left) / actualScale,
      contentY: (y - before.top) / actualScale,
    };
  }, []);
  const requestZoom = useCallback(
    (next, x, y) => {
      if (next === zoomRef.current) return;
      captureZoomAnchor(x, y);
      zoomRef.current = next;
      callbacks.current.onZoom(next);
    },
    [captureZoomAnchor],
  );
  useLayoutEffect(() => {
    zoomRef.current = zoom;
    if (resetRequested.current && zoom === 100) {
      host.current?.scrollTo({ left: 0, top: 0 });
      resetRequested.current = false;
      zoomAnchor.current = null;
      return;
    }
    resetRequested.current = false;
    const anchor = zoomAnchor.current;
    const position = host.current?.querySelector('.book-position');
    if (anchor && position) {
      const after = position.getBoundingClientRect();
      host.current.scrollLeft +=
        after.left + anchor.contentX * scale - anchor.x;
      host.current.scrollTop += after.top + anchor.contentY * scale - anchor.y;
      zoomAnchor.current = null;
    }
  }, [zoom, scale]);
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
        resetRequested.current = true;
        zoomAnchor.current = null;
        host.current.scrollTo({ left: 0, top: 0 });
      },
      prepareZoom() {
        if (zoomAnchor.current) return;
        const rect = host.current.getBoundingClientRect();
        captureZoomAnchor(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
      },
    }),
    [pdf, plain, captureZoomAnchor],
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
  // PageFlip works in layout pixels. Browser pointer coordinates include our CSS
  // zoom, so both the offset and the distance must be converted before a fold.
  function bookPoint(x, y) {
    const block = engine.current?.getUI().getDistElement();
    if (!block?.isConnected) return null;
    const rect = block.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: ((x - rect.left) * block.offsetWidth) / rect.width,
      y: ((y - rect.top) * block.offsetHeight) / rect.height,
    };
  }
  function turnDirection(direction, corner = 'bottom') {
    const controller = engine.current;
    if (controller?.getState() === 'flipping') return;
    if (plain || !controller) {
      const next = Math.max(
        0,
        Math.min((pdf?.numPages || 1) - 1, currentPage + direction),
      );
      callbacks.current.onPageChange(next);
    } else if (direction > 0) controller.flipNext(corner);
    else controller.flipPrev(corner);
  }
  function tapPage(x, y) {
    if (window.getSelection()?.toString()) return;
    const rect = host.current
      .querySelector('.book-position')
      ?.getBoundingClientRect();
    if (!rect) return;
    const point = bookPoint(x, y);
    const block = engine.current?.getUI().getDistElement();
    const previous = single
      ? x < rect.left + rect.width * 0.4
      : point && point.x < block.offsetWidth / 2;
    turnDirection(
      previous ? -1 : 1,
      y < rect.top + rect.height / 2 ? 'top' : 'bottom',
    );
  }
  function pointerDown(event) {
    if (
      event.pointerType !== 'mouse' ||
      event.button !== 0 ||
      layout === 'text'
    )
      return;
    if (engine.current?.getState() === 'flipping') return;
    const sheet = event.target.closest('.pdf-sheet');
    const rect = sheet?.getBoundingClientRect();
    const corner =
      rect &&
      Math.min(
        Math.abs(event.clientX - rect.left),
        Math.abs(event.clientX - rect.right),
      ) < 32 &&
      Math.min(
        Math.abs(event.clientY - rect.top),
        Math.abs(event.clientY - rect.bottom),
      ) < 44;
    const start = bookPoint(event.clientX, event.clientY);
    const folding =
      !plain && !!sheet && !!start && (zoomRef.current <= 100 || corner);
    mouse.current = {
      x: event.clientX,
      y: event.clientY,
      left: host.current.scrollLeft,
      top: host.current.scrollTop,
      sheet: !!sheet,
      folding,
      moved: false,
      start,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    if (folding) engine.current?.startUserTouch(mouse.current.start);
    event.preventDefault();
  }
  function pointerMove(event) {
    if (event.pointerType !== 'mouse' || layout === 'text') return;
    const gesture = mouse.current;
    const point = bookPoint(event.clientX, event.clientY);
    if (!gesture) {
      if (point && zoomRef.current <= 100)
        engine.current?.userMove(point, false);
      return;
    }
    const distance = Math.hypot(
      event.clientX - gesture.x,
      event.clientY - gesture.y,
    );
    if (distance <= 6 && !gesture.moved) return;
    if (gesture.folding && point) {
      if (!gesture.moved)
        engine.current?.getFlipController().fold(gesture.start);
      engine.current?.userMove(point, false);
    } else if (zoomRef.current > 100) {
      host.current.scrollLeft = gesture.left + gesture.x - event.clientX;
      host.current.scrollTop = gesture.top + gesture.y - event.clientY;
    }
    gesture.moved = true;
  }
  function pointerUp(event) {
    const gesture = mouse.current;
    if (!gesture || event.pointerType !== 'mouse') return;
    mouse.current = null;
    if (gesture.folding)
      engine.current?.userStop(
        bookPoint(event.clientX, event.clientY) || gesture.start,
        !gesture.moved,
      );
    if (!gesture.moved && gesture.sheet) tapPage(event.clientX, event.clientY);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function touchStart(event) {
    if (layout === 'text') return;
    event.stopPropagation();
    const points = event.touches;
    if (!points.length) return;
    if (points.length >= 2) {
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
      sheet: !!event.target.closest('.pdf-sheet'),
      moved: false,
    };
  }
  function touchMove(event) {
    if (layout === 'text') return;
    event.stopPropagation();
    const gesture = touch.current;
    if (!gesture) return;
    if (event.touches.length >= 2) {
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
    } else if (!gesture.pinch) {
      const point = event.touches[0];
      if (!point) return;
      if (Math.hypot(point.clientX - gesture.x, point.clientY - gesture.y) > 8)
        gesture.moved = true;
      if (zoomRef.current > 100) {
        host.current.scrollLeft = gesture.left + gesture.x - point.clientX;
        host.current.scrollTop = gesture.top + gesture.y - point.clientY;
      }
    }
  }
  function touchEnd(event) {
    if (layout === 'text') return;
    event.stopPropagation();
    const gesture = touch.current;
    if (!gesture) return;
    if (gesture.pinch) {
      if (!event.touches.length) touch.current = null;
      return;
    }
    if (
      !event.touches.length &&
      event.changedTouches.length &&
      !window.getSelection()?.toString()
    ) {
      const point = event.changedTouches[0],
        dx = point.clientX - gesture.x,
        dy = point.clientY - gesture.y;
      if (
        gesture.zoom <= 100 &&
        Math.abs(dx) > 50 &&
        Math.abs(dx) > Math.abs(dy) * 1.4
      )
        turnDirection(dx < 0 ? 1 : -1);
      else if (!gesture.moved && Math.hypot(dx, dy) <= 8 && gesture.sheet)
        tapPage(point.clientX, point.clientY);
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
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={(event) => {
        const gesture = mouse.current;
        if (gesture?.folding)
          engine.current?.userStop(
            bookPoint(event.clientX, event.clientY) || gesture.start,
            !gesture.moved,
          );
        mouse.current = null;
      }}
      onPointerLeave={() => {
        if (!mouse.current && engine.current?.getState() === 'fold_corner')
          engine.current.userMove({ x: -100, y: -100 }, false);
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
                    useMouseEvents={false}
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
