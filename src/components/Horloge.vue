<template>
  <div class="chalk-grain"
    style="font-family: var(--font-ui); color: var(--chalk-cream); height: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column; background: radial-gradient(130% 90% at 50% -10%, #20322b, #142019 72%)">
    <!-- Cadre -->
    <div style="position: absolute; inset: 9px; border: 2px solid var(--chalk-line); border-radius: 12px; pointer-events: none; opacity: 0.5"></div>

    <GameHeader
      title="HORLOGE"
      subtitle="1 &#8594; 20 &#8594; Bulle"
      :is-fullscreen="isFullscreen"
      @back="$emit('exit')"
      @show-rules="showRulesModal = true"
      @toggle-fullscreen="toggleFullscreen"
      @confirm-reset="confirmReset" />

    <!-- Body -->
    <div class="flex-1 min-h-0 flex flex-col xl:grid gap-5 px-5 py-5 relative overflow-auto hl-body">

      <!-- Tableau principal -->
      <section class="flex flex-col min-w-0 overflow-auto chalk-scroll">

        <!-- Scores des joueurs -->
        <div :class="[
          'grid gap-5 mb-3 pt-4',
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
              border: currentPlayerIndex === index && !player.winner
                ? '2px solid var(--chalk-gold)'
                : player.winner
                  ? '2px solid var(--chalk-green)'
                  : '2px dashed var(--chalk-line)',
              background: currentPlayerIndex === index && !player.winner
                ? 'rgba(236,198,106,0.07)'
                : player.winner
                  ? 'rgba(134,199,160,0.07)'
                  : 'transparent'
            }">

            <!-- Badge joueur actuel -->
            <div v-if="currentPlayerIndex === index && !gameFinished"
                 class="absolute -top-3 right-3 px-3 py-1 rounded-full text-[13px]"
                 style="font-family: var(--font-hand); font-weight: 700; background: var(--chalk-gold); color: var(--chalk-bg)">
              A JOUER
            </div>

            <!-- Badge gagnant -->
            <div v-if="player.winner"
                 class="absolute -top-3 right-3 px-3 py-1 rounded-full text-[13px]"
                 style="font-family: var(--font-hand); font-weight: 700; background: var(--chalk-green); color: var(--chalk-bg)">
              GAGNANT
            </div>

            <div class="text-center">
              <h3 class="text-lg xl:text-[26px] mb-3" style="font-family: var(--font-hand); font-weight: 700">
                {{ player.name }}
              </h3>

              <!-- Cible actuelle -->
              <div class="relative mb-3">
                <div class="text-[14px] uppercase tracking-wider mb-1" style="color: var(--chalk-faint2)">Cible actuelle</div>
                <div class="text-4xl xl:text-[56px] leading-none font-bold mb-2 transition-all duration-300"
                  :style="{
                    fontFamily: 'var(--font-display)',
                    color: player.winner ? 'var(--chalk-green)' : player.currentTarget > 20 ? 'var(--chalk-gold)' : 'var(--chalk-cream)'
                  }">
                  {{ player.winner ? 'FINI' : (player.currentTarget > 20 ? 'BULLE' : player.currentTarget) }}
                </div>
                <div class="text-[15px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">{{ player.currentTarget - 1 }}/21 termin&eacute;s</div>
              </div>

              <!-- Flechettes restantes -->
              <div class="flex justify-center gap-1.5 xl:gap-2 mb-3">
                <div
                  v-for="dart in 3"
                  :key="dart"
                  class="w-2.5 h-2.5 xl:w-3.5 xl:h-3.5 rounded-full transition-all duration-300"
                  :style="{
                    background: dart <= player.dartsLeft ? 'var(--chalk-gold)' : 'var(--chalk-line2)'
                  }">
                </div>
              </div>

              <!-- Barre de progression -->
              <div class="w-full rounded-full h-[10px] mb-1" style="background: var(--chalk-line2)">
                <div
                  class="h-[10px] rounded-full transition-all duration-500"
                  :style="{ width: ((player.currentTarget - 1) / 21 * 100) + '%', background: 'var(--chalk-green)' }">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Controles de jeu -->
        <div class="rounded-[14px] p-5" style="border: 2px dashed var(--chalk-line)">
          <div class="text-center mb-3 xl:mb-4">
            <div class="text-sm xl:text-base" style="font-family: var(--font-display); letter-spacing: 0.5px; color: var(--chalk-faint)">
              Cible : <span style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-gold); font-size: 2.5em; vertical-align: middle">{{ currentPlayer?.currentTarget > 20 ? 'Bulle' : currentPlayer?.currentTarget }}</span>
            </div>
            <div class="text-3xl xl:text-4xl mt-1" style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-cream)">{{ currentPlayer?.name }}</div>
            <div class="flex gap-1.5 justify-center mt-2">
              <div v-for="dart in 3" :key="dart"
                class="w-2.5 h-2.5 xl:w-3.5 xl:h-3.5 rounded-full"
                :style="{ background: dart <= (currentPlayer?.dartsLeft || 0) ? 'var(--chalk-gold)' : 'var(--chalk-line2)' }">
              </div>
            </div>
          </div>

          <!-- Grille des numeros -->
          <div class="grid grid-cols-3 lg:grid-cols-7 gap-3 mb-5">
            <button
              v-for="number in targetNumbers"
              :key="number"
              @click="hitTarget(number)"
              :disabled="gameFinished"
              class="h-[58px] rounded-[10px] text-[20px] transition-all duration-300 cursor-pointer horloge-num"
              :style="{
                fontFamily: 'var(--font-display)',
                border: number === currentPlayer?.currentTarget || (currentPlayer?.currentTarget > 20 && number === 25)
                  ? '2px solid var(--chalk-gold)'
                  : '2px dashed var(--chalk-line2)',
                background: number === currentPlayer?.currentTarget || (currentPlayer?.currentTarget > 20 && number === 25)
                  ? 'rgba(236,198,106,0.12)'
                  : number < currentPlayer?.currentTarget
                    ? 'rgba(134,199,160,0.08)'
                    : 'transparent',
                color: number === currentPlayer?.currentTarget || (currentPlayer?.currentTarget > 20 && number === 25)
                  ? 'var(--chalk-gold)'
                  : number < currentPlayer?.currentTarget
                    ? 'var(--chalk-green)'
                    : 'var(--chalk-faint2)',
                opacity: gameFinished ? 0.4 : 1
              }">
              {{ number === 25 ? 'BULLE' : number }}
            </button>
          </div>

          <!-- Bouton Manque -->
          <div class="flex justify-center">
            <button
              @click="miss()"
              :disabled="gameFinished"
              class="hl-action-btn"
              :style="{ opacity: gameFinished ? 0.4 : 1, color: 'var(--chalk-faint)', borderColor: 'var(--chalk-faint)', borderStyle: 'dashed' }">
              Manqu&eacute;
            </button>
          </div>
        </div>
      </section>

      <!-- Panneau classement + historique -->
      <aside class="flex flex-col gap-3 min-h-0 xl:pl-5 pt-4 xl:pt-0 hl-sidebar">
        <div class="text-lg xl:text-[22px]" style="font-family: var(--font-display); letter-spacing: 0.5px">LE CLASSEMENT</div>

        <!-- Classement -->
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
              <span class="w-5 text-[18px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">{{ index + 1 }}.</span>
              <span class="flex-1 text-lg xl:text-[24px]" style="font-family: var(--font-hand); font-weight: 600">
                {{ player.name }}
              </span>
              <span class="text-[34px] leading-none" style="font-family: var(--font-display)">
                {{ player.winner ? 'Fini' : (player.currentTarget > 20 ? 'Bulle' : player.currentTarget) }}
              </span>
            </div>

            <div class="flex justify-between items-end mt-1 ml-5">
              <div class="text-[17px] leading-tight" style="font-family: var(--font-hand); font-weight: 600">
                <span v-if="index === 0" style="color: var(--chalk-green)">Leader &#10022;</span>
                <span v-else style="color: var(--chalk-gold)">{{ player.currentTarget - sortedPlayers[0].currentTarget }} cibles de retard</span>
              </div>
              <span class="text-[19px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">{{ player.currentTarget - 1 }}/21</span>
            </div>
          </div>
        </div>

        <HistoryPanel :history="history" @undo="onUndo">
          <template #entry="{ entry, index, total }">
            <div class="flex items-center gap-3">
              <div class="flex-1 text-[16px]" style="font-family: var(--font-hand); font-weight: 600">
                <span style="color: var(--chalk-gold)">{{ entry.player.name }}</span>
                <span class="ml-1" style="color: var(--chalk-faint2)">#{{ total - index }}</span>
              </div>
              <div class="w-[44px] h-[44px] rounded-full flex items-center justify-center text-[18px]"
                :style="{
                  fontFamily: 'var(--font-display)',
                  border: entry.hit ? '2px solid var(--chalk-green)' : '2px solid var(--chalk-red)',
                  color: entry.hit ? 'var(--chalk-green)' : 'var(--chalk-red)',
                  background: entry.hit ? 'rgba(134,199,160,0.1)' : 'rgba(239,139,111,0.1)'
                }">
                {{ entry.hit ? (entry.target > 20 ? 'B' : entry.target) : 'X' }}
              </div>
            </div>
          </template>
        </HistoryPanel>
      </aside>
    </div>

    <GameModals
      :show-rules="showRulesModal"
      :show-reset="showResetModal"
      :show-winner="showWinnerModal"
      rules-title="R&Egrave;GLES DE L'HORLOGE"
      :winner-name="winner?.name"
      winner-subtitle="a fait le tour de l'horloge !"
      @close-rules="showRulesModal = false"
      @close-reset="showResetModal = false"
      @confirm-reset="resetGame"
      @close-winner="showWinnerModal = false"
      @new-game="resetGame">
      <template #rules-content><RulesList :rules="rules" /></template>
      <template #winner-stats>
        <div>
          <div class="text-2xl font-bold" style="color: var(--chalk-green)">21/21</div>
          <div class="text-sm" style="color: var(--chalk-faint2)">Cibles touch&eacute;es</div>
        </div>
        <div>
          <div class="text-2xl font-bold" style="color: var(--chalk-green)">{{ getPlayerDarts(winner) }}</div>
          <div class="text-sm" style="color: var(--chalk-faint2)">Fl&eacute;chettes lanc&eacute;es</div>
        </div>
      </template>
    </GameModals>
  </div>
