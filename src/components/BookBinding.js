// A title determines its binding, keeping a volume's identity stable across visits.
export function bindingNumber(title) {
  return Array.from(title).reduce(
    (hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0,
    7,
  );
}
export default function BookBinding({ book, preview = false }) {
  const number = bindingNumber(book.title);
  const longestWord = Math.max(
    ...book.title.split(/\s+/).map((word) => word.length),
  );
  const titleDensity =
    book.title.length > 55 || longestWord > 13
      ? 'compact'
      : book.title.length > 28
        ? 'dense'
        : 'regular';
  return (
    <span
      className={`bound-book binding-${number % 5} title-${titleDensity}${preview ? ' show-original' : ''}`}
      aria-hidden="true"
    >
      <span className="binding-pages" />
      <span className="binding-front">
        <span className="binding-frame" />
        <span className="binding-collection">
          {book.genre || 'Personal collection'}
        </span>
        <svg className="binding-emblem" viewBox="0 0 120 120" fill="none">
          {number % 3 === 0 ? (
            <>
              <circle cx="60" cy="60" r="38" />
              <ellipse
                cx="60"
                cy="60"
                rx="17"
                ry="45"
                transform="rotate(35 60 60)"
              />
              <path d="M15 60h90M60 15v90M31 31l58 58M31 89l58-58" />
              <circle cx="60" cy="60" r="8" />
            </>
          ) : number % 3 === 1 ? (
            <>
              <path d="M60 13 99 36v48l-39 23-39-23V36Z M60 28 85 43v34L60 92 35 77V43Z M60 13v94M21 36l78 48M21 84l78-48" />
              <circle cx="60" cy="60" r="17" />
            </>
          ) : (
            <>
              <path d="M75 18a42 42 0 1 0 0 84 38 38 0 0 1 0-84Z M88 33v22m-11-11h22M92 72v15m-7-8h14" />
              <circle cx="35" cy="61" r="5" />
              <path d="M25 21l3 4m-9 62 4-2M63 110v-5" />
            </>
          )}
        </svg>
        <span className="binding-title">{book.title}</span>
        <span className="binding-imprint">
          {book.numPages ? `${book.numPages} pages` : 'Flip · Midnight Archive'}
        </span>
        {book.coverImage && (
          <img
            className="binding-original"
            src={book.coverImage}
            alt=""
            loading="lazy"
          />
        )}
      </span>
      <span className="binding-ribbon" />
    </span>
  );
}
