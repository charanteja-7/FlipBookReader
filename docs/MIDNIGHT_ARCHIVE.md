# The Midnight Archive

## What felt ordinary

1. A conventional header, two-column hero, upload card, and thumbnail grid defined the whole journey.
2. Fantasy artwork sat beside the product rather than providing its spatial structure.
3. Importing felt like submitting a form; the actual work had little visible feedback.
4. Flat PDF thumbnails gave books little tactile identity.
5. Resuming a book had the same visual weight as every other action.

## The concept

The personal PDF collection becomes a private room discovered after midnight. The architecture surrounds the interface; one unfinished book waits at the reading desk; each volume receives a stable binding. Opening a volume moves into the existing full-viewport reader, where the atmosphere recedes and the pages take priority.

This is a working library, without invented books or activity. Counts, page positions, collections, and progress come from the original local data. The empty reading desk offers the existing original four-page sample. The sample remains available after a book has been opened.

## Implementation

- `MidnightLibrary.js`: architectural room, functional collection/desk navigation, restrained pointer parallax, a 1.7-second skippable first-session door reveal, and a reading desk driven by the most recent saved reading date. Reduced motion bypasses the reveal. Restricted session storage does not block the app.
- `BookBinding.js`: deterministic title-derived binding, five muted cloth/leather colours, three original geometric foil motifs, paper edges, bookmark ribbon, and cover lift. Original PDF previews remain available using **Show PDF covers**. Every link retains the actual complete document title.
- `BookUpload.js`, `LibraryContext.js`, and `pdf-utils.js`: honest progress through local PDF parsing, first-page rendering, IndexedDB saving, and placement. A successful import highlights its volume and focuses a link to the shelves. Re-selecting the same file works after cancellation. File validation and errors remain intact.
- `EnchantedAtmosphere.js`: the pause preference survives refresh and controls room motion as well as particles. Reduced motion disables ambient, entrance, and interactive transformations.
- `midnight.css`: warm near-black room, cream typography, original cinematic lighting, real shelf ledges, responsive bindings, clear focus states, and a quiet reading chamber. No additional animation or rendering dependency.
- Existing reader logic, PDF workers, zoom/pinch/pan, fullscreen, navigation, search, collections, bookmarks, favorites, backups, offline support, and IndexedDB schema are preserved.

## Artwork

The built-in image generation tool created the original room plate, saved in the project as `public/midnight-library.webp` (151,588 bytes, 1672 × 941). It is served locally and cached with the offline shell. The original generated PNG remains outside the project; WebP encoding changes only its delivery format.

Prompt: An original cinematic midnight library interior, towering dark walnut bookshelves, deep perspective, a distant Gothic window with pale moonlight, warm wax candles, dark wood foreground, tactile cinematic realism, espresso and brass against ink-blue shadows. Leave the middle-left dark for interface text. No people, text, logos, interface, watermarks, saturated fantasy effects, or cartoon illustration.

The room is a backdrop. All visible books, titles, progress, buttons, searches, and imported documents are live interface elements.

## Art-direction review

The design-taste app draw selected **True-black flat**, seed `1018571858`: one continuous dark plane, receding tools, and book content providing the colour. The user's explicit cinematic brief overrides the skill's standard dashboard restrictions on a large title, object shadows, and layered architectural lighting. Light/shadow gradients model candles, leather, and the photographic scrim; they are not decorative dashboard panels. Display serif and restrained sans-serif serve distinct jobs. Tiny foil printing belongs only to the decorative, aria-hidden book artwork; interface metadata is at least 11px.

The inspector was run at 1440, 768, and 390px. It confirmed local font loading, no broken imagery, and no horizontal overflow. Its dashboard-style warnings for large display type, cream, architectural gradients, and book shadows are intentional exceptions to meet this brief. The primary button shadow and undersized interface text were corrected after review. No claim is made that the generic dashboard rubric approves a cinematic library.

## Validation

- 8 unit tests: preference validation, local storage, serialized progress changes, backup behavior, and zoom math.
- 18 production Chrome browser tests: all existing journeys plus skippable/session-scoped introduction; stable bindings and original covers; resumed desk and persisted quiet preference; seven-volume shelves and long titles at phone, tablet, and desktop widths.
- Axe checks at 320, 390, 768, and 1440px, including populated shelves and reader states. Corrected visible-name mismatches rather than disabling the rule.
- Actual page-corner drag, two-finger pinch, free zoom, panning, bookmarks, immediate browser-back progress, full-screen hidden controls, 120-page bounded rendering, data backup/import/reset, offline reload, invalid PDFs, and unavailable storage remain covered.
- Production static export, lint, and formatting checked before publication.

Screenshot fixtures use seven differently named copies of the application's original four-page sample PDF to check shelf density and long titles. They are test documents, not a real user's books or fabricated usage claims.

Not verified: physical iOS/Android devices, Safari/Firefox, and human screen-reader review. PDF content stays local to the current browser origin.
