/* ============================================================
   SYNAPSE LAB — neural network canvas background
   A persistent, scroll-reactive particle graph.
   Nodes float, connections draw bezier curves, synaptic pulses
   travel along edges. The scene "morphs" per chapter: node
   layout, density and motion shift as the user scrolls.
   Palette is read from CSS custom props, so it follows the theme.
   ============================================================ */
(function () {
  const canvas = document.getElementById('neural');
  const ctx = canvas.getContext('2d', { alpha: true });
  let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);

  // Read current palette from CSS so scene matches theme/tweaks
  function readPalette() {
    const s = getComputedStyle(document.body);
    return {
      bg:      s.getPropertyValue('--bg-0').trim() || '#05060B',
      ink:     s.getPropertyValue('--ink').trim() || '#EDEAE0',
      accent:  s.getPropertyValue('--accent').trim() || '#5AC8FF',
      accent2: s.getPropertyValue('--accent-2').trim() || '#2D6CFF',
      hot:     s.getPropertyValue('--accent-hot').trim() || '#FF3B5C',
    };
  }
  let PAL = readPalette();

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // Mouse tracking for local deformation
  const mouse = { x: W/2, y: H/2, has: false };
  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.has = true;
  });
  window.addEventListener('mouseleave', () => { mouse.has = false; });

  // Scroll-driven chapter morph (7 chapters → 6 segments)
  let scrollRatio = 0;
  let chapterRatio = 0;
  function updateScroll() {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    scrollRatio = h > 0 ? Math.max(0, Math.min(1, window.scrollY / h)) : 0;
    chapterRatio = scrollRatio * 6;
  }
  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  // ---- Nodes ----
  const NODE_COUNT = 62;
  const nodes = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    const r = Math.pow(Math.random(), 0.7) * 0.46 + 0.04;
    const a = Math.random() * Math.PI * 2;
    nodes.push({
      hx: 0.5 + Math.cos(a) * r,
      hy: 0.5 + Math.sin(a) * r * 0.8,
      x: 0, y: 0,
      px: Math.random() * 1000, py: Math.random() * 1000,
      size: 0.6 + Math.random() * 1.4,
      strength: 0.5 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      hot: Math.random() < 0.08,
    });
  }

  // Precompute edges (k-nearest graph in home space)
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    const di = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const dx = nodes[i].hx - nodes[j].hx;
      const dy = nodes[i].hy - nodes[j].hy;
      di.push({ j, d: Math.sqrt(dx*dx + dy*dy) });
    }
    di.sort((a,b) => a.d - b.d);
    const K = 2 + (Math.random() < 0.4 ? 1 : 0);
    for (let k = 0; k < K; k++) {
      const j = di[k].j;
      if (!edges.find(e => (e.a === i && e.b === j) || (e.a === j && e.b === i))) {
        edges.push({ a: i, b: j, len: di[k].d, ctrl: (Math.random() - 0.5) * 0.08 });
      }
    }
  }

  // ---- Pulses (synaptic travellers) ----
  const pulses = [];
  function spawnPulse() {
    const e = edges[(Math.random() * edges.length) | 0];
    pulses.push({ e, t: 0, speed: 0.0018 + Math.random() * 0.004, hot: Math.random() < 0.1 });
  }

  // ---- Chapter-specific layout modifiers ----
  // 7 poses for 7 chapters
  function layoutFor(t) {
    const chapter = Math.floor(t);
    const frac = t - chapter;
    const poses = [
      poseCloud,    // 0: hero
      poseLine,     // 1: manifesto
      poseOrbit4,   // 2: services
      poseSpine,    // 3: process
      poseRings,    // 4: stack
      poseFocus,    // 5: about
      poseExplode,  // 6: contact
    ];
    const A = poses[Math.max(0, Math.min(6, chapter))];
    const B = poses[Math.max(0, Math.min(6, chapter + 1))];
    return (i, node) => {
      const a = A(i, node);
      const b = B(i, node);
      const k = easeInOut(frac);
      return {
        x: a.x * (1-k) + b.x * k,
        y: a.y * (1-k) + b.y * k,
        s: (a.s ?? 1) * (1-k) + (b.s ?? 1) * k,
      };
    };
  }
  function easeInOut(x) { return x < 0.5 ? 2*x*x : 1 - Math.pow(-2*x + 2, 2) / 2; }

  function poseCloud(i, n) {
    return { x: n.hx, y: n.hy, s: 1 };
  }
  function poseLine(i, n) {
    const row = (i % 5) / 5;
    return { x: n.hx * 0.5 + 0.25, y: 0.4 + row * 0.2 + (n.hy - 0.5) * 0.2, s: 1 };
  }
  function poseOrbit4(i, n) {
    const group = i % 4;
    const cx = 0.25 + (group % 2) * 0.5;
    const cy = 0.3 + Math.floor(group / 2) * 0.4;
    const r = 0.06 + (i % 3) * 0.02;
    const ang = i * 0.5;
    return { x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r, s: group === (i >> 3) % 4 ? 1.4 : 0.8 };
  }
  function poseSpine(i, n) {
    const group = i % 4;
    const cx = 0.15 + group * 0.23;
    const cy = 0.5 + (n.hy - 0.5) * 0.25;
    return { x: cx + (n.hx - 0.5) * 0.1, y: cy, s: 0.9 };
  }
  function poseRings(i, n) {
    const ring = i % 3;
    const r = 0.1 + ring * 0.11;
    const ang = (i / NODE_COUNT) * Math.PI * 2 * (ring + 1);
    return { x: 0.5 + Math.cos(ang) * r, y: 0.5 + Math.sin(ang) * r * 0.78, s: 0.9 };
  }
  function poseFocus(i, n) {
    if (i === 0) return { x: 0.5, y: 0.5, s: 6 };
    const ang = (i / NODE_COUNT) * Math.PI * 2;
    const r = 0.45 + (n.px % 1) * 0.05;
    return { x: 0.5 + Math.cos(ang) * r, y: 0.5 + Math.sin(ang) * r * 0.8, s: 0.4 };
  }
  function poseExplode(i, n) {
    // deterministic radii per node — stable, not frantic
    const ang = (i / NODE_COUNT) * Math.PI * 2;
    const r = 0.3 + ((n.px * 0.013) % 0.3);
    return { x: 0.5 + Math.cos(ang) * r, y: 0.5 + Math.sin(ang) * r * 0.8, s: 0.9 };
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let time = 0;
  let lastPalCheck = 0;
  function frame(now) {
    time = now * 0.001;
    if (now - lastPalCheck > 400) { PAL = readPalette(); lastPalCheck = now; }

    ctx.clearRect(0, 0, W, H);

    const layout = layoutFor(chapterRatio);
    const cx = W/2, cy = H/2;
    const scale = Math.min(W, H) * 0.9;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const home = layout(i, n);
      // float jitter — reduced in late chapters where nodes cluster tightly
      const calm = Math.max(0.25, 1 - Math.max(0, chapterRatio - 4) / 2);
      const fx = Math.sin(time * 0.4 + n.phase) * 4 * calm;
      const fy = Math.cos(time * 0.35 + n.phase * 1.3) * 4 * calm;
      n.x = (home.x - 0.5) * scale + cx + fx;
      n.y = (home.y - 0.5) * scale + cy + fy;
      n._size = n.size * (home.s || 1);
      if (mouse.has) {
        const dx = n.x - mouse.x, dy = n.y - mouse.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        const R = 140;
        if (d < R) {
          const push = (1 - d / R) * 18;
          const ang = Math.atan2(dy, dx);
          n.x += Math.cos(ang) * push;
          n.y += Math.sin(ang) * push;
        }
      }
    }

    // Draw edges
    ctx.lineCap = 'round';
    for (let k = 0; k < edges.length; k++) {
      const e = edges[k];
      const a = nodes[e.a], b = nodes[e.b];
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const cpx = mx + (b.y - a.y) * e.ctrl;
      const cpy = my - (b.x - a.x) * e.ctrl;

      const len = Math.hypot(a.x - b.x, a.y - b.y);
      const alpha = Math.max(0.04, Math.min(0.28, 120 / Math.max(len, 40)));
      ctx.strokeStyle = hex2rgba(PAL.accent, alpha * 0.9);
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(cpx, cpy, b.x, b.y);
      ctx.stroke();
    }

    // Pulses — slow down approaching the end
    const endDamp = 1 - Math.max(0, chapterRatio - 3) / 3;
    const spawnRate = 0.14 * Math.max(0.05, endDamp);
    const speedMult = Math.max(0.15, endDamp);
    if (!prefersReduced && Math.random() < spawnRate) spawnPulse();
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.t += p.speed * speedMult;
      if (p.t >= 1) { pulses.splice(i, 1); continue; }
      const a = nodes[p.e.a], b = nodes[p.e.b];
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const cpx = mx + (b.y - a.y) * p.e.ctrl;
      const cpy = my - (b.x - a.x) * p.e.ctrl;
      const t = p.t;
      const px = (1-t)*(1-t)*a.x + 2*(1-t)*t*cpx + t*t*b.x;
      const py = (1-t)*(1-t)*a.y + 2*(1-t)*t*cpy + t*t*b.y;
      const color = p.hot ? PAL.hot : PAL.accent;
      ctx.fillStyle = hex2rgba(color, 0.9);
      ctx.beginPath();
      ctx.arc(px, py, 1.6, 0, Math.PI * 2);
      ctx.fill();
      const grad = ctx.createRadialGradient(px, py, 0, px, py, 14);
      grad.addColorStop(0, hex2rgba(color, 0.35));
      grad.addColorStop(1, hex2rgba(color, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw nodes
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const color = n.hot ? PAL.hot : PAL.accent;
      const r = 1.4 + n._size;
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 5);
      grad.addColorStop(0, hex2rgba(color, 0.35));
      grad.addColorStop(1, hex2rgba(color, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r * 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PAL.ink;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(frame);
  }

  function hex2rgba(hex, a) {
    hex = hex.trim();
    if (hex.startsWith('rgb')) return hex.replace(/rgb\(/, 'rgba(').replace(/\)$/, `, ${a})`);
    if (!hex.startsWith('#')) return hex;
    let h = hex.slice(1);
    if (h.length === 3) h = h.split('').map(c => c+c).join('');
    const r = parseInt(h.slice(0,2), 16);
    const g = parseInt(h.slice(2,4), 16);
    const b = parseInt(h.slice(4,6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  requestAnimationFrame(frame);

  // expose palette refresh hook for tweak/theme changes
  window.__neural = { refresh: () => { PAL = readPalette(); } };
})();
