import { LibraryProvider } from "@/context/LibraryContext";
import "./globals.css";

export const metadata = {
  title: "BookReader",
  description: "A realistic PDF book reader.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LibraryProvider>
          {children}
        </LibraryProvider>
      </body>
    </html>
  );
}
