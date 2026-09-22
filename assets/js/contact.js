document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const status = document.querySelector('[data-contact-status]');

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

    const submitButton = form.querySelector('[type="submit"]');
    submitButton.disabled = true;
    status.textContent = 'Envoi en cours...';
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: `[Escadron 736] Contact - ${values.subject}`,
          _template: 'table',
          _replyto: values.email,
          'Nom': values.name,
          'Adresse courriel': values.email,
          'Sujet': values.subject,
          'Message': values.message,
          'Reçu le': new Date().toLocaleString('fr-CA'),
          'Source': 'Formulaire Contact de escadron736.ca'
        })
      });
      if (!response.ok) throw new Error('Contact could not be sent');
      status.textContent = 'Merci. Votre message a été envoyé.';
      form.reset();
    } catch (error) {
      status.textContent = 'L’envoi a échoué. Veuillez réessayer plus tard.';
    } finally {
      submitButton.disabled = false;
    }
  });
});
