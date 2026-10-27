// Highlights and notes are stored per page as rectangles in page fractions (0-1),
// so they stay attached to the same words at any zoom, layout or screen size.
export const COLORS = ['yellow', 'green', 'blue', 'pink'];
const round = (n) => Math.round(n * 10000) / 10000;
export function pageRects(clientRects, page) {
  const rects = [];
  for (const r of clientRects) {
    if (r.width < 1 || r.height < 1) continue;
    const x = Math.max(0, (r.left - page.left) / page.width);
    const y = Math.max(0, (r.top - page.top) / page.height);
    const right = Math.min(1, (r.left + r.width - page.left) / page.width);
    const bottom = Math.min(1, (r.top + r.height - page.top) / page.height);
    if (right > x && bottom > y)
      rects.push({ x, y, w: right - x, h: bottom - y });
  }
  return mergeRects(rects);
}
// Text layers report one rectangle per text run; join runs that share a line.
export function mergeRects(rects) {
  const sorted = [...rects].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines = [];
  for (const rect of sorted) {
    const line = lines.find(
      (l) =>
        Math.abs(l.y + l.h / 2 - (rect.y + rect.h / 2)) <
          Math.min(l.h, rect.h) / 2 &&
        rect.x <= l.x + l.w + 0.01 &&
        rect.x + rect.w >= l.x - 0.01,
    );
    if (!line) {
      lines.push({ ...rect });
      continue;
    }
    const right = Math.max(line.x + line.w, rect.x + rect.w);
    const bottom = Math.max(line.y + line.h, rect.y + rect.h);
    line.x = Math.min(line.x, rect.x);
    line.y = Math.min(line.y, rect.y);
    line.w = right - line.x;
    line.h = bottom - line.y;
  }
  return lines.map((r) => ({
    x: round(r.x),
    y: round(r.y),
    w: round(r.w),
    h: round(r.h),
  }));
}
const isFraction = (n) => typeof n === 'number' && n >= 0 && n <= 1;
export function validateAnnotations(list, bookIds) {
  if (list === undefined) return [];
  if (!Array.isArray(list) || list.length > 50000)
    throw new Error('This export contains invalid highlights or notes.');
  return list
    .filter((a) => bookIds.has(a?.bookId))
    .map((a) => {
      const valid =
        typeof a.id === 'string' &&
        Number.isInteger(a.page) &&
        a.page >= 0 &&
        ['highlight', 'note'].includes(a.kind) &&
        (a.kind === 'note' || COLORS.includes(a.color)) &&
        Array.isArray(a.rects) &&
        a.rects.length <= 200 &&
        a.rects.every((r) => [r?.x, r?.y, r?.w, r?.h].every(isFraction));
      if (!valid)
        throw new Error('This export contains invalid highlights or notes.');
      return {
        id: a.id,
        bookId: a.bookId,
        page: a.page,
        kind: a.kind,
        color: a.kind === 'note' ? null : a.color,
        rects: a.rects.map(({ x, y, w, h }) => ({ x, y, w, h })),
        text: String(a.text || '').slice(0, 5000),
        note: String(a.note || '').slice(0, 10000),
        createdAt: a.createdAt || new Date().toISOString(),
        updatedAt: a.updatedAt || a.createdAt || new Date().toISOString(),
      };
    });
}
export const byPosition = (a, b) =>
  a.page - b.page || (a.rects[0]?.y ?? 0) - (b.rects[0]?.y ?? 0);
export function notesMarkdown(title, annotations) {
  const lines = [`# ${title}`, '', 'Highlights and notes from Flip.', ''];
  let page = -1;
  for (const a of [...annotations].sort(byPosition)) {
    if (a.page !== page) {
      page = a.page;
      lines.push(`## Page ${page + 1}`, '');
    }
    if (a.text)
      lines.push(
        ...a.text
          .trim()
          .split('\n')
          .map((l) => `> ${l}`),
        '',
      );
    if (a.note) lines.push(a.kind === 'note' ? a.note : `Note: ${a.note}`, '');
  }
  return lines.join('\n');
}
