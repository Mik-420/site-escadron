document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (event) => {
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

    const body = `Nom: ${values.name}\nCourriel: ${values.email}\n\nSujet: ${values.subject}\n\nMessage:\n${values.message}`;
    const mailtoLink = `mailto:${window.siteConfig.email || ''}?subject=${encodeURIComponent(values.subject)}&body=${encodeURIComponent(body)}`;

    if (!window.siteConfig.email) {
      alert('Veuillez renseigner une adresse courriel officielle dans la configuration du site avant de l’utiliser.');
      return;
    }

    window.location.href = mailtoLink;
    form.reset();
  });
});
