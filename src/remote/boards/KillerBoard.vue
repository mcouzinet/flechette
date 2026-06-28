<template>
  <div class="flex flex-col gap-3 xl:gap-5">
    <!-- ============================================================
         PHASE SETUP — attribution des numéros
         ============================================================ -->
    <template v-if="state.phase === 'setup'">
      <!-- Titre + sous-titre de la phase (zone principale) -->
      <div class="pt-1 xl:pt-2">
        <div class="text-xl xl:text-[26px] text-center mb-1 xl:mb-2"
          style="font-family: var(--font-display); letter-spacing: 0.5px; color: var(--chalk-gold)">
          ATTRIBUTION DES NUMÉROS
        </div>
        <p class="text-center text-[16px] xl:text-[19px]"
          style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
          Chaque joueur lance une fléchette pour obtenir son numéro cible.
        </p>
      </div>

      <!-- Cartes joueurs (gros numéro / point d'interrogation) -->
      <div :class="['grid gap-2 pt-1 xl:gap-5 xl:pt-2 grid-cols-1 md:grid-cols-2',
        players.length === 3 ? 'xl:grid-cols-3' : players.length >= 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-2']">
        <div v-for="p in players" :key="p.id"
          class="relative rounded-[14px] p-2.5 xl:p-5 transition-all duration-300"
          :style="setupCardStyle(p)">
          <!-- Badge "À LANCER" pour le joueur actif sans numéro -->
          <div v-if="p.active && p.number == null" class="card-badge"
            style="background: var(--chalk-gold); color: var(--chalk-bg)">
            À LANCER
          </div>

          <div class="text-center">
            <h3 class="text-base xl:text-[26px] mb-2 xl:mb-3"
              style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-cream)">
              {{ p.name }}
            </h3>
            <div v-if="p.number != null" class="text-4xl xl:text-[48px] leading-none"
              style="font-family: var(--font-display); color: var(--chalk-green)">
              {{ p.number }}
            </div>
            <div v-else class="text-4xl xl:text-[48px] leading-none"
              style="font-family: var(--font-display); color: var(--chalk-faint2)">?</div>
          </div>
        </div>
      </div>

      <!-- Sélecteur de numéro -->
      <div v-if="!state.finished" class="rounded-[14px] p-3 xl:p-5"
        style="border: 2px dashed var(--chalk-line); background: rgba(241,230,203,0.03)">
        <div class="text-center mb-3 xl:mb-4">
          <div class="text-sm xl:text-base" style="font-family: var(--font-display); letter-spacing: 0.5px; color: var(--chalk-faint)">
            Choisir le numéro touché
          </div>
          <div class="text-2xl xl:text-4xl mt-1" style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-cream)">
            {{ activePlayer?.name }}
          </div>
        </div>
        <div class="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-1.5 xl:gap-2">
          <button v-for="n in 20" :key="n" @click="assign(n)" :disabled="isTaken(n)" class="kl-num-btn"
            :style="{
              opacity: isTaken(n) ? 0.25 : 1,
              cursor: isTaken(n) ? 'not-allowed' : 'pointer',
              borderColor: isTaken(n) ? 'var(--chalk-line2)' : 'var(--chalk-line)',
              color: isTaken(n) ? 'var(--chalk-faint2)' : 'var(--chalk-cream)'
            }">
            {{ n }}
          </button>
        </div>
      </div>
    </template>

    <!-- ============================================================
         PHASE JEU — devenir killer / éliminer les autres
         ============================================================ -->
    <template v-else>
      <!-- Cartes joueurs -->
      <div :class="['grid gap-2 pt-1 xl:gap-5 xl:pt-2 grid-cols-1 md:grid-cols-2',
        aliveCount === 3 ? 'xl:grid-cols-3' : aliveCount >= 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-2']">
        <div v-for="p in players" :key="p.id"
          class="relative rounded-[14px] p-2.5 xl:p-5 transition-all duration-300"
          :style="cardStyle(p)">
          <!-- Badges -->
          <div v-if="p.winner" class="card-badge" style="background: var(--chalk-gold); color: var(--chalk-bg)">&#9813; GAGNANT</div>
          <div v-else-if="p.eliminated" class="card-badge" style="background: var(--chalk-red); color: var(--chalk-bg)">ÉLIMINÉ</div>
          <div v-else-if="p.active && !state.finished" class="card-badge"
            style="background: var(--chalk-gold); color: var(--chalk-bg)">À JOUER</div>

          <div class="text-center">
            <h3 :class="['text-base xl:text-[26px] mb-1', p.eliminated ? 'line-through' : '']"
              :style="{ fontFamily: 'var(--font-hand)', fontWeight: 700, color: p.eliminated ? 'var(--chalk-faint2)' : 'var(--chalk-cream)' }">
              {{ p.name }}
            </h3>

            <!-- Numéro cible -->
            <div class="text-[15px] mb-2 xl:mb-3" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">
              Numéro : {{ p.number }}
            </div>

            <!-- Statut Killer (joueurs en vie) -->
            <div v-if="!p.eliminated" class="mb-2 xl:mb-3">
              <span v-if="p.isKiller" class="inline-block px-3 py-0.5 rounded-full text-[14px] xl:text-[17px]"
                style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-red); border: 2px solid var(--chalk-red); background: rgba(239,139,111,0.1)">
                KILLER
              </span>
              <span v-else class="inline-block px-3 py-0.5 rounded-full text-[14px] xl:text-[17px]"
                style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2); border: 2px dashed var(--chalk-line2)">
                En attente
              </span>
            </div>

            <!-- Vies -->
            <div class="flex justify-center gap-1.5 xl:gap-2 mb-2">
              <span v-for="life in 3" :key="life" class="text-[18px] xl:text-[20px] leading-none"
                :style="{ color: life <= p.lives ? 'var(--chalk-red)' : 'var(--chalk-line2)' }">&#10084;</span>
            </div>

            <!-- Fléchettes restantes (joueur actif) -->
            <div v-if="p.active && !p.eliminated && !state.finished"
              class="flex justify-center gap-1.5 xl:gap-2 mt-2 xl:mt-3">
              <div v-for="d in 3" :key="d" class="w-2.5 h-2.5 xl:w-3.5 xl:h-3.5 rounded-full transition-all duration-300"
                :style="{ background: d <= state.dartsLeft ? 'var(--chalk-gold)' : 'var(--chalk-line2)' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contrôles de jeu -->
      <div v-if="!state.finished" class="rounded-[14px] p-3 xl:p-5"
        style="border: 2px dashed var(--chalk-line); background: rgba(241,230,203,0.03)">
        <div class="text-center mb-3 xl:mb-4">
          <div class="text-sm xl:text-base" style="font-family: var(--font-display); letter-spacing: 0.5px">
            <span v-if="activePlayer && !activePlayer.isKiller" style="color: var(--chalk-faint)">
              Viser le
              <span style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-gold); font-size: 2.2em; vertical-align: middle">D{{ activePlayer.number }}</span>
            </span>
            <span v-else style="color: var(--chalk-red)">KILLER : élimine les autres !</span>
          </div>
          <div class="text-2xl xl:text-4xl mt-1" style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-cream)">
            {{ activePlayer?.name }}
          </div>
          <!-- Fléchettes restantes (rappel sous le nom, comme la version classique) -->
          <div class="flex gap-1.5 justify-center mt-2">
            <div v-for="d in 3" :key="d" class="w-2.5 h-2.5 xl:w-3.5 xl:h-3.5 rounded-full"
              :style="{ background: d <= state.dartsLeft ? 'var(--chalk-gold)' : 'var(--chalk-line2)' }"></div>
          </div>
        </div>

        <!-- Pas encore killer : devenir killer -->
        <div v-if="activePlayer && !activePlayer.isKiller" class="grid grid-cols-2 gap-2 xl:flex xl:flex-wrap xl:gap-3 xl:justify-center">
          <button @click="throwSelf" class="kl-action-btn" style="color: var(--chalk-red); border-color: var(--chalk-red)">
            Double {{ activePlayer.number }} touché !
          </button>
          <button @click="throwMiss" class="kl-action-btn" style="color: var(--chalk-faint); border-color: var(--chalk-faint); border-style: dashed">
            Manqu&eacute;
          </button>
        </div>

        <!-- Killer : choisir une cible -->
        <div v-else-if="activePlayer">
          <p class="text-center mb-3 xl:mb-4 text-[16px] xl:text-[18px]"
            style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
            Quel joueur visez-vous ?
          </p>
          <div class="grid grid-cols-1 gap-2 mb-3 xl:flex xl:flex-wrap xl:gap-3 xl:justify-center xl:mb-4">
            <button v-for="t in targets" :key="t.id" @click="throwTarget(t.id)" class="kl-action-btn"
              style="color: var(--chalk-red); border-color: var(--chalk-red)">
              {{ t.name }} (D{{ t.number }})
            </button>
          </div>
          <div class="flex justify-center">
            <button @click="throwMiss" class="kl-action-btn" style="color: var(--chalk-faint); border-color: var(--chalk-faint); border-style: dashed">
              Manqu&eacute;
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
/* Board contract (every remote board follows this):
   props: { state: Object (reducer state), game: Object (reducer module: .meta/.selectors) }
   emits: 'throw' (the game-specific dart). undo/reset/back are handled by RemoteGameShell.

   Killer has TWO phases (see remote/games/killer.js):
   - 'setup': the active player taps a free number 1..20 -> dart = { assign: n }.
     Numbers already in state.numbers are disabled.
   - 'game': read the ACTIVE player's board entry.
       * Not yet a killer -> "Double {own number} touché !" -> { self: true }.
       * Already a killer  -> one "{Name} (D{number})" per OTHER non-eliminated
                              player -> { target: <that id> }.
       Either branch also offers "Manqué" -> { miss: true }. */
