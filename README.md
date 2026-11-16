# Lecteur DOCX

Lecteur de fichiers Word (`.docx`) pour téléphone, **100 % local** : aucun serveur, aucune collecte de données, aucun pisteur.
C'est une PWA : on l'installe depuis le navigateur sur l'écran d'accueil et elle fonctionne ensuite hors ligne.

## Fonctionnalités

- Ouverture d'un `.docx` depuis l'app Fichiers / le stockage du téléphone
- Texte reflowé, lisible sur petit écran (titres, gras, listes, tableaux, images, liens)
- Sommaire automatique à partir des titres
- Taille du texte réglable, thèmes clair / sépia / sombre / auto
- Documents récents et position de lecture mémorisés **sur l'appareil** (désactivable)
- Fonctionne hors ligne

## Confidentialité

- Le fichier est converti dans le navigateur par [mammoth.js](https://github.com/mwilliamson/mammoth.js) (inclus dans `vendor/`, aucun CDN).
- Une Content-Security-Policy stricte interdit tout script ou ressource externe.
- Les documents récents sont stockés dans IndexedDB, sur le téléphone uniquement.

## Déploiement sur GitHub Pages

1. Créer un dépôt (public, ou privé avec un compte GitHub Pro) et y pousser ce dossier.
2. *Settings → Pages → Build and deployment* : Source = **Deploy from a branch**, branche `main`, dossier `/ (root)`.
3. L'app est servie sur `https://<utilisateur>.github.io/<dépôt>/`.

## Installation sur le téléphone

- **iPhone (Safari)** : ouvrir l'URL → bouton Partager → *Sur l'écran d'accueil*.
- **Android (Chrome)** : ouvrir l'URL → menu ⋮ → *Installer l'application*.

## Développement local

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

Après toute modification d'un fichier, incrémenter `VERSION` dans `sw.js` pour que les téléphones récupèrent la mise à jour.

## Structure

```
index.html            Coquille de l'app
css/app.css           Styles et thèmes
js/app.js             Démarrage, navigation, événements
js/converter.js       Conversion DOCX → HTML + nettoyage
js/library.js         Documents récents (IndexedDB)
js/settings.js        Préférences d'affichage
js/toc.js             Sommaire
sw.js                 Cache hors ligne
vendor/               mammoth.js 1.13.0 (licence BSD-2)
```

## Limites

- Les anciens `.doc` (format binaire) ne sont pas pris en charge.
- La mise en page exacte (colonnes, en-têtes/pieds de page, positionnement) n'est pas reproduite : le contenu est adapté pour la lecture sur mobile.
