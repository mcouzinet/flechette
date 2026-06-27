<template>
  <div class="flex flex-col gap-3 xl:gap-5">
    <!-- Controles de jeu / entete manche -->
    <div class="rounded-[14px] p-3 xl:p-5" style="border: 2px dashed var(--chalk-line); background: transparent">
      <div class="text-center mb-3 xl:mb-4">
        <div class="text-sm xl:text-base" style="font-family: var(--font-display); letter-spacing: 0.5px; color: var(--chalk-faint)">
          Manche {{ state.inning }}/{{ state.innings }} &mdash; Cible :
          <span style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-gold); font-size: 2.5em; vertical-align: middle">{{ state.inning }}</span>
        </div>
        <div class="text-3xl xl:text-4xl" style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-gold)">
          {{ activePlayer?.name }}
        </div>
        <div class="flex gap-1.5 justify-center mt-1">
          <div v-for="dart in 3" :key="dart"
            class="w-2.5 h-2.5 xl:w-3.5 xl:h-3.5 rounded-full"
            :style="{ background: dart <= dartsLeft ? 'var(--chalk-gold)' : 'var(--chalk-line2)' }">
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 xl:flex xl:flex-wrap xl:gap-3 xl:justify-center">
        <button @click="addRuns(1)" :disabled="state.finished" class="bb-action-btn"
          :style="{ color: 'var(--chalk-green)', borderColor: 'var(--chalk-green)', opacity: state.finished ? 0.4 : 1, cursor: state.finished ? 'not-allowed' : 'pointer' }">Simple</button>
        <button @click="addRuns(2)" :disabled="state.finished" class="bb-action-btn"
          :style="{ color: 'var(--chalk-gold)', borderColor: 'var(--chalk-gold)', opacity: state.finished ? 0.4 : 1, cursor: state.finished ? 'not-allowed' : 'pointer' }">Double</button>
        <button @click="addRuns(3)" :disabled="state.finished" class="bb-action-btn"
          :style="{ color: 'var(--chalk-red)', borderColor: 'var(--chalk-red)', opacity: state.finished ? 0.4 : 1, cursor: state.finished ? 'not-allowed' : 'pointer' }">Triple</button>
        <button @click="addRuns(0)" :disabled="state.finished" class="bb-action-btn"
          :style="{ color: 'var(--chalk-faint)', borderColor: 'var(--chalk-faint)', borderStyle: 'dashed', opacity: state.finished ? 0.4 : 1, cursor: state.finished ? 'not-allowed' : 'pointer' }">Manqu&eacute;</button>
      </div>
    </div>

    <!-- Tableau des manches -->
    <div class="overflow-x-auto chalk-scroll">
      <table class="w-full" style="border-collapse: separate; border-spacing: 0">
        <thead>
          <tr>
            <th class="text-left px-2 py-1.5 xl:p-2 text-[13px] xl:text-sm whitespace-nowrap"
              style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2); border-bottom: 2px dashed var(--chalk-line)"></th>
            <th v-for="(row, idx) in board.rows" :key="row.id"
              class="text-center px-2 py-2 xl:p-2 text-base xl:text-lg whitespace-nowrap"
              style="font-family: var(--font-hand); font-weight: 600; border-bottom: 2px dashed var(--chalk-line)"
              :style="{ color: idx === state.currentPlayerIndex && !state.finished ? 'var(--chalk-gold)' : 'var(--chalk-faint2)' }">
              {{ row.name }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inning in board.innings" :key="inning"
            :style="{ background: inning === state.inning && !state.finished ? 'rgba(236,198,106,0.06)' : 'transparent' }">
            <td class="px-2 py-1.5 xl:p-2 text-base xl:text-lg"
              style="border-bottom: 1px dashed var(--chalk-line2)"
              :style="{ fontFamily: 'var(--font-display)', color: inning === state.inning && !state.finished ? 'var(--chalk-gold)' : 'var(--chalk-faint)' }">
              {{ inning }}
            </td>
            <td v-for="(row, idx) in board.rows" :key="row.id"
              class="text-center px-2 py-1.5 xl:p-2 text-lg xl:text-xl"
              style="border-bottom: 1px dashed var(--chalk-line2)">
              <span v-if="played(idx, inning)"
                :style="{ fontFamily: 'var(--font-hand)', fontWeight: 600, color: row.scores[inning - 1] > 0 ? 'var(--chalk-green)' : 'var(--chalk-faint2)' }">
                {{ row.scores[inning - 1] }}
              </span>
              <span v-else style="color: var(--chalk-line2)">&middot;</span>
            </td>
          </tr>
          <tr style="border-top: 2px dashed var(--chalk-line)">
            <td class="px-2 py-2 xl:p-2 text-base xl:text-lg" style="font-family: var(--font-display); letter-spacing: 0.5px">Total</td>
            <td v-for="row in board.rows" :key="row.id"
              class="text-center px-2 py-2 xl:p-2 text-xl xl:text-2xl"
              style="font-family: var(--font-display); color: var(--chalk-gold)">
              {{ row.total }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
/* Board contract (every remote board follows this):
   props: { state: Object (reducer state), game: Object (reducer module: .meta/.selectors) }
   emits: 'throw' (the game-specific dart). undo/reset/back are handled by RemoteGameShell.

   Baseball: four buttons (Simple/Double/Triple/Manqué) emit { runs: 1|2|3|0 } —
   the runs scored on the inning's target. The scoreboard reproduces the classic
   innings table (innings 1..9 x players + total), driven by state.inningScores via
   the game's inningScores selector. */
export default {
  name: 'BaseballBoard',
  props: { state: { type: Object, required: true }, game: { type: Object, required: true } },
  emits: ['throw'],
  computed: {
    board() {
      return this.game.selectors.inningScores(this.state)
    },
    activePlayer() {
      const id = this.game.selectors.activePlayerId(this.state)
      return this.state.players.find((p) => p.id === id) || null
    },
    dartsLeft() {
      return this.state.finished ? 0 : this.state.dartsLeft
    },
  },
  methods: {
    // A cell [player idx][inning] is "played" once that player's turn for the
    // inning is over (matches the classic: cell stays · until the turn ends).
    played(idx, inning) {
      const s = this.state
      if (s.finished) return true
      if (inning < s.inning) return true
      if (inning > s.inning) return false
      // current inning: players before the active one have finished;
      // others (incl. the active player, even mid-turn) have not.
      return idx < s.currentPlayerIndex
    },
    addRuns(runs) {
      if (this.state.finished) return
      this.$emit('throw', { runs })
    },
  },
}
</script>

<style scoped>
.bb-action-btn {
  font-family: var(--font-display); letter-spacing: 0.5px; font-size: 22px;
  background: transparent; border: 2px solid; border-radius: 14px;
  padding: 16px 0; line-height: 1.1; transition: all 0.2s;
}
.bb-action-btn:not(:disabled):hover {
  background: rgba(241,230,203,0.06);
}
</style>
