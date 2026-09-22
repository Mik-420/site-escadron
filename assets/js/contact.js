document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const status = document.querySelector('[data-contact-status]');
  const rateLimitKey = 'escadron736-contact-last-sent';
  const submissionCooldown = 60_000;
  const setStatus = (message, state = '') => {
    status.textContent = message;
    status.className = `form-status ${state}`.trim();
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const honeypot = document.getElementById('website');
    if (honeypot && honeypot.value.trim() !== '') {
      return;
    }

    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const subject = document.getElementById('subject');
    const message = document.getElementById('message');

    if (!name || !email || !subject || !message) return;

    const values = {
      name: name.value.trim(),
      email: email.value.trim(),
      subject: subject.value.trim(),
      message: message.value.trim()
    };

    if (!values.name || !values.email || !values.subject || !values.message) {
      alert('Veuillez remplir tous les champs du formulaire.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(values.email)) {
      alert('Veuillez saisir une adresse courriel valide.');
      return;
    }

    const recipient = window.siteConfig.contactEmail || window.siteConfig.email || '';

    if (!recipient) {
      alert('Veuillez renseigner une adresse courriel officielle dans la configuration du site avant de l’utiliser.');
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
    } catch (error) {
      setStatus('L’envoi a échoué. Veuillez réessayer plus tard.', 'is-error');
    } finally {
      submitButton.disabled = false;
    }
  });
});
