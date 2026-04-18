# Soundscape Evolutivo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Riscrivere `synapse-lab/sound.js` come soundscape ambient evolutivo con 3 mood, arpeggiatore generativo Markov, accenti interattivi e reverb procedurale, ispirato al soundtrack di No Man's Sky.

**Architecture:** IIFE monofile che espone `window.__sound` invariato. All'interno: `AudioEngine` (singleton AudioContext + masterGain), `ReverbBus` (ConvolverNode + IR procedurale), `DroneLayer` (drone di base sempre attivo), `MoodLayer` (3 istanze con crossfade), `Arpeggiator` (Markov per-mood), `AccentLayer` (hover/click/whoosh), `StateController` (IntersectionObserver → setMood).

**Tech Stack:** Vanilla JS, Web Audio API (AudioContext, OscillatorNode, BiquadFilterNode, ConvolverNode, DelayNode, StereoPannerNode), IntersectionObserver, matchMedia, Page Visibility API. Nessuna libreria esterna. Nessun build step (il progetto serve file diretti da HTTP).

**Testing strategy:** Il progetto non ha test runner. La verifica è **manuale via browser** a ogni task, usando DevTools Console e ascolto diretto. Servire via `python3 -m http.server 8000` dalla directory `synapse-lab/`.

**File convenzioni:**
- Tutto il codice dentro l'IIFE di `sound.js`
- Stile: ES2018 (funzioni normali, `let`/`const`, template literals), commenti IT su sezioni principali
- Commit messages in italiano come da storia recente (es. "Aggiunge", "Riscrive", "Aggiorna")

---

## File Structure

