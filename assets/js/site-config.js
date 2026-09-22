window.siteConfig = {
  siteName: "Escadron 736 Mont-Joli",
  facebookUrl: "https://www.facebook.com/profile.php?id=100092501214672",
  instagramUrl: "https://www.instagram.com/escadron736/",
  registrationUrl: "/accueil/devenir-cadet.html",
  email: "escadron736@gmail.com",
  phone: "(418) 775-8794",
  address: "254 AV ROSS, Mont-Joli, QC, Canada, G5H 3M4",
  socials: {
    facebook: "https://www.facebook.com/profile.php?id=100092501214672",
    instagram: "https://www.instagram.com/escadron736/"
  }
};

const siteNameElements = document.querySelectorAll('[data-site-name]');
siteNameElements.forEach((element) => {
  element.textContent = window.siteConfig.siteName;
});

const registrationLinks = document.querySelectorAll('[data-registration-link]');
registrationLinks.forEach((link) => {
  link.href = window.siteConfig.registrationUrl || '#';
});

const facebookLinks = document.querySelectorAll('[data-facebook-link]');
facebookLinks.forEach((link) => {
  link.href = window.siteConfig.facebookUrl || '#';
  link.setAttribute('aria-label', 'Facebook');
});

const instagramLinks = document.querySelectorAll('[data-instagram-link]');
instagramLinks.forEach((link) => {
  link.href = window.siteConfig.instagramUrl || '#';
  link.setAttribute('aria-label', 'Instagram');
});

const contactEmail = document.querySelector('[data-contact-email]');
if (contactEmail) {
  contactEmail.href = window.siteConfig.email ? `mailto:${window.siteConfig.email}` : '#';
  contactEmail.textContent = window.siteConfig.email || '[COURRIEL À FOURNIR]';
}

const contactAddress = document.querySelector('[data-contact-address]');
if (contactAddress) {
  contactAddress.textContent = window.siteConfig.address || '[ADRESSE À FOURNIR]';
}

const contactPhone = document.querySelector('[data-contact-phone]');
if (contactPhone) {
  contactPhone.textContent = window.siteConfig.phone || '[TÉLÉPHONE À FOURNIR]';
}

const currentYear = document.querySelector('[data-current-year]');
if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}
