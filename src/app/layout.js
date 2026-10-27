import { LibraryProvider } from '@/context/LibraryContext';
import OfflineSupport from '@/components/OfflineSupport';
import '@fontsource/instrument-sans/latin-400.css';
import '@fontsource/instrument-sans/latin-500.css';
import '@fontsource/instrument-sans/latin-600.css';
import './globals.css';
export const metadata = {
  title: 'FlipBookReader | A place for your pages',
  description:
    'A private, local PDF library with a focused flipbook reader. No accounts, no uploads, just your books.',
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LibraryProvider>{children}</LibraryProvider>
        <OfflineSupport />
      </body>
    </html>
  );
}
