# Mobile Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ottimizzare il sito `synapse-lab/` per smartphone mantenendo tutte le feature e lo stile, portando Lighthouse mobile ≥ 90 e LCP ≤ 2.5s senza migrare stack.

**Architecture:** HTML statico + React via CDN restano. Si introduce un build step one-shot che precompila i `.jsx` in `.js` (elimina Babel standalone da prod). Si aggiunge un hamburger overlay coerente con il design system. Canvas neurale diventa adattivo al viewport. Soundscape si carica on-demand al primo click del toggle. Breakpoint CSS nuovi (768, 560, 380) con tipografia fluida via `clamp()`.

**Tech Stack:** HTML5/CSS3, React 18 (prod min via CDN), vanilla JS, Canvas 2D, Babel CLI via `npx` (solo build time), WebAudio API.

**Spec:** `docs/superpowers/specs/2026-04-18-mobile-optimization-design.md`

**Verifica (al posto di unit test):** questo progetto non ha un test runner. Ogni task ha uno "step di verifica" che consiste in: avviare il server locale (`python3 -m http.server 8787`), aprire Chrome con DevTools → Device Mode sul viewport indicato, controllare comportamento visivo/funzionale. Per le performance, Lighthouse CI ad audit finale.

---

## Task 0: Setup build step JSX (precompilazione)

**Files:**
- Create: `synapse-lab/scripts/build-jsx.sh`
- Create: `synapse-lab/package.json` (minimal, solo per `npx`)
- Modify: `synapse-lab/.gitignore` (ignora `node_modules/` ma **committa** i `.js` generati — servono in produzione GitHub Pages)

**Perché questo task è primo:** se la precompilazione non funziona, lo scopriamo subito prima di rompere altro.

- [ ] **Step 0.1: Crea `package.json` minimo**

```bash
cd /Users/fede/Documents/siti-web/synapse-lab
cat > package.json <<'EOF'
{
  "name": "synapse-lab",
  "private": true,
  "version": "1.0.0",
  "description": "Sito vetrina Synapse Lab — precompila JSX in JS",
  "scripts": {
    "build": "bash scripts/build-jsx.sh"
  },
  "devDependencies": {
    "@babel/cli": "^7.24.0",
    "@babel/core": "^7.24.0",
    "@babel/preset-react": "^7.24.0"
  }
}
EOF
```

- [ ] **Step 0.2: Crea `scripts/build-jsx.sh`**

```bash
cat > scripts/build-jsx.sh <<'EOF'
#!/usr/bin/env bash
# Precompila i .jsx in .js accanto ai sorgenti.
# Uso: npm run build (oppure bash scripts/build-jsx.sh)
set -euo pipefail

cd "$(dirname "$0")/.."

FILES=(copy.jsx chapters.jsx tweaks.jsx mount.jsx)

for f in "${FILES[@]}"; do
  out="${f%.jsx}.js"
  echo "Compilo $f → $out"
  npx --yes babel "$f" \
    --presets=@babel/preset-react \
    --out-file "$out" \
    --no-babelrc
done

echo "Build completato."
EOF
chmod +x scripts/build-jsx.sh
```

- [ ] **Step 0.3: Aggiorna `.gitignore`**

Leggi il `.gitignore` esistente (può essere in root del repo o nel progetto). Aggiungi:

```
# synapse-lab build
synapse-lab/node_modules/
```

NOTA: **non** escludere i `.js` generati — verranno committati perché GitHub Pages serve file statici.

- [ ] **Step 0.4: Esegui il build**

```bash
cd /Users/fede/Documents/siti-web/synapse-lab
npm install --no-audit --no-fund --silent
npm run build
ls -la *.js
```

**Output atteso:** esistono `copy.js`, `chapters.js`, `tweaks.js`, `mount.js` accanto ai `.jsx`.

- [ ] **Step 0.5: Aggiorna il workflow GitHub Actions per buildare in CI**

File: `.github/workflows/deploy-pages.yml` (nel root del repo, non dentro `synapse-lab/`).

Trova il job `build:` (righe 21-33). Sostituiscilo con:

```yaml
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Babel CLI
        working-directory: ./synapse-lab
        run: npm install --no-audit --no-fund --silent

      - name: Build JSX → JS
        working-directory: ./synapse-lab
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./synapse-lab
```

