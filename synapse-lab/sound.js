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
  }

  function stop() {
    if (!AC || !master) return;
    running = false;
    fadeMasterTo(0, FADE_OUT);
  }

  function toggle() { running ? stop() : start(); }
  function isOn() { return running; }

  window.__soundDebug = { moodLayers: () => moodLayers, setMood };
  window.__sound = { start, stop, toggle, isOn };
})();
