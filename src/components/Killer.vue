<template>
  <div class="chalk-grain"
    style="font-family: var(--font-ui); color: var(--chalk-cream); height: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column; background: radial-gradient(130% 90% at 50% -10%, #20322b, #142019 72%)">
    <!-- Cadre -->
    <div style="position: absolute; inset: 9px; border: 2px solid var(--chalk-line); border-radius: 12px; pointer-events: none; opacity: 0.5"></div>

    <GameHeader
      title="KILLER"
      subtitle="deviens killer, elimine les autres"
      subtitle-color="var(--chalk-red)"
      :is-fullscreen="isFullscreen"
      @back="$emit('exit')"
      @show-rules="showRulesModal = true"
      @toggle-fullscreen="toggleFullscreen"
      @confirm-reset="confirmReset" />

    <!-- Body -->
    <div class="flex-1 min-h-0 flex flex-col xl:grid gap-5 px-5 py-5 overflow-auto kl-body relative">

      <!-- Zone principale -->
      <section class="flex flex-col min-w-0 overflow-auto chalk-scroll">

        <!-- Phase d'attribution des numeros -->
        <div v-if="phase === 'setup'">
          <div class="text-xl xl:text-[26px] text-center mb-2" style="font-family: var(--font-display); letter-spacing: 0.5px">
            ATTRIBUTION DES NUMEROS
          </div>
          <p class="text-center mb-6 text-[19px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
            Chaque joueur lance une flechette pour obtenir son numero cible.
          </p>

          <div :class="[
            'grid gap-5 mb-6 pt-4',
            'grid-cols-1 md:grid-cols-2',
            gamePlayers.length <= 2 ? 'xl:grid-cols-2' :
            gamePlayers.length === 3 ? 'xl:grid-cols-3' :
            'xl:grid-cols-4'
          ]">
            <div
              v-for="(player, index) in gamePlayers"
              :key="player.id"
              class="relative rounded-[14px] p-5 transition-all duration-300"
              :style="{
                border: setupPlayerIndex === index && !player.number
                  ? '2px solid var(--chalk-gold)'
                  : player.number
                    ? '2px solid var(--chalk-green)'
                    : '2px dashed var(--chalk-line)',
                background: setupPlayerIndex === index && !player.number
                  ? 'rgba(236,198,106,0.07)'
                  : player.number
                    ? 'rgba(134,199,160,0.07)'
                    : 'transparent'
              }">

              <div v-if="setupPlayerIndex === index && !player.number"
                   class="absolute -top-3 right-3 px-3 py-1 rounded-full text-[15px]"
                   style="font-family: var(--font-hand); font-weight: 700; background: var(--chalk-gold); color: var(--chalk-bg)">
                A LANCER
              </div>

              <div class="text-center">
                <h3 class="text-lg xl:text-[26px] mb-3" style="font-family: var(--font-hand); font-weight: 700">{{ player.name }}</h3>
                <div v-if="player.number" class="text-4xl xl:text-[48px] leading-none" style="font-family: var(--font-display); color: var(--chalk-green)">
                  {{ player.number }}
                </div>
                <div v-else class="text-4xl xl:text-[48px] leading-none" style="font-family: var(--font-display); color: var(--chalk-faint2)">?</div>
              </div>
            </div>
          </div>

          <!-- Selecteur de numero pour le setup -->
          <div v-if="setupPlayerIndex < gamePlayers.length"
               class="rounded-[14px] p-5"
               style="border: 2px dashed var(--chalk-line); background: rgba(241,230,203,0.03)">
            <div class="text-center mb-3 xl:mb-4">
              <div class="text-sm xl:text-base" style="font-family: var(--font-display); letter-spacing: 0.5px; color: var(--chalk-faint)">Choisir le numero touche</div>
              <div class="text-3xl xl:text-4xl mt-1" style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-cream)">{{ gamePlayers[setupPlayerIndex].name }}</div>
            </div>
            <div class="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
              <button
                v-for="n in 20"
                :key="n"
                @click="assignNumber(n)"
                :disabled="isNumberTaken(n)"
                class="killer-num-btn"
                :style="{
                  opacity: isNumberTaken(n) ? '0.25' : '1',
                  cursor: isNumberTaken(n) ? 'not-allowed' : 'pointer',
                  borderColor: isNumberTaken(n) ? 'var(--chalk-line2)' : 'var(--chalk-line)',
                  color: isNumberTaken(n) ? 'var(--chalk-faint2)' : 'var(--chalk-cream)'
                }">
                {{ n }}
              </button>
            </div>
          </div>
        </div>

        <!-- Phase de jeu -->
        <div v-else class="flex flex-col flex-1">
          <!-- Cartes joueurs -->
          <div :class="[
            'grid gap-5 mb-6 pt-4',
            'grid-cols-1 md:grid-cols-2',
            alivePlayers.length <= 2 ? 'xl:grid-cols-2' :
            alivePlayers.length === 3 ? 'xl:grid-cols-3' :
            'xl:grid-cols-4'
          ]">
            <div
              v-for="(player, index) in gamePlayers"
              :key="player.id"
              class="relative rounded-[14px] p-5 transition-all duration-300"
              :style="{
                border: player.winner
                  ? '2px solid var(--chalk-gold)'
                  : player.eliminated
                    ? '2px dashed var(--chalk-red)'
                    : currentPlayerIndex === index && !gameFinished
                      ? '2px solid var(--chalk-gold)'
                      : player.isKiller
                        ? '2px solid var(--chalk-red)'
                        : '2px dashed var(--chalk-line)',
                background: player.winner
                  ? 'rgba(236,198,106,0.1)'
                  : player.eliminated
                    ? 'rgba(239,139,111,0.05)'
                    : currentPlayerIndex === index && !gameFinished
                      ? 'rgba(236,198,106,0.07)'
                      : player.isKiller
                        ? 'rgba(239,139,111,0.07)'
                        : 'transparent',
                opacity: player.eliminated ? '0.5' : '1'
              }">

              <!-- Badges -->
              <div v-if="currentPlayerIndex === index && !gameFinished && !player.eliminated"
                   class="absolute -top-3 right-3 px-3 py-1 rounded-full text-[15px]"
                   style="font-family: var(--font-hand); font-weight: 700; background: var(--chalk-gold); color: var(--chalk-bg)">
                A JOUER
              </div>
              <div v-if="player.eliminated"
                   class="absolute -top-3 right-3 px-3 py-1 rounded-full text-[15px]"
                   style="font-family: var(--font-hand); font-weight: 700; background: var(--chalk-red); color: var(--chalk-bg)">
                ELIMINE
              </div>
              <div v-if="player.winner"
                   class="absolute -top-3 right-3 px-3 py-1 rounded-full text-[15px]"
                   style="font-family: var(--font-hand); font-weight: 700; background: var(--chalk-gold); color: var(--chalk-bg)">
                GAGNANT
              </div>

              <div class="text-center">
                <h3 :class="['text-lg xl:text-[26px] mb-1', player.eliminated ? 'line-through' : '']"
                    :style="{ fontFamily: 'var(--font-hand)', fontWeight: 700, color: player.eliminated ? 'var(--chalk-faint2)' : 'var(--chalk-cream)' }">
                  {{ player.name }}
                </h3>
                <div class="text-[15px] mb-3" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">
                  Numero : {{ player.number }}
                </div>

                <!-- Statut Killer -->
                <div v-if="!player.eliminated" class="mb-3">
                  <span v-if="player.isKiller"
                        class="inline-block px-3 py-1 rounded-full text-[17px]"
                        style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-red); border: 2px solid var(--chalk-red); background: rgba(239,139,111,0.1)">
                    KILLER
                  </span>
                  <span v-else
                        class="inline-block px-3 py-1 rounded-full text-[17px]"
                        style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2); border: 2px dashed var(--chalk-line2)">
                    En attente
                  </span>
                </div>

                <!-- Vies -->
                <div class="flex justify-center gap-2 mb-2">
                  <span
                    v-for="life in 3"
                    :key="life"
                    class="text-[20px]"
                    :style="{ color: life <= player.lives ? 'var(--chalk-red)' : 'var(--chalk-line2)' }">
                    &#10084;
                  </span>
                </div>

                <!-- Flechettes restantes -->
                <div v-if="currentPlayerIndex === index && !player.eliminated && !gameFinished" class="flex justify-center gap-1.5 xl:gap-2 mt-3">
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
          <div v-if="!gameFinished" class="rounded-[14px] p-5 mt-auto"
               style="border: 2px dashed var(--chalk-line); background: rgba(241,230,203,0.03)">
            <div class="text-center mb-3 xl:mb-4">
              <div class="text-sm xl:text-base" style="font-family: var(--font-display); letter-spacing: 0.5px; color: var(--chalk-faint)">
                <span v-if="!currentPlayer?.isKiller">Viser le <span style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-gold); font-size: 2.5em; vertical-align: middle">D{{ currentPlayer?.number }}</span></span>
                <span v-else style="color: var(--chalk-red)">KILLER : eliminer les autres !</span>
              </div>
              <div class="text-3xl xl:text-4xl mt-1" style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-cream)">{{ currentPlayer?.name }}</div>
              <div class="flex gap-1.5 justify-center mt-2">
                <div v-for="dart in 3" :key="dart"
                  class="w-2.5 h-2.5 xl:w-3.5 xl:h-3.5 rounded-full"
                  :style="{ background: dart <= (currentPlayer?.dartsLeft || 0) ? 'var(--chalk-gold)' : 'var(--chalk-line2)' }">
                </div>
              </div>
            </div>

            <!-- Si pas encore killer : bouton pour devenir killer -->
            <div v-if="!currentPlayer?.isKiller" class="grid grid-cols-2 gap-2 xl:flex xl:flex-wrap xl:gap-3 xl:justify-center">
              <button @click="becomeKiller" class="kl-action-btn"
                style="color: var(--chalk-red); border-color: var(--chalk-red)">
                Double {{ currentPlayer?.number }} touche !
              </button>
              <button @click="missDart" class="kl-action-btn"
                style="color: var(--chalk-faint); border-color: var(--chalk-faint); border-style: dashed">
                Manqu&eacute;
              </button>
            </div>

            <!-- Si killer : choisir la cible -->
            <div v-else>
              <p class="text-center mb-4 text-[18px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
                Quel joueur visez-vous ?
              </p>
              <div class="grid grid-cols-2 gap-2 mb-4 xl:flex xl:flex-wrap xl:gap-3 xl:justify-center">
                <button
                  v-for="target in targetablePlayers"
                  :key="target.id"
                  @click="attackPlayer(target)"
                  class="kl-action-btn"
                  style="color: var(--chalk-red); border-color: var(--chalk-red)">
                  {{ target.name }} (D{{ target.number }})
                </button>
              </div>
              <div class="flex justify-center">
                <button @click="missDart" class="kl-action-btn"
                  style="color: var(--chalk-faint); border-color: var(--chalk-faint); border-style: dashed">
                  Manqu&eacute;
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Panneau classement + historique -->
      <aside class="flex flex-col gap-3 min-h-0 xl:pl-5 pt-4 xl:pt-0 kl-sidebar">
        <div class="text-lg xl:text-[22px]" style="font-family: var(--font-display); letter-spacing: 0.5px">LE CLASSEMENT</div>

        <div class="flex flex-col gap-3">
          <div
            v-for="(player, index) in rankedPlayers"
            :key="player.id"
            class="relative rounded-[14px] p-3"
            :style="{
              border: player.eliminated
                ? '2px dashed var(--chalk-red)'
                : index === 0
                  ? '2px solid var(--chalk-gold)'
                  : '2px dashed var(--chalk-line)',
              background: player.eliminated
                ? 'rgba(239,139,111,0.05)'
                : index === 0
                  ? 'rgba(236,198,106,0.07)'
                  : 'transparent',
              opacity: player.eliminated ? '0.5' : '1'
            }">
            <div class="flex items-center justify-between gap-2">
              <span :class="['text-lg xl:text-[24px]', player.eliminated ? 'line-through' : '']"
                    :style="{ fontFamily: 'var(--font-hand)', fontWeight: 700, color: player.eliminated ? 'var(--chalk-faint2)' : 'var(--chalk-cream)' }">
                {{ player.name }}
              </span>
              <div class="flex gap-1">
                <span
                  v-for="life in 3"
                  :key="life"
                  class="text-[14px]"
                  :style="{ color: life <= player.lives ? 'var(--chalk-red)' : 'var(--chalk-line2)' }">
                  &#10084;
                </span>
              </div>
            </div>
            <div class="flex justify-between items-end mt-1 text-[15px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">
              <span>N&#176;{{ player.number }} <span v-if="player.isKiller" style="color: var(--chalk-red)">- KILLER</span></span>
              <span v-if="player.eliminated" style="color: var(--chalk-red)">Elimine</span>
            </div>
          </div>
        </div>

        <!-- Historique -->
        <HistoryPanel :history="history" @undo="onUndo">
          <template #entry="{ entry, index, total }">
            <span class="flex items-center justify-between gap-2 text-sm">
              <span style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-gold)">
                {{ entry.player.name }}
                <span class="text-[13px]" style="color: var(--chalk-faint2)">#{{ total - index }}</span>
              </span>
              <span class="text-[15px] px-2 py-0.5 rounded-full"
                    :style="{
                      fontFamily: 'var(--font-hand)', fontWeight: 600,
                      color: entry.action === 'miss' ? 'var(--chalk-faint2)'
                           : entry.action === 'killer' ? 'var(--chalk-red)'
                           : 'var(--chalk-gold)',
                      border: entry.action === 'miss' ? '1.5px dashed var(--chalk-line2)'
                            : entry.action === 'killer' ? '1.5px solid var(--chalk-red)'
                            : '1.5px solid var(--chalk-gold)',
                      background: entry.action === 'miss' ? 'transparent'
                               : entry.action === 'killer' ? 'rgba(239,139,111,0.1)'
                               : 'rgba(236,198,106,0.1)'
                    }">
                {{ entry.action === 'miss' ? 'Manque' : entry.action === 'killer' ? 'KILLER !' : 'Hit ' + entry.target?.name }}
              </span>
            </span>
          </template>
        </HistoryPanel>
      </aside>
    </div>

    <GameModals
      :show-rules="showRulesModal"
      :show-reset="showResetModal"
      :show-winner="showWinnerModal"
      rules-title="RÈGLES DU KILLER"
      :winner-name="winner?.name"
      winner-subtitle="est le dernier survivant !"
      @close-rules="showRulesModal = false"
      @close-reset="showResetModal = false"
      @confirm-reset="resetGame"
      @close-winner="showWinnerModal = false"
      @new-game="resetGame">
      <template #rules-content>
        <p><span style="color: var(--chalk-cream)">But du jeu :</span> Être le dernier joueur en vie. Chaque joueur a 3 vies.</p>
        <p><span style="color: var(--chalk-cream)">Phase 1 - Attribution :</span> Chaque joueur lance une fléchette pour obtenir son numéro cible.</p>
        <p><span style="color: var(--chalk-cream)">Phase 2 - Devenir Killer :</span> Touche le double de ton numéro pour devenir "Killer".</p>
        <p><span style="color: var(--chalk-cream)">Phase 3 - Élimination :</span> Une fois Killer, touche le double des autres joueurs pour leur retirer une vie.</p>
        <p><span style="color: var(--chalk-cream)">Victoire :</span> Le dernier joueur avec des vies restantes gagne.</p>
        <p><span style="color: var(--chalk-cream)">3 fléchettes par tour.</span></p>
      </template>
      <template #winner-stats>
        <div>
          <div class="text-2xl" style="font-family: var(--font-display); color: var(--chalk-green)">{{ winner?.lives }}/3</div>
          <div class="text-sm" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">Vies restantes</div>
        </div>
        <div>
          <div class="text-2xl" style="font-family: var(--font-display); color: var(--chalk-green)">{{ getPlayerKills(winner) }}</div>
          <div class="text-sm" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">Eliminations</div>
        </div>
      </template>
    </GameModals>
  </div>
