<template>
  <div class="chalk-grain"
    style="font-family: var(--font-ui); color: var(--chalk-cream); height: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column; background: radial-gradient(130% 90% at 50% -10%, #20322b, #142019 72%)">
    <!-- Cadre -->
    <div style="position: absolute; inset: 9px; border: 2px solid var(--chalk-line); border-radius: 12px; pointer-events: none; opacity: 0.5"></div>

    <!-- Header -->
    <header class="flex flex-wrap items-center justify-between gap-2 px-4 pt-2 pb-2 xl:gap-3 xl:px-5 xl:pt-3 xl:pb-3 relative" style="border-bottom: 2px dashed var(--chalk-line); margin: 9px 9px 0">
      <button @click="$parent.currentComponent = null" class="cu-btn-ghost text-base xl:text-[21px]">&#8249; Retour</button>
      <div class="flex items-baseline gap-3 min-w-0">
        <span class="text-xl xl:text-[28px]" style="font-family: var(--font-display); letter-spacing: 0.5px">COUNT UP</span>
        <span class="text-[19px] whitespace-nowrap hidden xl:inline" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-gold)">8 rounds · le plus haut score gagne</span>
      </div>
      <div class="flex gap-2 flex-none">
        <button @click="showRulesModal = true" class="cu-btn-ghost text-base xl:text-[21px]">? R&egrave;gles</button>
        <button @click="toggleFullscreen" class="cu-btn-ghost text-base xl:text-[21px] hidden xl:block btn-fullscreen">{{ isFullscreen ? 'Quitter' : '&#9974; Plein &eacute;cran' }}</button>
        <button @click="confirmReset" class="cu-btn-green text-base xl:text-[21px]">&#8635; Relancer</button>
      </div>
    </header>

    <!-- Body -->
    <div class="flex-1 min-h-0 flex flex-col xl:grid gap-3 px-4 py-3 xl:gap-5 xl:px-5 xl:py-5 relative overflow-auto cu-body">

      <!-- Zone de jeu principale -->
      <section class="flex flex-col min-w-0 overflow-auto chalk-scroll gap-3 xl:gap-5">

        <!-- Indicateur de round -->
        <div class="text-center pt-2">
          <span class="text-[15px] uppercase tracking-wider" style="color: var(--chalk-faint2)">Round</span>
          <div class="flex justify-center gap-2 mt-1">
            <div
              v-for="r in 8"
              :key="r"
              class="w-8 h-8 xl:w-10 xl:h-10 rounded-full flex items-center justify-center text-sm xl:text-base transition-all duration-300"
              :style="{
                fontFamily: 'var(--font-display)',
                border: r === currentRound + 1 ? '2px solid var(--chalk-gold)' : '2px dashed var(--chalk-line)',
                background: r <= currentRound ? 'rgba(134,199,160,0.15)' : r === currentRound + 1 ? 'rgba(236,198,106,0.10)' : 'transparent',
                color: r <= currentRound ? 'var(--chalk-green)' : r === currentRound + 1 ? 'var(--chalk-gold)' : 'var(--chalk-faint2)'
              }">
              {{ r }}
            </div>
          </div>
        </div>

        <!-- Cartes des joueurs -->
        <div :class="[
          'grid gap-2 xl:gap-5',
          'grid-cols-1 md:grid-cols-2',
          gamePlayers.length === 1 ? 'xl:grid-cols-1' :
          gamePlayers.length === 2 ? 'xl:grid-cols-2' :
          gamePlayers.length === 3 ? 'xl:grid-cols-3' :
          'xl:grid-cols-4'
        ]">
          <div
            v-for="(player, index) in gamePlayers"
            :key="player.id"
            class="relative rounded-[14px] p-2.5 xl:p-5 transition-all duration-300"
            :style="{
              border: player.winner
                ? '2px solid var(--chalk-green)'
                : currentPlayerIndex === index && !gameFinished
                  ? '2px solid var(--chalk-gold)'
                  : '2px dashed var(--chalk-line)',
              background: player.winner
                ? 'rgba(134,199,160,0.08)'
                : currentPlayerIndex === index && !gameFinished
                  ? 'rgba(236,198,106,0.06)'
                  : 'transparent'
            }">

            <!-- Badge joueur actuel -->
            <div v-if="currentPlayerIndex === index && !gameFinished"
              class="absolute -top-2.5 right-2 xl:-top-3 xl:right-3 px-2 py-0.5 xl:px-2.5 rounded-full text-[11px] xl:text-[13px]"
              style="font-family: var(--font-hand); font-weight: 700; background: var(--chalk-gold); color: var(--chalk-bg)">
              &Agrave; JOUER
            </div>

            <!-- Badge gagnant -->
            <div v-if="player.winner"
              class="absolute -top-2.5 right-2 xl:-top-3 xl:right-3 px-2 py-0.5 xl:px-2.5 rounded-full text-[11px] xl:text-[13px]"
              style="font-family: var(--font-hand); font-weight: 700; background: var(--chalk-green); color: var(--chalk-bg)">
              GAGNANT
            </div>

            <!-- Layout -->
            <div class="flex items-center gap-3 xl:block xl:text-center">
              <h3 class="text-base xl:text-[26px] xl:mb-3 shrink-0" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-cream)">
                {{ player.name }}
              </h3>

              <div class="shrink-0 xl:mb-3">
                <div class="text-2xl xl:text-[56px] leading-none xl:mb-1 transition-all duration-300"
                  :style="{ fontFamily: 'var(--font-display)', color: 'var(--chalk-cream)' }">
                  {{ player.totalScore }}
                </div>
                <div class="hidden xl:block text-[13px] uppercase tracking-wider" style="color: var(--chalk-faint2)">Points</div>
              </div>

              <div class="flex gap-1.5 xl:justify-center xl:gap-2 xl:mb-3 shrink-0">
                <div
                  v-for="dart in 3"
                  :key="dart"
                  class="w-2.5 h-2.5 xl:w-3.5 xl:h-3.5 rounded-full transition-all duration-300"
                  :style="{ background: dart <= player.dartsLeft ? 'var(--chalk-gold)' : 'var(--chalk-line2)' }">
                </div>
              </div>

              <div class="text-[13px] xl:text-[15px] ml-auto xl:ml-0 shrink-0" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
                Moy: {{ getPlayerAverage(player).toFixed(1) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Controles de jeu -->
        <div v-if="!gameFinished" class="rounded-[14px] p-3 xl:p-5" style="border: 2px dashed var(--chalk-line)">
          <h3 class="text-base xl:text-[22px] mb-2 xl:mb-5 text-center" style="font-family: var(--font-display); letter-spacing: 0.5px">SAISIR LE SCORE</h3>

          <!-- Selecteur de type -->
          <div class="flex flex-wrap gap-1.5 mb-3 xl:gap-2 xl:mb-5 justify-center">
            <button
              v-for="type in ['single', 'double', 'triple']"
              :key="type"
              @click="scoreType = type"
              class="cu-type-btn"
              :style="{
                color: scoreType === type ? 'var(--chalk-bg)' : 'var(--chalk-faint)',
                background: scoreType === type ? 'var(--chalk-gold)' : 'transparent',
                borderColor: scoreType === type ? 'var(--chalk-gold)' : 'var(--chalk-line)'
              }">
              {{ type === 'single' ? 'Simple' : type === 'double' ? 'Double' : 'Triple' }}
            </button>

            <!-- Bouton Manque -->
            <button
              @click="selectMiss()"
              class="cu-type-btn"
              :style="{
                color: scoreType === 'miss' ? 'var(--chalk-bg)' : 'var(--chalk-faint)',
                background: scoreType === 'miss' ? 'var(--chalk-red)' : 'transparent',
                borderColor: scoreType === 'miss' ? 'var(--chalk-red)' : 'var(--chalk-line)'
              }">
              Manqu&eacute;
            </button>
          </div>

          <!-- Tableau des numeros -->
          <div class="grid grid-cols-4 lg:grid-cols-7 gap-1.5 mb-3 xl:gap-2 xl:mb-5">
            <button
              v-for="number in dartNumbers"
              :key="number"
              @click="selectScore(number)"
              class="cu-num-btn"
              :style="{
                color: selectedScore === number ? 'var(--chalk-bg)' : 'var(--chalk-cream)',
                background: selectedScore === number ? 'var(--chalk-gold)' : 'transparent',
                borderColor: selectedScore === number ? 'var(--chalk-gold)' : 'var(--chalk-line)'
              }">
              {{ number === 25 ? 'Bulle' : number }}
            </button>
          </div>

          <!-- Valider -->
          <div class="flex justify-center">
            <button
              @click="addScore"
              :disabled="!canAddScore"
              :class="canAddScore ? 'cu-btn-green' : 'cu-btn-ghost'"
              :style="{ opacity: canAddScore ? 1 : 0.4, cursor: canAddScore ? 'pointer' : 'not-allowed', fontSize: '23px', padding: '8px 28px' }">
              Valider le score
            </button>
          </div>
        </div>
      </section>

      <!-- Panneau historique -->
      <aside class="flex flex-col gap-2 xl:gap-3 min-h-0 xl:pl-5 pt-3 xl:pt-0 cu-sidebar">
        <div class="flex items-center justify-between">
          <span class="text-lg xl:text-[22px]" style="font-family: var(--font-display); letter-spacing: 0.5px">L'HISTORIQUE</span>
          <button
            @click="undo"
            :class="history.length ? 'cu-btn-red' : 'cu-btn-ghost'"
            :disabled="history.length === 0">
            &#8630; Annuler
          </button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5 chalk-scroll">
          <div v-if="history.length === 0" class="m-auto text-center py-6 text-[20px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">
            <div class="text-[30px] opacity-50">&#9998;</div>
            Aucun coup jou&eacute;...<br>l'historique s'affichera ici.
          </div>
          <div
            v-for="(entry, index) in [...history].reverse()"
            :key="index"
            class="py-2 px-1"
            style="border-bottom: 1.5px dashed var(--chalk-line2)">

            <div class="flex justify-between items-start mb-1">
              <span class="text-[20px]" style="font-family: var(--font-hand); font-weight: 700">{{ entry.playerName }}</span>
              <span class="text-[13px] px-2 py-0.5 rounded-full" style="color: var(--chalk-faint2); border: 1px solid var(--chalk-line2)">
                R{{ entry.round + 1 }} · #{{ history.length - index }}
              </span>
            </div>

            <div class="flex justify-between items-center">
              <div>
                <span class="text-[18px]" style="font-family: var(--font-display)">{{ entry.score }}</span>
                <span class="text-[13px] ml-1" style="color: var(--chalk-faint2)">points</span>
              </div>
              <div v-if="entry.type !== 'single' && entry.type !== 'miss'"
                class="px-2 py-0.5 rounded-full text-[13px]"
                :style="{
                  fontFamily: 'var(--font-hand)', fontWeight: 600,
                  color: entry.type === 'double' ? 'var(--chalk-gold)' : 'var(--chalk-red)',
                  background: entry.type === 'double' ? 'rgba(236,198,106,0.12)' : 'rgba(239,139,111,0.12)'
                }">
                {{ entry.type === 'double' ? '2x' : '3x' }}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- Modal Regles -->
    <div v-if="showRulesModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="chalk-grain rounded-2xl p-6 xl:p-8 border-2 border-dashed max-w-lg mx-4 max-h-[80vh] overflow-y-auto chalk-scroll"
        style="background: radial-gradient(120% 80% at 50% 0%, #1e2e28, var(--chalk-bg) 70%); border-color: var(--chalk-line)">
        <h3 class="text-2xl text-center mb-4" style="font-family: var(--font-display); color: var(--chalk-gold)">R&Egrave;GLES DU COUNT UP</h3>
        <div class="space-y-3 text-[22px] leading-relaxed" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
          <p><span style="color: var(--chalk-cream)">But du jeu :</span> Marquer le plus de points possible en 8 rounds.</p>
          <p><span style="color: var(--chalk-cream)">Tour de jeu :</span> Chaque joueur lance 3 fl&eacute;chettes par round. Tous les points touch&eacute;s s'additionnent.</p>
          <p><span style="color: var(--chalk-cream)">Multiplicateurs :</span> Simple = valeur, Double = x2, Triple = x3. La bulle vaut 25 (simple) ou 50 (double).</p>
          <p><span style="color: var(--chalk-cream)">Victoire :</span> Apr&egrave;s 8 rounds, le joueur avec le plus haut score total gagne.</p>
          <p><span style="color: var(--chalk-cream)">Id&eacute;al pour :</span> Les d&eacute;butants et l'&eacute;chauffement !</p>
        </div>
        <div class="flex justify-center mt-5">
          <button @click="showRulesModal = false" class="cu-btn-ghost">Compris !</button>
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
          <button @click="showResetModal = false" class="cu-btn-ghost">Annuler</button>
          <button @click="resetGame" class="cu-btn-red">Reset</button>
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
          <div style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">remporte le Count Up !</div>
        </div>

        <div class="rounded-xl p-4 mb-6" style="background: rgba(134,199,160,0.1); border: 2px dashed var(--chalk-green)">
          <div class="grid grid-cols-2 gap-4 text-center">
            <div>
              <div class="text-2xl" style="font-family: var(--font-display); color: var(--chalk-green)">{{ winner?.totalScore }}</div>
              <div class="text-sm" style="color: var(--chalk-faint2)">Score total</div>
            </div>
            <div>
              <div class="text-2xl" style="font-family: var(--font-display); color: var(--chalk-green)">{{ getPlayerAverage(winner || {}).toFixed(1) }}</div>
              <div class="text-sm" style="color: var(--chalk-faint2)">Moyenne / fl&eacute;chette</div>
            </div>
          </div>
        </div>

        <div class="flex gap-3 justify-center">
          <button @click="showWinnerModal = false" class="cu-btn-ghost">Continuer</button>
          <button @click="resetGame" class="cu-btn-green">Nouvelle partie</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cu-btn-ghost {
  font-family: var(--font-hand); font-weight: 600; font-size: 16px;
  color: var(--chalk-faint); background: transparent;
  border: 2px dashed var(--chalk-faint); border-radius: 10px;
  padding: 3px 12px; cursor: pointer; line-height: 1.1; white-space: nowrap;
}
.cu-btn-green {
  font-family: var(--font-hand); font-weight: 600; font-size: 16px;
  color: var(--chalk-green); background: transparent;
  border: 2px solid var(--chalk-green); border-radius: 10px;
  padding: 3px 12px; cursor: pointer; line-height: 1.1; white-space: nowrap;
}
.cu-btn-red {
  font-family: var(--font-hand); font-weight: 600; font-size: 16px;
  color: var(--chalk-red); background: transparent;
  border: 2px solid var(--chalk-red); border-radius: 10px;
  padding: 3px 12px; cursor: pointer; line-height: 1.1; white-space: nowrap;
}
.cu-type-btn {
  font-family: var(--font-hand); font-weight: 600; font-size: 17px;
  border: 2px solid; border-radius: 10px;
  padding: 4px 14px; cursor: pointer; line-height: 1.1;
  transition: all 0.2s;
}
.cu-type-btn:hover {
  background: rgba(241,230,203,0.06) !important;
}
.cu-num-btn {
  height: 44px; border: 2px solid; border-radius: 10px;
  font-family: var(--font-display); font-size: 17px; letter-spacing: 0.5px;
  cursor: pointer; transition: all 0.15s; background: transparent;
}
.cu-num-btn:hover {
  background: rgba(241,230,203,0.06) !important;
  border-color: var(--chalk-gold) !important;
}
@media (min-width: 1280px) {
  .cu-body { grid-template-columns: 1fr 332px; }
  .cu-sidebar { border-left: 2px dashed var(--chalk-line); }
  .cu-btn-ghost, .cu-btn-green, .cu-btn-red { font-size: 21px; padding: 5px 18px; border-radius: 12px; }
  .cu-type-btn { font-size: 21px; padding: 6px 20px; border-radius: 12px; }
  .cu-num-btn { height: 54px; font-size: 20px; }
}
@media (max-width: 1279px) {
  .cu-sidebar { border-top: 2px dashed var(--chalk-line); }
}
</style>

