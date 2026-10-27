'use client';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useLibrary } from '@/context/LibraryContext';
import { basePath } from '@/lib/pdf-utils';
import BookBinding from './BookBinding';
export default function SampleBook({ compact = false }) {
  const { addBook } = useLibrary();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function addSample() {
    setBusy(true);
    try {
      const response = await fetch(`${basePath}/sample.pdf`);
      if (!response.ok) throw new Error();
      await addBook(
        new File([await response.blob()], 'A little room to read.pdf', {
          type: 'application/pdf',
        }),
        'Getting started',
      );
      setMessage('Sample added to your bookshelf. Open it to start reading.');
    } catch {
      setMessage('Could not add the sample. Try again or add your own PDF.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className={`sample-section${compact ? ' compact-sample' : ''}`}
      aria-labelledby="sample-title"
    >
      {!compact && (
        <>
          <span className="desk-caption">A book is waiting for you</span>
          <div className="desk-volume sample-volume">
            <BookBinding
              book={{
                title: 'A little room to read',
                genre: 'Notes on the art of slowing down',
                numPages: 4,
              }}
            />
          </div>
        </>
      )}
      <div>
        <span className="desk-note">An invitation to slow down.</span>
        <h2 id="sample-title">A little room to read</h2>
        <p>Four quiet pages. An original field guide to slower reading.</p>
        {message && <p role="status">{message}</p>}
      </div>
      <button onClick={addSample} disabled={busy}>
        {busy ? 'Adding sample...' : 'Try the sample'}
        <ArrowUpRight size={18} aria-hidden="true" />
      </button>
    </section>
  );
}
