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
