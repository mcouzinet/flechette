<template>
  <div class="chalk-grain"
    style="font-family: var(--font-ui); color: var(--chalk-cream); height: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column; background: radial-gradient(130% 90% at 50% -10%, #20322b, #142019 72%)">
    <!-- Cadre -->
    <div style="position: absolute; inset: 9px; border: 2px solid var(--chalk-line); border-radius: 12px; pointer-events: none; opacity: 0.5"></div>

    <!-- Header -->
    <header class="flex flex-wrap items-center justify-between gap-3 px-5 pt-3 pb-2 relative" style="border-bottom: 2px dashed var(--chalk-line); margin: 9px 9px 0">
      <button @click="$parent.currentComponent = null" class="chalk-btn-ghost">&#8249; Retour</button>
      <div class="flex items-baseline gap-3 min-w-0">
        <span class="text-xl xl:text-[28px]" style="font-family: var(--font-display); letter-spacing: 0.5px">BASEBALL</span>
        <span class="text-[19px] whitespace-nowrap hidden xl:inline" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-gold)">9 manches, vise les numeros</span>
      </div>
      <div class="flex gap-2 flex-none">
        <button @click="showRulesModal = true" class="chalk-btn-ghost text-base xl:text-[21px]">? Règles</button>
        <button @click="toggleFullscreen" class="chalk-btn-ghost hidden xl:block">{{ isFullscreen ? 'Quitter' : '&#9974; Plein écran' }}</button>
        <button @click="confirmReset" class="chalk-btn-green">&#8635; Relancer</button>
      </div>
    </header>

    <!-- Body -->
    <div class="bb-body flex-1 min-h-0 flex flex-col xl:flex-row gap-5 px-5 py-5 relative">

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
              border: currentPlayerIndex === index && !gameFinished
                ? '2px solid var(--chalk-gold)'
                : player.winner
                  ? '2px solid var(--chalk-green)'
                  : '2px dashed var(--chalk-line)',
              background: currentPlayerIndex === index && !gameFinished
                ? 'rgba(236,198,106,0.07)'
                : player.winner
                  ? 'rgba(134,199,160,0.07)'
                  : 'transparent'
            }">

            <div v-if="currentPlayerIndex === index && !gameFinished"
                 class="absolute -top-3 right-3 px-3 py-0.5 rounded-full text-sm"
                 style="font-family: var(--font-hand); font-weight: 700; background: var(--chalk-gold); color: var(--chalk-bg)">
              A JOUER
            </div>
            <div v-if="player.winner"
                 class="absolute -top-3 right-3 px-3 py-0.5 rounded-full text-sm"
                 style="font-family: var(--font-hand); font-weight: 700; background: var(--chalk-green); color: var(--chalk-bg)">
              GAGNANT
            </div>

            <div class="text-center">
              <h3 class="text-lg xl:text-[24px] mb-3" style="font-family: var(--font-hand); font-weight: 600">{{ player.name }}</h3>
              <div class="text-4xl xl:text-[52px] leading-none mb-1" style="font-family: var(--font-display)">{{ player.totalScore }}</div>
              <div class="text-[13px] uppercase tracking-wider mb-3" style="color: var(--chalk-faint2)">Runs</div>

              <div class="flex justify-center gap-2">
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
        <div v-if="!gameFinished" class="rounded-[14px] p-5 mb-5" style="border: 2px dashed var(--chalk-line); background: transparent">
          <h3 class="text-lg xl:text-[22px] mb-1 text-center" style="font-family: var(--font-display); letter-spacing: 0.5px">
            Manche {{ currentInning + 1 }}/9 - Cible : {{ currentInning + 1 }}
          </h3>
          <div class="text-center mb-5" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
            {{ currentPlayer?.name }} - {{ currentPlayer?.dartsLeft }} flechette{{ currentPlayer?.dartsLeft > 1 ? 's' : '' }}
          </div>

          <div class="flex flex-wrap gap-3 justify-center">
            <button
              @click="addRuns(1)"
              class="chalk-btn-gold">
              Simple (1 run)
            </button>
            <button
              @click="addRuns(2)"
              class="chalk-btn-green">
              Double (2 runs)
            </button>
            <button
              @click="addRuns(3)"
              class="chalk-btn-red">
              Triple (3 runs)
            </button>
            <button
              @click="addRuns(0)"
              class="chalk-btn-ghost">
              Manque (0)
            </button>
          </div>
        </div>

        <!-- Tableau des manches -->
        <div class="overflow-x-auto mt-auto chalk-scroll">
          <table class="w-full text-sm min-w-[400px]" style="border-collapse: separate; border-spacing: 0">
            <thead>
              <tr style="border-bottom: 2px dashed var(--chalk-line)">
                <th class="text-left p-2 whitespace-nowrap" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">Manche</th>
                <th v-for="player in gamePlayers" :key="player.id" class="text-center p-2 whitespace-nowrap" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">{{ player.name }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inning in 9" :key="inning"
                  style="border-bottom: 1.5px dashed var(--chalk-line2)">
                <td class="p-2" :style="{
                  fontFamily: 'var(--font-hand)', fontWeight: 600,
                  color: inning - 1 === currentInning && !gameFinished ? 'var(--chalk-gold)' : 'var(--chalk-faint)'
                }">{{ inning }}</td>
                <td v-for="player in gamePlayers" :key="player.id" class="text-center p-2">
                  <span v-if="player.inningScores[inning - 1] !== undefined"
                        :style="{ fontFamily: 'var(--font-hand)', fontWeight: 600, color: player.inningScores[inning - 1] > 0 ? 'var(--chalk-green)' : 'var(--chalk-faint2)' }">
                    {{ player.inningScores[inning - 1] }}
                  </span>
                  <span v-else style="color: var(--chalk-line2)">-</span>
                </td>
              </tr>
              <tr style="border-top: 2px dashed var(--chalk-line)">
                <td class="p-2" style="font-family: var(--font-display); letter-spacing: 0.5px">Total</td>
                <td v-for="player in gamePlayers" :key="player.id" class="text-center p-2 text-lg" style="font-family: var(--font-display); color: var(--chalk-gold)">
                  {{ player.totalScore }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Panneau classement + historique -->
      <aside class="bb-sidebar flex flex-col gap-3 min-h-0 xl:pl-5">
        <div class="text-lg xl:text-[22px]" style="font-family: var(--font-display); letter-spacing: 0.5px">LE CLASSEMENT</div>

        <div class="flex flex-col gap-3">
          <div
            v-for="(player, index) in sortedPlayers"
            :key="player.id"
            class="relative rounded-[14px] p-3"
            :style="{
              border: index === 0 ? '2px solid var(--chalk-gold)' : '2px dashed var(--chalk-line)',
              background: index === 0 ? 'rgba(236,198,106,0.07)' : 'transparent'
            }">
            <div class="flex items-baseline justify-between gap-2">
              <span class="flex-1 text-lg xl:text-[24px]" style="font-family: var(--font-hand); font-weight: 600">{{ player.name }}</span>
              <span class="text-[34px] leading-none" style="font-family: var(--font-display)">{{ player.totalScore }}</span>
            </div>
            <div class="mt-1 text-[17px]" style="font-family: var(--font-hand); font-weight: 600">
              <span v-if="index === 0" style="color: var(--chalk-green)">Leader</span>
              <span v-else style="color: var(--chalk-faint2)">{{ player.totalScore - sortedPlayers[0].totalScore }} runs</span>
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
            <div class="text-[30px] opacity-50">&#9918;</div>
            Aucun coup joue
          </div>
          <div
            v-for="(entry, index) in [...history].reverse()"
            :key="index"
            class="flex items-center justify-between gap-2 py-1.5 px-1"
            style="border-bottom: 1.5px dashed var(--chalk-line2)">
            <div style="font-family: var(--font-hand); font-weight: 600; font-size: 15px">
              <span style="color: var(--chalk-cream)">{{ entry.player.name }}</span>
              <div style="color: var(--chalk-faint2); font-size: 13px">M{{ entry.inning + 1 }} - #{{ history.length - index }}</div>
            </div>
            <span class="text-sm px-3 py-0.5 rounded-full"
              :style="{
                fontFamily: 'var(--font-hand)', fontWeight: 600,
                color: entry.runs > 0 ? 'var(--chalk-green)' : 'var(--chalk-faint2)',
                background: entry.runs > 0 ? 'rgba(134,199,160,0.12)' : 'rgba(241,230,203,0.06)'
              }">
              {{ entry.runs }} run{{ entry.runs > 1 ? 's' : '' }}
            </span>
          </div>
        </div>
      </aside>
    </div>

    <!-- Modal Règles -->
    <div v-if="showRulesModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="chalk-grain rounded-2xl p-6 xl:p-8 border-2 border-dashed max-w-lg mx-4 max-h-[80vh] overflow-y-auto chalk-scroll"
        style="background: radial-gradient(120% 80% at 50% 0%, #1e2e28, var(--chalk-bg) 70%); border-color: var(--chalk-line)">
        <h3 class="text-2xl text-center mb-4" style="font-family: var(--font-display); color: var(--chalk-gold)">RÈGLES DU BASEBALL</h3>
        <div class="space-y-3 text-[22px] leading-relaxed" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
          <p><span style="color: var(--chalk-cream)">But du jeu :</span> Marquer le plus de "runs" en 9 manches.</p>
          <p><span style="color: var(--chalk-cream)">Déroulement :</span> À chaque manche, on vise le numéro de la manche (manche 1 = cible 1, etc.).</p>
          <p><span style="color: var(--chalk-cream)">Scoring :</span> Simple = 1 run, Double = 2 runs, Triple = 3 runs, Manqué = 0 run.</p>
          <p><span style="color: var(--chalk-cream)">3 fléchettes par manche,</span> les runs s'additionnent.</p>
          <p><span style="color: var(--chalk-cream)">Victoire :</span> Après 9 manches, le joueur avec le plus de runs gagne.</p>
          <p><span style="color: var(--chalk-cream)">Accessible aux débutants :</span> les numéros bas (1-3) sont faciles à toucher !</p>
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
          <div style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">remporte le Baseball !</div>
        </div>
        <div class="rounded-xl p-4 mb-6" style="background: rgba(134,199,160,0.1); border: 2px dashed var(--chalk-green)">
          <div class="text-2xl" style="font-family: var(--font-display); color: var(--chalk-green)">{{ winner?.totalScore }} runs</div>
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
  .bb-sidebar { border-left: 2px dashed var(--chalk-line); width: 332px; flex-shrink: 0; }
}
@media (max-width: 1279px) {
  .bb-sidebar { border-top: 2px dashed var(--chalk-line); width: 100%; padding-top: 1.25rem; }
  .bb-body { overflow-y: auto; }
}
</style>

