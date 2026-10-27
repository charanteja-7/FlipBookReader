import { clampZoom } from './zoom.js';
export const defaults = { theme: 'wizard', layout: 'auto', zoom: 100 };
export function validatePreferences(value = {}) {
  return {
    theme: ['wizard', 'light', 'dark', 'sepia'].includes(value?.theme)
      ? value.theme
      : 'wizard',
    layout: ['auto', 'single', 'spread', 'text'].includes(value?.layout)
      ? value.layout
      : 'auto',
    zoom:
      typeof value?.zoom === 'number' && Number.isFinite(value.zoom)
        ? clampZoom(value.zoom)
        : 100,
  };
}
export function loadPreferences() {
  try {
    return validatePreferences(
      JSON.parse(localStorage.getItem('flipbook-preferences')),
    );
  } catch {
    return defaults;
  }
}
export function savePreferences(value) {
  try {
    localStorage.setItem(
      'flipbook-preferences',
      JSON.stringify(validatePreferences(value)),
    );
    return true;
  } catch {
    return false;
  }
}
export function validateBackup(data) {
  if (
    data?.version !== 1 ||
    !Array.isArray(data.books) ||
    data.books.length > 10000
  )
    throw new Error('Choose a valid FlipBookReader reading-data export.');
  return data.books.map((book) => {
    if (
      typeof book?.id !== 'string' ||
      !Number.isInteger(book.lastReadPage) ||
      book.lastReadPage < 0 ||
      !Array.isArray(book.bookmarks) ||
      book.bookmarks.some((n) => !Number.isInteger(n) || n < 0)
    )
      throw new Error(
        'This export contains invalid reading positions or bookmarks.',
      );
    return {
      id: book.id,
      lastReadPage: book.lastReadPage,
      bookmarks: [...new Set(book.bookmarks)],
      isFavorite: !!book.isFavorite,
    };
  });
}
