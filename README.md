# SuperAnki Pro

Application de cartes mémoire (répétition espacée façon Anki) en **un seul fichier** : `index.html`.

- Ouvrir `index.html` dans le navigateur (double-clic), ou le déployer tel quel sur Netlify.
- Fonctionne hors ligne (icônes intégrées, aucun framework). Seules les polices et la synchro cloud utilisent Internet.

## Modifier le code

Les sources sont dans `src/` (`styles.css`, `body.html`, `app.js`, `seed-data.js` = les cartes d'origine).
Après une modification, régénérer le fichier final :

```
python3 build.py
```

## Fonctions principales

SM-2 et FSRS, options par paquet, sous-paquets, textes à trous, cartes inversées liées, drapeaux / marquage / suspension / enfouissement,
navigateur avec recherche à la Anki et édition en masse, annuler / rétablir, révisions personnalisées, statistiques,
synchronisation Supabase fusionnée carte par carte (chiffrement optionnel), sauvegardes automatiques, export / import TXT.

## Bibliothèque de paquets

Le contenu prêt à apprendre est dans `content/*.txt` (anglais / TOEIC, banque, assurance, finance, BUT TC).
Format : `question ;; réponse ;; indice` ou `C: texte avec {{c1::trou}} ;; infos`. `python3 build.py` le compile dans `index.html`.

## Simulateur TOEIC

Onglet **TOEIC** : test complet (200 questions, audio joué une fois, 75 min de Reading), mini-test, entraînement par partie (avec corrections ou en conditions d'examen), rejeu des erreurs, historique des scores estimés, objectif et date d'examen.

- Banque : `content/toeic/*.txt` (parties 1 à 7, voir l'en-tête de `build.py` pour le format). La première option de chaque question est la bonne ; l'application mélange les réponses.
- Audio : synthèse vocale du navigateur (voix et accents de l'appareil). Sans voix anglaise, le Listening s'affiche en transcription.
- Questions originales dans le style du TOEIC (pas de sujets officiels ETS). Les scores 5-495 par section sont des estimations.

## Hors-ligne et installation (PWA)

Pour installer l'app sur un téléphone, déploie ensemble ces 5 fichiers (ex. Netlify Drop) : `index.html`, `sw.js`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`. Il faut une adresse https. Ouvre-la une fois en ligne, puis « Ajouter à l'écran d'accueil » : l'app s'ouvre ensuite sans connexion. Ouvert en double-clic (`file://`), le mode hors-ligne ne s'active pas.

## Contenu riche : audio, LaTeX, images à masquer, import .apkg

- **Audio** : dans l'éditeur, boutons « fichier audio » et « micro » (≈ 1,5 Mo max par extrait). Option Paramètres › « Jouer les sons des cartes ».
- **LaTeX** : écris `\( x^2 \)` (ligne) ou `\[ ... \]` (bloc). KaTeX est chargé depuis internet à la première formule, puis gardé en cache. Le signe `$` n'est volontairement pas utilisé (montants en euros).
- **Image à masquer** : nouveau type de carte ; on dessine des cadres sur une image, un cadre = une carte.
- **Import .apkg** : Importer › « Importer un fichier .apkg ». Il faut l'export Anki « avec prise en charge des anciennes versions ». Les cartes arrivent comme neuves ; images et sons sont repris.
- Les images et sons importés sont stockés une seule fois (`data.media`) et synchronisés.

## Outils avancés (comme Anki)

Paramètres › Outils : **types de notes personnalisés** (champs et modèles de cartes), **paquets filtrés** (recherche enregistrée étudiée comme un paquet), **simulateur de charge**, **doublons**, **cartes vides**, **vérification de la base**, **export .apkg** (fichier importable dans Anki : médias, cloze, types perso, progression).
FSRS : optimisation **par préréglage** (Paramètres › Mémoire), recalcul de la mémoire des cartes après optimisation, option de replanification. « Équilibrer la charge » répartit les révisions sur les jours les moins chargés.
Le fichier `.apkg` est vérifié avec SQLite (`integrity_check`) et réimporté par l'app, mais pas testé avec l'application Anki elle-même.

## Étude : voix, groupes, minuteur, corbeille

- **Mode voix** (micro dans la session) : l'app lit la question, tu dis « réponse », elle lit la réponse, tu dis « raté / difficile / bien / facile ». Nécessite la reconnaissance vocale du navigateur (Chrome, Edge, Safari récent, https).
- **Petits groupes** et **minuteur de session** : Paramètres › Révision.
- **Corbeille** : Paramètres › Outils. Cartes et paquets supprimés gardés 30 jours, restauration avec leur progression.
- Logo refait (`logo.svg`, icônes 192/512 pour l'installation).