Così in CI il build gira sempre, anche se Federico dimentica di fare `npm run build` prima del push. Il workflow installa Babel, compila i 4 `.jsx`, poi uploada tutto l'artifact incluse le `.js` fresche.

- [ ] **Step 0.6: Commit**

```bash
cd /Users/fede/Documents/siti-web/synapse-lab
git add package.json scripts/build-jsx.sh copy.js chapters.js tweaks.js mount.js
cd ..
git add .gitignore .github/workflows/deploy-pages.yml
git commit -m "build: precompila JSX con Babel CLI in CI + commit .js per fallback"
```

---

## Task 1: Switch HTML a React production + dev flag

**Files:**
- Modify: `synapse-lab/index.html` (righe 191-205, blocco `<script>` finale)

**Obiettivo:** rimuovere Babel standalone e React dev da prod. In prod carico `.js` precompilati + React production. In locale con `?dev=1` faccio fallback al vecchio path (Babel standalone + `.jsx`).

- [ ] **Step 1.1: Sostituisci il blocco script in fondo a `index.html`**

Trova il blocco che inizia con `<!-- React + Babel (design prototype uses CDN + Babel standalone) -->` (riga ~190) e finisce con `<script type="text/babel" src="mount.jsx"></script>`. Sostituiscilo con:

```html
  <!-- Vanilla scripts (run first) -->
  <script src="neural.js"></script>
  <script src="cursor.js"></script>
  <script src="lang.js"></script>
  <script src="sound.js"></script>

  <!-- React: prod (default) con fallback dev via ?dev=1 -->
  <script>
    (function () {
      var params = new URLSearchParams(location.search);
      var isDev = params.get('dev') === '1';
      var head = document.head;

      function addScript(src, type) {
        var s = document.createElement('script');
        s.src = src;
        if (type) s.type = type;
        s.crossOrigin = 'anonymous';
        head.appendChild(s);
      }

      if (isDev) {
        // Dev: React dev + Babel standalone, JSX sorgenti
        addScript('https://unpkg.com/react@18.3.1/umd/react.development.js');
        addScript('https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js');
        addScript('https://unpkg.com/@babel/standalone@7.29.0/babel.min.js');
        addScript('copy.jsx', 'text/babel');
        addScript('chapters.jsx', 'text/babel');
        addScript('tweaks.jsx', 'text/babel');
        addScript('mount.jsx', 'text/babel');
      } else {
        // Prod: React production min + JSX precompilati
        addScript('https://unpkg.com/react@18.3.1/umd/react.production.min.js');
        addScript('https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js');
        addScript('copy.js');
        addScript('chapters.js');
        addScript('tweaks.js');
        addScript('mount.js');
      }
    })();
  </script>
</body>
```

ATTENZIONE: i 4 vanilla script (`neural.js`, `cursor.js`, `lang.js`, `sound.js`) restano identici. Cambia solo il blocco React.

- [ ] **Step 1.2: Verifica con server locale (prod path)**

```bash
cd /Users/fede/Documents/siti-web/synapse-lab
python3 -m http.server 8787 &
SERVER_PID=$!
sleep 1
```

Apri http://localhost:8787 in Chrome. DevTools → Network:
- NON deve comparire `@babel/standalone`
- Deve comparire `react.production.min.js`
- Deve comparire `mount.js` (non `mount.jsx`)

Il sito deve caricarsi identico a prima.

```bash
kill $SERVER_PID
```

- [ ] **Step 1.3: Verifica con server locale (dev path)**

```bash
python3 -m http.server 8787 &
SERVER_PID=$!
sleep 1
```

Apri http://localhost:8787?dev=1 — DevTools → Network:
- Deve comparire `@babel/standalone`
- Deve comparire `mount.jsx` (non `mount.js`)

```bash
kill $SERVER_PID
```

- [ ] **Step 1.4: Commit**

```bash
git add index.html
git commit -m "perf: carica React prod + JSX precompilato, ?dev=1 per Babel standalone"
```

---

## Task 2: Font loading ottimizzato

**Files:**
- Modify: `synapse-lab/index.html` (righe 38-41)

**Problema attuale:** c'è un `<link rel="preload">` seguito da un `<link rel="stylesheet">` verso lo stesso URL → doppia richiesta.

