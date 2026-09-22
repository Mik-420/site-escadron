let portfolioData = [];

const groupRanges = [
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
  { value: '2026', label: '2026' },
  { value: '2027', label: '2027' }
];

const filters = document.getElementById('portfolio-filters');
const grid = document.getElementById('portfolio-grid');
const pagination = document.getElementById('portfolio-pagination');
const year2026Nav = document.getElementById('portfolio-2026-nav');
const year2025Nav = document.getElementById('portfolio-2025-nav');
const reviewToggle = document.getElementById('portfolio-review-toggle');
const reviewNav = document.getElementById('portfolio-review-nav');
const souperToggle = document.getElementById('portfolio-souper-toggle');
const souperNav = document.getElementById('portfolio-souper-nav');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxTitle = document.getElementById('lightbox-title');
const lightboxMeta = document.getElementById('lightbox-meta');
const lightboxDownload = document.getElementById('lightbox-download');

const itemsPerPage = 25;
let currentFilter = '2024';
let currentActivity = 'all';
let currentItems = [];
let currentPage = 1;
let currentIndex = 0;

reviewToggle?.addEventListener('click', (event) => {
  event.preventDefault();
  currentFilter = '2026';
  currentActivity = 'Revue Annuelle';
  currentPage = 1;
  if (reviewNav) reviewNav.hidden = !reviewNav.hidden;
  renderGallery();
  buildFilters();
});

reviewNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    currentFilter = '2026';
    currentActivity = link.dataset.activity || link.textContent.trim();
    currentPage = 1;
    renderGallery();
  });
});

souperToggle?.addEventListener('click', (event) => {
  event.preventDefault();
  const expanded = souperNav ? souperNav.hidden : false;
  if (souperNav) souperNav.hidden = !expanded;
  souperToggle.setAttribute('aria-expanded', String(expanded));
  currentFilter = '2026';
  currentActivity = 'Souper de Trouple';
  currentPage = 1;
  renderGallery();
});

souperNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    currentFilter = '2026';
    currentActivity = link.dataset.activity || link.textContent.trim();
    currentPage = 1;
    renderGallery();
  });
});


year2026Nav?.querySelectorAll(':scope > a:not(#portfolio-review-toggle):not(#portfolio-souper-toggle)').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    currentFilter = '2026';
    currentActivity = link.textContent.trim();
    currentPage = 1;
    renderGallery();
  });
});

function buildFilters() {
  if (!filters) return;

  filters.innerHTML = groupRanges.map((group) => `
    <button class="filter-btn ${group.value === currentFilter ? 'active' : ''}" data-group="${group.value}" type="button">
      ${group.label}
    </button>
  `).join('');

  const year2026Button = filters.querySelector('[data-group="2026"]');
  if (year2026Button && year2026Nav) {
    year2026Button.insertAdjacentElement('afterend', year2026Nav);
  }

  const year2025Button = filters.querySelector('[data-group="2025"]');
  if (year2025Button && year2025Nav) {
    year2025Button.insertAdjacentElement('afterend', year2025Nav);
  }

  filters.querySelectorAll('.filter-btn').forEach((button) => {
    button.addEventListener('click', () => {
      currentFilter = button.dataset.group;
      if (currentFilter === '2026') currentActivity = 'all';
      if (currentFilter === '2025') currentActivity = 'all';
      currentPage = 1;
      if (year2026Nav) year2026Nav.hidden = currentFilter !== '2026';
      if (year2025Nav) year2025Nav.hidden = currentFilter !== '2025';
      renderGallery();
      buildFilters();
    });
  });
}

if (year2026Nav) year2026Nav.hidden = currentFilter !== '2026';
if (year2025Nav) year2025Nav.hidden = currentFilter !== '2025';

year2025Nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    currentFilter = '2025';
    currentActivity = link.textContent.trim();
    currentPage = 1;
    renderGallery();
  });
});

function getFilteredItems() {
  return portfolioData.filter((item) => item.year === Number(currentFilter) && (currentActivity === 'all' || item.activity === currentActivity));
}

function getVisibleItems() {
  const start = (currentPage - 1) * itemsPerPage;
  return currentItems.slice(start, start + itemsPerPage);
}

function renderPagination() {
  if (!pagination) return;

  const pageCount = Math.max(1, Math.ceil(currentItems.length / itemsPerPage));
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  pagination.innerHTML = `
    <button class="page-btn" data-page="prev" type="button" aria-label="Page précédente">‹</button>
    ${pages.map((page) => `
      <button class="page-btn ${page === currentPage ? 'active' : ''}" data-page="${page}" type="button" aria-label="Page ${page}">
        ${page}
      </button>
    `).join('')}
    <button class="page-btn" data-page="next" type="button" aria-label="Page suivante">›</button>
  `;

  pagination.querySelectorAll('.page-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.page;

      if (target === 'prev') {
        currentPage = Math.max(1, currentPage - 1);
      } else if (target === 'next') {
        currentPage = Math.min(pageCount, currentPage + 1);
      } else {
        currentPage = Number(target);
      }

      renderGallery();
    });
  });
}

