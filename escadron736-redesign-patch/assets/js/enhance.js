(function () {
  const script = document.currentScript;
  const root = script ? script.src.replace(/assets\/js\/enhance\.js.*$/, '') : '/';
  const path = location.pathname.replace(/^\//, '');

  const HOME = ['Accueil', 'accueil.html'];
  const CADETS = ['Cadets', 'cadets/index.html'];
  const APROPOS = ['À propos', 'histoire.html'];
  const UNIFORME = ['Uniforme', 'cadets/uniforme.html'];
  const trails = {
    'histoire.html': [HOME, ['Notre histoire']],
    'portfolio.html': [HOME, ['Portfolio']],
    'contact.html': [HOME, ['Contact']],
    'faire-un-don.html': [HOME, ['Faire un don']],
    'instruction.html': [HOME, CADETS, ['Instruction']],
    'ressources.html': [HOME, CADETS, ['Ressources']],
    'notre-equipe.html': [HOME, APROPOS, ['Notre équipe']],
    'membre-du-personnel.html': [HOME, APROPOS, ['Membres du personnel']],
    'nos-commanditaires.html': [HOME, APROPOS, ['Nos commanditaires']],
    'comite-repondant.html': [HOME, APROPOS, ['Comité répondant']],
    'hymne-national.html': [HOME, ['Hymne national']],
    'politique-de-confidentialite.html': [HOME, ['Politique de confidentialité']],
    'conditions-generales-utilisation.html': [HOME, ['Conditions d’utilisation']],
    'cadets/index.html': [HOME, ['Cadets']],
    'cadets/trophees.html': [HOME, CADETS, ['Trophées']],
    'cadets/grades.html': [HOME, CADETS, ['Grades']],
    'cadets/uniforme.html': [HOME, CADETS, ['Uniforme']],
    'cadets/uniforme/Tenue.html': [HOME, CADETS, UNIFORME, ['Tenue']],
    'cadets/uniforme/Port-de-l-uniforme.html': [HOME, CADETS, UNIFORME, ['Port de l’uniforme']],
    'cadets/uniforme/Entretien-de-l-uniforme.html': [HOME, CADETS, UNIFORME, ['Entretien']],
    'cadets/uniforme/Cheveux-Bijoux.html': [HOME, CADETS, UNIFORME, ['Cheveux et bijoux']]
  };

  function buildBreadcrumb() {
    const trail = trails[path];
    if (!trail || document.querySelector('.breadcrumb')) return;
    const host = document.querySelector('.page-hero .container, .history-hero-content, .donation-hero-content, main .container');
    if (!host) return;
    const nav = document.createElement('nav');
    nav.className = 'breadcrumb';
    nav.setAttribute('aria-label', 'Fil d’Ariane');
    nav.dataset.testid = 'breadcrumb';
    const ol = document.createElement('ol');
    trail.forEach(([label, href], i) => {
      const li = document.createElement('li');
      if (href && i < trail.length - 1) {
        const a = document.createElement('a');
        a.href = root + href;
        a.textContent = label;
        li.appendChild(a);
      } else {
        li.textContent = label;
        li.setAttribute('aria-current', 'page');
      }
      ol.appendChild(li);
    });
    nav.appendChild(ol);
    host.prepend(nav);
  }

  function enableTransitions() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.documentElement.classList.add('page-transitions');
    window.addEventListener('pageshow', () => document.documentElement.classList.remove('is-leaving'));
    document.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest('a[href]');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;
      if (!/\.html?$|\/$/.test(url.pathname)) return;
      event.preventDefault();
      document.documentElement.classList.add('is-leaving');
      setTimeout(() => { location.href = url.href; }, 230);
    });
  }

  function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const run = (el) => {
      const end = Number(el.dataset.count);
      const start = Number(el.dataset.start || 0);
      if (reduce || !('requestAnimationFrame' in window)) { el.textContent = String(end); return; }
      const duration = 1600;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(start + (end - start) * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        entry.target.closest('.key-stat')?.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    counters.forEach((el) => io.observe(el));
  }

  document.addEventListener('DOMContentLoaded', () => { buildBreadcrumb(); animateCounters(); });
  enableTransitions();
})();
