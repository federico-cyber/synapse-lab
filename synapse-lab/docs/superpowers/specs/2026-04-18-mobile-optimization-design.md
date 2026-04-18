# Mobile Optimization — Design Spec

**Data**: 2026-04-18
**Progetto**: `synapse-lab/` (sito vetrina agenzia)
**Autore**: Federico Battistella + Claude

## Obiettivo

Ottimizzare il sito per smartphone mantenendo **tutte** le funzionalità e lo stile attuale, garantendo coerenza visiva e performance all'altezza del posizionamento dell'agenzia ("siti bellissimi, dinamici, futuristici"). Il sito su mobile deve restare un esercizio di stile, non diventare una versione ridotta.

## Vincoli di prodotto

- **Nessuna feature viene rimossa**: canvas neurale, audio soundscape, tweaks panel, cursore custom, grain overlay, animazioni.
- **Stile invariato**: palette, tipografia, layout dei 7 capitoli, microinterazioni.
- **Stack invariato**: HTML statico + React via CDN + zero dipendenze npm a runtime (un piccolo build step CLI è accettabile solo pre-deploy).

## Target misurabili

| Metrica | Attuale (stima 4G mid-tier) | Target |
|---|---|---|
| LCP mobile | ~4.0s | ≤ 2.5s |
| JS bloccante | ~500 KB (React+Babel+JSX) | ≤ 200 KB |
| CLS | n/d | ≤ 0.05 |
| Canvas frame budget | ~16ms desktop, dropped frames mobile | ≤ 8ms mobile |
| Lighthouse Performance mobile | ~55–65 | ≥ 90 |

---

## Area 1 — Layout & navigazione

### Breakpoint

Si aggiungono tre breakpoint oltre al `max-width: 900px` esistente:

- **≤ 900px** (già presente) — comportamento tablet landscape: rail nascosto, services a colonna piena.
- **≤ 768px** — tablet portrait: griglie a 1-2 colonne, hamburger al posto dei link navbar, tweaks panel ridimensionato.
- **≤ 560px** — phone: stack verticale totale, touch target ≥ 44×44px, spacing `.chapter` ridotto, hero type con `clamp()` fluido.
- **≤ 380px** — small phone (iPhone SE, Android compatti): hero type ulteriormente contratto, tweaks panel off-canvas full width.

### Navbar → hamburger

Sotto 768px, i `.nav-link` (Manifesto, Servizi, Studio) oggi vengono semplicemente nascosti. Si introduce:

- Pulsante hamburger (3 linee SVG con stesso stroke della logo-mark, coerenza visiva).
- Pannello full-screen overlay: sfondo `--bg-0` con grain attivo, 3 link + toggle SOUND + toggle LANG + CTA `Inizia un progetto`.
- Animazione slide-in (120ms, ease-out) + stagger sui link (50ms delta).
- Chiusura: tap fuori pannello, tap su un link, tasto ESC, swipe-down (gesto nativo accettabile, non implementiamo custom).
- State: classe `body.menu-open`, gestita da vanilla JS (niente React per un toggle).
- Focus trap semplice (primo link focused on open, ESC per chiudere, restore focus sul trigger).

### Tweaks panel

Su ≤ 768px:
- Si trasforma in drawer dal basso, stessa estetica (bordi, tipografia, ombreggiatura).
- Max-height 70vh (già presente), ma full-width su ≤ 380px.
- Resta attivabile solo in debug mode (sequenza SYN) come già oggi.

### Rail laterale

Già nascosto sotto 900px. Ok così.

---

## Area 2 — Performance

### 2.1 Precompilazione JSX (impatto maggiore)

**Problema**: attualmente `@babel/standalone` (~200 KB minified, parsing sync) viene caricato da CDN e compila `copy.jsx`, `chapters.jsx`, `tweaks.jsx`, `mount.jsx` al load. Blocca il main thread per ~600-900ms su mid-tier Android.

**Soluzione**:
- Script `scripts/build-jsx.sh` che usa `npx @babel/cli` con preset-react per compilare i 4 `.jsx` in `.js` accanto ai sorgenti (es. `mount.jsx` → `mount.js`). No bundler, no dipendenze installate permanentemente.
- `index.html` punta ai `.js` compilati, NON carica più `@babel/standalone` né `react.development.js`/`react-dom.development.js` (si passa alla build `.production.min.js`).
- Saving: **~400 KB di JS bloccante rimosso**, parse/exec ridotto di ~70%.

**Dev experience** (decisa): flag `?dev=1` in URL fa fallback al path `@babel/standalone` + `.jsx` tramite condizionale all'inizio di `index.html`. Così Federico può iterare localmente senza rilanciare il build a ogni modifica di un `.jsx`. Il build resta obbligatorio solo prima del push in produzione (automatizzabile nel workflow GitHub Actions).

### 2.2 Canvas neural adattivo

**Problema**: `NODE_COUNT = 62` fisso, DPR cappato a 2. Su iPhone con DPR 3 e viewport 390×844, il canvas ridisegna ~62 nodi + ~200 segmenti + pulses a 16ms; su A12-era scende a 30fps con dropped frames.

