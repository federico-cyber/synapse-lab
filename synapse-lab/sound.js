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
