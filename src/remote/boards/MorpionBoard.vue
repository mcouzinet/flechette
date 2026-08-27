<template>
  <div class="flex flex-col gap-3 xl:gap-5">
    <!-- Cartes joueurs -->
    <div class="grid gap-2 pt-3 xl:gap-5 xl:pt-4 grid-cols-2">
      <div v-for="(p, i) in players" :key="p.id"
        class="relative rounded-[14px] p-2.5 xl:p-5 text-center transition-all duration-300"
        :style="cardStyle(p, i)">
        <div v-if="p.active && !state.finished" class="card-badge"
          :style="{ background: 'var(--chalk-bg)', border: '1.5px dashed var(--chalk-line)', color: markColor(i) }">À JOUER</div>
        <div v-if="p.winner" class="card-badge"
          style="background: var(--chalk-bg); border: 1.5px solid var(--chalk-gold); color: var(--chalk-gold)">GAGNANT</div>
        <h3 class="text-base xl:text-[26px] leading-none mb-1.5 xl:mb-2" style="font-family: var(--font-hand); font-weight: 700">{{ p.name }}</h3>
        <div class="text-3xl xl:text-[48px] leading-none mb-1" :style="{ fontFamily: 'var(--font-display)', color: markColor(i) }">{{ MARKS[i] }}</div>
        <div class="text-[15px] xl:text-[16px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">
          {{ p.cells }} case{{ p.cells > 1 ? 's' : '' }}
        </div>
      </div>
    </div>

    <!-- Grille de morpion -->
    <div class="rounded-[14px] p-3 xl:p-5" style="border: 2px dashed var(--chalk-line)">
      <h3 class="text-base xl:text-[22px] mb-3 xl:mb-5 text-center" style="font-family: var(--font-display); letter-spacing: 0.5px">TOUCHEZ UNE CASE</h3>

      <div class="flex justify-center">
        <div class="morpion-grid max-w-[420px] w-full">
          <button v-for="(cell, index) in cells" :key="index"
            @click="claimCell(index)"
            :disabled="cell.owner !== null || state.finished"
            class="morpion-cell aspect-square flex flex-col items-center justify-center gap-1 relative"
            :class="[
              cell.owner !== null ? 'morpion-cell--claimed' : '',
              isWinningCell(index) ? 'morpion-cell--win' : '',
              state.finished && cell.owner === null ? 'morpion-cell--disabled' : ''
            ]"
            :style="{
              borderRight: index % 3 !== 2 ? '2px dashed var(--chalk-line)' : 'none',
              borderBottom: index < 6 ? '2px dashed var(--chalk-line)' : 'none'
            }">
            <div class="text-[16px] xl:text-[18px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">{{ cell.number }}</div>
            <div v-if="cell.owner !== null" class="text-[40px] md:text-[52px] leading-none" style="font-family: var(--font-display)"
              :style="{ color: markColor(cell.owner) }">
              {{ MARKS[cell.owner] }}
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Controles de jeu : numero touche + grille alternative (mirroir du classique) -->
    <div v-if="!state.finished" class="rounded-[14px] p-3 xl:p-5" style="border: 2px dashed var(--chalk-line); background: rgba(241,230,203,0.03)">
      <div class="text-center mb-3 xl:mb-4">
        <div class="text-sm xl:text-base" style="font-family: var(--font-display); letter-spacing: 0.5px; color: var(--chalk-faint)">
          Selectionnez le numero touche
        </div>
        <div v-if="currentPlayer" class="text-2xl xl:text-4xl mt-1" style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-cream)">
          {{ currentPlayer.name }}
          <span :style="{ color: markColor(currentPlayer.index) }">({{ MARKS[currentPlayer.index] }})</span>
        </div>
      </div>

      <!-- Grille de numeros alternatifs -->
      <div class="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
        <button v-for="(cell, index) in cells" :key="index"
          @click="claimCell(index)"
          :disabled="cell.owner !== null || state.finished"
          class="morpion-num-btn h-[52px] xl:h-[58px] rounded-[14px] text-[20px] xl:text-[22px]"
          :class="cell.owner !== null ? 'morpion-num-btn--taken' : ''"
          style="font-family: var(--font-display); letter-spacing: 0.5px">
          {{ cell.number }}
        </button>
      </div>
    </div>

    <!-- Message match nul -->
    <div v-if="state.draw" class="rounded-[14px] p-5 text-center" style="border: 2px dashed var(--chalk-line); background: rgba(241,230,203,0.03)">
      <div class="text-[36px] mb-3 opacity-60">&#9876;</div>
      <h3 class="text-[24px] mb-2" style="font-family: var(--font-display); color: var(--chalk-gold)">MATCH NUL !</h3>
      <p style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">Aucun joueur n'a réussi à aligner 3 cases.</p>
    </div>
  </div>
