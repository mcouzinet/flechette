<template>
  <div class="chalk-grain"
    style="font-family: var(--font-ui); color: var(--chalk-cream); height: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column; background: radial-gradient(130% 90% at 50% -10%, #20322b, #142019 72%)">
    <!-- Cadre -->
    <div style="position: absolute; inset: 9px; border: 2px solid var(--chalk-line); border-radius: 12px; pointer-events: none; opacity: 0.5"></div>

    <GameHeader
      title="SHANGHAI"
      subtitle="20 rounds &middot; simple &middot; double &middot; triple"
      :is-fullscreen="isFullscreen"
      @back="$parent.currentComponent = null"
      @show-rules="showRulesModal = true"
      @toggle-fullscreen="toggleFullscreen"
      @confirm-reset="confirmReset" />

    <!-- Body -->
    <div class="flex-1 min-h-0 flex flex-col xl:grid gap-5 px-5 py-5 relative overflow-auto sh-body">

      <!-- Zone principale -->
      <section class="flex flex-col min-w-0 overflow-auto chalk-scroll gap-5">

        <!-- Cartes joueurs -->
        <div :class="[
          'grid gap-4 pt-4',
          'grid-cols-1 md:grid-cols-2',
          gamePlayers.length === 1 ? 'xl:grid-cols-1' :
          gamePlayers.length === 2 ? 'xl:grid-cols-2' :
          gamePlayers.length === 3 ? 'xl:grid-cols-3' :
          'xl:grid-cols-4'
        ]">
          <div
            v-for="(player, index) in gamePlayers"
            :key="player.id"
            class="relative rounded-[14px] p-5 transition-all duration-300"
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

            <!-- Badge joueur actuel -->
            <div v-if="currentPlayerIndex === index && !gameFinished"
              class="absolute -top-3 right-3 rounded-full px-3 py-0.5"
              style="font-family: var(--font-hand); font-weight: 700; font-size: 16px; background: var(--chalk-gold); color: var(--chalk-bg)">
              A JOUER
            </div>

            <!-- Badge gagnant -->
            <div v-if="player.winner"
              class="absolute -top-3 right-3 rounded-full px-3 py-0.5"
              style="font-family: var(--font-hand); font-weight: 700; font-size: 16px; background: var(--chalk-green); color: var(--chalk-bg)">
              &#9813; GAGNANT
            </div>

            <div class="text-center">
              <h3 class="text-lg xl:text-[26px] mb-3" style="font-family: var(--font-hand); font-weight: 700">
                {{ player.name }}
              </h3>

              <!-- Score total -->
              <div class="mb-3">
                <div class="text-4xl xl:text-[52px] leading-none mb-1" style="font-family: var(--font-display)">
                  {{ player.totalScore }}
                </div>
                <div class="text-[14px] uppercase tracking-wider" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">Score total</div>
              </div>

              <!-- Flechettes restantes -->
              <div class="flex justify-center gap-2 mb-3">
                <div
                  v-for="dart in 3"
                  :key="dart"
                  class="w-3.5 h-3.5 rounded-full transition-all duration-300"
                  :style="{
                    background: dart <= player.dartsLeft ? 'var(--chalk-gold)' : 'var(--chalk-line2)',
                    boxShadow: dart <= player.dartsLeft ? '0 0 6px rgba(236,198,106,0.4)' : 'none'
                  }">
                </div>
              </div>

              <!-- Indicateur Shanghai pour le round actuel -->
              <div v-if="currentRound <= 20" class="mb-1">
                <div class="text-[14px] mb-2" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">Shanghai Round {{ currentRound }}</div>
                <div class="flex justify-center gap-2">
                  <div class="w-3 h-3 rounded-full transition-all duration-300"
                    :style="{ background: player.roundHits[currentRound - 1]?.single ? 'var(--chalk-green)' : 'var(--chalk-line2)' }"
                    title="Simple"></div>
                  <div class="w-3 h-3 rounded-full transition-all duration-300"
                    :style="{ background: player.roundHits[currentRound - 1]?.double ? 'var(--chalk-gold)' : 'var(--chalk-line2)' }"
                    title="Double"></div>
                  <div class="w-3 h-3 rounded-full transition-all duration-300"
                    :style="{ background: player.roundHits[currentRound - 1]?.triple ? 'var(--chalk-red)' : 'var(--chalk-line2)' }"
                    title="Triple"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Controles de jeu -->
        <div class="rounded-[14px] p-6" style="border: 2px dashed var(--chalk-line)">
          <h3 class="text-lg xl:text-[24px] mb-4 text-center" style="font-family: var(--font-display); letter-spacing: 0.5px">
            ROUND {{ currentRound }}/20 &mdash; CIBLE : {{ currentRound }}
          </h3>
          <div v-if="currentPlayer" class="text-center mb-4">
            <div class="text-lg xl:text-[22px]" style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-gold)">{{ currentPlayer.name }}</div>
            <div class="text-[16px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">{{ currentPlayer.dartsLeft }} fl&eacute;chette{{ currentPlayer.dartsLeft > 1 ? 's' : '' }} restante{{ currentPlayer.dartsLeft > 1 ? 's' : '' }}</div>
          </div>

          <!-- Selecteur de type -->
          <div class="flex flex-wrap gap-3 justify-center">
            <button
              v-for="type in ['single', 'double', 'triple']"
              :key="type"
              @click="scoreType = type; selectTarget(); addScore()"
              class="sh-score-btn"
              :style="{
                color: type === 'single' ? 'var(--chalk-green)' : type === 'double' ? 'var(--chalk-gold)' : 'var(--chalk-red)',
                borderColor: type === 'single' ? 'var(--chalk-green)' : type === 'double' ? 'var(--chalk-gold)' : 'var(--chalk-red)'
              }">
              {{ type === 'single' ? 'Simple' : type === 'double' ? 'Double' : 'Triple' }}
            </button>

            <!-- Bouton Manque -->
            <button
              @click="selectMiss(); addScore()"
              class="sh-score-btn"
              style="color: var(--chalk-faint); border-color: var(--chalk-faint); border-style: dashed">
              Manqu&eacute;
            </button>
          </div>
        </div>
      </section>

      <!-- Panneau classement + historique -->
      <aside class="flex flex-col gap-3 min-h-0 xl:pl-5 pt-4 xl:pt-0 sh-sidebar">
        <div class="flex items-center justify-between">
          <span class="text-lg xl:text-[22px]" style="font-family: var(--font-display); letter-spacing: 0.5px">LE CLASSEMENT</span>
        </div>

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
              <span class="flex-1 text-lg xl:text-[24px]" style="font-family: var(--font-hand); font-weight: 600">{{ player.name }}</span>
              <span class="text-[34px] leading-none" style="font-family: var(--font-display)">{{ player.totalScore }}</span>
            </div>
            <div class="ml-6 mt-1">
              <div class="text-[17px] leading-tight" style="font-family: var(--font-hand); font-weight: 600">
                <span v-if="index === 0" style="color: var(--chalk-green)">Meneur &#10022;</span>
                <span v-else style="color: var(--chalk-gold)">{{ player.totalScore - sortedPlayers[0].totalScore }} pts de retard</span>
              </div>
            </div>
          </div>
        </div>

        <HistoryPanel :history="history" @undo="onUndo">
          <template #entry="{ entry, index, total }">
            <div class="flex items-center gap-3">
              <span class="flex-1 text-[16px]" style="font-family: var(--font-hand); font-weight: 600">
                <b>{{ entry.player.name }}</b>
                <span style="color: var(--chalk-faint2)"> &middot; R{{ entry.round }}</span>
              </span>
              <span class="text-[22px] leading-none min-w-[48px] h-[48px] flex items-center justify-center rounded-full"
                style="font-family: var(--font-display); border: 2px dashed var(--chalk-line)">
                {{ entry.score }}
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
      rules-title="R&Egrave;GLES DU SHANGHAI"
      :winner-name="winner?.name"
      :winner-subtitle="isShangaiWin ? 'SHANGHAI ! a remport&eacute; la partie !' : 'a remport&eacute; la partie !'"
      @close-rules="showRulesModal = false"
      @close-reset="showResetModal = false"
      @confirm-reset="resetGame"
      @close-winner="showWinnerModal = false"
      @new-game="resetGame">
      <template #rules-content>
        <p><span style="color: var(--chalk-cream)">But du jeu :</span> Marquer le plus de points en 20 rounds, ou r&eacute;aliser un Shanghai pour gagner instantan&eacute;ment.</p>
        <p><span style="color: var(--chalk-cream)">D&eacute;roulement :</span> Chaque round, on vise le num&eacute;ro du round (round 1 = cible 1, round 2 = cible 2, etc.).</p>
        <p><span style="color: var(--chalk-cream)">Scoring :</span> Simple = valeur du num&eacute;ro, Double = x2, Triple = x3. Manqu&eacute; = 0 point.</p>
        <p><span style="color: var(--chalk-cream)">Shanghai :</span> Toucher le simple + double + triple du m&ecirc;me num&eacute;ro dans un m&ecirc;me round = victoire imm&eacute;diate !</p>
        <p><span style="color: var(--chalk-cream)">Fin de partie :</span> Apr&egrave;s 20 rounds, le joueur avec le plus de points gagne (sauf Shanghai).</p>
      </template>
      <template #winner-stats>
        <div v-if="isShangaiWin" class="col-span-2 text-center mb-1">
          <div class="text-lg mb-1" style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-gold)">Shanghai au Round {{ shangaiRound }}</div>
          <div class="text-sm" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">Simple + Double + Triple du {{ shangaiRound }}</div>
        </div>
        <div class="col-span-2 text-center">
          <div class="text-2xl font-bold" style="color: var(--chalk-green)">{{ winner?.totalScore }}</div>
          <div class="text-sm" style="color: var(--chalk-faint2)">Points marqu&eacute;s au total</div>
        </div>
      </template>
    </GameModals>
  </div>
