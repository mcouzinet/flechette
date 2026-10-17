# Plan de migration : Firebase vers le VPS Tolarian

**Réalisé le 17/10/2026** (étapes 1 à 6, voir « Bilan » en fin de document).

État au 17/10/2026. Projet Firebase `flechettes-ecccb`, cible : serveur Tolarian (Dokploy, voir `~/Developer/infra/README.md`).

## 1. Ce que Firebase fait aujourd'hui

| Usage | Où | Volume réel |
|---|---|---|
| Connexion anonyme (jouer à distance sans compte) | `src/remote/session.js` | 9 comptes anonymes, tous de test |
| Comptes « vrais » : lien magique par email (web), Apple et Google (app native via `@capacitor-firebase/authentication`) | `App.vue`, `services/socialAuth.js` | **1 compte** (le tien) |
| `game_results` : victoires sauvegardées par compte | `services/firebaseService.js` | **4 documents** (juin 2026) |
| `sessions` : parties à distance, journal d'actions, temps réel (`onSnapshot`), écritures en transaction | `src/remote/session.js` | quelques sessions de test |
| Règles de sécurité | `firestore.rules` | |

Conséquence : il n'y a **presque rien à migrer en données**. Le travail est dans le code (temps réel, connexion) et l'hébergement, pas dans le transfert.

Coût actuel : offre gratuite Spark. La migration n'est donc pas une urgence économique ; elle sert à tout regrouper sur le VPS, à ne plus dépendre de Google, et à mesurer avec les mêmes outils que les autres projets.

## 2. Cible recommandée : PocketBase

Un seul binaire (Go + SQLite) qui couvre exactement les quatre besoins : comptes (email + mot de passe, code à usage unique par email, OAuth2 Apple et Google), base, **abonnements temps réel**, règles d'accès par collection. Interface d'administration incluse, SDK JS de 20 Ko.

Sur le serveur : une application Dokploy `stonk-api` (image `ghcr.io/muchobien/pocketbase` ou Dockerfile de 5 lignes), port 8090, volume `stonk-api-data`, adresse `api.stonk.tolarianstudio.com` ou `stonk-api.tolarianstudio.com`. Sauvegarde : copie nocturne chiffrée (age) du fichier SQLite, sur le modèle de CZ et Umami.

Alternatives écartées :
- **Supabase auto-hébergé** : déjà en place pour Cliché (`sb-cliche`), mais une instance par projet, une dizaine de conteneurs, et Postgres pour 4 lignes. Surdimensionné.
- **Petit serveur Node maison** (Express + SQLite + WebSocket) : environ 200 lignes pour les sessions, mais il faudrait réécrire les comptes, l'envoi d'email et OAuth. PocketBase les fournit.

## 3. Correspondance modèle par modèle

**Sessions à distance** (le cœur du changement)

Aujourd'hui : un document par session, avec le journal d'actions dans un tableau, réécrit en transaction à chaque fléchette. PocketBase n'a pas de transaction côté client. Le modèle devient plus simple et plus sûr :

- collection `sessions` : `code` (unique), `gameId`, `config`, `players`, `hostToken`, `status` ;
- collection `actions` : `session` (relation), `seq` (entier), `dart` (json), `by` ;
- **index unique `(session, seq)`** : deux téléphones qui lancent en même temps visent le même `seq`, le second est refusé et réessaie avec `seq + 1`. C'est la garantie que donnait la transaction.
- « Annuler » = supprimer l'action de `seq` maximal ; « Réinitialiser » = supprimer toutes les actions de la session.
- Temps réel : `pb.collection('actions').subscribe('*', cb, { filter: 'session = "…"' })` remplace `onSnapshot`.
- Les réducteurs (`src/remote/games/*.js`) et `buildState` ne changent pas : ils prennent déjà un journal d'actions.

Bonus : la limite de 2000 actions par session et le coût d'un tableau réécrit à chaque coup disparaissent.

**Connexion anonyme** : PocketBase n'en a pas. Pas nécessaire non plus : le modèle de confiance est déjà « le code de 6 lettres est le jeton ». Règles : lecture et ajout d'actions ouverts à qui connaît la session ; modification des métadonnées interdite ; le créateur reçoit un `hostToken` gardé en local s'il faut un jour des droits d'hôte.

**`game_results`** : collection du même nom, règle `userId = @request.auth.id` en lecture et création. Les 4 documents s'importent à la main.

