<template>
  <main class="chalk-grain h-full flex flex-col overflow-y-auto xl:overflow-hidden"
    style="font-family: var(--font-ui); color: var(--chalk-cream); background: radial-gradient(120% 80% at 50% 0%, #1e2e28, var(--chalk-bg) 70%); padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right)">

    <!-- Cadre pointillé -->
    <div class="absolute inset-[10px] border-2 rounded-[10px] pointer-events-none opacity-50 z-0"
      style="border-color: var(--chalk-line)"></div>

    <!-- Voile sous la status bar (app native) : le contenu qui scrolle passe dessous -->
    <div class="statusbar-shim" aria-hidden="true"></div>

    <!-- Page d'accueil -->
    <div v-if="!currentComponent" class="flex-1 flex flex-col xl:overflow-hidden relative z-10">

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

      <!-- Jouer à distance -->
      <button @click="currentComponent = 'RemoteMode'" class="remote-cta">
        <span>
          <span class="remote-cta-title">🎯 Jouer à distance</span>
          <span class="remote-cta-sub">une partie, deux téléphones — chacun note</span>
        </span>
        <span class="remote-cta-arrow">→</span>
      </button>

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

          <!-- Barre de lancement : hors de la zone qui defile, pour ne jamais
               recouvrir la derniere tuile. -->
          <div class="launch-bar flex items-center justify-between flex-shrink-0 gap-3">
            <span class="text-base xl:text-[22px] leading-tight" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
              <template v-if="players.length < 2">Il faut au moins deux joueurs sur la feuille.</template>
              <template v-else>{{ selectedGameName }} · {{ players.length }} joueur{{ players.length > 1 ? 's' : '' }} →</template></span>
            <button @click="launchSelectedGame" :disabled="players.length < 2"
              class="chalk-btn-big disabled:opacity-40 text-xl xl:text-[30px] whitespace-nowrap">Lancer la partie</button>
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
    RemoteMode: game(() => import('./remote/RemoteMode.vue')),
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
      playerColors: ['var(--chalk-red)', 'var(--chalk-green)', 'var(--chalk-gold)', 'var(--chalk-blue)', 'var(--chalk-pink)', 'var(--chalk-orange)', 'var(--chalk-purple)', 'var(--chalk-cyan)'],
      games: [
        {
          id: 'cricket', name: 'Cricket', short: 'Ferme 20→15 + bull',
          description: 'Ferme les zones 20, 19, 18, 17, 16, 15 et la bulle avant l\'adversaire.',
          component: 'Cricket'
        },
        {
          id: '301', name: '301 · 501', short: 'Tombe à zéro pile',
          description: 'Pars de 301 ou 501 et atteins exactement zéro pour gagner.',
          component: 'Game301'
        },
        {
          id: 'shangai', name: 'Shanghai', short: 'Manche par manche',
          description: '20 manches, une cible par manche. Le Shanghai met fin à la partie.',
          component: 'Shanghai'
        },
        {
          id: 'horloge', name: 'Autour de l\'horloge', short: '1 → 20 dans l\'ordre',
          description: 'Touche les numéros de 1 à 20 puis la bulle. Le plus rapide gagne.',
          component: 'Horloge'
        },
        {
          id: 'killer', name: 'Killer', short: 'Élimine les autres',
          description: 'Deviens killer puis élimine les adversaires en touchant leur double.',
          component: 'Killer'
        },
        {
          id: 'morpion', name: 'Morpion', short: 'Tic-tac-toe fléché',
          description: 'Le morpion classique : aligne trois cases en touchant les zones.',
          component: 'Morpion'
        },
        {
          id: 'halveit', name: 'Halve-It', short: 'Divise ou domine',
          description: 'Cibles imposées par round. Rater = score divisé par 2.',
          component: 'HalveIt'
        },
        {
          id: 'bobs27', name: 'Bob\'s 27', short: 'Doubles ou dégage',
          description: 'Départ à 27 pts. Doubles 1→20→bulle. Touché +, raté −.',
          component: 'Bobs27'
        },
        {
          id: 'baseball', name: 'Baseball', short: '9 manches de runs',
          description: '9 manches. Simple=1, Double=2, Triple=3 runs.',
          component: 'Baseball'
        },
        {
          id: 'countup', name: 'Count Up', short: '8 rounds, max de points',
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
    selectedGameName() {
      const game = this.games.find(g => g.id === this.selectedGame);
      return game ? game.name : 'choisis un jeu';
    }
  },
  watch: {
    // Each screen swap reuses the same scroll containers: reset them so the new
    // screen starts at the top (a leftover offset also misroutes the first tap).
    currentComponent() {
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

    launchSelectedGame() {
      const game = this.games.find(g => g.id === this.selectedGame);
      if (game) this.startGameDirectly(game);
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
  .remote-cta { margin-left: 36px; margin-right: 36px; }
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

/* "Play remotely" call-to-action on the home screen */
.remote-cta {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  text-align: left; margin: 4px 20px 22px;
  border: 2px solid var(--chalk-gold); border-radius: 16px; padding: 14px 18px;
  background: rgba(236, 198, 106, 0.08); cursor: pointer;
}
.remote-cta-title { display: block; font-family: var(--font-display); font-size: 21px; color: var(--chalk-cream); letter-spacing: 0.5px; }
.remote-cta-sub { display: block; font-family: var(--font-hand); font-size: 18px; color: var(--chalk-gold); margin-top: 2px; }
.remote-cta-arrow { font-family: var(--font-display); font-size: 26px; color: var(--chalk-gold); flex: none; }
</style>