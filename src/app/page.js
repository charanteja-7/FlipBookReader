import { BookOpen } from 'lucide-react';
import BookUpload from '@/components/BookUpload';
import Bookshelf from '@/components/Bookshelf';
import DataSettings from '@/components/DataSettings';
import SampleBook from '@/components/SampleBook';
export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to library
      </a>
      <header className="site-header">
        <a className="wordmark" href="./">
          <BookOpen size={25} aria-hidden="true" />
          FlipBookReader
        </a>
        <DataSettings />
      </header>
      <main id="main" className="library-main">
        <div className="library-intro">
          <div>
            <h1>A place for your pages.</h1>
            <p>
              Your personal PDF library. Open a book, settle in, pick up where
              you left off.
            </p>
          </div>
          <span className="local-note">
            <span aria-hidden="true" className="local-dot" />
            Stored on this device
          </span>
        </div>
        <BookUpload />
        <Bookshelf />
        <SampleBook />
      </main>
      <footer className="site-footer">
        <span>FlipBookReader</span>
        <p>Less scrolling. More reading.</p>
        <a
          href="https://github.com/charanteja-7/FlipBookReader"
          target="_blank"
          rel="noreferrer"
        >
          View source <span className="sr-only">(opens in a new tab)</span>
        </a>
      </footer>
    </>
  );
}
