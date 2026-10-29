# Plan : connexion obligatoire et connexions sociales

**Réalisé le 29/10/2026**, voir « Bilan » en fin de document.

État au 29/10/2026. Prérequis acquis : PocketBase en production (`stonk-api`), connexion par code email fonctionnelle (SMTP Resend, expéditeur `stonk@cliche.tolarianstudio.com`), `account.js` sait déjà faire `authWithOAuth2`.

## Objectif

1. Le site ne s'utilise qu'une fois connecté : un écran d'accueil « connecte-toi » remplace l'accueil tant qu'il n'y a pas de session.
2. Connexion par Google, Discord et Apple, en plus du code email.
3. Personne ne perd ce qu'il avait : les victoires gardées dans le navigateur remontent dans le compte à la première connexion.

## Décisions prises par défaut (à contester avant de lancer)

- **Les invités d'une partie à distance doivent aussi se connecter.** Ouvrir un lien `?partie=CODE` mène à l'écran de connexion, puis directement à la partie. Alternative : laisser rejoindre sans compte et réserver le compte à l'organisateur ; plus de joueurs, moins de données.
- **On garde le code email** pour qui n'a ni Google ni Discord ni Apple.
- **Le « Qui es-tu ? » de la jonction** est prérempli avec le nom du compte.
- **La contrainte « jouer sans compte »** (CLAUDE.md, mémoire du projet) est levée : à réécrire dans CLAUDE.md.

## Étapes

### 1. Fournisseurs OAuth (serveur)

URL de retour commune : `https://stonk-api.tolarianstudio.com/api/oauth2-redirect`.

| Fournisseur | Ce qu'il faut créer | Coût |
|---|---|---|
| Google | Google Cloud Console : identifiants OAuth « Application Web », URL de retour ci-dessus | gratuit |
| Discord | discord.com/developers : application, onglet OAuth2, URL de retour | gratuit |
| Apple | compte Apple Developer : Services ID, clé Sign in with Apple (.p8), domaine `stonk-api.tolarianstudio.com` | 99 $/an (déjà nécessaire pour publier sur l'App Store) ; le secret client expire tous les 6 mois, PocketBase sait le régénérer depuis la clé |

Les identifiants passent par des variables Dokploy (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `APPLE_…`) lues par `pb_hooks/settings.pb.js`, comme le SMTP : rien dans le dépôt. Une migration active `oauth2` sur `users` et règle le mappage du nom et de l'avatar.

Fait quand : chaque fournisseur configuré apparaît dans `GET /api/collections/users/auth-methods`.

### 2. Écran de connexion (web)

- Nouveau composant `Connexion.vue`, dans la DA ardoise : boutons Google, Discord, Apple (masqués si le fournisseur n'est pas configuré, lu dans `auth-methods`), puis « ou par email » avec le code à 6 chiffres déjà en place. La modale de connexion actuelle de `App.vue` disparaît, son code est repris.
- `App.vue` : tant que `currentUser()` est vide, il rend `Connexion.vue` au lieu de l'accueil. Un lien `?partie=CODE` est gardé de côté et rejoué après connexion.
- OAuth sur le web : la fenêtre du fournisseur doit s'ouvrir dans le geste du clic (Safari iOS bloque sinon les fenêtres ouvertes après un `await`). Ouvrir la fenêtre d'abord, lui passer l'URL ensuite (`urlCallback`).
- Le compte affiche son nom (Google et Discord le donnent) ; à défaut, la partie avant le `@` de l'email.

Fait quand : une visite sans session tombe sur l'écran de connexion ; chacun des moyens de connexion mène à l'accueil ; un lien de partie survit à la connexion.

### 3. Reprise des données du navigateur

À la première connexion sur un appareil, les victoires de `dartVictories` sont envoyées dans `game_results` (marquées `extra.importeDe = "navigateur"`), puis la clé est vidée. La feuille de joueurs (`flechette-players`) reste locale.

Fait quand : des victoires locales apparaissent dans les scores du compte, une seule fois, même après déconnexion et reconnexion.

### 4. Serveur : resserrer les règles

Tout le monde étant connecté, `sessions` et `actions` exigent `@request.auth.id != ''` en création, et le champ `by` d'une action devient l'identifiant du compte (plus le jeton d'appareil). Le code de partie reste le jeton d'accès entre amis.

Fait quand : `npm run test:pb` passe avec des utilisateurs authentifiés, et un appel anonyme est refusé.

### 5. App native

Même écran ; OAuth via `@capacitor/browser` (déjà branché). Vérifier sur le simulateur iOS que le retour du fournisseur rend la main à l'app.

### 6. Vérifier, publier, documenter

- Tests : `account.js` (création par code, OAuth simulé), règles du serveur, reprise des victoires.
- Navigateur : connexion par chaque moyen, partie à distance à deux comptes, déconnexion.
- `npm run deploy`, poussée de `stonk-api`, mise à jour de CLAUDE.md et de la fiche serveur.

## Ce qui dépend de toi

- Créer les applications Google, Discord (et Apple si tu publies l'app) et poser leurs identifiants dans Dokploy. Le reste peut avancer sans : un fournisseur non configuré n'apparaît simplement pas.

## Risques

| Risque | Parade |
|---|---|
| Moins de parties : un ami qui reçoit un lien doit créer un compte avant de jouer | Google et Discord en un clic ; mesurer dans Umami les visites qui s'arrêtent à l'écran de connexion |
| Le code email part en indésirables | Domaine Resend déjà vérifié (SPF, DKIM) ; ajouter un domaine dédié à Stonk si la limite gratuite le permet un jour |
| Fenêtre OAuth bloquée sur iOS | Ouverture dans le geste du clic (étape 2) |
| Le serveur tombe : plus personne ne peut jouer, même en local | Nouveau, puisque le local dépendait de rien. Garder la session en cache : un utilisateur déjà connecté joue en local même serveur injoignable |

## Bilan (29/10/2026)

| Étape | État |
|---|---|
| 1. Fournisseurs | Code fait : `pb_hooks/oauth.pb.js` active Google, Discord et Apple dès que `GOOGLE_CLIENT_ID`/`_SECRET`, `DISCORD_CLIENT_ID`/`_SECRET`, `APPLE_CLIENT_ID`/`_SECRET` sont posés dans Dokploy. **Aucun n'est configuré en production** : seul le code email s'affiche. Testé en local avec des identifiants factices (boutons affichés, fenêtre ouverte dans le clic, départ vers Google avec PKCE). Le circuit complet chez un fournisseur reste à vérifier avec de vrais identifiants. |
| 2. Écran de connexion | Fait. Vérifié : visite sans compte, connexion par code, lien de partie rejoué après connexion (« Connecte-toi pour rejoindre la partie »). |
| 3. Reprise des victoires | Fait, testé (y compris une coupure réseau au milieu : ni perte ni doublon) et vérifié dans le navigateur. |
| 4. Règles serveur | Fait : `sessions` et `actions` exigent un compte, une action est signée par son auteur. `npm run test:pb` couvre le refus anonyme. |
| 5. App native | L'écran de connexion s'affiche dans le simulateur iOS contre la production. Retour d'OAuth dans l'app non vérifié (pas d'identifiants). |
| 6. Publication | Web et serveur déployés, CLAUDE.md à jour. |