function renderGallery() {
  currentItems = getFilteredItems();

  if (!grid) return;

  if (!currentItems.length) {
    if (currentFilter === '2024' || currentFilter === '2027') {
      grid.innerHTML = `<div class="portfolio-coming-soon"><span class="portfolio-coming-soon-icon" aria-hidden="true">✦</span><strong>Photos à venir</strong><p>Les photos de la période ${currentFilter} seront publiées prochainement.</p></div>`;
    } else {
      grid.innerHTML = '<div class="placeholder-box"><strong>[AUCUNE PHOTO]</strong><p>Ajoutez des images à la galerie pour cette période.</p></div>';
    }
    if (pagination) pagination.innerHTML = '';
    return;
  }

  const visibleItems = getVisibleItems();
  currentPage = Math.min(currentPage, Math.max(1, Math.ceil(currentItems.length / itemsPerPage)));

  grid.innerHTML = visibleItems.map((item, index) => `
    <article class="gallery-item">
      <button type="button" data-index="${(currentPage - 1) * itemsPerPage + index}" aria-label="Ouvrir la photo ${item.title}">
        <img src="${item.image}" alt="${item.title}" loading="lazy" />
        <div class="gallery-caption">
          <h3>${item.title}</h3>
          <p>${item.caption}</p>
        </div>
      </button>
    </article>
  `).join('');

  grid.querySelectorAll('button[data-index]').forEach((button) => {
    button.addEventListener('click', () => {
      currentIndex = Number(button.dataset.index);
      openLightbox();
    });
  });

  renderPagination();
}

function openLightbox() {
  if (!lightbox || !currentItems[currentIndex]) return;

  const item = currentItems[currentIndex];
  lightboxImage.src = item.image;
  lightboxImage.alt = item.title;
  lightboxDownload.href = item.image;
  lightboxDownload.download = item.title || 'photo-portfolio';
  lightboxTitle.textContent = item.title;
  lightboxMeta.textContent = item.caption;
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
}

function showNext() {
  if (!currentItems.length) return;
  currentIndex = (currentIndex + 1) % currentItems.length;
  openLightbox();
}

function showPrev() {
  if (!currentItems.length) return;
  currentIndex = (currentIndex - 1 + currentItems.length) % currentItems.length;
  openLightbox();
}

if (lightbox) {
  const closeButton = lightbox.querySelector('.lightbox-close');
  const prevButton = lightbox.querySelector('.lightbox-nav.prev');
  const nextButton = lightbox.querySelector('.lightbox-nav.next');

  closeButton?.addEventListener('click', closeLightbox);
  prevButton?.addEventListener('click', showPrev);
  nextButton?.addEventListener('click', showNext);

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('open')) return;

    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowRight') showNext();
    if (event.key === 'ArrowLeft') showPrev();
  });
}

async function loadPortfolioData() {
  const folders = [
    ['Revue Annuelle', 'Portfolio/2026/Revue Annuelle 2026/Photo Revue Annuelle/'],
    ['Kiosque', 'Portfolio/2026/Revue Annuelle 2026/Photo Kiosque/'],
    ['Photo Individuel - Revue Annuelle', 'Portfolio/2026/Revue Annuelle 2026/Photo Individuel/'],
    ['Souper de Trouple', 'Portfolio/2026/Souper de Troupe 2026/Photo souper de troupe/'],
    ['Photo Individuel - Souper de Trouple', 'Portfolio/2026/Souper de Troupe 2026/Photo Individuel/'],
      ['Camping St-Fabien', 'Portfolio/2026/Camping St-Fabien 2026/'],
      ['Activité Québec', 'Portfolio/2026/Activités Québec/'],
      ['Survie', 'Portfolio/2026/Survie 2026/'],
      ['all', 'Portfolio/2026/2026/'],
      ['Parade Promesse', 'Portfolio/2025/Parade Promesse 2025/', 2025],
      ['Activité', 'Portfolio/2025/Activité 2025/', 2025],
      ['Halloween', 'Portfolio/2025/Halloween 2025/', 2025],
      ['Coquelicot', 'Portfolio/2025/Coquelicot 2025/', 2025]
  ];

  try {
    const results = await Promise.all(folders.map(async ([activity, folder, folderYear]) => {
      const response = await fetch(folder);
      if (!response.ok) return [];
      const html = await response.text();
      const documentFragment = new DOMParser().parseFromString(html, 'text/html');
      return Array.from(documentFragment.querySelectorAll('a[href$=".jpg"]')).map((link) => ({
        title: activity === 'all' ? '2026' : activity.split(' - ')[0],
        activity,
        year: folderYear || 2026,
        group: '2026',
        image: `${folder}${decodeURIComponent(link.getAttribute('href'))}`,
        caption: activity === 'all' ? '2026' : activity === 'Revue Annuelle' ? '2026' : `${activity} - 2026`
      }));
    }));
    portfolioData = results.flat();
  } catch (error) {
    portfolioData = [];
  }

  buildFilters();
  renderGallery();
}

loadPortfolioData();
