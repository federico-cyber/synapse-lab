// Puppeteer snapshot: renders built dist/ in Chrome headless, waits for React to mount,
// captures the DOM, writes back to dist/index.html (IT) + dist/en/index.html (EN).

import puppeteer from 'puppeteer';
import { createServer } from 'node:http';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from 'serve-handler';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');
const PORT = 4178;

// --- 1. Serve dist/ su localhost
const server = createServer((req, res) => {
  return handler(req, res, {
    public: distDir,
    rewrites: [
      { source: '/synapse-lab/**', destination: '/:0' },
      { source: '/synapse-lab/', destination: '/index.html' },
    ],
  });
});

await new Promise((resolve) => server.listen(PORT, resolve));
console.log(`[snapshot] serving dist/ on http://localhost:${PORT}`);

// --- 2. Launch Chrome
const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

// --- 3. Snapshot helper
async function snapshot({ url, outFile, langOverride }) {
  const page = await browser.newPage();

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

// --- 4. Snapshot IT + EN
try {
  await snapshot({
    url: `http://localhost:${PORT}/synapse-lab/`,
    outFile: join(distDir, 'index.html'),
    langOverride: 'it',
  });

  await snapshot({
    url: `http://localhost:${PORT}/synapse-lab/`,
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
