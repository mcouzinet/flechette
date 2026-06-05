<template>
  <div class="chalk-grain"
    style="font-family: var(--font-ui); color: var(--chalk-cream); height: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column; background: radial-gradient(130% 90% at 50% -10%, #20322b, #142019 72%)">
    <!-- Cadre -->
    <div style="position: absolute; inset: 9px; border: 2px solid var(--chalk-line); border-radius: 12px; pointer-events: none; opacity: 0.5"></div>

    <GameHeader
      title="BASEBALL"
      subtitle="9 manches, vise les numeros"
      :is-fullscreen="isFullscreen"
      @back="$parent.currentComponent = null"
      @show-rules="showRulesModal = true"
      @toggle-fullscreen="toggleFullscreen"
      @confirm-reset="confirmReset" />

    <!-- Body -->
    <div class="bb-body flex-1 min-h-0 flex flex-col xl:flex-row gap-5 px-5 py-5 relative">

      <!-- Zone principale -->
      <section class="flex-1 flex flex-col min-w-0 overflow-auto chalk-scroll">

        <!-- Controles de jeu -->
        <div v-if="!gameFinished" class="rounded-[14px] p-3 xl:p-5 mb-3 xl:mb-5" style="border: 2px dashed var(--chalk-line); background: transparent">
          <div class="text-center mb-3 xl:mb-4">
            <div class="text-sm xl:text-base" style="font-family: var(--font-display); letter-spacing: 0.5px; color: var(--chalk-faint)">
              Manche {{ currentInning + 1 }}/9 &mdash; Cible : <span style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-gold); font-size: 2.5em; vertical-align: middle">{{ currentInning + 1 }}</span>
            </div>
            <div class="text-3xl xl:text-4xl" style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-gold)">
              {{ currentPlayer?.name }}
            </div>
            <div class="flex gap-1.5 justify-center mt-1">
              <div v-for="dart in 3" :key="dart"
                class="w-2.5 h-2.5 xl:w-3.5 xl:h-3.5 rounded-full"
                :style="{ background: dart <= (currentPlayer?.dartsLeft || 0) ? 'var(--chalk-gold)' : 'var(--chalk-line2)' }">
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 xl:flex xl:flex-wrap xl:gap-3 xl:justify-center">
            <button @click="addRuns(1)" class="chalk-btn-gold bb-action-btn">Simple</button>
            <button @click="addRuns(2)" class="chalk-btn-green bb-action-btn">Double</button>
            <button @click="addRuns(3)" class="chalk-btn-red bb-action-btn">Triple</button>
            <button @click="addRuns(0)" class="chalk-btn-ghost bb-action-btn">Manqu&eacute;</button>
          </div>
        </div>

        <!-- Tableau des manches -->
        <div class="overflow-x-auto flex-1 chalk-scroll">
          <table class="w-full" style="border-collapse: separate; border-spacing: 0">
            <thead>
              <tr>
                <th class="text-left px-2 py-1.5 xl:p-2 text-[13px] xl:text-sm whitespace-nowrap" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2); border-bottom: 2px dashed var(--chalk-line)"></th>
                <th v-for="player in gamePlayers" :key="player.id"
                  class="text-center px-2 py-2 xl:p-2 text-base xl:text-lg whitespace-nowrap"
                  style="font-family: var(--font-hand); font-weight: 600; border-bottom: 2px dashed var(--chalk-line)"
                  :style="{ color: gamePlayers.indexOf(player) === currentPlayerIndex && !gameFinished ? 'var(--chalk-gold)' : 'var(--chalk-faint2)' }">
                  {{ player.name }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inning in 9" :key="inning"
                :style="{
                  background: inning - 1 === currentInning && !gameFinished ? 'rgba(236,198,106,0.06)' : 'transparent'
                }">
                <td class="px-2 py-1.5 xl:p-2 text-base xl:text-lg"
                  style="border-bottom: 1px dashed var(--chalk-line2)"
                  :style="{
                    fontFamily: 'var(--font-display)',
                    color: inning - 1 === currentInning && !gameFinished ? 'var(--chalk-gold)' : 'var(--chalk-faint)'
                  }">{{ inning }}</td>
                <td v-for="player in gamePlayers" :key="player.id"
                  class="text-center px-2 py-1.5 xl:p-2 text-lg xl:text-xl"
                  style="border-bottom: 1px dashed var(--chalk-line2)">
                  <span v-if="player.inningScores[inning - 1] !== undefined"
                    :style="{ fontFamily: 'var(--font-hand)', fontWeight: 600, color: player.inningScores[inning - 1] > 0 ? 'var(--chalk-green)' : 'var(--chalk-faint2)' }">
                    {{ player.inningScores[inning - 1] }}
                  </span>
                  <span v-else style="color: var(--chalk-line2)">&middot;</span>
                </td>
              </tr>
              <tr style="border-top: 2px dashed var(--chalk-line)">
                <td class="px-2 py-2 xl:p-2 text-base xl:text-lg" style="font-family: var(--font-display); letter-spacing: 0.5px">Total</td>
                <td v-for="player in gamePlayers" :key="player.id"
                  class="text-center px-2 py-2 xl:p-2 text-xl xl:text-2xl"
                  style="font-family: var(--font-display); color: var(--chalk-gold)">
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
        <HistoryPanel :history="history" @undo="onUndo">
          <template #entry="{ entry, index, total }">
            <div class="flex items-center justify-between gap-2">
              <div style="font-family: var(--font-hand); font-weight: 600; font-size: 15px">
                <span style="color: var(--chalk-cream)">{{ entry.player.name }}</span>
                <div style="color: var(--chalk-faint2); font-size: 13px">M{{ entry.inning + 1 }} - #{{ total - index }}</div>
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
          </template>
        </HistoryPanel>
      </aside>
    </div>

    <GameModals
      :show-rules="showRulesModal"
      :show-reset="showResetModal"
      :show-winner="showWinnerModal"
      rules-title="REGLES DU BASEBALL"
      :winner-name="winner?.name"
      winner-subtitle="remporte le Baseball !"
      @close-rules="showRulesModal = false"
      @close-reset="showResetModal = false"
      @confirm-reset="resetGame"
      @close-winner="showWinnerModal = false"
      @new-game="resetGame">
      <template #rules-content>
        <p><span style="color: var(--chalk-cream)">Le principe :</span> 9 manches, 3 fl&eacute;chettes par manche. A chaque manche, tu vises le num&eacute;ro correspondant : manche 1 = tu vises le 1, manche 2 = tu vises le 2, etc.</p>
        <p><span style="color: var(--chalk-cream)">Comment marquer :</span> Seul le num&eacute;ro de la manche compte. Si tu touches la zone simple, tu marques 1 run. La zone double = 2 runs. La zone triple = 3 runs. Tout le reste = 0.</p>
        <p><span style="color: var(--chalk-cream)">Exemple :</span> Manche 5, tu lances 3 fl&eacute;chettes sur le 5. Tu touches un simple et un triple = 4 runs pour cette manche.</p>
        <p><span style="color: var(--chalk-cream)">Le gagnant :</span> Apr&egrave;s 9 manches, celui qui a le plus de runs au total gagne.</p>
      </template>
      <template #winner-stats>
        <div class="col-span-2">
          <div class="text-2xl" style="font-family: var(--font-display); color: var(--chalk-green)">{{ winner?.totalScore }} runs</div>
          <div class="text-sm mt-1" style="color: var(--chalk-faint2)">Score final</div>
        </div>
      </template>
    </GameModals>
  </div>
