<template>
  <div class="chalk-grain ck-root"
    style="font-family: var(--font-ui); color: var(--chalk-cream); height: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column; background: radial-gradient(130% 90% at 50% -10%, #20322b, #142019 72%)">
    <!-- Cadre -->
    <div style="position: absolute; inset: 9px; border: 2px solid var(--chalk-line); border-radius: 12px; pointer-events: none; opacity: 0.5"></div>

    <!-- Header -->
    <header class="flex flex-wrap items-center justify-between gap-2 px-4 xl:px-5 pt-2 xl:pt-3 pb-2 relative" style="border-bottom: 2px dashed var(--chalk-line); margin: 9px 9px 0">
      <button @click="$parent.currentComponent = null" class="chalk-btn-ghost text-base xl:text-[21px]">&#8249; Retour</button>
      <div class="flex items-baseline gap-2 min-w-0">
        <span class="text-xl xl:text-[28px]" style="font-family: var(--font-display); letter-spacing: 0.5px">CRICKET</span>
        <span class="hidden xl:inline text-[19px] whitespace-nowrap" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-gold)">ferme 20 → 15 + la bulle</span>
      </div>
      <div class="flex gap-2 flex-none">
        <button @click="showRulesModal = true" class="chalk-btn-ghost text-base xl:text-[21px]">? Règles</button>
        <button @click="toggleFullscreen" class="chalk-btn-ghost hidden xl:block btn-fullscreen">{{ isFullscreen ? 'Quitter' : '&#9974; Plein écran' }}</button>
        <button @click="confirmReset" class="chalk-btn-green text-base xl:text-[21px]">&#8635; Relancer</button>
      </div>
    </header>

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
              <span class="w-[9px] h-[9px] rounded-full inline-block mb-1" :style="{ background: teamColors[pi % 3], boxShadow: `0 0 6px ${teamColors[pi % 3]}66` }"></span>
              <div class="text-sm leading-tight" style="font-family: var(--font-hand); font-weight: 600">{{ participant.name }}</div>
            </div>

            <!-- Lignes par zone -->
            <template v-for="(zone, zi) in zones" :key="'mz'+zi">
              <div class="flex items-center py-2" style="border-top: 1.5px dashed var(--chalk-line2)">
                <div class="text-base font-bold" style="font-family: var(--font-display); letter-spacing: 0.3px">{{ zone }}</div>
              </div>
              <button v-for="(participant, pi) in participants" :key="'mc'+participant.id+zi"
                @click="score(participant.id, zi)"
                class="ck-cell grid place-items-center cursor-pointer rounded-lg min-h-[60px] relative"
                style="border-top: 1.5px dashed var(--chalk-line2); background: transparent; border-left: none; border-right: none; border-bottom: none; padding: 6px 0 10px">
                <span v-if="participant.state[zi] === 0" class="w-[6px] h-[6px] rounded-full opacity-70" style="background: var(--chalk-line)"></span>
                <span v-else class="relative inline-block w-[38px] h-[38px]">
                  <span v-if="participant.state[zi] >= 1" class="absolute left-1/2 top-1/2 w-[3px] h-[62%] rounded-[4px] -translate-x-1/2 -translate-y-1/2 rotate-[46deg]"
                    :style="{ background: teamColors[pi % 3], boxShadow: `0 0 1.5px ${teamColors[pi % 3]}`, opacity: 0.92 }"></span>
                  <span v-if="participant.state[zi] >= 2" class="absolute left-1/2 top-1/2 w-[3px] h-[62%] rounded-[4px] -translate-x-1/2 -translate-y-1/2 -rotate-[46deg]"
                    :style="{ background: teamColors[pi % 3], boxShadow: `0 0 1.5px ${teamColors[pi % 3]}`, opacity: 0.92 }"></span>
                  <span v-if="participant.state[zi] >= 3" class="absolute rounded-full"
                    :style="{ inset: '9%', border: `2.5px solid ${teamColors[pi % 3]}`, opacity: 0.9 }"></span>
                  <span v-if="getExtraPoints(participant, zi) > 0" class="absolute -bottom-3 left-0 right-0 text-center text-[14px] whitespace-nowrap"
                    style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-gold)">+{{ getExtraPoints(participant, zi) }}</span>
                </span>
              </button>
            </template>
          </div>
        </div>

        <!-- VERSION DESKTOP : joueurs en lignes, zones en colonnes (original) -->
        <div class="hidden xl:block">
          <div class="grid" :style="{ gridTemplateColumns: `minmax(100px,150px) repeat(${zones.length}, 1fr)`, columnGap: '4px' }">
            <div class="self-end pb-2 text-[22px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">Équipes</div>
            <div v-for="(zone, idx) in zones" :key="'h'+idx" class="text-center pb-2">
              <div :class="zone === 'Bulle' ? 'text-[24px]' : 'text-[27px]'" style="font-family: var(--font-display); letter-spacing: 0.5px">{{ zone }}</div>
              <div class="text-[15px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">{{ indexScore[idx] }} pts</div>
            </div>
            <template v-for="(participant, pi) in participants" :key="participant.id">
              <div class="flex items-center gap-3 py-2 px-1" style="border-top: 1.5px dashed var(--chalk-line2)">
                <span class="w-[11px] h-[11px] rounded-full flex-none" :style="{ background: teamColors[pi % 3], boxShadow: `0 0 8px ${teamColors[pi % 3]}66` }"></span>
                <span class="text-[24px] leading-none" style="font-family: var(--font-hand); font-weight: 600">{{ participant.name }}</span>
              </div>
              <button v-for="(_, zi) in zones" :key="zi"
                @click="score(participant.id, zi)"
                class="ck-cell grid place-items-center cursor-pointer rounded-[10px] min-h-[94px] relative"
                style="border-top: 1.5px dashed var(--chalk-line2); background: transparent; border-left: none; border-right: none; border-bottom: none; padding: 8px 0 12px">
                <span v-if="participant.state[zi] === 0" class="w-[7px] h-[7px] rounded-full opacity-70" style="background: var(--chalk-line)"></span>
                <span v-else class="relative inline-block w-[50px] h-[50px]">
                  <span v-if="participant.state[zi] >= 1" class="absolute left-1/2 top-1/2 w-[3.4px] h-[62%] rounded-[4px] -translate-x-1/2 -translate-y-1/2 rotate-[46deg]"
                    :style="{ background: teamColors[pi % 3], boxShadow: `0 0 1.5px ${teamColors[pi % 3]}`, opacity: 0.92, filter: 'blur(.2px)' }"></span>
                  <span v-if="participant.state[zi] >= 2" class="absolute left-1/2 top-1/2 w-[3.4px] h-[62%] rounded-[4px] -translate-x-1/2 -translate-y-1/2 -rotate-[46deg]"
                    :style="{ background: teamColors[pi % 3], boxShadow: `0 0 1.5px ${teamColors[pi % 3]}`, opacity: 0.92, filter: 'blur(.2px)' }"></span>
                  <span v-if="participant.state[zi] >= 3" class="absolute rounded-full"
                    :style="{ inset: '9%', border: `3px solid ${teamColors[pi % 3]}`, opacity: 0.9, filter: 'blur(.2px)', boxShadow: `0 0 2px ${teamColors[pi % 3]}55` }"></span>
                  <span v-if="getExtraPoints(participant, zi) > 0" class="absolute -bottom-4 left-0 right-0 text-center text-[17px] whitespace-nowrap"
                    style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-gold)">+{{ getExtraPoints(participant, zi) }}</span>
                </span>
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
              <span class="w-5 text-[18px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">{{ rank + 1 }}.</span>
              <span class="flex-1 flex items-center gap-2 text-[24px]" style="font-family: var(--font-hand); font-weight: 600">
                <span class="w-[10px] h-[10px] rounded-full flex-none" :style="{ background: teamColors[participants.indexOf(p) % 3], boxShadow: `0 0 8px ${teamColors[participants.indexOf(p) % 3]}66` }"></span>
                {{ p.name }}
              </span>
              <span class="text-[34px] leading-none" style="font-family: var(--font-display)">{{ p.score }}</span>
            </div>
            <div class="flex justify-between items-end mt-1 ml-9">
              <div class="text-[17px] leading-tight" style="font-family: var(--font-hand); font-weight: 600">
                <span v-if="rank === 0" style="color: var(--chalk-green)">Meneur ✦</span>
                <span v-else-if="p.score === participantOrdered[0].score" style="color: var(--chalk-gold)">= meneur (même score)</span>
                <span v-else style="color: var(--chalk-gold)">{{ participantOrdered[0].score - p.score }} pts derrière</span>
              </div>
              <span class="text-[19px]" :style="{ fontFamily: 'var(--font-hand)', fontWeight: 600, color: p.state.filter(s => s >= 3).length === 7 ? 'var(--chalk-green)' : 'var(--chalk-red)' }">
                {{ p.state.filter(s => s >= 3).length }}/7</span>
            </div>
          </div>
        </div>

        <!-- Historique -->
        <div class="flex items-center justify-between mt-1">
          <span class="text-[19px]" style="font-family: var(--font-display); letter-spacing: 0.5px">L'HISTORIQUE</span>
          <button @click="cancel" :class="history.length ? 'chalk-btn-red' : 'chalk-btn-ghost'" :disabled="history.length === 0">&#8630; Annuler</button>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5 chalk-scroll">
          <div v-if="history.length === 0" class="m-auto text-center py-6 text-[20px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">
            <div class="text-[30px] opacity-50">&#9998;</div>
            Aucun coup joué...<br>l'historique s'affichera ici.
          </div>
          <div v-for="(entry, index) in [...history].reverse()" :key="index"
            class="flex items-center gap-2 py-1.5 px-1 text-sm"
            style="border-bottom: 1.5px dashed var(--chalk-line2)">
            <span class="w-2 h-2 rounded-full flex-none" :style="{ background: teamColors[participants.indexOf(entry.participant) % 3] }"></span>
            <span class="flex-1"><b>{{ entry.participant.name }}</b> touche <b>{{ zones[entry.nbr] }}</b></span>
          </div>
        </div>
      </aside>
    </div>

    <!-- Modal Règles -->
    <div v-if="showRulesModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="chalk-grain rounded-2xl p-6 xl:p-8 border-2 border-dashed max-w-lg mx-4 max-h-[80vh] overflow-y-auto chalk-scroll"
        style="background: radial-gradient(120% 80% at 50% 0%, #1e2e28, var(--chalk-bg) 70%); border-color: var(--chalk-line)">
        <h3 class="text-2xl text-center mb-4" style="font-family: var(--font-display); color: var(--chalk-gold)">RÈGLES DU CRICKET</h3>
        <div class="space-y-3 text-[22px] leading-relaxed" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
          <p><span style="color: var(--chalk-cream)">But du jeu :</span> Fermer les 7 zones (20, 19, 18, 17, 16, 15 et Bulle) avant les adversaires, avec le moins de points possible.</p>
          <p><span style="color: var(--chalk-cream)">Fermer une zone :</span> Toucher 3 fois la zone. Les marques s'affichent : / (1 touche), ✕ (2 touches), ⊘ (fermé).</p>
          <p><span style="color: var(--chalk-cream)">Marquer des points :</span> Quand ta zone est fermée mais pas celle d'un adversaire, chaque touche supplémentaire lui ajoute des points.</p>
          <p><span style="color: var(--chalk-cream)">Victoire :</span> Le premier à fermer toutes les zones ET avoir le score le plus bas gagne.</p>
          <p><span style="color: var(--chalk-cream)">Astuce :</span> Tape sur une case dans la grille pour noter une touche. Backspace pour annuler le dernier coup.</p>
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
          Remettre à zéro la partie ? <br><span style="color: var(--chalk-red)">Cette action est irréversible.</span></p>
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
          <div style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">a remporté la partie !</div>
        </div>
        <div class="rounded-xl p-4 mb-6" style="background: rgba(134,199,160,0.1); border: 2px dashed var(--chalk-green)">
          <div class="grid grid-cols-2 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold" style="color: var(--chalk-green)">{{ winner?.score }}</div>
              <div class="text-sm" style="color: var(--chalk-faint2)">Points</div>
            </div>
            <div>
              <div class="text-2xl font-bold" style="color: var(--chalk-green)">7/7</div>
              <div class="text-sm" style="color: var(--chalk-faint2)">Zones fermées</div>
            </div>
          </div>
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
/* Responsive layout */
@media (min-width: 1280px) {
  .ck-body { grid-template-columns: 1fr 332px; }
  .ck-sidebar { border-left: 2px dashed var(--chalk-line); }
}
@media (max-width: 1279px) {
  .ck-sidebar { border-top: 2px dashed var(--chalk-line); }
}

