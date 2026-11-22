// A tiny static server for previewing the site and for the tests. Like GitHub Pages, it
// serves index.html for a folder, answers missing paths with 404.html and gzips text.
//
//   npm start             then open http://localhost:4173
//   PORT=8080 npm start   to use another port

import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT) || 4173;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

// Returns the file for a path, or null. Hidden files and node_modules are never served.
async function load(pathname) {
  let path;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (path.endsWith('/')) path += 'index.html';
  const file = normalize(join(ROOT, path));
  const parts = file.slice(ROOT.length).split(/[\\/]/);
  if (!file.startsWith(ROOT) || parts.some((part) => part.startsWith('.'))) return null;
  if (parts.includes('node_modules')) return null;
  try {
    return { file, body: await readFile(file) };
  } catch {
    return null; // Missing, or a folder without index.html.
  }
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  let status = 200;
  let found = await load(pathname);
  if (!found) {
    status = 404;
    found = await load('/404.html');
  }
  if (!found) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  let { body } = found;
  const type = TYPES[extname(found.file)] ?? 'application/octet-stream';
  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', 'max-age=600');
  if (/^(text\/|image\/svg)/.test(type)) {
    res.setHeader('Vary', 'Accept-Encoding');
    if (/\bgzip\b/.test(req.headers['accept-encoding'] ?? '')) {
      body = gzipSync(body);
      res.setHeader('Content-Encoding', 'gzip');
    }
  }
  res.setHeader('Content-Length', body.length);
  res.writeHead(status);
  res.end(body);
});

server.listen(PORT, () => console.log(`Serving the site at http://localhost:${PORT}`));
