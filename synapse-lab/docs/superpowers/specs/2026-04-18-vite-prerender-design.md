# Piano B — Vite + Puppeteer Prerender — Design Spec

**Data:** 2026-04-18
**Status:** Approvato per implementazione
**Predecessore:** [Piano A — SEO Foundation](../plans/2026-04-18-seo-foundation.md) (completato)

## 1. Obiettivo

Rendere i 7 chapter del sito Synapse Lab **visibili a Googlebot e ai crawler social nel primo HTML scaricato**, senza alterare il behavior percepito dall'utente.

Il sito oggi è un "React-on-CDN" con Babel standalone che traspila JSX nel browser: i bot che non eseguono JavaScript (o lo eseguono con budget limitato) vedono `<main>` vuoto. Questa migrazione aggiunge una pipeline di build che pre-genera l'HTML con i contenuti già dentro, mantenendo React come layer di interattività lato client via hydration.

**Vincoli autoimposti:**
- Nessun cambio visibile all'utente finale (stessi chapter, stessi tweaks, stessa lingua toggle, stesso cursore, stessi suoni).
- Nessuna modifica alla semantica del codice React — solo refactor meccanico da globals `window.X` a ES module `import`/`export`.
- Framework scelti per stabilità e community (Vite + Puppeteer), evitando soluzioni esotiche.
- Branch dedicato `build-migration`, merge su `main` solo dopo validazione end-to-end.

## 2. Scelte tecnologiche

| Strumento | Ruolo | Motivo |
|-----------|-------|--------|
| **Vite 5.x** | Bundler + dev server con HMR | Standard moderno, buona DX, sostituisce Babel standalone |
| **React 18.3** | Runtime UI (già in uso via CDN) | Migrazione da CDN a bundled, zero API change |
| **Puppeteer 23.x** | Snapshot engine (Chrome headless controllato) | Battle-tested, docs eccellenti, API semplice |
| **Vite base plugin** | Gestione subpath `/synapse-lab/` per GitHub Pages | Nativo, richiede solo `base` config |

**Scarti espliciti:**
- **Astro + React islands** — output SEO migliore, ma richiede riscrittura di ogni chapter come componente Astro. Troppo costoso per il vincolo "minimum code churn".
- **vite-plugin-ssr / Vike** — più potente di snapshot ma API learning curve.
- **react-snap** — non più mantenuto dal 2021.
- **vite-plugin-prerender** — soluzione ad hoc ma meno trasparente di uno script Puppeteer custom.

## 3. Architettura

### 3.1 Flusso a runtime (utente finale)

```
GET https://federico-cyber.github.io/synapse-lab/
   ↓
Server (GitHub Pages) serve dist/index.html (HTML pre-renderizzato IT, contiene i 7 chapter già scritti)
   ↓
Browser parsea HTML → first paint (i bot si fermano qui: vedono tutto)
   ↓
Browser carica CSS + JS bundle (Vite output, ~40 KB gz)
   ↓
React.hydrateRoot() prende possesso dell'HTML esistente, attacca listener e state
   ↓
Sito interattivo come oggi (tweaks, lang toggle, scroll reveals, sound, SYN easter egg)
```

### 3.2 Flusso di build (CI su push a main)

```
git push main
   ↓
GitHub Actions: checkout + npm install
   ↓
npm run build  →  Vite compila src JSX → dist/ con HTML template + JS/CSS bundles
   ↓
npm run snapshot  →  Puppeteer:
     1. lancia http-server su dist/
     2. apre /?_lang=it → attende React mount → cattura DOM → scrive dist/index.html
     3. apre /?_lang=en → attende React mount → cattura DOM → scrive dist/en/index.html
     4. copia asset (favicon, og-image, robots, sitemap) già in dist/ da Vite
   ↓
Actions deploy  →  dist/ come root del sito
```

## 4. File structure

### 4.1 Before / After

**Attuale (in `synapse-lab/`):**
```
index.html          (inline TWEAKS script + CDN React/Babel + JSX via text/babel)
copy.jsx            window.COPY = {...}
chapters.jsx        usa window.COPY, window.TWEAKS, window.__lang
tweaks.jsx          window.TweaksMount = ...
mount.jsx           ReactDOM.createRoot(#main).render(<App/>)
cursor.js, lang.js, neural.js, sound.js   (vanilla, usano window globals)
style.css
favicon.svg, og-image.png, og-image.html, robots.txt, sitemap.xml
scripts/seo-check.sh
```

