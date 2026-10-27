# Enchanted edition

This update applies the requested Harry Potter inspired wizarding-library atmosphere and addresses reader feedback. It uses original vector artwork and locally served open fonts; it bundles no franchise book content, film imagery, logos, or external runtime services.

## What changed

- Dark green ink, antique gold, parchment, Cormorant Garamond display type, an original castle-window/book/quill illustration, suspended candlelight, gold motes, ink-like entrances, and dimensional book-cover movement.
- A Pause magic control stops the ambient animations. System reduced-motion settings also disable them. Ambient effects are confined to the library; reading has no floating dust or candle animation.
- Header/footer rows are replaced by compact overlay docks: library/title upper left, actions upper right, progress lower left, navigation lower middle, zoom lower right, bookmarks in a small corner disclosure.
- Reader page size no longer has a 560px ceiling. Normal mode leaves only narrow control clearance; fullscreen fits the book within a few pixels of the viewport while preserving the PDF aspect ratio.
- Fullscreen and focus mode start with every visible control hidden. Screen-edge mouse movement or touch, Space, or Tab reveals controls. Escape exits; Tab restores keyboard access.
- Any whole zoom percentage from 10 to 800 is accepted and persisted. Pinch, Ctrl/Meta-wheel, numeric entry, plus/minus controls, keyboard +/-, and 0 to fit are supported. Mouse drag and touch pan work on enlarged physical pages. Single taps turn pages; double-click zoom is removed so it cannot compete with page-turn taps.
- Zoom changes the book transform without recreating the page-flip engine. Gesture focal points stay under the pointer/fingers; PDF raster detail is refreshed after a short idle interval and capped to avoid unbounded canvas allocation.
- Physical page curling runs in desktop spreads and mobile/single-page mode, with stronger paper shadows and an 850ms turn. Text & selection mode and reduced motion use a static selectable page.
- Stable page children keep the flip engine from replacing its collection during a drag/turn. A rendering context updates nearby PDF canvases without replacing those child elements.
- Progress is committed from actual engine page events, immediately reflected in the shared library state, and serialized into IndexedDB. The Library action waits for pending saves. Browser-back now also shows current progress without refreshing.
- Controls stay disabled until the PDF/flip engine is ready. Existing preferences, PDFs, favorites, and bookmarks remain compatible.

## Using the reader

- Drag a page corner, click a page edge, swipe, use the navigation dock, or press the arrow keys.
- Open Reader settings for surroundings, auto/single/spread/text layout, PDF download, and help.
- Enter a percentage in the zoom dock; pinch or use Ctrl + wheel over the book. Drag to pan when enlarged. Fit or 0 restores 100%.
- Tap the right page to turn forward and the left to turn back, including while zoomed. On a single page, the left portion goes back and the right portion goes forward. Mouse corner drags use the actual zoom scale; a pinch or pan never also counts as a page-turn tap.
- B bookmarks, F toggles fullscreen, Space hides/reveals controls, and Escape leaves focus/fullscreen. Tap/move at the top or bottom edge to request fullscreen controls.
- A portrait page cannot fill both the width and height of every screen without cropping or distortion. Fit preserves its shape; continuous zoom lets the reader choose the crop.

## Validation

Production build tested at the GitHub Pages /FlipBookReader subpath. Final result: build, scoped source lint, formatting, 8 unit tests, and all 15 browser tests passed. Visual inspection at 1440/768/390: 0 failures, 3 style warnings (serif heading size, bookbinding borders, and the sans bookshelf-count figure), retained deliberately for the requested theme.

- 8 Node tests: storage concurrency/import/reset, preference compatibility, arbitrary zoom, bounds, wheel scaling, and pinch scaling.
- 15 Chrome browser tests: import/errors, library filters, navigation, refresh persistence, bookmarks, data tools, reduced motion, offline reload, storage denial, and 120-page bounded rendering.
- New regressions exercise an actual mouse corner drag and capture the curved page; verify immediate progress after browser-back and refresh; exercise two-finger pinch through Chrome's input protocol; verify touch/mouse pan and non-preset zoom persistence; check fullscreen hidden controls, keyboard recovery, and book height; check landscape control separation and pause/resume.
- Accessibility checks cover the library/dialog/reader, dark surroundings, and narrow 320/390px screens, tablets, desktop, and landscape.
- Fullscreen book height measured above 870px in a 900px-high desktop viewport (about 98%). No visible chrome in the captured fullscreen screenshot.
- Lint, formatting, unit tests, production build, and visual inspection are run alongside the browser suite. Final results are reported with the review update.

Screenshots in docs/screenshots include the new library, reader, real page curl, and book-only fullscreen.

## Visual direction and review

Design skill app direction: true-black-flat, seed 386365164, with palette/type explicitly retained from the user's wizarding brief. User-requested antique gold, fantasy illustration, motion, dimensional book edges, and larger editorial headings take precedence over the skill's neutral dashboard defaults. No raster image generator was used; the window, castle, candles, quill, and book are original SVG paths in LibraryScene.js.

Visual review checks: the main action is visible; actual books remain the shelf content; title and import hierarchy are clear; mobile controls do not overlap; the book dominates reading; fullscreen has no permanent controls; reduced motion stays usable. Stronger binding/overlay borders and shadows are deliberate, rather than decorative KPI/card chrome. The bookshelf count uses the sans face so its figure remains clear beside the serif section heading.

The original modernization report remains an historical snapshot. This document supersedes its reader layout, zoom presets, theme, and current test-count descriptions. README describes the current controls.

## Current limits

Zoom is bounded at 10–800% to keep interaction and scroll surfaces manageable; raster detail is capped at 2.5 device pixels per PDF pixel. It is not a PDF editor or OCR engine. Scanned documents have no selectable text unless OCR already exists. Fullscreen support depends on the browser, with an in-app focus fallback. Real mobile hardware, Safari/Firefox, and human screen-reader validation remain follow-up work.
