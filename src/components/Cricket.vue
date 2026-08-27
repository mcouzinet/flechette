<template>
  <div class="chalk-grain ck-root"
    style="font-family: var(--font-ui); color: var(--chalk-cream); height: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column; background: radial-gradient(130% 90% at 50% -10%, #20322b, #142019 72%)">
    <!-- Cadre -->
    <div style="position: absolute; inset: 9px; border: 2px solid var(--chalk-line); border-radius: 12px; pointer-events: none; opacity: 0.5"></div>

    <GameHeader
      title="CRICKET"
      :subtitle="bullModeSubtitle"
      :is-fullscreen="isFullscreen"
      @back="$emit('exit')"
      @show-rules="showRulesModal = true"
      @toggle-fullscreen="toggleFullscreen"
      @confirm-reset="confirmReset">
      <template #title-extra>
        <select v-model="bullMode" @change="changeBullMode" class="ck-select">
          <option value="3">3 bulles</option>
          <option value="1">1 bulle</option>
          <option value="0">Sans bulle</option>
        </select>
      </template>
    </GameHeader>

    <!-- Body -->
    <div class="flex-1 min-h-0 flex flex-col xl:grid gap-5 px-4 xl:px-5 py-4 xl:py-5 relative overflow-auto ck-body">

      <!-- Ardoise de score -->
      <section class="flex flex-col min-w-0 chalk-scroll">

        <!-- VERSION MOBILE : zones en lignes, joueurs en colonnes -->
        <div class="xl:hidden">
          <div class="grid" :style="{ gridTemplateColumns: `80px repeat(${participants.length}, 1fr)`, columnGap: '4px' }">
            <!-- Header : vide + noms joueurs -->
            <div></div>
            <div v-for="(participant, pi) in participants" :key="'mh'+participant.id" class="text-center pb-2">
              <span class="w-[9px] h-[9px] rounded-full inline-block mb-1" :style="{ background: teamColors[pi % teamColors.length], boxShadow: `0 0 6px ${teamColors[pi % teamColors.length]}66` }"></span>
              <div class="text-sm md:text-lg leading-tight" style="font-family: var(--font-hand); font-weight: 600">{{ participant.name }}</div>
            </div>

            <!-- Lignes par zone -->
            <template v-for="(zone, zi) in zones" :key="'mz'+zi">
              <div class="flex items-center py-2" style="border-top: 1.5px dashed var(--chalk-line2)">
                <div class="text-base font-bold transition-opacity duration-500" :style="{ fontFamily: 'var(--font-display)', letterSpacing: '0.3px', textDecoration: isZoneClosed(zi) ? 'line-through' : 'none', opacity: isZoneClosed(zi) ? 0.25 : 1 }">{{ zone }}</div>
              </div>
              <button v-for="(participant, pi) in participants" :key="'mc'+participant.id+zi"
                @click="score(participant.id, zi)"
                class="ck-cell grid place-items-center min-h-[60px] relative"
                :style="{ borderTop: '1.5px dashed var(--chalk-line2)', background: 'transparent', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', padding: '6px 0 10px', cursor: isZoneClosed(zi) ? 'default' : 'pointer' }">
                <div class="transition-opacity duration-500" :style="{ opacity: isZoneClosed(zi) ? 0.25 : 1 }">
                  <span v-if="participant.state[zi] === 0" class="w-[6px] h-[6px] rounded-full opacity-70" style="background: var(--chalk-line)"></span>
                  <span v-else class="relative inline-block w-[38px] h-[38px]">
                    <span v-if="participant.state[zi] >= 1 || participant.state[zi] >= closedThreshold(zi)" class="absolute left-1/2 top-1/2 w-[3px] h-[62%] rounded-[4px] -translate-x-1/2 -translate-y-1/2 rotate-[46deg]"
                      :style="{ background: teamColors[pi % teamColors.length], boxShadow: `0 0 1.5px ${teamColors[pi % teamColors.length]}`, opacity: 0.92 }"></span>
                    <span v-if="participant.state[zi] >= 2 || participant.state[zi] >= closedThreshold(zi)" class="absolute left-1/2 top-1/2 w-[3px] h-[62%] rounded-[4px] -translate-x-1/2 -translate-y-1/2 -rotate-[46deg]"
                      :style="{ background: teamColors[pi % teamColors.length], boxShadow: `0 0 1.5px ${teamColors[pi % teamColors.length]}`, opacity: 0.92 }"></span>
                    <span v-if="participant.state[zi] >= closedThreshold(zi)" class="absolute rounded-full"
                      :style="{ inset: '9%', border: `2.5px solid ${teamColors[pi % teamColors.length]}`, opacity: 0.9 }"></span>
                    <span v-if="getExtraPoints(participant, zi) > 0" class="absolute -bottom-3 left-0 right-0 text-center text-[14px] whitespace-nowrap"
                      style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-gold)">+{{ getExtraPoints(participant, zi) }}</span>
                  </span>
                </div>
              </button>
            </template>
          </div>
        </div>

        <!-- VERSION DESKTOP : joueurs en lignes, zones en colonnes (original) -->
        <div class="hidden xl:block">
          <div class="grid" :style="{ gridTemplateColumns: `minmax(100px,150px) repeat(${zones.length}, 1fr)`, columnGap: '4px' }">
            <div class="self-end pb-2 text-[22px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">Joueurs</div>
            <div v-for="(zone, idx) in zones" :key="'h'+idx" class="text-center pb-2">
              <div class="transition-opacity duration-500" :style="{ opacity: isZoneClosed(idx) ? 0.25 : 1 }">
                <div :class="zone === 'Bulle' ? 'text-[24px]' : 'text-[27px]'" :style="{ fontFamily: 'var(--font-display)', letterSpacing: '0.5px', textDecoration: isZoneClosed(idx) ? 'line-through' : 'none' }">{{ zone }}</div>
                <div class="text-[15px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">{{ indexScore[idx] }} pts</div>
              </div>
            </div>
            <template v-for="(participant, pi) in participants" :key="participant.id">
              <div class="flex items-center gap-3 py-2 px-1" style="border-top: 1.5px dashed var(--chalk-line2)">
                <span class="w-[11px] h-[11px] rounded-full flex-none" :style="{ background: teamColors[pi % teamColors.length], boxShadow: `0 0 8px ${teamColors[pi % teamColors.length]}66` }"></span>
                <span class="text-[24px] leading-none" style="font-family: var(--font-hand); font-weight: 600">{{ participant.name }}</span>
              </div>
              <button v-for="(_, zi) in zones" :key="zi"
                @click="score(participant.id, zi)"
                class="ck-cell grid place-items-center min-h-[94px] relative"
                :style="{ borderTop: '1.5px dashed var(--chalk-line2)', background: 'transparent', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', padding: '8px 0 12px', cursor: isZoneClosed(zi) ? 'default' : 'pointer' }">
                <div class="transition-opacity duration-500" :style="{ opacity: isZoneClosed(zi) ? 0.25 : 1 }">
                  <span v-if="participant.state[zi] === 0" class="w-[7px] h-[7px] rounded-full opacity-70" style="background: var(--chalk-line)"></span>
                  <span v-else class="relative inline-block w-[50px] h-[50px]">
                    <span v-if="participant.state[zi] >= 1 || participant.state[zi] >= closedThreshold(zi)" class="absolute left-1/2 top-1/2 w-[3.4px] h-[62%] rounded-[4px] -translate-x-1/2 -translate-y-1/2 rotate-[46deg]"
                      :style="{ background: teamColors[pi % teamColors.length], boxShadow: `0 0 1.5px ${teamColors[pi % teamColors.length]}`, opacity: 0.92, filter: 'blur(.2px)' }"></span>
                    <span v-if="participant.state[zi] >= 2 || participant.state[zi] >= closedThreshold(zi)" class="absolute left-1/2 top-1/2 w-[3.4px] h-[62%] rounded-[4px] -translate-x-1/2 -translate-y-1/2 -rotate-[46deg]"
                      :style="{ background: teamColors[pi % teamColors.length], boxShadow: `0 0 1.5px ${teamColors[pi % teamColors.length]}`, opacity: 0.92, filter: 'blur(.2px)' }"></span>
                    <span v-if="participant.state[zi] >= closedThreshold(zi)" class="absolute rounded-full"
                      :style="{ inset: '9%', border: `3px solid ${teamColors[pi % teamColors.length]}`, opacity: 0.9, filter: 'blur(.2px)', boxShadow: `0 0 2px ${teamColors[pi % teamColors.length]}55` }"></span>
                    <span v-if="getExtraPoints(participant, zi) > 0" class="absolute -bottom-4 left-0 right-0 text-center text-[17px] whitespace-nowrap"
                      style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-gold)">+{{ getExtraPoints(participant, zi) }}</span>
                  </span>
                </div>
              </button>
            </template>
          </div>
        </div>

        <!-- Légende -->
        <div class="mt-auto flex items-center gap-3 xl:gap-5 pt-3 flex-wrap text-sm xl:text-[18px]" style="border-top: 2px dashed var(--chalk-line); font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
          <span class="inline-flex items-center gap-1"><span class="ck-legend" data-hits="1"></span> 1 touche</span>
          <span class="inline-flex items-center gap-1"><span class="ck-legend" data-hits="2"></span> 2 touches</span>
          <span class="inline-flex items-center gap-1"><span class="ck-legend" data-hits="3"></span> fermé</span>
          <span class="ml-auto hidden xl:inline" style="color: var(--chalk-faint2)">tape une case pour noter →</span>
        </div>
      </section>

      <!-- Panneau classement + historique -->
      <aside class="flex flex-col gap-3 min-h-0 xl:pl-5 pt-4 xl:pt-0 ck-sidebar">
        <div class="text-[22px]" style="font-family: var(--font-display); letter-spacing: 0.5px">LE CLASSEMENT</div>
        <div class="flex flex-col gap-3">
          <div v-for="(p, rank) in participantOrdered" :key="p.id"
            class="relative rounded-[14px] p-3"
            :style="{
              border: `2px ${rank === 0 ? 'solid' : 'dashed'} ${rank === 0 ? 'var(--chalk-gold)' : 'var(--chalk-line)'}`,
              background: rank === 0 ? 'rgba(236,198,106,0.07)' : 'transparent'
            }">
            <div class="flex items-baseline justify-between gap-2">
              <span class="w-7 text-[28px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">{{ rank + 1 }}.</span>
              <span class="flex-1 flex items-center gap-2 text-[24px]" style="font-family: var(--font-hand); font-weight: 600">
                <span class="w-[10px] h-[10px] rounded-full flex-none" :style="{ background: teamColors[participants.indexOf(p) % teamColors.length], boxShadow: `0 0 8px ${teamColors[participants.indexOf(p) % teamColors.length]}66` }"></span>
                {{ p.name }}
              </span>
              <span class="text-[34px] leading-none" style="font-family: var(--font-display)">{{ p.score }}</span>
            </div>
            <div class="flex justify-between items-end mt-1 ml-9" style="font-family: var(--font-hand); font-weight: 600">
              <div class="text-[17px] leading-tight">
                <span v-if="rank === 0" style="color: var(--chalk-green)">Meneur ✦</span>
                <span v-else-if="p.score === participantOrdered[0].score" style="color: var(--chalk-gold)">= meneur</span>
                <span v-else style="color: var(--chalk-gold)">{{ participantOrdered[0].score - p.score }} pts derri&egrave;re</span>
              </div>
              <div class="text-right leading-tight">
                <div v-if="getTotalPointsGiven(p) > 0" class="text-[15px]" style="color: var(--chalk-gold)">{{ getTotalPointsGiven(p) }} inflig&eacute;s</div>
                <div class="text-[19px]" :style="{ color: p.state.filter((s, zi) => s >= closedThreshold(zi)).length === totalZones ? 'var(--chalk-green)' : 'var(--chalk-red)' }">
                  {{ p.state.filter((s, zi) => s >= closedThreshold(zi)).length }}/{{ totalZones }}</div>
              </div>
            </div>
          </div>
        </div>

        <HistoryPanel :history="history" @undo="onUndo">
          <template #entry="{ entry }">
            <div class="flex items-center gap-2 text-sm">
              <span class="w-2 h-2 rounded-full flex-none" :style="{ background: teamColors[participants.indexOf(entry.participant) % teamColors.length] }"></span>
              <span class="flex-1"><b>{{ entry.participant.name }}</b> touche <b>{{ zones[entry.nbr] }}</b></span>
            </div>
          </template>
        </HistoryPanel>
      </aside>
    </div>

    <GameModals
      :show-rules="showRulesModal"
      :show-reset="showResetModal"
      :show-winner="showWinnerModal"
      rules-title="RÈGLES DU CRICKET"
      :winner-name="winner?.name"
      @close-rules="showRulesModal = false"
      @close-reset="cancelReset"
      @confirm-reset="applyBullMode"
      @close-winner="showWinnerModal = false"
      @new-game="resetGame">
      <template #rules-content>
        <p><span style="color: var(--chalk-cream)">But du jeu :</span> Fermer les 7 zones (20, 19, 18, 17, 16, 15 et Bulle) avant les adversaires, avec le moins de points possible.</p>
        <p><span style="color: var(--chalk-cream)">Fermer une zone :</span> Toucher 3 fois la zone. Les marques s'affichent : / (1 touche), ✕ (2 touches), ⊘ (fermé).</p>
        <p><span style="color: var(--chalk-cream)">Marquer des points :</span> Quand ta zone est fermée mais pas celle d'un adversaire, chaque touche supplémentaire lui ajoute des points.</p>
        <p><span style="color: var(--chalk-cream)">Victoire :</span> Le premier à fermer toutes les zones ET avoir le score le plus bas gagne.</p>
        <p><span style="color: var(--chalk-cream)">Astuce :</span> Tape sur une case dans la grille pour noter une touche. Le bouton « Annuler » (ou Backspace au clavier) retire le dernier coup.</p>
      </template>
      <template #winner-stats>
        <div>
          <div class="text-2xl font-bold" style="color: var(--chalk-green)">{{ winner?.score }}</div>
          <div class="text-sm" style="color: var(--chalk-faint2)">Points</div>
        </div>
        <div>
          <div class="text-2xl font-bold" style="color: var(--chalk-green)">{{ totalZones }}/{{ totalZones }}</div>
          <div class="text-sm" style="color: var(--chalk-faint2)">Zones fermées</div>
        </div>
      </template>
    </GameModals>
  </div>
