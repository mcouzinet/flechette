<template>
  <div class="chalk-grain"
    style="font-family: var(--font-ui); color: var(--chalk-cream); height: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column; background: radial-gradient(130% 90% at 50% -10%, #20322b, #142019 72%)">
    <!-- Cadre -->
    <div style="position: absolute; inset: 9px; border: 2px solid var(--chalk-line); border-radius: 12px; pointer-events: none; opacity: 0.5"></div>

    <!-- Header -->
    <header class="flex flex-wrap items-center justify-between gap-3 px-5 pt-3 pb-2 relative" style="border-bottom: 2px dashed var(--chalk-line); margin: 9px 9px 0">
      <button @click="$parent.currentComponent = null" class="chalk-btn-ghost">&#8249; Retour</button>
      <div class="flex items-baseline gap-3 min-w-0">
        <span class="text-xl xl:text-[28px]" style="font-family: var(--font-display); letter-spacing: 0.5px">BOB'S 27</span>
        <span class="text-[19px] whitespace-nowrap hidden xl:inline" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-gold)">doubles 1 → 20 + bulle</span>
      </div>
      <div class="flex gap-2 flex-none">
        <button @click="showRulesModal = true" class="chalk-btn-ghost text-base xl:text-[21px]">? Règles</button>
        <button @click="toggleFullscreen" class="chalk-btn-ghost hidden xl:block">{{ isFullscreen ? 'Quitter' : '&#9974; Plein écran' }}</button>
        <button @click="confirmReset" class="chalk-btn-green">&#8635; Relancer</button>
      </div>
    </header>

    <!-- Body -->
    <div class="b27-body flex-1 min-h-0 flex flex-col xl:flex-row gap-5 px-5 py-5 relative">

      <!-- Zone principale -->
      <section class="flex-1 flex flex-col min-w-0 overflow-auto chalk-scroll">

        <!-- Cartes joueurs -->
        <div :class="[
          'grid gap-4 mb-6 pt-4',
          'grid-cols-1 md:grid-cols-2',
          gamePlayers.length <= 2 ? 'xl:grid-cols-2' :
          gamePlayers.length === 3 ? 'xl:grid-cols-3' :
          'xl:grid-cols-4'
        ]">
          <div
            v-for="(player, index) in gamePlayers"
            :key="player.id"
            class="relative rounded-[14px] p-5 transition-all duration-500"
            :style="{
              border: player.eliminated
                ? '2px dashed var(--chalk-red)'
                : currentPlayerIndex === index && !gameFinished
                  ? '2px solid var(--chalk-gold)'
                  : player.winner
                    ? '2px solid var(--chalk-green)'
                    : '2px dashed var(--chalk-line)',
              background: player.eliminated
                ? 'rgba(239,139,111,0.06)'
                : currentPlayerIndex === index && !gameFinished
                  ? 'rgba(236,198,106,0.07)'
                  : player.winner
                    ? 'rgba(134,199,160,0.07)'
                    : 'transparent',
              opacity: player.eliminated ? 0.55 : 1
            }">

            <div v-if="currentPlayerIndex === index && !gameFinished && !player.eliminated"
                 class="absolute -top-3 right-3 px-3 py-0.5 rounded-full text-sm"
                 style="font-family: var(--font-hand); font-weight: 700; background: var(--chalk-gold); color: var(--chalk-bg)">
              A JOUER
            </div>
            <div v-if="player.eliminated"
                 class="absolute -top-3 right-3 px-3 py-0.5 rounded-full text-sm"
                 style="font-family: var(--font-hand); font-weight: 700; background: var(--chalk-red); color: var(--chalk-bg)">
              ELIMINE
            </div>
            <div v-if="player.winner"
                 class="absolute -top-3 right-3 px-3 py-0.5 rounded-full text-sm"
                 style="font-family: var(--font-hand); font-weight: 700; background: var(--chalk-green); color: var(--chalk-bg)">
              GAGNANT
            </div>

            <div class="text-center">
              <h3 :class="['text-lg xl:text-[24px] mb-3', player.eliminated ? 'line-through' : '']"
                  :style="{ fontFamily: 'var(--font-hand)', fontWeight: 600, color: player.eliminated ? 'var(--chalk-faint2)' : 'var(--chalk-cream)' }">
                {{ player.name }}
              </h3>
              <div class="text-4xl xl:text-[52px] leading-none mb-1"
                   :style="{
                     fontFamily: 'var(--font-display)',
                     color: player.score <= 0 ? 'var(--chalk-red)' : player.score < 27 ? 'var(--chalk-gold)' : 'var(--chalk-cream)'
                   }">
                {{ player.score }}
              </div>
              <div class="text-[13px] uppercase tracking-wider" style="color: var(--chalk-faint2)">Points</div>

              <div class="flex justify-center gap-2 mt-3">
                <div
                  v-for="dart in 3"
                  :key="dart"
                  class="w-3.5 h-3.5 rounded-full transition-all duration-300"
                  :style="{ background: dart <= player.dartsLeft ? 'var(--chalk-gold)' : 'var(--chalk-line2)' }">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Controles de jeu -->
        <div v-if="!gameFinished" class="rounded-[14px] p-5" style="border: 2px dashed var(--chalk-line); background: transparent">
          <h3 class="text-lg xl:text-[22px] mb-1 text-center" style="font-family: var(--font-display); letter-spacing: 0.5px">
            Cible : Double {{ currentTarget }}
            <span class="text-[17px]" style="color: var(--chalk-faint2)">({{ currentTarget * 2 }} pts)</span>
          </h3>
          <div class="text-center mb-1 text-[14px]" style="color: var(--chalk-faint2)">
            Round {{ currentRound + 1 }}/21
          </div>
          <div class="text-center mb-5" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
            {{ currentPlayer?.name }} - {{ currentPlayer?.dartsLeft }} flechette{{ currentPlayer?.dartsLeft > 1 ? 's' : '' }}
          </div>

          <div class="flex flex-wrap gap-3 justify-center">
            <button
              @click="hitDouble()"
              :disabled="currentPlayer?.eliminated"
              class="chalk-btn-green"
              :style="{ opacity: currentPlayer?.eliminated ? 0.4 : 1 }">
              Double {{ currentTarget }} touche ! (+{{ currentTarget * 2 }})
            </button>
            <button
              @click="miss()"
              :disabled="currentPlayer?.eliminated"
              class="chalk-btn-red"
              :style="{ opacity: currentPlayer?.eliminated ? 0.4 : 1 }">
              Manque (-{{ currentTarget * 2 }})
            </button>
          </div>
        </div>
      </section>

      <!-- Panneau classement + historique -->
      <aside class="b27-sidebar flex flex-col gap-3 min-h-0 xl:pl-5">
        <div class="text-lg xl:text-[22px]" style="font-family: var(--font-display); letter-spacing: 0.5px">LE CLASSEMENT</div>

        <div class="flex flex-col gap-3">
          <div
            v-for="(player, index) in sortedPlayers"
            :key="player.id"
            class="relative rounded-[14px] p-3"
            :style="{
              border: player.eliminated
                ? '2px dashed rgba(239,139,111,0.3)'
                : index === 0
                  ? '2px solid var(--chalk-gold)'
                  : '2px dashed var(--chalk-line)',
              background: player.eliminated
                ? 'rgba(239,139,111,0.05)'
                : index === 0
                  ? 'rgba(236,198,106,0.07)'
                  : 'transparent',
              opacity: player.eliminated ? 0.55 : 1
            }">
            <div class="flex items-baseline justify-between gap-2">
              <span :class="['flex-1 text-lg xl:text-[24px]', player.eliminated ? 'line-through' : '']"
                    :style="{ fontFamily: 'var(--font-hand)', fontWeight: 600, color: player.eliminated ? 'var(--chalk-faint2)' : 'var(--chalk-cream)' }">
                {{ player.name }}
              </span>
              <span class="text-[34px] leading-none"
                    :style="{ fontFamily: 'var(--font-display)', color: player.score <= 0 ? 'var(--chalk-red)' : 'var(--chalk-cream)' }">
                {{ player.score }}
              </span>
            </div>
            <div class="mt-1 text-[17px]" style="font-family: var(--font-hand); font-weight: 600">
              <span v-if="player.eliminated" style="color: var(--chalk-red)">Elimine</span>
              <span v-else-if="index === 0" style="color: var(--chalk-green)">Leader</span>
            </div>
          </div>
        </div>

        <!-- Historique -->
        <div class="flex items-center justify-between mt-1">
          <span class="text-[19px]" style="font-family: var(--font-display); letter-spacing: 0.5px">L'HISTORIQUE</span>
          <button @click="undo" :class="history.length ? 'chalk-btn-red' : 'chalk-btn-ghost'" :disabled="history.length === 0">&#8630; Annuler</button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5 chalk-scroll">
          <div v-if="history.length === 0" class="m-auto text-center py-6 text-[20px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">
            <div class="text-[30px] opacity-50"></div>
            Aucun coup joue
          </div>
          <div
            v-for="(entry, index) in [...history].reverse()"
            :key="index"
            class="flex items-center justify-between gap-2 py-1.5 px-1"
            style="border-bottom: 1.5px dashed var(--chalk-line2)">
            <div style="font-family: var(--font-hand); font-weight: 600; font-size: 15px">
              <span style="color: var(--chalk-cream)">{{ entry.player.name }}</span>
              <div style="color: var(--chalk-faint2); font-size: 13px">D{{ entry.target }} - #{{ history.length - index }}</div>
            </div>
            <span class="text-sm px-3 py-0.5 rounded-full"
              :style="{
                fontFamily: 'var(--font-hand)', fontWeight: 600,
                color: entry.hit ? 'var(--chalk-green)' : 'var(--chalk-red)',
                background: entry.hit ? 'rgba(134,199,160,0.12)' : 'rgba(239,139,111,0.12)'
              }">
              {{ entry.hit ? '+' + entry.points : '-' + entry.points }}
            </span>
          </div>
        </div>
      </aside>
    </div>

    <!-- Modal Règles -->
    <div v-if="showRulesModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="chalk-grain rounded-2xl p-6 xl:p-8 border-2 border-dashed max-w-lg mx-4 max-h-[80vh] overflow-y-auto chalk-scroll"
        style="background: radial-gradient(120% 80% at 50% 0%, #1e2e28, var(--chalk-bg) 70%); border-color: var(--chalk-line)">
        <h3 class="text-2xl text-center mb-4" style="font-family: var(--font-display); color: var(--chalk-gold)">RÈGLES DU BOB'S 27</h3>
        <div class="space-y-3 text-[22px] leading-relaxed" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
          <p><span style="color: var(--chalk-cream)">But du jeu :</span> Survivre aux 21 rounds en visant les doubles, en partant de 27 points.</p>
          <p><span style="color: var(--chalk-cream)">Cibles :</span> Round 1 = Double 1, Round 2 = Double 2... jusqu'au Round 20 = Double 20, puis Double Bulle.</p>
          <p><span style="color: var(--chalk-cream)">Touché :</span> Si tu touches le double, tu gagnes sa valeur (double 5 = +10 points).</p>
          <p><span style="color: var(--chalk-cream)">Manqué :</span> Si tu manques, tu perds la valeur du double (double 5 = -10 points).</p>
          <p><span style="color: var(--chalk-cream)">Élimination :</span> Si ton score tombe à 0 ou en dessous, tu es éliminé.</p>
          <p><span style="color: var(--chalk-cream)">Victoire :</span> Le dernier survivant ou le meilleur score après 21 rounds gagne.</p>
        </div>
        <div class="flex justify-center mt-5">
          <button @click="showRulesModal = false" class="chalk-btn-ghost">Compris !</button>
        </div>
      </div>
    </div>

    <!-- Modal Reset -->
    <div v-if="showResetModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="chalk-grain rounded-2xl p-8 border-2 border-dashed max-w-md mx-4"
        style="background: radial-gradient(120% 80% at 50% 0%, #1e2e28, var(--chalk-bg) 70%); border-color: var(--chalk-line)">
        <h3 class="text-2xl text-center mb-4" style="font-family: var(--font-display); color: var(--chalk-red)">CONFIRMER LE RESET</h3>
        <p class="text-center mb-6" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
          Remettre a zero la partie ? <br><span style="color: var(--chalk-red)">Cette action est irreversible.</span>
        </p>
        <div class="flex gap-3 justify-center">
          <button @click="showResetModal = false" class="chalk-btn-ghost">Annuler</button>
          <button @click="resetGame" class="chalk-btn-red">Reset</button>
        </div>
      </div>
    </div>

    <!-- Modal Victoire -->
    <div v-if="showWinnerModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="chalk-grain rounded-2xl p-8 border-2 border-solid max-w-lg mx-4 text-center"
        style="background: radial-gradient(120% 80% at 50% 0%, #1e2e28, var(--chalk-bg) 70%); border-color: var(--chalk-gold)">
        <div class="text-5xl mb-4">&#127881;</div>
        <h2 class="text-4xl mb-4" style="font-family: var(--font-display); color: var(--chalk-gold)">VICTOIRE !</h2>
        <div class="mb-6">
          <div class="text-2xl mb-2" style="font-family: var(--font-hand); font-weight: 700">{{ winner?.name }}</div>
          <div style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">remporte le Bob's 27 !</div>
        </div>
        <div class="rounded-xl p-4 mb-6" style="background: rgba(134,199,160,0.1); border: 2px dashed var(--chalk-green)">
          <div class="text-2xl" style="font-family: var(--font-display); color: var(--chalk-green)">{{ winner?.score }} points</div>
          <div class="text-sm mt-1" style="color: var(--chalk-faint2)">Score final</div>
        </div>
        <div class="flex gap-3 justify-center">
          <button @click="showWinnerModal = false" class="chalk-btn-ghost">Continuer</button>
          <button @click="resetGame" class="chalk-btn-green">Nouvelle partie</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chalk-btn-ghost { font-family: var(--font-hand); font-weight: 600; font-size: 16px; color: var(--chalk-faint); background: transparent; border: 2px dashed var(--chalk-faint); border-radius: 12px; padding: 5px 18px; cursor: pointer; line-height: 1.1; white-space: nowrap; }
