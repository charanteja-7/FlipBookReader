# Flip v1.0.0 — Enchanted Edition

An enchanted PDF library with physical page turns and an immersive reading surface.

- Wizarding library artwork, floating candles, gold dust, animated book covers, and motion controls that respect reduced motion.
- Restored physical page curls on desktop and mobile.
- Compact corner controls and book-only fullscreen reading.
- Continuous 10–800% zoom, pinch and Ctrl/Meta-wheel zoom, and touch/drag panning.
- Reading progress updates immediately when returning to the library and persists across refreshes.
- Local PDF storage, bookmarks, favorites, collections, search, reading-data backup, and an offline shell.

Validation: 8 unit tests, 15 production Chrome browser tests, accessibility checks, lint, formatting, static export, and passing GitHub CI. Real-device Safari/Firefox and human screen-reader review remain unverified.

## Vercel deployment

Import this repository with its root directory unchanged. `vercel.json` builds with `npm ci` and `npm run build`, then publishes the static `out` directory. Leave `NEXT_PUBLIC_BASE_PATH` unset for the Vercel root domain. No runtime secrets or backend services are required. The service worker is served with revalidation enabled.

PDFs and reading metadata stay in the browser. A new deployment domain has its own browser storage; use the app's reading-data backup tools when moving metadata between origins.
