// Shared setup for the tests.

import { test as base, expect } from '@playwright/test';

export const SITE = 'https://rishinbussa.github.io';

// Every test fails if the page logs an error or a warning, throws, or breaks the
// Content-Security-Policy. A test that expects a message (the 404 status of the not found
// page, say) passes a pattern for it to allowConsole.
export const test = base.extend({
  allowConsole: [
    async ({ page }, use) => {
      const problems = [];
      const allowed = [];
      page.on('console', (message) => {
        if (['error', 'warning'].includes(message.type())) {
          problems.push(`${message.type()}: ${message.text()}`);
        }
      });
      page.on('pageerror', (error) => problems.push(`uncaught: ${error.message}`));
      await page.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (event) => {
          console.error(`CSP violation: ${event.violatedDirective} blocked ${event.blockedURI}`);
        });
      });

      await use((pattern) => allowed.push(pattern));

      const unexpected = problems.filter((text) => !allowed.some((pattern) => pattern.test(text)));
      expect(unexpected, 'console errors, warnings or CSP violations').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

// Waits until the entrance animations and transitions are done. The background drift loops
// forever, so it is left alone.
export async function settle(page) {
  await page.evaluate(async () => {
    const moving = () =>
      document
        .getAnimations()
        .filter(
          (animation) =>
            animation.playState !== 'finished' &&
            animation.effect?.getComputedTiming().endTime !== Infinity,
        );
    while (moving().length > 0) {
      await Promise.all(moving().map((animation) => animation.finished.catch(() => {})));
    }
  });
}

// Opens pages with a theme already picked, the way a returning visitor sees them.
export async function pickTheme(page, theme) {
  await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
}