.chalk-btn-green { font-family: var(--font-hand); font-weight: 600; font-size: 16px; color: var(--chalk-green); background: transparent; border: 2px solid var(--chalk-green); border-radius: 12px; padding: 5px 18px; cursor: pointer; line-height: 1.1; white-space: nowrap; }
.chalk-btn-red { font-family: var(--font-hand); font-weight: 600; font-size: 16px; color: var(--chalk-red); background: transparent; border: 2px solid var(--chalk-red); border-radius: 12px; padding: 5px 18px; cursor: pointer; line-height: 1.1; white-space: nowrap; }
.chalk-btn-gold { font-family: var(--font-hand); font-weight: 600; font-size: 16px; color: var(--chalk-gold); background: transparent; border: 2px solid var(--chalk-gold); border-radius: 12px; padding: 5px 18px; cursor: pointer; line-height: 1.1; white-space: nowrap; }
@media (min-width: 1280px) {
  .chalk-btn-ghost, .chalk-btn-green, .chalk-btn-red, .chalk-btn-gold { font-size: 21px; }
  .b27-sidebar { border-left: 2px dashed var(--chalk-line); width: 332px; flex-shrink: 0; }
}
@media (max-width: 1279px) {
  .b27-sidebar { border-top: 2px dashed var(--chalk-line); width: 100%; padding-top: 1.25rem; }
  .b27-body { overflow-y: auto; }
}
</style>

