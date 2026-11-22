// Picks the theme before the page is drawn, so it never flashes the wrong one. The site is
// dark until someone picks light with the toggle. That choice is kept in this browser only
// (localStorage) and is never sent anywhere.
//
// The pages load this file before the stylesheet, so it runs before anything is drawn.

const THEME_COLORS = { dark: '#0e0d0b', light: '#ede6da' };

function savedTheme() {
  try {
    const theme = localStorage.getItem('theme');
    return theme === 'light' || theme === 'dark' ? theme : null;
  } catch {
    return null; // Storage can be blocked, for example in some private windows.
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  // The browser bar and the canvas behind the page follow the theme in use.
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme);
}

applyTheme(savedTheme() ?? 'dark');

document.addEventListener('click', (event) => {
  if (!event.target.closest('[data-theme-toggle]')) return;
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(next);
  try {
    localStorage.setItem('theme', next);
  } catch {
    // Not saved, but the theme still changes for this visit.
  }
});