<script>
import firebaseService from '../services/firebaseService.js';

export default {
  name: "Baseball",
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
      currentInning: 0,
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
    sortedPlayers() {
      return [...this.gamePlayers].sort((a, b) => b.totalScore - a.totalScore);
    }
  },
  methods: {
    initializePlayers() {
      this.gamePlayers = this.players.map(player => ({
        ...player,
        totalScore: 0,
        inningScores: {},
        dartsLeft: 3,
        currentInningRuns: 0,
        winner: false
      }));
    },

    addKeyboardListener() {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') this.undo();
      });
    },

    addRuns(runs) {
      if (this.gameFinished) return;

      const player = this.currentPlayer;
      player.totalScore += runs;
      player.currentInningRuns += runs;

      this.history.push({
        player,
        inning: this.currentInning,
        runs,
        previousTotal: player.totalScore - runs,
        previousInningRuns: player.currentInningRuns - runs
      });

      player.dartsLeft--;
      if (player.dartsLeft === 0) this.endTurn();
    },

    endTurn() {
      const player = this.currentPlayer;
      player.inningScores[this.currentInning] = player.currentInningRuns;
      player.currentInningRuns = 0;
      player.dartsLeft = 3;

      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.gamePlayers.length;

      if (this.currentPlayerIndex === 0) {
        this.currentInning++;
        if (this.currentInning >= 9) {
          this.endGame();
        }
      }
    },

    endGame() {
      const winner = this.sortedPlayers[0];
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
      player.totalScore = lastEntry.previousTotal;
      player.currentInningRuns = lastEntry.previousInningRuns;
      player.dartsLeft++;

      if (player.dartsLeft > 3) {
        player.dartsLeft = 1;
        // Revenir à la manche précédente si nécessaire
        delete player.inningScores[lastEntry.inning];
      }

      this.currentPlayerIndex = this.gamePlayers.findIndex(p => p.id === player.id);
      this.currentInning = lastEntry.inning;
      this.gameFinished = false;
      this.showWinnerModal = false;
      this.winner = null;
      this.gamePlayers.forEach(p => p.winner = false);
    },

    confirmReset() { this.showResetModal = true; },

    resetGame() {
      this.gamePlayers.forEach(p => {
        p.totalScore = 0;
        p.inningScores = {};
        p.dartsLeft = 3;
        p.currentInningRuns = 0;
        p.winner = false;
      });
      this.currentPlayerIndex = 0;
      this.currentInning = 0;
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
        const gameData = firebaseService.prepareGameData(winner, this.gamePlayers, this.history, 'Baseball');
        await firebaseService.sendGameVictory(gameData);
      } catch (error) {
        console.warn('Impossible d\'envoyer vers Firebase:', error.message);
      }
    }
  }
};
</script>
