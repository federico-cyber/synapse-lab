/* Hamburger menu — mobile nav overlay */
(function () {
  const toggle = document.getElementById('hamburger-toggle');
  const overlay = document.getElementById('menu-overlay');
  if (!toggle || !overlay) return;

  function open() {
    document.body.classList.add('menu-open');
    toggle.setAttribute('aria-expanded', 'true');
    overlay.setAttribute('aria-hidden', 'false');
    const first = overlay.querySelector('button, a');
    if (first) first.focus();
  }

  function close() {
    document.body.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    overlay.setAttribute('aria-hidden', 'true');
    toggle.focus();
  }

  toggle.addEventListener('click', () => {
    if (document.body.classList.contains('menu-open')) close();
    else open();
  });

  overlay.addEventListener('click', (e) => {
    const link = e.target.closest('[data-scroll-to]');
    if (!link) return;
    const target = document.querySelector(link.dataset.scrollTo);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) close();
  });

  // Delega toggle SOUND/LANG del menu verso i pulsanti navbar esistenti
  const menuSound = document.getElementById('menu-sound-toggle');
  const mainSound = document.getElementById('sound-toggle');
  if (menuSound && mainSound) {
    menuSound.addEventListener('click', () => mainSound.click());
  }
  const menuLang = document.getElementById('menu-lang-toggle');
  const mainLang = document.getElementById('lang-toggle');
  if (menuLang && mainLang) {
    menuLang.addEventListener('click', () => mainLang.click());
  }
})();
