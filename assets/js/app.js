document.addEventListener('DOMContentLoaded', () => {
  const consentCookie = 'escadron736-analytics-consent-v2';
  const getCookie = (name) => document.cookie.split('; ').find((cookie) => cookie.startsWith(`${name}=`))?.split('=')[1];
  const getDeviceType = () => {
    const userAgent = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'Appareil iOS';
    if (/Android/i.test(userAgent)) return 'Appareil Android';
    if (/Windows/i.test(userAgent)) return 'Ordinateur Windows';
    if (/Macintosh/i.test(userAgent)) return 'Ordinateur macOS';
    if (/Linux/i.test(userAgent)) return 'Ordinateur Linux';
    return 'Appareil non identifié';
  };
  const getBrowserName = () => {
    const userAgent = navigator.userAgent;
    if (/Edg\//.test(userAgent)) return 'Microsoft Edge';
    if (/Firefox\//.test(userAgent)) return 'Mozilla Firefox';
    if (/Chrome\//.test(userAgent)) return 'Google Chrome';
    if (/Safari\//.test(userAgent)) return 'Safari';
    return 'Navigateur non identifié';
  };
  const getNetworkLocation = async () => {
    try {
      const response = await fetch('https://ipwho.is/', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Network location unavailable');
      const data = await response.json();
      if (!data.success) throw new Error('Network location unavailable');
      return {
        ip: data.ip || 'Non disponible',
        city: data.city || 'Non disponible',
        region: data.region || 'Non disponible',
        country: data.country || 'Non disponible',
        timezone: data.timezone?.id || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Non disponible'
      };
    } catch (error) {
      return {
        ip: 'Non disponible',
        city: 'Non disponible',
        region: 'Non disponible',
        country: 'Non disponible',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Non disponible'
      };
    }
  };
  const sendConsentNotification = async () => {
    const recipient = window.siteConfig?.notificationsEmail;
    if (!recipient) return;
    try {
      const networkLocation = await getNetworkLocation();
      await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: '[Escadron 736] Rapport de visite consenti',
          _template: 'box',
          'Organisation': 'Escadron 736 Mont-Joli des Cadets de l’Air',
          'Logo officiel': 'https://escadron736.ca/assets/images/logo-escadron.webp',
          'Type de rapport': 'Consentement accepté aux mesures d’audience',
          'Date et heure de la visite': new Date().toLocaleString('fr-CA'),
          'Page visitée': window.location.href,
          'Adresse IP publique': networkLocation.ip,
          'Ville approximative': networkLocation.city,
          'Région approximative': networkLocation.region,
          'Pays approximatif': networkLocation.country,
          'Fuseau horaire': networkLocation.timezone,
          'Type d’appareil': getDeviceType(),
          'Navigateur': getBrowserName(),
          'Langue du navigateur': navigator.language || 'Non disponible',
          'Confidentialité': 'Collecte effectuée après consentement explicite. La ville, la région et le pays sont déduits de l’adresse IP; aucune position GPS précise n’est demandée.'
        })
      });
    } catch (error) {
      console.warn('La notification de consentement n’a pas pu être envoyée.', error);
    }
  };
  const setConsent = (value) => {
    document.cookie = `${consentCookie}=${value}; Max-Age=15552000; Path=/; SameSite=Lax; Secure`;
    document.documentElement.dataset.analyticsConsent = value;
    window.dispatchEvent(new CustomEvent('escadron736:analytics-consent', { detail: { value } }));
  };
  window.addEventListener('escadron736:analytics-consent', (event) => {
    if (event.detail?.value === 'accepted') window.loadEscadronGoogleAnalytics?.();
  });
  const existingConsent = getCookie(consentCookie);
  if (existingConsent) {
    document.documentElement.dataset.analyticsConsent = existingConsent;
  }

  const favicon = document.querySelector('link[rel="icon"]');
  if (favicon) {
    favicon.href = '/favicon.png?v=logo-20260927';
    favicon.type = 'image/png';
  }

  const heroVideo = document.querySelector('.hero-video');
  document.querySelectorAll('.hero-video, .registration-video video').forEach((video) => {
    video.muted = true;
    video.playsInline = true;
    const isHeroVideo = video.matches('.hero-video');
    let heroVideoStartAllowed = !isHeroVideo;
    const tryPlayback = () => {
      if (!heroVideoStartAllowed) return;
      video.play().catch(() => {
        video.controls = true;
      });
    };
    if (isHeroVideo) {
      video.addEventListener('timeupdate', () => {
        const loopPoint = video.duration - 8;
        if (Number.isFinite(loopPoint) && loopPoint > 0 && video.currentTime >= loopPoint) {
          video.currentTime = 0;
        }
      });
    }
    video.addEventListener('loadeddata', tryPlayback, { once: true });
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) tryPlayback();
    if (isHeroVideo) {
      window.setTimeout(() => {
        heroVideoStartAllowed = true;
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) tryPlayback();
      }, 1000);
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && video.paused) tryPlayback();
    });
  });

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
  const suggestionRateLimitKey = 'escadron736-suggestion-last-sent';
  const submissionCooldown = 60_000;
  const suggestionMinFillTime = 3_000; // anti-spam : rejette les envois trop rapides pour être humains
  let suggestionOpenedAt = 0;
  const setSuggestionStatus = (message, state = '') => {
    suggestionStatus.textContent = message;
    suggestionStatus.className = `form-status ${state}`.trim();
  };

  const suggestionNameField = suggestionForm?.querySelector('#suggestion-name');
  const suggestionMessageField = suggestionForm?.querySelector('#suggestion-message');
  const suggestionRoleInputs = suggestionForm?.querySelectorAll('input[name="role"]');

  const setSuggestionFieldError = (field, hasError) => {
    field?.closest('.suggestion-field')?.classList.toggle('has-error', hasError);
  };

  const validateSuggestionName = () => {
    const isValid = Boolean(suggestionNameField?.value.trim());
    setSuggestionFieldError(suggestionNameField, !isValid);
    return isValid;
  };

  const validateSuggestionMessage = () => {
    const isValid = (suggestionMessageField?.value.trim().length || 0) >= 5;
    setSuggestionFieldError(suggestionMessageField, !isValid);
    return isValid;
  };

  suggestionNameField?.addEventListener('blur', validateSuggestionName);
  suggestionMessageField?.addEventListener('blur', validateSuggestionMessage);

  document.querySelector('[data-suggestion-open]')?.addEventListener('click', () => {
    suggestionOpenedAt = Date.now();
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
    if (String(data.get('website') || '').trim()) return;

    // Anti-spam : un envoi trop rapide après l'ouverture du formulaire est suspect
    if (Date.now() - suggestionOpenedAt < suggestionMinFillTime) {
      setSuggestionStatus('Veuillez patienter quelques secondes avant d’envoyer le formulaire.', 'is-error');
      return;
    }

    const isNameValid = validateSuggestionName();
    const isMessageValid = validateSuggestionMessage();
    const isRoleValid = Array.from(suggestionRoleInputs || []).some((input) => input.checked);
    if (!isNameValid || !isMessageValid || !isRoleValid) {
      setSuggestionStatus('Veuillez corriger les champs en erreur avant d’envoyer le formulaire.', 'is-error');
      if (!isNameValid) suggestionNameField?.focus();
      else if (!isRoleValid) suggestionForm.querySelector('input[name="role"]')?.focus();
      else suggestionMessageField?.focus();
      return;
    }

    const lastSubmission = Number(localStorage.getItem(suggestionRateLimitKey) || 0);
    const remainingSeconds = Math.ceil((submissionCooldown - (Date.now() - lastSubmission)) / 1000);
    if (remainingSeconds > 0) {
      setSuggestionStatus(`Veuillez attendre ${remainingSeconds} secondes avant un nouvel envoi.`, 'is-error');
      return;
    }

    submitButton.disabled = true;
    setSuggestionStatus('Envoi en cours...');
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: '[Escadron 736] Nouvelle suggestion',
          _template: 'table',
          'Nom de la personne': data.get('name'),
          'Statut': data.get('role'),
          'Suggestion': data.get('suggestion'),
          'Reçu le': new Date().toLocaleString('fr-CA'),
          'Source': 'Boîte à suggestions du site escadron736.ca'
        })
      });
      if (!response.ok) throw new Error('Suggestion could not be sent');
      localStorage.setItem(suggestionRateLimitKey, String(Date.now()));
      setSuggestionStatus('Merci. Votre suggestion a été envoyée.', 'is-success');
      suggestionForm.reset();
      setSuggestionFieldError(suggestionNameField, false);
      setSuggestionFieldError(suggestionMessageField, false);
    } catch (error) {
      setSuggestionStatus('L’envoi a échoué. Veuillez réessayer plus tard.', 'is-error');
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
    const path = window.location.pathname;
    const prefix = path.includes('/cadets/uniforme/') ? '../../' : path.includes('/cadets/') || path.includes('/accueil/') ? '../' : '';
    const portfolioItem = items.find((item) => item.querySelector('a[href*="portfolio.html"]'));
    const contactItem = items.find((item) => item.querySelector('a[href*="contact.html"]'));
    const cadetsItem = items.find((item) => item.classList.contains('dropdown'));
    const registrationItem = items.find((item) => item.querySelector('[data-registration-link]'));

    const cadetsMenu = cadetsItem?.querySelector('.dropdown-menu');
    if (cadetsMenu) {
      const menuOrder = ['uniforme', 'grades', 'trophées', 'instruction', 'hymne national'];
      [
        ['instruction.html', 'Instruction'],
        ['hymne-national.html', 'Hymne National']
      ].forEach(([href, label]) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = `${prefix}${href}`;
        link.textContent = label;
        if (path.endsWith(`/${href}`)) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
          cadetsItem.querySelector('.dropdown-toggle')?.classList.add('active');
        }
        item.appendChild(link);
        cadetsMenu.appendChild(item);
      });
      const menuItems = Array.from(cadetsMenu.children);
      menuItems.sort((left, right) => {
        const leftText = left.textContent.trim().toLocaleLowerCase('fr-CA');
        const rightText = right.textContent.trim().toLocaleLowerCase('fr-CA');
        const leftIndex = menuOrder.findIndex((label) => leftText.includes(label));
        const rightIndex = menuOrder.findIndex((label) => rightText.includes(label));
        return leftIndex - rightIndex;
      });
      cadetsMenu.replaceChildren(...menuItems);
    }

    if (homeItem && portfolioItem && contactItem && cadetsItem) {
      const aboutItem = document.createElement('li');
      aboutItem.className = 'dropdown';
      const aboutToggle = document.createElement('button');
      aboutToggle.type = 'button';
      aboutToggle.className = 'dropdown-toggle';
      aboutToggle.setAttribute('aria-expanded', 'false');
      aboutToggle.textContent = 'À propos';

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

  const currentPath = window.location.pathname;
  const showRegistrationBubble = /\/(accueil|contact)\.html$/.test(currentPath);
  const registrationBubble = showRegistrationBubble ? document.createElement('a') : null;
  const registrationPage = '/accueil/devenir-cadet.html';
  document.querySelectorAll('[data-registration-link]').forEach((link) => {
    link.href = registrationPage;
    if (document.querySelector('.hero-video')) {
      link.textContent = 'Devenir Cadet';
    }
  });
  if (registrationBubble) {
    registrationBubble.className = 'registration-bubble';
    registrationBubble.href = registrationPage;
    registrationBubble.textContent = 'Devenir Cadet';
    registrationBubble.setAttribute('aria-label', "S'inscrire au Programme des cadets");
    document.body.appendChild(registrationBubble);
  }

  const profilePage = /membre-du-personnel\.html$/.test(window.location.pathname);
  const profilePlaceholder = document.querySelector('.content-card .placeholder-box');
  if (profilePage && profilePlaceholder) {
    const context = 'escadron';
    const personnelProfiles = [
      ['Lieutenant de Vaisseau', 'Éric-Olivier Lévesque', 'Commandant de l’Escadron'],
      ['Adjudant de première classe', 'Jordan Bouchard', 'Cadet commandant'],
      ['Élève Officier', 'Mathias Pettigrew', 'Officier d’instruction<br>Responsable de l’instruction'],
      ['Capitaine', 'Yves Galbrand', 'Officier d’Administration<br>Instructeur d’aviation'],
      ['Élève Officier', 'Gino Lévesque', 'Officier d’Entraînement tir de précision<br>Instructeur de niveau 3'],
      ['Instructeur Civil', 'Gaétan Beaudin', 'Officier d’approvisionnement'],
      ['Instructeur Civil', 'Samantha Plourde', 'Responsable du niveau 1'],
      ['Bénévole', 'Charlie Smith', 'Instructeur de niveau 1 et Art Oratoire'],
      ['Bénévole', 'Nora Alejandra Vanegas Barrios', 'Responsable Niveau 2 et Musique']
    ];
    const profiles = personnelProfiles.map(([role, name, description], index) => {
      const photo = context === 'escadron' && index < personnelProfiles.length ? `Photos/Équipe/Personnel/${index + 1}.jpg` : '';
      return `<article class="staff-card"><div class="staff-photo">${photo ? `<img src="${photo}" alt="Photo de ${name}" loading="lazy" decoding="async" />` : 'Photo à ajouter'}</div><p class="staff-role">${role || 'Poste à ajouter'}</p><h3>${name}</h3><p class="staff-description">${description || `Une courte description du rôle, des responsabilités et de la contribution de cette personne au sein du ${context}.`}</p></article>`;
    }).join('');
    const committeeMembers = [
      ['Marie-Desneiges Levesque', 'Présidente du comité répondant'],
      ['Annie Lecavalier', 'Trésorière'],
      ['Michel Boucher', 'Secrétaire'],
      ['Ted Savage', 'Administrateur'],
      ['Olivier Ross', 'Administrateur'],
      ['Mikaël Tremblay', 'Administrateur'],
      ['Daniel Côté', 'Administrateur']
    ];
    const committeeProfiles = committeeMembers.map(([name, role], index) => `<article class="staff-card"><div class="staff-photo"><img src="Photos/Équipe/Répondant/${index + 1}.jpg?v=20260927" alt="Photo de ${name}" loading="lazy" decoding="async" /></div><p class="staff-role">${role}</p><h3>${name}</h3></article>`).join('');
    const commanderMessage = `<section class="commander-message commander-message-new"><div class="commander-section-heading"><span class="eyebrow">Mot du commandant</span><h2>Mot du commandant</h2><p>Une vision pour l’Escadron 736 Mont-Joli</p></div><div class="commander-message-layout"><div class="commander-profile"><div class="commander-portrait"><img src="Photos/commandant-eric-olivier.jpg" alt="Éric-Olivier Lévesque, officier commandant de l’Escadron 736 Mont-Joli" /></div><div class="commander-profile-details"><p class="commander-rank">Enseigne de vaisseau de 1re classe</p><h3>Éric-Olivier Lévesque</h3><p>Officier commandant</p><p>Escadron 736 Mont-Joli</p></div></div><div class="commander-letter"><h3>Mot du commandant</h3><p>C’est avec une grande fierté que je m’adresse aux cadets, à leurs familles, ainsi qu’à tous ceux et celles qui contribuent à la vie de l’Escadron 736 Mont-Joli.</p><p>Notre escadron offre aux jeunes un environnement structuré, stimulant et positif, où ils peuvent apprendre, relever des défis et développer de nouvelles compétences. À travers les différentes activités proposées, les cadets sont encouragés à développer leur leadership, leur esprit d’équipe, leur autonomie et leur sens des responsabilités.</p><p>La réussite de notre escadron repose sur l’engagement de nombreuses personnes. Je tiens à souligner le travail et la participation de nos cadets, de leurs parents et tuteurs, des membres du personnel, des bénévoles ainsi que de tous nos partenaires et collaborateurs.</p><p>Je suis fier de voir nos cadets progresser, s’impliquer et repousser leurs limites au fil de leur parcours. Chaque expérience vécue au sein de l’Escadron contribue à leur développement et leur permet de créer des souvenirs qui les accompagneront longtemps.</p><p>Je souhaite à chacun de nos cadets une excellente année remplie de découvertes, de défis et de réussites.</p><div class="commander-vision"><h3>Ma vision</h3><p>Ma vision pour l’Escadron 736 Mont-Joli est de continuer à bâtir un milieu où chaque cadet peut trouver sa place, développer son potentiel et être fier de son parcours. Je souhaite que l’Escadron demeure un lieu où l’engagement, l’entraide, le respect et le dépassement de soi occupent une place importante.</p><p>En travaillant ensemble, nous pouvons offrir à nos jeunes des expériences enrichissantes qui leur permettront de grandir, de prendre confiance en eux et de devenir des citoyens engagés dans leur communauté.</p></div><div class="commander-signature"><strong>Éric-Olivier Lévesque</strong><span>Enseigne de vaisseau de 1re classe</span><span>Officier commandant</span><span>Escadron 736 Mont-Joli</span></div></div></div></section>`;
    profilePlaceholder.outerHTML = `<div class="staff-grid">${profiles}</div><section class="committee-section"><h2>Comité Répondant</h2><div class="staff-grid committee-grid">${committeeProfiles}</div></section>${commanderMessage}`;
    document.querySelectorAll('.commander-message-new .commander-rank').forEach((rank) => {
      rank.textContent = 'Lieutenant de Vaisseau';
    });
    document.querySelectorAll('.commander-message-new .commander-signature span:first-of-type').forEach((rank) => {
      rank.textContent = 'Lieutenant de Vaisseau';
    });
    document.querySelectorAll('.commander-message-new img').forEach((image) => {
      image.loading = 'lazy';
      image.decoding = 'async';
    });
  }

  let lastScrollPosition = window.scrollY;
  window.addEventListener('scroll', () => {
    if (!registrationBubble) return;
    const currentScrollPosition = window.scrollY;
    const scrollingDown = currentScrollPosition > lastScrollPosition && currentScrollPosition > 80;
    registrationBubble.classList.toggle('is-hidden', scrollingDown);
    lastScrollPosition = currentScrollPosition;
  }, { passive: true });

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = siteNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      if (!isOpen) {
        siteNav.querySelectorAll('.dropdown.open').forEach((item) => {
          item.classList.remove('open');
          item.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }

  const dropdowns = Array.from(document.querySelectorAll('.site-nav .dropdown'));
  dropdowns.forEach((dropdown) => {
    const dropdownToggle = dropdown.querySelector('.dropdown-toggle');
    dropdownToggle?.addEventListener('click', () => {
      const expanded = !dropdown.classList.contains('open');
      dropdowns.forEach((item) => {
        item.classList.toggle('open', item === dropdown && expanded);
        item.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', String(item === dropdown && expanded));
      });
    });
  });

  document.addEventListener('click', (event) => {
    if (siteNav?.contains(event.target)) return;
    dropdowns.forEach((item) => {
      item.classList.remove('open');
      item.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
    });
  });

  siteNav?.querySelectorAll('.dropdown-menu a').forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('open');
      navToggle?.setAttribute('aria-expanded', 'false');
      dropdowns.forEach((item) => {
        item.classList.remove('open');
        item.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
      });
    });
  });

  const historyPage = document.querySelector('.history-page');
  if (historyPage) {
    const heroMedia = historyPage.querySelector('.history-hero-media');
    if (heroMedia) {
      heroMedia.removeAttribute('role');
      heroMedia.removeAttribute('aria-label');
      heroMedia.innerHTML = '<img src="Photos/Banniere.jpg" alt="Cadets de l’Escadron 736 réunis devant un hélicoptère" fetchpriority="high" decoding="async" />';
    }

    const heroEyebrow = historyPage.querySelector('.history-hero-content .eyebrow');
    const heroTitle = historyPage.querySelector('.history-hero-content h1');
    const heroSubtitle = historyPage.querySelector('.history-hero-content p');
    if (heroEyebrow) heroEyebrow.textContent = 'Notre Histoire';
    if (heroTitle) heroTitle.textContent = 'Notre Histoire';
    if (heroSubtitle) heroSubtitle.textContent = 'Une passion pour l’aviation qui traverse les générations.';

    const beginningsImage = historyPage.querySelector('.history-introduction .history-photo-placeholder');
    if (beginningsImage) {
      beginningsImage.classList.add('has-photo', 'history-logo-photo');
      beginningsImage.removeAttribute('role');
      beginningsImage.removeAttribute('aria-label');
      beginningsImage.innerHTML = '<img src="assets/images/logo-escadron.webp" alt="Logo de l’Escadron 736 Mont-Joli" loading="lazy" decoding="async" />';
    }

    const founderImage = historyPage.querySelector('.history-founder .founder-photo');
    if (founderImage) {
      founderImage.classList.add('has-photo', 'founder-archive-photo');
      founderImage.removeAttribute('role');
      founderImage.removeAttribute('aria-label');
      founderImage.innerHTML = '<img src="Photos/major-ivan-ross.jpeg" alt="Portrait historique du major Ivan Ross" loading="lazy" decoding="async" />';
    }

    const regionImage = historyPage.querySelector('.history-region-image');
    if (regionImage) {
      regionImage.classList.add('has-photo');
      regionImage.removeAttribute('role');
      regionImage.removeAttribute('aria-label');
      regionImage.innerHTML = '<img src="Photos/bcatp-mont-joli.jpg" alt="Aviateurs devant un avion d’entraînement de la Seconde Guerre mondiale" loading="lazy" decoding="async" />';
    }

    const regionCopy = historyPage.querySelector('.history-region .history-copy');
    if (regionCopy) {
      regionCopy.innerHTML = '<span class="eyebrow">Un territoire aéronautique</span><h2>Une région profondément liée à l’aviation</h2><p>L’histoire de l’Escadron 736 s’inscrit dans une région possédant un riche patrimoine aéronautique.</p><p>De 1941 à 1945, Mont-Joli a accueilli la 9e École de bombardier et de tir de l’Aviation royale canadienne. Établie dans le cadre du Programme d’entraînement aérien du Commonwealth britannique, cette école a formé plus de 6 000 aviateurs durant la Seconde Guerre mondiale.</p><p>Cet héritage se poursuit aujourd’hui avec l’aéroport régional de Mont-Joli, qui demeure un acteur important du développement aéronautique de l’Est-du-Québec.</p><p>L’Escadron 736 s’inscrit dans cette tradition en permettant aux nouvelles générations de découvrir l’aviation et l’aérospatiale, tout en développant leur leadership et leur esprit d’équipe.</p>';
    }

    const frameDialog = historyPage.querySelector('[data-cadet-frame-dialog]');
    const frameDialogImage = frameDialog?.querySelector('[data-cadet-frame-large]');
    const frameCloseButton = frameDialog?.querySelector('[data-cadet-frame-close]');
    let lastFrameTrigger = null;
    historyPage.querySelectorAll('[data-frame-src]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!frameDialog || !frameDialogImage) return;
        lastFrameTrigger = button;
        frameDialogImage.src = button.dataset.frameSrc;
        frameDialogImage.alt = button.dataset.frameAlt || 'Cadre d’hommage aux Cadets-Commandants';
        frameDialog.showModal();
        frameCloseButton?.focus();
      });
    });
    frameCloseButton?.addEventListener('click', () => frameDialog?.close());
    frameDialog?.addEventListener('click', (event) => {
      if (event.target === frameDialog) frameDialog.close();
    });
    frameDialog?.addEventListener('close', () => lastFrameTrigger?.focus());

    const cadetCommandersList = historyPage.querySelector('[data-cadet-commanders-list]');
    if (cadetCommandersList) {
      const cadetCommanders = [
        ['Adjudant', 'Raymond Boulanger', '1963 – 1974'],
        ['Adjudant', 'Louis-Ange Ratté', '1963 – 1974'],
        ['Adjudant', 'Claude Bernier', '1963 – 1974'],
        ['Adjudant', 'Denis Morissette', '1963 – 1974'],
        ['Adjudant', 'Gilles Lavoie', '1963 – 1974'],
        ['Adjudant', 'Kenneth Trottier', '1963 – 1974'],
        ['Adjudant', 'Mario Bélanger', '1974 – 1975'],
        ['Adjudant', 'Charles Langlois', '1975 – 1976'],
        ['Adjudant', 'Gérald Blais', '1976 – 1983'],
        ['Adjudant', 'Steeve Levesque', '1976 – 1983'],
        ['Adjudant', 'Pauline Sergerie', '1976 – 1983'],
        ['Adjudant', 'Mario Gagnon', '1976 – 1983'],
        ['Adjudant', 'Patrice Boudreau', '1976 – 1983'],
        ['Adjudant', 'Côme Savard', '1983 – 1987'],
        ['Adjudant', 'Éric Joubert', '1983 – 1987'],
        ['Adjudant', 'Nancy Tremblay', '1983 – 1987 G'],
        ['', 'Gino Banville', '1987'],
        ['Adjudant', 'Francis Gonthier', '1987 – 1988'],
        ['Adjudant', 'Michel Caouette', '1988 – 1989'],
        ['Adjudant', 'Louis Beaulieu', ''],
        ['Adjudant 1', 'Carl Joubert', '1990 – 1991'],
        ['Adjudant 1', 'Nancy Ouellet', '1991 – 1992'],
        ['Adjudant 1', 'Dominique Joubert', '1992 – 1993'],
        ['Adjudant 1', 'Andrée Gauthier', '1993 – 1994'],
        ['Adjudant 1', 'Sacha Dubé', '1994'],
        ['Adjudant 1', 'Frédéric Munger', '1994 – 1995'],
        ['Adjudant 1', 'Sébastien Pouliot', '1995 – 1997'],
        ['Adjudant 1', 'Geneviève Paquet', '1997 – 1998'],
        ['Adjudant 1', 'Olivier Harton', '1998 – 1999'],
        ['Adjudant 1', 'Pascal Beaulieu', '1999 – 2000'],
        ['Adjudant 1', 'Martin Pâquet', '2000'],
        ['Adjudant 1', 'Notola Chouinard', '2000 – 2002'],
        ['Adjudant 1', 'Marie-Claude Beaulieu', '2002 – 2003'],
        ['Adjudant 1', 'Alexandre Bouchard', '2003 – 2004'],
        ['Adjudant 2', 'Nancy Fournier', '2004'],
        ['Adjudant 2', 'Noémie St-Laurent', '2004 – 2005'],
        ['Adjudant 2', 'Elaine André-Guilbault', '2005 – 2007'],
        ['Adjudant 1', 'Marie-Christine Bernier', '2007 – 2008'],
        ['Adjudant 1', 'Vincent Bouchard', '2008 – 2010'],
        ['Adjudant 1', 'Marc-Antoine Bouchard', '2010 – 2011'],
        ['Adjudant 1', 'Alexandre Hamel', '2011 – 2013']
      ];
      cadetCommandersList.replaceChildren(...cadetCommanders.map(([rank, name, years]) => {
        const item = document.createElement('li');
        item.className = 'cadet-commander-entry';
        if (years) {
          const period = document.createElement('span');
          period.className = 'cadet-commander-years';
          period.textContent = years;
          item.appendChild(period);
        }
        const details = document.createElement('span');
        details.className = 'cadet-commander-details';
        if (rank) {
          const grade = document.createElement('span');
          grade.className = 'cadet-commander-rank';
          grade.textContent = rank;
          details.appendChild(grade);
        }
        const cadetName = document.createElement('strong');
        cadetName.textContent = name;
        details.appendChild(cadetName);
        item.appendChild(details);
        return item;
      }));
    }
  }

  const commandersGrid = document.querySelector('.history-commanders .commanders-grid');
  if (commandersGrid) {
    [['.history-introduction', 'history-beginnings'], ['.history-founder', 'history-founder'], ['.history-commanders', 'history-commanders'], ['.history-timeline-section', 'history-timeline'], ['.history-archives', 'history-archives']].forEach(([selector, id]) => {
      document.querySelector(selector)?.setAttribute('id', id);
    });
    const commanders = [
      ['Capitaine', 'Yves Galbrand', '2021 — 2025'],
      ['Capitaine', 'Sébastien Brillant', '2020 — 2021'],
      ['Sous-lieutenant', 'Marie-Ève Blais', '2018 — 2020'],
      ['Lieutenant de vaisseau', 'Gaétan Beaudin', '2016 — 2018'],
      ['Major', 'Jacques Chenard', '2015 — 2016'],
      ['Capitaine', 'Christine Bouchard', '2013 — 2015'],
      ['Capitaine', 'Yves Galbrand', '2009 — 2013'],
      ['Lieutenant de vaisseau', 'Jean Côté', '2008 — 2009'],
      ['Capitaine', 'Sylvain Gagnon', '2005 — 2008'],
      ['Capitaine', 'Sylvie Lambert', '2002 — 2005'],
      ['Capitaine', 'Michel Turcotte', '1998 — 2002'],
      ['Capitaine', 'Gino Berthier Lévesque', '1997 — 1998'],
      ['Capitaine', 'Marie-Claude Joubert', '1996 — 1997'],
      ['Capitaine', 'Nadine Beaulieu', '1993 — 1996'],
      ['Major', 'François Dornier', '1989 — 1993'],
      ['Capitaine', 'Patricia Côté', '1987 — 1989'],
      ['Capitaine', 'Luc Gilbert', '1983 — 1987'],
      ['Major', 'Renald Ouellet', '1976 — 1983'],
      ['Capitaine', 'Maurice Lévesque', '1975 — 1976'],
      ['Capitaine', 'Gaston Dufour', '1974 — 1975'],
      ['Major', 'Ivan Ross', '1963 — 1974']
    ];
    const sectionHeading = commandersGrid.closest('.history-commanders')?.querySelector('.section-heading');
    if (sectionHeading) {
      sectionHeading.innerHTML = '<span class="eyebrow">Archives historiques</span><h2>Hommage à nos officiers commandants</h2><p class="history-section-subtitle">Escadron 736 Mont-Joli</p><p>Depuis sa fondation, l’Escadron 736 Mont-Joli a été dirigé par plusieurs officiers commandants qui ont contribué, au fil des années, à son développement, à son évolution et à son rayonnement auprès des jeunes de la région.</p><p>Cette section rend hommage aux personnes qui ont assumé la responsabilité de l’Escadron 736 Mont-Joli au cours de son histoire.</p>';
    }
    commandersGrid.className = 'commanders-timeline';
    commandersGrid.innerHTML = commanders.slice().reverse().map(([rank, name, term, isCurrent]) => `<article class="commander-card commander-timeline-card${isCurrent ? ' is-current' : ''} reveal-on-scroll"><div class="commander-timeline-marker" aria-hidden="true">${isCurrent ? '★' : '◆'}</div><div class="commander-timeline-content">${isCurrent ? '<span class="commander-current-badge">Commandant actuel</span>' : ''}<p class="history-kicker">${rank}</p><h3>${name}</h3><p class="commander-role">Officier commandant</p>${term ? `<p class="founder-years">${term}</p>` : ''}</div></article>`).join('');
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
