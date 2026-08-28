<template>
  <main class="chalk-grain h-full flex flex-col overflow-y-auto xl:overflow-hidden"
    style="font-family: var(--font-ui); color: var(--chalk-cream); background: radial-gradient(120% 80% at 50% 0%, #1e2e28, var(--chalk-bg) 70%); padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right)">

    <!-- Cadre pointillé -->
    <div class="absolute inset-[10px] border-2 rounded-[10px] pointer-events-none opacity-50 z-0"
      style="border-color: var(--chalk-line)"></div>

    <!-- Voile sous la status bar (app native) : le contenu qui scrolle passe dessous -->
    <div class="statusbar-shim" aria-hidden="true"></div>

    <!-- Page d'accueil -->
    <div v-if="screen === 'home'" class="flex-1 flex flex-col xl:overflow-hidden relative z-10">

      <!-- Header -->
      <header class="flex items-start justify-between px-5 xl:px-9 pt-6 xl:pt-7 pb-4 flex-shrink-0">
        <div>
          <div class="flex items-center gap-3">
            <div class="chalk-target w-8 h-8 xl:w-10 xl:h-10"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill="currentColor" opacity=".25"/><circle cx="20" cy="20" r="13" fill="var(--chalk-bg, #142019)"/><circle cx="20" cy="20" r="8" fill="currentColor" opacity=".25"/><circle cx="20" cy="20" r="3" fill="currentColor"/></svg></div>
            <h1 class="text-3xl xl:text-[44px] tracking-wider" style="font-family: var(--font-display); text-shadow: 0 1px 0 rgba(0,0,0,.3)">STONK</h1>
          </div>
          <p class="ml-11 xl:ml-[54px] mt-1 text-lg xl:text-[22px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-gold)">
            Comme au comptoir — on ajoute, on choisit, on lance.</p>
        </div>
        <div class="hidden xl:flex gap-3">
          <button @click="currentComponent = 'Resultats'" class="chalk-btn" style="color: var(--chalk-faint)">les scores ✦</button>
          <button v-if="!user" @click="openAuth" class="chalk-btn" style="color: var(--chalk-faint)">connexion</button>
          <div v-else class="flex items-center gap-3">
            <span class="text-lg" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-gold)">{{ user.email }}</span>
            <button @click="logout" class="chalk-btn" style="color: var(--chalk-red)">quitter</button>
          </div>
        </div>
      </header>

      <!-- Corps : joueurs + jeux -->
      <div class="flex-1 flex flex-col xl:grid xl:gap-9 xl:overflow-hidden px-5 xl:px-9 pb-5 home-body">

        <!-- Sidebar joueurs -->
        <div class="xl:pr-8 mb-6 xl:mb-0 xl:overflow-y-auto chalk-scroll home-sidebar">
          <div class="flex items-baseline gap-3 mb-3">
            <span class="text-xl xl:text-[23px] tracking-wide" style="font-family: var(--font-display)">LA FEUILLE</span>
            <span class="text-lg" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-gold)">{{ players.length }} au tableau</span>
          </div>

          <!-- Liste des joueurs -->
          <div class="flex flex-col gap-0.5 mb-3">
            <div v-for="(player, index) in players" :key="player.id"
              class="flex items-center gap-3 py-2 px-1"
              style="border-bottom: 1.5px dashed var(--chalk-line)">
              <span class="w-6 text-[22px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">{{ index + 1 }}.</span>
              <div class="chalk-target w-5 h-5" :style="{ color: playerColors[index % playerColors.length] }"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill="currentColor" opacity=".25"/><circle cx="20" cy="20" r="13" fill="var(--chalk-bg, #142019)"/><circle cx="20" cy="20" r="8" fill="currentColor" opacity=".25"/><circle cx="20" cy="20" r="3" fill="currentColor"/></svg></div>
              <span class="flex-1 text-[26px] xl:text-[30px] leading-none" style="font-family: var(--font-hand); font-weight: 600">{{ player.name }}</span>
              <button @click="removePlayer(player.id)" class="text-2xl cursor-pointer leading-none bg-transparent border-none grid place-items-center min-w-[44px] min-h-[44px] -mr-2" style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-faint2)" :aria-label="`Retirer ${player.name}`">x</button>
            </div>
          </div>

          <!-- Ajout joueur -->
          <div class="flex gap-2">
            <label for="new-player" class="sr-only">Ajouter un joueur</label>
            <input id="new-player" v-model="newPlayerName" @keyup.enter="addPlayer" placeholder="+ ajouter un joueur..."
              autocapitalize="words" autocorrect="off" spellcheck="false" enterkeyhint="done"
              class="flex-1 bg-transparent border-none py-2 px-0 rounded-none"
              style="color: var(--chalk-cream); font-family: var(--font-hand); font-weight: 600; font-size: 24px; -webkit-appearance: none" />
            <button @click="addPlayer" class="chalk-btn" style="color: var(--chalk-green)">noter</button>
          </div>
        </div>

        <!-- Grille des jeux -->
        <div class="flex-1 flex flex-col min-h-0">
          <div class="flex-1 min-h-0 flex flex-col xl:overflow-y-auto chalk-scroll">
          <span class="text-[26px] xl:text-[30px] mb-3 hidden xl:block" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
            ...et on joue à quoi ce soir ?</span>

          <div class="grid grid-cols-2 xl:grid-cols-3 gap-2.5 xl:gap-3 pt-3">
            <button v-for="game in games" :key="game.id"
              :disabled="!game.component"
              @click="game.component && (selectedGame = game.id)"
              :class="[
                'game-tile text-left rounded-[14px] p-3 xl:p-4 transition-all duration-300 relative flex flex-col gap-1.5 xl:gap-2',
                selectedGame === game.id
                  ? 'border-2 border-solid'
                  : 'border-2 border-dashed',
                game.component ? 'cursor-pointer opacity-100' : 'cursor-default opacity-40'
              ]"
              :style="{
                borderColor: selectedGame === game.id ? 'var(--chalk-gold)' : 'var(--chalk-line)',
                background: selectedGame === game.id ? 'rgba(236,198,106,0.10)' : 'transparent'
              }"
