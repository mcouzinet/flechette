<template>
  <div class="chalk-grain"
    style="font-family: var(--font-ui); color: var(--chalk-cream); height: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column; background: radial-gradient(130% 90% at 50% -10%, #20322b, #142019 72%)">
    <!-- Cadre -->
    <div style="position: absolute; inset: 9px; border: 2px solid var(--chalk-line); border-radius: 12px; pointer-events: none; opacity: 0.5"></div>

    <!-- Header -->
    <header class="flex flex-wrap items-center justify-between gap-3 px-5 pt-3 pb-2 relative" style="border-bottom: 2px dashed var(--chalk-line); margin: 9px 9px 0">
      <button @click="$parent.currentComponent = null" class="chalk-btn-ghost text-base xl:text-[21px]">&#8249; Retour</button>
      <div class="flex items-baseline gap-3 min-w-0">
        <span class="text-xl xl:text-[28px]" style="font-family: var(--font-display); letter-spacing: 0.5px">KILLER</span>
        <span class="hidden xl:inline text-[19px] whitespace-nowrap" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-red)">deviens killer, elimine les autres</span>
      </div>
      <div class="flex gap-2 flex-none">
        <button @click="showRulesModal = true" class="chalk-btn-ghost text-base xl:text-[21px]">? Règles</button>
        <button @click="toggleFullscreen" class="hidden xl:block chalk-btn-ghost btn-fullscreen">{{ isFullscreen ? 'Quitter' : '&#9974; Plein ecran' }}</button>
        <button @click="confirmReset" class="chalk-btn-green text-base xl:text-[21px]">&#8635; Relancer</button>
      </div>
    </header>

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
            <h3 class="text-lg xl:text-[22px] mb-4 text-center" style="font-family: var(--font-hand); font-weight: 700">
              {{ gamePlayers[setupPlayerIndex].name }} <span style="color: var(--chalk-faint)">- Choisir le numero touche</span>
            </h3>
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
                <div v-if="currentPlayerIndex === index && !player.eliminated && !gameFinished" class="flex justify-center gap-2 mt-3">
                  <div
                    v-for="dart in 3"
                    :key="dart"
                    class="w-3 h-3 rounded-full transition-all duration-300"
                    :style="{ background: dart <= player.dartsLeft ? 'var(--chalk-gold)' : 'var(--chalk-line2)' }">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Controles de jeu -->
          <div v-if="!gameFinished" class="rounded-[14px] p-5 mt-auto"
               style="border: 2px dashed var(--chalk-line); background: rgba(241,230,203,0.03)">
            <h3 class="text-lg xl:text-[24px] mb-1 text-center" style="font-family: var(--font-hand); font-weight: 700">
              {{ currentPlayer?.name }}
              <span v-if="!currentPlayer?.isKiller" style="color: var(--chalk-gold)"> - Viser le double {{ currentPlayer?.number }}</span>
              <span v-else style="color: var(--chalk-red)"> - KILLER : eliminer les autres !</span>
            </h3>
            <div class="text-center mb-5">
              <span class="text-[17px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
                {{ currentPlayer?.dartsLeft }} flechette{{ currentPlayer?.dartsLeft > 1 ? 's' : '' }} restante{{ currentPlayer?.dartsLeft > 1 ? 's' : '' }}
              </span>
            </div>

            <!-- Si pas encore killer : bouton pour devenir killer -->
            <div v-if="!currentPlayer?.isKiller" class="flex flex-wrap gap-3 justify-center">
              <button @click="becomeKiller" class="chalk-btn-red">
                Double {{ currentPlayer?.number }} touche !
              </button>
              <button @click="missDart" class="chalk-btn-ghost">
                Manque
              </button>
            </div>

            <!-- Si killer : choisir la cible -->
            <div v-else>
              <p class="text-center mb-4 text-[18px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
                Quel joueur visez-vous ?
              </p>
              <div class="flex flex-wrap gap-3 justify-center mb-4">
                <button
                  v-for="target in targetablePlayers"
                  :key="target.id"
                  @click="attackPlayer(target)"
                  class="chalk-btn-red">
                  {{ target.name }} (D{{ target.number }})
                </button>
              </div>
              <div class="flex justify-center">
                <button @click="missDart" class="chalk-btn-ghost">
                  Manque
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
        <div class="flex items-center justify-between mt-1">
          <span class="text-[19px]" style="font-family: var(--font-display); letter-spacing: 0.5px">L'HISTORIQUE</span>
          <button @click="undo" :class="history.length ? 'chalk-btn-red' : 'chalk-btn-ghost'" :disabled="history.length === 0">&#8630; Annuler</button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5 chalk-scroll">
          <div v-if="history.length === 0" class="m-auto text-center py-6 text-[20px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">
            <div class="text-[30px] opacity-50">&#128481;</div>
            Aucun coup joue...<br>l'historique s'affichera ici.
          </div>
          <div
            v-for="(entry, index) in [...history].reverse()"
            :key="index"
            class="flex items-center gap-2 py-1.5 px-1 text-sm"
            style="border-bottom: 1.5px dashed var(--chalk-line2)">
            <span class="flex-1 flex items-center justify-between gap-2">
              <span style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-gold)">
                {{ entry.player.name }}
                <span class="text-[13px]" style="color: var(--chalk-faint2)">#{{ history.length - index }}</span>
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
          </div>
        </div>
      </aside>
    </div>

    <!-- Modal Règles -->
    <div v-if="showRulesModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="chalk-grain rounded-2xl p-6 xl:p-8 border-2 border-dashed max-w-lg mx-4 max-h-[80vh] overflow-y-auto chalk-scroll"
        style="background: radial-gradient(120% 80% at 50% 0%, #1e2e28, var(--chalk-bg) 70%); border-color: var(--chalk-line)">
        <h3 class="text-2xl text-center mb-4" style="font-family: var(--font-display); color: var(--chalk-gold)">RÈGLES DU KILLER</h3>
        <div class="space-y-3 text-[22px] leading-relaxed" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
          <p><span style="color: var(--chalk-cream)">But du jeu :</span> Être le dernier joueur en vie. Chaque joueur a 3 vies.</p>
          <p><span style="color: var(--chalk-cream)">Phase 1 - Attribution :</span> Chaque joueur lance une fléchette pour obtenir son numéro cible.</p>
          <p><span style="color: var(--chalk-cream)">Phase 2 - Devenir Killer :</span> Touche le double de ton numéro pour devenir "Killer".</p>
          <p><span style="color: var(--chalk-cream)">Phase 3 - Élimination :</span> Une fois Killer, touche le double des autres joueurs pour leur retirer une vie.</p>
          <p><span style="color: var(--chalk-cream)">Victoire :</span> Le dernier joueur avec des vies restantes gagne.</p>
          <p><span style="color: var(--chalk-cream)">3 fléchettes par tour.</span></p>
        </div>
        <div class="flex justify-center mt-5">
          <button @click="showRulesModal = false" class="chalk-btn-ghost">Compris !</button>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation Reset -->
    <div v-if="showResetModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="chalk-grain rounded-2xl p-8 border-2 border-dashed max-w-md mx-4"
        style="background: radial-gradient(120% 80% at 50% 0%, #1e2e28, var(--chalk-bg) 70%); border-color: var(--chalk-line)">
        <h3 class="text-2xl text-center mb-4" style="font-family: var(--font-display); color: var(--chalk-red)">CONFIRMER LE RESET</h3>
        <p class="text-center mb-6" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
          Remettre a zero la partie ? <br><span style="color: var(--chalk-red)">Cette action est irreversible.</span></p>
        <div class="flex gap-3 justify-center">
          <button @click="showResetModal = false" class="chalk-btn-ghost">Annuler</button>
          <button @click="resetGame" class="chalk-btn-red">Reset</button>
        </div>
      </div>
    </div>

    <!-- Modal de victoire -->
    <div v-if="showWinnerModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="chalk-grain rounded-2xl p-8 border-2 border-solid max-w-lg mx-4 text-center"
        style="background: radial-gradient(120% 80% at 50% 0%, #1e2e28, var(--chalk-bg) 70%); border-color: var(--chalk-gold)">
        <div class="text-5xl mb-4">&#127881;</div>
        <h2 class="text-4xl mb-4" style="font-family: var(--font-display); color: var(--chalk-gold)">VICTOIRE !</h2>
        <div class="mb-6">
          <div class="text-2xl mb-2" style="font-family: var(--font-hand); font-weight: 700">{{ winner?.name }}</div>
          <div style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">est le dernier survivant !</div>
        </div>

        <div class="rounded-xl p-4 mb-6" style="background: rgba(134,199,160,0.1); border: 2px dashed var(--chalk-green)">
          <div class="grid grid-cols-2 gap-4 text-center">
            <div>
              <div class="text-2xl" style="font-family: var(--font-display); color: var(--chalk-green)">{{ winner?.lives }}/3</div>
              <div class="text-sm" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">Vies restantes</div>
            </div>
            <div>
              <div class="text-2xl" style="font-family: var(--font-display); color: var(--chalk-green)">{{ getPlayerKills(winner) }}</div>
              <div class="text-sm" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">Eliminations</div>
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
.killer-num-btn {
  font-family: var(--font-display); font-size: 22px;
  background: transparent; border: 2px dashed var(--chalk-line);
  border-radius: 12px; padding: 10px 0; cursor: pointer;
  color: var(--chalk-cream); transition: all 0.2s;
}
.killer-num-btn:not(:disabled):hover {
  border-color: var(--chalk-gold);
  background: rgba(236,198,106,0.08);
  color: var(--chalk-gold);
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

export default {
  name: "Killer",
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
      isFullscreen: false,
      showRulesModal: false,
      showResetModal: false,
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

    addKeyboardListener() {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
          this.undo();
        }
      });
    },

    isNumberTaken(n) {
      return this.gamePlayers.some(p => p.number === n);
    },

    assignNumber(n) {
      this.gamePlayers[this.setupPlayerIndex].number = n;
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