</template>

<style scoped>
.killer-num-btn {
  font-family: var(--font-display); font-size: 22px;
  background: transparent; border: 2px dashed var(--chalk-line);
  border-radius: 14px; padding: 16px 0; cursor: pointer;
  color: var(--chalk-cream); transition: all 0.2s;
}
.killer-num-btn:not(:disabled):hover {
  border-color: var(--chalk-gold);
  background: rgba(236,198,106,0.08);
  color: var(--chalk-gold);
}
.kl-action-btn {
  font-family: var(--font-display); letter-spacing: 0.5px; font-size: 22px;
  background: transparent; border: 2px solid; border-radius: 14px;
  padding: 16px 0; cursor: pointer; line-height: 1.1;
  transition: all 0.2s;
}
.kl-action-btn:hover {
  background: rgba(241,230,203,0.06);
}
@media (min-width: 1280px) {
  .kl-body { grid-template-columns: 1fr 332px; }
  .kl-sidebar { border-left: 2px dashed var(--chalk-line); }
}
@media (max-width: 1279px) {
  .kl-sidebar { border-top: 2px dashed var(--chalk-line); }
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
  name: "Killer",
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
      setupPlayerIndex: 0,
      phase: 'setup', // 'setup' ou 'game'
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
    alivePlayers() {
      return this.gamePlayers.filter(p => !p.eliminated);
    },
    targetablePlayers() {
      return this.gamePlayers.filter(p => !p.eliminated && p.id !== this.currentPlayer?.id);
    },
    rankedPlayers() {
      return [...this.gamePlayers].sort((a, b) => {
        if (a.eliminated && !b.eliminated) return 1;
        if (!a.eliminated && b.eliminated) return -1;
        return b.lives - a.lives;
      });
    }
  },
  methods: {
    onUndo() { this.undo(); },

    initializePlayers() {
      this.gamePlayers = this.players.map(player => ({
        ...player,
        number: null,
        lives: 3,
        isKiller: false,
        eliminated: false,
        dartsLeft: 3,
        winner: false
      }));
    },

    isNumberTaken(n) {
      return this.gamePlayers.some(p => p.number === n);
    },

    assignNumber(n) {
      const player = this.gamePlayers[this.setupPlayerIndex];
      player.number = n;
      // L'attribution entre dans l'historique : une erreur de numéro était
      // jusqu'ici irrécupérable, il fallait relancer la partie.
      this.history.push({ player, action: 'assign', number: n });
      this.setupPlayerIndex++;

      if (this.setupPlayerIndex >= this.gamePlayers.length) {
        this.phase = 'game';
      }
    },

    becomeKiller() {
      if (this.gameFinished) return;

      const player = this.currentPlayer;
      player.isKiller = true;

      this.history.push({
        player,
        action: 'killer',
        target: null,
        previousLives: null,
        previousKiller: false
      });

      player.dartsLeft--;
      if (player.dartsLeft === 0) {
        this.nextPlayer();
      }
    },

    attackPlayer(target) {
      if (this.gameFinished) return;

      const player = this.currentPlayer;
      const previousLives = target.lives;
      target.lives--;

      this.history.push({
        player,
        action: 'attack',
        target,
        previousLives,
        previousKiller: player.isKiller,
        wasEliminated: false
      });

      if (target.lives <= 0) {
        target.eliminated = true;
        this.history[this.history.length - 1].wasEliminated = true;
      }

      player.dartsLeft--;

      // Vérifier victoire
      if (this.alivePlayers.length === 1) {
        const winner = this.alivePlayers[0];
        winner.winner = true;
        this.gameFinished = true;
        this.winner = winner;
        this.sendVictory(winner);
        setTimeout(() => {
          this.showWinnerModal = true;
        }, 500);
        return;
      }

      if (player.dartsLeft === 0) {
        this.nextPlayer();
      }
    },

    missDart() {
      if (this.gameFinished) return;

      const player = this.currentPlayer;

      this.history.push({
        player,
        action: 'miss',
        target: null,
        previousLives: null,
        previousKiller: player.isKiller
      });

      player.dartsLeft--;
      if (player.dartsLeft === 0) {
        this.nextPlayer();
      }
    },

    nextPlayer() {
      this.currentPlayer.dartsLeft = 3;
      let nextIndex = (this.currentPlayerIndex + 1) % this.gamePlayers.length;

      // Sauter les joueurs éliminés
      while (this.gamePlayers[nextIndex].eliminated && !this.gameFinished) {
        nextIndex = (nextIndex + 1) % this.gamePlayers.length;
      }

      this.currentPlayerIndex = nextIndex;
    },

    undo() {
      if (this.history.length === 0) return;

      const lastEntry = this.history.pop();
      const player = lastEntry.player;

      // Défaire une attribution : le joueur repasse en attente et son numéro
      // redevient disponible.
      if (lastEntry.action === 'assign') {
        player.number = null;
        this.setupPlayerIndex = this.gamePlayers.findIndex(p => p.id === player.id);
        this.phase = 'setup';
        return;
      }

      if (lastEntry.action === 'killer') {
        player.isKiller = false;
      } else if (lastEntry.action === 'attack') {
        lastEntry.target.lives = lastEntry.previousLives;
        if (lastEntry.wasEliminated) {
          lastEntry.target.eliminated = false;
        }
      }

      player.dartsLeft++;
      if (player.dartsLeft > 3) {
        player.dartsLeft = 1;
      }

      player.winner = false;
      this.gameFinished = false;
      this.showWinnerModal = false;
      this.winner = null;
      this.gamePlayers.forEach(p => { if (!p.eliminated || p === lastEntry.target) p.winner = false; });

      this.currentPlayerIndex = this.gamePlayers.findIndex(p => p.id === player.id);
    },

    getPlayerKills(player) {
      if (!player) return 0;
      return this.history.filter(e => e.action === 'attack' && e.player.id === player.id && e.wasEliminated).length;
    },

    confirmReset() {
      this.showResetModal = true;
    },

    resetGame() {
      this.gamePlayers.forEach(player => {
        player.number = null;
        player.lives = 3;
        player.isKiller = false;
        player.eliminated = false;
        player.dartsLeft = 3;
        player.winner = false;
      });
      this.currentPlayerIndex = 0;
      this.setupPlayerIndex = 0;
      this.phase = 'setup';
      this.history = [];
      this.gameFinished = false;
      this.showResetModal = false;
      this.showWinnerModal = false;
      this.winner = null;
    },

    async sendVictory(winner) {
      try {
        const gameData = firebaseService.prepareGameData(winner, this.gamePlayers, this.history, 'Killer');
        await firebaseService.sendGameVictory(gameData);
        console.log('Victoire Killer envoyée vers Firebase !');
      } catch (error) {
        console.warn('Impossible d\'envoyer vers Firebase:', error.message);
      }
    }
  }
};
</script>
