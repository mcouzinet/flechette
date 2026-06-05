<template>
  <div class="chalk-grain"
    style="font-family: var(--font-ui); color: var(--chalk-cream); height: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column; background: radial-gradient(130% 90% at 50% -10%, #20322b, #142019 72%)">
    <!-- Cadre -->
    <div style="position: absolute; inset: 9px; border: 2px solid var(--chalk-line); border-radius: 12px; pointer-events: none; opacity: 0.5"></div>

    <GameHeader
      title="HALVE-IT"
      :is-fullscreen="isFullscreen"
      @back="$parent.currentComponent = null"
      @show-rules="showRulesModal = true"
      @toggle-fullscreen="toggleFullscreen"
      @confirm-reset="confirmReset" />

    <!-- Body -->
    <div class="hi-body flex-1 min-h-0 flex flex-col xl:flex-row gap-5 px-5 py-5 relative">

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
              <div class="text-4xl xl:text-[52px] leading-none mb-1" style="font-family: var(--font-display)">{{ player.score }}</div>
              <div class="text-[13px] uppercase tracking-wider" style="color: var(--chalk-faint2)">Points</div>

              <!-- Flechettes restantes -->
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
        <div v-if="!gameFinished" class="rounded-[14px] p-5 mb-5" style="border: 2px dashed var(--chalk-line); background: transparent">
          <h3 class="text-lg xl:text-[22px] mb-1 text-center" style="font-family: var(--font-display); letter-spacing: 0.5px">
            Round {{ currentRound + 1 }}/{{ rounds.length }} - Cible : {{ currentTarget.label }}
          </h3>
          <div class="text-center mb-5" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
            {{ currentPlayer?.name }} - {{ currentPlayer?.dartsLeft }} flechette{{ currentPlayer?.dartsLeft > 1 ? 's' : '' }} restante{{ currentPlayer?.dartsLeft > 1 ? 's' : '' }}
          </div>

          <!-- Boutons de score -->
          <div class="flex flex-wrap gap-3 justify-center">
            <button
              v-if="currentTarget.type === 'number'"
              @click="hitTarget(currentTarget.value)"
              class="chalk-btn-green">
              {{ currentTarget.value }} touche !
            </button>

            <button
              v-if="currentTarget.type === 'double'"
              @click="hitTarget(currentTarget.value * 2)"
              class="chalk-btn-gold">
              Double {{ currentTarget.value }} touche !
            </button>

            <button
              v-if="currentTarget.type === 'triple'"
              @click="hitTarget(currentTarget.value * 3)"
              class="chalk-btn-red">
              Triple {{ currentTarget.value }} touche !
            </button>

            <button
              v-if="currentTarget.type === 'bull'"
              @click="hitTarget(25)"
              class="chalk-btn-green">
              Simple bulle (25)
            </button>
            <button
              v-if="currentTarget.type === 'bull'"
              @click="hitTarget(50)"
              class="chalk-btn-gold">
              Double bulle (50)
            </button>

            <button
              @click="miss()"
              class="chalk-btn-ghost">
              Manque
            </button>
          </div>
        </div>

        <!-- Tableau des rounds -->
        <div class="overflow-x-auto mt-auto chalk-scroll">
          <table class="w-full text-sm min-w-[400px]" style="border-collapse: separate; border-spacing: 0">
            <thead>
              <tr style="border-bottom: 2px dashed var(--chalk-line)">
                <th class="text-left p-2 whitespace-nowrap" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">Round</th>
                <th v-for="player in gamePlayers" :key="player.id" class="text-center p-2 whitespace-nowrap" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">{{ player.name }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(round, rIdx) in rounds" :key="rIdx"
                  style="border-bottom: 1.5px dashed var(--chalk-line2)"
                  :class="rIdx === currentRound && !gameFinished ? '' : ''"
                  >
                <td class="p-2" :style="{
                  fontFamily: 'var(--font-hand)', fontWeight: 600,
                  color: rIdx === currentRound && !gameFinished ? 'var(--chalk-gold)' : 'var(--chalk-faint)'
                }">{{ round.label }}</td>
                <td v-for="player in gamePlayers" :key="player.id" class="text-center p-2">
                  <span v-if="player.roundScores[rIdx] !== undefined"
                        :style="{ fontFamily: 'var(--font-hand)', fontWeight: 600, color: player.roundHalved[rIdx] ? 'var(--chalk-red)' : 'var(--chalk-green)' }">
                    {{ player.roundHalved[rIdx] ? '÷2' : '+' + player.roundScores[rIdx] }}
                  </span>
                  <span v-else style="color: var(--chalk-line2)">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Panneau classement + historique -->
      <aside class="hi-sidebar flex flex-col gap-3 min-h-0 xl:pl-5">
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
              <span class="text-[34px] leading-none" style="font-family: var(--font-display)">{{ player.score }}</span>
            </div>
            <div class="mt-1 text-[17px]" style="font-family: var(--font-hand); font-weight: 600">
              <span v-if="index === 0" style="color: var(--chalk-green)">Leader</span>
              <span v-else style="color: var(--chalk-faint2)">{{ player.score - sortedPlayers[0].score }} pts</span>
            </div>
          </div>
        </div>

        <!-- Historique -->
        <HistoryPanel :history="history" @undo="onUndo">
          <template #entry="{ entry, index, total }">
            <div class="flex items-center justify-between gap-2">
              <div style="font-family: var(--font-hand); font-weight: 600; font-size: 15px">
                <span style="color: var(--chalk-cream)">{{ entry.player.name }}</span>
                <div style="color: var(--chalk-faint2); font-size: 13px">R{{ entry.round + 1 }} - #{{ total - index }}</div>
              </div>
              <span class="text-sm px-3 py-0.5 rounded-full"
                :style="{
                  fontFamily: 'var(--font-hand)', fontWeight: 600,
                  color: entry.hit ? 'var(--chalk-green)' : 'var(--chalk-red)',
                  background: entry.hit ? 'rgba(134,199,160,0.12)' : 'rgba(239,139,111,0.12)'
                }">
                {{ entry.hit ? '+' + entry.score : 'Manque' }}
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
      rules-title="RÈGLES DU HALVE-IT"
      :winner-name="winner?.name"
      winner-subtitle="remporte le Halve-It !"
      @close-rules="showRulesModal = false"
      @close-reset="showResetModal = false"
      @confirm-reset="resetGame"
      @close-winner="showWinnerModal = false"
      @new-game="resetGame">
      <template #rules-content>
        <p><span style="color: var(--chalk-cream)">But du jeu :</span> Avoir le meilleur score après 9 rounds de cibles imposées.</p>
        <p><span style="color: var(--chalk-cream)">Déroulement :</span> Chaque round a une cible spécifique (numéro, double ou triple).</p>
        <p><span style="color: var(--chalk-cream)">Scoring :</span> 3 fléchettes par round. Chaque touche ajoute la valeur au score.</p>
        <p><span style="color: var(--chalk-cream)">Halve-It :</span> Si tu ne touches aucune cible valide dans un round, ton score est divisé par 2 !</p>
        <p><span style="color: var(--chalk-cream)">Victoire :</span> Après 9 rounds, le joueur avec le plus de points gagne.</p>
        <p><span style="color: var(--chalk-cream)">Stratégie :</span> Mieux vaut toucher au moins une fois pour éviter la division.</p>
      </template>
      <template #winner-stats>
        <div>
          <div class="text-2xl" style="font-family: var(--font-display); color: var(--chalk-green)">{{ winner?.score }} points</div>
          <div class="text-sm mt-1" style="color: var(--chalk-faint2)">Score final</div>
        </div>
      </template>
    </GameModals>
  </div>
