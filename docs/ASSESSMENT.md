# Initial repository assessment

Inspected revision: 1956c43 (main), 27 October 2026.

The repository is a small Next.js 16.1.4 App Router application, not a legacy standalone HTML project. It has React 19, React-PDF/PDF.js, react-pageflip, idb, UUID, and Lucide. package-lock.json establishes npm as the package manager. There were no tests, lint configuration, or deployment workflows.

Entry points were src/app/layout.js, src/app/page.js, and src/app/read/[id]/page.js. LibraryContext orchestrated books; storage.js persisted whole records, including PDF Blobs and cover strings, in IndexedDB. PDF cover extraction imported React-PDF dynamically. The flipbook rendered every PDF page as a full canvas. The public SVGs were unused create-next-app assets; there were no actual bundled books.

## Working foundations

Local PDF storage, first-page cover generation, library listing, favorites, optional genre collections, and the visual page-flip dependency were useful and retained. No backend was needed.

## Problems and risks

- Fixed 450 by 650 pages and forced spread mode could overflow mobile screens.
- Current page never updated in reader state; totalPages was hardcoded to 100.
- No page navigation controls or keyboard handling.
- Every page rendered eagerly, risking heavy canvas memory use.
- PDF workers came from unpkg, undermining offline and first-party-only operation.
- Cover extraction swallowed parse errors, so invalid PDFs could enter the library.
- Upload failures were swallowed; the form reported apparent success.
- Nontransactional read-modify-write storage updates could overwrite concurrent edits.
- No error state for failed library storage or an unavailable book.
- Icon-only controls lacked accessible names; hidden file selection was not keyboard discoverable.
- Themes were temporary and some surfaces ignored them.
- The parameter route could not export arbitrary browser-created book IDs statically.
- No reset/backup flow, no service worker, no public deployment configuration, and a boilerplate README.
- Original npm run build compiled but process spawning was blocked by the execution sandbox. The dev server needed an approved process-spawn escalation.
- The connected GitHub repository metadata reports private visibility. Free Pages launch therefore needs a reviewed visibility change or another host.

## Plan followed

Preserve Next.js, plain CSS, PDF.js, react-pageflip, the IndexedDB schema, favorites, collections, and existing assets. Fix reader and storage correctness first, add responsive controls and accessible single-page text rendering, implement validated local-data tools, self-host runtime resources, export static routes for GitHub Pages, then test the production subpath and document limits.

Optional enhancements selected for direct reader value: original sample PDF, bookmarks, recent/title sorting, title search, fullscreen, file download, reduced motion, and offline shell. OCR, document-wide search, server sync, account features, and a framework rewrite were deliberately outside scope.

## Visual direction

Design-taste-frontend app sheet: editorial-greeting, seed 1497645101, workspace/home/detail/settings. Quiet centered 1100px content, self-hosted Instrument Sans, neutral tonal surfaces, deep teal on real book content and progress, no marketing KPI tiles or stock imagery. The signature element is the user's own PDF cover plus real reading progress. Both library and reader answer one question: which book/page should I return to?

The original screenshots showed a large dashed upload area, generic empty state, warm/violet palette, and unloaded Inter fallback. The new layout gives importing and reading distinct, compact spaces with an explicit privacy action. A responsive closed-cover offset centers the physical cover until the book opens.
