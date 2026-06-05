<template>
  <div class="chalk-grain"
    style="font-family: var(--font-ui); color: var(--chalk-cream); height: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column; background: radial-gradient(130% 90% at 50% -10%, #20322b, #142019 72%)">
    <!-- Cadre -->
    <div style="position: absolute; inset: 9px; border: 2px solid var(--chalk-line); border-radius: 12px; pointer-events: none; opacity: 0.5"></div>

    <GameHeader
      title="MORPION"
      subtitle="aligne 3 cases pour gagner"
      :is-fullscreen="isFullscreen"
      @back="$parent.currentComponent = null"
      @show-rules="showRulesModal = true"
      @toggle-fullscreen="toggleFullscreen"
      @confirm-reset="confirmReset" />

    <!-- Body -->
    <div class="flex-1 min-h-0 flex flex-col xl:flex-row gap-5 px-5 py-5 overflow-auto mp-body relative">

      <!-- Tableau principal -->
      <section class="flex-1 flex flex-col min-w-0 overflow-auto chalk-scroll">

        <!-- Info joueurs -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div
            v-for="(player, index) in gamePlayers"
            :key="player.id"
            class="relative rounded-[14px] p-5 text-center"
            :style="{
              border: currentPlayerIndex === index && !gameFinished
                ? `2px solid ${index === 0 ? 'var(--chalk-red)' : 'var(--chalk-green)'}`
                : player.winner
                  ? '2px solid var(--chalk-gold)'
                  : '2px dashed var(--chalk-line)',
              background: currentPlayerIndex === index && !gameFinished
                ? `rgba(${index === 0 ? '239,139,111' : '134,199,160'},0.07)`
                : player.winner
                  ? 'rgba(236,198,106,0.07)'
                  : 'transparent'
            }">

            <div v-if="currentPlayerIndex === index && !gameFinished"
                 class="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[14px]"
                 style="font-family: var(--font-hand); font-weight: 700; background: var(--chalk-bg); border: 1.5px dashed var(--chalk-line)"
                 :style="{ color: index === 0 ? 'var(--chalk-red)' : 'var(--chalk-green)' }">
              A JOUER
            </div>
            <div v-if="player.winner"
                 class="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[14px]"
                 style="font-family: var(--font-hand); font-weight: 700; background: var(--chalk-bg); border: 1.5px solid var(--chalk-gold); color: var(--chalk-gold)">
              GAGNANT
            </div>

            <div class="text-lg xl:text-[26px] leading-none mb-2" style="font-family: var(--font-hand); font-weight: 700">{{ player.name }}</div>
            <div class="text-4xl xl:text-[48px] leading-none mb-1" style="font-family: var(--font-display)"
                 :style="{ color: index === 0 ? 'var(--chalk-red)' : 'var(--chalk-green)' }">
              {{ index === 0 ? 'X' : 'O' }}
            </div>
            <div class="text-[16px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">
              {{ getPlayerCells(index).length }} case{{ getPlayerCells(index).length > 1 ? 's' : '' }}
            </div>
          </div>
        </div>

        <!-- Grille de morpion -->
        <div class="flex justify-center mb-6">
          <div class="morpion-grid max-w-[420px] w-full">
            <button
              v-for="(cell, cellIndex) in board"
              :key="cellIndex"
              @click="claimCell(cellIndex)"
              :disabled="cell.owner !== null || gameFinished"
              class="morpion-cell aspect-square flex flex-col items-center justify-center gap-1 cursor-pointer relative"
              :class="[
                cell.owner !== null ? 'morpion-cell--claimed' : '',
                isWinningCell(cellIndex) ? 'morpion-cell--win' : '',
                gameFinished && cell.owner === null ? 'morpion-cell--disabled' : ''
              ]"
              :style="{
                borderRight: (cellIndex % 3 !== 2) ? '2px dashed var(--chalk-line)' : 'none',
                borderBottom: (cellIndex < 6) ? '2px dashed var(--chalk-line)' : 'none'
              }">
              <div class="text-[18px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">{{ cell.number }}</div>
              <div v-if="cell.owner !== null" class="text-[44px] md:text-[52px] leading-none" style="font-family: var(--font-display)"
                   :style="{ color: cell.owner === 0 ? 'var(--chalk-red)' : 'var(--chalk-green)' }">
                {{ cell.owner === 0 ? 'X' : 'O' }}
              </div>
            </button>
          </div>
        </div>

        <!-- Controles de jeu -->
        <div v-if="!gameFinished" class="rounded-[14px] p-5" style="border: 2px dashed var(--chalk-line); background: rgba(241,230,203,0.03)">
          <h3 class="text-lg xl:text-[22px] mb-1 text-center" style="font-family: var(--font-hand); font-weight: 700">
            {{ currentPlayer?.name }}
            <span :style="{ color: currentPlayerIndex === 0 ? 'var(--chalk-red)' : 'var(--chalk-green)' }">
              ({{ currentPlayerIndex === 0 ? 'X' : 'O' }})
            </span>
          </h3>
          <p class="text-center mb-4 text-[17px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">
            Cliquez sur une case ou selectionnez le numero touche
          </p>

          <!-- Grille de numeros alternatifs -->
          <div class="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
            <button
              v-for="(cell, cellIndex) in board"
              :key="cellIndex"
              @click="claimCell(cellIndex)"
              :disabled="cell.owner !== null || gameFinished"
              class="morpion-num-btn h-12 rounded-[10px] text-[18px]"
              :class="cell.owner !== null ? 'morpion-num-btn--taken' : ''"
              style="font-family: var(--font-display)">
              {{ cell.number }}
            </button>
          </div>
        </div>

        <!-- Message match nul -->
        <div v-if="isDraw" class="rounded-[14px] p-5 text-center" style="border: 2px dashed var(--chalk-line); background: rgba(241,230,203,0.03)">
          <div class="text-[36px] mb-3 opacity-60">&#9876;</div>
          <h3 class="text-[24px] mb-2" style="font-family: var(--font-display); color: var(--chalk-gold)">MATCH NUL !</h3>
          <p style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">Aucun joueur n'a reussi a aligner 3 cases.</p>
        </div>
      </section>

      <!-- Panneau Score + Historique -->
      <aside class="xl:w-[320px] flex flex-col gap-3 min-h-0 xl:pl-5 pt-4 xl:pt-0 xl:flex-none mp-sidebar">
        <div class="text-lg xl:text-[22px]" style="font-family: var(--font-display); letter-spacing: 0.5px">SCORE</div>

        <!-- Score global -->
        <div class="grid grid-cols-3 gap-3 mb-4 py-3 rounded-[14px]" style="border: 2px dashed var(--chalk-line); background: rgba(241,230,203,0.03)">
          <div class="text-center">
            <div class="text-2xl xl:text-[36px] leading-none" style="font-family: var(--font-display); color: var(--chalk-red)">{{ scores[0] }}</div>
            <div class="text-[17px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">{{ gamePlayers[0]?.name }}</div>
          </div>
          <div class="text-center">
            <div class="text-2xl xl:text-[36px] leading-none" style="font-family: var(--font-display); color: var(--chalk-faint2)">{{ scores[2] }}</div>
            <div class="text-[17px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">Nul</div>
          </div>
          <div class="text-center">
            <div class="text-2xl xl:text-[36px] leading-none" style="font-family: var(--font-display); color: var(--chalk-green)">{{ scores[1] }}</div>
            <div class="text-[17px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">{{ gamePlayers[1]?.name }}</div>
          </div>
        </div>

        <HistoryPanel :history="history" @undo="onUndo">
          <template #entry="{ entry, index, total }">
            <div class="flex items-center gap-3">
              <span class="w-2.5 h-2.5 rounded-full flex-none"
                    :style="{ background: entry.playerIndex === 0 ? 'var(--chalk-red)' : 'var(--chalk-green)' }"></span>
              <span class="flex-1 text-[16px]" style="font-family: var(--font-hand); font-weight: 600">
                <b>{{ entry.player.name }}</b> &rarr;
                <span :style="{ color: entry.playerIndex === 0 ? 'var(--chalk-red)' : 'var(--chalk-green)' }">{{ entry.playerIndex === 0 ? 'X' : 'O' }}</span>
                sur {{ board[entry.cellIndex]?.number || entry.cellNumber }}
              </span>
              <span class="text-[14px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">#{{ total - index }}</span>
            </div>
          </template>
        </HistoryPanel>
      </aside>
    </div>

    <GameModals
      :show-rules="showRulesModal"
      :show-reset="showResetModal"
      :show-winner="showWinnerModal"
      rules-title="RÈGLES DU MORPION"
      reset-message="Remettre a zero la manche ?<br><span style=&quot;color: var(--chalk-red)&quot;>Le score sera conserve.</span>"
      :winner-name="winner?.name"
      :winner-subtitle="isDraw ? 'Match nul !' : 'a aligne 3 cases !'"
      @close-rules="showRulesModal = false"
      @close-reset="showResetModal = false"
      @confirm-reset="resetBoard"
      @close-winner="showWinnerModal = false"
      @new-game="resetBoard">
      <template #rules-content>
        <p><span style="color: var(--chalk-cream)">But du jeu :</span> Aligner 3 cases (horizontale, verticale ou diagonale) sur la grille 3x3.</p>
        <p><span style="color: var(--chalk-cream)">Grille :</span> Chaque case correspond à un numéro sur la cible (20, 18, 13, 12, 14, 16, 19, 15, 17).</p>
        <p><span style="color: var(--chalk-cream)">Tour de jeu :</span> Les joueurs alternent. Joueur 1 = X, Joueur 2 = O.</p>
        <p><span style="color: var(--chalk-cream)">Prendre une case :</span> Touche le numéro correspondant à la case souhaitée.</p>
        <p><span style="color: var(--chalk-cream)">Match nul :</span> Si toutes les cases sont remplies sans alignement, c'est un match nul.</p>
        <p><span style="color: var(--chalk-cream)">Le score global est conservé entre les manches.</span></p>
      </template>
      <template #winner-stats>
        <div>
          <div class="text-2xl" style="font-family: var(--font-display); color: var(--chalk-green)">{{ scores[0] }} - {{ scores[1] }}</div>
          <div class="text-[15px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">Score global</div>
        </div>
        <div>
          <div class="text-2xl" style="font-family: var(--font-display); color: var(--chalk-green)">{{ history.length }}</div>
          <div class="text-[15px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">Coups joues</div>
        </div>
      </template>
    </GameModals>
  </div>