>

              <div class="flex items-center gap-2 xl:flex-col xl:items-start xl:gap-2">
                <div class="chalk-target w-6 h-6 xl:w-8 xl:h-8" :style="{ color: selectedGame === game.id ? 'var(--chalk-gold)' : 'var(--chalk-cream)' }"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill="currentColor" opacity=".25"/><circle cx="20" cy="20" r="13" fill="var(--chalk-bg, #142019)"/><circle cx="20" cy="20" r="8" fill="currentColor" opacity=".25"/><circle cx="20" cy="20" r="3" fill="currentColor"/></svg></div>
                <div class="tracking-wide text-base xl:text-xl leading-tight" style="font-family: var(--font-display); color: var(--chalk-cream)">{{ game.name }}</div>
              </div>

              <div class="text-[16px] xl:text-[22px] leading-snug" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
                {{ game.component ? game.short : 'bientôt dispo' }}</div>

              <span v-if="selectedGame === game.id" class="absolute -top-3 right-3 px-2.5 py-0.5 rounded-full text-[13px]"
                style="font-family: var(--font-hand); font-weight: 700; background: var(--chalk-gold); color: var(--chalk-bg)">CHOISI</span>
            </button>
          </div>

          </div>

          <!-- Mode de jeu. Le distant est une OPTION de cette partie, pas un
               deuxieme parcours : meme feuille, meme jeu, meme lancement — seule
               la saisie se repartit sur les telephones. -->
          <div class="mode-block flex-shrink-0">
            <div class="mode-title">MODE DE JEU</div>

            <label class="mode-opt" :class="{ off: !remoteAvailable }">
              <input type="checkbox" class="mode-box" v-model="remotePlay" :disabled="!remoteAvailable" />
              <span class="mode-text">
                <span class="mode-label">Jouer à distance</span>
                <span class="mode-sub">Chaque joueur utilise son téléphone pour saisir son score pendant la partie.</span>
              </span>
            </label>

            <!-- Le seul reglage que le distant doit figer avant que les autres
                 rejoignent : en local, le 301 se choisit encore en cours de partie. -->
            <div v-if="remotePlay && selectedGame === '301'" class="mode-config">
              <span class="mode-config-label">Score de départ</span>
              <div class="mode-pills">
                <button v-for="s in startScores" :key="s" type="button"
                  :class="['mode-pill', remoteStart === s && 'on']" @click="remoteStart = s">{{ s }}</button>
              </div>
            </div>

            <p v-if="remoteError" class="mode-err">{{ remoteError }}</p>

            <button type="button" class="mode-join" @click="openJoin">
              On t'a donné un code ? <span class="mode-join-link">rejoindre une partie</span>
            </button>
          </div>

          <!-- Barre de lancement : hors de la zone qui defile, pour ne jamais
               recouvrir la derniere tuile. -->
          <div class="launch-bar flex items-center justify-between flex-shrink-0 gap-3">
            <span class="text-base xl:text-[22px] leading-tight" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
              <template v-if="players.length < 2">Il faut au moins deux joueurs sur la feuille.</template>
              <template v-else-if="remoteBlock">{{ remoteBlock }}</template>
              <template v-else>{{ selectedGameName }} · {{ players.length }} joueur{{ players.length > 1 ? 's' : '' }}<template v-if="remotePlay"> · à distance</template> →</template></span>
            <button @click="launchSelectedGame" :disabled="!canLaunch || launching"
              class="chalk-btn-big disabled:opacity-40 text-xl xl:text-[30px] whitespace-nowrap">{{ launching ? 'Ouverture…' : 'Lancer la partie' }}</button>
          </div>
        </div>
      </div>

      <!-- Footer mobile -->
      <div class="xl:hidden flex items-center justify-between py-3 flex-shrink-0 mx-5"
        style="border-top: 2px dashed var(--chalk-line)">
        <button @click="currentComponent = 'Resultats'" class="chalk-btn" style="color: var(--chalk-faint)">scores ✦</button>
        <button v-if="!user" @click="openAuth" class="chalk-btn" style="color: var(--chalk-faint)">connexion</button>
        <span v-else class="text-lg" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-gold)">{{ user.email }}</span>
      </div>
    </div>

    <!-- Meme partie, saisie repartie : le distant n'a pas d'ecran d'accueil a lui -->
    <div v-else-if="screen === 'remote-game'" class="relative flex-1 xl:overflow-hidden z-10">
      <RemoteGame :code="remoteCode" :invite="remoteInvite" @home="exitRemote" />
    </div>

    <!-- On a recu un lien ou un code : on rejoint la partie de quelqu'un d'autre -->
    <div v-else-if="screen === 'remote-join'" class="relative flex-1 xl:overflow-hidden z-10">
      <RemoteJoin :code="joinCode" @joined="onJoined" @home="exitRemote" />
    </div>

    <!-- Composant de jeu -->
    <div v-else class="relative flex-1 xl:overflow-hidden z-10">
      <component :is="currentComponent" :players="players" @exit="currentComponent = null" @login="openAuth" />
    </div>

    <!-- Modal de connexion -->
    <div v-if="showAuthModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="chalk-grain rounded-2xl p-8 border-2 border-dashed max-w-md mx-4 w-full"
        style="background: radial-gradient(120% 80% at 50% 0%, #1e2e28, var(--chalk-bg) 70%); border-color: var(--chalk-line)">
        <h3 class="text-2xl text-center mb-2" style="font-family: var(--font-display); color: var(--chalk-cream)">CONNEXION</h3>
        <p class="text-center mb-6 text-sm" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
          Connecte-toi pour sauvegarder tes résultats. Pas obligatoire pour jouer.</p>

        <div v-if="isStandalone" class="space-y-3">
          <button @click="signInApple" :disabled="authLoading"
            class="chalk-btn w-full disabled:opacity-40" style="color: var(--chalk-cream)">&#63743; Continuer avec Apple</button>
          <button @click="signInGoogle" :disabled="authLoading"
            class="chalk-btn w-full disabled:opacity-40" style="color: var(--chalk-gold)">Continuer avec Google</button>

          <div v-if="authMessage" :class="[
            'text-center text-sm p-3 rounded-lg',
            authMessage.includes('Erreur') ? 'text-[var(--chalk-red)]' : 'text-[var(--chalk-green)]'
          ]" style="font-family: var(--font-hand); font-weight: 600">{{ authMessage }}</div>
        </div>

        <div v-else class="space-y-4">
          <label for="auth-email" class="sr-only">Ton adresse email</label>
          <input id="auth-email" v-model="authEmail" @keyup.enter="sendMagicLink" type="email" placeholder="ton adresse email"
            autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="email" enterkeyhint="send"
            class="w-full bg-transparent py-3 px-2 text-base border-none rounded-none"
            style="border-bottom: 2px solid var(--chalk-line); color: var(--chalk-cream); font-family: var(--font-ui); -webkit-appearance: none" />

          <button @click="sendMagicLink" :disabled="!authEmail.trim() || authLoading"
            class="chalk-btn-big w-full disabled:opacity-40">
            {{ authLoading ? 'Envoi en cours...' : 'Recevoir un lien de connexion' }}
          </button>

          <div v-if="authMessage" :class="[
            'text-center text-sm p-3 rounded-lg',
            authMessage.includes('Erreur') ? 'text-[var(--chalk-red)]' : 'text-[var(--chalk-green)]'
          ]" style="font-family: var(--font-hand); font-weight: 600">{{ authMessage }}</div>
        </div>

        <button @click="showAuthModal = false; authMessage = ''"
          class="w-full mt-4 text-sm cursor-pointer bg-transparent border-none" style="color: var(--chalk-faint2)">
          Fermer</button>
      </div>
    </div>
  </main>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import GameLoading from './components/GameLoading.vue';