**Soluzione**:
```js
const isMobile = window.innerWidth < 768;
const NODE_COUNT = isMobile ? 24 : 62;
const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
const PULSE_RATE = isMobile ? 0.5 : 1.0;
```
Più:
- Pausa loop su `document.visibilitychange` (tab nascosta → `cancelAnimationFrame`).
- Rispetto `prefers-reduced-motion`: render di un singolo frame statico, nessun loop.
- Throttle della lettura mouse (già `passive: true` sullo scroll, ok).

### 2.3 Lazy load soundscape

**Problema**: `sound.js` (607 righe, WebAudio setup) viene caricato sync in `index.html` anche se l'utente non attiva mai l'audio.

**Soluzione**:
- `index.html` carica uno shim minimo (`sound-init.js`, ~20 righe) che attacca un listener al `#sound-toggle`.
- Al primo click, `import('./sound.js')` dinamico (script tag injected), poi inizializza.
- Saving: ~30 KB non parsati al load; CPU WebAudio context non allocata finché non serve.

### 2.4 Font loading

**Problema**: `index.html` ha sia `<link rel="preload">` sia `<link rel="stylesheet">` verso lo stesso URL Google Fonts → doppia richiesta.

**Soluzione**:
- Un solo `<link rel="preload" as="style" onload="this.rel='stylesheet'">` pattern, con `<noscript>` fallback.
- `font-display: swap` è già implicito nel CSS Google.

### 2.5 Magnet listeners

**Problema**: i listeners `data-magnet` in `cursor.js` si attivano anche su mobile dove non c'è cursore. JS inutile sul main thread.

**Soluzione**: early-return nel codice magnet se `matchMedia('(hover: none)').matches`.

### 2.6 Grain overlay

**Problema**: `#grain` usa un background pattern con dimensione uniforme fra desktop e mobile.

**Soluzione**: `background-size` ridotto (es. 128×128 → 96×96) su ≤ 560px per ridurre banda e memoria GPU senza alterare l'effetto percepito.

---

## Area 3 — Coerenza stilistica

### 3.1 Tipografia fluida

Usare `clamp()` per l'hero type e i titoli di capitolo:
```css
.hero-title { font-size: clamp(2.5rem, 8vw + 1rem, 7rem); }
.chapter h2 { font-size: clamp(1.75rem, 4vw + 1rem, 3.5rem); }
```
Eliminazione degli stacchi bruschi a ogni breakpoint.

### 3.2 Spacing system

I `.chapter` hanno padding verticale tarato per desktop (128px+). Su phone scende a ~64px per ridurre scroll-jank e migliorare la densità informativa. Mantenere `margin-inline` laterale costante per non spezzare il ritmo verticale.

### 3.3 Touch target

Tutti i pulsanti (`nav-link`, `nav-cta`, `nav-icon`, toggle del tweaks panel, CTA contact) minimo 44×44px su touch device. Verifica con un audit manuale delle 7 sezioni.

### 3.4 Microinterazioni non-touch

- `data-magnet`: disabilitato via media query `(hover: none)` (già CSS-side per il cursore, aggiungere JS-side).
- Hover states: sostituiti da `:active` + `:focus-visible` per feedback tattile.

---

## Cosa NON si fa (out of scope)

- Non si cambia la copy dei 7 capitoli.
- Non si introduce React Router / SPA routing.
- Non si migra a Vite/Next.js (tracciato in `prompt-design.md` come piano separato).
- Non si rimuovono feature.
- Non si riprogettano i capitoli (es. trasformare Services in carousel). La direzione dell'utente è "manteniamo tutto", layout verticale standard.

## Verifica

- `scripts/seo-check.sh` deve continuare a passare (17 tag critici).
- Lighthouse mobile ≥ 90 Performance, ≥ 95 Accessibility.
- Test manuale su iPhone SE (viewport 375), iPhone 14 Pro (390), Pixel 7 (412), Galaxy Fold piegato (280).
- Test audio toggle: prima attivazione ≤ 500ms dopo il click (download + init).
- Test `prefers-reduced-motion`: canvas statico, no animation loop.

## Rischi noti

1. **Precompilazione JSX con Babel CLI** richiede `npx` disponibile; sul CI (GitHub Actions) c'è già Node. Sul locale Federico avrà bisogno di Node installato — verificare.
2. **Hamburger overlay** deve essere accessibile (focus trap, ESC, ARIA). Implementazione semplice ma facile da sbagliare.
3. **Canvas adattivo**: cambiare `NODE_COUNT` on-resize (es. rotazione tablet) richiede reinizializzare i nodi. Scelta: inizializzazione una tantum al load, nessun resize dinamico del grafo (solo del canvas size).
4. **Lazy sound**: il primo click ha latenza di download. Mitigazione: `<link rel="prefetch" href="sound.js">` al `requestIdleCallback` dopo il first paint.

## Unità di lavoro previste (preview per writing-plans)

1. Setup build step JSX + switch a React production
2. Mobile breakpoints CSS (768, 560, 380)
3. Hamburger menu (HTML + CSS + JS vanilla)
4. Canvas adattivo + reduced-motion + visibility pause
5. Lazy-load sound
6. Tipografia fluida + spacing system
7. Touch target audit + magnet disable
8. Test su device reali + Lighthouse
