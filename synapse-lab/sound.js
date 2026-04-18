/* ============================================================
   SYNAPSE LAB — ambient soundscape
   Lazy-initialised on first user gesture (autoplay policy).
   - Drone: 3 detuned oscillators → lowpass → slow LFO on filter
   - Synaptic ticks: short filtered noise bursts, random cadence
   - UI clicks: tiny transient on hover/click of [data-magnet] items
   Everything routed through a master gain that fades in/out when
   the navbar toggle is flipped.
   ============================================================ */
(function () {
  let AC = null;       // AudioContext
  let master = null;   // master GainNode
  let started = false;
  let running = false;
  let tickTimer = null;
  let droneNodes = [];

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

  function buildDrone() {
    // Three slightly detuned sines in low register, through a lowpass with LFO
    const freqs = [65.41, 98.00, 130.81]; // C2, G2, C3
    const bus = AC.createGain();
    bus.gain.value = 0.12;

    const lp = AC.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 520;
    lp.Q.value = 0.7;

    // LFO modulating the filter cutoff — slow breathing
    const lfo = AC.createOscillator();
    const lfoGain = AC.createGain();
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain).connect(lp.frequency);
    lfo.start();

    const oscs = freqs.map((f, i) => {
      const o = AC.createOscillator();
      o.type = i === 0 ? 'sine' : (i === 1 ? 'triangle' : 'sine');
      o.frequency.value = f;
      o.detune.value = (i - 1) * 4;
      const g = AC.createGain();
      g.gain.value = i === 0 ? 0.9 : (i === 1 ? 0.35 : 0.22);
      o.connect(g).connect(lp);
      o.start();
      return { o, g };
    });

    lp.connect(bus).connect(master);
    droneNodes = { oscs, lfo, lp, bus };
  }

  function tick() {
    if (!running) return;
    // Short filtered noise burst — a micro synaptic click
    const dur = 0.05 + Math.random() * 0.12;
    const buf = AC.createBuffer(1, Math.floor(AC.sampleRate * dur), AC.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      // white noise × fast exponential decay
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.4);
    }
    const src = AC.createBufferSource();
    src.buffer = buf;

    const bp = AC.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800 + Math.random() * 3400;
    bp.Q.value = 8;

    const g = AC.createGain();
    g.gain.value = 0.08 + Math.random() * 0.06;

    // slight stereo placement
    const pan = AC.createStereoPanner ? AC.createStereoPanner() : null;
    if (pan) pan.pan.value = (Math.random() * 2 - 1) * 0.7;

    src.connect(bp).connect(g);
    if (pan) g.connect(pan).connect(master);
    else g.connect(master);

    src.start();
    src.stop(AC.currentTime + dur + 0.05);

    // next tick in 2–7s
    tickTimer = setTimeout(tick, 2000 + Math.random() * 5000);
  }

  function uiClick(intensity) {
    if (!running || !AC) return;
    // Quick sine blip — magnet hover = soft, click = sharper
    const now = AC.currentTime;
    const o = AC.createOscillator();
    const g = AC.createGain();
    o.type = 'sine';
    const base = intensity === 'click' ? 880 : 1320;
    o.frequency.setValueAtTime(base * 1.4, now);
    o.frequency.exponentialRampToValueAtTime(base, now + 0.09);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(intensity === 'click' ? 0.12 : 0.04, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    o.connect(g).connect(master);
    o.start(now);
    o.stop(now + 0.22);
  }

  function start() {
    if (!ensureContext()) return;
    if (AC.state === 'suspended') AC.resume();
    if (!started) {
      buildDrone();
      started = true;
    }
    running = true;
    const now = AC.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0.55, now + 0.8);
    if (!tickTimer) tickTimer = setTimeout(tick, 1200);
  }

  function stop() {
    if (!AC || !master) return;
    running = false;
    const now = AC.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 0.45);
    if (tickTimer) { clearTimeout(tickTimer); tickTimer = null; }
  }

  // Wire up the navbar toggle
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('sound-toggle');
    if (!btn) return;

    // UI clicks — subtle feedback on magnet elements (only when sound is on)
    document.addEventListener('click', (e) => {
      const el = e.target && e.target.closest && e.target.closest('[data-magnet], a, button');
      if (el && el !== btn) uiClick('click');
    });
    document.addEventListener('mouseover', (e) => {
      const el = e.target && e.target.closest && e.target.closest('[data-magnet]');
      if (el && Math.random() < 0.25) uiClick('hover');
    });
  });

  window.__sound = { start, stop, toggle: () => (running ? stop() : start()), isOn: () => running };
})();
