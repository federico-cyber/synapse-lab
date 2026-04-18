// Vite entry point — importa tutto nell'ordine corretto e monta React.
import { createRoot, hydrateRoot } from 'react-dom/client';

// 1. TWEAKS defaults + localStorage (deve girare PRIMA di tutto)
import './tweaks-bootstrap.js';

// 2. Vanilla JS (definiscono window.__neural, __sound, __applyLang)
import './vanilla/cursor.js';
import './vanilla/neural.js';
import './vanilla/lang.js';
import './vanilla/sound.js';

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
