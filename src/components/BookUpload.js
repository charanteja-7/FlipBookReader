'use client';
import { useRef, useState } from 'react';
import { Plus, Upload, X } from 'lucide-react';
import { useLibrary } from '@/context/LibraryContext';
export default function BookUpload() {
  const { addBook } = useLibrary();
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [genre, setGenre] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [dragging, setDragging] = useState(false);
  function choose(value) {
    setMessage('');
    if (!value) return;
    if (
      !/\.pdf$/i.test(value.name) ||
      !value.size ||
      value.size > 100 * 1024 * 1024
    ) {
      setMessage('Choose a non-empty PDF smaller than 100 MB.');
      return;
    }
    setFile(value);
    setGenre('');
  }
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await addBook(file, genre);
      setFile(null);
      setMessage('Book added. It is saved only on this device.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }
  return (
    <section
      className={'import-panel' + (dragging ? ' dragging' : '')}
      aria-labelledby="import-title"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!busy) choose(e.dataTransfer.files[0]);
      }}
    >
      <div>
        <h2 id="import-title">Make room for a good read.</h2>
        <p>
          Add a PDF to your personal bookshelf.
          <br />
          Your books never leave this device.
        </p>
      </div>
      <input
        ref={input}
        id="book-upload"
        aria-label="Choose PDF file"
        type="file"
        accept=".pdf,application/pdf"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => choose(e.target.files[0])}
      />
      <div className="import-action">
        <button
          className="primary"
          disabled={busy}
          onClick={() => input.current.click()}
        >
          <Plus size={18} aria-hidden="true" /> Add a PDF
        </button>
        <span>or drop one here / PDF up to 100 MB</span>
      </div>
      {file && (
        <form className="import-form" onSubmit={submit}>
          <div className="file-name">
            <Upload size={18} aria-hidden="true" />
            <strong>{file.name}</strong>
            <button
              type="button"
              aria-label="Cancel adding PDF"
              disabled={busy}
              onClick={() => setFile(null)}
            >
              <X size={18} />
            </button>
          </div>
          <label htmlFor="genre">
            Collection <span>(optional)</span>
          </label>
          <input
            id="genre"
            maxLength={80}
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="e.g. Fiction or Design"
            disabled={busy}
            autoFocus
          />
          <button className="primary" disabled={busy}>
            {busy ? 'Checking and saving...' : 'Save to library'}
          </button>
        </form>
      )}
      {message && (
        <p role="status" className="message">
          {message}
        </p>
      )}
    </section>
  );
}