**Dopo (in `synapse-lab/`):**
```
package.json                   dipendenze (vite, react, react-dom, puppeteer)
vite.config.js                 config build (base path, input entries)
.gitignore                     node_modules/, dist/
index.html                     template Vite (senza CDN, senza TWEAKS inline)
src/
  main.jsx                     entry: import React, import App, hydrateRoot
  tweaks-bootstrap.js          window.TWEAKS da localStorage (era inline)
  app.jsx                      (era mount.jsx) export default App
  chapters.jsx                 import { COPY }, export {ChapterHero,...}
  tweaks.jsx                   export { TweaksMount }
  copy.js                      (era copy.jsx) export const COPY = {...}
  vanilla/
    cursor.js, lang.js         invariati — ancora `window.X = ...`
    neural.js, sound.js        invariati
  style.css                    invariato (Vite lo inline/splitta automaticamente)
public/
  favicon.svg                  spostati da root
  og-image.png
  robots.txt                   Sitemap url punta a sitemap.xml del dominio
  sitemap.xml                  include /synapse-lab/ e /synapse-lab/en/
scripts/
  seo-check.sh                 aggiornato per controllare dist/
  snapshot.mjs                 nuovo — Puppeteer IT + EN
dist/                          gitignored, output Vite+snapshot
README.md                      aggiornato con nuovi comandi npm
```