</template>

<style scoped>
.sh-score-btn {
  font-family: var(--font-hand); font-weight: 700; font-size: 24px;
  background: transparent; border: 2px solid; border-radius: 12px;
  padding: 10px 28px; cursor: pointer; line-height: 1.1;
  transition: background 0.2s;
}
.sh-score-btn:hover {
  background: rgba(241,230,203,0.05);
}
@media (min-width: 1280px) {
  .sh-body { grid-template-columns: 1fr 332px; }
  .sh-sidebar { border-left: 2px dashed var(--chalk-line); }
}
@media (max-width: 1279px) {
  .sh-sidebar { border-top: 2px dashed var(--chalk-line); }
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
  name: "Shanghai",
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
      currentRound: 1,
      selectedScore: null,
      scoreType: null,
      history: [],
      gameFinished: false,
      showResetModal: false,
      showRulesModal: false,
      showWinnerModal: false,
      winner: null,
      isShangaiWin: false,
      shangaiRound: null
    };
  },
  mounted() {
    this.initializePlayers();
  },
  computed: {
    currentPlayer() {
      return this.gamePlayers[this.currentPlayerIndex];
    },
    canAddScore() {
      if (this.gameFinished) return false;
      if (this.scoreType === null) return false;
      // Au Shanghai, on peut toujours marquer (touché ou manqué)
      return true;
    },
    sortedPlayers() {
      return [...this.gamePlayers].sort((a, b) => b.totalScore - a.totalScore);
    }
  },
  methods: {
    onUndo() { this.undoLastScore(); },

    initializePlayers() {
      this.gamePlayers = this.players.map(player => ({
        ...player,
        totalScore: 0,
        roundScores: new Array(20).fill(0), // 20 rounds (1-20)
        roundHits: new Array(20).fill().map(() => ({ single: false, double: false, triple: false })), // Track hits per round
        winner: false,
        dartsLeft: 3
      }));
    },


    selectScore(score) {
      this.selectedScore = score;
      if (score === 0) {
        this.scoreType = 'single';
      }
    },

    selectTarget() {
      // Au Shanghai, on vise toujours le numéro du round
      this.selectedScore = this.currentRound;
    },

    selectMiss() {
      // Sélectionner manqué sans affecter scoreType
      this.selectedScore = 0;
      this.scoreType = 'miss';
    },

    checkShanghai(player, roundIndex) {
      // Vérifier si le joueur a fait simple + double + triple du même chiffre
      const hits = player.roundHits[roundIndex];
      return hits.single && hits.double && hits.triple;
    },

    addScore() {
      if (!this.canAddScore) return;

      let actualScore = 0;

      // Au Shanghai, on vise toujours la cible du round
      if (this.scoreType === 'miss') {
        // Manqué
        actualScore = 0;
      } else {
        // Touché la cible du round
        actualScore = this.currentRound;
        if (this.scoreType === 'double') actualScore *= 2;
        if (this.scoreType === 'triple') actualScore *= 3;
      }

      // Enregistrer dans l'historique
      this.history.push({
        player: this.currentPlayer,
        round: this.currentRound,
        score: actualScore,
        type: this.scoreType
      });

      // Mettre à jour le score
      this.currentPlayer.roundScores[this.currentRound - 1] += actualScore;
      this.currentPlayer.totalScore += actualScore;
      this.currentPlayer.dartsLeft--;

      // Marquer le type de coup si ce n'est pas un manqué
      if (this.scoreType !== 'miss') {
        this.currentPlayer.roundHits[this.currentRound - 1][this.scoreType] = true;

        // Vérifier Shanghai (simple + double + triple du même chiffre)
        if (this.checkShanghai(this.currentPlayer, this.currentRound - 1)) {
          this.currentPlayer.winner = true;
          this.gameFinished = true;
          this.winner = this.currentPlayer;
          this.isShangaiWin = true;
          this.shangaiRound = this.currentRound;
          this.sendVictoryToNotion(this.currentPlayer);

          setTimeout(() => {
            this.showWinnerModal = true;
          }, 500);

          // Reset du score actuel avant de sortir
          this.selectedScore = null;
          this.scoreType = null;
          return;
        }
      }

      // Passer au joueur suivant ou fléchette suivante
      this.nextTurn();

      // Reset du score actuel
      this.selectedScore = null;
      this.scoreType = null;
    },

    nextTurn() {
      // Si le joueur n'a plus de fléchettes, passer au joueur suivant
      if (this.currentPlayer.dartsLeft === 0) {
        this.currentPlayer.dartsLeft = 3;
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.gamePlayers.length;

        // Si on revient au premier joueur, passer au round suivant
        if (this.currentPlayerIndex === 0) {
          this.currentRound++;

          // Vérifier la fin de partie (après 20 rounds)
          if (this.currentRound > 20) {
            this.checkWin();
          }
        }
      }
    },

    checkWin() {
      // Trouver le joueur avec le score le plus élevé
      const winner = this.sortedPlayers[0];

      this.gameFinished = true;
      this.winner = winner;
      winner.winner = true;
      this.sendVictoryToNotion(winner);

      setTimeout(() => {
        this.showWinnerModal = true;
      }, 500);
    },

    undoLastScore() {
      if (this.history.length === 0) return;

      const lastEntry = this.history.pop();

      // Retirer le score du joueur
      lastEntry.player.roundScores[lastEntry.round - 1] -= lastEntry.score;
      lastEntry.player.totalScore -= lastEntry.score;
      lastEntry.player.dartsLeft++;

      // Annuler le hit de Shanghai si ce n'était pas un manqué
      if (lastEntry.type !== 'miss') {
        lastEntry.player.roundHits[lastEntry.round - 1][lastEntry.type] = false;
      }

      // Revenir au joueur précédent
      this.currentPlayerIndex = this.gamePlayers.findIndex(p => p.id === lastEntry.player.id);
      this.currentRound = lastEntry.round;

      // Si le joueur a maintenant plus de 3 fléchettes, c'est qu'on doit revenir au joueur précédent
      if (lastEntry.player.dartsLeft > 3) {
        lastEntry.player.dartsLeft = 1;
        this.currentPlayerIndex = this.currentPlayerIndex === 0 ? this.gamePlayers.length - 1 : this.currentPlayerIndex - 1;
        if (this.currentPlayerIndex === this.gamePlayers.length - 1) {
          this.currentRound--;
        }
      }

      this.gameFinished = false;
      this.showWinnerModal = false;
      this.winner = null;
      this.isShangaiWin = false;
      this.shangaiRound = null;
      this.gamePlayers.forEach(p => p.winner = false);
    },

    confirmReset() {
      this.showResetModal = true;
    },

    resetGame() {
      this.gamePlayers.forEach(player => {
        player.totalScore = 0;
        player.roundScores = new Array(20).fill(0);
        player.roundHits = new Array(20).fill().map(() => ({ single: false, double: false, triple: false }));
        player.winner = false;
        player.dartsLeft = 3;
      });
      this.currentPlayerIndex = 0;
      this.currentRound = 1;
      this.history = [];
      this.gameFinished = false;
      this.selectedScore = null;
      this.scoreType = null;
      this.showResetModal = false;
      this.showWinnerModal = false;
      this.winner = null;
      this.isShangaiWin = false;
      this.shangaiRound = null;
    },

    async sendVictoryToNotion(winner) {
      try {
        const gameData = firebaseService.prepareGameData(winner, this.gamePlayers, this.history, 'Shanghai');
        await firebaseService.sendGameVictory(gameData);
        console.log('Victoire Shanghai envoyée vers Firebase avec succès !');
      } catch (error) {
        console.warn('Impossible d\'envoyer vers Firebase:', error.message);
      }
    }
  }
};
</script>