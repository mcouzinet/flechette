# Flechette - Guide de developpement

## Projet

Application web de suivi de scores pour jeux de flechettes. Deployee sur https://stonk.tolarianstudio.com/ (ancienne adresse flechettes.surge.sh redirigee)
Nom de l'app : Stonk

## Stack technique

- **Framework** : Vue.js 3 (Options API)
- **Build** : Vite 4
- **Style** : Tailwind CSS 3 + polices custom (Nebula Sans, Anton, Caveat, Hanken Grotesk)
- **Deploiement** : serveur Tolarian via la skill `publier` (`npm run deploy`, Node 22 requis)
- **Backend** : PocketBase auto-heberge sur le VPS (https://stonk-api.tolarianstudio.com, depot prive `mcouzinet/stonk-api`), Firebase abandonne le 17/10/2026
- **Auth** : OBLIGATOIRE depuis le 29/10/2026 (ecran `Connexion.vue` tant qu'il n'y a pas de session, invites d'une partie a distance compris). Google, Discord, Apple via OAuth2 PocketBase (affiches seulement si configures sur le serveur), sinon code a 6 chiffres par email. A la premiere connexion, les victoires gardees dans le navigateur remontent dans le compte. Hors ligne, une session deja ouverte reste valide.
- **PWA** : Installable sur tablette/mobile (site.webmanifest, meta tags)

## Commandes

```bash
npm run dev          # Serveur de developpement
npm run build        # Build production dans /dist
npm run preview      # Preview du build
npm run deploy       # Deploie sur stonk.tolarianstudio.com
```

## Architecture

```
src/
  App.vue                    # Shell : gestion joueurs + selection de jeu + auth
  main.js                    # Point d'entree Vue
  pocketbase.js              # Client PocketBase (VITE_PB_URL, sinon stonk-api.tolarianstudio.com)
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
    Resultats.vue            # Historique des parties (local + PocketBase si connecte)
  mixins/
    fullscreenMixin.js       # toggleFullscreen() + isFullscreen
    keyboardUndoMixin.js     # Backspace -> undo (avec cleanup beforeUnmount)
  services/
    resultsService.js        # Envoi des resultats vers PocketBase + fallback localStorage
    account.js               # Comptes : code email, OAuth2, deconnexion
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
- **Donnees** : LocalStorage pour joueurs (`flechette-players`), PocketBase pour resultats de parties et parties a distance
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
VITE_PB_URL   # facultatif : adresse du PocketBase (defaut https://stonk-api.tolarianstudio.com)
```

En local, `.env.development.local` (non versionne) peut pointer vers un PocketBase local : voir le README de `stonk-api`.

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
10. Envoie les resultats via `resultsService`

## Backend (PocketBase)

- **Serveur** : application Dokploy `stonk-api` (projet Stonk), volume `stonk-api-data`, sauvegarde nocturne chiffree vers `mcouzinet/stonk-api-backups`. Schema et regles dans `pb_migrations/` du depot `stonk-api` (chaque push redeploie).
- **Collections** : `sessions` (id = code de partie en minuscules, jamais listable), `actions` (une ligne par flechette, index unique session+epoch+seq, lecture avec `?s=<code>`), `game_results` (lisibles par leur seul proprietaire), `users`.
- **Tests** : `npm run test:pb` lance `src/remote/session.pb.test.js` contre un PocketBase local vierge.
- **Fallback** : si pas connecte ou si le serveur echoue, sauvegarde dans localStorage (`dartVictories`).
- **Historique** : projet Firebase `flechettes-ecccb`, plus utilise par personne (l'app native n'a jamais ete publiee) : a fermer.
