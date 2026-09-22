document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const status = document.querySelector('[data-contact-status]');
  const rateLimitKey = 'escadron736-contact-last-sent';
  const submissionCooldown = 60_000;
  const minFillTime = 3_000; // anti-spam : rejette les envois trop rapides pour être humains
  const formOpenedAt = Date.now();

  const setStatus = (message, state = '') => {
    status.textContent = message;
    status.className = `form-status ${state}`.trim();
  };

  const fields = {
    name: { el: document.getElementById('name'), validate: (v) => v.trim().length >= 2 },
    email: { el: document.getElementById('email'), validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
    subject: { el: document.getElementById('subject'), validate: (v) => v.trim().length >= 3 },
    message: { el: document.getElementById('message'), validate: (v) => v.trim().length >= 10 }
  };

  const setFieldError = (field, hasError) => {
    const group = field.el.closest('.field-group');
    if (!group) return;
    group.classList.toggle('has-error', hasError);
  };

  const validateField = (field) => {
    const isValid = field.validate(field.el.value);
    setFieldError(field, !isValid);
    return isValid;
  };

  Object.values(fields).forEach((field) => {
    if (!field.el) return;
    field.el.addEventListener('blur', () => validateField(field));
    field.el.addEventListener('input', () => {
      if (field.el.closest('.field-group')?.classList.contains('has-error')) {
        validateField(field);
      }
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Anti-spam : champ piège invisible, ne doit jamais être rempli par un humain
    const honeypot = document.getElementById('website');
    if (honeypot && honeypot.value.trim() !== '') {
      return;
    }

    // Anti-spam : un envoi trop rapide après le chargement du formulaire est suspect
    if (Date.now() - formOpenedAt < minFillTime) {
      setStatus('Veuillez patienter quelques secondes avant d’envoyer le formulaire.', 'is-error');
      return;
    }

    const allValid = Object.values(fields)
      .filter((field) => field.el)
      .map((field) => validateField(field))
      .every(Boolean);

    if (!allValid) {
      setStatus('Veuillez corriger les champs en erreur avant d’envoyer le formulaire.', 'is-error');
      const firstInvalid = Object.values(fields).find((field) => field.el?.closest('.field-group')?.classList.contains('has-error'));
      firstInvalid?.el.focus();
      return;
    }

    const values = {
      name: fields.name.el.value.trim(),
      email: fields.email.el.value.trim(),
      subject: fields.subject.el.value.trim(),
      message: fields.message.el.value.trim()
    };

    const recipient = window.siteConfig.contactEmail || window.siteConfig.email || '';

    if (!recipient) {
      setStatus('Veuillez renseigner une adresse courriel officielle dans la configuration du site avant de l’utiliser.', 'is-error');
      return;
    }

    const lastSubmission = Number(localStorage.getItem(rateLimitKey) || 0);
    const remainingSeconds = Math.ceil((submissionCooldown - (Date.now() - lastSubmission)) / 1000);
    if (remainingSeconds > 0) {
      setStatus(`Veuillez attendre ${remainingSeconds} secondes avant un nouvel envoi.`, 'is-error');
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    submitButton.disabled = true;
    setStatus('Envoi en cours...');
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: `[Escadron 736] Nouveau message - ${values.subject}`,
          _template: 'box',
          _replyto: values.email,
          'Type de message': 'Demande de contact',
          'Nom du visiteur': values.name,
          'Adresse de réponse': values.email,
          'Sujet du message': values.subject,
          'Message reçu': values.message,
          'Date de réception': new Date().toLocaleString('fr-CA'),
          'Provenance': 'Formulaire Contact - escadron736.ca',
          'Action suggérée': 'Utilisez Répondre pour communiquer avec le visiteur.'
        })
      });
      if (!response.ok) throw new Error('Contact could not be sent');
      localStorage.setItem(rateLimitKey, String(Date.now()));
      setStatus('Merci. Votre message a été envoyé.', 'is-success');
      form.reset();
      Object.values(fields).forEach((field) => setFieldError(field, false));
    } catch (error) {
      setStatus('L’envoi a échoué. Veuillez réessayer plus tard.', 'is-error');
    } finally {
      submitButton.disabled = false;
    }
  });
});
