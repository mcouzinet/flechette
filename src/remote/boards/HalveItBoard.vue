<template>
  <div class="flex flex-col gap-3 xl:gap-5">
    <!-- Cartes joueurs -->
    <div :class="['grid gap-2 pt-3 xl:gap-5 xl:pt-4 grid-cols-1 md:grid-cols-2',
      players.length === 3 ? 'xl:grid-cols-3' : players.length >= 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-2']">
      <div v-for="p in players" :key="p.id"
        class="relative rounded-[14px] p-2.5 xl:p-5 transition-all duration-300"
        :style="cardStyle(p)">
        <div v-if="p.active && !state.finished" class="card-badge" style="background: var(--chalk-gold); color: var(--chalk-bg)">À JOUER</div>
        <div v-if="p.winner" class="card-badge" style="background: var(--chalk-green); color: var(--chalk-bg)">GAGNANT</div>
        <div class="flex items-center gap-3 xl:block xl:text-center">
          <h3 class="text-base xl:text-[26px] xl:mb-3 shrink-0" style="font-family: var(--font-hand); font-weight: 600">{{ p.name }}</h3>
          <div class="shrink-0 xl:mb-3">
            <div class="text-2xl xl:text-[56px] leading-none xl:mb-1" style="font-family: var(--font-display); color: var(--chalk-cream)">{{ p.score }}</div>
            <div class="hidden xl:block text-[13px] uppercase tracking-wider" style="color: var(--chalk-faint2)">Points</div>
          </div>
          <div class="flex gap-1.5 xl:justify-center xl:gap-2 shrink-0">
            <div v-for="d in 3" :key="d" class="w-2.5 h-2.5 xl:w-3.5 xl:h-3.5 rounded-full"
              :style="{ background: (p.active && !state.finished ? d <= state.dartsLeft : false) ? 'var(--chalk-gold)' : 'var(--chalk-line2)' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cible courante + saisie -->
    <div v-if="!state.finished" class="rounded-[14px] p-3 xl:p-5" style="border: 2px dashed var(--chalk-line)">
      <div class="text-center mb-3 xl:mb-4">
        <div class="text-sm xl:text-base" style="font-family: var(--font-display); letter-spacing: 0.5px; color: var(--chalk-faint)">
          Round {{ state.round + 1 }}/{{ state.rounds.length }} &mdash; Cible :
          <span style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-gold); font-size: 2.5em; vertical-align: middle">{{ currentLabel }}</span>
        </div>
        <div class="text-3xl xl:text-4xl mt-1" style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-cream)">{{ activePlayer?.name }}</div>
        <div class="flex gap-1.5 justify-center mt-2">
          <div v-for="dart in 3" :key="dart"
            class="w-2.5 h-2.5 xl:w-3.5 xl:h-3.5 rounded-full"
            :style="{ background: dart <= dartsLeft ? 'var(--chalk-gold)' : 'var(--chalk-line2)' }">
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 xl:flex xl:flex-wrap xl:gap-3 xl:justify-center">
        <!-- Type-specific hit buttons mirror the classic; all emit { hit:true } since
             the reducer adds the round's full value per hit (the multiplier is cosmetic). -->
        <button v-if="target.type === 'number'" @click="hit" class="hi-action-btn"
          style="color: var(--chalk-green); border-color: var(--chalk-green)">
          {{ target.value }} touché !
        </button>
        <button v-else-if="target.type === 'double'" @click="hit" class="hi-action-btn"
          style="color: var(--chalk-gold); border-color: var(--chalk-gold)">
          Double {{ target.value }} touché !
        </button>
        <button v-else-if="target.type === 'triple'" @click="hit" class="hi-action-btn"
          style="color: var(--chalk-red); border-color: var(--chalk-red)">
          Triple {{ target.value }} touché !
        </button>
        <template v-else-if="target.type === 'bull'">
          <button @click="hit" class="hi-action-btn"
            style="color: var(--chalk-green); border-color: var(--chalk-green)">
            Simple bulle (25)
          </button>
          <button @click="hit" class="hi-action-btn"
            style="color: var(--chalk-gold); border-color: var(--chalk-gold)">
            Double bulle (50)
          </button>
        </template>
        <button v-else @click="hit" class="hi-action-btn"
          style="color: var(--chalk-green); border-color: var(--chalk-green)">
          {{ currentLabel }} touché !
        </button>

        <button @click="miss" class="hi-action-btn"
          style="color: var(--chalk-faint); border-color: var(--chalk-faint); border-style: dashed">
          Manqué
        </button>
      </div>
    </div>

    <!-- Tableau des rounds (cibles imposées x joueurs) -->
    <div class="overflow-x-auto chalk-scroll">
      <table class="w-full min-w-[400px]" style="border-collapse: separate; border-spacing: 0">
        <thead>
          <tr>
            <th class="text-left px-2 py-1.5 xl:p-2 text-[13px] xl:text-sm whitespace-nowrap"
              style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2); border-bottom: 2px dashed var(--chalk-line)">Cible</th>
            <th v-for="p in players" :key="p.id"
              class="text-center px-2 py-2 xl:p-2 text-base xl:text-lg whitespace-nowrap"
              style="font-family: var(--font-hand); font-weight: 600; border-bottom: 2px dashed var(--chalk-line)"
              :style="{ color: p.active && !state.finished ? 'var(--chalk-gold)' : 'var(--chalk-faint2)' }">
              {{ p.name }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(round, rIdx) in state.rounds" :key="rIdx"
            :style="{ background: rIdx === state.round && !state.finished ? 'rgba(236,198,106,0.06)' : 'transparent' }">
            <td class="px-2 py-1.5 xl:p-2 text-sm xl:text-base whitespace-nowrap"
              style="border-bottom: 1px dashed var(--chalk-line2)"
              :style="{ fontFamily: 'var(--font-hand)', fontWeight: 600, color: rIdx === state.round && !state.finished ? 'var(--chalk-gold)' : 'var(--chalk-faint)' }">
              {{ round.label }}
            </td>
            <td v-for="p in players" :key="p.id"
              class="text-center px-2 py-1.5 xl:p-2 text-lg xl:text-xl"
              style="border-bottom: 1px dashed var(--chalk-line2)">
              <span v-if="p.halvedSet.has(rIdx)"
                style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-red)">÷2</span>
              <span v-else-if="rIdx < p.roundsPlayed"
                style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-green)">&check;</span>
              <span v-else style="color: var(--chalk-line2)">&middot;</span>
            </td>
          </tr>
          <!-- Total cumulé (autorité: state.scores) -->
          <tr style="border-top: 2px dashed var(--chalk-line)">
            <td class="px-2 py-2 xl:p-2 text-base xl:text-lg" style="font-family: var(--font-display); letter-spacing: 0.5px">Total</td>
            <td v-for="p in players" :key="p.id"
              class="text-center px-2 py-2 xl:p-2 text-xl xl:text-2xl"
              style="font-family: var(--font-display); color: var(--chalk-gold)">
              {{ p.score }}
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

   Halve It is presentational only: it derives everything from `state`.
   Input mirrors the classic: a type-specific "touché" button (number → green,
   double → gold, triple → red, bull → green "Simple bulle (25)" + gold "Double
   bulle (50)") plus a dashed "Manqué". Every hit variant emits { hit: true } and
   "Manqué" emits { miss: true } — the reducer adds the round's full value per hit,
   so the multiplier shown is cosmetic. The target type/value is parsed from the
   round label (state.rounds[state.round].label), the classic's own source of truth.

   Round table: rows are the 9 fixed targets (round labels), columns are players.
   The reducer keeps the authoritative cumulative total (scores[id]) and the list of
   rounds where a player was halved (halvedRounds[id]); per-round point gains are not
   persisted. So each completed-round cell shows the authoritative outcome — a red
   "÷2" where that round was halved, otherwise a green check — and the running
   cumulative total is shown in the Total footer row (mirrors BaseballBoard). */
export default {
  name: 'HalveItBoard',
  props: { state: { type: Object, required: true }, game: { type: Object, required: true } },
  emits: ['throw'],
  computed: {
    currentLabel() {
      const r = this.state.rounds[this.state.round]
      return r ? r.label : ''
    },
    // Active player (drives the target panel's name + turn dots), or null when finished.
    activePlayer() {
      const id = this.game.selectors.activePlayerId(this.state)
      return this.state.players.find((p) => p.id === id) || null
    },
    // Darts remaining in the current turn (0 once the game is over).
    dartsLeft() {
      return this.state.finished ? 0 : this.state.dartsLeft
    },
    // Type + display value parsed from the round label (the classic's own source
    // of truth). The reducer stores only { label, value(=points/hit) }, so we derive
    // the cosmetic multiplier/colour here — every variant still emits { hit:true }.
    target() {
      const label = this.currentLabel
      let m
      if (/^bull/i.test(label)) return { type: 'bull', value: 25 }
      if ((m = label.match(/^Double\s+(\d+)/i))) return { type: 'double', value: Number(m[1]) }
      if ((m = label.match(/^Triple\s+(\d+)/i))) return { type: 'triple', value: Number(m[1]) }
      if ((m = label.match(/^(\d+)$/))) return { type: 'number', value: Number(m[1]) }
      return { type: 'other', value: label }
    },
    players() {
      const active = this.game.selectors.activePlayerId(this.state)
      return this.state.players.map((p, i) => ({
        id: p.id,
        name: p.name,
        score: this.state.scores[p.id],
        active: p.id === active,
        winner: this.state.winnerId === p.id,
        roundsPlayed: this.roundsPlayedBy(i),
        halvedSet: new Set(this.state.halvedRounds[p.id] || []),
      }))
    },
  },
  methods: {
    cardStyle(p) {
      const active = p.active && !this.state.finished
      const border = p.winner ? '2px solid var(--chalk-green)' : active ? '2px solid var(--chalk-gold)' : '2px dashed var(--chalk-line)'
      const bg = p.winner ? 'rgba(134,199,160,0.08)' : active ? 'rgba(236,198,106,0.06)' : 'transparent'
      return { border, background: bg }
    },
    // How many rounds this player (by index) has fully completed.
    // Players before the active one have finished the current round; the rest
    // have finished up to the previous round. When finished, all rounds are done.
    roundsPlayedBy(index) {
      const s = this.state
      if (s.finished) return s.rounds.length
      return index < s.currentPlayerIndex ? s.round + 1 : s.round
    },
    hit() {
      if (this.state.finished) return
      this.$emit('throw', { hit: true })
    },
    miss() {
      if (this.state.finished) return
      this.$emit('throw', { miss: true })
    },
  },
}
</script>

<style scoped>
.card-badge { position: absolute; top: -10px; right: 8px; padding: 1px 10px; border-radius: 9999px; font-family: var(--font-hand); font-weight: 700; font-size: 11px; }
.hi-action-btn {
  font-family: var(--font-display); letter-spacing: 0.5px; font-size: 22px;
  background: transparent; border: 2px solid; border-radius: 14px;
  padding: 16px 0; cursor: pointer; line-height: 1.1; transition: all 0.2s;
}
.hi-action-btn:hover { background: rgba(241,230,203,0.06); }
@media (min-width: 1280px) {
  .hi-action-btn { padding: 16px 28px; }
}
</style>
