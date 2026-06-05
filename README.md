# Flechettes

Application web de suivi de scores pour jeux de flechettes. Deployee sur https://flechettes.surge.sh/

## Jeux disponibles

- **Cricket** - Ferme les zones 20 a 15 + la bulle
- **301 / 501** - Pars d'un score et tombe a zero pile
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

## Commandes

```sh
npm install        # Installer les dependances
npm run dev        # Serveur de developpement
npm run build      # Build production
npm run deploy     # Deployer sur surge.sh
npm test           # Lancer les tests
```
