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

## Outil d'analytics (local uniquement)

Un tableau de bord analytique interne permet de suivre le trafic du site et de consulter
les messages reçus via les formulaires de contact et de suggestions. Cet outil n'est
**jamais déployé sur escadron736.ca** : tout son code vit dans le dossier
`analytics-local/`, exclu du dépôt via `.gitignore`.

Pour l'utiliser, remplacez la commande `python3 -m http.server 8000` par :

```bash
python3 analytics-local/server.py
```

Puis ouvrez :

```text
http://localhost:8000/analytics-local/dashboard/
```

Ce serveur sert le site normalement (mêmes pages, mêmes fichiers) et n'écoute que sur
`127.0.0.1` (jamais accessible depuis le réseau). Les données sont stockées localement
dans `analytics-local/data.db` (SQLite), généré automatiquement au premier lancement.

Le tableau de bord est protégé par mot de passe (authentification HTTP Basic).
Au premier démarrage, un mot de passe est généré automatiquement et affiché dans le
terminal (utilisateur `admin`) ; il est ensuite conservé dans `analytics-local/.dashboard_password`.
Vous pouvez aussi fixer votre propre mot de passe :

```bash
ANALYTICS_DASHBOARD_PASSWORD="votre-mot-de-passe" python3 analytics-local/server.py
```

Fonctionnalités du tableau de bord :
- Visiteurs uniques, pages vues, temps moyen, messages reçus (avec % d'évolution).
- Taux de rebond, nouveaux vs visiteurs de retour, ratio pages/visite.
- Graphique des visites par jour, top 10 des pages (cliquez une ligne pour voir sa tendance).
- Profondeur de défilement (25/50/75/100 %), sources de trafic (avec détail des référents).
- Messages des formulaires de contact et de suggestions, avec recherche, filtre « non lus »,
  pagination et bouton « Marquer comme lu ».
- Zone d'administration : purge des données de plus de X jours et export CSV.

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