import GameLoadError from './components/GameLoadError.vue';
import { Capacitor } from '@capacitor/core';

// Firebase Auth n'est PAS importe statiquement : "jouer sans compte" est une
// contrainte produit, donc rien qui touche aux comptes ne doit se trouver sur
// le chemin du premier rendu.
let authMod = null;
const loadAuth = async () => {
  if (!authMod) {
    const [{ auth }, fb, social] = await Promise.all([
      import('./firebase.js'),
      import('firebase/auth'),
      import('./services/socialAuth.js'),
    ]);
    authMod = { auth, ...fb, ...social };
  }
  return authMod;
};

// Un compte n'existe que si Firebase a laisse sa trace en local.
const mayHaveAccount = () => {
  try {
    return Object.keys(localStorage).some(k => k.startsWith('firebase:authUser:'));
  } catch (e) {
    return false;
  }
};

// Lazy-load each game screen: the home bundle no longer ships the 10 games, the
// whole remote stack, or Firestore — they download on demand when opened.
const game = (loader) => defineAsyncComponent({ loader, loadingComponent: GameLoading, errorComponent: GameLoadError, delay: 150, timeout: 15000 });

export default {
  name: "Flechette",
  components: {
    Cricket: game(() => import('./components/Cricket.vue')),
    Horloge: game(() => import('./components/Horloge.vue')),
    Shanghai: game(() => import('./components/Shanghai.vue')),
    Game301: game(() => import('./components/301.vue')),
    Killer: game(() => import('./components/Killer.vue')),
    Morpion: game(() => import('./components/Morpion.vue')),
    HalveIt: game(() => import('./components/HalveIt.vue')),
    Bobs27: game(() => import('./components/Bobs27.vue')),
    Baseball: game(() => import('./components/Baseball.vue')),
    CountUp: game(() => import('./components/CountUp.vue')),
    Resultats: game(() => import('./components/Resultats.vue')),
    RemoteGame: game(() => import('./remote/RemoteGame.vue')),
    RemoteJoin: game(() => import('./remote/RemoteJoin.vue')),
  },
  data() {
    return {
      user: null,
      authEmail: '',
      showAuthModal: false,
      authMessage: '',
      authLoading: false,
      isStandalone: false,
      selectedGame: 'cricket',
      // « Jouer a distance » est une option de la partie en cours de creation.
      remotePlay: false,
      remoteStart: 301,
      startScores: [101, 301, 401, 501, 701, 1001],
      remoteMeta: null, // metas des jeux distants, chargees a la premiere coche
      remoteView: null, // null | 'game' | 'join'
      remoteCode: '',
      remoteInvite: false,
      joinCode: '',
      launching: false,
      remoteError: '',
      playerColors: ['var(--chalk-red)', 'var(--chalk-green)', 'var(--chalk-gold)', 'var(--chalk-blue)', 'var(--chalk-pink)', 'var(--chalk-orange)', 'var(--chalk-purple)', 'var(--chalk-cyan)'],
      games: [
        {
          id: 'cricket', name: 'Cricket', remoteId: 'cricket', short: 'Ferme 20→15 + bull',
          description: 'Ferme les zones 20, 19, 18, 17, 16, 15 et la bulle avant l\'adversaire.',
          component: 'Cricket'
        },
        {
          id: '301', name: '301 · 501', remoteId: 'x01', short: 'Tombe à zéro pile',
          description: 'Pars de 301 ou 501 et atteins exactement zéro pour gagner.',
          component: 'Game301'
        },
        {
          id: 'shangai', name: 'Shanghai', remoteId: 'shanghai', short: 'Manche par manche',
          description: '20 manches, une cible par manche. Le Shanghai met fin à la partie.',
          component: 'Shanghai'
        },
        {
          id: 'horloge', name: 'Autour de l\'horloge', remoteId: 'horloge', short: '1 → 20 dans l\'ordre',
          description: 'Touche les numéros de 1 à 20 puis la bulle. Le plus rapide gagne.',
          component: 'Horloge'
        },
        {
          id: 'killer', name: 'Killer', remoteId: 'killer', short: 'Élimine les autres',
          description: 'Deviens killer puis élimine les adversaires en touchant leur double.',
          component: 'Killer'
        },
        {
          id: 'morpion', name: 'Morpion', remoteId: 'morpion', short: 'Tic-tac-toe fléché',
          description: 'Le morpion classique : aligne trois cases en touchant les zones.',
          component: 'Morpion'
        },
        {
          id: 'halveit', name: 'Halve-It', remoteId: 'halveit', short: 'Divise ou domine',
          description: 'Cibles imposées par round. Rater = score divisé par 2.',
          component: 'HalveIt'
        },
        {
          id: 'bobs27', name: 'Bob\'s 27', remoteId: 'bobs27', short: 'Doubles ou dégage',
          description: 'Départ à 27 pts. Doubles 1→20→bulle. Touché +, raté −.',
          component: 'Bobs27'
        },
        {
          id: 'baseball', name: 'Baseball', remoteId: 'baseball', short: '9 manches de runs',
          description: '9 manches. Simple=1, Double=2, Triple=3 runs.',
          component: 'Baseball'
        },
        {
          id: 'countup', name: 'Count Up', remoteId: 'countup', short: '8 rounds, max de points',
          description: '8 rounds de 3 flechettes. Le plus haut score total gagne.',
          component: 'CountUp'
        }
      ],
      currentComponent: null,
      players: [],
      newPlayerName: '',
      nextPlayerId: 1
    };
  },
  computed: {
    selectedGameEntry() {
      return this.games.find(g => g.id === this.selectedGame) || null;
    },
    selectedGameName() {
      const game = this.selectedGameEntry;
      return game ? game.name : 'choisis un jeu';
    },
    // Un seul aiguillage d'ecran : accueil, jeu local, ou la meme partie jouee
    // a distance. Le distant n'a pas de racine a lui.
    screen() {
      if (this.remoteView === 'game') return 'remote-game';
      if (this.remoteView === 'join') return 'remote-join';
      return this.currentComponent ? 'local-game' : 'home';
    },
    remoteAvailable() {
      const g = this.selectedGameEntry;
      return !!(g && g.remoteId);
    },
    // Ce qui empeche de lancer CETTE partie a distance (chaine vide = rien).
    remoteBlock() {
      if (!this.remotePlay) return '';
      const g = this.selectedGameEntry;
      if (!g || !g.remoteId) return `${this.selectedGameName} ne se joue pas encore à distance.`;
      const meta = this.remoteMeta && this.remoteMeta[g.remoteId];
      if (meta && meta.maxPlayers && this.players.length > meta.maxPlayers) {
        return `${g.name} à distance se joue à ${meta.maxPlayers} joueurs — retire des noms de la feuille.`;
      }
      return '';
    },
    canLaunch() {
      return this.players.length >= 2 && !this.remoteBlock;
    }
  },
  watch: {
    // Le distant peut rendre la case inapplicable (jeu sans moteur distant) :
    // on la decoche plutot que de laisser une option morte cochee.
    selectedGame() {
      if (!this.remoteAvailable) this.remotePlay = false;
      this.remoteError = '';
    },
    // Les reducteurs distants sont purs (aucun Firebase) : les charger juste
    // pour lire min/maxPlayers ne tire pas Firestore sur l'accueil.
    async remotePlay(on) {
      this.remoteError = '';
      if (!on || this.remoteMeta) return;
      try {
        const { GAMES } = await import('./remote/games/index.js');
        const metas = {};
        for (const id of Object.keys(GAMES)) metas[id] = GAMES[id].meta;
        this.remoteMeta = metas;
      } catch (e) {
        console.error('Chargement des jeux à distance:', e);
      }
    },
    // Each screen swap reuses the same scroll containers: reset them so the new
    // screen starts at the top (a leftover offset also misroutes the first tap).
    screen() {
      this.$nextTick(() => {
        if (this.$el && this.$el.scrollTo) this.$el.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        const app = document.getElementById('app');
        if (app) app.scrollTop = 0;
      });
    }
  },
  mounted() {
    this.loadPlayersFromStorage();
    // Un ami a partage le lien de sa partie : on va droit a la jonction.
    const partie = this.readUrlCode();
    if (partie) {
      this.joinCode = partie;
      this.remoteView = 'join';
    }
    // L'etat de connexion arrive apres le premier rendu, jamais avant.
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 400));
    idle(() => this.initAuth());
    const isNative = Capacitor.isNativePlatform();
    const isPWA = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    if (isNative || isPWA) {
      this.isStandalone = true; // drives the in-app account UI (native sign-in)
    }
    // PWA keeps the original fixed (no-scroll) screens; the native app must be
    // able to scroll, so it gets its own class that does NOT force overflow:hidden.
    if (isPWA) document.documentElement.classList.add('is-standalone');
    if (isNative) document.documentElement.classList.add('is-native');
  },
  methods: {
    async initAuth() {
      const href = window.location.href;
      const retourDeLien = href.includes('oobCode') || href.includes('apiKey=');
      // Sans session possible ni retour de lien, on ne charge rien du tout.
      if (!retourDeLien && !mayHaveAccount()) return;

      const m = await loadAuth();
      m.onAuthStateChanged(m.auth, (user) => { this.user = user; });

      if (m.isSignInWithEmailLink(m.auth, href)) {
        let email = localStorage.getItem('flechette-auth-email');
        if (!email) {
          email = window.prompt('Confirmez votre email pour la connexion :');
        }
        if (email) {
          try {
            await m.signInWithEmailLink(m.auth, email, href);
            localStorage.removeItem('flechette-auth-email');
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (error) {
            console.error('Erreur connexion magic link:', error);
          }
        }
      }
    },

    async sendMagicLink() {
      if (!this.authEmail.trim()) return;
      this.authLoading = true;
      this.authMessage = '';

      const actionCodeSettings = {
        url: window.location.origin + window.location.pathname,
        handleCodeInApp: true
      };

      try {
        const m = await loadAuth();
        await m.sendSignInLinkToEmail(m.auth, this.authEmail, actionCodeSettings);
        localStorage.setItem('flechette-auth-email', this.authEmail);
        this.authMessage = 'Lien de connexion envoyé ! Vérifiez vos emails.';
        this.authEmail = '';
      } catch (error) {
        console.error('Erreur envoi magic link:', error);
        this.authMessage = 'Erreur lors de l\'envoi. Vérifiez l\'adresse email.';
      } finally {
        this.authLoading = false;
      }
    },

    async signInApple() {
      this.authLoading = true;
      this.authMessage = '';
      try {
        const m = await loadAuth();
        await m.signInWithApple();
        m.onAuthStateChanged(m.auth, (user) => { this.user = user; });
        this.showAuthModal = false;
      } catch (error) {
        console.error('Erreur connexion Apple:', error);
        this.authMessage = 'Erreur lors de la connexion Apple.';
      } finally {
        this.authLoading = false;
      }
    },

    async signInGoogle() {
      this.authLoading = true;
      this.authMessage = '';
      try {
        const m = await loadAuth();
        await m.signInWithGoogle();
        m.onAuthStateChanged(m.auth, (user) => { this.user = user; });
        this.showAuthModal = false;
      } catch (error) {
        console.error('Erreur connexion Google:', error);
        this.authMessage = 'Erreur lors de la connexion Google.';
      } finally {
        this.authLoading = false;
      }
    },

    async logout() {
      const m = await loadAuth();
      await m.signOut(m.auth);
      await m.nativeSignOut();
      this.user = null;
      this.showAuthModal = false;
    },

    openAuth() {
      this.showAuthModal = true;
      loadAuth();
    },

    // Un seul bouton « Lancer la partie » : la case a cocher decide si les
    // scores se saisissent ici ou sur les telephones de chacun.
    async launchSelectedGame() {
      const game = this.selectedGameEntry;
      if (!game || !this.canLaunch || this.launching) return;
      if (!this.remotePlay) {
        this.startGameDirectly(game);
        return;
      }
      this.launching = true;
      this.remoteError = '';
      try {
        const { createSession } = await import('./remote/session.js');
        const config = game.remoteId === 'x01' ? { start: this.remoteStart } : {};
        const code = await createSession({
          gameId: game.remoteId,
          config,
          players: this.players.map(p => ({ id: String(p.id), name: p.name })),
          hostName: this.players[0].name,
        });
        this.openRemoteGame(code, true);
      } catch (error) {
        console.error('Ouverture de la partie à distance:', error);
        this.remoteError = (error && error.message) || "Impossible d'ouvrir la partie à distance.";
      } finally {
        this.launching = false;
      }
    },

    openRemoteGame(code, invite) {
      this.remoteCode = code;
      this.remoteInvite = !!invite;
      this.remoteView = 'game';
      this.setUrlCode(code);
    },
    openJoin() {
      this.joinCode = '';
      this.remoteError = '';
      this.remoteView = 'join';
    },
    onJoined(code) {
      this.openRemoteGame(code, false);
    },
    exitRemote() {
      this.remoteView = null;
      this.remoteCode = '';
      this.joinCode = '';
      this.remoteInvite = false;
      this.setUrlCode('');
    },
    // Le code vit dans l'URL pendant la partie : recharger l'onglet ou renvoyer
    // le lien ramene sur la meme partie au lieu de l'accueil.
    readUrlCode() {
      try {
        const raw = new URLSearchParams(window.location.search).get('partie') || '';
        const code = raw.trim().toUpperCase();
        return /^[A-Z0-9]{6}$/.test(code) ? code : '';
      } catch (error) {
        return '';
      }
    },
    setUrlCode(code) {
      try {
        const url = new URL(window.location.href);
        if (code) url.searchParams.set('partie', code);
        else url.searchParams.delete('partie');
        window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
      } catch (error) {
        /* pas d'URL manipulable (WebView exotique) : sans effet */
      }
    },

    loadPlayersFromStorage() {
      const savedPlayers = localStorage.getItem('flechette-players');
      if (savedPlayers) {
        try {
          const parsedPlayers = JSON.parse(savedPlayers);
          this.players = parsedPlayers;
          if (parsedPlayers.length > 0) {
            this.nextPlayerId = Math.max(...parsedPlayers.map(p => p.id)) + 1;
          }
        } catch (error) {
          console.error('Erreur lors du chargement des joueurs:', error);
        }
      }
    },
    savePlayersToStorage() {
      localStorage.setItem('flechette-players', JSON.stringify(this.players));
    },
    startGameDirectly(game) {
      if (game.component && this.players.length >= 2) {
        this.currentComponent = game.component;
      }
    },
    addPlayer() {
      if (!this.newPlayerName.trim()) return;
      
      const newPlayer = {
        id: this.nextPlayerId++,
        name: this.newPlayerName.trim()
      };
      
      this.players.push(newPlayer);
      this.newPlayerName = '';
      this.savePlayersToStorage();
    },
    removePlayer(playerId) {
      this.players = this.players.filter(player => player.id !== playerId);
      this.savePlayersToStorage();
    },
    clearPlayers() {
      this.players = [];
      this.savePlayersToStorage();
    }
  }
};
</script>

