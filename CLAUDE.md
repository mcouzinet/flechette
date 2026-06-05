# Flechette - Guide de développement

## Projet

Application web de suivi de scores pour jeux de fléchettes. Déployée sur https://flechettes.surge.sh/

## Stack technique

- **Framework** : Vue.js 3 (Options API)
- **Build** : Vite 4
- **Style** : Tailwind CSS 3 + police custom Nebula Sans
- **Tests** : Vitest + Vue Test Utils (environnement jsdom)
- **Déploiement** : Surge.sh (`npm run deploy`)
- **Backend** : Firebase (Firestore pour les résultats, Auth pour magic link)
- **Auth** : Firebase Auth magic link (optionnelle - on peut jouer sans compte)

## Commandes

```bash
npm run dev          # Serveur de développement
npm run build        # Build production dans /dist
npm run preview      # Preview du build
npm run deploy       # Déploie sur surge.sh
npm test             # Tests (watch mode)
npm run test:ui      # Tests avec interface Vitest UI
npm run test:coverage # Tests avec couverture
```

## Architecture

```
src/
  App.vue                    # Shell : gestion joueurs + sélection de jeu + auth
  main.js                    # Point d'entrée Vue
  firebase.js                # Config et init Firebase (auth + firestore)
  components/
    Cricket.vue              # Jeu Cricket
    301.vue                  # Jeu 301/501/etc.
    Shanghai.vue             # Jeu Shanghai
    Horloge.vue              # Autour de l'horloge (1→20→Bulle)
    Killer.vue               # Jeu Killer (élimination)
    Morpion.vue              # Morpion fléchettes (3x3)
    __tests__/               # Tests unitaires par composant
  services/
    firebaseService.js       # Envoi des résultats vers Firestore + fallback localStorage
    __tests__/
  assets/
    main.css                 # Styles principaux (import Tailwind + fonts)
    fonts.css                # Définitions @font-face Nebula Sans
    NebulaSans/              # Fichiers de police (OTF, TTF, WOFF2)
  test/
    setup.js                 # Setup Vitest (mock localStorage + Firebase)
```

## Conventions

- **Langue** : Interface et commentaires en français
- **Composants** : Options API Vue 3 (pas Composition API)
- **Navigation** : Pas de vue-router, navigation par état `currentComponent` dans App.vue
- **Données** : LocalStorage pour joueurs (`flechette-players`), Firestore pour résultats de parties
- **Style** : Thème sombre, couleur accent `#2cadfe`, gradients `from-gray-800 to-gray-900`
- **Props** : Les jeux reçoivent `players` en prop depuis App.vue
- **Alias** : `@` pointe vers `./src` (configuré dans vite.config.js)

## Variables d'environnement

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

## Structure d'un composant de jeu

Chaque jeu suit le même pattern :
1. Reçoit `players` en prop
2. Initialise les participants avec scores/zones
3. Gère les tours et les scores
4. Détecte la victoire
5. Affiche un modal de victoire
6. Envoie les résultats via `firebaseService`
7. Supporte le plein écran et le raccourci Backspace (annuler)

## Firebase

- **Projet** : flechettes-ecccb
- **Firestore** : collection `game_results` (résultats de parties)
- **Auth** : magic link email (optionnel), domaine autorisé : flechettes.surge.sh
- **Fallback** : si Firebase échoue, sauvegarde dans localStorage (`dartVictories`)