- [ ] **Step 2.1: Sostituisci il blocco font in `index.html`**

Trova:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

Sostituisci con:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap"></noscript>
```

- [ ] **Step 2.2: Verifica**

```bash
python3 -m http.server 8787 &
SERVER_PID=$!
sleep 1
```

Apri http://localhost:8787 — DevTools → Network filtra per "googleapis". Deve esserci **una sola richiesta** al CSS di Google Fonts (non due). Font devono caricarsi correttamente (Space Grotesk visibile nel hero).

```bash
kill $SERVER_PID
```

- [ ] **Step 2.3: Commit**

```bash
git add index.html
git commit -m "perf: un solo link font Google con preload+swap (no doppia richiesta)"
```

---

## Task 3: Canvas neural adattivo

**Files:**
- Modify: `synapse-lab/neural.js`

**Modifiche da fare:**
1. `NODE_COUNT` adattivo (24 su mobile, 62 su desktop)
2. `DPR` cappato a 1.5 su mobile
3. Rispetto `prefers-reduced-motion`: un frame statico, niente loop
4. Pausa loop quando tab nascosta

- [ ] **Step 3.1: Modifica l'inizio di `neural.js` (righe 9-14)**

Trova:
```js
(function () {
  const canvas = document.getElementById('neural');
  const ctx = canvas.getContext('2d', { alpha: true });
  let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
```

Sostituisci con:
```js
(function () {
  const canvas = document.getElementById('neural');
  const ctx = canvas.getContext('2d', { alpha: true });
  const IS_MOBILE = window.matchMedia('(max-width: 768px)').matches;
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0;
  const DPR = Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1.5 : 2);
```

- [ ] **Step 3.2: Modifica `NODE_COUNT` (riga ~56)**

Trova:
```js
  // ---- Nodes ----
  const NODE_COUNT = 62;
```

Sostituisci con:
```js
  // ---- Nodes ----
  const NODE_COUNT = IS_MOBILE ? 24 : 62;
```

- [ ] **Step 3.3: Aggiungi pausa su visibility change e prefers-reduced-motion**

Cerca la funzione principale del loop (cerca `requestAnimationFrame` nel file — ci sarà un `function frame()` o simile che si auto-chiama). Alla fine del file, PRIMA della chiusura `})();`, aggiungi:

```js
  // Pausa loop quando tab nascosta (batteria/CPU)
  let rafId = null;
  const originalRAF = window.requestAnimationFrame;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
    } else if (!REDUCED_MOTION) {
      // il loop si riavvia al prossimo frame via il suo stesso requestAnimationFrame interno
      // (la funzione frame riparte se il file usa il pattern frame()→rAF(frame))
    }
  });
```

NOTA: se il file usa `requestAnimationFrame(frame)` alla fine di ogni tick e `frame()` viene chiamata la prima volta, il pattern è auto-restart-safe. Se invece c'è una variabile globale per il rAF ID, usa quella per il `cancelAnimationFrame`. Leggi `neural.js` riga per riga per individuare il pattern prima di sostituire.

**Se preferisci la via sicura e semplice**, aggiungi questa forma NON-invasiva alla fine del file PRIMA del `})();`:

```js
  // Pausa quando tab nascosta: usa un flag globale letto dalla loop function
  window.__NEURAL_PAUSED = false;
  document.addEventListener('visibilitychange', () => {
    window.__NEURAL_PAUSED = document.hidden;
  });
```

E poi all'inizio della funzione frame/loop aggiungi (cerca la definizione della loop function in `neural.js`):

```js
  function frame(t) {
    if (window.__NEURAL_PAUSED) {
      requestAnimationFrame(frame);
      return;
    }
    // ... resto del body esistente
  }
```

- [ ] **Step 3.4: Gestisci prefers-reduced-motion**

All'inizio della funzione `frame` (subito dopo il check `__NEURAL_PAUSED`), aggiungi:

```js
    if (REDUCED_MOTION) {
      // Render un singolo frame statico, poi esci dal loop
      if (!window.__NEURAL_STATIC_RENDERED) {
        // il resto della funzione frame disegnerà una volta sola
        window.__NEURAL_STATIC_RENDERED = true;
      } else {
        return; // non ri-schedulare rAF
      }
    }
