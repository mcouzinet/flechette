# Flechette - Guide de developpement

## Projet

Application web de suivi de scores pour jeux de flechettes. Deployee sur https://flechettes.surge.sh/
Nom de l'app : Stonk

## Stack technique

- **Framework** : Vue.js 3 (Options API)
- **Build** : Vite 4
- **Style** : Tailwind CSS 3 + polices custom (Nebula Sans, Anton, Caveat, Hanken Grotesk)
- **Deploiement** : Surge.sh (`npm run build && npx surge dist --domain flechettes.surge.sh`)
- **Backend** : Firebase (Firestore pour les resultats, Auth pour magic link)
- **Auth** : Firebase Auth magic link (optionnelle - on peut jouer sans compte). Ne fonctionne pas en mode standalone/PWA.
- **PWA** : Installable sur tablette/mobile (site.webmanifest, meta tags)

## Commandes

```bash
npm run dev          # Serveur de developpement
npm run build        # Build production dans /dist
npm run preview      # Preview du build
npm run deploy       # Deploie sur surge.sh
```

## Architecture

```
src/
  App.vue                    # Shell : gestion joueurs + selection de jeu + auth
  main.js                    # Point d'entree Vue
  firebase.js                # Config et init Firebase (auth + firestore)
  components/
    shared/
      GameHeader.vue         # Header commun (retour, titre, regles, plein ecran, relancer)
      GameModals.vue         # 3 modals (regles, reset, victoire) avec slots
      HistoryPanel.vue       # Panneau historique + annuler avec scoped slot
    Cricket.vue              # Jeu Cricket (mode 3 bulles, 1 bulle, sans bulle)
    301.vue                  # Jeu 301/501/etc. (101 a 1001)
    Shanghai.vue             # Jeu Shanghai
    Horloge.vue              # Autour de l'horloge (1->20->Bulle)
    Killer.vue               # Jeu Killer (elimination)
    Morpion.vue              # Morpion flechettes (3x3)
    HalveIt.vue              # Halve-It (cibles imposees, rate = score /2)
    Bobs27.vue               # Bob's 27 (doubles 1->20->bulle, survie)
    Baseball.vue             # Baseball (9 manches de runs)
    CountUp.vue              # Count Up (8 rounds, plus haut score gagne)
    Resultats.vue            # Historique des parties (Firestore)
  mixins/
    fullscreenMixin.js       # toggleFullscreen() + isFullscreen
    keyboardUndoMixin.js     # Backspace -> undo (avec cleanup beforeUnmount)
  services/
    firebaseService.js       # Envoi des resultats vers Firestore + fallback localStorage
  assets/
    main.css                 # Styles principaux (import Tailwind + fonts + variables)
    chalk-buttons.css        # Styles globaux boutons (chalk-btn-ghost/green/red/gold)
    fonts.css                # Definitions @font-face Nebula Sans
    base.css                 # Reset CSS de base
    NebulaSans/              # Fichiers de police (OTF, TTF, WOFF2)
```

## Conventions

- **Langue** : Interface en francais
- **Composants** : Options API Vue 3 (pas Composition API)
- **Navigation** : Pas de vue-router, navigation par etat `currentComponent` dans App.vue
- **Donnees** : LocalStorage pour joueurs (`flechette-players`), Firestore pour resultats de parties
- **Style** : Theme sombre tableau noir, palette chalk (cream, red, green, gold)
- **Polices** :
  - `--font-display` (Anton) : titres, chiffres de score, boutons d'action
  - `--font-hand` (Caveat) : noms de joueurs, labels, texte manuscrit. Toujours >= text-lg (18px)
  - `--font-ui` (Hanken Grotesk) : texte de regles, interface generale
- **Boutons d'action** : font-display, 22px, border-radius 14px, padding 16px, grille 2x2 mobile
- **Props** : Les jeux recoivent `players` en prop depuis App.vue
- **Composants partages** : Utiliser GameHeader, GameModals, HistoryPanel + les mixins pour tout nouveau jeu
- **Alias** : `@` pointe vers `./src` (configure dans vite.config.js)

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

Chaque jeu suit le meme pattern :
1. Recoit `players` en prop
2. Utilise `GameHeader` (titre, sous-titre, events)
3. Utilise `mixins: [fullscreenMixin, keyboardUndoMixin]`
4. Definit `onUndo()` pour le raccourci Backspace
5. Initialise les participants avec scores/zones
6. Gere les tours et les scores
7. Detecte la victoire
8. Utilise `GameModals` (regles via slot, reset, victoire via slot)
9. Utilise `HistoryPanel` avec scoped slot pour les entrees
10. Envoie les resultats via `firebaseService`

## Firebase

- **Projet** : flechettes-ecccb
- **Firestore** : collection `game_results` (resultats de parties), index sur userId + createdAt
- **Security rules** : create/read restreint au userId, pas d'update/delete
- **Auth** : magic link email (optionnel), domaine autorise : flechettes.surge.sh
- **Fallback** : si pas connecte ou Firebase echoue, sauvegarde dans localStorage (`dartVictories`)