.chalk-btn-ghost {
  font-family: var(--font-hand); font-weight: 600; font-size: 21px;
  color: var(--chalk-faint); background: transparent;
  border: 2px dashed var(--chalk-faint); border-radius: 12px;
  padding: 5px 18px; cursor: pointer; line-height: 1.1; white-space: nowrap;
}
.chalk-btn-green {
  font-family: var(--font-hand); font-weight: 600; font-size: 21px;
  color: var(--chalk-green); background: transparent;
  border: 2px solid var(--chalk-green); border-radius: 12px;
  padding: 5px 18px; cursor: pointer; line-height: 1.1; white-space: nowrap;
  box-shadow: inset 0 0 0 1px rgba(134,199,160,0.2);
}
.chalk-btn-red {
  font-family: var(--font-hand); font-weight: 600; font-size: 21px;
  color: var(--chalk-red); background: transparent;
  border: 2px solid var(--chalk-red); border-radius: 12px;
  padding: 5px 18px; cursor: pointer; line-height: 1.1; white-space: nowrap;
}
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

export default {
  name: "Cricket",
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
      zones: ['Bulle', '20', '19', '18', '17', '16', '15'],
      indexScore: [25, 20, 19, 18, 17, 16, 15],
      teamColors: ['#ef8b6f', '#86c7a0', '#ecc66a'],
      gameFinished: false,
      showRulesModal: false,
      showResetModal: false,
      showWinnerModal: false,
      winner: null,
      isFullscreen: false
    };
  },
  mounted() {
    this.initializePlayers();
    this.addKeyboardListener();
  },
  computed: {
    participantOrdered() {
      return [...this.participants].sort((a, b) => a.score - b.score);
    }
  },
  methods: {
    initializePlayers() {
      this.participants = this.players.map((player) => ({
        id: player.id,
        name: player.name,
        state: [0, 0, 0, 0, 0, 0, 0],
        score: 0
      }));
      this.id = this.participants.length;
    },

    getExtraPoints(participant, zoneIndex) {
      const hits = participant.state[zoneIndex];
      if (hits <= 3) return 0;
      return (hits - 3) * this.indexScore[zoneIndex];
    },

    isWinner(participant) {
      const hasClosedAllZones = participant.state.every(s => s >= 3);
      if (!hasClosedAllZones) return false;
      const globalLowestScore = Math.min(...this.participants.map(p => p.score));
      return participant.score === globalLowestScore;
    },

    isZoneClosed(zoneIndex) {
      return this.participants.every(p => p.state[zoneIndex] >= 3);
    },

    addKeyboardListener() {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') this.cancel();
      });
    },

    cancel() {
      if (this.history.length === 0) return;
      const last = this.history[this.history.length - 1];
      const participant = last.participant;
      const nbr = last.nbr;
      if (participant.state[nbr] > 3) {
        this.participants.forEach((p) => {
          if (p.state[nbr] < 3) p.score -= this.indexScore[nbr];
        });
      }
      participant.state[nbr] -= 1;
      this.history.pop();
      this.gameFinished = false;
    },

    confirmReset() { this.showResetModal = true; },

    resetGame() {
      this.participants.forEach((p) => {
        p.state = [0, 0, 0, 0, 0, 0, 0];
        p.score = 0;
      });
      this.history = [];
      this.gameFinished = false;
      this.showResetModal = false;
      this.showWinnerModal = false;
      this.winner = null;
    },

    score(id, nbr) {
      if (this.gameFinished) return;
      const participant = this.participants.find((p) => p.id === id);
      const chiffre = this.indexScore[nbr];
      this.history.push({ participant, chiffre, nbr });
      if (participant.state[nbr] >= 3) {
        this.participants.forEach((p) => {
          if (p.state[nbr] < 3) p.score += this.indexScore[nbr];
        });
      }
      participant.state[nbr] += 1;
      this.$forceUpdate();
      this.checkWin();
    },

    checkWin() {
      const playersWithAllZonesClosed = this.participants.filter(p => p.state.every(s => s >= 3));
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
        const gameData = firebaseService.prepareGameData(winner, this.participants, this.history, 'Cricket');
        await firebaseService.sendGameVictory(gameData);
      } catch (error) {
        console.warn('Impossible d\'envoyer vers Firebase:', error.message);
      }
    }
  }
};
</script>
