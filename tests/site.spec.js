import { existsSync, readFileSync } from 'node:fs';
import { expect, settle, SITE, test } from './helpers.js';

const root = new URL('../', import.meta.url);
const read = (file) => readFileSync(new URL(file, root), 'utf8');

const PROFILES = {
  GitHub: 'https://github.com/rishinbussa',
  LinkedIn: 'https://www.linkedin.com/in/rishinbussa',
};

const PROJECTS = [
  {
    title: 'Knowfo',
    text: 'Labs, campus jobs and perks for college students, in one place.',
    tags: ['Product', 'Postgres', 'Vercel'],
    status: 'Launching soon',
  },
  {
    title: 'Backorder',
    text: 'Early warning for US drug shortages, built on public FDA data.',
    tags: ['Data engineering', 'DuckDB', 'Python'],
    href: 'https://github.com/rishinbussa/backorder',
  },
  {
    title: 'Clipscout',
    text: 'Finds the most clipped moments in Twitch VODs and renders vertical clips.',
    tags: ['Python', 'FFmpeg', 'CLI'],
    href: 'https://github.com/rishinbussa/clipscout',
  },
  {
    title: 'NLP coursework',
    text: 'BERT probing, cross-lingual retrieval and sentiment models, with measured results.',
    tags: ['NLP', 'PyTorch', 'Transformers'],
    href: 'https://github.com/rishinbussa/CS-6120',
  },
  {
    title: 'HVAC forecasting',
    text: 'ARIMA forecasts for HVAC sensor data and models for system efficiency.',
    tags: ['Time series', 'scikit-learn'],
    href: 'https://github.com/rishinbussa/HVAC-Temperature-prediction-model',
  },
];

// The width and height in a PNG file's header.
function pngSize(file) {
  const data = readFileSync(new URL(file, root));
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

test('the home page loads with the name, the intro and the footer', async ({ page }) => {
  const response = await page.goto('/');
  expect(response.status()).toBe(200);
  await expect(page).toHaveTitle('Rishin Bussa');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rishin Bussa');
  await expect(page.locator('.intro')).toHaveText(
    'Graduate student at Northeastern. I build data pipelines and ML systems.',
  );
  await expect(page.getByRole('contentinfo')).toHaveText('© 2026 Rishin Bussa');
});

test('lists the selected work in order', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('Selected work');
  const rows = page.locator('.projects > li');
  await expect(rows).toHaveCount(PROJECTS.length);

  for (const [index, project] of PROJECTS.entries()) {
    const row = rows.nth(index);
    const text = row.locator('.project__text');
    await expect(text).toHaveText(project.text);
    const words = (await text.textContent()).trim().split(/\s+/).length;
    expect(words, `words in the ${project.title} line`).toBeGreaterThanOrEqual(8);
    expect(words, `words in the ${project.title} line`).toBeLessThanOrEqual(14);
    await expect(row.locator('.tags li')).toHaveText(project.tags);

    if (project.href) {
      const link = row.getByRole('link', { name: `${project.title} on GitHub`, exact: true });
      await expect(link).toHaveAttribute('href', project.href);
    } else {
      await expect(row.locator('.project__title')).toHaveText(project.title);
      await expect(row.locator('.project__status')).toHaveText(project.status);
      await expect(row.getByRole('link')).toHaveCount(0);
    }
  }
});

test('a whole project row opens its link', async ({ page }) => {
  await page.goto('/');
  await settle(page);
  // Stay on this site: answer the request for GitHub here instead of going there.
  await page.route('https://github.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<title>GitHub</title>' }),
  );
  // A click in the middle of the row lands on the line, away from the title.
  await page.locator('.projects > li').nth(1).click();
  await expect(page).toHaveURL(PROJECTS[1].href);
});

