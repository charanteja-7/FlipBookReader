'use client';

import BookUpload from '@/components/BookUpload';
import Bookshelf from '@/components/Bookshelf';

export default function Home() {
  return (
    <main style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem',
      minHeight: '100vh'
    }}>
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Library</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Your digital collection</p>
        </div>
        {/* Placeholder for Theme Toggle or Search */}
      </header>

      <section style={{ marginBottom: '4rem' }}>
        <BookUpload />
      </section>

      <section>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Your Books</h2>
        <Bookshelf />
      </section>
    </main>
  );
}
