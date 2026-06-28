<template>
  <div class="flex flex-col gap-3 xl:gap-5">
    <!-- Indicateur de round -->
    <div class="text-center pt-2">
      <span class="text-[15px] uppercase tracking-wider" style="color: var(--chalk-faint2)">Round</span>
      <div class="flex justify-center gap-2 mt-1">
        <div v-for="r in state.rounds" :key="r"
          class="w-8 h-8 xl:w-10 xl:h-10 rounded-full flex items-center justify-center text-sm xl:text-base transition-all duration-300"
          :style="{
            fontFamily: 'var(--font-display)',
            border: r === state.round + 1 ? '2px solid var(--chalk-gold)' : '2px dashed var(--chalk-line)',
            background: r <= state.round ? 'rgba(134,199,160,0.15)' : r === state.round + 1 ? 'rgba(236,198,106,0.10)' : 'transparent',
            color: r <= state.round ? 'var(--chalk-green)' : r === state.round + 1 ? 'var(--chalk-gold)' : 'var(--chalk-faint2)'
          }">
          {{ r }}
        </div>
      </div>
    </div>

    <!-- Cartes joueurs -->
    <div :class="['grid gap-2 xl:gap-5 grid-cols-1 md:grid-cols-2',
      players.length === 3 ? 'xl:grid-cols-3' : players.length >= 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-2']">
      <div v-for="(p, i) in players" :key="p.id"
        class="relative rounded-[14px] p-2.5 xl:p-5 transition-all duration-300"
        :style="cardStyle(p, i)">
        <div v-if="p.active && !state.finished" class="card-badge" style="background: var(--chalk-gold); color: var(--chalk-bg)">À JOUER</div>
        <div v-if="p.winner" class="card-badge" style="background: var(--chalk-green); color: var(--chalk-bg)">GAGNANT</div>
        <div class="flex items-center gap-3 xl:block xl:text-center">
          <h3 class="text-base xl:text-[26px] xl:mb-3 shrink-0" style="font-family: var(--font-hand); font-weight: 600">{{ p.name }}</h3>
          <div class="shrink-0 xl:mb-3">
            <div class="text-2xl xl:text-[56px] leading-none xl:mb-1" :style="{ fontFamily: 'var(--font-display)', color: 'var(--chalk-cream)' }">{{ p.score }}</div>
            <div class="hidden xl:block text-[13px] uppercase tracking-wider" style="color: var(--chalk-faint2)">Points</div>
          </div>
          <div class="flex gap-1.5 xl:justify-center xl:gap-2 xl:mb-3 shrink-0">
            <div v-for="d in 3" :key="d" class="w-2.5 h-2.5 xl:w-3.5 xl:h-3.5 rounded-full"
              :style="{ background: (p.active ? d <= state.dartsLeft : true) ? 'var(--chalk-gold)' : 'var(--chalk-line2)' }"></div>
          </div>
          <div class="text-[13px] xl:text-[15px] ml-auto xl:ml-0 shrink-0" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
            Moy: {{ p.average.toFixed(1) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Saisir le score -->
    <div class="rounded-[14px] p-3 xl:p-5" style="border: 2px dashed var(--chalk-line)">
      <h3 class="text-base xl:text-[22px] mb-2 xl:mb-5 text-center" style="font-family: var(--font-display); letter-spacing: 0.5px">SAISIR LE SCORE</h3>

      <div class="grid grid-cols-2 gap-2 mb-3 xl:flex xl:flex-wrap xl:gap-2 xl:mb-5 xl:justify-center">
        <button v-for="type in ['single','double','triple']" :key="type" @click="scoreType = type" class="cu-type-btn"
          :style="typeStyle(type, 'var(--chalk-gold)')">{{ typeLabel(type) }}</button>
        <button @click="selectMiss" class="cu-type-btn" :style="typeStyle('miss', 'var(--chalk-red)')">Manqué</button>
      </div>

      <div class="grid grid-cols-4 lg:grid-cols-7 gap-1.5 mb-3 xl:gap-2 xl:mb-5">
        <button v-for="n in dartNumbers" :key="n" @click="selectScore(n)" class="cu-num-btn"
          :style="{ color: selectedScore === n ? 'var(--chalk-bg)' : 'var(--chalk-cream)', background: selectedScore === n ? 'var(--chalk-gold)' : 'transparent', borderColor: selectedScore === n ? 'var(--chalk-gold)' : 'var(--chalk-line)' }">
          {{ n === 25 ? 'Bulle' : n }}
        </button>
      </div>

      <div class="flex justify-center">
        <button @click="validate" :disabled="!canAdd" :class="canAdd ? 'chalk-btn-green' : 'chalk-btn-ghost'"
          :style="{ opacity: canAdd ? 1 : 0.4, cursor: canAdd ? 'pointer' : 'not-allowed', fontSize: '23px', padding: '8px 28px' }">
          Valider le score
        </button>
      </div>
    </div>
  </div>
</template>

<script>
/* Board contract (every remote board follows this):
   props: { state: Object (reducer state), game: Object (reducer module: .meta/.selectors) }
   emits: 'throw' (the game-specific dart). undo/reset/back are handled by RemoteGameShell. */
export default {
  name: 'CountUpBoard',
  props: { state: { type: Object, required: true }, game: { type: Object, required: true } },
  emits: ['throw'],
  data() {
    return { scoreType: 'single', selectedScore: null, dartNumbers: [...Array(20)].map((_, i) => i + 1).concat([25]) }
  },
  computed: {
    players() {
      const active = this.game.selectors.activePlayerId(this.state)
      return this.state.players.map((p) => ({
        id: p.id, name: p.name, score: this.state.scores[p.id],
        average: this.state.thrown[p.id] ? this.state.scores[p.id] / this.state.thrown[p.id] : 0,
        active: p.id === active, winner: this.state.winnerId === p.id,
      }))
    },
    canAdd() {
      if (this.scoreType === 'miss') return !this.state.finished
      if (this.selectedScore === null || this.state.finished) return false
      if (this.selectedScore === 25 && this.scoreType === 'triple') return false
      return true
    },
  },
  methods: {
    typeLabel(t) { return t === 'single' ? 'Simple' : t === 'double' ? 'Double' : 'Triple' },
    typeStyle(t, onColor) {
      const on = this.scoreType === t
      return { color: on ? 'var(--chalk-bg)' : 'var(--chalk-faint)', background: on ? onColor : 'transparent', borderColor: on ? onColor : 'var(--chalk-line)' }
    },
    cardStyle(p) {
      const border = p.winner ? '2px solid var(--chalk-green)' : p.active ? '2px solid var(--chalk-gold)' : '2px dashed var(--chalk-line)'
      const bg = p.winner ? 'rgba(134,199,160,0.08)' : p.active ? 'rgba(236,198,106,0.06)' : 'transparent'
      return { border, background: bg }
    },
    selectScore(n) { this.selectedScore = n; if (this.scoreType === 'miss') this.scoreType = 'single' },
    selectMiss() { this.scoreType = 'miss'; this.selectedScore = 0 },
    validate() {
      if (!this.canAdd) return
      const dart = this.scoreType === 'miss' ? { miss: true } : { n: this.selectedScore, mult: { single: 1, double: 2, triple: 3 }[this.scoreType] }
      this.$emit('throw', dart)
      this.scoreType = 'single'
      this.selectedScore = null
    },
  },
}
</script>

<style scoped>
.card-badge { position: absolute; top: -10px; right: 8px; padding: 1px 10px; border-radius: 9999px; font-family: var(--font-hand); font-weight: 700; font-size: 11px; }
.cu-type-btn { font-family: var(--font-display); letter-spacing: 0.5px; font-size: 22px; border: 2px solid; border-radius: 14px; padding: 16px 0; cursor: pointer; line-height: 1.1; transition: all 0.2s; }
.cu-type-btn:hover { background: rgba(241,230,203,0.06); }
.cu-num-btn { height: 44px; border: 2px solid; border-radius: 10px; font-family: var(--font-display); font-size: 17px; letter-spacing: 0.5px; cursor: pointer; transition: all 0.15s; background: transparent; }
.cu-num-btn:hover { background: rgba(241,230,203,0.06); border-color: var(--chalk-gold); }
@media (min-width: 1280px) {
  .cu-type-btn { padding: 16px 24px; }
  .cu-num-btn { height: 54px; font-size: 20px; }
}
</style>
