'use client';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useLibrary } from '@/context/LibraryContext';
import { basePath } from '@/lib/pdf-utils';
export default function SampleBook() {
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
    <section className="sample-section" aria-labelledby="sample-title">
      <div>
        <h2 id="sample-title">A little room to read</h2>
        <p>
          A short, original field guide to slower reading. Try the reader with a
          four-page sample.
        </p>
        {message && <p role="status">{message}</p>}
      </div>
      <button onClick={addSample} disabled={busy}>
        {busy ? 'Adding sample...' : 'Try the sample'}
        <ArrowUpRight size={18} aria-hidden="true" />
      </button>
    </section>
  );
}
