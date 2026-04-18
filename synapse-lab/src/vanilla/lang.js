/* Language handling — swap [data-it]/[data-en] text content based on body[data-lang] */
(function () {
  function apply(lang) {
    document.body.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang);
    const all = document.querySelectorAll('[data-it][data-en]');
    all.forEach(el => {
      el.textContent = el.getAttribute('data-' + lang) || '';
    });
  }
  window.__applyLang = apply;
})();
