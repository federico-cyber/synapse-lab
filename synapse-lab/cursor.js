/* Custom cursor — small dot + ring, magnet on [data-magnet] elements */
(function () {
  const cursor = document.getElementById('cursor');
  if (!cursor) return;

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let cx = mx, cy = my;
  let tx = mx, ty = my;
  let magnetEl = null, magnetRect = null;

  window.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
  });

  function loop() {
    if (magnetEl && magnetRect) {
      const cxEl = magnetRect.left + magnetRect.width / 2;
      const cyEl = magnetRect.top + magnetRect.height / 2;
      tx = mx + (cxEl - mx) * 0.18;
      ty = my + (cyEl - my) * 0.18;
    } else {
      tx = mx; ty = my;
    }
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    const dot = cursor.querySelector('.c-dot');
    const ring = cursor.querySelector('.c-ring');
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  }
  loop();

  const HOVER_SEL = 'a, button, [data-magnet], input, textarea';
  document.addEventListener('mouseover', e => {
    const el = e.target.closest && e.target.closest(HOVER_SEL);
    if (el) {
      cursor.setAttribute('data-state', 'hover');
      if (el.matches('[data-magnet]')) {
        magnetEl = el; magnetRect = el.getBoundingClientRect();
      }
    }
  });
  document.addEventListener('mouseout', e => {
    const el = e.target.closest && e.target.closest(HOVER_SEL);
    if (el) {
      cursor.removeAttribute('data-state');
      magnetEl = null; magnetRect = null;
    }
  });
  window.addEventListener('scroll', () => {
    if (magnetEl) magnetRect = magnetEl.getBoundingClientRect();
  }, { passive: true });
})();
