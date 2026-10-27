'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Heart, Trash2, ArrowUpRight, Search, BookOpen } from 'lucide-react';
import { useLibrary } from '@/context/LibraryContext';
export default function Bookshelf() {
  const { books, loading, error, removeBook, toggleFavorite } = useLibrary();
  const [query, setQuery] = useState('');
  const [collection, setCollection] = useState('All');
  const [favorites, setFavorites] = useState(false);
  const [sort, setSort] = useState('recent');
  const [message, setMessage] = useState('');
  const collections = [
    ...new Set(books.map((b) => b.genre || 'Uncategorized')),
  ].sort();
  const filtered = books
    .filter(
      (b) =>
        b.title.toLowerCase().includes(query.toLowerCase()) &&
        (collection === 'All' || (b.genre || 'Uncategorized') === collection) &&
        (!favorites || b.isFavorite),
    )
    .sort((a, b) =>
      sort === 'title'
        ? a.title.localeCompare(b.title)
        : new Date(b.lastReadDate || b.dateAdded) -
          new Date(a.lastReadDate || a.dateAdded),
    );

  async function action(callback) {
    try {
      await callback();
      setMessage('');
    } catch {
      setMessage('Could not update device storage. Please try again.');
    }
  }
  return (
    <section aria-labelledby="shelf-title" className="shelf">
      <div className="section-heading">
        <h2 id="shelf-title">
          Your bookshelf <span>{books.length}</span>
        </h2>
        <p>Kept close. Pick up anywhere.</p>
      </div>
      <div className="filters">
        <label className="search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Search books</span>
          <input
            type="search"
            placeholder="Find a book..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          <span className="sr-only">Filter by collection</span>
          <select
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
          >
            <option value="All">All collections</option>
            {collections.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <button
          aria-pressed={favorites}
          onClick={() => setFavorites(!favorites)}
        >
          <Heart
            size={16}
            aria-hidden="true"
            fill={favorites ? 'currentColor' : 'none'}
          />{' '}
          Favorites
        </button>
        <label>
          <span className="sr-only">Sort books</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recent">Recently opened</option>
            <option value="title">Title A-Z</option>
          </select>
        </label>
      </div>
      {message && <p role="alert">{message}</p>}
      {error ? (
        <p role="alert" className="empty-state">
          {error}
        </p>
      ) : loading ? (
        <p role="status" className="empty-state">
          Opening your library...
        </p>
      ) : !filtered.length ? (
        <div className="empty-state">
          <BookOpen size={32} aria-hidden="true" />
          <h3>
            {books.length
              ? 'No matching books'
              : 'Your next chapter starts here.'}
          </h3>
          <p>
            {books.length
              ? 'Try another search or collection.'
              : 'Add your first PDF above, or explore the short sample below.'}
          </p>
        </div>
      ) : (
        <div className="bookshelf-grid">
          {filtered.map((book, i) => {
            const page = Math.min(
              (book.lastReadPage || 0) + 1,
              book.numPages || Infinity,
            );
            const percent =
              book.lastReadDate && book.numPages
                ? Math.round((page / book.numPages) * 100)
                : 0;
            return (
              <article className="book-item" key={book.id}>
                <Link
                  className="book-link"
                  href={`/read/?id=${encodeURIComponent(book.id)}`}
                  aria-label={`Read ${book.title}`}
                >
                  <div className="book-cover">
                    {book.coverImage ? (
                      <img
                        src={book.coverImage}
                        alt=""
                        loading={i < 4 ? 'eager' : 'lazy'}
                      />
                    ) : (
                      <span className="fallback-cover">{book.title}</span>
                    )}
                    <span className="open-book">
                      <ArrowUpRight size={20} />
                    </span>
                  </div>
                  <h3 title={book.title}>{book.title}</h3>
                </Link>
                <p className="book-meta">
                  {book.genre || 'Uncategorized'}
                  {book.numPages ? ` / ${book.numPages} pages` : ''}
                </p>
                <div className="book-progress">
                  <progress
                    max="100"
                    value={percent}
                    aria-label={`${book.title}: ${percent}% read`}
                  />
                  <span>
                    {book.lastReadDate ? `Page ${page}` : 'Not started'}
                  </span>
                </div>
                <div className="book-actions">
                  <button
                    aria-label={`${book.isFavorite ? 'Unfavorite' : 'Favorite'} ${book.title}`}
                    aria-pressed={!!book.isFavorite}
                    onClick={() => action(() => toggleFavorite(book.id))}
                  >
                    <Heart
                      size={17}
                      fill={book.isFavorite ? 'currentColor' : 'none'}
                    />
                  </button>
                  <button
                    aria-label={`Remove ${book.title}`}
                    onClick={() => {
                      if (
                        confirm(
                          `Remove "${book.title}" and its reading data from this device? Your original PDF is unaffected.`,
                        )
                      )
                        action(() => removeBook(book.id));
                    }}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