</template>

<style scoped>
.bb-action-btn { font-size: 24px !important; padding: 12px 20px !important; }
@media (min-width: 1280px) {
  .bb-sidebar { border-left: 2px dashed var(--chalk-line); width: 332px; flex-shrink: 0; }
}
@media (max-width: 1279px) {
  .bb-sidebar { border-top: 2px dashed var(--chalk-line); width: 100%; padding-top: 1.25rem; }
  .bb-body { overflow-y: auto; }
}
</style>

<script>
import firebaseService from '../services/firebaseService.js';
import fullscreenMixin from '../mixins/fullscreenMixin.js';
import keyboardUndoMixin from '../mixins/keyboardUndoMixin.js';
import GameHeader from './shared/GameHeader.vue';
import GameModals from './shared/GameModals.vue';
import HistoryPanel from './shared/HistoryPanel.vue';

export default {
  name: "Baseball",
  components: { GameHeader, GameModals, HistoryPanel },
  mixins: [fullscreenMixin, keyboardUndoMixin],
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
      showRulesModal: false,
      showResetModal: false,
      showWinnerModal: false,
      winner: null
    };
  },
  mounted() {
    this.initializePlayers();
  },
  computed: {
    currentPlayer() { return this.gamePlayers[this.currentPlayerIndex]; },
    sortedPlayers() {
      return [...this.gamePlayers].sort((a, b) => b.totalScore - a.totalScore);
    }
  },
  methods: {
    onUndo() { this.undo(); },

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
        // Revenir a la manche precedente si necessaire
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
