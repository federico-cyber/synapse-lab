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
  let master = null;       // masterGain → destination
  let reverbSend = null;   // bus input per mood/arpeggio/accenti, popolato da buildReverbBus()
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
      notes: [261.63, 329.63, 369.99, 392.00, 440.00], // C4, E4, F#4, G4, A4
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
      adsr: { a: 1.0, d: 0.2, s: 0.5, r: 1.5 },
      gain: 0.04,
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

  // ---------- StateController ----------
  // Orchestratore dei mood. setMood(name) crossfada tra mood in CROSSFADE_S.
  const CROSSFADE_S = 3.5;
  let currentMood = null;

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

  function setMood(name) {
    if (!started || !moodLayers[name]) return;
    if (currentMood === name) return;
    if (currentMood !== null) playWhoosh();

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
    arpLastNoteIdx = null; // cambia scala, matrice riparte pulita
  }

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

  let accentListenersInstalled = false;
  function installAccentListenersOnce() {
    if (accentListenersInstalled) return;
    installAccentListeners();
    accentListenersInstalled = true;
  }

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

  // ---------- DroneLayer ----------
  // Drone di base: 3 oscillatori detuned (C2, G2, C3) + lowpass con LFO lento.
  // Sempre attivo finché l'audio è on. Non passa per reverb.

  function buildDroneLayer() {
    const droneBus = AC.createGain();
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

  // ---------- ReverbBus ----------
  // IR procedurale: rumore bianco stereo decorrelato × exp decay.
  // 40 KB circa in RAM (3s × 2ch × 44.1kHz × 4byte). OK ovunque.

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

    const reverbOut = AC.createGain();
    reverbOut.gain.value = 0.7;    // wet level globale

    reverbSend.connect(convolver).connect(reverbOut).connect(master);
  }

  function buildGraphOnce() {
    if (started) return;
    buildDroneLayer();
    buildReverbBus();
    buildMoodLayers();
    started = true;
  }

  // ---------- API pubblica ----------
  function start() {
    if (!ensureContext()) return;
    if (AC.state === 'suspended') AC.resume();
    buildGraphOnce();
    running = true;
    fadeMasterTo(MASTER_TARGET, FADE_IN);
    if (!currentMood) setMood('melancholic');
    startObserver();
    startArpeggiator();
    installAccentListenersOnce();
  }

  function stop() {
    if (!AC || !master) return;
    running = false;
    stopArpeggiator();
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
    pendingMood = null;
    visibilityMuted = false;
    fadeMasterTo(0, FADE_OUT);
  }

  function toggle() { running ? stop() : start(); }
  function isOn() { return running; }

  // ---------- Lifecycle ----------
  // Il toggle iniziale è comunque off: questi gate servono a comportamenti
  // secondari come pausa su tab nascosta e rispetto reduced-motion.

  // isMobile(): helper disponibile per eventuali decisioni future.
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

  window.__sound = { start, stop, toggle, isOn };
})();