```

E in fondo alla funzione `frame`, dove c'è `requestAnimationFrame(frame)`, cambialo in:

```js
    if (!REDUCED_MOTION) requestAnimationFrame(frame);
```

- [ ] **Step 3.5: Verifica desktop**

```bash
python3 -m http.server 8787 &
SERVER_PID=$!
sleep 1
```

Apri http://localhost:8787 a viewport desktop — il canvas deve disegnare con lo stesso numero di nodi di prima (62). Nessun cambiamento visibile.

- [ ] **Step 3.6: Verifica mobile**

Apri http://localhost:8787 in Chrome DevTools → Device Mode → iPhone 14 Pro (390×844). Ricarica. Il canvas deve avere meno nodi (24 vs 62), DPR effettivo 1.5.

DevTools → Performance → Record 3 secondi di idle. FPS deve essere stabile sui 60 (era dropped frames prima su mobile emulato con CPU throttling 4x).

- [ ] **Step 3.7: Verifica reduced-motion**

Chrome DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce". Ricarica. Il canvas deve mostrare UN frame statico e non animarsi.

- [ ] **Step 3.8: Commit**

```bash
kill $SERVER_PID
git add neural.js
git commit -m "perf(neural): node count adattivo mobile (24 vs 62), DPR 1.5, pause su tab nascosta, rispetta prefers-reduced-motion"
```

---

## Task 4: Magnet disable su touch

**Files:**
- Modify: `synapse-lab/cursor.js`

**Problema:** `cursor.js` installa listeners `mousemove`/`mouseover` che non servono su touch device. Il CSS già nasconde il cursore custom con `@media (hover: none)`, ma il JS gira lo stesso.

- [ ] **Step 4.1: Aggiungi early-return in cima a `cursor.js`**

Trova (riga 1-4):
```js
/* Custom cursor — small dot + ring, magnet on [data-magnet] elements */
(function () {
  const cursor = document.getElementById('cursor');
  if (!cursor) return;
```

Sostituisci con:
```js
/* Custom cursor — small dot + ring, magnet on [data-magnet] elements */
(function () {
  // Skip completo su touch device: nessun cursore custom, niente listener JS.
  if (window.matchMedia('(hover: none)').matches) return;

  const cursor = document.getElementById('cursor');
  if (!cursor) return;
```

- [ ] **Step 4.2: Verifica mobile**

```bash
python3 -m http.server 8787 &
SERVER_PID=$!
sleep 1
```

DevTools → Device Mode → iPhone 14 Pro. Apri http://localhost:8787 — DevTools Console → incolla:
```js
getEventListeners(window)
```
La lista `mousemove`/`mouseover`/`scroll` di cursor.js non deve comparire (solo quelli degli altri moduli).

- [ ] **Step 4.3: Verifica desktop**

Chiudi Device Mode. Ricarica. Il cursore custom deve funzionare come prima (dot + ring che seguono il mouse, magnet su link).

- [ ] **Step 4.4: Commit**

```bash
kill $SERVER_PID
git add cursor.js
git commit -m "perf(cursor): early-return su touch device (niente listener JS inutili)"
```

---

## Task 5: Lazy-load soundscape

**Files:**
- Create: `synapse-lab/sound-init.js`
- Modify: `synapse-lab/sound.js` (wrappa in una funzione esposta globalmente)
- Modify: `synapse-lab/index.html` (sostituisce `<script src="sound.js">` con `sound-init.js`)

**Obiettivo:** al page load si carica solo uno shim leggero (~1 KB). `sound.js` (607 righe) viene scaricato solo al primo click del toggle SOUND.

- [ ] **Step 5.1: Wrappa `sound.js` in una funzione di init esposta**

Leggi `sound.js`. Se inizia con qualcosa come `(function () {` e finisce con `})();` (IIFE auto-invocato), trasformalo in:

```js
// In cima:
window.__initSoundscape = function () {
  if (window.__soundscapeInited) return;
  window.__soundscapeInited = true;
  // ... tutto il body attuale dell'IIFE ...
};
```

In pratica:
1. Rimuovi la riga iniziale `(function () {`
2. Rimuovi la riga finale `})();`
3. Avvolgi il tutto in `window.__initSoundscape = function () { ... };`
4. Aggiungi all'inizio del body il guard `if (window.__soundscapeInited) return; window.__soundscapeInited = true;`

- [ ] **Step 5.2: Crea `sound-init.js`**

```bash
cat > /Users/fede/Documents/siti-web/synapse-lab/sound-init.js <<'EOF'
/* Lazy loader per sound.js — carica il modulo solo al primo click del toggle */
(function () {
  var toggle = document.getElementById('sound-toggle');
  if (!toggle) return;

  var loaded = false;

  function loadSound() {
    if (loaded) return;
    loaded = true;
    var s = document.createElement('script');
    s.src = 'sound.js';
    s.onload = function () {
      if (typeof window.__initSoundscape === 'function') {
        window.__initSoundscape();
        // Replica il click per far partire l'audio
        toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    };
    document.head.appendChild(s);
  }

  toggle.addEventListener('click', loadSound, { once: true });

  // Prefetch su idle dopo il first paint
  if ('requestIdleCallback' in window) {
    requestIdleCallback(function () {
      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = 'sound.js';
      document.head.appendChild(link);
    }, { timeout: 3000 });
  }
})();
EOF
```

- [ ] **Step 5.3: Modifica `index.html`**

Trova (riga ~199):
```html
<script src="sound.js"></script>
```

Sostituisci con:
```html
<script src="sound-init.js"></script>
```

- [ ] **Step 5.4: Verifica**

```bash
python3 -m http.server 8787 &
SERVER_PID=$!
sleep 1
```

Apri http://localhost:8787 → DevTools → Network. Al page load: `sound.js` NON deve essere scaricato (solo `sound-init.js`). Dopo pochi secondi idle, `sound.js` appare come `prefetch` (priorità lowest).

Click sul pulsante SOUND in navbar: `sound.js` viene scaricato ed eseguito. Audio parte.

- [ ] **Step 5.5: Commit**

```bash
kill $SERVER_PID
git add sound.js sound-init.js index.html
git commit -m "perf(sound): lazy-load di sound.js al primo click del toggle (prefetch su idle)"
```

---

## Task 6: Mobile breakpoints CSS (768, 560, 380)

**Files:**
- Modify: `synapse-lab/style.css` (aggiunge blocchi media query dopo il blocco esistente `@media (max-width: 900px)` alla riga ~945)

- [ ] **Step 6.1: Aggiungi i 3 nuovi breakpoint in coda a `style.css`**

Dopo la `}` di chiusura del media query esistente `@media (max-width: 900px)`, aggiungi:

```css
/* ============================================================
   Mobile — Tablet portrait (≤ 768px)
   ============================================================ */
@media (max-width: 768px) {
  /* Navbar: nascondi link desktop, mostra hamburger */
  #nav .nav-link,
  #nav .nav-divider,
  #nav .nav-icon,
  #nav .nav-cta { display: none; }
  #nav .hamburger { display: flex; }

  /* Overlay menu: full screen */
  #menu-overlay {
    display: flex;
    position: fixed;
    inset: 0;
    z-index: 9000;
    background: var(--bg-0);
    flex-direction: column;
    padding: 88px 32px 32px;
    transform: translateY(-100%);
    transition: transform 220ms cubic-bezier(.2,.7,.2,1);
  }
  body.menu-open #menu-overlay { transform: translateY(0); }
  body.menu-open { overflow: hidden; }

  #menu-overlay .menu-link {
    font-family: var(--font-display, 'Space Grotesk', sans-serif);
    font-size: clamp(2rem, 8vw, 3.25rem);
    font-weight: 500;
    color: var(--ink);
    text-align: left;
    background: none;
    border: none;
    padding: 14px 0;
    cursor: pointer;
    border-bottom: 1px solid var(--line);
  }
  #menu-overlay .menu-link:active { color: var(--accent); }
  #menu-overlay .menu-footer {
    margin-top: auto;
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }
  #menu-overlay .menu-footer button { min-height: 44px; }

  /* Tweaks panel: drawer dal basso */
  #tweaks-mount {
    right: 0 !important;
    bottom: 0 !important;
    left: 0;
  }
  .tweaks {
    width: 100% !important;
    max-height: 70vh !important;
    border-radius: 16px 16px 0 0;
  }
}

