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
  await page.getByLabel('Layout', { exact: true }).selectOption('single');
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(
    page.getByRole('spinbutton', { name: 'Page number' }),
  ).toHaveValue('2');
  await page.getByRole('button', { name: 'Bookmark this page' }).click();
  await expect(
    page.getByRole('button', { name: 'Remove page bookmark' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('Theme', { exact: true }).selectOption('dark');
  await page.getByLabel('Zoom', { exact: true }).selectOption('125');
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
  await expect(page.getByLabel('Theme', { exact: true })).toHaveValue('dark');
  await expect(page.getByLabel('Zoom', { exact: true })).toHaveValue('125');
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
  await page.getByRole('button', { name: 'Download original PDF' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('long.pdf');
  await page.getByRole('button', { name: 'Toggle fullscreen' }).click();
  await expect
    .poll(() => page.evaluate(() => !!document.fullscreenElement))
    .toBe(true);
  await page.keyboard.press('Escape');
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
