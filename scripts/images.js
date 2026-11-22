// Renders og.png, the 1200x630 card that shows up when someone shares the link, and
// apple-touch-icon.png, the icon an iPhone shows on the home screen (from favicon.svg).
//
//   npm run images
//
// It needs Playwright's Chromium (npx playwright install chromium), or set CHROMIUM_PATH
// to a Chromium that is already installed.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = new URL('../', import.meta.url);
const path = (file) => fileURLToPath(new URL(file, root));

// The site's own font files, inlined so the card renders without a server.
function font(file) {
  const data = readFileSync(new URL(`fonts/${file}`, root)).toString('base64');
  return `url(data:font/woff2;base64,${data}) format('woff2')`;
}

const card = `<!doctype html>
<html>
  <head>
    <style>
      @font-face {
        font-family: 'Instrument Serif';
        src: ${font('instrument-serif-latin-400-normal.woff2')};
      }
      @font-face {
        font-family: Geist;
        font-weight: 100 900;
        src: ${font('geist-latin-wght-normal.woff2')};
      }
      body {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        width: 1200px;
        height: 630px;
        margin: 0;
        padding: 0 96px;
        box-sizing: border-box;
        overflow: hidden;
        background: #0e0d0b;
        color: #ede6da;
        font-family: Geist, sans-serif;
      }
      body::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
          radial-gradient(640px 420px at 22% 18%, rgb(217 205 184 / 0.19), transparent),
          radial-gradient(560px 460px at 96% 112%, rgb(138 129 112 / 0.2), transparent);
      }
      h1 {
        position: relative;
        margin: 0;
        font-family: 'Instrument Serif', serif;
        font-size: 176px;
        font-weight: 400;
        line-height: 0.95;
        letter-spacing: -0.025em;
      }
      p {
        position: relative;
        margin: 28px 0 0;
        color: #bdb4a1;
        font-size: 34px;
        line-height: 1.35;
      }
      footer {
        position: absolute;
        bottom: 52px;
        left: 96px;
        color: #8a8170;
        font-size: 22px;
        letter-spacing: 0.01em;
      }
    </style>
  </head>
  <body>
    <h1>Rishin Bussa</h1>
    <p>Graduate student at Northeastern.<br />I build data pipelines and ML systems.</p>
    <footer>rishinbussa.github.io</footer>
  </body>
</html>`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await og.setContent(card);
await og.evaluate(() => document.fonts.ready);
await og.screenshot({ path: path('og.png') });

// iPhones round the corners themselves, so the icon is drawn as a plain square.
const svg = readFileSync(new URL('favicon.svg', root), 'utf8');
const icon = await browser.newPage({ viewport: { width: 180, height: 180 } });
await icon.setContent(
  `<style>body { margin: 0 } svg { display: block; width: 180px } rect { rx: 0 }</style>${svg}`,
);
await icon.screenshot({ path: path('apple-touch-icon.png') });

await browser.close();
console.log('Saved og.png and apple-touch-icon.png');