/* ============================================================
   Mobile — Phone (≤ 560px)
   ============================================================ */
@media (max-width: 560px) {
  /* Spacing capitoli: ridotto */
  .chapter {
    padding-top: 72px;
    padding-bottom: 72px;
    padding-left: 20px;
    padding-right: 20px;
  }

  /* Touch target: tutti i pulsanti ≥ 44×44 */
  button, .btn, .nav-cta, .menu-link, #sound-toggle, #lang-toggle {
    min-height: 44px;
  }

  /* Grain: texture più piccola per risparmiare memoria GPU */
  #grain { background-size: 96px 96px; }

  /* Stack tipografia fluida */
  .services[data-layout="grid-soft"] .svc,
  .services[data-layout="cards"] .svc,
  .tech-grid { grid-template-columns: 1fr !important; }
}

/* ============================================================
   Mobile — Small phone (≤ 380px)
   ============================================================ */
@media (max-width: 380px) {
  .chapter {
    padding-left: 16px;
    padding-right: 16px;
  }
  /* Tweaks drawer: full width già via 768px rule */
  .tweaks { padding: 16px !important; }
}

/* ============================================================
   Accessibilità — prefers-reduced-motion
   ============================================================ */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 6.2: Verifica breakpoint tablet (768px)**

```bash
python3 -m http.server 8787 &
SERVER_PID=$!
sleep 1
```