</template>

<style scoped>
.chalk-btn-gold { font-family: var(--font-hand); font-weight: 600; font-size: 16px; color: var(--chalk-gold); background: transparent; border: 2px solid var(--chalk-gold); border-radius: 12px; padding: 5px 18px; cursor: pointer; line-height: 1.1; white-space: nowrap; }
@media (min-width: 1280px) {
  .chalk-btn-gold { font-size: 21px; }
  .hi-sidebar { border-left: 2px dashed var(--chalk-line); width: 332px; flex-shrink: 0; }
}
@media (max-width: 1279px) {
  .hi-sidebar { border-top: 2px dashed var(--chalk-line); width: 100%; padding-top: 1.25rem; }
  .hi-body { overflow-y: auto; }
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
  name: "HalveIt",
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
      currentRound: 0,
      rounds: [
        { label: '19', type: 'number', value: 19 },
        { label: 'Double 18', type: 'double', value: 18 },
        { label: 'Triple 17', type: 'triple', value: 17 },
        { label: '20', type: 'number', value: 20 },
        { label: 'Bulle', type: 'bull', value: 25 },
        { label: 'Triple 15', type: 'triple', value: 15 },
        { label: 'Double 16', type: 'double', value: 16 },
        { label: '14', type: 'number', value: 14 },
        { label: 'Double 20', type: 'double', value: 20 }
      ],
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
    currentPlayer() {
      return this.gamePlayers[this.currentPlayerIndex];
    },
    currentTarget() {
      return this.rounds[this.currentRound];
    },
    sortedPlayers() {
      return [...this.gamePlayers].sort((a, b) => b.score - a.score);
    }
  },
  methods: {
    onUndo() { this.undo(); },

    initializePlayers() {
      this.gamePlayers = this.players.map(player => ({
        ...player,
        score: 0,
        dartsLeft: 3,
        roundScores: {},
        roundHalved: {},
        roundHits: {},
        winner: false
      }));
    },

    hitTarget(score) {
      if (this.gameFinished) return;

      const player = this.currentPlayer;
      if (!player.roundHits[this.currentRound]) player.roundHits[this.currentRound] = 0;
      player.roundHits[this.currentRound] += score;
      player.score += score;

      this.history.push({
        player,
        round: this.currentRound,
        hit: true,
        score,
        previousScore: player.score - score
      });

      player.dartsLeft--;
      if (player.dartsLeft === 0) this.endTurn();
    },

    miss() {
      if (this.gameFinished) return;

      const player = this.currentPlayer;

      this.history.push({
        player,
        round: this.currentRound,
        hit: false,
        score: 0,
        previousScore: player.score
      });

      player.dartsLeft--;
      if (player.dartsLeft === 0) this.endTurn();
    },

    endTurn() {
      const player = this.currentPlayer;
      const roundHits = player.roundHits[this.currentRound] || 0;

      if (roundHits === 0 && player.score > 0) {
        // Aucun touché ce round : score divisé par 2
        const halvedAmount = Math.floor(player.score / 2);
        player.roundHalved[this.currentRound] = true;
        player.roundScores[this.currentRound] = 0;
        player.score = halvedAmount;

        this.history.push({
          player,
          round: this.currentRound,
          hit: false,
          score: 0,
          halved: true,
          halvedTo: halvedAmount,
          previousScore: halvedAmount * 2
        });
      } else {
        player.roundHalved[this.currentRound] = false;
        player.roundScores[this.currentRound] = roundHits;
      }

      player.dartsLeft = 3;
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.gamePlayers.length;

      if (this.currentPlayerIndex === 0) {
        this.currentRound++;
        if (this.currentRound >= this.rounds.length) {
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

      // Si c'est un halve, on le undo
      if (lastEntry.halved) {
        lastEntry.player.score = lastEntry.previousScore;
        delete lastEntry.player.roundHalved[lastEntry.round];
        delete lastEntry.player.roundScores[lastEntry.round];
        return;
      }

      const player = lastEntry.player;
      player.score = lastEntry.previousScore;
      player.dartsLeft++;

      if (player.dartsLeft > 3) player.dartsLeft = 1;

      if (lastEntry.hit) {
        player.roundHits[lastEntry.round] = (player.roundHits[lastEntry.round] || 0) - lastEntry.score;
      }

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
        p.score = 0;
        p.dartsLeft = 3;
        p.roundScores = {};
        p.roundHalved = {};
        p.roundHits = {};
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
        const gameData = firebaseService.prepareGameData(winner, this.gamePlayers, this.history, 'Halve-It');
        await firebaseService.sendGameVictory(gameData);
      } catch (error) {
        console.warn('Impossible d\'envoyer vers Firebase:', error.message);
      }
    }
  }
};
</script>