<script>
import firebaseService from '../services/firebaseService.js';

export default {
  name: "Bobs27",
  props: {
    players: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      gamePlayers: [],
      currentPlayerIndex: 0,
      currentRound: 0,
      // Doubles 1-20 puis double bulle (25)
      targets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25],
      history: [],
      gameFinished: false,
      isFullscreen: false,
      showRulesModal: false,
      showResetModal: false,
      showWinnerModal: false,
      winner: null
    };
  },
  mounted() {
    this.initializePlayers();
    this.addKeyboardListener();
  },
  computed: {
    currentPlayer() { return this.gamePlayers[this.currentPlayerIndex]; },
    currentTarget() { return this.targets[this.currentRound]; },
    sortedPlayers() {
      return [...this.gamePlayers].sort((a, b) => {
        if (a.eliminated && !b.eliminated) return 1;
        if (!a.eliminated && b.eliminated) return -1;
        return b.score - a.score;
      });
    }
  },
  methods: {
    initializePlayers() {
      this.gamePlayers = this.players.map(player => ({
        ...player,
        score: 27,
        dartsLeft: 3,
        eliminated: false,
        winner: false
      }));
    },

    addKeyboardListener() {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') this.undo();
      });
    },

    hitDouble() {
      if (this.gameFinished || this.currentPlayer.eliminated) return;

      const player = this.currentPlayer;
      const points = this.currentTarget * 2;
      player.score += points;

      this.history.push({
        player,
        round: this.currentRound,
        target: this.currentTarget,
        hit: true,
        points,
        previousScore: player.score - points,
        wasEliminated: false
      });

      player.dartsLeft--;
      if (player.dartsLeft === 0) this.nextPlayer();
    },

    miss() {
      if (this.gameFinished || this.currentPlayer.eliminated) return;

      const player = this.currentPlayer;
      const points = this.currentTarget * 2;
      const previousScore = player.score;
      player.score -= points;

      let wasEliminated = false;
      if (player.score <= 0) {
        player.eliminated = true;
        wasEliminated = true;
      }

      this.history.push({
        player,
        round: this.currentRound,
        target: this.currentTarget,
        hit: false,
        points,
        previousScore,
        wasEliminated
      });

      player.dartsLeft--;

      // Si éliminé, passer au joueur suivant immédiatement
      if (wasEliminated || player.dartsLeft === 0) this.nextPlayer();
    },

    nextPlayer() {
      this.currentPlayer.dartsLeft = 3;
      let nextIndex = (this.currentPlayerIndex + 1) % this.gamePlayers.length;

      // Si on revient au premier joueur, round suivant
      if (nextIndex <= this.currentPlayerIndex || nextIndex === 0) {
        this.currentRound++;
        if (this.currentRound >= this.targets.length) {
          this.endGame();
          return;
        }
      }

      // Sauter les joueurs éliminés
      let attempts = 0;
      while (this.gamePlayers[nextIndex].eliminated && attempts < this.gamePlayers.length) {
        nextIndex = (nextIndex + 1) % this.gamePlayers.length;
        attempts++;
      }

      // Vérifier s'il ne reste qu'un joueur
      const alivePlayers = this.gamePlayers.filter(p => !p.eliminated);
      if (alivePlayers.length <= 1) {
        this.endGame();
        return;
      }

      this.currentPlayerIndex = nextIndex;
    },

    endGame() {
      const alivePlayers = this.gamePlayers.filter(p => !p.eliminated);
      const winner = alivePlayers.length > 0
        ? alivePlayers.sort((a, b) => b.score - a.score)[0]
        : this.gamePlayers.sort((a, b) => b.score - a.score)[0];

      winner.winner = true;
      this.gameFinished = true;
      this.winner = winner;
      this.sendVictory(winner);
      setTimeout(() => { this.showWinnerModal = true; }, 500);
    },

    undo() {
      if (this.history.length === 0) return;

      const lastEntry = this.history.pop();
      const player = lastEntry.player;
      player.score = lastEntry.previousScore;
      player.dartsLeft++;

      if (player.dartsLeft > 3) player.dartsLeft = 1;
      if (lastEntry.wasEliminated) player.eliminated = false;

      this.currentPlayerIndex = this.gamePlayers.findIndex(p => p.id === player.id);
      this.currentRound = lastEntry.round;
      this.gameFinished = false;
      this.showWinnerModal = false;
      this.winner = null;
      this.gamePlayers.forEach(p => p.winner = false);
    },

    confirmReset() { this.showResetModal = true; },

    resetGame() {
      this.gamePlayers.forEach(p => {
        p.score = 27;
        p.dartsLeft = 3;
        p.eliminated = false;
        p.winner = false;
      });
      this.currentPlayerIndex = 0;
      this.currentRound = 0;
      this.history = [];
      this.gameFinished = false;
      this.showResetModal = false;
      this.showWinnerModal = false;
      this.winner = null;
    },

    toggleFullscreen() {
      if (!this.isFullscreen) {
        if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
        else if (document.documentElement.webkitRequestFullscreen) document.documentElement.webkitRequestFullscreen();
        this.isFullscreen = true;
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        this.isFullscreen = false;
      }
    },

    async sendVictory(winner) {
      try {
        const gameData = firebaseService.prepareGameData(winner, this.gamePlayers, this.history, 'Bobs27');
        await firebaseService.sendGameVictory(gameData);
      } catch (error) {
        console.warn('Impossible d\'envoyer vers Firebase:', error.message);
      }
    }
  }
};
</script>
