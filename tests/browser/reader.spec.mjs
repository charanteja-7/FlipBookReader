import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { resolve } from 'node:path';
async function sample(page) {
  await page.goto('./');
  await page.getByRole('button', { name: 'Try the sample' }).click();
  await expect(
    page.getByRole('link', { name: 'Read A little room to read' }),
  ).toBeVisible({ timeout: 20000 });
}
async function read(page) {
  await sample(page);
  await page.getByRole('link', { name: 'Read A little room to read' }).click();
  await expect(page.locator('.react-pdf__Page__canvas').first()).toBeVisible({
    timeout: 20000,
  });
}
test('library, reading controls, bookmarks, favorites, refresh and deletion', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const external = [];
  page.on('request', (r) => {
    if (
      !r.url().startsWith('http://127.0.0.1:4173') &&
      /^https?:/.test(r.url())
    )
      external.push(r.url());
  });
  await read(page);
  await page
    .getByRole('button', { name: 'Reader settings', exact: true })
    .click();
  await page.getByLabel('Layout', { exact: true }).selectOption('text');
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(
    page.getByRole('spinbutton', { name: 'Page number' }),
  ).toHaveValue('2');
  await page.getByRole('button', { name: 'Bookmark this page' }).click();
  await expect(
    page.getByRole('button', { name: 'Remove page bookmark' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('Theme', { exact: true }).selectOption('dark');
  await page.getByRole('spinbutton', { name: 'Zoom percentage' }).fill('137');
  await page
    .getByRole('spinbutton', { name: 'Zoom percentage' })
    .press('Enter');
  expect(
    (
      await new AxeBuilder({ page })
        .exclude('.react-pdf__Page__textContent')
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.reload();
  await expect(
    page.getByRole('spinbutton', { name: 'Page number' }),
  ).toHaveValue('2');
  await page
    .getByRole('button', { name: 'Reader settings', exact: true })
    .click();
  await expect(page.getByLabel('Theme', { exact: true })).toHaveValue('dark');
  await expect(
    page.getByRole('spinbutton', { name: 'Zoom percentage' }),
  ).toHaveValue('137');
  await expect(
    page.getByRole('button', { name: 'Remove page bookmark' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Last page' }).click();
  await expect(
    page.getByRole('spinbutton', { name: 'Page number' }),
  ).toHaveValue('4');
  await expect(
    page.getByRole('button', { name: 'Next page', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'First page' }).click();
  await page.locator('h1').click();
  await page.keyboard.press('ArrowRight');
  await expect(
    page.getByRole('spinbutton', { name: 'Page number' }),
  ).toHaveValue('2');
  await page.getByRole('spinbutton', { name: 'Page number' }).fill('3');
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('spinbutton', { name: 'Page number' }),
  ).toHaveValue('3');
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await page
    .getByRole('button', {
      name: 'Favorite A little room to read',
      exact: true,
    })
    .click();
  await page.getByRole('button', { name: 'Favorites', exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'Read A little room to read' }),
  ).toBeVisible();
  page.once('dialog', (d) => d.accept());
  await page
    .getByRole('button', { name: 'Remove A little room to read', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Your next chapter starts here.' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
for (const width of [320, 390, 768, 1440])
  test('responsive and accessible at ' + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.getByRole('button', { name: 'Device & privacy' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await read(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .exclude('.react-pdf__Page__textContent')
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({ path: `test-results/reader-${width}.png` });
  });
test('invalid PDFs, upload, empty search and missing books', async ({
  page,
}) => {
  await page.goto('./');
  await page.locator('#book-upload').setInputFiles({
    name: 'bad.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('not a PDF'),
  });
  await page.getByRole('button', { name: 'Save to library' }).click();
  await expect(page.getByRole('status')).toContainText('could not be read');
  await page
    .locator('#book-upload')
    .setInputFiles(resolve('public/sample.pdf'));
  await page
    .getByLabel('Collection (optional)', { exact: true })
    .fill('Essays');
  await page.getByRole('button', { name: 'Save to library' }).click();
  await expect(page.getByRole('link', { name: 'Read sample' })).toBeVisible({
    timeout: 20000,
  });
  await page.getByRole('searchbox', { name: 'Search books' }).fill('absent');
  await expect(
    page.getByRole('heading', { name: 'No matching books' }),
  ).toBeVisible();
  await page.goto('./read/?id=missing');
  await expect(
    page.getByRole('heading', { name: 'Book unavailable' }),
  ).toBeVisible();
});
test('data export, validation, import and clear', async ({ page }) => {
  await read(page);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await page.getByRole('button', { name: 'Device & privacy' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export data' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  await page.locator('.settings-dialog input[type=file]').setInputFiles(path);
  await expect(page.getByRole('dialog').getByRole('status')).toContainText(
    'Updated 1 matching books',
  );
  await page.locator('.settings-dialog input[type=file]').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":2,"books":[]}'),
  });
  await expect(page.getByRole('dialog').getByRole('status')).toContainText(
    'valid FlipBookReader',
  );
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Clear local data' }).click();
  await expect(page.getByRole('dialog').getByRole('status')).toContainText(
    'cleared',
  );
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Your next chapter starts here.' }),
  ).toBeVisible();
});
test('reduced motion, swipe, offline reload and keyboard', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await read(page);
  await expect(page.locator('.single-page')).toHaveCSS(
    'animation-name',
    'none',
  );
  await page.locator('h1').click();
  await page.keyboard.press('End');
  await expect(
    page.getByRole('spinbutton', { name: 'Page number' }),
  ).toHaveValue('4');
  await page.keyboard.press('Home');
  await expect(
    page.getByRole('spinbutton', { name: 'Page number' }),
  ).toHaveValue('1');
  await page.locator('.reader-stage').evaluate((el) => {
    el.dispatchEvent(
      new TouchEvent('touchstart', {
        bubbles: true,
        touches: [
          new Touch({ identifier: 1, target: el, clientX: 280, clientY: 240 }),
        ],
      }),
    );
    el.dispatchEvent(
      new TouchEvent('touchend', {
        bubbles: true,
        changedTouches: [
          new Touch({ identifier: 1, target: el, clientX: 100, clientY: 242 }),
        ],
      }),
    );
  });
  await expect(
    page.getByRole('spinbutton', { name: 'Page number' }),
  ).toHaveValue('2');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole('spinbutton', { name: 'Page number' }),
  ).toHaveValue('2');
  await expect(page.locator('.react-pdf__Page__canvas').first()).toBeVisible({
    timeout: 15000,
  });
});

test('spread turns, bounded rendering on 120 pages, download, and keyboard focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await page
    .locator('#book-upload')
    .setInputFiles(resolve('tests/fixtures/long.pdf'));
  await page.getByRole('button', { name: 'Save to library' }).click();
  await page.getByRole('link', { name: 'Read long', exact: true }).click();
  await expect(page.locator('.react-pdf__Page__canvas').first()).toBeVisible();
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(
    page.getByRole('spinbutton', { name: 'Page number' }),
  ).toHaveValue('2');
  await page.waitForTimeout(500); // Allow the physical flip engine to finish before the next turn.
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(
    page.getByRole('spinbutton', { name: 'Page number' }),
  ).toHaveValue('4');
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Last page' }).click();
  await expect(
    page.getByRole('spinbutton', { name: 'Page number' }),
  ).toHaveValue('120');
  await page.waitForTimeout(500);
  expect(
    await page.locator('.react-pdf__Page__canvas').count(),
  ).toBeLessThanOrEqual(7);
  const downloadPromise = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Reader settings', exact: true })
    .click();
  await page.getByRole('button', { name: 'Download original PDF' }).click();
  await page.getByRole('button', { name: 'Close reader settings' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('long.pdf');
  await page.getByRole('button', { name: 'Toggle fullscreen' }).click();
  await expect
    .poll(() => page.evaluate(() => !!document.fullscreenElement))
    .toBe(true);
  await page.keyboard.press('Escape');
  await expect
    .poll(() => page.evaluate(() => !!document.fullscreenElement))
    .toBe(false);
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await page.getByRole('button', { name: 'Device & privacy' }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Device & privacy' }),
  ).toBeFocused();
  expect(errors).toEqual([]);
});
test('storage failure leaves a usable explanatory state', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', {
      get() {
        throw new DOMException('Denied', 'SecurityError');
      },
    });
  });
  await page.goto('./');
  await expect(page.locator('.empty-state[role=alert]')).toContainText(
    'storage is unavailable',
  );
  await page.getByRole('button', { name: 'Try the sample' }).click();
  await expect(page.getByRole('status')).toContainText(
    'Could not add the sample',
  );
});

test('continuous zoom, Ctrl-wheel, pan, and saved zoom', async ({ page }) => {
  await read(page);
  const zoom = page.getByRole('spinbutton', { name: 'Zoom percentage' });
  await zoom.fill('283');
  await zoom.press('Enter');
  await expect(zoom).toHaveValue('283');
  const stage = page.locator('.reader-stage');
  const before = await stage.evaluate((el) => ({
    width: el.scrollWidth,
    height: el.scrollHeight,
  }));
  expect(before.width).toBeGreaterThan(1400);
  await page.mouse.move(650, 390);
  await page.keyboard.down('Control');
  await page.mouse.wheel(0, -120);
  await page.keyboard.up('Control');
  await expect
    .poll(async () => Number(await zoom.inputValue()))
    .toBeGreaterThan(283);
  const percentage = await zoom.inputValue();
  const initial = await stage.evaluate((el) => el.scrollLeft);
  await page.mouse.move(650, 390);
  await page.mouse.down();
  await page.mouse.move(480, 270, { steps: 8 });
  await page.mouse.up();
  expect(await stage.evaluate((el) => el.scrollLeft)).toBeGreaterThan(initial);
  await page.reload();
  await expect(
    page.getByRole('spinbutton', { name: 'Zoom percentage' }),
  ).toHaveValue(percentage);
  await page.getByRole('button', { name: 'Fit page', exact: true }).click();
  await expect(
    page.getByRole('spinbutton', { name: 'Zoom percentage' }),
  ).toHaveValue('100');
});
test('two-finger pinch and one-finger pan on the physical mobile book', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await read(page);
  await expect(page.locator('.flip-book')).toBeVisible();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled', {
    enabled: true,
    maxTouchPoints: 2,
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { x: 115, y: 340, id: 0 },
      { x: 235, y: 340, id: 1 },
    ],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [
      { x: 50, y: 340, id: 0 },
      { x: 300, y: 340, id: 1 },
    ],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await expect
    .poll(async () =>
      Number(
        await page
          .getByRole('spinbutton', { name: 'Zoom percentage' })
          .inputValue(),
      ),
    )
    .toBeGreaterThan(180);
  const stage = page.locator('.reader-stage'),
    initial = await stage.evaluate((el) => el.scrollTop);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 240, y: 530, id: 0 }],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: 90, y: 330, id: 0 }],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  expect(await stage.evaluate((el) => el.scrollTop)).toBeGreaterThan(initial);
  await page.getByRole('button', { name: 'Fit page' }).click();
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(
    page.getByRole('spinbutton', { name: 'Page number' }),
  ).toHaveValue('2');
  await page.getByRole('button', { name: 'Toggle fullscreen' }).click();
  await expect(page.locator('.reader-chrome')).toHaveCSS(
    'visibility',
    'hidden',
  );
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 140, y: 12, id: 0 }],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await expect(page.locator('.reader-chrome')).toHaveCSS(
    'visibility',
    'visible',
  );
  await page.keyboard.press('Escape');
});
test('fullscreen opens book-only, uses the screen, and restores controls accessibly', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await read(page);
  await page.getByRole('button', { name: 'Toggle fullscreen' }).click();
  await expect(page.locator('.reader')).toHaveClass(/immersive/);
  await page.mouse.move(650, 400);
  await expect(page.locator('.reader-chrome')).toHaveCSS(
    'visibility',
    'hidden',
  );
  await expect(
    page.getByRole('button', { name: 'Reader settings', exact: true }),
  ).toBeHidden();
  const height = await page
    .locator('.book-position')
    .evaluate((el) => el.getBoundingClientRect().height);
  expect(height).toBeGreaterThan(870);
  await page.screenshot({ path: 'test-results/fullscreen-book-only.png' });
  await page.locator('.reader-stage').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#page-number')).toHaveValue('2');
  await page.keyboard.press('Tab');
  await expect(page.locator('.reader-chrome')).toHaveCSS(
    'visibility',
    'visible',
  );
  await page.keyboard.press('Escape');
  await expect
    .poll(() => page.evaluate(() => !!document.fullscreenElement))
    .toBe(false);
  await expect(
    page.getByRole('link', { name: 'Library', exact: true }),
  ).toBeVisible();
});
test('actual corner drag bends the page and progress is fresh on browser-back', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await read(page);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(
    page.getByRole('spinbutton', { name: 'Page number' }),
  ).toHaveValue('2');
  await expect(page.locator('.reader-stage')).toHaveAttribute(
    'aria-busy',
    'false',
  );
  const box = await page.locator('.flip-book').boundingBox();
  await page.mouse.move(box.x + box.width - 12, box.y + box.height - 12);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.65, {
    steps: 15,
  });
  await expect(page.locator('.reader-stage')).toHaveAttribute(
    'aria-busy',
    'true',
  );
  await page.screenshot({ path: 'test-results/page-curl.png' });
  await page.mouse.move(box.x + box.width * 0.15, box.y + box.height * 0.6, {
    steps: 10,
  });
  await page.mouse.up();
  await expect(
    page.getByRole('spinbutton', { name: 'Page number' }),
  ).toHaveValue('4');
  await page.goBack();
  await expect(page.locator('.book-progress span')).toHaveText('Page 4');
  await expect(
    page.getByRole('progressbar', { name: 'A little room to read: 100% read' }),
  ).toHaveAttribute('value', '100');
  await page.reload();
  await expect(page.locator('.book-progress span')).toHaveText('Page 4');
});
test('magic can be paused and landscape reader keeps controls clear', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Pause magic' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-magic', 'paused');
  await page.getByRole('button', { name: 'Resume magic' }).click();
  await page.setViewportSize({ width: 844, height: 390 });
  await read(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const nav = await page.locator('.page-navigation').boundingBox(),
    zoom = await page.locator('.zoom-dock').boundingBox();
  expect(nav.x + nav.width).toBeLessThan(zoom.x);
  expect(
    (
      await new AxeBuilder({ page })
        .exclude('.react-pdf__Page__textContent')
        .analyze()
    ).violations,
  ).toEqual([]);
});
