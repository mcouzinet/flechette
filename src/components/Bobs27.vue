<template>
  <div class="chalk-grain"
    style="font-family: var(--font-ui); color: var(--chalk-cream); height: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column; background: radial-gradient(130% 90% at 50% -10%, #20322b, #142019 72%)">
    <!-- Cadre -->
    <div style="position: absolute; inset: 9px; border: 2px solid var(--chalk-line); border-radius: 12px; pointer-events: none; opacity: 0.5"></div>

    <GameHeader
      title="BOB'S 27"
      subtitle="doubles 1 &rarr; 20 + bulle"
      :is-fullscreen="isFullscreen"
      @back="$emit('exit')"
      @show-rules="showRulesModal = true"
      @toggle-fullscreen="toggleFullscreen"
      @confirm-reset="confirmReset" />

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

              <div class="flex justify-center gap-1.5 xl:gap-2 mt-3">
                <div
                  v-for="dart in 3"
                  :key="dart"
                  class="w-2.5 h-2.5 xl:w-3.5 xl:h-3.5 rounded-full transition-all duration-300"
                  :style="{ background: dart <= player.dartsLeft ? 'var(--chalk-gold)' : 'var(--chalk-line2)' }">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Controles de jeu -->
        <div v-if="!gameFinished" class="rounded-[14px] p-5" style="border: 2px dashed var(--chalk-line); background: transparent">
          <div class="text-center mb-3 xl:mb-4">
            <div class="text-sm xl:text-base" style="font-family: var(--font-display); letter-spacing: 0.5px; color: var(--chalk-faint)">
              Round {{ currentRound + 1 }}/21 &mdash; Cible : <span style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-gold); font-size: 2.5em; vertical-align: middle">D{{ currentTarget }}</span>
              <span class="text-[17px]" style="color: var(--chalk-faint2)">({{ currentTarget * 2 }} pts)</span>
            </div>
            <div class="text-3xl xl:text-4xl mt-1" style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-cream)">{{ currentPlayer?.name }}</div>
            <div class="flex gap-1.5 justify-center mt-2">
              <div v-for="dart in 3" :key="dart"
                class="w-2.5 h-2.5 xl:w-3.5 xl:h-3.5 rounded-full"
                :style="{ background: dart <= (currentPlayer?.dartsLeft || 0) ? 'var(--chalk-gold)' : 'var(--chalk-line2)' }">
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 xl:flex xl:flex-wrap xl:gap-3 xl:justify-center">
            <button
              @click="hitDouble()"
              :disabled="currentPlayer?.eliminated"
              class="b27-action-btn"
              :style="{ opacity: currentPlayer?.eliminated ? 0.4 : 1, color: 'var(--chalk-green)', borderColor: 'var(--chalk-green)' }">
              Double {{ currentTarget }} touche !
            </button>
            <button
              @click="miss()"
              :disabled="currentPlayer?.eliminated"
              class="b27-action-btn"
              :style="{ opacity: currentPlayer?.eliminated ? 0.4 : 1, color: 'var(--chalk-red)', borderColor: 'var(--chalk-red)' }">
              Manqu&eacute;
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
        <HistoryPanel :history="history" @undo="onUndo">
          <template #entry="{ entry, index, total }">
            <div class="flex items-center justify-between gap-2">
              <div style="font-family: var(--font-hand); font-weight: 600; font-size: 15px">
                <span style="color: var(--chalk-cream)">{{ entry.player.name }}</span>
                <div style="color: var(--chalk-faint2); font-size: 13px">D{{ entry.target }} - #{{ total - index }}</div>
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
          </template>
        </HistoryPanel>
      </aside>
    </div>

    <GameModals
      :show-rules="showRulesModal"
      :show-reset="showResetModal"
      :show-winner="showWinnerModal"
      rules-title="REGLES DU BOB'S 27"
      :winner-name="winner?.name"
      winner-subtitle="remporte le Bob's 27 !"
      @close-rules="showRulesModal = false"
      @close-reset="showResetModal = false"
      @confirm-reset="resetGame"
      @close-winner="showWinnerModal = false"
      @new-game="resetGame">
      <template #rules-content>
        <p><span style="color: var(--chalk-cream)">But du jeu :</span> Survivre aux 21 rounds en visant les doubles, en partant de 27 points.</p>
        <p><span style="color: var(--chalk-cream)">Cibles :</span> Round 1 = Double 1, Round 2 = Double 2... jusqu'au Round 20 = Double 20, puis Double Bulle.</p>
        <p><span style="color: var(--chalk-cream)">Touche :</span> Si tu touches le double, tu gagnes sa valeur (double 5 = +10 points).</p>
        <p><span style="color: var(--chalk-cream)">Manque :</span> Si tu manques, tu perds la valeur du double (double 5 = -10 points).</p>
        <p><span style="color: var(--chalk-cream)">Elimination :</span> Si ton score tombe a 0 ou en dessous, tu es elimine.</p>
        <p><span style="color: var(--chalk-cream)">Victoire :</span> Le dernier survivant ou le meilleur score apres 21 rounds gagne.</p>
      </template>
      <template #winner-stats>
        <div class="col-span-2">
          <div class="text-2xl" style="font-family: var(--font-display); color: var(--chalk-green)">{{ winner?.score }} points</div>
          <div class="text-sm mt-1" style="color: var(--chalk-faint2)">Score final</div>
        </div>
      </template>
    </GameModals>
  </div>
</template>

<style scoped>
.b27-action-btn {
  font-family: var(--font-display); letter-spacing: 0.5px; font-size: 22px;
  background: transparent; border: 2px solid; border-radius: 14px;
  padding: 16px 0; cursor: pointer; line-height: 1.1;
  transition: all 0.2s;
}
.b27-action-btn:hover {
  background: rgba(241,230,203,0.06);
}
@media (min-width: 1280px) {
  .b27-sidebar { border-left: 2px dashed var(--chalk-line); width: 332px; flex-shrink: 0; }
}
@media (max-width: 1279px) {
  .b27-sidebar { border-top: 2px dashed var(--chalk-line); width: 100%; padding-top: 1.25rem; }
  .b27-body { overflow-y: auto; }
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
  name: "Bobs27",
  components: { GameHeader, GameModals, HistoryPanel },
  mixins: [fullscreenMixin, keyboardUndoMixin],
  emits: ['exit'],
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
    onUndo() { this.undo(); },

    initializePlayers() {
      this.gamePlayers = this.players.map(player => ({
        ...player,
        score: 27,
        dartsLeft: 3,
        eliminated: false,
        winner: false
      }));
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

      // Si elimine, passer au joueur suivant immediatement
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

      // Sauter les joueurs elimines
      let attempts = 0;
      while (this.gamePlayers[nextIndex].eliminated && attempts < this.gamePlayers.length) {
        nextIndex = (nextIndex + 1) % this.gamePlayers.length;
        attempts++;
      }

      // Verifier s'il ne reste qu'un joueur
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
