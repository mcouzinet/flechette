<template>
  <main class="chalk-grain h-full flex flex-col overflow-y-auto xl:overflow-hidden"
    style="font-family: var(--font-ui); color: var(--chalk-cream); background: radial-gradient(120% 80% at 50% 0%, #1e2e28, var(--chalk-bg) 70%); padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right)">

    <!-- Cadre pointillé -->
    <div class="absolute inset-[10px] border-2 rounded-[10px] pointer-events-none opacity-50 z-0"
      style="border-color: var(--chalk-line)"></div>

    <!-- Page d'accueil -->
    <div v-if="!currentComponent" class="flex-1 flex flex-col xl:overflow-hidden relative z-10">

      <!-- Header -->
      <header class="flex items-start justify-between px-5 xl:px-9 pt-6 xl:pt-7 pb-4 flex-shrink-0">
        <div>
          <div class="flex items-center gap-3">
            <div class="chalk-target w-8 h-8 xl:w-10 xl:h-10"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill="currentColor" opacity=".25"/><circle cx="20" cy="20" r="13" fill="var(--chalk-bg, #142019)"/><circle cx="20" cy="20" r="8" fill="currentColor" opacity=".25"/><circle cx="20" cy="20" r="3" fill="currentColor"/></svg></div>
            <span class="text-3xl xl:text-[44px] tracking-wider" style="font-family: var(--font-display); text-shadow: 0 1px 0 rgba(0,0,0,.3)">STONK</span>
          </div>
          <p class="ml-11 xl:ml-[54px] mt-1 text-lg xl:text-[22px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-gold)">
            Comme au comptoir — on ajoute, on choisit, on lance.</p>
        </div>
        <div class="hidden xl:flex gap-3">
          <button @click="currentComponent = 'Resultats'" class="chalk-btn" style="color: var(--chalk-faint)">les scores ✦</button>
          <button v-if="!user" @click="showAuthModal = true" class="chalk-btn" style="color: var(--chalk-faint)">connexion</button>
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
              <button @click="removePlayer(player.id)" class="text-2xl cursor-pointer leading-none bg-transparent border-none p-1" style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-faint2)">x</button>
            </div>
          </div>

          <!-- Ajout joueur -->
          <div class="flex gap-2">
            <input v-model="newPlayerName" @keyup.enter="addPlayer" placeholder="+ ajouter un joueur..."
              class="flex-1 bg-transparent border-none py-2 px-0 outline-none rounded-none"
              style="color: var(--chalk-cream); font-family: var(--font-hand); font-weight: 600; font-size: 24px; -webkit-appearance: none" />
            <button @click="addPlayer" class="chalk-btn" style="color: var(--chalk-green)">noter</button>
          </div>
        </div>

        <!-- Grille des jeux -->
        <div class="flex-1 flex flex-col xl:overflow-y-auto chalk-scroll">
          <span class="text-[26px] xl:text-[30px] mb-3 hidden xl:block" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
            ...et on joue à quoi ce soir ?</span>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <button v-for="game in games" :key="game.id"
              :disabled="!game.component"
              @click="game.component && (selectedGame = game.id)"
              :class="[
                'game-tile text-left rounded-[14px] p-4 transition-all duration-300 relative flex flex-col gap-2',
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

              <div class="chalk-target w-8 h-8" :style="{ color: selectedGame === game.id ? 'var(--chalk-gold)' : 'var(--chalk-cream)' }"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill="currentColor" opacity=".25"/><circle cx="20" cy="20" r="13" fill="var(--chalk-bg, #142019)"/><circle cx="20" cy="20" r="8" fill="currentColor" opacity=".25"/><circle cx="20" cy="20" r="3" fill="currentColor"/></svg></div>

              <div class="tracking-wide text-lg xl:text-xl" style="font-family: var(--font-display); color: var(--chalk-cream)">{{ game.name }}</div>
              <div class="text-[20px] xl:text-[22px] leading-snug" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
                {{ game.component ? game.short : 'bientôt dispo' }}</div>

              <span v-if="selectedGame === game.id" class="absolute -top-3 right-3 px-2.5 py-0.5 rounded-full text-[13px]"
                style="font-family: var(--font-hand); font-weight: 700; background: var(--chalk-gold); color: var(--chalk-bg)">CHOISI</span>
            </button>
          </div>

          <!-- Barre de lancement -->
          <div class="mt-auto flex items-center justify-between pt-4 flex-shrink-0 gap-3">
            <span class="text-base xl:text-[22px] leading-tight" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
              {{ selectedGameName }} · {{ players.length }} joueurs →</span>
            <button @click="launchSelectedGame" :disabled="players.length < 2"
              class="chalk-btn-big disabled:opacity-40 text-xl xl:text-[30px] whitespace-nowrap">Lancer la partie</button>
          </div>
        </div>
      </div>

      <!-- Footer mobile -->
      <div class="xl:hidden flex items-center justify-between px-5 py-3 flex-shrink-0"
        style="border-top: 2px dashed var(--chalk-line)">
        <button @click="currentComponent = 'Resultats'" class="chalk-btn" style="color: var(--chalk-faint)">scores ✦</button>
        <button v-if="!user" @click="showAuthModal = true" class="chalk-btn" style="color: var(--chalk-faint)">connexion</button>
        <span v-else class="text-lg" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-gold)">{{ user.email }}</span>
      </div>
    </div>

    <!-- Composant de jeu -->
    <div v-else class="relative flex-1 xl:overflow-hidden z-10">
      <component :is="currentComponent" :players="players" />
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
          <input v-model="authEmail" @keyup.enter="sendMagicLink" type="email" placeholder="ton adresse email"
            class="w-full bg-transparent py-3 px-2 text-base outline-none border-none rounded-none"
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
import Cricket from './components/Cricket.vue';
import Horloge from './components/Horloge.vue';
import Game301 from './components/301.vue';
import Shanghai from './components/Shanghai.vue';
import Killer from './components/Killer.vue';
import Morpion from './components/Morpion.vue';
import HalveIt from './components/HalveIt.vue';
import Bobs27 from './components/Bobs27.vue';
import Baseball from './components/Baseball.vue';
import CountUp from './components/CountUp.vue';
import Resultats from './components/Resultats.vue';
import { auth } from './firebase.js';
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, onAuthStateChanged, signOut } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { signInWithApple, signInWithGoogle, nativeSignOut } from './services/socialAuth.js';

