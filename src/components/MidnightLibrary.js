'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight, BookOpen, LockKeyhole } from 'lucide-react';
import BookUpload from './BookUpload';
import Bookshelf from './Bookshelf';
import DataSettings from './DataSettings';
import SampleBook from './SampleBook';
import BookBinding from './BookBinding';
import EnchantedAtmosphere from './EnchantedAtmosphere';
import { useLibrary } from '@/context/LibraryContext';
import { basePath } from '@/lib/pdf-utils';

function Arrival() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
      if (localStorage.getItem('flip-magic-paused') === 'yes') return;
      if (sessionStorage.getItem('flip-archive-entered')) return;
      sessionStorage.setItem('flip-archive-entered', 'yes');
    } catch {
      /* The opening is optional when storage is restricted. */
    }
    setVisible(true);
    const timeout = setTimeout(() => setVisible(false), 1700);
    return () => clearTimeout(timeout);
  }, []);
  return (
    visible && (
      <div className="archive-arrival">
        <div className="arrival-door door-left" aria-hidden="true" />
        <div className="arrival-door door-right" aria-hidden="true" />
        <p className="arrival-words" aria-hidden="true">
          Some doors open
          <br />
          <em>only for you.</em>
        </p>
        <button className="skip-arrival" onClick={() => setVisible(false)}>
          Skip introduction <ArrowUpRight size={15} />
        </button>
      </div>
    )
  );
}

function ReadingDesk() {
  const { books } = useLibrary();
  const book = books
    .filter((b) => b.lastReadDate)
    .sort((a, b) => new Date(b.lastReadDate) - new Date(a.lastReadDate))[0];
  if (!book)
    return (
      <div className="reading-desk" id="reading-desk">
        <SampleBook />
      </div>
    );
  const page = Math.min((book.lastReadPage || 0) + 1, book.numPages || 1);
  return (
    <section
      className="reading-desk"
      id="reading-desk"
      aria-labelledby="desk-title"
    >
      <span className="desk-caption">On your reading desk</span>
      <Link
        className="desk-volume"
        href={`/read/?id=${encodeURIComponent(book.id)}`}
      >
        <BookBinding book={book} />
        <span className="sr-only">Continue reading {book.title}</span>
      </Link>
      <div className="desk-copy">
        <span className="desk-note">Just where you left it.</span>
        <h2 id="desk-title">{book.title}</h2>
        <p>
          Page {page} of {book.numPages} ·{' '}
          {Math.round((page / book.numPages) * 100)}% read
        </p>
        <Link
          className="text-action"
          href={`/read/?id=${encodeURIComponent(book.id)}`}
        >
          Continue reading <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

export default function MidnightLibrary() {
  const root = useRef(null);
  const frame = useRef(null);
  const { books } = useLibrary();
  const [quiet, setQuiet] = useState(false);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  function followLight(event) {
    if (
      quiet ||
      event.pointerType !== 'mouse' ||
      matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const x = (event.clientX / window.innerWidth - 0.5) * 12;
    const y = (event.clientY / window.innerHeight - 0.5) * 8;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      root.current?.style.setProperty('--room-x', `${x}px`);
      root.current?.style.setProperty('--room-y', `${y}px`);
    });
  }
  return (
    <div
      className="enchanted-library midnight-archive"
      ref={root}
      onPointerMove={followLight}
      data-quiet={quiet}
    >
      <a className="skip-link" href="#main">
        Skip to library
      </a>
      <Arrival />
      <div className="archive-room" aria-hidden="true">
        <img
          className="room-architecture"
          src={`${basePath}/midnight-library.webp`}
          alt=""
          fetchPriority="high"
        />
        <div className="room-shade" />
        <div className="room-candle candle-near">
          <i />
          <span />
        </div>
        <div className="room-candle candle-far">
          <i />
          <span />
        </div>
        <div className="room-candle candle-high">
          <i />
          <span />
        </div>
      </div>
      <header className="site-header archive-header">
        <a className="wordmark" href="./">
          <BookOpen size={29} strokeWidth={1.4} aria-hidden="true" />
          <span>
            Flip<small>The Midnight Archive</small>
          </span>
        </a>
        <nav className="archive-nav" aria-label="Library">
          <a href="#shelves">The collection</a>
          <a href="#reading-desk">Reading desk</a>
        </nav>
        <div className="header-utilities">
          <EnchantedAtmosphere onPauseChange={setQuiet} />
          <DataSettings />
        </div>
      </header>
      <main id="main" className="library-main archive-main">
        <section className="archive-threshold" aria-labelledby="library-title">
          <div className="threshold-copy">
            <p className="archive-kicker">
              <span /> A private library. An open world.
            </p>
            <h1 id="library-title">
              A world
              <br />
              <em>between pages.</em>
            </h1>
            <p className="threshold-description">
              For the curious. The night owls. The one-more-page people.
              <br className="desktop-break" /> A little sanctuary for every PDF
              you keep.
            </p>
            <BookUpload />
            <p className="archive-privacy">
              <LockKeyhole size={13} aria-hidden="true" /> Yours alone. Books
              stay on this device.
            </p>
          </div>
          <ReadingDesk />
          <a className="explore-shelves" href="#shelves">
            <ArrowDown size={15} aria-hidden="true" /> Explore your shelves{' '}
            <span>{books.length.toString().padStart(2, '0')} volumes</span>
          </a>
          <span className="room-inscription" aria-hidden="true">
            There is always
            <br />
            <em>another chapter.</em>
          </span>
        </section>
        <Bookshelf />
        {books.some((book) => book.lastReadDate) && <SampleBook compact />}
      </main>
      <footer className="site-footer archive-footer">
        <span>Flip · The Midnight Archive</span>
        <p>A quiet place. An endless elsewhere.</p>
        <a
          href="https://github.com/charanteja-7/FlipBookReader"
          target="_blank"
          rel="noreferrer"
        >
          View source<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </footer>
    </div>
  );
}
