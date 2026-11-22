# rishinbussa.github.io

Personal website of Rishin Bussa, served by GitHub Pages at https://rishinbussa.github.io. Plain HTML, CSS and a little JavaScript, with no build step: Pages serves the files on `main` as they are.

## Preview

```sh
npm install
npm start   # then open http://localhost:4173
```

## Tests

```sh
npx playwright install chromium   # once, or set CHROMIUM_PATH to a Chromium you already have
npm test                          # Playwright: content, links, theme toggle, axe, overflow
npm run format:check              # Prettier
```

GitHub Actions runs both on every push to `main`. `npm run images` renders `og.png` and `apple-touch-icon.png` again.