DevTools → Device Mode → iPad Mini (768×1024 portrait). I link in navbar devono sparire. L'hamburger NON appare ancora (creeremo markup+JS nel Task 7: è normale).

- [ ] **Step 6.3: Verifica breakpoint phone (560px)**

Device Mode → iPhone 14 Pro (390). Capitoli devono avere padding ridotto (72px verticali). `.tech-grid` a 1 colonna.

- [ ] **Step 6.4: Verifica small phone (380px)**

Device Mode → iPhone SE (375×667). Padding laterale chapter ridotto a 16px.

- [ ] **Step 6.5: Commit**

```bash
kill $SERVER_PID
git add style.css
git commit -m "feat(mobile): breakpoint 768/560/380 + prefers-reduced-motion"
```

---

## Task 7: Hamburger menu (markup + JS + accessibilità)

**Files:**
- Modify: `synapse-lab/index.html` (aggiunge hamburger button nella navbar + overlay prima di `<main>`)
- Create: `synapse-lab/menu.js`

- [ ] **Step 7.1: Aggiungi il pulsante hamburger nella navbar**

Trova in `index.html` (riga ~153):
```html
<div class="nav-right">
  <button class="nav-link" data-magnet data-scroll-to="#ch2" data-it="Manifesto" data-en="Manifesto"></button>
```

Sostituisci con:
```html
<div class="nav-right">
  <button class="hamburger" id="hamburger-toggle" aria-label="Apri menu" aria-expanded="false" aria-controls="menu-overlay" style="display:none">
    <span></span><span></span><span></span>
  </button>
  <button class="nav-link" data-magnet data-scroll-to="#ch2" data-it="Manifesto" data-en="Manifesto"></button>
```

- [ ] **Step 7.2: Aggiungi l'overlay menu prima di `<main id="main">`**

Trova (riga ~168):
```html
<!-- Chapters mount point -->
<main id="main"></main>
```

Inserisci PRIMA di `<main>`:
```html
<!-- Mobile hamburger overlay (visible only ≤ 768px via CSS) -->
<nav id="menu-overlay" aria-hidden="true" role="dialog" aria-label="Menu di navigazione">
  <button class="menu-link" data-scroll-to="#ch2" data-it="Manifesto" data-en="Manifesto"></button>
  <button class="menu-link" data-scroll-to="#ch3" data-it="Servizi" data-en="Work"></button>
  <button class="menu-link" data-scroll-to="#ch6" data-it="Studio" data-en="Studio"></button>
  <button class="menu-link" data-scroll-to="#ch7" data-it="Inizia un progetto" data-en="Start a project"></button>
  <div class="menu-footer">
    <button id="menu-sound-toggle" class="nav-icon">
      <span class="sound-label">SOUND</span><span class="sound-state">OFF</span>
    </button>
    <button id="menu-lang-toggle" class="nav-icon">
      <span class="lang-it">IT</span><span class="lang-sep">/</span><span class="lang-en">EN</span>
    </button>
  </div>
</nav>
```

- [ ] **Step 7.3: Aggiungi stili hamburger in `style.css`**