</template>

<style scoped>
.horloge-num:hover:not(:disabled) {
  background: rgba(241,230,203,0.06) !important;
}
.hl-action-btn {
  font-family: var(--font-display); letter-spacing: 0.5px; font-size: 22px;
  background: transparent; border: 2px solid; border-radius: 14px;
  padding: 16px 24px; cursor: pointer; line-height: 1.1;
  transition: all 0.2s;
}
.hl-action-btn:hover {
  background: rgba(241,230,203,0.06);
}
@media (min-width: 1280px) {
  .hl-body { grid-template-columns: 1fr 332px; }
  .hl-sidebar { border-left: 2px dashed var(--chalk-line); }
}
@media (max-width: 1279px) {
  .hl-sidebar { border-top: 2px dashed var(--chalk-line); }
}
</style>

<script>
import firebaseService from '../services/firebaseService.js';
import fullscreenMixin from '../mixins/fullscreenMixin.js';
import keyboardUndoMixin from '../mixins/keyboardUndoMixin.js';
import GameHeader from './shared/GameHeader.vue';
import GameModals from './shared/GameModals.vue';
import HistoryPanel from './shared/HistoryPanel.vue';
import RulesList from './shared/RulesList.vue';
import { RULES } from '../rules.js';

export default {
  name: "Horloge",
  components: { GameHeader, GameModals, HistoryPanel, RulesList },
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
      rules: RULES.horloge,
      gamePlayers: [],
      currentPlayerIndex: 0,
      history: [],
      targetNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25],
      gameFinished: false,
      showResetModal: false,
      showRulesModal: false,
      showWinnerModal: false,
      winner: null
    };
  },
  mounted() {
    this.initializePlayers();
  },
  computed: {
    currentPlayer() {
      return this.gamePlayers[this.currentPlayerIndex];
    },
    sortedPlayers() {
      return [...this.gamePlayers].sort((a, b) => b.currentTarget - a.currentTarget);
    }
  },
  methods: {
    onUndo() { this.undo(); },

    initializePlayers() {
      this.gamePlayers = this.players.map(player => ({
        ...player,
        currentTarget: 1,
        dartsLeft: 3,
        winner: false
      }));
    },

    hitTarget(number) {
      if (this.gameFinished) return;

      const player = this.currentPlayer;
      const expectedTarget = player.currentTarget > 20 ? 25 : player.currentTarget;
      const hit = number === expectedTarget;

      this.history.push({
        player,
        target: expectedTarget,
        hit,
        thrownAt: number
      });

      if (hit) {
        player.currentTarget++;

        // Victoire : a touche la bulle (cible 22 = apres bulle)
        if (player.currentTarget > 21) {
          player.winner = true;
          this.gameFinished = true;
          this.winner = player;
          this.sendVictory(player);
          setTimeout(() => {
            this.showWinnerModal = true;
          }, 500);
        }
      }

      player.dartsLeft--;

      if (player.dartsLeft === 0 && !this.gameFinished) {
        this.nextPlayer();
      }
    },

    miss() {
      if (this.gameFinished) return;

      const player = this.currentPlayer;
      const expectedTarget = player.currentTarget > 20 ? 25 : player.currentTarget;

      this.history.push({
        player,
        target: expectedTarget,
        hit: false,
        thrownAt: null
      });

      player.dartsLeft--;

      if (player.dartsLeft === 0) {
        this.nextPlayer();
      }
    },

    nextPlayer() {
      this.currentPlayer.dartsLeft = 3;
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.gamePlayers.length;
    },

    undo() {
      if (this.history.length === 0) return;

      const lastEntry = this.history.pop();
      const player = lastEntry.player;

      if (lastEntry.hit) {
        player.currentTarget--;
      }

      player.dartsLeft++;
      player.winner = false;
      this.gameFinished = false;
      this.showWinnerModal = false;
      this.winner = null;

      // Revenir au bon joueur
      if (player.dartsLeft > 3) {
        player.dartsLeft = 1;
      }
      this.currentPlayerIndex = this.gamePlayers.findIndex(p => p.id === player.id);
    },

    getPlayerDarts(player) {
      if (!player) return 0;
      return this.history.filter(e => e.player.id === player.id).length;
    },

    confirmReset() {
      this.showResetModal = true;
    },

    resetGame() {
      this.gamePlayers.forEach(player => {
        player.currentTarget = 1;
        player.dartsLeft = 3;
        player.winner = false;
      });
      this.currentPlayerIndex = 0;
      this.history = [];
      this.gameFinished = false;
      this.showResetModal = false;
      this.showWinnerModal = false;
      this.winner = null;
    },

    async sendVictory(winner) {
      try {
        const gameData = firebaseService.prepareGameData(winner, this.gamePlayers, this.history, 'Horloge');
        await firebaseService.sendGameVictory(gameData);
        console.log('Victoire Horloge envoyée vers Firebase !');
      } catch (error) {
        console.warn('Impossible d\'envoyer vers Firebase:', error.message);
      }
    }
  }
};
</script>