<style>
/* Chalk target (concentric rings) */
.chalk-target {
  --ct-color: var(--chalk-cream);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.9;
}
.chalk-target svg {
  width: 100%;
  height: 100%;
}

/* Chalk buttons */
.chalk-btn {
  font-family: var(--font-hand);
  font-weight: 600;
  font-size: 22px;
  background: transparent;
  border: 2px solid currentColor;
  border-radius: 12px;
  padding: 5px 18px;
  cursor: pointer;
  line-height: 1.1;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1);
  letter-spacing: 0.3px;
  white-space: nowrap;
}
/* Game tile hover */
.game-tile:not(:disabled):hover {
  border-color: var(--chalk-faint) !important;
  background: rgba(241,230,203,0.05) !important;
}

/* Responsive home layout */
@media (min-width: 1280px) {
  .home-body { grid-template-columns: 330px 1fr; }
  .home-sidebar { border-right: 2px dashed var(--chalk-line); }
  .launch-bar {
    padding: 16px 0 4px;
    border-top: 2px dashed var(--chalk-line);
    margin-top: 10px;
  }
}
@media (max-width: 1279px) {
  .home-sidebar { border-bottom: 2px dashed var(--chalk-line); padding-bottom: 16px; }
  /* CTA collé en bas de l'écran pendant le scroll des tuiles.
     Le fond s'étend à travers la safe area pour ne pas laisser
     les tuiles apparaître sous la barre (home indicator). */
  .launch-bar {
    position: sticky;
    bottom: 0;
    z-index: 20;
    margin-left: -20px;
    margin-right: -20px;
    margin-bottom: calc(0px - env(safe-area-inset-bottom));
    padding: 14px 20px calc(12px + env(safe-area-inset-bottom));
    background: linear-gradient(to top, #16241f 78%, rgba(22,36,31,0) 100%);
  }
}

.chalk-btn-big {
  font-family: var(--font-hand);
  font-weight: 600;
  font-size: 30px;
  color: var(--chalk-red);
  background: transparent;
  border: 2px solid var(--chalk-red);
  border-radius: 16px;
  padding: 8px 30px;
  cursor: pointer;
  line-height: 1.1;
  box-shadow: inset 0 0 0 1px rgba(239,139,111,0.2);
  letter-spacing: 0.3px;
  white-space: nowrap;
}

/* Hide the desktop-only fullscreen toggle in app/standalone mode (requestFullscreen is a no-op in a native WebView). */
.is-standalone .btn-fullscreen, .is-native .btn-fullscreen { display: none !important; }

/* Bloc « mode de jeu » : dernier reglage de la feuille, juste au-dessus de la
   barre de lancement. Meme langage que le reste — filets pointilles et craie,
   aucune page ni encart supplementaire. */
.mode-block {
  display: flex; flex-direction: column; gap: 8px;
  margin-top: 12px; padding-top: 12px;
  border-top: 2px dashed var(--chalk-line);
}
.mode-title { font-family: var(--font-display); font-size: 15px; letter-spacing: 1px; color: var(--chalk-faint); }
.mode-opt { display: flex; align-items: flex-start; gap: 12px; min-height: 44px; padding: 2px 0; cursor: pointer; }
.mode-opt.off { opacity: 0.4; cursor: not-allowed; }
/* Vraie case a cocher (pas un bouton de navigation deguise) : l'etat coche
   reste lisible meme si le ::after n'est pas rendu — la case se remplit d'or. */
.mode-box {
  appearance: none; -webkit-appearance: none;
  width: 26px; height: 26px; flex: none; margin-top: 3px; cursor: pointer;
  border: 2px solid var(--chalk-faint); border-radius: 7px; background: transparent;
  display: grid; place-items: center;
}
.mode-box::after {
  content: '\2713'; font-family: var(--font-hand); font-weight: 700; font-size: 20px; line-height: 1;
  color: var(--chalk-bg); opacity: 0; transform: scale(0.6);
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.mode-box:checked { border-color: var(--chalk-gold); background: var(--chalk-gold); }
.mode-box:checked::after { opacity: 1; transform: scale(1); }
.mode-box:disabled { cursor: not-allowed; }
.mode-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.mode-label { font-family: var(--font-hand); font-weight: 600; font-size: 22px; color: var(--chalk-cream); line-height: 1.15; }
.mode-sub { font-family: var(--font-hand); font-weight: 600; font-size: 17px; color: var(--chalk-faint); line-height: 1.2; }
.mode-config { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding-left: 38px; }
.mode-config-label { font-family: var(--font-hand); font-weight: 600; font-size: 17px; color: var(--chalk-faint); }
.mode-pills { display: flex; flex-wrap: wrap; gap: 6px; }
.mode-pill {
  min-height: 44px; padding: 4px 14px; border: 2px solid var(--chalk-line); border-radius: 20px;
  background: transparent; color: var(--chalk-faint);
  font-family: var(--font-display); font-size: 15px; cursor: pointer;
}
.mode-pill.on { border-color: var(--chalk-gold); color: var(--chalk-gold); background: rgba(236, 198, 106, 0.1); }
.mode-err { margin: 0; font-family: var(--font-hand); font-weight: 600; font-size: 17px; color: var(--chalk-red); }
.mode-join {
  align-self: flex-start; min-height: 44px; padding: 4px 0; background: transparent; border: none;
  text-align: left; cursor: pointer;
  font-family: var(--font-hand); font-weight: 600; font-size: 17px; color: var(--chalk-faint2);
}
.mode-join-link { color: var(--chalk-gold); text-decoration: underline; text-underline-offset: 3px; }

/* Les regles de base de .mode-block sont declarees juste au-dessus : a
   specificite egale c'est l'ordre du fichier qui tranche, donc la variante
   grand ecran doit venir APRES elles (et non dans le bloc responsive du haut).
   Sur grand ecran le bloc tient sur une ligne : une case a cocher ne doit pas
   couter une rangee de tuiles. Les cibles restent a 44 px. */
@media (min-width: 1280px) {
  .mode-block { flex-direction: row; flex-wrap: wrap; align-items: center; gap: 10px 20px; margin-top: 10px; padding-top: 10px; }
  .mode-title { flex: none; font-size: 17px; }
  .mode-opt { flex: 1 1 340px; align-items: center; }
  .mode-box { margin-top: 0; }
  .mode-label { font-size: 24px; }
  .mode-sub { font-size: 19px; }
  .mode-config { flex-basis: 100%; padding-left: 0; }
  .mode-err { flex-basis: 100%; }
  .mode-join { margin-left: auto; font-size: 19px; }
}
</style>
