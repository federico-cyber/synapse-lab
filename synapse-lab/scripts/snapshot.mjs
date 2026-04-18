// Puppeteer snapshot: renders built dist/ in Chrome headless, waits for React to mount,
// captures the DOM, writes back to dist/index.html (IT) + dist/en/index.html (EN).

import puppeteer from 'puppeteer';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');
const PORT = 4178;
const BASE = '/synapse-lab/';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.xml':  'application/xml; charset=utf-8',
  '.txt':  'text/plain; charset=utf-8',
};

// --- 1. Read pristine Vite template ONCE (needed because we'll overwrite dist/index.html)
const pristineTemplate = await readFile(join(distDir, 'index.html'), 'utf8');

// --- 2. HTTP server: serve pristine template for BASE, other assets from distDir
const server = createServer(async (req, res) => {
  try {
    let url = decodeURIComponent(req.url.split('?')[0]);
    if (url.startsWith(BASE)) url = url.slice(BASE.length);
    if (!url.startsWith('/')) url = '/' + url;

    // Root request → always serve pristine template (never the captured snapshot)
    if (url === '/' || url === '/index.html') {
      res.writeHead(200, { 'content-type': MIME['.html'] });
      res.end(pristineTemplate);
      return;
    }

    const filePath = join(distDir, url);
    const body = await readFile(filePath);
    const ext = '.' + (filePath.split('.').pop() || '');
    res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' });
    res.end(body);
  } catch (err) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found: ' + req.url);
  }
});

await new Promise((resolve) => server.listen(PORT, resolve));
console.log(`[snapshot] serving dist/ on http://localhost:${PORT}${BASE}`);

// --- 3. Launch Chrome
const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

// --- 4. Snapshot helper
async function snapshot({ url, outFile, langOverride }) {
  const page = await browser.newPage();

  page.on('pageerror', err => console.error('[browser error]', err.message));
  page.on('requestfailed', req => console.warn('[request failed]', req.url(), req.failure()?.errorText));

  if (langOverride) {
    await page.evaluateOnNewDocument((l) => {
      window.__forcedLang = l;
    }, langOverride);
  }

  console.log(`[snapshot] ${langOverride || 'it'} -> ${outFile}`);

  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

  await page.waitForFunction(
    () => document.querySelector('#main')?.children.length > 0,
    { timeout: 15000 }
  );

  await new Promise((r) => setTimeout(r, 800));

  const html = await page.content();

  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, html, 'utf8');

  await page.close();
  console.log(`[snapshot] wrote ${outFile} (${html.length} bytes)`);
}

// --- 5. Snapshot IT + EN
try {
  await snapshot({
    url: `http://localhost:${PORT}${BASE}`,
    outFile: join(distDir, 'index.html'),
    langOverride: 'it',
  });

  await snapshot({
    url: `http://localhost:${PORT}${BASE}`,
    outFile: join(distDir, 'en', 'index.html'),
    langOverride: 'en',
  });
} catch (err) {
  console.error('[snapshot] FAILED:', err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}

console.log('[snapshot] done');
