import test from 'node:test';
import assert from 'node:assert/strict';
import { clampZoom, zoomFromWheel, pinchZoom } from '../src/lib/zoom.js';
import { validatePreferences } from '../src/lib/preferences.js';
test('arbitrary zoom survives validation and invalid values stay bounded', () => {
  assert.equal(validatePreferences({ zoom: 137 }).zoom, 137);
  assert.equal(validatePreferences({ zoom: 283 }).zoom, 283);
  assert.equal(clampZoom(Infinity), 100);
  assert.equal(clampZoom(-10), 10);
  assert.equal(clampZoom(99999), 800);
});
test('wheel and pinch scale multiplicatively', () => {
  assert.equal(pinchZoom(100, 100, 200), 200);
  assert.equal(pinchZoom(200, 200, 100), 100);
  assert.ok(zoomFromWheel(137, -100) > 137);
  assert.ok(zoomFromWheel(137, 100) < 137);
});
