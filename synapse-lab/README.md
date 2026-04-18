# Synapse Lab

Sito vetrina dell'agenzia Synapse Lab — digital craft studio di Milano.

**Produzione:** https://federico-cyber.github.io/synapse-lab/ (IT) · https://federico-cyber.github.io/synapse-lab/en/ (EN)

## Stack

- **Vite 5** — bundler + dev server con HMR
- **React 18** (bundled, non più CDN)
- **Puppeteer 23** — snapshot prerender IT + EN
- **Vanilla JS** in `src/vanilla/` per cursore custom, rete neurale canvas, audio ambient
- **GitHub Pages** + GitHub Actions per hosting e CI

## Prima installazione

Serve **Node 20+** (verifica con `node --version`). Se non ce l'hai, installa da https://nodejs.org (LTS).

```bash
cd synapse-lab
npm install    # scarica deps + Chromium per Puppeteer (~170 MB, una tantum)
```

## Sviluppo locale

```bash
npm run dev
# apri http://localhost:5173/synapse-lab/
# Edit src/**.jsx → salvi → browser ricarica automaticamente (HMR)
```

## Build e preview locale

```bash
npm run build      # compila src/ in dist/
npm run snapshot   # Puppeteer pre-renderizza dist/index.html (IT) + dist/en/index.html (EN)
npm run preview    # serve dist/ su localhost:4173 (identico a produzione)
```

## SEO validation

```bash
npm run seo-check
```

Valida 20 tag critici + presenza dei 7 chapter prerenderizzati + snapshot EN.

Online dopo deploy:
- Rich Results: https://search.google.com/test/rich-results
- Schema.org: https://validator.schema.org/
- OG preview: https://www.opengraph.xyz/
- PageSpeed: https://pagespeed.web.dev/

## Rigenerazione OG image

Se cambi il template (`scripts/og-image.html`):

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1200,800 --force-device-scale-factor=1 \
  --virtual-time-budget=8000 \
  --screenshot="$(pwd)/og-image-raw.png" \
  "file://$(pwd)/scripts/og-image.html"

python3 -c "
from PIL import Image
Image.open('og-image-raw.png').crop((0, 0, 1200, 630)).save('public/og-image.png', optimize=True)
"
rm og-image-raw.png
```

Poi `npm run build` per propagarla in `dist/`.

## Struttura

```
synapse-lab/
├── src/
│   ├── main.jsx                 entry (hydrateRoot / createRoot)
│   ├── app.jsx                  root component
│   ├── chapters.jsx             i 7 chapter
│   ├── tweaks.jsx               pannello Tweaks
│   ├── tweaks-bootstrap.js      inizializza window.TWEAKS
│   ├── copy.js                  dizionario stringhe IT/EN
│   ├── style.css
│   └── vanilla/
│       ├── cursor.js            cursore custom
│       ├── neural.js            canvas rete neurale
│       ├── lang.js              swap stringhe statiche IT/EN
│       └── sound.js             audio ambient
├── public/                      asset statici copiati as-is in dist/
│   ├── favicon.svg
│   ├── og-image.png
│   ├── robots.txt
│   └── sitemap.xml
├── scripts/
│   ├── snapshot.mjs             Puppeteer prerender
│   ├── seo-check.sh             smoke test
│   └── og-image.html            sorgente per OG image
├── dist/                        (gitignored) output Vite + snapshot
├── index.html                   shell statico (Vite entry template)
├── package.json
└── vite.config.js
```

## Deploy

Automatico su push a `main`. Il workflow `.github/workflows/deploy-pages.yml`:
1. `npm ci` in `./synapse-lab`
2. `npm run build` (Vite)
3. `npm run snapshot` (Puppeteer)
4. `npm run seo-check`
5. Upload `./synapse-lab/dist` → GitHub Pages

Durata tipica: 2-3 minuti (Puppeteer scarica Chromium la prima volta).

## Troubleshooting

- **`npm install` lento o fallisce su Puppeteer:** è Chromium che scarica (170 MB). Se timeout, ripeti. Se non vuole, `npx puppeteer browsers install chrome`.
- **`npm run dev` pagina bianca:** controlla DevTools console — probabile import con path sbagliato (`Failed to resolve`).
- **`npm run snapshot` timeout:** aumenta `timeout: 30000` → `60000` in `scripts/snapshot.mjs`.
- **Regressione dopo refactor:** `git checkout main && npm install && npm run dev` torna allo stato Piano A.
