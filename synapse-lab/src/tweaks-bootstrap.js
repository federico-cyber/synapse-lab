// Tweaks defaults + localStorage load.
// Gira PRIMA di React: popola window.TWEAKS e window.__saveTweaks.
// window.__forcedLang (opzionale) è settato da Puppeteer per snapshot EN.

const DEFAULT_TWEAKS = {
  lang: 'it',
  theme: 'dark',
  palette: 'blu',
  hero: 'bold-type',
  servicesLayout: 'grid-soft',
  butterflyDensity: 4,
  bubbleDensity: 20,
  cursor: 'synapse',
  grainOn: true,
  wireframe: false,
};

let saved = {};
try {
  saved = JSON.parse(localStorage.getItem('synapse.tweaks') || '{}');
} catch (e) {
  // localStorage bloccato (incognito, snapshot). Ignoriamo.
}

const forcedLang = typeof window !== 'undefined' && window.__forcedLang
  ? { lang: window.__forcedLang }
  : {};

window.TWEAKS = Object.assign({}, DEFAULT_TWEAKS, saved, forcedLang);

window.__saveTweaks = (t) => {
  try {
    localStorage.setItem('synapse.tweaks', JSON.stringify(t));
  } catch (e) {
    // quota piena / privacy mode — skip silenziosamente
  }
};
