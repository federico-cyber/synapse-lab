// Vite entry point — importa tutto nell'ordine corretto e monta React.
import { createRoot, hydrateRoot } from 'react-dom/client';

// 1. TWEAKS defaults + localStorage (deve girare PRIMA di tutto)
import './tweaks-bootstrap.js';

// 2. Vanilla JS (definiscono window.__neural, __applyLang)
import './vanilla/cursor.js';
import './vanilla/neural.js';
import './vanilla/lang.js';

// sound.js: lazy-load — caricato al primo click del toggle (src/app.jsx).
// Prefetch opportunistico su idle per minimizzare latenza del primo click.
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => import('./vanilla/sound.js'), { timeout: 3000 });
}

// 3. CSS
import './style.css';

// 4. App root
import App from './app.jsx';

const rootEl = document.getElementById('main');

// Se #main ha già contenuto (snapshot Puppeteer o HTML pre-renderizzato in prod):
// usa hydrateRoot. Altrimenti (dev server o primo snapshot su dist/ vuoto): createRoot.
if (rootEl.children.length > 0) {
  hydrateRoot(rootEl, <App />);
} else {
  createRoot(rootEl).render(<App />);
}