</template>

<script>
/* Board contract (every remote board follows this):
   props: { state: Object (reducer state), game: Object (reducer module: .meta/.selectors) }
   emits: 'throw' (the game-specific dart). undo/reset/back are handled by RemoteGameShell. */
const MARKS = ['✕', '◯'] // player index -> mark (matches morpion reducer)

export default {
  name: 'MorpionBoard',
  props: { state: { type: Object, required: true }, game: { type: Object, required: true } },
  emits: ['throw'],
  data() {
    return { MARKS }
  },
  computed: {
    board() {
      return this.game.selectors.board(this.state)
    },
    cells() {
      return this.board.cells
    },
    winningLine() {
      return this.board.winningLine
    },
    players() {
      const active = this.game.selectors.activePlayerId(this.state)
      return this.state.players.map((p, i) => ({
        id: p.id,
        name: p.name,
        cells: this.cells.filter((c) => c.owner === i).length,
        active: p.id === active,
        winner: this.state.winnerId === p.id,
      }))
    },
    // player whose turn it is (null once the game is finished), for the controls header
    currentPlayer() {
      const active = this.game.selectors.activePlayerId(this.state)
      if (active == null) return null
      const index = this.state.players.findIndex((p) => p.id === active)
      return index < 0 ? null : { name: this.state.players[index].name, index }
    },
  },
  methods: {
    markColor(i) {
      return i === 0 ? 'var(--chalk-red)' : 'var(--chalk-green)'
    },
    cardStyle(p, i) {
      const border = p.winner
        ? '2px solid var(--chalk-gold)'
        : p.active && !this.state.finished
          ? `2px solid ${this.markColor(i)}`
          : '2px dashed var(--chalk-line)'
      const bg = p.winner
        ? 'rgba(236,198,106,0.07)'
        : p.active && !this.state.finished
          ? `rgba(${i === 0 ? '239,139,111' : '134,199,160'},0.07)`
          : 'transparent'
      return { border, background: bg }
    },
    isWinningCell(index) {
      return Array.isArray(this.winningLine) && this.winningLine.includes(index)
    },
    claimCell(index) {
      if (this.state.finished || this.cells[index].owner !== null) return
      this.$emit('throw', { cell: index })
    },
  },
}
</script>

<style scoped>
.morpion-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
.morpion-cell {
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}
.morpion-cell:not(.morpion-cell--claimed):not(.morpion-cell--disabled):hover {
  background: rgba(241, 230, 203, 0.06);
}
.morpion-cell--claimed {
  cursor: default;
}
.morpion-cell--win {
  box-shadow: inset 0 0 0 3px var(--chalk-gold), 0 0 16px rgba(236, 198, 106, 0.2);
  background: rgba(236, 198, 106, 0.06) !important;
}
.morpion-cell--disabled {
  opacity: 0.35;
  cursor: not-allowed !important;
}

/* Number buttons (alternative claim path, mirrors the classic) */
.morpion-num-btn {
  background: transparent;
  border: 2px dashed var(--chalk-line);
  color: var(--chalk-cream);
  cursor: pointer;
  transition: all 0.2s;
}
.morpion-num-btn:not(.morpion-num-btn--taken):hover {
  border-color: var(--chalk-gold);
  background: rgba(236, 198, 106, 0.08);
  color: var(--chalk-gold);
}
.morpion-num-btn--taken {
  opacity: 0.2;
  cursor: not-allowed;
  border-style: dashed;
  color: var(--chalk-faint2);
}
.card-badge {
  position: absolute;
  top: -10px;
  right: 8px;
  padding: 1px 10px;
  border-radius: 9999px;
  font-family: var(--font-hand);
  font-weight: 700;
  font-size: 11px;
}
</style>
