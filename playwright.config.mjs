import { defineConfig } from '@playwright/test';
const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:4173' + base + '/',
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? {
          launchOptions: {
            executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
          },
        }
      : {}),
  },
  webServer: {
    command: 'npm run preview',
    url: 'http://127.0.0.1:4173' + base + '/',
    reuseExistingServer: !process.env.CI,
  },
  reporter: 'list',
});
