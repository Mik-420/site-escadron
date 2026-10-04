document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('[data-trophies-grid]');
  const dialog = document.querySelector('[data-trophy-dialog]');
  const dialogBody = dialog?.querySelector('[data-trophy-dialog-body]');
  const closeButton = dialog?.querySelector('[data-trophy-close]');
  const imageDialog = document.querySelector('[data-trophy-image-dialog]');
  const largeTrophyImage = imageDialog?.querySelector('[data-trophy-image-large]');
  const imageCloseButton = imageDialog?.querySelector('[data-trophy-image-close]');
  let lastImageTrigger = null;
  if (!grid || !dialog || !dialogBody) return;

  const trophyImageExtensions = {
    1: 'jpg',
    2: 'jpg',
    3: 'png',
    4: 'jpg',
    5: 'jpg',
    6: 'jpg',
    7: 'jpg',
    8: 'png',
    9: 'png',
    10: 'png',
    11: 'png',
    12: 'png',
    13: 'png',
    14: 'png',
    15: 'png',
    16: 'png',
    17: 'png',
    18: 'png',
    19: 'png',
    20: 'png'
  };
  const trophyImage = (number) => {
    const extension = trophyImageExtensions[number];
    if (!extension) return '';
    const directory = number >= 9 ? 'Trophées' : 'trophees';
    return `../Photos/${directory}/${number}.${extension}`;
  };
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
  const periodPattern = /^\d{4}(?:-\d{4}){1,2}$/;
  const getStartYear = (period) => Number(period.match(/^\d{4}/)?.[0] || 0);

  const parseRecipients = (body, sectionNumber) => {
    const lines = body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const directRecipients = lines
      .filter((line) => line.startsWith('Récipiendaire :'))
      .map((line, index) => ({ period: '', rank: '', name: line.slice('Récipiendaire :'.length).trim(), sourceIndex: index }));
    if (directRecipients.length) return directRecipients;

    const entries = [];
    let pending = [];
    lines.forEach((line) => {
      if (!periodPattern.test(line)) {
        pending.push(line);
        return;
      }
      const entryLines = pending;
      pending = [];
      if (!entryLines.length) return;
      if (sectionNumber === 1 && line === '1963-1974' && entryLines.some((entry) => /Officier Commandant/i.test(entry))) return;
      const commandantIndex = entryLines.findIndex((entry) => /Officier Commandant|Commandant/i.test(entry));
      const name = commandantIndex > 0 ? entryLines[commandantIndex - 1] : entryLines[entryLines.length - 1];
      const rank = commandantIndex > 1 ? entryLines[0] : commandantIndex === -1 && entryLines.length > 1 ? entryLines.slice(0, -1).join(' ') : '';
      entries.push({ period: line, name, rank, sourceIndex: entries.length });
    });
    return entries.sort((left, right) => getStartYear(right.period) - getStartYear(left.period) || left.sourceIndex - right.sourceIndex);
  };

  const parseArchive = (text) => {
    const sections = [];
    const headingPattern = /(?:^|\n)(\d+)\.\s*([^\n]*)/g;
    const headings = [...text.matchAll(headingPattern)];
    headings.forEach((heading, index) => {
      const number = Number(heading[1]);
      const start = heading.index + heading[0].length;
      const end = headings[index + 1]?.index ?? text.length;
      sections.push({ number, title: heading[2].trim() || 'Nom à ajouter', body: text.slice(start, end) });
    });
    return sections
      .filter((section) => section.number >= 1 && section.number <= 20)
      .sort((left, right) => {
        const displayOrder = (number) => number === 20 ? 18 : number > 17 ? number + 1 : number;
        return displayOrder(left.number) - displayOrder(right.number);
      })
      .map((section) => {
        const number = section.number;
        return {
          id: `trophy-${number}`,
          name: section.title,
          description: number === 2 ? 'Dévouement' : number === 3 ? 'Meilleure amélioration au tir à la carabine à air' : number === 4 ? 'Meilleur Cadet Niveau 2' : number === 5 ? 'Trophée Élite' : '',
          image: trophyImage(number),
          recipients: parseRecipients(section.body, number)
        };
      });
  };

  const renderPhoto = (trophy, compact = false) => trophy.image ? `<div class="trophy-photo-placeholder${compact ? ' is-compact' : ''}"><img src="${escapeHtml(trophy.image)}" alt="${escapeHtml(trophy.name)}" loading="lazy" decoding="async" /></div>` : `<div class="trophy-photo-placeholder${compact ? ' is-compact' : ''}"><span>Photo à ajouter</span><small>Photos/Trophées/${String(trophy.id.replace('trophy-', '')).padStart(2, '0')}.jpg</small></div>`;
  const renderTrophyTitle = (name, element = 'h3', id = '') => {
    const [title, subtitle] = name.split(/\s+-\s+/, 2);
    return `<${element}${id ? ` id="${id}"` : ''} class="trophy-title"><span>${escapeHtml(title)}</span>${subtitle ? `<span class="trophy-title-subtitle">${escapeHtml(subtitle)}</span>` : ''}</${element}>`;
  };
  const renderCard = (trophy) => `<article class="trophy-card"><button class="trophy-photo-button" type="button" data-trophy-image-id="${escapeHtml(trophy.id)}" aria-label="Agrandir la photo de ${escapeHtml(trophy.name)}">${renderPhoto(trophy)}</button><span class="trophy-card-content"><span class="trophy-card-number">Trophée</span>${renderTrophyTitle(trophy.name)}<button class="btn btn-secondary trophy-card-cta" type="button" data-trophy-id="${escapeHtml(trophy.id)}">Voir les récipiendaires</button></span></article>`;
  const renderRecipients = (trophy) => trophy.recipients.length ? `<div class="trophy-recipient-list">${trophy.recipients.map((recipient) => `<div class="trophy-recipient">${recipient.period ? `<strong>${escapeHtml(recipient.period)}</strong>` : ''}${recipient.rank || recipient.period ? `<small>${escapeHtml(recipient.rank || 'Grade non précisé')}</small>` : ''}<span>${escapeHtml(recipient.name)}</span></div>`).join('')}</div>` : '<div class="trophy-empty-state">Les récipiendaires seront ajoutés lorsque les informations seront disponibles.</div>';

  fetch('../assets/data/trophees-archives.txt?v=20261003-19-recipient')
    .then((response) => {
      if (!response.ok) throw new Error('Archive unavailable');
      return response.text();
    })
    .then((archive) => {
      const trophies = parseArchive(archive);
      grid.innerHTML = trophies.map(renderCard).join('');
      grid.addEventListener('click', (event) => {
        const imageButton = event.target.closest('[data-trophy-image-id]');
        if (imageButton) {
          const trophy = trophies.find((item) => item.id === imageButton.dataset.trophyImageId);
          if (!trophy?.image || !imageDialog || !largeTrophyImage) return;
          lastImageTrigger = imageButton;
          largeTrophyImage.src = trophy.image;
          largeTrophyImage.alt = trophy.name;
          imageDialog.showModal();
          imageCloseButton?.focus();
          return;
        }
        const button = event.target.closest('[data-trophy-id]');
        if (!button) return;
        const trophy = trophies.find((item) => item.id === button.dataset.trophyId);
        if (!trophy) return;
        dialogBody.innerHTML = `<div class="trophy-dialog-heading"><div>${renderPhoto(trophy, true)}</div><div><span class="eyebrow">Archive historique</span>${renderTrophyTitle(trophy.name, 'h2', 'trophy-dialog-title')}${trophy.description ? `<p>${escapeHtml(trophy.description)}</p>` : ''}</div></div><div class="trophy-dialog-history"><h3>Récipiendaires</h3>${renderRecipients(trophy)}</div>`;
        dialog.showModal();
        closeButton.focus();
      });
    })
    .catch(() => {
      grid.innerHTML = '<p class="trophy-load-error">Les informations des trophées ne sont pas disponibles pour le moment.</p>';
    });

  const closeDialog = () => dialog.close();
  closeButton?.addEventListener('click', closeDialog);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog();
  });
  dialog.addEventListener('close', () => {
    grid.querySelector('[data-trophy-id]')?.focus();
  });

  imageCloseButton?.addEventListener('click', () => imageDialog.close());
  imageDialog?.addEventListener('click', (event) => {
    if (event.target === imageDialog) imageDialog.close();
  });
  imageDialog?.addEventListener('close', () => lastImageTrigger?.focus());
});