test('links go only to the profiles and the projects', async ({ page }) => {
  await page.goto('/');
  for (const [name, href] of Object.entries(PROFILES)) {
    await expect(page.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
  }
  const hrefs = await page
    .locator('a')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  const expected = [
    ...Object.values(PROFILES),
    ...PROJECTS.filter((p) => p.href).map((p) => p.href),
  ];
  expect(hrefs.toSorted()).toEqual(expected.toSorted());
});

test('every file the pages point to is there', async ({ request }) => {
  const paths = new Set(['/og.png', '/robots.txt']);
  for (const file of ['index.html', '404.html']) {
    // Commented-out markup, like the resume link that waits for its file, does not count.
    const html = read(file).replace(/<!--[\s\S]*?-->/g, '');
    for (const [, path] of html.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)) paths.add(path);
  }
  for (const [, path] of read('styles.css').matchAll(/url\('(\/[^']+)'\)/g)) paths.add(path);

  expect(paths.size).toBeGreaterThan(8);
  for (const path of paths) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
});

test('loads nothing from other sites', async ({ page, baseURL }) => {
  const origins = new Set();
  page.on('request', (request) => origins.add(new URL(request.url()).origin));
  await page.goto('/');
  await settle(page);
  expect([...origins]).toEqual([new URL(baseURL).origin]);
});

test('has a description and share tags with a 1200 by 630 image', async ({ page }) => {
  await page.goto('/');
  const content = (selector) => page.locator(`meta[${selector}]`).getAttribute('content');
  expect(await content('name="description"')).toContain('Northeastern');
  expect(await content('property="og:title"')).toBe('Rishin Bussa');
  expect(await content('property="og:description"')).toContain('data pipelines');
  expect(await content('property="og:url"')).toBe(`${SITE}/`);
  expect(await content('property="og:image"')).toBe(`${SITE}/og.png`);
  expect(await content('property="og:image:width"')).toBe('1200');
  expect(await content('property="og:image:height"')).toBe('630');
  expect(await content('name="twitter:card"')).toBe('summary_large_image');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}/`);

  expect(pngSize('og.png')).toEqual({ width: 1200, height: 630 });
  expect(pngSize('apple-touch-icon.png')).toEqual({ width: 180, height: 180 });
});

for (const file of ['index.html', '404.html']) {
  test(`${file} has a policy that allows only the site itself`, () => {
    const html = read(file);
    const policy = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)?.[1];
    expect(policy).toContain("default-src 'self'");
    for (const directive of policy.split(';')) {
      const [, ...sources] = directive.trim().split(/\s+/);
      for (const source of sources) expect(["'self'", "'none'", "'script'"]).toContain(source);
    }
    // The tag only covers what comes after it, so it comes before any script or stylesheet.
    expect(html.indexOf('Content-Security-Policy')).toBeLessThan(html.indexOf('<link'));
    expect(html.indexOf('Content-Security-Policy')).toBeLessThan(html.indexOf('<script'));
  });
}

test('the policy blocks injected inline scripts', async ({ page, allowConsole }) => {
  allowConsole(/Content Security Policy|CSP violation|TrustedScript|Trusted Type/);
  await page.goto('/');
  await page.evaluate(() => {
    const script = document.createElement('script');
    try {
      script.textContent = 'window.injected = true';
    } catch {
      // Trusted Types refused the string, which also blocks it.
    }
    document.head.append(script);
  });
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
});

test('a missing page answers 404 with a styled page and a way home', async ({
  page,
  allowConsole,
}) => {
  allowConsole(/status of 404/);
  const response = await page.goto('/no/such/page');
  expect(response.status()).toBe(404);
  await expect(page).toHaveTitle('Page not found · Rishin Bussa');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Not found');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.getByRole('contentinfo')).toHaveText('© 2026 Rishin Bussa');
  // The stylesheet and fonts load from a nested path too.
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
    'rgb(14, 13, 11)',
  );
  expect(await page.evaluate(() => document.fonts.check('16px Geist'))).toBe(true);

  await page.getByRole('link', { name: 'Back to the home page' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rishin Bussa');
  expect(new URL(page.url()).pathname).toBe('/');
});

test('GitHub Pages gets robots.txt and .nojekyll', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toBe('User-agent: *\nAllow: /\n');
  expect(existsSync(new URL('.nojekyll', root))).toBe(true);
});

test('the page rises in, one row after another', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const delays = await page
    .locator('.projects > li')
    .evaluateAll((rows) => rows.map((row) => parseFloat(getComputedStyle(row).animationDelay)));
  expect(delays).toEqual(delays.toSorted((a, b) => a - b));
  expect(new Set(delays).size).toBe(delays.length);
  await settle(page);
  await expect(page.locator('.projects > li').last()).toHaveCSS('opacity', '1');
});

test('nothing moves for people who ask for reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await page.locator('.projects > li').nth(1).hover();
  await page.getByRole('button', { name: 'Switch to light theme' }).hover();
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});