</template>

<style scoped>
@media (min-width: 1280px) {
  .ck-body { grid-template-columns: 1fr 332px; }
  .ck-sidebar { border-left: 2px dashed var(--chalk-line); }
}
@media (max-width: 1279px) {
  .ck-sidebar { border-top: 2px dashed var(--chalk-line); }
}
.ck-select {
  font-family: var(--font-hand); font-weight: 600; font-size: 19px;
  color: var(--chalk-cream); background: transparent;
  border: 2px dashed var(--chalk-line); border-radius: 10px;
  padding: 3px 12px; cursor: pointer; appearance: auto;
}
.ck-select option { background: var(--chalk-bg); color: var(--chalk-cream); }
.ck-cell:hover { background: rgba(241,230,203,0.05) !important; }
.ck-legend {
  position: relative; width: 22px; height: 22px; display: inline-block; flex: none;
}
.ck-legend::before, .ck-legend::after {
  content: ''; position: absolute; left: 50%; top: 50%; width: 2.4px; height: 60%;
  background: var(--chalk-faint); border-radius: 3px;
}
.ck-legend::before { transform: translate(-50%,-50%) rotate(46deg); }
.ck-legend[data-hits="1"]::after { display: none; }
.ck-legend[data-hits="2"]::after { transform: translate(-50%,-50%) rotate(-46deg); }
.ck-legend[data-hits="3"]::after { transform: translate(-50%,-50%) rotate(-46deg); }
</style>

