/* Tweaks panel — live design controls persisted to localStorage. */
import { useState } from 'react';

function Tweaks({ lang, onChange, state, onClose }) {
  const set = (patch) => onChange(patch);

  const swatches = [
    { k: 'cyan',   color: '#00E5FF' },
    { k: 'blu',    color: '#5AC8FF' },
    { k: 'violet', color: '#B293FF' },
    { k: 'dawn',   color: '#C81235' },
  ];

  const T = lang === 'en' ? {
    head: 'TWEAKS', palette: 'PALETTE', hero: 'HERO STYLE',
    services: 'SERVICES LAYOUT', butterflies: 'BUTTERFLIES',
    bubbles: 'BUBBLES', grain: 'GRAIN', theme: 'THEME',
    dark: 'DARK', light: 'LIGHT', on: 'ON', off: 'OFF',
    hi: ['Bold type', 'Editorial', 'Mono brutal'],
    sl: ['Soft grid', 'Rows', 'Cards'],
  } : {
    head: 'TWEAKS', palette: 'PALETTE', hero: 'STILE HERO',
    services: 'LAYOUT SERVIZI', butterflies: 'FARFALLE',
    bubbles: 'BOLLE', grain: 'GRANA', theme: 'TEMA',
    dark: 'SCURO', light: 'CHIARO', on: 'ON', off: 'OFF',
    hi: ['Type grasso', 'Editoriale', 'Mono brutal'],
    sl: ['Griglia soft', 'Righe', 'Card'],
  };

  return (
    <div className="tweaks">
      <div className="tweaks-head">
        <span><b>{T.head}</b> · {lang === 'en' ? 'live' : 'dal vivo'}</span>
        <button className="close" onClick={onClose} data-magnet>—</button>
      </div>
      <div className="tweaks-body">
        <div className="tw-group">
          <div className="tw-label"><span>{T.palette}</span><b>{state.palette}</b></div>
          <div className="tw-swatches">
            {swatches.map(s => (
              <button key={s.k} className={'tw-swatch ' + (state.palette === s.k ? 'active' : '')}
                style={{ background: s.color }} data-magnet
                onClick={() => set({ palette: s.k })}/>
            ))}
          </div>
        </div>

        <div className="tw-group">
          <div className="tw-label"><span>{T.hero}</span><b>{state.hero}</b></div>
          <div className="tw-opts">
            {['bold-type','editorial','brutal'].map((k, i) => (
              <button key={k} className={'tw-opt ' + (state.hero === k ? 'active' : '')} data-magnet
                onClick={() => set({ hero: k })}>{T.hi[i]}</button>
            ))}
          </div>
        </div>

        <div className="tw-group">
          <div className="tw-label"><span>{T.services}</span><b>{state.servicesLayout}</b></div>
          <div className="tw-opts">
            {['grid-soft','rows','cards'].map((k, i) => (
              <button key={k} className={'tw-opt ' + (state.servicesLayout === k ? 'active' : '')} data-magnet
                onClick={() => set({ servicesLayout: k })}>{T.sl[i]}</button>
            ))}
          </div>
        </div>

        <div className="tw-group">
          <div className="tw-label"><span>{T.theme}</span><b>{state.theme}</b></div>
          <div className="tw-opts">
            {['dark','light'].map(k => (
              <button key={k} className={'tw-opt ' + (state.theme === k ? 'active' : '')} data-magnet
                onClick={() => set({ theme: k })}>{k === 'dark' ? T.dark : T.light}</button>
            ))}
          </div>
        </div>

        <div className="tw-group">
          <div className="tw-label"><span>{T.grain}</span><b>{state.grainOn ? T.on : T.off}</b></div>
          <div className="tw-opts">
            <button className={'tw-opt ' + (state.grainOn ? 'active' : '')} data-magnet onClick={() => set({ grainOn: true })}>{T.on}</button>
            <button className={'tw-opt ' + (!state.grainOn ? 'active' : '')} data-magnet onClick={() => set({ grainOn: false })}>{T.off}</button>
          </div>
        </div>

        <div className="tw-group">
          <div className="tw-label"><span>SYN / DEBUG</span><b>{lang === 'en' ? 'press S Y N' : 'premi S Y N'}</b></div>
          <p style={{ fontSize: 11, color: 'var(--ink-dim)', fontFamily: 'var(--mono)' }}>
            {lang === 'en'
              ? 'Type S → Y → N anywhere to toggle wireframe mode.'
              : 'Digita S → Y → N ovunque per attivare la modalità wireframe.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function TweaksMount({ lang, state, onChange }) {
  const [open, setOpen] = useState(false);  // default collapsed in production
  if (!open) {
    return (
      <button className="tweaks-handle" data-magnet onClick={() => setOpen(true)}>
        <span className="dot"/> {lang === 'en' ? 'TWEAKS' : 'TWEAKS'}
      </button>
    );
  }
  return <Tweaks lang={lang} state={state} onChange={onChange} onClose={() => setOpen(false)} />;
}

export { TweaksMount };
