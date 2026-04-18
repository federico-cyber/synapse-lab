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
})();
