'use client';
import { useEffect, useRef, useState } from 'react';
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
  const [stage, setStage] = useState(-1);
  const [added, setAdded] = useState(false);
  const shelvedLink = useRef(null);
  useEffect(() => {
    if (added) shelvedLink.current?.focus({ preventScroll: true });
  }, [added]);
  const stages = [
    'Reading your PDF',
    'Preparing its cover',
    'Saving on this device',
    'Placed on your shelf',
  ];
  function choose(value) {
    setMessage('');
    setAdded(false);
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
    setStage(0);
    setMessage('');
    try {
      await addBook(file, genre, setStage);
      setFile(null);
      setAdded(true);
      setMessage(
        'Book added. A new place on your shelf, saved only on this device.',
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }
  return (
    <section
      className={
        'import-panel archive-import' +
        (dragging ? ' dragging' : '') +
        (file ? ' has-file' : '')
      }
      id="add-book"
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
        <h2 id="import-title" className="sr-only">
          Bring a book into the archive
        </h2>
      </div>
      <input
        ref={input}
        id="book-upload"
        aria-label="Choose PDF file"
        type="file"
        accept=".pdf,application/pdf"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          choose(e.target.files[0]);
          e.target.value = '';
        }}
      />
      <div className="import-action">
        <button
          className="primary"
          disabled={busy}
          onClick={() => input.current.click()}
        >
          <Plus size={18} aria-hidden="true" />{' '}
          {dragging ? 'Release to add your book' : 'Add a PDF'}
        </button>
        <span>
          or drop a book here
          <br />
          PDF · up to 100 MB
        </span>
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
          <p className="binding-promise">A new story for the shelves.</p>
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
            {busy
              ? stages[stage] || 'Checking and saving...'
              : 'Save to library'}
          </button>
          {busy && (
            <ol className="import-steps" aria-label="Import progress">
              {stages.map((label, index) => (
                <li
                  key={label}
                  className={index <= stage ? 'step-reached' : ''}
                  aria-current={index === stage ? 'step' : undefined}
                >
                  <span aria-hidden="true">
                    {index < stage ? '✓' : index + 1}
                  </span>
                  {label}
                </li>
              ))}
            </ol>
          )}
        </form>
      )}
      {message && (
        <p role="status" className="message">
          {message}
        </p>
      )}
      {added && (
        <a className="shelved-link" href="#shelves" ref={shelvedLink}>
          Find it on your shelf ↓
        </a>
      )}
    </section>
  );
}
