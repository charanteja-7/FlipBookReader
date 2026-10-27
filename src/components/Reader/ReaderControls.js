'use client';
import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Bookmark,
  Maximize,
  Download,
  ArrowLeft,
  Settings2,
  X,
  Minus,
  Plus,
  EyeOff,
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
  focus,
  onLeave,
}) {
  const [settings, setSettings] = useState(false);
  return (
    <>
      <header className="reader-header">
        <Link
          className="back-link"
          href="/"
          aria-label="Library"
          onClick={(event) => {
            if (!event.metaKey && !event.ctrlKey) {
              event.preventDefault();
              onLeave();
            }
          }}
        >
          <ArrowLeft size={18} aria-hidden="true" />
          <span>Library</span>
        </Link>
        <h1 title={book.title}>{book.title}</h1>
      </header>
      <div className="reader-header-actions reader-orbit">
        <button
          title="Bookmark this page (B)"
          aria-label={bookmark ? 'Remove page bookmark' : 'Bookmark this page'}
          aria-pressed={bookmark}
          onClick={toggleBookmark}
        >
          <Bookmark size={17} fill={bookmark ? 'currentColor' : 'none'} />
        </button>
        <button
          title="Reader settings"
          aria-label="Reader settings"
          aria-expanded={settings}
          aria-controls="reader-settings"
          onClick={() => setSettings(!settings)}
        >
          <Settings2 size={17} />
        </button>
        <button
          title="Hide controls (Space)"
          aria-label="Focus reading"
          onClick={focus}
        >
          <EyeOff size={17} />
        </button>
        <button
          title="Fullscreen (F)"
          aria-label="Toggle fullscreen"
          onClick={fullscreen}
        >
          <Maximize size={17} />
        </button>
      </div>
      {settings && (
        <section
          id="reader-settings"
          className="reader-options"
          aria-label="Reader settings panel"
        >
          <div className="settings-panel-title">
            <h2>Reading rituals</h2>
            <button
              aria-label="Close reader settings"
              onClick={() => setSettings(false)}
            >
              <X size={16} />
            </button>
          </div>
          <label>
            Surroundings
            <select
              aria-label="Theme"
              value={preferences.theme}
              onChange={(e) => setPreference('theme', e.target.value)}
            >
              <option value="wizard">Enchanted</option>
              <option value="light">Light</option>
              <option value="sepia">Parchment</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label>
            Page style
            <select
              aria-label="Layout"
              value={preferences.layout}
              onChange={(e) => setPreference('layout', e.target.value)}
            >
              <option value="auto">Auto flipbook</option>
              <option value="single">Single-page flip</option>
              <option value="spread">Two-page flip</option>
              <option value="text">Text & selection</option>
            </select>
          </label>
          <button className="download-action" onClick={download}>
            <Download size={16} />
            Download original PDF
          </button>
          <p>
            Tap the right page to turn forward, or the left to go back. Drag or
            swipe a page to lift it by hand. Pinch or Ctrl + scroll to zoom;
            drag the page to pan when enlarged.
          </p>
          <p>
            ← → turn · B bookmark · F fullscreen · Space hide/show · Esc leave
            focus
          </p>
        </section>
      )}
    </>
  );
}
export function ZoomControls({ zoom, setZoom }) {
  const [entry, setEntry] = useState(null);
  return (
    <div className="zoom-dock reader-orbit" aria-label="Zoom controls">
      <button
        aria-label="Zoom out"
        onClick={() => setZoom(zoom - 10)}
        disabled={zoom <= 10}
      >
        <Minus size={15} />
      </button>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setZoom(Number(entry ?? zoom));
          setEntry(null);
        }}
      >
        <label className="sr-only" htmlFor="zoom-level">
          Zoom percentage
        </label>
        <input
          id="zoom-level"
          aria-label="Zoom percentage"
          type="number"
          min="10"
          max="800"
          step="1"
          value={entry ?? zoom}
          onChange={(e) => setEntry(e.target.value)}
          onBlur={() => {
            if (entry !== null) {
              setZoom(Number(entry));
              setEntry(null);
            }
          }}
        />
        <span aria-hidden="true">%</span>
      </form>
      <button
        aria-label="Zoom in"
        onClick={() => setZoom(zoom + 10)}
        disabled={zoom >= 800}
      >
        <Plus size={15} />
      </button>
      <button
        className="fit-button"
        onClick={() => setZoom(100, true)}
        aria-label="Fit page"
      >
        Fit
      </button>
    </div>
  );
}
// Buttons stay live while a page is moving; the reader queues quick repeat presses.
export function PageNavigation({ total, page, go, turn, ready }) {
  return (
    <nav className="page-navigation reader-orbit" aria-label="Page navigation">
      <button
        title="First page"
        aria-label="First page"
        disabled={!total || page === 0 || !ready}
        onClick={() => go(0)}
      >
        <ChevronsLeft size={15} />
      </button>
      <button
        title="Previous page"
        aria-label="Previous page"
        disabled={!total || page === 0 || !ready}
        onClick={() => turn(-1)}
      >
        <ChevronLeft size={19} />
      </button>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const n = Number(new FormData(event.currentTarget).get('page'));
          if (Number.isInteger(n) && n >= 1 && n <= total) go(n - 1);
        }}
      >
        <input
          key={page}
          id="page-number"
          name="page"
          aria-label="Page number"
          type="number"
          min="1"
          max={total || 1}
          defaultValue={page + 1}
          disabled={!total || !ready}
        />
        <span>/ {total || '...'}</span>
      </form>
      <button
        title="Next page"
        aria-label="Next page"
        disabled={!total || page >= total - 1 || !ready}
        onClick={() => turn(1)}
      >
        <ChevronRight size={19} />
      </button>
      <button
        title="Last page"
        aria-label="Last page"
        disabled={!total || page >= total - 1 || !ready}
        onClick={() => go(total - 1)}
      >
        <ChevronsRight size={15} />
      </button>
    </nav>
  );
}
