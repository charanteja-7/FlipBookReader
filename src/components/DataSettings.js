'use client';
import { useRef, useState } from 'react';
import { X, Download, RotateCcw } from 'lucide-react';
import { useLibrary } from '@/context/LibraryContext';
import {
  clearBooks,
  getAllAnnotations,
  importAnnotations,
  importReadingData,
} from '@/lib/storage';
import { validateAnnotations } from '@/lib/annotations';
import {
  loadPreferences,
  savePreferences,
  validateBackup,
  validatePreferences,
} from '@/lib/preferences';
export default function DataSettings() {
  const dialog = useRef(null);
  const file = useRef(null);
  const { books, refreshBooks } = useLibrary();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function exportData() {
    let annotations = [];
    try {
      annotations = await getAllAnnotations();
    } catch {
      /* Export positions even if highlights cannot be read. */
    }
    const data = {
      version: 1,
      preferences: loadPreferences(),
      books: books.map((b) => ({
        id: b.id,
        lastReadPage: b.lastReadPage || 0,
        bookmarks: b.bookmarks || [],
        isFavorite: !!b.isFavorite,
      })),
      annotations,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flipbook-reading-data.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(
      'Reading data exported. Download each PDF from the reader to back up the books themselves.',
    );
  }
  async function importData(event) {
    const selected = event.target.files[0];
    if (!selected) return;
    setBusy(true);
    try {
      if (selected.size > 2 * 1024 * 1024)
        throw new Error('Choose an export smaller than 2 MB.');
      const data = JSON.parse(await selected.text());
      const records = validateBackup(data);
      const annotations = validateAnnotations(
        data.annotations,
        new Set(books.map((b) => b.id)),
      );
      const count = await importReadingData(records);
      const notes = await importAnnotations(annotations);
      const saved = savePreferences(validatePreferences(data.preferences));
      await refreshBooks();
      setMessage(
        `Updated ${count} matching books${notes ? ` and ${notes} highlights or notes` : ''}. ${saved ? 'Preferences imported.' : 'Preferences could not be saved.'}`,
      );
    } catch (error) {
      setMessage(
        error instanceof SyntaxError
          ? 'This file is not valid JSON.'
          : error.message,
      );
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  }
  async function reset() {
    if (
      !confirm(
        'Permanently remove all books, bookmarks, highlights, notes, history, and preferences from this device? Export your reading data and download your PDFs first.',
      )
    )
      return;
    setBusy(true);
    try {
      await clearBooks();
      localStorage.removeItem('flipbook-preferences');
      await refreshBooks();
      setMessage('Local library and preferences cleared.');
    } catch {
      setMessage(
        'Could not clear all data. Check your browser storage permissions.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        onClick={() => {
          setMessage('');
          dialog.current.showModal();
        }}
      >
        Device & privacy
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="data-title"
        className="settings-dialog"
      >
        <div className="section-heading">
          <h2 id="data-title">Yours, on this device.</h2>
          <button
            aria-label="Close device settings"
            onClick={() => dialog.current.close()}
            autoFocus
          >
            <X size={20} />
          </button>
        </div>
        <p>
          Books and covers live in your browser storage (IndexedDB). Reading
          positions, bookmarks, favorites, and history stay with each book.
          Display preferences use localStorage.
        </p>
        <p>
          No accounts, analytics, or uploads. Clearing browser data or using
          private browsing can erase your library. Other browsers and devices
          have separate libraries.
        </p>
        <div className="settings-row">
          <div>
            <h3>Reading-data backup</h3>
            <p>
              Export settings, favorites, positions, bookmarks, highlights, and
              notes. PDFs are excluded. Imports update matching book IDs in this
              library; they do not restore deleted books.
            </p>
          </div>
          <div className="button-row">
            <button onClick={exportData} disabled={busy}>
              <Download size={16} /> Export data
            </button>
            <button disabled={busy} onClick={() => file.current.click()}>
              Import data
            </button>
            <input
              className="sr-only"
              tabIndex={-1}
              ref={file}
              type="file"
              accept=".json,application/json"
              aria-label="Choose reading-data export"
              onChange={importData}
            />
          </div>
        </div>
        <div className="settings-row">
          <div>
            <h3>Start fresh</h3>
            <p>
              Remove this application local library and preferences. Original
              files on your computer are unaffected.
            </p>
          </div>
          <button className="danger" disabled={busy} onClick={reset}>
            <RotateCcw size={16} /> Clear local data
          </button>
        </div>
        <p role="status">{message}</p>
      </dialog>
    </>
  );
}