<script>
import firebaseService from '../services/firebaseService.js';
import fullscreenMixin from '../mixins/fullscreenMixin.js';
import keyboardUndoMixin from '../mixins/keyboardUndoMixin.js';
import GameHeader from './shared/GameHeader.vue';
import GameModals from './shared/GameModals.vue';
import HistoryPanel from './shared/HistoryPanel.vue';

export default {
  name: "Cricket",
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
      id: 0,
      currentPlayer: 0,
      history: [],
      name: '',
      participants: [],
      bullMode: '3',
      previousBullMode: '3',
      zones: ['Bulle', '20', '19', '18', '17', '16', '15'],
      indexScore: [25, 20, 19, 18, 17, 16, 15],
      teamColors: ['#ef8b6f', '#86c7a0', '#ecc66a', '#6fb5ef', '#ef8fbf', '#efad6f', '#b58fef', '#6fd9d9'],
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
    participantOrdered() {
      return [...this.participants].sort((a, b) => a.score - b.score);
    },
    bullModeSubtitle() {
      if (this.bullMode === '0') return 'ferme 20 → 15';
      if (this.bullMode === '1') return 'ferme 20 → 15 + 1 bulle';
      return 'ferme 20 → 15 + la bulle';
    },
    totalZones() {
      return this.zones.length;
    }
  },
  methods: {
    onUndo() { this.cancel(); },

    changeBullMode() {
      if (this.history.length > 0) {
        this.previousBullMode = this.bullMode;
        this.showResetModal = true;
      } else {
        this.applyBullMode();
      }
    },

    applyBullMode() {
      if (this.bullMode === '0') {
        this.zones = ['20', '19', '18', '17', '16', '15'];
        this.indexScore = [20, 19, 18, 17, 16, 15];
      } else if (this.bullMode === '1') {
        this.zones = ['Bulle', '20', '19', '18', '17', '16', '15'];
        this.indexScore = [25, 20, 19, 18, 17, 16, 15];
      } else {
        this.zones = ['Bulle', '20', '19', '18', '17', '16', '15'];
        this.indexScore = [25, 20, 19, 18, 17, 16, 15];
      }
      this.resetGame();
      this.previousBullMode = this.bullMode;
    },

    initializePlayers() {
      this.participants = this.players.map((player) => ({
        id: player.id,
        name: player.name,
        state: new Array(this.zones.length).fill(0),
        pointsGiven: new Array(this.zones.length).fill(0),
        score: 0
      }));
      this.id = this.participants.length;
    },

    closedThreshold(zi) {
      return (this.bullMode === '1' && this.zones[zi] === 'Bulle') ? 1 : 3;
    },

    getExtraPoints(participant, zoneIndex) {
      return participant.pointsGiven?.[zoneIndex] || 0;
    },

    getTotalPointsGiven(participant) {
      return (participant.pointsGiven || []).reduce((sum, pts) => sum + pts, 0);
    },

    isWinner(participant) {
      const hasClosedAllZones = participant.state.every(s => s >= 3);
      if (!hasClosedAllZones) return false;
      const globalLowestScore = Math.min(...this.participants.map(p => p.score));
      return participant.score === globalLowestScore;
    },

    isZoneClosed(zoneIndex) {
      const threshold = this.closedThreshold(zoneIndex);
      return this.participants.every(p => p.state[zoneIndex] >= threshold);
    },

    cancel() {
      if (this.history.length === 0) return;
      const last = this.history[this.history.length - 1];
      const participant = last.participant;
      const nbr = last.nbr;
      const pointsInflicted = last.pointsInflicted || 0;
      if (pointsInflicted > 0) {
        const threshold = this.closedThreshold(nbr);
        this.participants.forEach((p) => {
          if (p.id !== participant.id && p.state[nbr] < threshold) {
            p.score -= this.indexScore[nbr];
          }
        });
        participant.pointsGiven[nbr] -= pointsInflicted;
      }
      participant.state[nbr] -= 1;
      this.history.pop();
      this.gameFinished = false;
    },

    confirmReset() { this.showResetModal = true; },

    resetGame() {
      this.participants.forEach((p) => {
        p.state = new Array(this.zones.length).fill(0);
        p.pointsGiven = new Array(this.zones.length).fill(0);
        p.score = 0;
      });
      this.history = [];
      this.gameFinished = false;
      this.showResetModal = false;
      this.showWinnerModal = false;
      this.winner = null;
    },

    cancelReset() {
      this.bullMode = this.previousBullMode;
      this.showResetModal = false;
    },

    score(id, nbr) {
      if (this.gameFinished) return;
      const participant = this.participants.find((p) => p.id === id);
      const chiffre = this.indexScore[nbr];
      this.history.push({ participant, chiffre, nbr });
      const threshold = this.closedThreshold(nbr);
      let pointsInflicted = 0;
      if (participant.state[nbr] >= threshold) {
        this.participants.forEach((p) => {
          if (p.state[nbr] < threshold) {
            p.score += this.indexScore[nbr];
            pointsInflicted += this.indexScore[nbr];
          }
        });
        participant.pointsGiven[nbr] += pointsInflicted;
      }
      participant.state[nbr] += 1;
      this.history[this.history.length - 1].pointsInflicted = pointsInflicted;
      this.$forceUpdate();
      this.checkWin();
    },

    checkWin() {
      const playersWithAllZonesClosed = this.participants.filter(p => p.state.every((s, zi) => s >= this.closedThreshold(zi)));
      if (playersWithAllZonesClosed.length > 0) {
        const globalLowestScore = Math.min(...this.participants.map(p => p.score));
        const winner = playersWithAllZonesClosed.find(p => p.score === globalLowestScore);
        if (winner) {
          this.gameFinished = true;
          this.winner = winner;
          this.sendVictory(winner);
          setTimeout(() => { this.showWinnerModal = true; }, 50);
        }
      }
    },

    async sendVictory(winner) {
      try {
        const gameData = firebaseService.prepareGameData(winner, this.participants, this.history, 'Cricket');
        await firebaseService.sendGameVictory(gameData);
      } catch (error) {
        console.warn('Impossible d\'envoyer vers Firebase:', error.message);
      }
    }
  }
};
</script>
