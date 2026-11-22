import { expect, settle, test } from './helpers.js';

const WIDTHS = [320, 360, 375, 390, 414, 430, 600, 768, 1024, 1280, 1440];

// Lists everything that sticks out sideways past the edge of the screen.
async function sidewaysOverflow(page) {
  await settle(page);
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const problems = [];
    const describe = (element) =>
      `${element.tagName.toLowerCase()}.${[...element.classList].join('.')}`;

    if (document.documentElement.scrollWidth > width) {
      problems.push(`page is ${document.documentElement.scrollWidth}px wide, screen ${width}px`);
    }
    for (const element of document.querySelectorAll('body *')) {
      if (element.closest('.visually-hidden, .glow')) continue;
      const box = element.getBoundingClientRect();
      if (box.width === 0) continue;
      if (box.left < -0.5 || box.right > width + 0.5) {
        problems.push(`${describe(element)} spans ${box.left}..${box.right}`);
      }
    }
    return problems;
  });
}

for (const width of WIDTHS) {
  test.describe(`${width} wide`, () => {
    test.use({ viewport: { width, height: 800 } });

    test('nothing overflows sideways', async ({ page, allowConsole }) => {
      allowConsole(/status of 404/);
      await page.goto('/');
      expect(await sidewaysOverflow(page), 'home page').toEqual([]);
      await page.goto('/missing-page');
      expect(await sidewaysOverflow(page), 'not found page').toEqual([]);
    });
  });
}
