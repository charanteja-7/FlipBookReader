export const MIN_ZOOM = 10;
export const MAX_ZOOM = 800;
export function clampZoom(value) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.round(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, number)))
    : 100;
}
export function zoomFromWheel(current, delta) {
  return clampZoom(current * Math.exp(-delta * 0.002));
}
export function pinchZoom(initial, initialDistance, distance) {
  return clampZoom((initial * distance) / Math.max(1, initialDistance));
}
