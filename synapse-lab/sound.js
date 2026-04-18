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

  function buildGraphOnce() {
    if (started) return;
    buildDroneLayer();
    buildReverbBus();
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
})();
