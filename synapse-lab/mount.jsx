/* Root mount: language, theme, tweaks state, nav behaviour, rail clock,
   scroll reveals, sound toggle, SYN easter egg. */
const { useState, useEffect } = React;

function App() {
  const [lang, setLang] = useState(window.TWEAKS.lang || 'it');
  const [tweaks, setTweaks] = useState({ ...window.TWEAKS });

  window.__lang = lang;

  // Apply top-level attributes whenever tweaks change
  useEffect(() => {
    document.body.setAttribute('data-palette', tweaks.palette);
    document.body.setAttribute('data-theme', tweaks.theme);
    document.body.setAttribute('data-grain', tweaks.grainOn ? 'on' : 'off');
    document.body.setAttribute('data-wireframe', tweaks.wireframe ? 'true' : 'false');
    if (window.__neural) window.__neural.refresh();
    if (window.__saveTweaks) window.__saveTweaks(tweaks);
  }, [tweaks]);

  // Language swap on static markup
  useEffect(() => {
    document.body.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang);
    window.__lang = lang;
    if (window.__applyLang) window.__applyLang(lang);
  }, [lang]);

  const updateTweaks = (patch) => {
    setTweaks(prev => {
      const next = { ...prev, ...patch };
      if (patch.lang) setLang(patch.lang);
      return next;
    });
  };

  // Nav scroll buttons
  useEffect(() => {
    const btns = document.querySelectorAll('[data-scroll-to]');
    const onClick = (e) => {
      const sel = e.currentTarget.getAttribute('data-scroll-to');
      const el = document.querySelector(sel);
      if (el) window.scrollTo({ top: el.offsetTop - 40, behavior: 'smooth' });
    };
    btns.forEach(b => b.addEventListener('click', onClick));
    return () => btns.forEach(b => b.removeEventListener('click', onClick));
  }, [lang]);

  // Language toggle
  useEffect(() => {
    const b = document.getElementById('lang-toggle');
    const toggle = () => setLang(lang === 'it' ? 'en' : 'it');
    if (b) b.addEventListener('click', toggle);
    return () => { if (b) b.removeEventListener('click', toggle); };
  }, [lang]);

  // Sound toggle (visual only — no actual audio wired up to avoid surprise autoplay)
  useEffect(() => {
    const b = document.getElementById('sound-toggle');
    if (!b) return;
    const toggle = () => {
      const on = document.body.getAttribute('data-sound') === 'on';
      document.body.setAttribute('data-sound', on ? 'off' : 'on');
      const s = b.querySelector('.sound-state');
      if (s) s.textContent = on ? 'OFF' : 'ON';
    };
    b.addEventListener('click', toggle);
    return () => b.removeEventListener('click', toggle);
  }, []);

  // CTA copy updates on language change
  useEffect(() => {
    if (window.__applyLang) window.__applyLang(lang);
  }, [lang, tweaks]);

  // Scroll reveals
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('in');
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [lang, tweaks.servicesLayout, tweaks.hero]);

  // Chapter progress rail
  useEffect(() => {
    const fill = document.getElementById('rail-fill');
    const chNum = document.getElementById('rail-chapter');
    const sections = () => Array.from(document.querySelectorAll('.chapter'));
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? window.scrollY / h : 0;
      if (fill) fill.style.width = (p * 100) + '%';
      const secs = sections();
      const y = window.scrollY + window.innerHeight * 0.45;
      let cur = 0;
      for (let i = 0; i < secs.length; i++) {
        if (secs[i].offsetTop <= y) cur = i;
      }
      if (chNum) chNum.textContent = String(cur + 1).padStart(2, '0');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Clock
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const t = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      const el = document.getElementById('rail-clock');
      if (el) el.textContent = t + ' CEST';
    };
    tick();
    const iv = setInterval(tick, 30000);
    return () => clearInterval(iv);
  }, []);

  // SYN easter egg — type S → Y → N to toggle wireframe
  useEffect(() => {
    const seq = ['s','y','n'];
    let idx = 0, lastT = 0;
    const onKey = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      const k = (e.key || '').toLowerCase();
      const now = Date.now();
      if (now - lastT > 1500) idx = 0;
      lastT = now;
      if (k === seq[idx]) {
        idx++;
        if (idx === seq.length) {
          idx = 0;
          const next = !tweaks.wireframe;
          updateTweaks({ wireframe: next });
          const toast = document.getElementById('debug-toast');
          if (toast) toast.hidden = !next;
        }
      } else {
        idx = k === seq[0] ? 1 : 0;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tweaks.wireframe]);

  return (
    <>
      <ChapterHero lang={lang} />
      <ChapterManifesto lang={lang} />
      <ChapterServices lang={lang} />
      <ChapterProcess lang={lang} />
      <ChapterStack lang={lang} />
      <ChapterAbout lang={lang} />
      <ChapterContact lang={lang} theme={tweaks.theme}
        onToggleTheme={() => updateTweaks({ theme: tweaks.theme === 'light' ? 'dark' : 'light' })}/>
      <TweaksPortal lang={lang} state={tweaks} onChange={updateTweaks}/>
    </>
  );
}

function TweaksPortal({ lang, state, onChange }) {
  const mount = document.getElementById('tweaks-mount');
  if (!mount) return null;
  return ReactDOM.createPortal(
    <TweaksMount lang={lang} state={state} onChange={onChange} />,
    mount
  );
}

const root = ReactDOM.createRoot(document.getElementById('main'));
root.render(<App />);

window.addEventListener('DOMContentLoaded', () => {
  if (window.__applyLang) window.__applyLang(window.TWEAKS.lang || 'it');
});
