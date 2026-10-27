'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getBook, updateBook } from '@/lib/storage';
import { defaults, loadPreferences, savePreferences } from '@/lib/preferences';
import { clampZoom } from '@/lib/zoom';
import { useLibrary } from '@/context/LibraryContext';
import ReaderControls, { PageNavigation, ZoomControls } from './ReaderControls';
const FlipBook = dynamic(() => import('./FlipBook'), {
  ssr: false,
  loading: () => (
    <p className="reader-loading" role="status">
      Opening the reading room...
    </p>
  ),
});
export default function ReaderPage() {
  const [book, setBook] = useState(null),
    [loading, setLoading] = useState(true),
    [message, setMessage] = useState('');
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState(0),
    [total, setTotal] = useState(0),
    [preferences, setPreferences] = useState(defaults);
  const [reducedMotion, setReducedMotion] = useState(false),
    [wide, setWide] = useState(false),
    [turning, setTurning] = useState(false);
  const [isFullscreen, setFullscreen] = useState(false),
    [focused, setFocused] = useState(false),
    [revealed, setRevealed] = useState(false);
  const immersive = isFullscreen || focused;
  const root = useRef(null),
    reader = useRef(null),
    totalRef = useRef(0),
    pageRef = useRef(0),
    writeQueue = useRef(Promise.resolve()),
    hideTimer = useRef(null);
  const router = useRouter();
  const { updateReadingState } = useLibrary();
  const bookId = book?.id;
  const step = wide && !['single', 'text'].includes(preferences.layout) ? 2 : 1;
  useEffect(() => {
    let cancelled = false;
    setPreferences(loadPreferences());
    const motion = matchMedia('(prefers-reduced-motion: reduce)'),
      screen = matchMedia('(min-width: 744px)');
    setReducedMotion(motion.matches);
    setWide(screen.matches);
    const onMotion = () => setReducedMotion(motion.matches),
      onSize = () => setWide(screen.matches);
    motion.addEventListener('change', onMotion);
    screen.addEventListener('change', onSize);
    const id = new URLSearchParams(location.search).get('id');
    (async () => {
      try {
        const data = id ? await getBook(id) : null;
        if (cancelled) return;
        if (!data?.fileBlob) {
          setMessage(
            'This book is not on this device. Open a book from your library.',
          );
          return;
        }
        setBook(data);
        pageRef.current = Math.max(0, data.lastReadPage || 0);
        setPage(pageRef.current);
        setTotal(data.numPages || 0);
        totalRef.current = data.numPages || 0;
      } catch {
        if (!cancelled)
          setMessage(
            'Could not open device storage. Allow site storage and try again.',
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      motion.removeEventListener('change', onMotion);
      screen.removeEventListener('change', onSize);
      clearTimeout(hideTimer.current);
    };
  }, []);
  const persist = useCallback(
    (id, changes) => {
      updateReadingState(id, changes);
      writeQueue.current = writeQueue.current
        .then(() => updateBook(id, changes))
        .catch(() =>
          setMessage(
            'Reading data could not be saved. Check your available device storage.',
          ),
        );
    },
    [updateReadingState],
  );
  const commitPage = useCallback(
    (value) => {
      const n = Math.max(0, Math.min(totalRef.current - 1, value));
      if (n < 0) return;
      pageRef.current = n;
      setPage(n);
      if (bookId)
        persist(bookId, { lastReadPage: n, lastReadDate: new Date() });
    },
    [bookId, persist],
  );
  const loaded = useCallback(
    (count) => {
      totalRef.current = count;
      setTotal(count);
      const n = Math.min(pageRef.current, count - 1);
      pageRef.current = n;
      setPage(n);
      if (bookId)
        persist(bookId, {
          numPages: count,
          lastReadPage: n,
          lastReadDate: new Date(),
        });
    },
    [bookId, persist],
  );
  const go = useCallback((value) => reader.current?.turnTo(value), []);
  const setZoom = useCallback((value, fit = false) => {
    const zoom = clampZoom(value);
    if (fit) reader.current?.resetView();
    else reader.current?.prepareZoom();
    setPreferences((previous) => {
      const next = { ...previous, zoom };
      savePreferences(next);
      return next;
    });
  }, []);
  function setPreference(key, value) {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    if (!savePreferences(next))
      setMessage('Display preferences could not be saved on this device.');
  }
  const toggleBookmark = useCallback(() => {
    if (!book) return;
    const marks = book.bookmarks || [];
    const bookmarks = marks.includes(pageRef.current)
      ? marks.filter((n) => n !== pageRef.current)
      : [...marks, pageRef.current].sort((a, b) => a - b);
    setBook({ ...book, bookmarks });
    persist(book.id, { bookmarks });
  }, [book, persist]);
  function revealChrome() {
    setRevealed(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (
        !root.current
          ?.querySelector('.reader-chrome')
          ?.contains(document.activeElement)
      )
        setRevealed(false);
    }, 3500);
  }
  useEffect(() => {
    const change = () => {
      const active = document.fullscreenElement === root.current;
      setFullscreen(active);
      setFocused(false);
      setRevealed(false);
    };
    document.addEventListener('fullscreenchange', change);
    return () => document.removeEventListener('fullscreenchange', change);
  }, []);
  const fullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (root.current?.requestFullscreen)
        await root.current.requestFullscreen();
      else {
        setFocused(true);
        setRevealed(false);
      }
    } catch {
      setFocused(true);
      setRevealed(false);
    }
  }, []);
  useEffect(() => {
    function key(event) {
      if (event.key === 'Escape') {
        setFocused(false);
        setRevealed(false);
        if (document.fullscreenElement)
          document.exitFullscreen().catch(() => {});
        return;
      }
      if (event.key === 'Tab' && immersive && !revealed) {
        event.preventDefault();
        setRevealed(true);
        clearTimeout(hideTimer.current);
        requestAnimationFrame(() =>
          root.current?.querySelector('.back-link')?.focus(),
        );
        return;
      }
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        /INPUT|SELECT|TEXTAREA|BUTTON/.test(event.target.tagName) ||
        event.target.isContentEditable
      )
        return;
      if (event.key === ' ') {
        event.preventDefault();
        if (immersive) setRevealed((v) => !v);
        else {
          setFocused(true);
          setRevealed(false);
        }
        return;
      }
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        fullscreen();
        return;
      }
      if (event.key.toLowerCase() === 'b') {
        toggleBookmark();
        return;
      }
      if (['+', '='].includes(event.key)) {
        event.preventDefault();
        setZoom(preferences.zoom + 10);
        return;
      }
      if (event.key === '-') {
        event.preventDefault();
        setZoom(preferences.zoom - 10);
        return;
      }
      if (event.key === '0') {
        event.preventDefault();
        setZoom(100, true);
        return;
      }
      if (
        event.target.closest('.reader-stage') &&
        preferences.zoom > 100 &&
        ['ArrowLeft', 'ArrowRight'].includes(event.key)
      )
        return;
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        go(
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? totalRef.current - 1
              : pageRef.current +
                (event.key === 'ArrowRight'
                  ? pageRef.current === 0
                    ? 1
                    : step
                  : -step),
        );
      }
    }
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [
    fullscreen,
    go,
    immersive,
    revealed,
    preferences.zoom,
    setZoom,
    step,
    toggleBookmark,
  ]);
  async function leave() {
    await writeQueue.current;
    router.push('/');
  }
  function download() {
    const url = URL.createObjectURL(book.fileBlob),
      a = document.createElement('a');
    a.href = url;
    a.download = `${book.title}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (loading)
    return (
      <main className="reader-loading" role="status">
        Opening your library...
      </main>
    );
  if (!book)
    return (
      <main className="not-found">
        <h1>Book unavailable</h1>
        <p role="alert">{message}</p>
        <Link href="/">Return to library</Link>
      </main>
    );
  const chromeVisible = !immersive || revealed;
  return (
    <main
      ref={root}
      className={`reader ${immersive ? 'immersive' : ''}`}
      data-theme={preferences.theme}
      data-controls={chromeVisible ? 'visible' : 'hidden'}
      onTouchStartCapture={(event) => {
        const touch = event.touches[0];
        if (
          immersive &&
          !revealed &&
          event.touches.length === 1 &&
          (touch.clientY < 28 || touch.clientY > innerHeight - 28)
        ) {
          event.stopPropagation();
          revealChrome();
        }
      }}
      onPointerMove={(event) => {
        if (
          immersive &&
          event.pointerType === 'mouse' &&
          (event.clientY < 32 || event.clientY > innerHeight - 32)
        )
          revealChrome();
      }}
      onPointerDown={(event) => {
        if (
          immersive &&
          event.pointerType === 'touch' &&
          event.target === event.currentTarget
        )
          revealChrome();
      }}
    >
      <FlipBook
        ref={reader}
        file={book.fileBlob}
        currentPage={page}
        onPageChange={commitPage}
        onLoad={loaded}
        layout={preferences.layout}
        zoom={preferences.zoom}
        onZoom={setZoom}
        reducedMotion={reducedMotion}
        immersive={immersive}
        onTurning={setTurning}
        onReady={setReady}
      />
      <div
        className="reader-chrome"
        inert={!chromeVisible}
        aria-hidden={!chromeVisible}
      >
        <ReaderControls
          book={book}
          preferences={preferences}
          setPreference={setPreference}
          bookmark={(book.bookmarks || []).includes(page)}
          toggleBookmark={toggleBookmark}
          download={download}
          fullscreen={fullscreen}
          focus={() => {
            setFocused((v) => !v);
            setRevealed(false);
          }}
          onLeave={leave}
        />
        <ZoomControls zoom={preferences.zoom} setZoom={setZoom} />
        <div className="reading-footer reader-orbit">
          <span aria-hidden="true">
            {total ? Math.round(((page + 1) / total) * 100) : 0}%
          </span>
          <progress
            max={total || 1}
            value={page + 1}
            aria-label="Reading progress"
          />
        </div>
        <details className="bookmarks-dock reader-orbit">
          <summary>
            Bookmarks <span>{(book.bookmarks || []).length}</span>
          </summary>
          <div className="bookmark-list">
            {book.bookmarks?.length ? (
              book.bookmarks.map((n) => (
                <button key={n} onClick={() => go(n)}>
                  Page {n + 1}
                </button>
              ))
            ) : (
              <p>Press B or use the bookmark button to keep a page.</p>
            )}
          </div>
        </details>
        <PageNavigation
          total={total}
          page={page}
          go={go}
          step={step}
          turning={turning || !ready}
        />
      </div>
      {immersive && (
        <p className="sr-only" role="status">
          Book-only view. Tap the screen edge, or use Space or Tab, to reveal
          controls. Escape exits focus.
        </p>
      )}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        Page {page + 1} of {total || '...'}
      </span>
      {message && (
        <p className="reader-message" role="status">
          {message}
        </p>
      )}
    </main>
  );
}
