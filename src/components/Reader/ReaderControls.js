'use client';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Bookmark,
  Maximize,
  Download,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
export default function ReaderControls({
  book,
  preferences,
  setPreference,
  bookmark,
  toggleBookmark,
  download,
  fullscreen,
}) {
  return (
    <>
      <header className="reader-header">
        <Link className="back-link" href="/" aria-label="Library">
          <ArrowLeft size={18} aria-hidden="true" />
          <span>Library</span>
        </Link>
        <h1 title={book.title}>{book.title}</h1>
        <div className="reader-header-actions">
          <button
            aria-label={
              bookmark ? 'Remove page bookmark' : 'Bookmark this page'
            }
            aria-pressed={bookmark}
            onClick={toggleBookmark}
          >
            <Bookmark size={19} fill={bookmark ? 'currentColor' : 'none'} />
          </button>
          <button aria-label="Download original PDF" onClick={download}>
            <Download size={19} />
          </button>
          <button aria-label="Toggle fullscreen" onClick={fullscreen}>
            <Maximize size={19} />
          </button>
        </div>
      </header>
      <div className="reader-options">
        <label>
          Theme
          <select
            aria-label="Theme"
            value={preferences.theme}
            onChange={(e) => setPreference('theme', e.target.value)}
          >
            <option value="light">Light</option>
            <option value="sepia">Paper</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label>
          Layout
          <select
            aria-label="Layout"
            value={preferences.layout}
            onChange={(e) => setPreference('layout', e.target.value)}
          >
            <option value="auto">Auto</option>
            <option value="single">Single page</option>
            <option value="spread">Spread</option>
          </select>
        </label>
        <label>
          Zoom
          <select
            aria-label="Zoom"
            value={preferences.zoom}
            onChange={(e) => setPreference('zoom', Number(e.target.value))}
          >
            <option value={75}>75%</option>
            <option value={100}>Fit page</option>
            <option value={125}>125%</option>
            <option value={150}>150%</option>
          </select>
        </label>
        <span className="shortcut-hint">
          Arrow keys: turn pages / Home: first / End: last
        </span>
      </div>
    </>
  );
}

export function PageNavigation({ total, page, go, step }) {
  return (
    <nav className="page-navigation" aria-label="Page navigation">
      <button
        aria-label="First page"
        disabled={!total || page === 0}
        onClick={() => go(0)}
      >
        <ChevronsLeft size={19} />
      </button>
      <button
        aria-label="Previous page"
        disabled={!total || page === 0}
        onClick={() => go(page - step)}
      >
        <ChevronLeft size={20} />
      </button>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const value = Number(new FormData(event.currentTarget).get('page'));
          if (Number.isInteger(value) && value >= 1 && value <= total)
            go(value - 1);
        }}
      >
        <label htmlFor="page-number">Page</label>
        <input
          key={page}
          id="page-number"
          name="page"
          aria-label="Page number"
          type="number"
          min="1"
          max={total || 1}
          defaultValue={page + 1}
          disabled={!total}
        />
        <span>of {total || '...'}</span>
      </form>
      <button
        aria-label="Next page"
        disabled={!total || page >= total - 1}
        onClick={() => go(page + (page === 0 ? 1 : step))}
      >
        <ChevronRight size={20} />
      </button>
      <button
        aria-label="Last page"
        disabled={!total || page >= total - 1}
        onClick={() => go(total - 1)}
      >
        <ChevronsRight size={19} />
      </button>
    </nav>
  );
}
