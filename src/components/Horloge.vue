<template>
  <div class="chalk-grain"
    style="font-family: var(--font-ui); color: var(--chalk-cream); height: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column; background: radial-gradient(130% 90% at 50% -10%, #20322b, #142019 72%)">
    <!-- Cadre -->
    <div style="position: absolute; inset: 9px; border: 2px solid var(--chalk-line); border-radius: 12px; pointer-events: none; opacity: 0.5"></div>

    <!-- Header -->
    <header class="flex flex-wrap items-center justify-between gap-3 px-5 pt-3 pb-2 relative" style="border-bottom: 2px dashed var(--chalk-line); margin: 9px 9px 0">
      <button @click="$parent.currentComponent = null" class="chalk-btn-ghost text-base xl:text-[21px]">&#8249; Retour</button>
      <div class="flex items-baseline gap-3 min-w-0">
        <span class="text-xl xl:text-[28px]" style="font-family: var(--font-display); letter-spacing: 0.5px">HORLOGE</span>
        <span class="text-[19px] whitespace-nowrap hidden xl:inline" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-gold)">1 &#8594; 20 &#8594; Bulle</span>
      </div>
      <div class="flex gap-2 flex-none">
        <button @click="showRulesModal = true" class="chalk-btn-ghost text-base xl:text-[21px]">? R&egrave;gles</button>
        <button @click="toggleFullscreen" class="chalk-btn-ghost text-base xl:text-[21px] hidden xl:block btn-fullscreen">{{ isFullscreen ? 'Quitter' : '&#9974; Plein écran' }}</button>
        <button @click="confirmReset" class="chalk-btn-green text-base xl:text-[21px]">&#8635; Relancer</button>
      </div>
    </header>

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
                <div class="text-[15px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">{{ player.currentTarget - 1 }}/21 terminés</div>
              </div>

              <!-- Fléchettes restantes -->
              <div class="flex justify-center gap-2 mb-3">
                <div
                  v-for="dart in 3"
                  :key="dart"
                  class="w-[14px] h-[14px] rounded-full transition-all duration-300"
                  :style="{
                    background: dart <= player.dartsLeft ? 'var(--chalk-gold)' : 'var(--chalk-line2)',
                    boxShadow: dart <= player.dartsLeft ? '0 0 6px rgba(236,198,106,0.4)' : 'none'
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

        <!-- Contrôles de jeu -->
        <div class="rounded-[14px] p-5" style="border: 2px dashed var(--chalk-line)">
          <h3 class="text-lg xl:text-[22px] mb-1 text-center" style="font-family: var(--font-display); letter-spacing: 0.5px">
            {{ currentPlayer?.name }}
          </h3>
          <div class="text-center mb-4" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
            Cible : <span style="color: var(--chalk-gold)">{{ currentPlayer?.currentTarget > 20 ? 'Bulle (25)' : currentPlayer?.currentTarget }}</span>
            &mdash; {{ currentPlayer?.dartsLeft }} fléchette{{ currentPlayer?.dartsLeft > 1 ? 's' : '' }} restante{{ currentPlayer?.dartsLeft > 1 ? 's' : '' }}
          </div>

          <!-- Grille des numéros -->
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

          <!-- Bouton Manqué -->
          <div class="flex justify-center">
            <button
              @click="miss()"
              :disabled="gameFinished"
              class="chalk-btn-ghost"
              :style="{ opacity: gameFinished ? 0.4 : 1 }">
              Manqué
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

        <!-- Historique -->
        <div class="flex items-center justify-between mt-1">
          <span class="text-[19px]" style="font-family: var(--font-display); letter-spacing: 0.5px">L'HISTORIQUE</span>
          <button @click="undo" :class="history.length ? 'chalk-btn-red' : 'chalk-btn-ghost'" :disabled="history.length === 0">&#8630; Annuler</button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5 chalk-scroll">
          <div v-if="history.length === 0" class="m-auto text-center py-6 text-[20px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">
            <div class="text-[30px] opacity-50">&#128336;</div>
            Aucun coup joué...<br>l'historique s'affichera ici.
          </div>
          <div
            v-for="(entry, index) in [...history].reverse()"
            :key="index"
            class="flex items-center gap-3 py-2 px-1"
            style="border-bottom: 1.5px dashed var(--chalk-line2)">

            <div class="flex-1 text-[16px]" style="font-family: var(--font-hand); font-weight: 600">
              <span style="color: var(--chalk-gold)">{{ entry.player.name }}</span>
              <span class="ml-1" style="color: var(--chalk-faint2)">#{{ history.length - index }}</span>
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
        </div>
      </aside>
    </div>

    <!-- Modal Règles -->
    <div v-if="showRulesModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="chalk-grain rounded-2xl p-6 xl:p-8 border-2 border-dashed max-w-lg mx-4 max-h-[80vh] overflow-y-auto chalk-scroll"
        style="background: radial-gradient(120% 80% at 50% 0%, #1e2e28, var(--chalk-bg) 70%); border-color: var(--chalk-line)">
        <h3 class="text-2xl text-center mb-4" style="font-family: var(--font-display); color: var(--chalk-gold)">R&Egrave;GLES DE L'HORLOGE</h3>
        <div class="space-y-3 text-[22px] leading-relaxed" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
          <p><span style="color: var(--chalk-cream)">But du jeu :</span> Toucher les num&eacute;ros de 1 &agrave; 20 dans l'ordre, puis la Bulle (25). Le plus rapide gagne.</p>
          <p><span style="color: var(--chalk-cream)">Tour de jeu :</span> Chaque joueur lance 3 fl&eacute;chettes par tour.</p>
          <p><span style="color: var(--chalk-cream)">Progression :</span> Il faut toucher sa cible actuelle pour avancer. Simple, double ou triple comptent tous.</p>
          <p><span style="color: var(--chalk-cream)">Manqu&eacute; :</span> Si la fl&eacute;chette ne touche pas la cible, elle ne compte pas.</p>
          <p><span style="color: var(--chalk-cream)">Victoire :</span> Le premier joueur &agrave; toucher tous les num&eacute;ros de 1 &agrave; 20 puis la Bulle gagne.</p>
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
          <div style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">a fait le tour de l'horloge !</div>
        </div>

        <!-- Statistiques du gagnant -->
        <div class="rounded-xl p-4 mb-6" style="background: rgba(134,199,160,0.1); border: 2px dashed var(--chalk-green)">
          <div class="grid grid-cols-2 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold" style="color: var(--chalk-green)">21/21</div>
              <div class="text-sm" style="color: var(--chalk-faint2)">Cibles touchées</div>
            </div>
            <div>
              <div class="text-2xl font-bold" style="color: var(--chalk-green)">{{ getPlayerDarts(winner) }}</div>
              <div class="text-sm" style="color: var(--chalk-faint2)">Fléchettes lancées</div>
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
.horloge-num:hover:not(:disabled) {
  background: rgba(241,230,203,0.06) !important;
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

export default {
  name: "Horloge",
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
      history: [],
      targetNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25],
      gameFinished: false,
      isFullscreen: false,
      showResetModal: false,
      showRulesModal: false,
      showWinnerModal: false,
      winner: null
    };
  },
  mounted() {
    this.initializePlayers();
    this.addKeyboardListener();
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
    initializePlayers() {
      this.gamePlayers = this.players.map(player => ({
        ...player,
        currentTarget: 1,
        dartsLeft: 3,
        winner: false
      }));
    },

    addKeyboardListener() {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
          this.undo();
        }
      });
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

        // Victoire : a touché la bulle (cible 22 = après bulle)
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

    toggleFullscreen() {
      if (!this.isFullscreen) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
          document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
          document.documentElement.msRequestFullscreen();
        }
        this.isFullscreen = true;
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
        this.isFullscreen = false;
      }
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