Incolla in coda a `style.css` (dopo i media query creati in Task 6):

```css
/* ============================================================
   Hamburger button (visibile solo ≤ 768px, attivato in Task 6)
   ============================================================ */
.hamburger {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 28px;
  height: 22px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  align-items: center;
}
.hamburger span {
  display: block;
  width: 24px;
  height: 1.6px;
  background: var(--ink);
  transition: transform 200ms ease, opacity 200ms ease;
}
body.menu-open .hamburger span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
body.menu-open .hamburger span:nth-child(2) { opacity: 0; }
body.menu-open .hamburger span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

#menu-overlay { display: none; } /* default: nasconde su desktop */
```

- [ ] **Step 7.4: Crea `menu.js`**

```bash
cat > /Users/fede/Documents/siti-web/synapse-lab/menu.js <<'EOF'
/* Hamburger menu — mobile nav overlay */
(function () {
  const toggle = document.getElementById('hamburger-toggle');
  const overlay = document.getElementById('menu-overlay');
  if (!toggle || !overlay) return;

  const focusable = () => overlay.querySelectorAll('button, a');

  function open() {
    document.body.classList.add('menu-open');
    toggle.setAttribute('aria-expanded', 'true');
    overlay.setAttribute('aria-hidden', 'false');
    const first = focusable()[0];
    if (first) first.focus();
  }

  function close() {
    document.body.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    overlay.setAttribute('aria-hidden', 'true');
    toggle.focus();
  }

  toggle.addEventListener('click', () => {
    if (document.body.classList.contains('menu-open')) close();
    else open();
  });

  // Click su un link → scroll + chiudi
  overlay.addEventListener('click', (e) => {
    const link = e.target.closest('[data-scroll-to]');
    if (!link) return;
    const target = document.querySelector(link.dataset.scrollTo);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    close();
  });

  // ESC chiude
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
      close();
    }
  });

  // Sound + Lang toggle dentro menu delegano ai pulsanti navbar (stessi id diversi)
  const menuSound = document.getElementById('menu-sound-toggle');
  const mainSound = document.getElementById('sound-toggle');
  if (menuSound && mainSound) {
    menuSound.addEventListener('click', () => mainSound.click());
  }
  const menuLang = document.getElementById('menu-lang-toggle');
  const mainLang = document.getElementById('lang-toggle');
  if (menuLang && mainLang) {
    menuLang.addEventListener('click', () => mainLang.click());
  }
})();
EOF
```

- [ ] **Step 7.5: Carica `menu.js` in `index.html`**

Trova (riga ~199, vicino agli altri vanilla script):
```html
<script src="sound-init.js"></script>
```

Aggiungi sotto:
```html
<script src="menu.js"></script>
```

- [ ] **Step 7.6: Verifica**

```bash
python3 -m http.server 8787 &
SERVER_PID=$!
sleep 1
```

DevTools → Device Mode → iPhone 14 Pro. Apri http://localhost:8787.
- Hamburger visibile in alto a destra (3 linee).
- Tap → overlay slide-in dall'alto, link visibili.
- Tap su "Manifesto" → overlay si chiude, pagina scrolla a ch2.
- Tap hamburger (trasformato in X) → overlay si chiude.
- Tasto ESC da DevTools Console: `document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))` → chiude.

Disabilita Device Mode (desktop): hamburger scompare, i link normali tornano visibili.

- [ ] **Step 7.7: Commit**

```bash
kill $SERVER_PID
git add index.html style.css menu.js
git commit -m "feat(mobile): hamburger menu overlay con focus trap + ESC + delega toggle SOUND/LANG"
```

---

## Task 8: Tipografia fluida + consolidamento CSS

**Files:**
- Modify: `synapse-lab/style.css`

**Obiettivo:** eliminare gli stacchi bruschi di tipografia fra breakpoint. Usa `clamp()`.

- [ ] **Step 8.1: Identifica le heading principali**

```bash
cd /Users/fede/Documents/siti-web/synapse-lab
```

Usa Grep/ricerca nel CSS per trovare le dichiarazioni `font-size` su `.hero`, `.hero-title`, `h1`, `h2`, `.chapter h2`. Annota i valori attuali e le righe.

- [ ] **Step 8.2: Applica `clamp()` alle heading principali**

