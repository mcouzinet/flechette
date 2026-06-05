# Flechettes

App de scores de flechettes entre potes. 10 jeux, Vue 3, Firebase.

https://flechettes.surge.sh/

## Jeux disponibles

- **Cricket** - Ferme les zones 20 a 15 + la bulle (mode 3 bulles, 1 bulle ou sans)
- **301 / 501** - Pars d'un score et tombe a zero pile (101 a 1001)
- **Count Up** - 8 rounds, le plus haut score gagne
- **Shanghai** - 20 rounds, simple / double / triple
- **Autour de l'horloge** - Touche 1 a 20 puis la bulle dans l'ordre
- **Killer** - Deviens killer, elimine les autres
- **Morpion** - Tic-tac-toe sur cible de flechettes
- **Halve-It** - Rate ta cible = score divise par 2
- **Bob's 27** - Doubles 1 a 20 + bulle, touche ou perds
- **Baseball** - 9 manches de runs

## Stack

- Vue.js 3 (Options API)
- Vite
- Tailwind CSS
- Firebase (auth magic link + Firestore pour les resultats)
- Deploiement sur Surge.sh
- PWA (installable sur tablette/mobile)

## Architecture

Composants partages pour eviter la duplication entre les 10 jeux :

- `shared/GameHeader.vue` - Header commun (retour, titre, regles, relancer)
- `shared/GameModals.vue` - Modals (regles, reset, victoire)
- `shared/HistoryPanel.vue` - Panneau historique + annuler
- `mixins/fullscreenMixin.js` - Plein ecran
- `mixins/keyboardUndoMixin.js` - Backspace pour annuler

## Commandes

```sh
npm install        # Installer les dependances
npm run dev        # Serveur de developpement
npm run build      # Build production
npm run deploy     # Deployer sur surge.sh
npm test           # Lancer les tests
```
