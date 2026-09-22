# Escadron 736 Mont-Joli

Site web institutionnel en français québécois pour l'Escadron 736 Mont-Joli des Cadets de l'Air.

## Démarrer le site

1. Ouvrez le dossier dans Visual Studio Code.
2. Ouvrez un terminal dans le dossier du projet.
3. Exécutez la commande suivante :

```bash
python3 -m http.server 8000
```

4. Ouvrez votre navigateur à l'adresse :

```text
http://localhost:8000
```

## Modifier les liens

Les informations modifiables sont dans le fichier :

- `assets/js/site-config.js`

Modifiez-y :
- `siteName`
- `facebookUrl`
- `instagramUrl`
- `registrationUrl`
- `email`
- `phone`
- `address`

## Ajouter des photos

Les images du portfolio doivent être ajoutées dans le fichier :

- `assets/js/portfolio.js`

Chaque entrée de galerie contient :
- `title`
- `year`
- `group`
- `image`
- `caption`

## Modifier les textes

Les textes principaux du site sont dans les pages HTML :

- `index.html`
- `histoire.html`
- `contact.html`
- `cadets/*.html`

## Ajouter l'histoire de l'escadron

Le texte historique est à ajouter dans :

- `histoire.html`

Une structure d'exemple est déjà préparée avec des emplacements clairs pour les informations officielles.

## Modifier l'adresse courriel

La configuration de contact est dans :

- `assets/js/site-config.js`

## Modifier le lien d'inscription

Le lien officiel d'inscription est dans :

- `assets/js/site-config.js`

La variable à mettre à jour est :

```js
registrationUrl: ""
```

## Notes importantes

- Le site utilise des contenus temporaires lorsqu'une information officielle n'est pas disponible.
- Les informations historiques, réglementaires et officielles doivent être vérifiées avant publication.
- Ne pas remplacer les placeholders sans vérifier leur exactitude.