Per ogni dichiarazione grande (es. `font-size: 5.5rem` o simile), sostituisci con:

- Hero h1 / hero-title: `font-size: clamp(2.5rem, 7vw + 1rem, 6.5rem);`
- Chapter h2 (titoli capitolo): `font-size: clamp(1.75rem, 3.5vw + 1rem, 3.25rem);`
- `.manifesto blockquote`: `font-size: clamp(1.25rem, 2vw + 0.75rem, 2rem);`

IMPORTANTE: NON modificare il `font-size` dentro `@media (max-width: XXX)` già esistenti — `clamp()` già gestisce la scala in modo fluido, rendendo ridondanti le override. Puoi eliminarle solo se la resa visiva è invariata ai tre breakpoint testati (vedi verifica).

- [ ] **Step 8.3: Verifica visiva a 4 viewport**

```bash
python3 -m http.server 8787 &
SERVER_PID=$!
sleep 1
```

DevTools → Device Mode, cambia fra:
- 375 (iPhone SE)
- 390 (iPhone 14 Pro)
- 768 (iPad portrait)
- 1280 (desktop)

Il testo deve scalare **smooth** senza stacchi visibili al cambio di breakpoint. Hero h1 deve stare su max 3 righe a 375px, 2 righe a 768px, 1-2 a desktop.

- [ ] **Step 8.4: Commit**

```bash
kill $SERVER_PID
git add style.css
git commit -m "style(mobile): tipografia fluida con clamp() su hero, chapter h2, blockquote"
```

---

## Task 9: Verifica finale

- [ ] **Step 9.1: SEO check**

```bash
cd /Users/fede/Documents/siti-web/synapse-lab
./scripts/seo-check.sh
```
Deve uscire con exit 0 e "17/17 passed".

- [ ] **Step 9.2: Lighthouse mobile**

```bash
python3 -m http.server 8787 &
SERVER_PID=$!
sleep 1
```

Apri http://localhost:8787 in Chrome → DevTools → Lighthouse → **Mode: Navigation**, **Device: Mobile**, **Categories: Performance + Accessibility + Best Practices + SEO**. Lancia.

**Target minimi:**
- Performance: ≥ 90
- Accessibility: ≥ 95
- Best Practices: ≥ 95
- SEO: 100

Se Performance < 90:
- Controlla LCP (< 2.5s richiesto)
- Controlla Main thread blocking (dovrebbe essere molto ridotto ora senza Babel)
- Controlla CLS (< 0.05)

Salva il report come `docs/lighthouse-mobile-2026-04-18.html` (DevTools Lighthouse → Download report).

```bash
kill $SERVER_PID
```

- [ ] **Step 9.3: Device test manuale**

Se possibile, apri il sito (una volta deployato) da uno smartphone reale (iPhone o Android) su rete mobile. Controlla:
- Hero carica in < 3s
- Scroll fluido, niente jank
- Hamburger funziona, menu si apre/chiude
- Pulsante SOUND: tocca, audio parte in < 1s
- Tweaks panel: attivabile via sequenza SYN (test solo per QA)
- Rotazione landscape: layout si adatta

- [ ] **Step 9.4: Commit report Lighthouse (se scaricato)**

```bash
git add docs/lighthouse-mobile-2026-04-18.html 2>/dev/null
git commit -m "docs: lighthouse mobile report post-ottimizzazione" || echo "Nessun report da committare"
```

- [ ] **Step 9.5: Push finale**

```bash
git push origin main
```

---

## Rollback plan

Se qualcosa si rompe in produzione, i commit sono granulari e si possono `git revert` uno alla volta. L'ordine di priorità di rollback (dal più sicuro al più rischioso):

1. Task 9 (solo docs): irrilevante
2. Task 8 (tipografia): safe, solo visivo
3. Task 7 (hamburger): safe, feature nuova isolata
4. Task 6 (breakpoint): safe, CSS additivo
5. Task 5 (lazy sound): se rompe audio, revert
6. Task 4 (cursor): trivialmente reversibile
7. Task 3 (canvas): può cambiare look → revert se feedback negativo
8. Task 2 (font): reversibile
9. Task 1 (React prod + dev flag): **più rischioso** → se rompe rendering, revert
10. Task 0 (build step): se `.js` non ci sono, `?dev=1` come fallback universale
