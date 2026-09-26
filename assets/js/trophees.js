document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('[data-trophies-grid]');
  const dialog = document.querySelector('[data-trophy-dialog]');
  const dialogBody = dialog?.querySelector('[data-trophy-dialog-body]');
  const closeButton = dialog?.querySelector('[data-trophy-close]');
  if (!grid || !dialog || !dialogBody) return;

  const trophyImage = (number) => `../images/trophees/trophee-${String(number).padStart(2, '0')}.jpg`;
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
  const periodPattern = /^\d{4}(?:-\d{4}){1,2}$/;
  const getStartYear = (period) => Number(period.match(/^\d{4}/)?.[0] || 0);

  const parseRecipients = (body, sectionNumber) => {
    const lines = body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
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
    return Array.from({ length: 10 }, (_, index) => {
      const number = index + 1;
      const section = sections.find((candidate) => candidate.number === number);
      return {
        id: `trophy-${number}`,
        name: section?.title || 'Nom à ajouter',
        description: number === 2 ? 'Dévouement' : number === 3 ? 'Meilleure amélioration au tir à la carabine à air' : number === 4 ? 'Meilleur Cadet Niveau 2' : number === 5 ? 'Trophée Élite' : '',
        image: trophyImage(number),
        recipients: section ? parseRecipients(section.body, number) : []
      };
    });
  };

  const renderPhoto = (trophy, compact = false) => `<div class="trophy-photo-placeholder${compact ? ' is-compact' : ''}"><span>Photo à ajouter</span><small>${escapeHtml(trophy.image)}</small></div>`;
  const renderCard = (trophy) => `<article class="trophy-card"><button class="trophy-card-button" type="button" data-trophy-id="${escapeHtml(trophy.id)}" aria-label="Voir les récipiendaires de ${escapeHtml(trophy.name)}">${renderPhoto(trophy)}<span class="trophy-card-content"><span class="trophy-card-number">Trophée</span><h3>${escapeHtml(trophy.name)}</h3>${trophy.description ? `<p>${escapeHtml(trophy.description)}</p>` : ''}<span class="btn btn-secondary trophy-card-cta">Voir les récipiendaires</span></span></button></article>`;
  const renderRecipients = (trophy) => trophy.recipients.length ? `<div class="trophy-recipient-list">${trophy.recipients.map((recipient) => `<div class="trophy-recipient"><strong>${escapeHtml(recipient.period)}</strong><span>${escapeHtml(recipient.name)}</span>${recipient.rank ? `<small>${escapeHtml(recipient.rank)}</small>` : ''}</div>`).join('')}</div>` : '<div class="trophy-empty-state">Les récipiendaires seront ajoutés lorsque les informations seront disponibles.</div>';

  fetch('../assets/data/trophees-archives.txt')
    .then((response) => {
      if (!response.ok) throw new Error('Archive unavailable');
      return response.text();
    })
    .then((archive) => {
      const trophies = parseArchive(archive);
      grid.innerHTML = trophies.map(renderCard).join('');
      grid.addEventListener('click', (event) => {
        const button = event.target.closest('[data-trophy-id]');
        if (!button) return;
        const trophy = trophies.find((item) => item.id === button.dataset.trophyId);
        if (!trophy) return;
        dialogBody.innerHTML = `<div class="trophy-dialog-heading"><div>${renderPhoto(trophy, true)}</div><div><span class="eyebrow">Archive historique</span><h2 id="trophy-dialog-title">${escapeHtml(trophy.name)}</h2>${trophy.description ? `<p>${escapeHtml(trophy.description)}</p>` : ''}</div></div><div class="trophy-dialog-history"><h3>Récipiendaires</h3>${renderRecipients(trophy)}</div>`;
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
});