**File rimossi / spostati:**
- `og-image.html` — spostato in `scripts/og-image.html` (è solo source per rigenerazione manuale dell'OG image, non va deployato)
- Babel standalone script tag — rimosso (Vite compila al build)
- CDN React script tags — rimossi (bundled da Vite)
- Inline `<script>` TWEAKS in index.html — spostato in `src/tweaks-bootstrap.js` importato da `main.jsx`

### 4.2 Motivazione della struttura `src/`

Convenzione Vite: le fonti stanno in `src/`, l'HTML template a root, gli asset che passano as-is in `public/`. Rispetto a "tenere tutto flat" costa 1 directory in più ma rende obvious cosa è source (editabile) vs output (autogen).

## 5. Refactor JSX — scope preciso

### 5.1 `copy.jsx` → `copy.js`

- Rinomina estensione (non c'è JSX dentro).
- Rimuove `window.COPY = {...}`.
- Aggiunge `export const COPY = {...}`.

### 5.2 `chapters.jsx`

- Aggiunge `import { useState, useEffect, useRef, useMemo } from 'react';` in cima (era `const { useState, useEffect, ... } = React;`).
- Aggiunge `import { COPY } from './copy.js';` (era `window.COPY`).
- Accetta `tweaks` come prop da App (necessario per reattività: quando il pannello Tweaks cambia palette/hero/layout, i chapter devono ri-renderizzare). Ogni chapter riceve `tweaks` in firma funzione: `ChapterHero({ lang, tweaks })`.
- Sostituisce `window.__lang` con `lang` prop (già passato in JSX).
- Aggiunge `export { ChapterHero, ChapterManifesto, ... }` alla fine (rimuove `Object.assign(window, {...})`).

### 5.3 `tweaks.jsx`

- `import { useState } from 'react';`
- `export { TweaksMount };` (rimuove `window.TweaksMount = ...`).

### 5.4 `mount.jsx` → `app.jsx`

- `import React, { useState, useEffect } from 'react';`
- `import ReactDOM from 'react-dom/client';`
- `import { ChapterHero, ... } from './chapters.jsx';`
- `import { TweaksMount } from './tweaks.jsx';`
- Rimuove `const root = ReactDOM.createRoot(...); root.render(<App/>);` (spostato in `main.jsx` come `hydrateRoot`).
- Export default `App`.

### 5.5 `main.jsx` (nuovo)

```js
import React from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import App from './app.jsx';
import './tweaks-bootstrap.js';        // deve girare prima di App
import './vanilla/cursor.js';
import './vanilla/neural.js';
import './vanilla/lang.js';
import './vanilla/sound.js';
import './style.css';

const root = document.getElementById('main');
// In dev (no SSR html) usa createRoot; in prod post-snapshot usa hydrateRoot
if (import.meta.env.DEV) {
  createRoot(root).render(<App />);
} else {
  hydrateRoot(root, <App />);
}
```

### 5.6 `tweaks-bootstrap.js` (ex inline script)

```js
const DEFAULT_TWEAKS = { lang: 'it', theme: 'dark', palette: 'blu', ... };
let saved = {};
try { saved = JSON.parse(localStorage.getItem('synapse.tweaks') || '{}'); } catch (e) {}
window.TWEAKS = Object.assign({}, DEFAULT_TWEAKS, saved);
window.__saveTweaks = (t) => {
  try { localStorage.setItem('synapse.tweaks', JSON.stringify(t)); } catch (e) {}
};
```

### 5.7 File vanilla **non toccati**

`cursor.js`, `lang.js`, `neural.js`, `sound.js` continuano a scrivere `window.__neural`, `window.__sound`, `window.__applyLang`. Vengono importati da `main.jsx` solo per ordine di esecuzione (non c'è ES module export da modificare).

## 6. Prerender — dettaglio `snapshot.mjs`

Pseudocodice semplificato:

```js
import puppeteer from 'puppeteer';
import { createServer } from 'http';
import handler from 'serve-handler';
import { writeFile, mkdir } from 'fs/promises';

// 1. Serve dist/ su localhost:4173
const server = createServer((req, res) => handler(req, res, { public: 'dist' }));
await new Promise(r => server.listen(4173, r));

const browser = await puppeteer.launch({ headless: 'new' });

async function snapshot(url, outFile, langOverride) {
  const page = await browser.newPage();
  // Forza la lingua PRIMA che tweaks-bootstrap.js giri
  if (langOverride) {
    await page.evaluateOnNewDocument((l) => {
      window.__forcedLang = l;
    }, langOverride);
  }
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.querySelector('#main').children.length > 0);
  await new Promise(r => setTimeout(r, 500)); // lascia IO intersection + effects prima snapshot
  const html = await page.content();
  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, html);
  await page.close();
}

await snapshot('http://localhost:4173/', 'dist/index.html', 'it');
await snapshot('http://localhost:4173/', 'dist/en/index.html', 'en');

await browser.close();
server.close();
```

**`tweaks-bootstrap.js` modifica minima per supportare snapshot:**
```js
const langFromSnapshot = window.__forcedLang || undefined;
window.TWEAKS = Object.assign(
  {},
  DEFAULT_TWEAKS,
  saved,
  langFromSnapshot ? { lang: langFromSnapshot } : {}
);
```

## 7. Hydration — gestione mismatch

React 18 emette warning se l'HTML pre-renderizzato differisce da quello generato da React al client. Fonti potenziali di differenza in questo codebase:

1. **Classi `.in` aggiunte da IntersectionObserver** — imperative, fuori tree React. Soluzione: lo snapshot cattura HTML SENZA `.in`; dopo hydration, l'IO in `app.jsx` useEffect le aggiunge come sempre. **No mismatch** perché la classe è aggiunta imperativamente post-hydration.

2. **`ChapterHero` setTimeout che aggiunge `.in` a titleRef** — idem sopra, useEffect-driven.

3. **localStorage TWEAKS** — se l'utente ha palette custom salvata, il server render è in `palette=blu` (default) ma il client hydrata con altra palette. Il `data-palette` attribute sul body è aggiornato in useEffect, quindi **mismatch solo per un frame**. React lo gestisce tollerabilmente.

4. **Rail clock `— — : — —`** — inizialmente placeholder, aggiornato a runtime. Stessa stringa server/client → OK.

5. **`window.__neural`, `window.__sound` check** — i chapter leggono questi dopo mount, irrelevant per hydration.

**Decisione:** procedere con `hydrateRoot` e tollerare eventuali warning di mismatch — vanno trackati come issue solo se appaiono in console, non bloccano il merge. Il fallback `createRoot` in dev (`import.meta.env.DEV`) evita noise durante lo sviluppo locale dove non c'è HTML pre-renderizzato.

## 8. Routing IT / EN

- **URL canonico IT**: `https://federico-cyber.github.io/synapse-lab/`
- **URL canonico EN**: `https://federico-cyber.github.io/synapse-lab/en/`
- Entrambi gli HTML hanno `hreflang` reciproci, canonical su se stesso.
- Il toggle lingua client-side resta funzionante (legge `window.TWEAKS.lang`), ma la navigazione diretta su `/en/` carica l'HTML EN direttamente. Idealmente il toggle fa redirect cross-URL invece che swap in-place, ma questa è una raffinatezza fuori scope (proposta per Piano D).
- `sitemap.xml` aggiornato con 2 entry (`/` e `/en/`) e `xhtml:link` incrociati.

## 9. CI/CD update

Workflow `.github/workflows/deploy-pages.yml` modificato:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Install deps
        working-directory: ./synapse-lab
        run: npm ci
      - name: Build
        working-directory: ./synapse-lab
        run: npm run build
      - name: Snapshot
        working-directory: ./synapse-lab
        run: npm run snapshot
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: ./synapse-lab/dist }
  deploy:
    # invariato
```

## 10. Dev workflow

### Prima (attuale)
```bash
python3 -m http.server 8787
# modifica JSX → ricarica manuale → vedi cambio
```

### Dopo
```bash
cd synapse-lab
npm install         # solo la prima volta (e dopo cambi a package.json)
npm run dev         # Vite dev server con HMR, apre browser su localhost:5173
# modifica JSX → salva → browser ricarica automaticamente in <100ms

# per testare il build locale:
npm run build && npm run snapshot
python3 -m http.server 8787 --directory dist
# apri localhost:8787 → vedi esattamente quello che Google vedrà
```

`package.json` scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "snapshot": "node scripts/snapshot.mjs",
    "preview": "vite preview",
    "seo-check": "bash scripts/seo-check.sh"
  }
}
```

## 11. Edge case + safety

1. **Puppeteer non installato in CI** — `npm ci` risolve automaticamente (Puppeteer scarica Chromium headless durante install).
2. **Build fallisce in CI** — deploy salta, sito attuale resta online. GitHub Actions notifica via email.
3. **Snapshot fallisce** — step-scoped, deploy salta. Puppeteer con `try/catch` + exit code non-zero.
4. **Hydration mismatch severo** — React 18 prova comunque a hydratare con fallback a client-side re-render. Sito funziona (flash visibile). Monitoraggio in console dev.
5. **Regressione comportamento** — `seo-check.sh` esteso a controllare che `dist/index.html` contenga tutti i chapter (grep su `data-screen-label="01 Hero"` ... `07 Contact`).
6. **Rollback** — branch `build-migration` separato; se si vuole annullare, `git checkout main` prima del merge ripristina lo stato Piano A. Post-merge, `git revert <merge-commit>` funziona puliticamente.

## 12. Out of scope (per piani futuri)

- **Piano D — Cross-URL language toggle**: il click "IT/EN" naviga a `/en/` invece di swap client-side.
- **Piano E — Contenuti CMS**: se i chapter diventassero content-managed (copy modificabile da non-dev), si passerebbe a CMS headless (Sanity) o MDX.
- **Piano F — Test e2e**: Playwright suite che carica il sito e verifica ogni chapter + interazione.
- **Custom domain**: non richiede cambi architetturali, solo DNS + `CNAME` file in `public/`.
- **Accessibility audit completo**: WCAG 2.2 AA verifica.

## 13. Successo = ✓ quando

- [ ] `curl -s https://federico-cyber.github.io/synapse-lab/ | grep -c 'data-screen-label'` → **7** (tutti i chapter in HTML statico)
- [ ] `curl -s https://federico-cyber.github.io/synapse-lab/en/ | grep 'Digital synapses'` → match (contenuto EN)
- [ ] PageSpeed Insights **Performance ≥ 90** su mobile (era ~65)
- [ ] `npm run dev` apre HMR funzionante
- [ ] Comportamento utente finale identico: tweaks panel, lang toggle, sound, SYN easter egg tutti operativi
- [ ] `seo-check.sh` passa con 0 regressioni
- [ ] Rich Results Test: ProfessionalService + WebSite validi
