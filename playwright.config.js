// Tests: npm test
// They start scripts/serve.js on its own port, so they can run next to npm start. Set
// CHROMIUM_PATH to use a Chromium that is already installed instead of the one from:
// npx playwright install chromium

import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.TEST_PORT) || 4321;

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'off',
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /site|theme/ },
  ],
  webServer: {
    command: 'node scripts/serve.js',
    url: `http://localhost:${PORT}/`,
    env: { PORT: String(PORT) },
    reuseExistingServer: false,
  },
});