**Comptes** :
- web : le lien magique devient un **code à 6 chiffres par email** (OTP de PocketBase). Demande un SMTP (OVH, Brevo gratuit jusqu'à 300 mails par jour).
- app native : **le point dur**. Le plugin actuel produit un `idToken` Apple ou Google pour Firebase ; PocketBase attend un flux OAuth2 avec redirection. Deux options : (a) passer par le navigateur intégré (`authWithOAuth2`, redirection vers l'app), (b) un hook PocketBase de 30 lignes qui vérifie l'`idToken` Apple/Google et ouvre la session. Recommandation : (a) d'abord, (b) seulement si l'expérience est mauvaise.
- ton compte : recréé avec le même email, puis ses 4 résultats rattachés.

## 4. Étapes

1. **Serveur** : déployer PocketBase sur Dokploy, volume, sauvegarde nocturne, SMTP. Créer les collections, l'index unique et les règles (versionnées dans `pb_migrations/` du dépôt).
2. **Sessions à distance** : réécrire `src/remote/session.js` (même interface exportée : `createSession`, `joinSession`, `peekSession`, `subscribe`, `throwDart`, `undoLast`, `resetGame`, `leaveSession`). `RemoteGame.vue` et les plateaux ne bougent pas. Adapter `session.test.js` et rejouer l'essai à deux appareils.
3. **Résultats et comptes web** : réécrire `firebaseService.js` et la modale de connexion de `App.vue` (email + code). Importer les 4 résultats.
4. **App native** : remplacer `socialAuth.js` (option a), retirer `@capacitor-firebase/authentication`, `GoogleService-Info.plist` et `google-services.json`, reconstruire iOS et Android.
5. **Bascule** : publier le web (`npm run deploy`), puis l'app. Les parties à distance en cours au moment de la bascule sont perdues (aucune n'est longue, et les données de test n'ont pas de valeur).
6. **Nettoyage**, deux semaines plus tard : retirer `firebase` du `package.json`, `src/firebase.js`, `src/firestore.js`, `firestore.rules`, `firebase.json`, les variables `VITE_FIREBASE_*`, puis fermer le projet Firebase. Mettre à jour `CLAUDE.md` et la fiche du serveur.

Ordre choisi pour livrer par morceaux : l'étape 2 seule peut partir en production pendant que les comptes restent sur Firebase (les deux SDK cohabitent le temps de la transition).

## 5. Risques

| Risque | Parade |
|---|---|
| Connexion Apple/Google dans l'app native moins fluide | Option (b) du hook ; ou garder seulement l'email |
| Emails de connexion classés en indésirables | SMTP avec SPF et DKIM sur `tolarianstudio.com` |
| Le VPS tombe : plus de parties à distance ni de sauvegarde de victoire | Le jeu local ne dépend de rien et continue de marcher ; sauvegarde nocturne ; c'est déjà le cas des autres projets |
| Concurrence de deux lancers simultanés | Index unique `(session, seq)` et nouvel essai côté client, couvert par un test |
| Le blocage de transaction vu le 28/08 (fléchette restée « en attente ») | Disparaît avec le modèle par action ; garder un délai d'expiration côté client |

## 6. Estimation

Une à deux journées de travail : une demi-journée serveur, une demi-journée sessions à distance, une demi-journée comptes web, le reste pour l'app native et les vérifications sur deux vrais appareils.

## Bilan (17/10/2026)

| Étape | État |
|---|---|
| 1. Serveur | Fait : PocketBase 0.40.5 sur https://stonk-api.tolarianstudio.com (dépôt privé `mcouzinet/stonk-api`), volume `stonk-api-data`, administrateur créé (mot de passe dans le trousseau, service `stonk-api`), sauvegarde nocturne chiffrée vers `mcouzinet/stonk-api-backups` relue avec succès. **SMTP non configuré** : variables `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` à poser dans Dokploy. |
| 2. Sessions à distance | Fait et en production, testé à deux onglets sur le serveur réel et par `npm run test:pb`. |
| 3. Résultats et comptes web | Fait. Ton compte recréé, tes 4 victoires importées. La connexion par code attend le SMTP. |
| 4. App native | Code fait, iOS et Android compilent. Apple et Google attendent leurs identifiants OAuth dans PocketBase. Jamais publiée sur les stores : aucun utilisateur à migrer. |
| 5. Bascule | Fait : le web est basculé, et l'app native n'a jamais été publiée, donc plus aucun client ne parle à Firebase. |
| 6. Nettoyage | Code, dépendances et configuration Firebase retirés. Il ne reste qu'à fermer le projet Firebase `flechettes-ecccb` (console Firebase, Paramètres du projet), plus rien ne l'utilise. |

Trouvés en route : derrière Traefik, PocketBase doit lire `X-Forwarded-For` (sinon tous les joueurs partagent un seul quota de requêtes) ; le serveur statique n'envoie pas de `Cache-Control`, d'où un rechargement automatique quand un déploiement retire un morceau de code.
