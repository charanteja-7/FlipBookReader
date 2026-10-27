# Reader gesture fixes

## Reported problems

Zoomed books could not be clicked because the enlarged flipbook had `pointer-events: none`. The flip engine subtracted the book's screen offset but did not convert CSS-scaled pointer distances back into layout pixels, so a right-page gesture could be interpreted on the wrong side of the spine. Touch behavior relied partly on compatibility mouse events, while custom touch handling recognized swipes but not taps. Double-click zoom also competed with repeated page taps.

## Changes

- The application owns input arbitration. Native PageFlip mouse/touch listeners are disabled, and mouse corner folds receive coordinates normalized against the rendered book's actual dimensions. The existing PageFlip animation/rendering engine remains intact.
- Left/right mouse and finger taps explicitly invoke animated previous/next turns. This works below, at, and above 100% zoom. Repeated taps during a running turn do not start a second turn.
- Enlarged-page drags pan; visible mouse corner drags still curl the page. Touch swipes turn at fit size. Pinches and pans remain distinct from taps, including when one finger leaves a pinch before the other.
- Zoom anchors are captured from the actual current DOM scale and restored in a layout effect before paint. This replaces queued nested animation-frame scroll adjustments that could drift during rapid wheel/pinch updates. Numeric zoom anchors at the viewport center; wheel/pinch use the pointer or finger midpoint.
- Fit/0 explicitly reset the view. Passing through 100% during a continuous gesture does not implicitly reset scrolling. Double-click zoom is removed in favor of unambiguous page taps and the existing pinch/wheel/numeric controls.
- The library entrance lasts 4.2 seconds, remains skippable, and still bypasses animation for reduced motion or saved quiet mode.

## Regression coverage

The browser suite verifies right-page taps near the spine at 65%, left-page taps at 140%, a real scaled corner drag, visible flip-in-progress state, native Chrome touch taps, staggered finger release after a pinch, numeric zoom centering, rapid Ctrl-wheel focal-point stability, panning, saved zoom, and the entrance remaining visible past two seconds while still allowing Skip. Existing reader, storage, fullscreen, accessibility, offline, and library checks remain enabled.

Physical mobile hardware and Safari/Firefox have not been verified; the touch regressions use Chrome's native input protocol.

Validation: all 21 production Chrome browser tests and 8 unit tests pass, along with lint, formatting, and a static production build. The full suite includes accessibility checks at 320, 390, 768, and 1440px.
