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
    marks,
    marking,
    onMark,
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
  // Turns requested while a page is still moving: a relative count, or an exact page.
  const queued = useRef({ steps: 0, target: null });
  const drain = useRef(null);
  const callbacks = useRef({
    onZoom,
    onPageChange,
    onTurning,
    onReady,
    onMark,
  });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [pdf, setPdf] = useState(null);
  const [ratio, setRatio] = useState(1.414);
  const [pixelRatio, setPixelRatio] = useState(1);
  const [turning, setTurning] = useState(false);
  const [heading, setHeading] = useState(null);
  const plain = layout === 'text' || reducedMotion || pdf?.numPages === 1;
  // Text is selectable here, so the book's own taps, drags and swipes stand aside.
  const manual = layout === 'text' || marking;
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
  const count = pdf?.numPages || 0;
  // A lone front or back cover sits centered; it slides as soon as a turn begins.
  const spreadAt = heading ?? currentPage;
  const pose = single
    ? 'open'
    : spreadAt === 0
      ? 'front'
      : count % 2 === 0 && spreadAt >= count - 1
        ? 'back'
        : 'open';
  // Page-edge thickness on either side of the spread shows how far along the reader is.
  const depth = Math.min(10, Math.max(2, Math.round(count / 14)));
  const read = count > 1 ? Math.round((depth * currentPage) / (count - 1)) : 0;
  useEffect(() => {
    callbacks.current = { onZoom, onPageChange, onTurning, onReady, onMark };
    zoomRef.current = zoom;
  }, [onZoom, onPageChange, onTurning, onReady, onMark, zoom]);
  useEffect(() => {
    // Measure without scrollbars: a curling page briefly overflows the stage, and a
    // scrollbar-sized resize would rebuild the book in the middle of the gesture.
    const element = host.current;
    const observer = new ResizeObserver(() => {
      const style = getComputedStyle(element);
      const width =
        element.offsetWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);
      const height =
        element.offsetHeight -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom);
      setSize((previous) =>
        previous.width === width && previous.height === height
          ? previous
          : { width, height },
      );
    });
    observer.observe(element);
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
    if (busy) {
      const controller = engine.current;
      const calc = controller?.getFlipController().getCalculation();
      if (calc) {
        const index = controller.getCurrentPageIndex();
        // FlipDirection.BACK is 1. A spread moves two pages per turn.
        setHeading(Math.max(0, index + (calc.getDirection() === 1 ? -2 : 2)));
      }
    } else if (event.data === 'read') {
      setHeading(null);
      // The engine finishes resetting after it announces "read", so queue after that.
      requestAnimationFrame(() => drain.current?.());
    }
  }, []);
  function busy() {
    const state = engine.current?.getState();
    return state === 'flipping' || state === 'user_fold';
  }
  function turnTo(target) {
    const next = Math.min(count - 1, Math.max(0, target));
    const controller = engine.current;
    if (plain || !controller) {
      callbacks.current.onPageChange(next);
      return;
    }
    if (busy()) {
      queued.current = { steps: 0, target: next };
      return;
    }
    // One animated leaf carries the reader to any page, near or far.
    controller.flip(next, 'bottom');
  }
  function turnDirection(direction, corner = 'bottom') {
    const controller = engine.current;
    if (plain || !controller) {
      const next = Math.max(0, Math.min(count - 1, currentPage + direction));
      callbacks.current.onPageChange(next);
      return;
    }
    // Quick taps, keys and clicks during a turn are kept instead of dropped.
    if (busy()) {
      const steps = Math.max(-4, Math.min(4, queued.current.steps + direction));
      queued.current = { steps, target: null };
      return;
    }
    if (direction > 0) controller.flipNext(corner);
    else controller.flipPrev(corner);
  }
  useEffect(() => {
    drain.current = () => {
      // A late frame can land after the next turn already began; it will drain then.
      if (busy()) return;
      const { steps, target } = queued.current;
      queued.current = { steps: 0, target: null };
      if (target !== null) turnTo(target);
      else if (steps) {
        turnDirection(Math.sign(steps));
        // At the first or last page nothing starts, and the rest of the queue is void.
        if (busy()) queued.current.steps = steps - Math.sign(steps);
      }
    };
  });
  useImperativeHandle(apiRef, () => ({
    turnTo,
    turn(direction) {
      turnDirection(direction);
    },
    resetView() {
      resetRequested.current = true;
      zoomAnchor.current = null;
      host.current.scrollTo({ left: 0, top: 0 });
    },
    prepareZoom() {
      if (zoomAnchor.current) return;
      const rect = host.current.getBoundingClientRect();
      captureZoomAnchor(rect.left + rect.width / 2, rect.top + rect.height / 2);
    },
  }));
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
  // Which way a tap at this point turns: -1 back, 1 forward.
  function sideAt(x, y) {
    const rect = host.current
      .querySelector('.book-position')
      ?.getBoundingClientRect();
    if (!rect) return 0;
    const point = bookPoint(x, y);
    const block = engine.current?.getUI().getDistElement();
    const previous = single
      ? x < rect.left + rect.width * 0.4
      : point && point.x < block.offsetWidth / 2;
    return previous ? -1 : 1;
  }
  // A highlight or note pin under the pointer, found by geometry because marks
  // never intercept the pointer themselves.
  function markAt(x, y) {
    for (const element of host.current.querySelectorAll('[data-mark]')) {
      const rect = element.getBoundingClientRect();
      if (
        rect.width &&
        x >= rect.left - 2 &&
        x <= rect.right + 2 &&
        y >= rect.top - 2 &&
        y <= rect.bottom + 2
      )
        return element.dataset.mark;
    }
    return null;
  }
  function tapPage(x, y) {
    if (window.getSelection()?.toString()) return;
    const mark = markAt(x, y);
    if (mark) {
      callbacks.current.onMark?.(mark, x, y);
      return;
    }
    const direction = sideAt(x, y);
    if (!direction) return;
    const rect = host.current
      .querySelector('.book-position')
      .getBoundingClientRect();
    turnDirection(direction, y < rect.top + rect.height / 2 ? 'top' : 'bottom');
  }
  // Show a soft arrow on the side a click would turn toward.
  function aim(event) {
    const element = host.current;
    const direction =
      zoomRef.current <= 100 && !manual && event.target.closest('.pdf-sheet')
        ? sideAt(event.clientX, event.clientY)
        : 0;
    const blocked =
      (direction < 0 && currentPage === 0) ||
      (direction > 0 && currentPage >= count - (single ? 1 : 2));
    if (!direction || blocked) delete element.dataset.aim;
    else element.dataset.aim = direction > 0 ? 'next' : 'prev';
  }
  // Start a finger- or mouse-following curl. Mid-page drags fold from the page edge
  // in the drag's direction, so a swipe always turns the way the reader means.
  function beginFold(gesture, x) {
    const controller = engine.current;
    const flipper = controller?.getFlipController();
    if (!flipper || !gesture.start) return false;
    const rect = controller.getRender().getRect();
    const anchor = gesture.corner
      ? gesture.start
      : {
          x: x < gesture.x ? rect.left + rect.pageWidth * 2 - 10 : 10,
          y: gesture.start.y,
        };
    if (!flipper.start(anchor)) return false;
    controller.startUserTouch(anchor);
    flipper.fold(anchor);
    return true;
  }
  // Release a curl: past the spine, or flicked far enough toward it, the page turns.
  function releaseFold(gesture, x) {
    const controller = engine.current;
    const flipper = controller?.getFlipController();
    controller?.userStop(gesture.start, true);
    const calc = flipper?.getCalculation();
    if (!calc) return;
    const rect = controller.getBoundsRect();
    const position = calc.getPosition();
    const travel = (x - gesture.x) * (calc.getDirection() === 1 ? 1 : -1);
    const turn = position.x <= 0 || travel > Math.min(90, rect.pageWidth * 0.2);
    flipper.animateFlippingTo(
      position,
      {
        x: turn ? -rect.pageWidth : rect.pageWidth,
        y: calc.getCorner() === 'bottom' ? rect.height : 0,
      },
      turn,
    );
  }
  function pointerDown(event) {
    if (event.pointerType !== 'mouse' || event.button !== 0 || manual) return;
    const sheet = event.target.closest('.pdf-sheet');
    const rect = sheet?.getBoundingClientRect();
    const corner =
      !!rect &&
      Math.min(
        Math.abs(event.clientX - rect.left),
        Math.abs(event.clientX - rect.right),
      ) < 32 &&
      Math.min(
        Math.abs(event.clientY - rect.top),
        Math.abs(event.clientY - rect.bottom),
      ) < 44;
    const start = bookPoint(event.clientX, event.clientY);
    mouse.current = {
      x: event.clientX,
      y: event.clientY,
      left: host.current.scrollLeft,
      top: host.current.scrollTop,
      sheet: !!sheet,
      // While a page is moving, a press can only be a tap that queues another turn.
      canFold:
        !plain &&
        !busy() &&
        !!sheet &&
        !!start &&
        (zoomRef.current <= 100 || corner),
      corner,
      folding: false,
      moved: false,
      start,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }
  function pointerMove(event) {
    if (event.pointerType !== 'mouse' || manual) {
      delete host.current.dataset.aim;
      return;
    }
    const gesture = mouse.current;
    const point = bookPoint(event.clientX, event.clientY);
    if (!gesture) {
      if (point && zoomRef.current <= 100)
        engine.current?.userMove(point, false);
      aim(event);
      return;
    }
    const distance = Math.hypot(
      event.clientX - gesture.x,
      event.clientY - gesture.y,
    );
    // A small wobble while clicking is still a click, not a fold.
    if (distance <= 12 && !gesture.moved) return;
    if (!gesture.moved && gesture.canFold)
      gesture.folding = beginFold(gesture, event.clientX);
    if (gesture.folding) {
      if (point) engine.current?.userMove(point, false);
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
    if (gesture.folding) releaseFold(gesture, event.clientX);
    else if (!gesture.moved && gesture.sheet)
      tapPage(event.clientX, event.clientY);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function touchStart(event) {
    if (manual) return;
    event.stopPropagation();
    const points = event.touches;
    if (!points.length) return;
    if (points.length >= 2) {
      // A second finger turns a curl in progress into a pinch.
      if (touch.current?.folding) releaseFold(touch.current, touch.current.x);
      const distance = Math.hypot(
        points[0].clientX - points[1].clientX,
        points[0].clientY - points[1].clientY,
      );
      touch.current = { pinch: true, distance, zoom: zoomRef.current };
      return;
    }
    const sheet = !!event.target.closest('.pdf-sheet');
    const start = bookPoint(points[0].clientX, points[0].clientY);
    touch.current = {
      x: points[0].clientX,
      y: points[0].clientY,
      left: host.current.scrollLeft,
      top: host.current.scrollTop,
      zoom: zoomRef.current,
      sheet,
      canFold: !plain && sheet && !!start && zoomRef.current <= 100 && !busy(),
      corner: false,
      folding: false,
      moved: false,
      start,
    };
  }
  function touchMove(event) {
    if (manual) return;
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
      const dx = point.clientX - gesture.x,
        dy = point.clientY - gesture.y;
      if (!gesture.moved && Math.hypot(dx, dy) > 8) {
        // The page follows a sideways finger, like lifting a real leaf.
        if (gesture.canFold && Math.abs(dx) > Math.abs(dy) * 1.2)
          gesture.folding = beginFold(gesture, point.clientX);
        gesture.moved = true;
      }
      if (gesture.folding) {
        const at = bookPoint(point.clientX, point.clientY);
        if (at) engine.current?.userMove(at, false);
      } else if (zoomRef.current > 100) {
        host.current.scrollLeft = gesture.left + gesture.x - point.clientX;
        host.current.scrollTop = gesture.top + gesture.y - point.clientY;
      }
    }
  }
  function touchEnd(event) {
    if (manual) return;
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
      if (gesture.folding) releaseFold(gesture, point.clientX);
      else if (
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
      className={`reader-stage ${zoom > 100 ? 'zoomed' : ''} ${plain ? 'text-mode' : ''} ${marking ? 'selecting' : ''}`}
      tabIndex={0}
      role="region"
      aria-label="PDF pages"
      aria-busy={turning}
      onTouchStartCapture={touchStart}
      onTouchMoveCapture={touchMove}
      onTouchEndCapture={touchEnd}
      onTouchCancelCapture={() => {
        if (touch.current?.folding) releaseFold(touch.current, touch.current.x);
        touch.current = null;
      }}
      onClick={(event) => {
        if (!manual || !window.getSelection()?.isCollapsed) return;
        const mark = markAt(event.clientX, event.clientY);
        if (mark)
          callbacks.current.onMark?.(mark, event.clientX, event.clientY);
      }}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={() => {
        const gesture = mouse.current;
        if (gesture?.folding) releaseFold(gesture, gesture.x);
        mouse.current = null;
      }}
      onPointerLeave={() => {
        delete host.current.dataset.aim;
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
          <RenderContext.Provider
            value={{
              page: currentPage,
              pixelRatio,
              marks,
              selecting: !!marking,
            }}
          >
            <div
              className={`book-position ${single ? 'portrait' : 'spread'} pose-${pose}`}
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
                  '--edge-left': `${read}px`,
                  '--edge-right': `${depth - read}px`,
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
                    maxShadowOpacity={0.6}
                    flippingTime={700}
                    mobileScrollSupport={false}
                    useMouseEvents={false}
                    showPageCorners
                    disableFlipByClick={false}
                    swipeDistance={40}
                    onFlip={syncPage}
                    onChangeState={stateChange}
                    onInit={initialized}
                    className={`flip-book ${pose === 'front' ? 'closed-book' : ''} ${pose === 'back' ? 'back-cover' : ''}`}
                  >
                    {pages}
                  </HTMLFlipBook>
                )}
              </div>
              <span className="turn-hint prev" aria-hidden="true" />
              <span className="turn-hint next" aria-hidden="true" />
            </div>
          </RenderContext.Provider>
        )}
      </Document>
    </div>
  );
});
export default FlipBook;
