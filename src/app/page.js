import { BookOpen, Feather } from 'lucide-react';
import BookUpload from '@/components/BookUpload';
import Bookshelf from '@/components/Bookshelf';
import DataSettings from '@/components/DataSettings';
import SampleBook from '@/components/SampleBook';
import EnchantedAtmosphere from '@/components/EnchantedAtmosphere';
import LibraryScene from '@/components/LibraryScene';
export default function Home() {
  return (
    <div className="enchanted-library">
      <a className="skip-link" href="#main">
        Skip to library
      </a>
      <header className="site-header">
        <a className="wordmark" href="./">
          <BookOpen size={26} aria-hidden="true" />
          <span>
            FlipBookReader<small>The enchanted edition</small>
          </span>
        </a>
        <div className="header-utilities">
          <EnchantedAtmosphere />
          <DataSettings />
        </div>
      </header>
      <main id="main" className="library-main">
        <section className="library-intro" aria-labelledby="library-title">
          <div className="library-welcome">
            <Feather className="welcome-quill" size={27} aria-hidden="true" />
            <h1 id="library-title">The enchanted library.</h1>
            <p>
              Some books take you places.
              <br />
              These pages know the way.
            </p>
            <span className="local-note">
              <span className="local-dot" aria-hidden="true" />
              Your PDFs. Your device. Your little escape.
            </span>
          </div>
          <LibraryScene />
        </section>
        <BookUpload />
        <Bookshelf />
        <SampleBook />
      </main>
      <footer className="site-footer">
        <span>FlipBookReader</span>
        <p>One more page. A little more magic.</p>
        <a
          href="https://github.com/charanteja-7/FlipBookReader"
          target="_blank"
          rel="noreferrer"
        >
          View source<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </footer>
    </div>
  );
}
