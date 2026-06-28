<template>
  <div class="flex flex-col gap-3 xl:gap-5">
    <!-- Cartes joueurs -->
    <div :class="['grid gap-2 pt-3 xl:gap-5 xl:pt-4 grid-cols-1 md:grid-cols-2',
      players.length === 3 ? 'xl:grid-cols-3' : players.length >= 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-2']">
      <div v-for="(p, i) in players" :key="p.id"
        class="relative rounded-[14px] p-2.5 xl:p-5 transition-all duration-300"
        :style="cardStyle(p, i)">
        <div v-if="p.active && !state.finished" class="card-badge" style="background: var(--chalk-gold); color: var(--chalk-bg)">À JOUER</div>
        <div v-if="p.eliminated" class="card-badge" style="background: var(--chalk-red); color: var(--chalk-bg)">ÉLIMINÉ</div>
        <div v-if="p.winner" class="card-badge" style="background: var(--chalk-green); color: var(--chalk-bg)">GAGNANT</div>
        <div class="flex items-center gap-3 xl:block xl:text-center">
          <h3 :class="['text-base xl:text-[26px] xl:mb-3 shrink-0', p.eliminated ? 'line-through' : '']"
            :style="{ fontFamily: 'var(--font-hand)', fontWeight: 600, color: p.eliminated ? 'var(--chalk-faint2)' : 'var(--chalk-cream)' }">{{ p.name }}</h3>
          <div class="shrink-0 xl:mb-3">
            <div class="text-2xl xl:text-[56px] leading-none xl:mb-1" :style="{ fontFamily: 'var(--font-display)', color: scoreColor(p.score) }">{{ p.score }}</div>
            <div class="hidden xl:block text-[13px] uppercase tracking-wider" style="color: var(--chalk-faint2)">Points</div>
          </div>
          <div class="flex gap-1.5 xl:justify-center xl:gap-2 shrink-0">
            <div v-for="d in 3" :key="d" class="w-2.5 h-2.5 xl:w-3.5 xl:h-3.5 rounded-full transition-all duration-300"
              :style="{ background: dartFilled(p, d) ? 'var(--chalk-gold)' : 'var(--chalk-line2)' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Saisir le score -->
    <div class="rounded-[14px] p-3 xl:p-5" style="border: 2px dashed var(--chalk-line)">
      <div class="text-center mb-3 xl:mb-5">
        <div class="text-sm xl:text-base" style="font-family: var(--font-display); letter-spacing: 0.5px; color: var(--chalk-faint)">
          Round {{ state.round }}/{{ state.rounds }} &mdash; Cible :
          <span style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-gold); font-size: 2.5em; vertical-align: middle">{{ targetLabel }}</span>
          <span class="text-[17px]" style="color: var(--chalk-faint2)">(+{{ gain }} / -{{ gain }} pts)</span>
        </div>
        <div class="text-2xl xl:text-4xl mt-1" style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-cream)">{{ activeName }}</div>
        <div class="flex gap-1.5 justify-center mt-2">
          <div v-for="d in 3" :key="d" class="w-2.5 h-2.5 xl:w-3.5 xl:h-3.5 rounded-full"
            :style="{ background: !state.finished && d <= state.dartsLeft ? 'var(--chalk-gold)' : 'var(--chalk-line2)' }"></div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 xl:flex xl:flex-wrap xl:gap-3 xl:justify-center">
        <button @click="hit" :disabled="state.finished" class="b27-action-btn"
          :style="{ opacity: state.finished ? 0.4 : 1, cursor: state.finished ? 'not-allowed' : 'pointer', color: 'var(--chalk-green)', borderColor: 'var(--chalk-green)' }">
          Double {{ targetN }} touché !
        </button>
        <button @click="miss" :disabled="state.finished" class="b27-action-btn"
          :style="{ opacity: state.finished ? 0.4 : 1, cursor: state.finished ? 'not-allowed' : 'pointer', color: 'var(--chalk-red)', borderColor: 'var(--chalk-red)' }">
          Manqu&eacute;
        </button>
      </div>
    </div>
  </div>
</template>

<script>
/* Board contract (every remote board follows this):
   props: { state: Object (reducer state), game: Object (reducer module: .meta/.selectors) }
   emits: 'throw' (the game-specific dart). undo/reset/back are handled by RemoteGameShell. */
const BULL = 25
export default {
  name: 'Bobs27Board',
  props: { state: { type: Object, required: true }, game: { type: Object, required: true } },
  emits: ['throw'],
  computed: {
    activeId() { return this.game.selectors.activePlayerId(this.state) },
    activeName() {
      const p = this.state.players.find((pl) => pl.id === this.activeId)
      return p ? p.name : ''
    },
    // Round target: Double N (N = round for rounds 1..20, Bull at round 21).
    targetN() { return this.state.round >= this.state.rounds ? BULL : this.state.round },
    targetLabel() { return this.targetN === BULL ? 'D Bulle' : 'D' + this.targetN },
    gain() { return this.targetN * 2 },
    players() {
      return this.state.players.map((p) => ({
        id: p.id, name: p.name,
        score: this.state.scores[p.id],
        eliminated: this.state.eliminated[p.id],
        active: p.id === this.activeId,
        winner: this.state.winnerId === p.id,
      }))
    },
  },
  methods: {
    cardStyle(p) {
      const border = p.eliminated
        ? '2px dashed var(--chalk-red)'
        : p.active && !this.state.finished
          ? '2px solid var(--chalk-gold)'
          : p.winner
            ? '2px solid var(--chalk-green)'
            : '2px dashed var(--chalk-line)'
      const bg = p.eliminated
        ? 'rgba(239,139,111,0.06)'
        : p.active && !this.state.finished
          ? 'rgba(236,198,106,0.07)'
          : p.winner
            ? 'rgba(134,199,160,0.07)'
            : 'transparent'
      return { border, background: bg, opacity: p.eliminated ? 0.55 : 1 }
    },
    scoreColor(s) { return s <= 0 ? 'var(--chalk-red)' : s < 27 ? 'var(--chalk-gold)' : 'var(--chalk-cream)' },
    // Dart dots per card: the active player shows darts left in the current
    // turn; everyone else's turn is "full" (3 darts), matching the classic
    // where dartsLeft resets to 3 between turns. Eliminated cards stay empty.
    dartFilled(p, d) {
      if (p.eliminated) return false
      if (p.active) return !this.state.finished && d <= this.state.dartsLeft
      return true
    },
    hit() { if (!this.state.finished) this.$emit('throw', { hit: true }) },
    miss() { if (!this.state.finished) this.$emit('throw', { miss: true }) },
  },
}
</script>

<style scoped>
.card-badge { position: absolute; top: -10px; right: 8px; padding: 1px 10px; border-radius: 9999px; font-family: var(--font-hand); font-weight: 700; font-size: 11px; }
.b27-action-btn {
  font-family: var(--font-display); letter-spacing: 0.5px; font-size: 22px;
  background: transparent; border: 2px solid; border-radius: 14px;
  padding: 16px 0; line-height: 1.1; transition: all 0.2s;
}
.b27-action-btn:hover:not(:disabled) { background: rgba(241,230,203,0.06); }
</style>