- **Modify:** `synapse-lab/sound.js` — riscrittura completa (~450 righe)
- **No changes:** `synapse-lab/index.html`, `synapse-lab/mount.jsx` (l'API `window.__sound` è invariata)
- **Spec di riferimento:** `synapse-lab/docs/superpowers/specs/2026-04-18-soundscape-evolutivo-design.md`

---

## Task 1: Scaffold nuovo `sound.js` con API stub

Sostituisce il contenuto del file con lo scheletro dell'IIFE, espone `window.__sound` con metodi no-op che logano. L'obiettivo è avere una baseline pulita senza rompere l'HTML (il toggle in navbar continua a chiamare start/stop/toggle/isOn senza errori).

**Files:**
- Modify: `synapse-lab/sound.js` (intero file)

- [ ] **Step 1: Sostituisci interamente `sound.js` con lo scaffold**

```js
/* ============================================================
   SYNAPSE LAB — soundscape evolutivo
   Architettura: AudioEngine → {DroneLayer, MoodLayer×3, Arpeggiator,
   AccentLayer} → dryBus + reverbBus → masterGain → destination.
   Mood guidato da scroll (IntersectionObserver sui capitoli).
   Arpeggi generativi via Markov chain per-mood.
   Riverbero procedurale via ConvolverNode con IR generata a runtime.
   Spec: docs/superpowers/specs/2026-04-18-soundscape-evolutivo-design.md
   ============================================================ */
(function () {
  'use strict';

  // ---------- Stato globale del modulo ----------
  let AC = null;           // AudioContext
  let master = null;       // masterGain
  let running = false;     // audio attualmente udibile
  let started = false;     // nodi costruiti almeno una volta

  // ---------- API pubblica (stub, implementata nei task successivi) ----------
  function start() {
    console.log('[sound] start() — stub');
    running = true;
  }

  function stop() {
    console.log('[sound] stop() — stub');
    running = false;
  }

  function toggle() { running ? stop() : start(); }
  function isOn() { return running; }

  window.__sound = { start, stop, toggle, isOn };
})();
```

- [ ] **Step 2: Verifica in browser che non ci siano errori**

Avvia server locale:
```bash
cd /Users/fede/Documents/siti-web/synapse-lab && python3 -m http.server 8000
```
Apri `http://localhost:8000`, apri DevTools Console. Click sul toggle SOUND in navbar.
Expected: compare `[sound] start() — stub` al primo click, `[sound] stop() — stub` al secondo. Nessun errore rosso.

- [ ] **Step 3: Commit**

```bash
git add synapse-lab/sound.js
git commit -m "Riscrive sound.js come scaffold per soundscape evolutivo"
```

---

## Task 2: AudioEngine core — AudioContext, masterGain, fade in/out

Implementa l'inizializzazione lazy dell'`AudioContext` (deve avvenire su gesture utente per autoplay policy), il `masterGain` con fade, e collega il toggle. Non c'è ancora suono, ma il grafo master è pronto.

**Files:**
- Modify: `synapse-lab/sound.js`

- [ ] **Step 1: Sostituisci il blocco "Stato globale" e "API pubblica" dello scaffold con questa versione più completa**

Cerca nel file la riga `// ---------- Stato globale del modulo ----------` e sostituisci tutto fino a `window.__sound = { start, stop, toggle, isOn };` (incluso) con:

```js
  // ---------- Stato globale del modulo ----------
  let AC = null;           // AudioContext
  let master = null;       // masterGain → destination
  let running = false;     // audio attualmente udibile
  let started = false;     // nodi costruiti almeno una volta

  const FADE_IN = 0.8;     // secondi
  const FADE_OUT = 0.45;
  const MASTER_TARGET = 0.55;

  // ---------- AudioEngine ----------
  function ensureContext() {
    if (AC) return AC;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    AC = new Ctx();
    master = AC.createGain();
    master.gain.value = 0;
    master.connect(AC.destination);
    return AC;
  }

  function fadeMasterTo(target, duration) {
    if (!AC || !master) return;
    const now = AC.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(target, now + duration);
  }

  function buildGraphOnce() {
    if (started) return;
    // I layer verranno costruiti nei task successivi.
    started = true;
  }

  // ---------- API pubblica ----------
  function start() {
    if (!ensureContext()) return;
    if (AC.state === 'suspended') AC.resume();
    buildGraphOnce();
    running = true;
    fadeMasterTo(MASTER_TARGET, FADE_IN);
  }

  function stop() {
    if (!AC || !master) return;
    running = false;
    fadeMasterTo(0, FADE_OUT);
  }

  function toggle() { running ? stop() : start(); }
  function isOn() { return running; }

  window.__sound = { start, stop, toggle, isOn };
```

- [ ] **Step 2: Verifica AudioContext viene creato**

Ricarica `http://localhost:8000`, apri DevTools Console. Incolla:
```js
window.__sound.start();
console.log('AC:', !!window.__sound);
```
Poi incolla (per verificare direttamente il context via una ricerca DOM alternativa):
```js
// Il context è incapsulato nell'IIFE; verifichiamo tramite effetto: state deve diventare running
window.__sound.start(); window.__sound.isOn();
```
Expected: `isOn()` ritorna `true` dopo `start()`, `false` dopo `stop()`. Nessun errore.

- [ ] **Step 3: Commit**

```bash
git add synapse-lab/sound.js
git commit -m "Aggiunge AudioEngine core con masterGain e fade in/out"
```

---

## Task 3: ReverbBus con IR procedurale

Crea il `ConvolverNode` con una impulse response generata al volo (noise stereo con decay esponenziale, 3s). Espone un nodo `reverbSend` (GainNode ingresso send) e routa l'uscita al master. Ancora nessuna sorgente lo alimenta.

**Files:**
- Modify: `synapse-lab/sound.js`

- [ ] **Step 1: Aggiungi il modulo ReverbBus prima di `buildGraphOnce`**

Cerca la riga `function buildGraphOnce() {` e inserisci SUBITO PRIMA:

```js
  // ---------- ReverbBus ----------
  // IR procedurale: rumore bianco stereo decorrelato × exp decay.
  // 40 KB circa in RAM (3s × 2ch × 44.1kHz × 4byte). OK ovunque.
  let reverbSend = null;
  let reverbOut = null;

  function buildImpulseResponse(durationSec, decay) {
    const len = Math.floor(AC.sampleRate * durationSec);
    const ir = AC.createBuffer(2, len, AC.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
      }
    }
    return ir;
  }

  function buildReverbBus() {
    const convolver = AC.createConvolver();
    convolver.buffer = buildImpulseResponse(3.0, 2.2);

    reverbSend = AC.createGain();
    reverbSend.gain.value = 1.0;   // i send esterni useranno il proprio gain

    reverbOut = AC.createGain();
    reverbOut.gain.value = 0.7;    // wet level globale

    reverbSend.connect(convolver).connect(reverbOut).connect(master);
  }
```

- [ ] **Step 2: Chiama `buildReverbBus()` dentro `buildGraphOnce`**

Sostituisci:
```js
  function buildGraphOnce() {
    if (started) return;
    // I layer verranno costruiti nei task successivi.
    started = true;
  }
```
con:
```js
  function buildGraphOnce() {
    if (started) return;
    buildReverbBus();
    // altri layer nei task successivi
    started = true;
  }
```

- [ ] **Step 3: Verifica smoke-test reverb**

Ricarica pagina, DevTools Console:
```js
window.__sound.start();
// Inietta un oscillatore temporaneo che passa per il reverb, per confermare che il convolver è connesso.
// (Hack di test: creiamo un nodo esterno e lo connettiamo al destination — verifica solo che non esplodi)
setTimeout(() => console.log('[test] reverb build ok, ctx state:', document.querySelector('body') && 'ok'), 200);
```
Expected: nessun errore. Siamo ancora silenziosi (non c'è nulla che invii al reverbSend). Questo è ok.

- [ ] **Step 4: Commit**

```bash
git add synapse-lab/sound.js
git commit -m "Aggiunge ReverbBus con IR procedurale"
```

---

## Task 4: DroneLayer — pad di base sempre attivo

Costruisce il drone (3 oscillatori detuned in registro basso, lowpass con LFO). Routa su `master` direttamente (il drone NON passa per reverb, per mantenersi netto come "basso continuo"). Al primo start, il drone deve essere udibile.

**Files:**
- Modify: `synapse-lab/sound.js`

- [ ] **Step 1: Aggiungi il modulo DroneLayer prima di `buildGraphOnce`**

Cerca `// ---------- ReverbBus ----------` e inserisci SUBITO PRIMA (così il DroneLayer sta prima del ReverbBus nel file):

```js
  // ---------- DroneLayer ----------
  // Drone di base: 3 oscillatori detuned (C2, G2, C3) + lowpass con LFO lento.
  // Sempre attivo finché l'audio è on. Non passa per reverb.
  let droneBus = null;

  function buildDroneLayer() {
    droneBus = AC.createGain();
    droneBus.gain.value = 0.12;

    const lp = AC.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 520;
    lp.Q.value = 0.7;

    const lfo = AC.createOscillator();
    const lfoGain = AC.createGain();
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain).connect(lp.frequency);
    lfo.start();

    const freqs = [65.41, 98.00, 130.81]; // C2, G2, C3
    freqs.forEach((f, i) => {
      const o = AC.createOscillator();
      o.type = i === 1 ? 'triangle' : 'sine';
      o.frequency.value = f;
      o.detune.value = (i - 1) * 4;
      const g = AC.createGain();
      g.gain.value = i === 0 ? 0.9 : (i === 1 ? 0.35 : 0.22);
      o.connect(g).connect(lp);
      o.start();
    });

    lp.connect(droneBus).connect(master);
  }
```

- [ ] **Step 2: Chiama `buildDroneLayer()` dentro `buildGraphOnce` PRIMA di `buildReverbBus()`**

Sostituisci il corpo di `buildGraphOnce`:
```js
  function buildGraphOnce() {
    if (started) return;
    buildDroneLayer();
    buildReverbBus();
    started = true;
  }
```

- [ ] **Step 3: Verifica audibile — il drone deve suonare**

Ricarica pagina. Click sul toggle SOUND. Ascolta con cuffie / volume medio.
Expected: dopo ~1s, si sente un drone grave, morbido, con filtro che "respira" lentamente. Cliccando di nuovo il toggle, fade-out in ~0.5s.

- [ ] **Step 4: Commit**

```bash
git add synapse-lab/sound.js
git commit -m "Aggiunge DroneLayer come basso continuo"
```

---

## Task 5: MoodLayer factory — 3 mood definitions

Crea la factory `makeMoodLayer(config)` e le 3 istanze: `melancholic`, `luminous`, `tense`. Tutti gli oscillatori partono subito ma con il loro `moodGain` a 0 (silenziosi finché un mood non viene selezionato). Ciascun mood ha un proprio bus che splitta tra dry e reverb send.

**Files:**
- Modify: `synapse-lab/sound.js`

- [ ] **Step 1: Aggiungi le definizioni mood e la factory PRIMA di `buildGraphOnce`**

Cerca `// ---------- DroneLayer ----------` e inserisci SUBITO PRIMA:

```js
  // ---------- MoodLayer ----------
  // Ogni mood ha una sua stanza sonora: oscillatori + filtro + bus.
  // moodGain parte a 0; lo StateController lo porta a 1 con crossfade.
  const MOODS_CONFIG = {
    melancholic: {
      oscillators: [
        { type: 'sine',     freq: 110.00, gain: 0.60, detune: -3 }, // A2
        { type: 'sine',     freq: 164.81, gain: 0.40, detune:  0 }, // E3
        { type: 'triangle', freq: 220.00, gain: 0.25, detune:  4 }, // A3
      ],
      filter: { type: 'lowpass', freq: 600, Q: 0.8, lfoRate: 0.07, lfoDepth: 120 },
    },
    luminous: {
      oscillators: [
        { type: 'sine',     freq: 523.25, gain: 0.45, detune:  0 }, // C5
        { type: 'sine',     freq: 659.25, gain: 0.35, detune:  3 }, // E5
        { type: 'sawtooth', freq: 783.99, gain: 0.15, detune: -5 }, // G5
      ],
      filter: { type: 'lowpass', freq: 3000, Q: 0.9, lfoRate: 0.12, lfoDepth: 400 },
      highpass: { freq: 200 },
    },
    tense: {
      oscillators: [
        { type: 'sine',     freq:  73.42, gain: 0.70, detune:  0 }, // D2
        { type: 'sawtooth', freq: 146.83, gain: 0.25, detune: -8 }, // D3
        { type: 'sawtooth', freq: 220.00, gain: 0.18, detune:  8 }, // A3
      ],
      filter: { type: 'lowpass', freq: 400, Q: 1.2, lfoRate: 0.5, lfoDepth: 80 },
    },
  };

  const moodLayers = {}; // { melancholic: {...}, luminous: {...}, tense: {...} }

  function makeMoodLayer(name, cfg) {
    const moodGain = AC.createGain();
    moodGain.gain.value = 0;

    // split dry/reverb
    const dryGain = AC.createGain();
    dryGain.gain.value = 0.7;
    const wetGain = AC.createGain();
    wetGain.gain.value = 0.6;

    moodGain.connect(dryGain).connect(master);
    moodGain.connect(wetGain).connect(reverbSend);

    // filtro principale + LFO
    const filt = AC.createBiquadFilter();
    filt.type = cfg.filter.type;
    filt.frequency.value = cfg.filter.freq;
    filt.Q.value = cfg.filter.Q;

    const lfo = AC.createOscillator();
    const lfoGain = AC.createGain();
    lfo.frequency.value = cfg.filter.lfoRate;
    lfoGain.gain.value = cfg.filter.lfoDepth;
    lfo.connect(lfoGain).connect(filt.frequency);
    lfo.start();

    // eventuale highpass (solo luminous)
    let input = filt;
    if (cfg.highpass) {
      const hp = AC.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = cfg.highpass.freq;
      input.connect(hp).connect(moodGain);
    } else {
      filt.connect(moodGain);
    }

    // oscillatori
    cfg.oscillators.forEach((o) => {
      const osc = AC.createOscillator();
      osc.type = o.type;
      osc.frequency.value = o.freq;
      osc.detune.value = o.detune;
      const g = AC.createGain();
      g.gain.value = o.gain;
      osc.connect(g).connect(filt);
      osc.start();
    });

    return { moodGain, filt };
  }

  function buildMoodLayers() {
    for (const name of Object.keys(MOODS_CONFIG)) {
      moodLayers[name] = makeMoodLayer(name, MOODS_CONFIG[name]);
    }
  }
```

- [ ] **Step 2: Chiama `buildMoodLayers()` in `buildGraphOnce` dopo `buildReverbBus()`**

```js
  function buildGraphOnce() {
    if (started) return;
    buildDroneLayer();
    buildReverbBus();
    buildMoodLayers();
    started = true;
  }
```

- [ ] **Step 3: Verifica i mood sono silenziosi ma udibili se forzati**

Ricarica pagina. Click toggle SOUND. DevTools Console:
```js
// Hack di test: accediamo ai mood tramite un side-effect temporaneo.
// Poiché moodLayers è dentro l'IIFE, non è accessibile da fuori.
// Invece testiamo che l'audio NON esploda: deve sentirsi solo il drone.
```
Expected: si sente ancora solo il drone (come Task 4). I mood sono costruiti ma tutti a gain 0. Nessun errore console.

- [ ] **Step 4: Espone temporaneamente `moodLayers` per debug (lo toglieremo in Task 12)**

In fondo all'IIFE, appena prima di `window.__sound = ...`, aggiungi:
```js
  window.__soundDebug = { moodLayers: () => moodLayers };
```

- [ ] **Step 5: Verifica via debug hook che i mood suonino se forzati**

DevTools Console, dopo aver cliccato SOUND:
```js
const ml = window.__soundDebug.moodLayers();
ml.melancholic.moodGain.gain.value = 0.5;
```
Expected: al comando, senti un pad minore sovrapporsi al drone. Porta a 0 per silenziarlo:
```js
ml.melancholic.moodGain.gain.value = 0;
ml.luminous.moodGain.gain.value = 0.5;
```
Expected: ora senti un pad molto più brillante e cristallino.
```js
ml.luminous.moodGain.gain.value = 0;
ml.tense.moodGain.gain.value = 0.5;
```
Expected: pad oscuro, pulsante, con LFO più evidente.

Se uno dei mood suona stonato o distorto, verifica le frequenze nella config — non procedere finché i 3 non suonano coerenti.

- [ ] **Step 6: Commit**

```bash
git add synapse-lab/sound.js
git commit -m "Aggiunge MoodLayer factory con 3 mood (melancholic, luminous, tense)"
```

---

## Task 6: StateController + crossfade manuale

Implementa `setMood(name)` che crossfada tra mood in 3.5s. Il mood corrente è tracciato in una variabile. Default: `melancholic` al primo start. Espone `setMood` via `__soundDebug` per test.

**Files:**
- Modify: `synapse-lab/sound.js`

- [ ] **Step 1: Aggiungi StateController dopo il blocco MoodLayer (prima di DroneLayer o dove logicamente torna)**

Cerca la riga `// ---------- DroneLayer ----------` e subito PRIMA inserisci:

```js
  // ---------- StateController ----------
  // Orchestratore dei mood. setMood(name) crossfada tra mood in CROSSFADE_S.
  const CROSSFADE_S = 3.5;
  let currentMood = null;

  function setMood(name) {
    if (!started || !moodLayers[name]) return;
    if (currentMood === name) return;

    const now = AC.currentTime;
    // fade-out mood uscente
    if (currentMood && moodLayers[currentMood]) {
      const g = moodLayers[currentMood].moodGain.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(0, now + CROSSFADE_S);
    }
    // fade-in mood entrante
    const gIn = moodLayers[name].moodGain.gain;
    gIn.cancelScheduledValues(now);
    gIn.setValueAtTime(gIn.value, now);
    gIn.linearRampToValueAtTime(1.0, now + CROSSFADE_S);

    currentMood = name;
  }
```

- [ ] **Step 2: Fai partire il mood di default in `start()`**

Nella funzione `start()`, dopo `fadeMasterTo(MASTER_TARGET, FADE_IN);`, aggiungi:
```js
    if (!currentMood) setMood('melancholic');
```

- [ ] **Step 3: Esponi `setMood` nel debug hook**

Sostituisci:
```js
  window.__soundDebug = { moodLayers: () => moodLayers };
```
con:
```js
  window.__soundDebug = { moodLayers: () => moodLayers, setMood };
```

- [ ] **Step 4: Verifica crossfade audibile**

Ricarica pagina. Click toggle SOUND. Dovresti sentire drone + pad melancholic emergere in ~3.5s.

DevTools Console:
```js
window.__soundDebug.setMood('luminous');
```
Expected: in 3.5 secondi il pad cambia da scuro a brillante, senza click o salti.

```js
window.__soundDebug.setMood('tense');
```
Expected: transizione fluida verso il pad pulsante scuro.

- [ ] **Step 5: Commit**

```bash
git add synapse-lab/sound.js
git commit -m "Aggiunge StateController con crossfade tra mood"
```

---

## Task 7: Whoosh al cambio mood

Aggiunge effetto transizione "whoosh" (rumore bianco filtrato con sweep discendente 4k→400 Hz in 900ms) emesso ogni volta che `setMood` cambia mood. Il whoosh va in prevalenza al reverb per risultare "spaziale".

**Files:**
- Modify: `synapse-lab/sound.js`

- [ ] **Step 1: Aggiungi la funzione `playWhoosh` prima di `setMood`**

Cerca `function setMood(name) {` e inserisci SUBITO PRIMA:

```js
  // Whoosh: noise con sweep lowpass, usato come transition stinger.
  function playWhoosh() {
    const now = AC.currentTime;
    const dur = 0.9;
    const buf = AC.createBuffer(1, Math.floor(AC.sampleRate * dur), AC.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      // forma d'onda: rumore × envelope campana
      const env = Math.sin(Math.PI * t);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const src = AC.createBufferSource();
    src.buffer = buf;

    const lp = AC.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(4000, now);
    lp.frequency.exponentialRampToValueAtTime(400, now + dur);
    lp.Q.value = 0.9;

    const dry = AC.createGain();
    dry.gain.value = 0.015;
    const wet = AC.createGain();
    wet.gain.value = 0.135; // 90% bias verso reverb

    src.connect(lp);
    lp.connect(dry).connect(master);
    lp.connect(wet).connect(reverbSend);
    src.start(now);
    src.stop(now + dur + 0.05);
  }
```

- [ ] **Step 2: Chiama `playWhoosh` dentro `setMood` quando cambia mood**

Nella funzione `setMood`, dopo `if (currentMood === name) return;` inserisci:
```js
    if (currentMood !== null) playWhoosh();
```
(La condizione `currentMood !== null` evita whoosh al primo avvio del sito — solo sui cambi reali.)

- [ ] **Step 3: Verifica audibile del whoosh**

Ricarica. Toggle SOUND. Dopo che il mood melancholic è stabile, console:
```js
window.__soundDebug.setMood('luminous');
```
Expected: senti un "whoosh" ampio (effetto respiro cinematografico) all'inizio del crossfade, poi il pad cambia.

```js
window.__soundDebug.setMood('tense');
```
Expected: whoosh diverso ma presente, sensazione di "passaggio di stanza".

- [ ] **Step 4: Commit**

```bash
git add synapse-lab/sound.js
git commit -m "Aggiunge whoosh transizione tra mood"
```

---

## Task 8: IntersectionObserver — scroll → mood

Collega lo scroll dei capitoli a `setMood()` via `IntersectionObserver`. Mapping: ch1/ch2/ch6 → melancholic, ch3/ch4/ch5 → luminous, ch7 → tense. Debounce 800ms per evitare flip-flop durante scroll veloci.

**Files:**
- Modify: `synapse-lab/sound.js`

- [ ] **Step 1: Aggiungi il modulo ScrollObserver dopo StateController**

Cerca `// ---------- StateController ----------` e scrolla fino alla fine del suo blocco (dopo la chiusura di `function setMood(...)`). Subito dopo inserisci:

```js
  // ---------- ScrollObserver ----------
  // Mapping capitolo → mood da design spec sezione 5.
  const CHAPTER_TO_MOOD = {
    ch1: 'melancholic',
    ch2: 'melancholic',
    ch3: 'luminous',
    ch4: 'luminous',
    ch5: 'luminous',
    ch6: 'melancholic',
    ch7: 'tense',
  };

  let observer = null;
  let pendingMood = null;
  let debounceTimer = null;

  function onIntersect(entries) {
    for (const e of entries) {
      if (e.isIntersecting && e.intersectionRatio >= 0.5) {
        const id = e.target.id;
        const mood = CHAPTER_TO_MOOD[id];
        if (!mood) continue;
        pendingMood = mood;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (running && pendingMood) setMood(pendingMood);
        }, 800);
        break;
      }
    }
  }

  function startObserver() {
    if (observer) return;
    const sections = Object.keys(CHAPTER_TO_MOOD)
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!sections.length) return;
    observer = new IntersectionObserver(onIntersect, { threshold: [0.5] });
    sections.forEach((s) => observer.observe(s));
  }
```

- [ ] **Step 2: Avvia l'observer in `start()` la prima volta**

Nella funzione `start()`, dopo `if (!currentMood) setMood('melancholic');`, aggiungi:
```js
    startObserver();
```

- [ ] **Step 3: Verifica scroll-driven mood**

Ricarica. Toggle SOUND. Scrolla lentamente attraverso tutte le sezioni.
Expected:
- ch1 (Hero) → pad melancholic
- Scroll a ch3 (Services) → whoosh, poi pad luminoso
- Scroll a ch4 (Process) → resta luminoso (niente whoosh, stesso mood)
- Scroll a ch6 (About) → whoosh, torna melancholic
- Scroll a ch7 (Contact) → whoosh, pad tense

Se lo scroll è veloce, il debounce 800ms deve evitare di scatenare più whoosh consecutivi.

- [ ] **Step 4: Commit**

```bash
git add synapse-lab/sound.js
git commit -m "Aggiunge IntersectionObserver per mood guidato da scroll"
```

---

## Task 9: Arpeggiator generativo — Markov chain per-mood

Aggiunge note singole generate proceduralmente: per ogni mood c'è una matrice Markov 5×5 sulle note della scala. Al cambio mood, lo scheduler dell'arpeggio riparte con la scala nuova.

**Files:**
- Modify: `synapse-lab/sound.js`

- [ ] **Step 1: Aggiungi il modulo Arpeggiator prima di StateController**

Cerca `// ---------- StateController ----------` e inserisci SUBITO PRIMA:

```js
  // ---------- Arpeggiator ----------
  // Per ogni mood: scala di 5 note + matrice Markov 5x5.
  // Timer randomizzato, probabilità di "suonare" per evitare uniformità.
  const ARP_CONFIG = {
    melancholic: {
      // A minor pentatonic, ottava media
      notes: [220.00, 261.63, 293.66, 329.63, 392.00], // A3, C4, D4, E4, G4
      matrix: [
        [0.10, 0.30, 0.25, 0.20, 0.15],
        [0.25, 0.10, 0.35, 0.20, 0.10],
        [0.15, 0.30, 0.05, 0.35, 0.15],
        [0.30, 0.20, 0.20, 0.05, 0.25],
        [0.40, 0.15, 0.15, 0.20, 0.10],
      ],
      intervalMs: () => 9000 + Math.random() * 5000, // 9-14s
      probability: 0.45,
      oscType: 'sine',
      adsr: { a: 2.0, d: 0.3, s: 0.6, r: 4.0 },
      gain: 0.14,
      fm: null,
    },
    luminous: {
      // C Lydian subset (C E F# G A)
      notes: [523.25, 659.25, 739.99, 783.99, 880.00], // C5, E5, F#5, G5, A5
      matrix: [
        [0.10, 0.25, 0.15, 0.30, 0.20],
        [0.20, 0.10, 0.25, 0.25, 0.20],
        [0.15, 0.30, 0.05, 0.25, 0.25],
        [0.25, 0.15, 0.20, 0.10, 0.30],
        [0.30, 0.20, 0.20, 0.25, 0.05],
      ],
      intervalMs: () => 5000 + Math.random() * 4000, // 5-9s
      probability: 0.65,
      oscType: 'sine',
      adsr: { a: 1.5, d: 0.2, s: 0.7, r: 3.0 },
      gain: 0.11,
      fm: { ratio: 3.5, depth: 60 }, // carattere bell-like
    },
    tense: {
      // D Phrygian subset (D Eb F G A) in ottava bassa
      notes: [146.83, 155.56, 174.61, 196.00, 220.00], // D3, Eb3, F3, G3, A3
      matrix: [
        [0.10, 0.35, 0.20, 0.15, 0.20],
        [0.40, 0.05, 0.30, 0.15, 0.10],
        [0.25, 0.25, 0.10, 0.20, 0.20],
        [0.20, 0.20, 0.15, 0.10, 0.35],
        [0.25, 0.15, 0.20, 0.30, 0.10],
      ],
      intervalMs: () => 11000 + Math.random() * 7000, // 11-18s
      probability: 0.30,
      oscType: 'sawtooth',
      adsr: { a: 2.5, d: 0.4, s: 0.5, r: 3.5 },
      gain: 0.09,
      fm: null,
    },
  };

  let arpTimer = null;
  let arpLastNoteIdx = null;

  function pickNextNote(matrix, lastIdx) {
    if (lastIdx === null) return Math.floor(Math.random() * matrix.length);
    const row = matrix[lastIdx];
    const r = Math.random();
    let acc = 0;
    for (let i = 0; i < row.length; i++) {
      acc += row[i];
      if (r <= acc) return i;
    }
    return row.length - 1;
  }

  function playArpNote(cfg, noteIdx) {
    const now = AC.currentTime;
    const freq = cfg.notes[noteIdx];
    const { a, d, s, r } = cfg.adsr;
    const total = a + d + r + 0.1;

    const osc = AC.createOscillator();
    osc.type = cfg.oscType;
    osc.frequency.value = freq;

    // opzionale FM modulator (per luminous bell)
    if (cfg.fm) {
      const mod = AC.createOscillator();
      const modGain = AC.createGain();
      mod.frequency.value = freq * cfg.fm.ratio;
      modGain.gain.value = cfg.fm.depth;
      mod.connect(modGain).connect(osc.frequency);
      mod.start(now);
      mod.stop(now + total);
    }

    const env = AC.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(cfg.gain, now + a);
    env.gain.linearRampToValueAtTime(cfg.gain * s, now + a + d);
    env.gain.linearRampToValueAtTime(0.0001, now + a + d + r);

    // delay stereo leggero (L=375ms R=380ms)
    const delayL = AC.createDelay();
    delayL.delayTime.value = 0.375;
    const delayR = AC.createDelay();
    delayR.delayTime.value = 0.380;
    const fbL = AC.createGain(); fbL.gain.value = 0.35;
    const fbR = AC.createGain(); fbR.gain.value = 0.35;
    delayL.connect(fbL).connect(delayL);
    delayR.connect(fbR).connect(delayR);

    const dry = AC.createGain(); dry.gain.value = 0.7;
    const wet = AC.createGain(); wet.gain.value = 0.3;

    osc.connect(env);
    env.connect(dry).connect(master);
    env.connect(delayL).connect(wet).connect(reverbSend);
    env.connect(delayR).connect(wet); // stesso send

    osc.start(now);
    osc.stop(now + total);
  }

  function arpTick() {
    if (!running || !currentMood) { arpTimer = null; return; }
    const cfg = ARP_CONFIG[currentMood];
    if (cfg && Math.random() < cfg.probability) {
      const idx = pickNextNote(cfg.matrix, arpLastNoteIdx);
      playArpNote(cfg, idx);
      arpLastNoteIdx = idx;
    }
    arpTimer = setTimeout(arpTick, cfg.intervalMs());
  }

  function startArpeggiator() {
    if (arpTimer) return;
    arpTimer = setTimeout(arpTick, 3000); // breve delay iniziale
  }

  function stopArpeggiator() {
    if (arpTimer) { clearTimeout(arpTimer); arpTimer = null; }
    arpLastNoteIdx = null;
  }
```

- [ ] **Step 2: Avvia/ferma l'arpeggiator in `start()` e `stop()`**

In `start()`, dopo `startObserver();` aggiungi:
```js
    startArpeggiator();
```

In `stop()`, dopo `running = false;` aggiungi:
```js
    stopArpeggiator();
```

- [ ] **Step 3: Reset `arpLastNoteIdx` al cambio mood**

Nel corpo di `setMood(name)`, dopo `currentMood = name;` aggiungi:
```js
    arpLastNoteIdx = null; // cambia scala, matrice riparte pulita
```

- [ ] **Step 4: Verifica arpeggi audibili**

Ricarica. Toggle SOUND. Aspetta 30-60 secondi sul ch1 (melancholic).
Expected: di tanto in tanto, note singole emergono sopra il pad, con reverb lungo. Non suonano stonate. Probabilità 45% × interval 9-14s → circa 1 nota ogni 20-30s.

Scrolla al ch3 (luminous).
Expected: note più frequenti, più alte, con timbro "bell-like" (per via della FM).

Scrolla al ch7 (tense).
Expected: note rade, basse, sawtooth filtrato, senso di attesa.

Se senti stonature, verifica che le frequenze nelle scale corrispondano agli accordi del `MoodLayer` corrispondente (lo fanno: melancholic pad è A-E-A, scala A minor pent parte da A).

- [ ] **Step 5: Commit**

```bash
git add synapse-lab/sound.js
git commit -m "Aggiunge arpeggiatore generativo Markov per-mood"
```

---

## Task 10: AccentLayer — shimmer hover, blip click, rate limiter

Reintroduce il feedback UI perso nella riscrittura: shimmer su hover `[data-magnet]` (probabilità 30%), blip su click di `a/button/[data-magnet]`. Rate limiter globale a 3/sec con velocity compensation.

**Files:**
- Modify: `synapse-lab/sound.js`

- [ ] **Step 1: Aggiungi il modulo AccentLayer prima di ScrollObserver**

Cerca `// ---------- ScrollObserver ----------` e inserisci SUBITO PRIMA:

```js
  // ---------- AccentLayer ----------
  // Feedback UI: shimmer su hover dei magnet (30%), blip su click.
  // Rate limiter globale 3/sec + velocity compensation.
  const ACCENT_WINDOW_MS = 500;
  const ACCENT_MAX_PER_SEC = 3;
  let recentAccents = []; // timestamps ms

  function rateOk() {
    const now = performance.now();
    recentAccents = recentAccents.filter((t) => now - t < 1000);
    if (recentAccents.length >= ACCENT_MAX_PER_SEC) return false;
    recentAccents.push(now);
    return true;
  }

  function velocityFactor() {
    const now = performance.now();
    const recent = recentAccents.filter((t) => now - t < ACCENT_WINDOW_MS);
    return recent.length >= 2 ? 0.6 : 1.0;
  }

  function playShimmer() {
    if (!running || !rateOk()) return;
    const now = AC.currentTime;
    const baseFreq = 2000 + Math.random() * 1000; // 2-3 kHz
    const detune = (Math.random() * 2 - 1) * 15;  // ±15 cent
    const gainPeak = 0.04 * velocityFactor();

    const osc = AC.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = baseFreq;
    osc.detune.value = detune;

    const env = AC.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(gainPeak, now + 0.08);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);

    const dry = AC.createGain(); dry.gain.value = 0.7;
    const wet = AC.createGain(); wet.gain.value = 0.3;

    osc.connect(env);
    env.connect(dry).connect(master);
    env.connect(wet).connect(reverbSend);

    osc.start(now);
    osc.stop(now + 0.55);
  }

  function playBlip() {
    if (!running || !rateOk()) return;
    const now = AC.currentTime;
    const gainPeak = 0.10 * velocityFactor();

    const osc = AC.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, now); // ottava sopra
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

    const env = AC.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(gainPeak, now + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.20);

    const dry = AC.createGain(); dry.gain.value = 0.7;
    const wet = AC.createGain(); wet.gain.value = 0.3;

    osc.connect(env);
    env.connect(dry).connect(master);
    env.connect(wet).connect(reverbSend);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  function installAccentListeners() {
    document.addEventListener('mouseover', (e) => {
      const el = e.target && e.target.closest && e.target.closest('[data-magnet]');
      if (!el) return;
      if (Math.random() < 0.30) playShimmer();
    });
    document.addEventListener('click', (e) => {
      const el = e.target && e.target.closest && e.target.closest('a, button, [data-magnet]');
      if (!el) return;
      if (el.id === 'sound-toggle') return; // non accentiamo il toggle del suono
      playBlip();
    });
  }
```

- [ ] **Step 2: Installa i listener una sola volta al primo `start()`**

Vicino a `startObserver();` in `start()`, aggiungi:
```js
    installAccentListenersOnce();
```

Poi in cima alla sezione AccentLayer (dopo il blocco `function installAccentListeners()`), aggiungi:
```js
  let accentListenersInstalled = false;
  function installAccentListenersOnce() {
    if (accentListenersInstalled) return;
    installAccentListeners();
    accentListenersInstalled = true;
  }
```

- [ ] **Step 3: Verifica accenti audibili**

Ricarica. Toggle SOUND. Muovi il mouse sugli elementi con `data-magnet` (logo, nav buttons, link hero).
Expected: ogni tanto senti uno shimmer breve e alto. Non è invadente.

Clicca su un link "Inizia un progetto".
Expected: senti un blip discendente tonale.

Clicca 5 link rapidamente.
Expected: senti max 3 blip nel primo secondo, il resto viene scartato; i blip udibili sono più sommessi (velocity compensation).

- [ ] **Step 4: Commit**

```bash
git add synapse-lab/sound.js
git commit -m "Aggiunge AccentLayer con shimmer, blip e rate limiter"
```

---

## Task 11: Lifecycle gates — mobile default-off, reduced-motion, Page Visibility

Aggiunge:
- Rilevamento mobile (`pointer: coarse`) — nessun comportamento diverso necessario (default già off)
- Rispetto `prefers-reduced-motion: reduce` (nessun autostart, ma toggle resta disponibile)
- Page Visibility API: fade-out/in su tab hidden/visible

**Files:**
- Modify: `synapse-lab/sound.js`

- [ ] **Step 1: Aggiungi il modulo Lifecycle alla fine, prima di `window.__sound = ...`**

Cerca `window.__sound = { start, stop, toggle, isOn };` e inserisci SUBITO PRIMA:

```js
  // ---------- Lifecycle ----------
  // Il toggle iniziale è comunque off: questi gate servono a comportamenti
  // secondari come pausa su tab nascosta e rispetto reduced-motion.

  // isMobile(): esporlo tramite __soundDebug per eventuali decisioni future.
  function isMobile() {
    return window.matchMedia && matchMedia('(pointer: coarse)').matches;
  }

  function prefersReducedMotion() {
    return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Page Visibility: quando la tab torna in background, abbassiamo il master;
  // al ritorno, se running, lo riportiamo a target.
  let visibilityMuted = false;
  document.addEventListener('visibilitychange', () => {
    if (!AC || !master) return;
    if (document.hidden) {
      if (running) {
        visibilityMuted = true;
        fadeMasterTo(0, 0.5);
      }
    } else {
      if (visibilityMuted && running) {
        fadeMasterTo(MASTER_TARGET, 0.5);
        visibilityMuted = false;
      }
    }
  });
```

- [ ] **Step 2: Early-return in `start()` se reduced-motion e primo avvio non era manuale**

La richiesta della spec è: **toggle resta disponibile manualmente** anche con `prefers-reduced-motion: reduce`. Dato che `start()` è chiamata solo dal click del toggle (in `mount.jsx`), **non serve gate**: l'utente sta attivando consapevolmente. Quindi questo step è un **no-op intenzionale** — verifica solo che sia così rileggendo `mount.jsx:60-74`: `start()` non viene mai chiamato senza click utente.

Nessuna modifica al codice. Se in futuro dovessi aggiungere un auto-start, metteresti un gate `if (prefersReducedMotion()) return;` in cima a `start()`.

- [ ] **Step 3: Esponi i helper nel debug hook**

Sostituisci:
```js
  window.__soundDebug = { moodLayers: () => moodLayers, setMood };
```
con:
```js
  window.__soundDebug = { moodLayers: () => moodLayers, setMood, isMobile, prefersReducedMotion };
```

- [ ] **Step 4: Verifica Page Visibility**

Ricarica. Toggle SOUND. Audio parte. Cambia tab (Cmd+T o click su altra tab).
Expected: audio scompare in ~500ms.

Torna sulla tab originale.
Expected: audio riappare in ~500ms senza click/pop.

- [ ] **Step 5: Verifica mobile default-off**

Se hai un dispositivo mobile o puoi simulare in DevTools (Cmd+Shift+M → iPhone), apri `http://<tuo-ip>:8000` e osserva il toggle SOUND: deve mostrare "OFF". Non deve partire automaticamente. Il tap sul toggle deve far partire l'audio regolarmente.

**Nota**: il default-off è già gestito dall'HTML (`body[data-sound]` parte senza attributo → OFF). Non serve logica JS specifica.

- [ ] **Step 6: Commit**

```bash
git add synapse-lab/sound.js
git commit -m "Aggiunge lifecycle gates (Page Visibility, mobile, reduced-motion)"
```

---

## Task 12: Cleanup finale + test checklist completo

Rimuove il debug hook `window.__soundDebug`, verifica che il file sia pulito, esegue la checklist completa di test della spec.

**Files:**
- Modify: `synapse-lab/sound.js`

- [ ] **Step 1: Rimuovi `window.__soundDebug`**

Cerca la riga:
```js
  window.__soundDebug = { moodLayers: () => moodLayers, setMood, isMobile, prefersReducedMotion };
```
e **cancellala**. Il file deve avere solo `window.__sound = { start, stop, toggle, isOn };` come API pubblica.

- [ ] **Step 2: Verifica nessun `console.log` residuo**

Apri `synapse-lab/sound.js` e scorrilo. Rimuovi eventuali `console.log` di debug lasciati nei task precedenti. Gli unici log accettati sono `console.warn` in casi realmente anomali (attualmente nessuno richiesto).

- [ ] **Step 3: Verifica conteggio righe**

Ricarica pagina. In terminale:
```bash
wc -l synapse-lab/sound.js
```
Expected: ~450 righe (±50 accettabile). Se è molto sopra 550 o sotto 350, rileggere il file per verificare che nessuna sezione sia andata persa o duplicata.

- [ ] **Step 4: Test manuale completo (spec §11)**

Ricarica. Esegui in ordine, segnando ognuna mentalmente:

- [ ] Toggle on da desktop: drone parte con fade-in, nessun click/pop
- [ ] Scroll lento attraverso ch1→ch7: mood cambiano correttamente con whoosh
- [ ] Arpeggiatore: dopo 1-2 min su una sezione, note emergono casualmente, nessuna stonatura
- [ ] Hover su logo, nav buttons, `[data-magnet]`: shimmer discreto, non invadente
- [ ] Click rapidi (5+ in 2s) su link: rate limiter evita saturazione, max 3/s
- [ ] Toggle off: fade-out in ~0.5s, nessun audio residuo
- [ ] Tab in background (Cmd+T nuova tab): audio fade-out, al ritorno fade-in
- [ ] Firefox: tutto come su Chrome, nessun errore console
- [ ] Safari desktop: tutto come sopra
- [ ] Mobile simulato (DevTools iPhone): toggle visibile, audio parte al tap
- [ ] `prefers-reduced-motion: reduce` (DevTools → Rendering → Emulate CSS media feature): audio non parte da solo, toggle funziona manualmente
- [ ] Performance (DevTools → Performance, record 10s con audio attivo): main thread <5% CPU, nessuna memory leak evidente
- [ ] Grafico nodi (DevTools → Memory → Heap snapshot dopo 5 minuti di uso): nessuna crescita anomala di oggetti `AudioNode`

Se un test fallisce, **non committare** e tornare al task corrispondente per diagnosticare.

- [ ] **Step 5: Commit finale**

```bash
git add synapse-lab/sound.js
git commit -m "Rimuove debug hook e completa soundscape evolutivo"
```

- [ ] **Step 6: Push**

```bash
git push
```

---

## Self-Review

**Spec coverage:**
- §2 requisiti alto livello: tutti coperti (3 mood T5, scroll+interazioni T8+T10, texture+arpeggi T5+T9, master gain ~0.55 T2, default off mobile HTML+T11, API invariata T1-T12, degradation T2 `ensureContext`, reduced-motion T11)
- §3 architettura: moduli tutti implementati (T2 AudioEngine, T3 ReverbBus, T4 DroneLayer, T5 MoodLayer, T6 StateController, T8 ScrollObserver, T9 Arpeggiator, T10 AccentLayer, T11 Lifecycle)
- §4 tre mood: T5 definisce oscillatori/filtri, T9 definisce scale e Markov per arpeggi
- §5 mapping chapter→mood: T8 `CHAPTER_TO_MOOD`
- §6 crossfade 3.5s + whoosh: T6 `CROSSFADE_S`, T7 `playWhoosh`
- §7 accenti: T10 shimmer+blip+rate limiter (whoosh solo su mood change come da spec, non su scroll rapido — §13 scroll-air era out of scope)
- §8 mobile: T11 `isMobile`, default-off già in HTML
- §9 accessibility + visibility: T11 (reduced-motion è no-op per design — toggle manuale)
- §10 API invariata: T1 e mantenuta T12
- §11 testing: T12 checklist
- §13 out of scope: nessuno introdotto

**Placeholder scan:** Nessun TBD/TODO/placeholder. Tutti i blocchi codice sono completi e incollabili. Gli step di verifica contengono comandi esatti.

**Type consistency:**
- `moodLayers[name].moodGain.gain` usato in T6 e T10 → consistente con la factory T5 che ritorna `{ moodGain, filt }`
- `reverbSend` (GainNode) usato in T3, T5, T7, T9, T10 → sempre come ingresso, mai confuso con `reverbOut`
- `CHAPTER_TO_MOOD` (T8) combacia con i nomi definiti in `MOODS_CONFIG` (T5) e `ARP_CONFIG` (T9): `melancholic`, `luminous`, `tense`
- API `window.__sound.{start, stop, toggle, isOn}` invariata da T1 a T12 ✓
- `running` flag letto da Arpeggiator (T9) e AccentLayer (T10), settato da start/stop (T2) ✓
