<template>
  <div class="chalk-grain"
    style="font-family: var(--font-ui); color: var(--chalk-cream); height: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column; background: radial-gradient(130% 90% at 50% -10%, #20322b, #142019 72%)">
    <!-- Cadre -->
    <div style="position: absolute; inset: 9px; border: 2px solid var(--chalk-line); border-radius: 12px; pointer-events: none; opacity: 0.5"></div>

    <!-- Header -->
    <header class="flex flex-wrap items-center justify-between gap-3 px-5 pt-3 pb-2 relative" style="border-bottom: 2px dashed var(--chalk-line); margin: 9px 9px 0">
      <button @click="$parent.currentComponent = null" class="chalk-btn-ghost text-base xl:text-[21px]">&#8249; Retour</button>
      <div class="flex items-baseline gap-3 min-w-0">
        <span class="text-xl xl:text-[28px]" style="font-family: var(--font-display); letter-spacing: 0.5px">SHANGHAI</span>
        <span class="text-[19px] whitespace-nowrap hidden xl:inline" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-gold)">20 rounds &middot; simple &middot; double &middot; triple</span>
      </div>
      <div class="flex gap-2 flex-none">
        <button @click="showRulesModal = true" class="chalk-btn-ghost text-base xl:text-[21px]">? R&egrave;gles</button>
        <button @click="toggleFullscreen" class="chalk-btn-ghost text-base xl:text-[21px] hidden xl:block">{{ isFullscreen ? 'Quitter' : '&#9974; Plein &eacute;cran' }}</button>
        <button @click="confirmReset" class="chalk-btn-green text-base xl:text-[21px]">&#8635; Relancer</button>
      </div>
    </header>

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
          <button @click="undoLastScore" :class="history.length ? 'chalk-btn-red' : 'chalk-btn-ghost'" :disabled="history.length === 0">&#8630; Annuler</button>
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

        <!-- Historique -->
        <div class="flex items-center justify-between mt-1">
          <span class="text-[19px]" style="font-family: var(--font-display); letter-spacing: 0.5px">L'HISTORIQUE</span>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5 chalk-scroll">
          <div v-if="history.length === 0" class="m-auto text-center py-6 text-[20px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">
            <div class="text-[30px] opacity-50">&#9998;</div>
            Aucun coup jou&eacute;...<br>l'historique s'affichera ici.
          </div>
          <div v-for="(entry, index) in [...history].reverse()" :key="index"
            class="flex items-center gap-3 py-1.5 px-1"
            style="border-bottom: 1.5px dashed var(--chalk-line2)">
            <span class="flex-1 text-[16px]" style="font-family: var(--font-hand); font-weight: 600">
              <b>{{ entry.player.name }}</b>
              <span style="color: var(--chalk-faint2)"> &middot; R{{ entry.round }}</span>
            </span>
            <span class="text-[22px] leading-none min-w-[48px] h-[48px] flex items-center justify-center rounded-full"
              style="font-family: var(--font-display); border: 2px dashed var(--chalk-line)">
              {{ entry.score }}
            </span>
          </div>
        </div>
      </aside>
    </div>

    <!-- Modal Règles -->
    <div v-if="showRulesModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="chalk-grain rounded-2xl p-6 xl:p-8 border-2 border-dashed max-w-lg mx-4 max-h-[80vh] overflow-y-auto chalk-scroll"
        style="background: radial-gradient(120% 80% at 50% 0%, #1e2e28, var(--chalk-bg) 70%); border-color: var(--chalk-line)">
        <h3 class="text-2xl text-center mb-4" style="font-family: var(--font-display); color: var(--chalk-gold)">R&Egrave;GLES DU SHANGHAI</h3>
        <div class="space-y-3 text-[22px] leading-relaxed" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
          <p><span style="color: var(--chalk-cream)">But du jeu :</span> Marquer le plus de points en 20 rounds, ou r&eacute;aliser un Shanghai pour gagner instantan&eacute;ment.</p>
          <p><span style="color: var(--chalk-cream)">D&eacute;roulement :</span> Chaque round, on vise le num&eacute;ro du round (round 1 = cible 1, round 2 = cible 2, etc.).</p>
          <p><span style="color: var(--chalk-cream)">Scoring :</span> Simple = valeur du num&eacute;ro, Double = x2, Triple = x3. Manqu&eacute; = 0 point.</p>
          <p><span style="color: var(--chalk-cream)">Shanghai :</span> Toucher le simple + double + triple du m&ecirc;me num&eacute;ro dans un m&ecirc;me round = victoire imm&eacute;diate !</p>
          <p><span style="color: var(--chalk-cream)">Fin de partie :</span> Apr&egrave;s 20 rounds, le joueur avec le plus de points gagne (sauf Shanghai).</p>
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
          Remettre &agrave; z&eacute;ro la partie ? <br><span style="color: var(--chalk-red)">Cette action est irr&eacute;versible.</span></p>
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
          <div v-if="isShangaiWin" class="text-lg mb-2" style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-gold)">SHANGHAI !</div>
          <div style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">a remport&eacute; la partie !</div>
        </div>

        <!-- Statistiques du gagnant -->
        <div class="rounded-xl p-4 mb-6" style="background: rgba(134,199,160,0.1); border: 2px dashed var(--chalk-green)">
          <div v-if="isShangaiWin" class="text-center mb-3">
            <div class="text-lg mb-1" style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-gold)">Shanghai au Round {{ shangaiRound }}</div>
            <div class="text-sm" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">Simple + Double + Triple du {{ shangaiRound }}</div>
          </div>
          <div class="text-2xl font-bold" style="color: var(--chalk-green)">{{ winner?.totalScore }}</div>
          <div class="text-sm" style="color: var(--chalk-faint2)">Points marqu&eacute;s au total</div>
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

export default {
  name: "Shanghai",
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
      isFullscreen: false,
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