export default {
  name: 'KillerBoard',
  props: { state: { type: Object, required: true }, game: { type: Object, required: true } },
  emits: ['throw'],
  computed: {
    activeId() {
      return this.game.selectors.activePlayerId(this.state)
    },
    // Per-player rows for the cards, enriched with the active flag.
    players() {
      const board = this.game.selectors.board(this.state)
      const active = this.activeId
      return board.map((p) => ({ ...p, active: p.id === active, winner: this.state.winnerId === p.id }))
    },
    // The board entry for whoever is currently up (setup or game phase).
    activePlayer() {
      return this.players.find((p) => p.id === this.activeId) || null
    },
    // Killer phase: every OTHER player still in the game is a valid target.
    targets() {
      if (!this.activePlayer) return []
      return this.players.filter((p) => p.id !== this.activePlayer.id && !p.eliminated)
    },
    // Survivors still in the game — drives the responsive card grid (matches classic).
    aliveCount() {
      return this.players.filter((p) => !p.eliminated).length
    },
  },
  methods: {
    isTaken(n) {
      return Object.values(this.state.numbers).includes(n)
    },
    // Setup-phase card: gold while it's this player's turn and they have no number,
    // green once a number is assigned, dashed otherwise (mirrors classic).
    setupCardStyle(p) {
      let border, bg
      if (p.active && p.number == null) {
        border = '2px solid var(--chalk-gold)'
        bg = 'rgba(236,198,106,0.07)'
      } else if (p.number != null) {
        border = '2px solid var(--chalk-green)'
        bg = 'rgba(134,199,160,0.07)'
      } else {
        border = '2px dashed var(--chalk-line)'
        bg = 'transparent'
      }
      return { border, background: bg }
    },
    // Game-phase card: winner gold, eliminated red-dashed, active gold, killer red, else dashed.
    cardStyle(p) {
      const live = p.active && !this.state.finished && !p.eliminated
      let border, bg
      if (p.winner) {
        border = '2px solid var(--chalk-gold)'
        bg = 'rgba(236,198,106,0.1)'
      } else if (p.eliminated) {
        border = '2px dashed var(--chalk-red)'
        bg = 'rgba(239,139,111,0.05)'
      } else if (live) {
        border = '2px solid var(--chalk-gold)'
        bg = 'rgba(236,198,106,0.07)'
      } else if (p.isKiller) {
        border = '2px solid var(--chalk-red)'
        bg = 'rgba(239,139,111,0.07)'
      } else {
        border = '2px dashed var(--chalk-line)'
        bg = 'transparent'
      }
      return { border, background: bg, opacity: p.eliminated ? 0.5 : 1 }
    },
    assign(n) {
      if (this.state.finished || this.isTaken(n)) return
      this.$emit('throw', { assign: n })
    },
    throwSelf() {
      if (this.state.finished) return
      this.$emit('throw', { self: true })
    },
    throwTarget(id) {
      if (this.state.finished) return
      this.$emit('throw', { target: id })
    },
    throwMiss() {
      if (this.state.finished) return
      this.$emit('throw', { miss: true })
    },
  },
}
</script>

<style scoped>
.card-badge { position: absolute; top: -10px; right: 8px; padding: 1px 10px; border-radius: 9999px; font-family: var(--font-hand); font-weight: 700; font-size: 11px; }
.kl-num-btn {
  height: 44px; border: 2px dashed var(--chalk-line); border-radius: 12px;
  font-family: var(--font-display); font-size: 19px; letter-spacing: 0.5px;
  cursor: pointer; transition: all 0.15s; background: transparent;
}
.kl-num-btn:not(:disabled):hover { background: rgba(236,198,106,0.08); border-color: var(--chalk-gold); color: var(--chalk-gold) !important; }
.kl-action-btn {
  font-family: var(--font-display); letter-spacing: 0.5px; font-size: 21px;
  background: transparent; border: 2px solid; border-radius: 14px;
  padding: 14px 0; cursor: pointer; line-height: 1.1; transition: all 0.2s;
}
.kl-action-btn:hover { background: rgba(241,230,203,0.06); }
@media (min-width: 1280px) {
  .kl-num-btn { height: 54px; font-size: 22px; }
  .kl-action-btn { padding: 16px 24px; }
}
</style>
