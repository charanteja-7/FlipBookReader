import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePreferences,
  validateBackup,
  loadPreferences,
  savePreferences,
  defaults,
} from '../src/lib/preferences.js';
test('invalid preferences use safe defaults', () => {
  assert.deepEqual(
    validatePreferences({ theme: '<script>', layout: 'bad', zoom: NaN }),
    defaults,
  );
  assert.deepEqual(validatePreferences(null), defaults);
});
test('unavailable or corrupted storage degrades gracefully', () => {
  assert.deepEqual(loadPreferences(), defaults);
  assert.equal(savePreferences(defaults), false);
});
test('backup rejects malformed input and deduplicates bookmarks', () => {
  assert.throws(() => validateBackup({ version: 2, books: [] }));
  assert.throws(() =>
    validateBackup({
      version: 1,
      books: [{ id: 'a', lastReadPage: -1, bookmarks: [] }],
    }),
  );
  assert.throws(() =>
    validateBackup({
      version: 1,
      books: [{ id: 'a', lastReadPage: 1, bookmarks: ['2'] }],
    }),
  );
  assert.deepEqual(
    validateBackup({
      version: 1,
      books: [
        { id: 'a', lastReadPage: 1, bookmarks: [2, 2], fileBlob: 'untrusted' },
      ],
    }),
    [{ id: 'a', lastReadPage: 1, bookmarks: [2], isFavorite: false }],
  );
});