</template>

<style scoped>
/* Morpion grid */
.morpion-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
.morpion-cell {
  background: transparent;
  border: none;
  transition: background 0.2s;
}
.morpion-cell:not(.morpion-cell--claimed):not(.morpion-cell--disabled):hover {
  background: rgba(241,230,203,0.06);
}
.morpion-cell--win {
  box-shadow: inset 0 0 0 3px var(--chalk-gold), 0 0 16px rgba(236,198,106,0.2);
  background: rgba(236,198,106,0.06) !important;
}
.morpion-cell--disabled {
  opacity: 0.35;
  cursor: not-allowed !important;
}

/* Number buttons */
.morpion-num-btn {
  background: transparent;
  border: 2px dashed var(--chalk-line);
  color: var(--chalk-cream);
  cursor: pointer;
  transition: all 0.2s;
}
.morpion-num-btn:not(.morpion-num-btn--taken):hover {
  border-color: var(--chalk-gold);
  background: rgba(236,198,106,0.08);
  color: var(--chalk-gold);
}
.morpion-num-btn--taken {
  opacity: 0.2;
  cursor: not-allowed;
  border-style: dashed;
  color: var(--chalk-faint2);
}
@media (min-width: 1280px) {
  .mp-sidebar { border-left: 2px dashed var(--chalk-line); }
}
@media (max-width: 1279px) {
  .mp-sidebar { border-top: 2px dashed var(--chalk-line); }
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
  name: "Morpion",
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
      // Grille classique de morpion fléchettes : numéros répartis sur la cible
      gridNumbers: [20, 18, 13, 12, 14, 16, 19, 15, 17],
      board: [],
      history: [],
      scores: [0, 0, 0], // [joueur1, joueur2, nuls]
      winningLine: null,
      gameFinished: false,
      isDraw: false,
      showRulesModal: false,
      showResetModal: false,
      showWinnerModal: false,
      winner: null
    };
  },
  mounted() {
    this.initializePlayers();
    this.initializeBoard();
  },
  computed: {
    currentPlayer() {
      return this.gamePlayers[this.currentPlayerIndex];
    }
  },
  methods: {
    onUndo() { this.undo(); },

    initializePlayers() {
      // Le morpion se joue à 2 joueurs (on prend les 2 premiers)
      this.gamePlayers = this.players.slice(0, 2).map(player => ({
        ...player,
        winner: false
      }));
    },

    initializeBoard() {
      this.board = this.gridNumbers.map(number => ({
        number,
        owner: null
      }));
    },

    getPlayerCells(playerIndex) {
      return this.board.filter(cell => cell.owner === playerIndex);
    },

    claimCell(cellIndex) {
      if (this.gameFinished || this.board[cellIndex].owner !== null) return;

      this.board[cellIndex].owner = this.currentPlayerIndex;

      this.history.push({
        player: this.currentPlayer,
        playerIndex: this.currentPlayerIndex,
        cellIndex,
        cellNumber: this.board[cellIndex].number
      });

      // Vérifier victoire
      const winLine = this.checkWin();
      if (winLine) {
        this.winningLine = winLine;
        this.currentPlayer.winner = true;
        this.gameFinished = true;
        this.winner = this.currentPlayer;
        this.scores[this.currentPlayerIndex]++;
        this.sendVictory(this.currentPlayer);
        setTimeout(() => {
          this.showWinnerModal = true;
        }, 500);
        return;
      }

      // Vérifier match nul
      if (this.board.every(cell => cell.owner !== null)) {
        this.gameFinished = true;
        this.isDraw = true;
        this.scores[2]++;
        return;
      }

      // Joueur suivant
      this.currentPlayerIndex = this.currentPlayerIndex === 0 ? 1 : 0;
    },

    checkWin() {
      const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // lignes
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // colonnes
        [0, 4, 8], [2, 4, 6]             // diagonales
      ];

      for (const line of lines) {
        const [a, b, c] = line;
        if (
          this.board[a].owner !== null &&
          this.board[a].owner === this.board[b].owner &&
          this.board[a].owner === this.board[c].owner
        ) {
          return line;
        }
      }
      return null;
    },

    isWinningCell(cellIndex) {
      return this.winningLine && this.winningLine.includes(cellIndex);
    },

    undo() {
      if (this.history.length === 0) return;

      const lastEntry = this.history.pop();
      this.board[lastEntry.cellIndex].owner = null;
      this.currentPlayerIndex = lastEntry.playerIndex;

      // Annuler victoire ou match nul
      if (this.gameFinished) {
        if (this.isDraw) {
          this.scores[2]--;
        } else if (this.winner) {
          this.scores[lastEntry.playerIndex]--;
        }
      }

      this.gamePlayers.forEach(p => p.winner = false);
      this.gameFinished = false;
      this.isDraw = false;
      this.showWinnerModal = false;
      this.winner = null;
      this.winningLine = null;
    },

    confirmReset() {
      this.showResetModal = true;
    },

    resetBoard() {
      this.initializeBoard();
      this.gamePlayers.forEach(p => p.winner = false);
      this.currentPlayerIndex = 0;
      this.history = [];
      this.gameFinished = false;
      this.isDraw = false;
      this.showResetModal = false;
      this.showWinnerModal = false;
      this.winner = null;
      this.winningLine = null;
    },

    resetGame() {
      this.resetBoard();
      this.scores = [0, 0, 0];
    },

    async sendVictory(winner) {
      try {
        const gameData = firebaseService.prepareGameData(winner, this.gamePlayers, this.history, 'Morpion');
        await firebaseService.sendGameVictory(gameData);
        console.log('Victoire Morpion envoyée vers Firebase !');
      } catch (error) {
        console.warn('Impossible d\'envoyer vers Firebase:', error.message);
      }
    }
  }
};
</script>
