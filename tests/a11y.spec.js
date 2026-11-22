import AxeBuilder from '@axe-core/playwright';
import { expect, pickTheme, settle, test } from './helpers.js';

async function expectNoViolations(page, state) {
  await settle(page);
  const { violations } = await new AxeBuilder({ page }).analyze();
  const found = violations.map(({ id, impact, nodes }) => ({
    id,
    impact,
    nodes: nodes.map((node) => node.target.join(' ')),
  }));
  expect(found, `axe violations on ${state}`).toEqual([]);
}

for (const theme of ['dark', 'light']) {
  for (const [width, height] of [
    [390, 844],
    [1440, 900],
  ]) {
    test.describe(`${theme} theme, ${width} wide`, () => {
      test.use({ viewport: { width, height } });

      test('the home page passes axe', async ({ page }) => {
        await pickTheme(page, theme);
        await page.goto('/');
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await expectNoViolations(page, 'the home page');

        await page.locator('.projects > li').nth(1).hover();
        await expectNoViolations(page, 'a hovered project');
      });

      test('the not found page passes axe', async ({ page, allowConsole }) => {
        allowConsole(/status of 404/);
        await pickTheme(page, theme);
        await page.goto('/missing-page');
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await expectNoViolations(page, 'the not found page');
      });
    });
  }
}
