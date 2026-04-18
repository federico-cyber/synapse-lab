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

if (import.meta.env.DEV) {
  // In dev: #main è vuoto, React crea il tree da zero.
  createRoot(rootEl).render(<App />);
} else {
  // In prod: lo snapshot ha riempito #main, hydrateRoot prende possesso del DOM.
  hydrateRoot(rootEl, <App />);
}