<script>
import firebaseService from '../services/firebaseService.js';

export default {
  name: "CountUp",
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
      totalRounds: 8,
      selectedScore: null,
      scoreType: 'single',
      dartNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25],
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
    document.addEventListener('keydown', this.handleKeydown);
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown);
  },
  computed: {
    currentPlayer() {
      return this.gamePlayers[this.currentPlayerIndex];
    },
    canAddScore() {
      if (this.gameFinished) return false;
      if (this.scoreType === 'miss') return true;
      if (this.selectedScore === null) return false;
      if (this.selectedScore === 25 && this.scoreType === 'triple') return false;
      return true;
    }
  },
  methods: {
    handleKeydown(e) {
      if (e.key === 'Backspace') this.undo();
    },

    initializePlayers() {
      this.gamePlayers = this.players.map(player => ({
        ...player,
        totalScore: 0,
        dartsLeft: 3,
        winner: false
      }));
    },

    getPlayerAverage(player) {
      const playerEntries = this.history.filter(e => e.playerName === player.name);
      if (playerEntries.length === 0) return 0;
      const total = playerEntries.reduce((sum, e) => sum + e.score, 0);
      return total / playerEntries.length;
    },

    selectScore(number) {
      this.selectedScore = number;
      if (this.scoreType === 'miss') this.scoreType = 'single';
    },

    selectMiss() {
      this.selectedScore = 0;
      this.scoreType = 'miss';
    },

    addScore() {
      if (!this.canAddScore) return;

      let actualScore = this.selectedScore;
      if (this.scoreType === 'miss') {
        actualScore = 0;
      } else {
        if (this.scoreType === 'double') actualScore *= 2;
        if (this.scoreType === 'triple') actualScore *= 3;
      }

      const player = this.currentPlayer;
      player.totalScore += actualScore;
      player.dartsLeft--;

      this.history.push({
        playerName: player.name,
        playerId: player.id,
        score: actualScore,
        type: this.scoreType,
        round: this.currentRound,
        dartsLeftBefore: player.dartsLeft + 1
      });

      if (player.dartsLeft === 0) {
        this.nextPlayer();
      }

      this.selectedScore = null;
      this.scoreType = 'single';
    },

    nextPlayer() {
      this.currentPlayer.dartsLeft = 3;
      let nextIndex = (this.currentPlayerIndex + 1) % this.gamePlayers.length;

      // Si on revient au premier joueur, round suivant
      if (nextIndex === 0) {
        this.currentRound++;
        if (this.currentRound >= this.totalRounds) {
          this.endGame();
          return;
        }
      }

      this.currentPlayerIndex = nextIndex;
    },

    endGame() {
      const sorted = [...this.gamePlayers].sort((a, b) => b.totalScore - a.totalScore);
      const winner = sorted[0];
      winner.winner = true;
      this.gameFinished = true;
      this.winner = winner;
      this.sendVictory(winner);
      setTimeout(() => { this.showWinnerModal = true; }, 500);
    },

    undo() {
      if (this.history.length === 0) return;

      const lastEntry = this.history.pop();
      const player = this.gamePlayers.find(p => p.id === lastEntry.playerId);
      if (!player) return;

      player.totalScore -= lastEntry.score;
      player.dartsLeft = lastEntry.dartsLeftBefore;
      player.winner = false;

      this.currentPlayerIndex = this.gamePlayers.findIndex(p => p.id === player.id);
      this.currentRound = lastEntry.round;
      this.gameFinished = false;
      this.showWinnerModal = false;
      this.winner = null;
      this.gamePlayers.forEach(p => p.winner = false);
    },

    confirmReset() {
      this.showResetModal = true;
    },

    resetGame() {
      this.gamePlayers.forEach(p => {
        p.totalScore = 0;
        p.dartsLeft = 3;
        p.winner = false;
      });
      this.currentPlayerIndex = 0;
      this.currentRound = 0;
      this.history = [];
      this.gameFinished = false;
      this.showResetModal = false;
      this.showWinnerModal = false;
      this.winner = null;
      this.selectedScore = null;
      this.scoreType = 'single';
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
        const gameData = firebaseService.prepareGameData(winner, this.gamePlayers, this.history, 'CountUp');
        await firebaseService.sendGameVictory(gameData);
      } catch (error) {
        console.warn('Impossible d\'envoyer vers Firebase:', error.message);
      }
    }
  }
};
</script>
