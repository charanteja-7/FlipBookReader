'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getBook, updateBook, updateBookProgress } from '@/lib/storage';
import { defaults, loadPreferences, savePreferences } from '@/lib/preferences';
import ReaderControls, { PageNavigation } from './ReaderControls';
const FlipBook = dynamic(() => import('./FlipBook'), {
  ssr: false,
  loading: () => (
    <p className="reader-loading" role="status">
      Loading reader...
    </p>
  ),
});
export default function ReaderPage() {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [preferences, setPreferences] = useState(defaults);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [wide, setWide] = useState(false);
  const step = wide && preferences.layout !== 'single' ? 2 : 1;
  const root = useRef(null);
  const totalRef = useRef(0);
  const writeQueue = useRef(Promise.resolve());
  useEffect(() => {
    let cancelled = false;
    setPreferences(loadPreferences());
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const change = () => setReducedMotion(media.matches);
    media.addEventListener('change', change);
    const screen = matchMedia('(min-width: 752px)');
    setWide(screen.matches);
    const resize = () => setWide(screen.matches);
    screen.addEventListener('change', resize);
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
        setPage(Math.max(0, data.lastReadPage || 0));
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
      media.removeEventListener('change', change);
      screen.removeEventListener('change', resize);
    };
  }, []);
  function persist(callback) {
    // Serial writes preserve rapid page changes and avoid stale bookmark/progress updates.
    writeQueue.current = writeQueue.current
      .then(callback)
      .catch(() =>
        setMessage(
          'Reading data could not be saved. Check your available device storage.',
        ),
      );
  }
  const go = useCallback(
    (value) => {
      const last = totalRef.current - 1;
      if (last < 0) return;
      const next = Math.min(last, Math.max(0, value));
      setPage(next);
      if (book) persist(() => updateBookProgress(book.id, next));
    },
    [book],
  );
  const loaded = useCallback(
    (count) => {
      totalRef.current = count;
      setTotal(count);
      setPage((current) => Math.min(current, count - 1));
      if (book)
        persist(() =>
          updateBook(book.id, { numPages: count, lastReadDate: new Date() }),
        );
    },
    [book],
  );
  useEffect(() => {
    function keydown(event) {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        /INPUT|SELECT|TEXTAREA|BUTTON/.test(event.target.tagName) ||
        event.target.isContentEditable
      )
        return;
      if (
        event.target.closest('.reader-stage') &&
        preferences.zoom > 100 &&
        ['ArrowLeft', 'ArrowRight'].includes(event.key)
      )
        return;
      if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        go(
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? totalRef.current - 1
              : page +
                (event.key === 'ArrowRight' ? (page === 0 ? 1 : step) : -step),
        );
      }
    }
    document.addEventListener('keydown', keydown);
    return () => document.removeEventListener('keydown', keydown);
  }, [go, page, step, preferences.zoom]);
  function setPreference(key, value) {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    if (!savePreferences(next))
      setMessage('Display preferences could not be saved on this device.');
  }
  function toggleBookmark() {
    const marks = book.bookmarks || [];
    const bookmarks = marks.includes(page)
      ? marks.filter((n) => n !== page)
      : [...marks, page].sort((a, b) => a - b);
    setBook({ ...book, bookmarks });
    persist(() => updateBook(book.id, { bookmarks }));
  }
  function download() {
    const url = URL.createObjectURL(book.fileBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${book.title}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (root.current.requestFullscreen)
        await root.current.requestFullscreen();
      else setMessage('Fullscreen is unavailable in this browser.');
    } catch {
      setMessage('Fullscreen is unavailable in this browser.');
    }
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
  return (
    <main ref={root} className="reader" data-theme={preferences.theme}>
      <ReaderControls
        book={book}
        preferences={preferences}
        setPreference={setPreference}
        bookmark={(book.bookmarks || []).includes(page)}
        toggleBookmark={toggleBookmark}
        download={download}
        fullscreen={fullscreen}
      />
      {message && (
        <p role="status" className="reader-message">
          {message}
        </p>
      )}
      <FlipBook
        file={book.fileBlob}
        currentPage={page}
        onPageChange={go}
        onLoad={loaded}
        layout={preferences.layout}
        zoom={preferences.zoom}
        reducedMotion={reducedMotion}
      />
      <div className="reading-footer">
        <span aria-live="polite" aria-atomic="true">
          Page {page + 1} of {total || '...'}
          {total ? ` / ${Math.round(((page + 1) / total) * 100)}%` : ''}
        </span>
        <progress
          max={total || 1}
          value={page + 1}
          aria-label="Reading progress"
        />
        <details>
          <summary>Bookmarks ({(book.bookmarks || []).length})</summary>
          <div className="bookmark-list">
            {book.bookmarks?.length ? (
              book.bookmarks.map((n) => (
                <button key={n} onClick={() => go(n)}>
                  Page {n + 1}
                </button>
              ))
            ) : (
              <p>Bookmark a page using the bookmark button above.</p>
            )}
          </div>
        </details>
      </div>
      <PageNavigation page={page} total={total} go={go} step={step} />
      <p className="reader-tip">
        Single-page mode supports text selection. On small screens, swipe left
        or right to turn a page.
      </p>
    </main>
  );
}
