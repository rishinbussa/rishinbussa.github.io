import { expect, pickTheme, test } from './helpers.js';

const BACKGROUNDS = { dark: 'rgb(14, 13, 11)', light: 'rgb(237, 230, 218)' };
const THEME_COLORS = { dark: '#0e0d0b', light: '#ede6da' };

async function expectTheme(page, theme) {
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
    BACKGROUNDS[theme],
  );
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    'content',
    THEME_COLORS[theme],
  );
  await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', theme);
}

const TOGGLE_LABELS = { dark: 'Switch to light theme', light: 'Switch to dark theme' };

for (const colorScheme of ['dark', 'light']) {
  test(`follows the device on a first visit when it is set to ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/');
    await expectTheme(page, colorScheme);
    await expect(page.getByRole('button', { name: TOGGLE_LABELS[colorScheme] })).toBeVisible();
  });
}

test('the toggle switches the theme and remembers it', async ({ page, allowConsole }) => {
  allowConsole(/status of 404/);
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expectTheme(page, 'light');
  await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toBeVisible();

  await page.reload();
  await expectTheme(page, 'light');
  await page.goto('/missing-page');
  await expectTheme(page, 'light');

  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expectTheme(page, 'dark');
  await page.goto('/');
  await expectTheme(page, 'dark');
});

test('a saved theme is in place from the first frame', async ({ page }) => {
  await pickTheme(page, 'light');
  await page.addInitScript(() => {
    window.firstSeen = {};
    new MutationObserver((records, observer) => {
      if (!document.body) return;
      window.firstSeen.atBody = document.documentElement.dataset.theme;
      observer.disconnect();
    }).observe(document, { childList: true, subtree: true });
    requestAnimationFrame(() => {
      const root = getComputedStyle(document.documentElement);
      window.firstSeen.schemeAtFirstFrame = root.colorScheme;
      window.firstSeen.backgroundAtFirstFrame = root.getPropertyValue('--bg').trim();
    });
  });
  await page.goto('/');
  await page.waitForFunction(() => 'backgroundAtFirstFrame' in window.firstSeen);
  expect(await page.evaluate(() => window.firstSeen)).toEqual({
    atBody: 'light',
    schemeAtFirstFrame: 'light',
    backgroundAtFirstFrame: THEME_COLORS.light,
  });
});

test('still works when storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Storage is blocked', 'SecurityError');
      },
    });
  });
  await page.goto('/');
  await expectTheme(page, 'dark');
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expectTheme(page, 'light');
});

test('ignores a saved value that is not a theme', async ({ page }) => {
  await pickTheme(page, 'purple');
  await page.goto('/');
  await expectTheme(page, 'dark');
});