export default {
  name: "Flechette",
  components: {
    Cricket,
    Horloge,
    Shanghai,
    Game301,
    Killer,
    Morpion,
    HalveIt,
    Bobs27,
    Baseball,
    CountUp,
    Resultats
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
  mounted() {
    this.loadPlayersFromStorage();
    this.initAuth();
    if (Capacitor.isNativePlatform() || window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
      document.documentElement.classList.add('is-standalone');
      this.isStandalone = true;
    }
  },
  methods: {
    initAuth() {
      onAuthStateChanged(auth, (user) => {
        this.user = user;
      });

      // Vérifier si on revient d'un magic link
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = localStorage.getItem('flechette-auth-email');
        if (!email) {
          email = window.prompt('Confirmez votre email pour la connexion :');
        }
        if (email) {
          signInWithEmailLink(auth, email, window.location.href)
            .then(() => {
              localStorage.removeItem('flechette-auth-email');
              // Nettoyer l'URL des paramètres du magic link
              window.history.replaceState({}, document.title, window.location.pathname);
            })
            .catch((error) => {
              console.error('Erreur connexion magic link:', error);
            });
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
        await sendSignInLinkToEmail(auth, this.authEmail, actionCodeSettings);
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
        await signInWithApple();
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
        await signInWithGoogle();
        this.showAuthModal = false;
      } catch (error) {
        console.error('Erreur connexion Google:', error);
        this.authMessage = 'Erreur lors de la connexion Google.';
      } finally {
        this.authLoading = false;
      }
    },

    async logout() {
      await signOut(auth);
      await nativeSignOut();
      this.showAuthModal = false;
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
      } else if (game.component && this.players.length < 2) {
        alert('Ajoutez au moins 2 joueurs pour commencer');
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
}
@media (max-width: 1279px) {
  .home-sidebar { border-bottom: 2px dashed var(--chalk-line); padding-bottom: 16px; }
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
.is-standalone .btn-fullscreen { display: none !important; }
</style>