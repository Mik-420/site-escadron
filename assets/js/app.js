document.addEventListener('DOMContentLoaded', () => {
  const accessKey = 'escadron736-preview-access';
  const accessPassword = 'Jesaispas$';
  if (sessionStorage.getItem(accessKey) !== 'granted') {
    document.body.classList.add('site-locked');
    const accessGate = document.createElement('section');
    accessGate.className = 'access-gate';
    accessGate.setAttribute('aria-label', 'Accès privé au site');
    accessGate.innerHTML = `<div class="access-gate-panel"><form class="access-gate-form"><button class="access-logo-button" type="button" aria-label="Accès privé"><img src="/Photos/logo.png" alt="Logo de l’Escadron 736 Mont-Joli" /></button><span class="eyebrow">Site en préparation</span><h1>Accès privé</h1><p>Le site de l’Escadron 736 Mont-Joli n’est pas encore ouvert au public.</p><input class="access-secret-input" id="site-access-password" name="password" type="password" autocomplete="current-password" aria-label="Code d’accès" required /><button class="visually-hidden" type="submit" tabindex="-1">Valider</button></form></div>`;
    document.body.prepend(accessGate);
    const accessForm = accessGate.querySelector('form');
    const accessInput = accessGate.querySelector('input');
    accessForm.querySelector('.access-logo-button').addEventListener('click', () => {
      accessInput.focus();
    });
    accessForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const password = new FormData(event.currentTarget).get('password');
      if (password === accessPassword) {
        sessionStorage.setItem(accessKey, 'granted');
        document.body.classList.remove('site-locked');
        accessGate.remove();
      } else {
        accessInput.value = '';
        accessInput.focus();
      }
    });
  }

  const officialLogo = '/Photos/logo.png';
  document.querySelectorAll('img[src*="logo-placeholder.svg"]').forEach((image) => {
    image.src = officialLogo;
  });

  const favicon = document.querySelector('link[rel="icon"]');
  if (favicon) {
    favicon.href = officialLogo;
    favicon.type = 'image/avif';
  }

  const heroVideo = document.querySelector('.hero-video');
  if (heroVideo) {
    heroVideo.poster = officialLogo;
  }

  const activityIcons = {
    '✈': 'aviation.svg',
    '🎤': 'art-oratoire.svg',
    '🥁': 'marche-militaire.svg',
    '🎵': 'musique.svg',
    '🎯': 'tir-precision.svg',
    '🌲': 'survie-foret.svg'
  };
  document.querySelectorAll('.activity-icon').forEach((icon) => {
    const source = activityIcons[icon.textContent.trim()];
    if (source) {
      const image = document.createElement('img');
      image.src = `assets/images/activities/${source}`;
      image.alt = '';
      icon.replaceChildren(image);
    }
  });

  const suggestionDialog = document.querySelector('[data-suggestion-dialog]');
  const suggestionForm = document.querySelector('[data-suggestion-form]');
  const suggestionStatus = document.querySelector('[data-suggestion-status]');
  document.querySelector('[data-suggestion-open]')?.addEventListener('click', () => {
    suggestionDialog?.showModal();
  });
  document.querySelectorAll('[data-suggestion-close]').forEach((button) => {
    button.addEventListener('click', () => suggestionDialog?.close());
  });
  suggestionForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(suggestionForm);
    const recipient = window.siteConfig?.suggestionsEmail;
    const submitButton = suggestionForm.querySelector('[type="submit"]');
    if (!recipient) return;

    submitButton.disabled = true;
    suggestionStatus.textContent = 'Envoi en cours...';
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: 'Suggestion pour l’Escadron 736',
          nom: data.get('name'),
          statut: data.get('role'),
          suggestion: data.get('suggestion')
        })
      });
      if (!response.ok) throw new Error('Suggestion could not be sent');
      suggestionStatus.textContent = 'Merci. Votre suggestion a été envoyée.';
      suggestionForm.reset();
    } catch (error) {
      suggestionStatus.textContent = 'L’envoi a échoué. Veuillez réessayer plus tard.';
    } finally {
      submitButton.disabled = false;
    }
  });

  const navToggle = document.querySelector('.nav-toggle');
  const siteNav = document.querySelector('.site-nav');
  const navWrap = document.querySelector('.nav-wrap');
  const navList = siteNav?.querySelector(':scope > ul');

  if (navWrap && siteNav && navList) {
    const items = Array.from(navList.children);
    const homeItem = items.find((item) => item.querySelector('a[href*="index.html"], a[href*="accueil.html"]'));
    const portfolioItem = items.find((item) => item.querySelector('a[href*="portfolio.html"]'));
    const contactItem = items.find((item) => item.querySelector('a[href*="contact.html"]'));
    const cadetsItem = items.find((item) => item.classList.contains('dropdown'));
    const registrationItem = items.find((item) => item.querySelector('[data-registration-link]'));

    if (homeItem && portfolioItem && contactItem && cadetsItem) {
      const aboutItem = document.createElement('li');
      aboutItem.className = 'dropdown';
      const aboutToggle = document.createElement('button');
      aboutToggle.type = 'button';
      aboutToggle.className = 'dropdown-toggle';
      aboutToggle.setAttribute('aria-expanded', 'false');
      aboutToggle.textContent = 'À propos';

      const path = window.location.pathname;
      const prefix = path.includes('/cadets/uniforme/') ? '../../' : path.includes('/cadets/') || path.includes('/accueil/') ? '../' : '';
      const aboutMenu = document.createElement('ul');
      aboutMenu.className = 'dropdown-menu';
      [
        ['histoire.html', 'Notre Histoire'],
        ['membre-du-personnel.html', 'Notre Équipe'],
        ['nos-commanditaires.html', 'Commanditaire'],
        ['faire-un-don.html', 'Faire un Don']
      ].forEach(([href, label]) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = `${prefix}${href}`;
        link.textContent = label;
        if (path.endsWith(href)) {
          link.classList.add('active');
          aboutToggle.classList.add('active');
        }
        item.appendChild(link);
        aboutMenu.appendChild(item);
      });

      aboutItem.append(aboutToggle, aboutMenu);
      navList.replaceChildren(homeItem, portfolioItem, cadetsItem, aboutItem, contactItem);

      aboutToggle.addEventListener('click', () => {
        const expanded = aboutItem.classList.toggle('open');
        aboutToggle.setAttribute('aria-expanded', String(expanded));
      });

      document.addEventListener('click', (event) => {
        if (!aboutItem.contains(event.target)) {
          aboutItem.classList.remove('open');
          aboutToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    if (registrationItem) {
      registrationItem.remove();
    }
  }

  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === 'index.html' || href === '../index.html' || href === '../../index.html') {
      link.href = href.replace('index.html', 'accueil.html');
    }
  });

  const registrationBubble = document.createElement('a');
  registrationBubble.className = 'registration-bubble';
  const registrationPage = '/accueil/devenir-cadet.html';
  document.querySelectorAll('[data-registration-link]').forEach((link) => {
    link.href = registrationPage;
    if (document.querySelector('.hero-video')) {
      link.textContent = 'Devenir Cadet';
    }
  });
  registrationBubble.href = registrationPage;
  registrationBubble.textContent = 'Devenir Cadet';
  registrationBubble.setAttribute('aria-label', "S'inscrire au Programme des cadets");
  document.body.appendChild(registrationBubble);

  const profilePage = /membre-du-personnel\.html$/.test(window.location.pathname);
  const profilePlaceholder = document.querySelector('.content-card .placeholder-box');
  if (profilePage && profilePlaceholder) {
    const context = 'escadron';
    const personnelProfiles = [
      ['Enseigne de vaisseau de première classe', 'Éric-Olivier Levesque', 'Commandant de l’Escadron'],
      ['Adjudant de première classe', 'Jordan Bouchard', 'Cadet commandant'],
      ['Élève Officier', 'Mathias Pettigrew', 'Officier d’instruction<br>Responsable de l’instruction'],
      ['Capitaine', 'Yves Galbrand', 'Officier d’Administration<br>Instructeur d’aviation'],
      ['Élève Officier', 'Gino Lévesque', 'Officier d’Entraînement tir de précision<br>Instructeur de niveau 3'],
      ['Instructeur Civil', 'Gaétan Beaudin', 'Officier d’approvisionnement'],
      ['Instructeur Civil', 'Samantha Plourde', 'Responsable du niveau 1'],
      ['Bénévole', 'Charlie Smith', 'Instructeur de niveau 1 et Art Oratoire'],
      ['Bénévole', 'Nora Vanegas', 'Responsable Niveau 2 et Musique']
    ];
    const profiles = personnelProfiles.map(([role, name, description], index) => {
      const photo = context === 'escadron' && index < personnelProfiles.length ? `Photos/Équipe/Personnel/${index + 1}.jpg` : '';
      return `<article class="staff-card"><div class="staff-photo">${photo ? `<img src="${photo}" alt="Photo de ${name}" />` : 'Photo à ajouter'}</div><p class="staff-role">${role || 'Poste à ajouter'}</p><h3>${name}</h3><p class="staff-description">${description || `Une courte description du rôle, des responsabilités et de la contribution de cette personne au sein du ${context}.`}</p></article>`;
    }).join('');
    const committeeMembers = [
      ['Marie Desneiges', 'Présidente du comité répondant'],
      ['Michel Boucher', 'N/A'],
      ['Annie', 'N/A'],
      ['TED Savage', 'N/A'],
      ['Olivier Ross', 'Bénévole'],
      ['Mikael Tremblay', 'Bénévole']
    ];
    const committeeProfiles = committeeMembers.map(([name, role], index) => `<article class="staff-card"><div class="staff-photo"><img src="Photos/Équipe/Répondant/${index + 1}.jpg" alt="Photo de ${name}" /></div><p class="staff-role">${role}</p><h3>${name}</h3><p class="staff-description">Une courte description du rôle et de la contribution de cette personne au sein du comité répondant.</p></article>`).join('');
    const commanderMessage = `<section class="commander-message"><span class="eyebrow">Mot du commandant</span><h2>Mot du commandant</h2><p>Bienvenue sur le site officiel de l’Escadron 736 des Cadets de l’Air de Mont-Joli!</p><p>C’est avec beaucoup de fierté que nous accueillons chaque année des jeunes de notre communauté qui souhaitent relever de nouveaux défis, développer leurs compétences et vivre des expériences enrichissantes.</p><p>Le Programme des cadets de l’Air offre aux jeunes de 12 à 18 ans l’occasion de découvrir l’aviation et l’aérospatiale, tout en développant leur leadership, leur esprit d’équipe, leur autonomie et leur confiance en eux. À travers les activités d’aviation, la musique, le sport, le tir de précision, la marche militaire, la survie et bien d’autres activités, chaque cadet est encouragé à apprendre, à progresser et à se dépasser.</p><p>Notre objectif est d’offrir un environnement sécuritaire, inclusif et stimulant, où chaque jeune peut trouver sa place et développer son plein potentiel.</p><p>Que vous soyez un jeune intéressé à joindre nos rangs, un parent à la recherche d’un programme enrichissant ou simplement curieux d’en apprendre davantage, nous vous invitons à découvrir tout ce que l’Escadron 736 a à offrir.</p><p>Au plaisir de vous accueillir parmi nous!</p><p class="commander-signature">Le commandant<br>Escadron 736 des Cadets de l’Air de Mont-Joli ✈️</p></section>`;
    profilePlaceholder.outerHTML = `<div class="staff-grid">${profiles}</div><section class="committee-section"><h2>Comité Répondant</h2><div class="staff-grid committee-grid">${committeeProfiles}</div></section>${commanderMessage}`;
  }

  let lastScrollPosition = window.scrollY;
  window.addEventListener('scroll', () => {
    const currentScrollPosition = window.scrollY;
    const scrollingDown = currentScrollPosition > lastScrollPosition && currentScrollPosition > 80;
    registrationBubble.classList.toggle('is-hidden', scrollingDown);
    lastScrollPosition = currentScrollPosition;
  }, { passive: true });

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = siteNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  const dropdown = document.querySelector('.dropdown');
  const dropdownToggle = document.querySelector('.dropdown-toggle');

  if (dropdown && dropdownToggle) {
    dropdownToggle.addEventListener('click', () => {
      const expanded = dropdown.classList.toggle('open');
      dropdownToggle.setAttribute('aria-expanded', String(expanded));
    });

    document.addEventListener('click', (event) => {
      if (!dropdown.contains(event.target)) {
        dropdown.classList.remove('open');
        dropdownToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const uniformSubnav = document.querySelector('.uniform-subnav');
  const uniformSelect = uniformSubnav?.querySelector('select');

  if (uniformSubnav && uniformSelect) {
    const links = document.createElement('nav');
    links.className = 'uniform-section-links';
    links.setAttribute('aria-label', 'Sections de l’uniforme');

    Array.from(uniformSelect.options).forEach((option) => {
      const link = document.createElement('a');
      link.href = option.value;
      link.textContent = option.textContent;
      if (option.selected) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
      links.appendChild(link);
    });

    uniformSelect.replaceWith(links);
  }
});
