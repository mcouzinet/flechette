<template>
  <div class="flex flex-col gap-3 xl:gap-5">
    <!-- Cible du round -->
    <div class="text-center">
      <div class="text-sm xl:text-base" style="font-family: var(--font-display); letter-spacing: 0.5px; color: var(--chalk-faint)">
        Manche {{ state.round }}/{{ state.rounds }} &mdash; Cible :
        <span class="text-[2.5em] align-middle" style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-gold)">{{ state.round }}</span>
      </div>
    </div>

    <!-- Cartes joueurs -->
    <div :class="['grid gap-2 pt-1 xl:gap-5 xl:pt-2 grid-cols-1 md:grid-cols-2',
      players.length === 1 ? 'xl:grid-cols-1' : players.length === 3 ? 'xl:grid-cols-3' : players.length >= 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-2']">
      <div v-for="p in players" :key="p.id"
        class="relative rounded-[14px] p-2.5 xl:p-5 transition-all duration-300"
        :style="cardStyle(p)">
        <div v-if="p.active && !state.finished" class="card-badge" style="background: var(--chalk-gold); color: var(--chalk-bg)">A JOUER</div>
        <div v-if="p.winner" class="card-badge" style="background: var(--chalk-green); color: var(--chalk-bg)">&#9813; GAGNANT</div>

        <div class="text-center">
          <h3 class="text-base xl:text-[26px] xl:mb-3" style="font-family: var(--font-hand); font-weight: 700">{{ p.name }}</h3>

          <!-- Score total -->
          <div class="mb-2 xl:mb-3">
            <div class="text-2xl xl:text-[52px] leading-none xl:mb-1" style="font-family: var(--font-display)">{{ p.totalScore }}</div>
            <div class="hidden xl:block text-[14px] uppercase tracking-wider" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">Score total</div>
          </div>

          <!-- Flechettes restantes -->
          <div class="flex justify-center gap-1.5 xl:gap-2 mb-2 xl:mb-3">
            <div v-for="d in 3" :key="d"
              class="w-2.5 h-2.5 xl:w-3.5 xl:h-3.5 rounded-full transition-all duration-300"
              :style="{ background: (p.active ? d <= state.dartsLeft : true) ? 'var(--chalk-gold)' : 'var(--chalk-line2)' }"></div>
          </div>

          <!-- Indicateur Shanghai pour le round actuel -->
          <div v-if="state.round <= state.rounds" class="mb-0.5">
            <div class="hidden xl:block text-[14px] mb-2" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">Shanghai Manche {{ state.round }}</div>
            <div class="flex justify-center gap-2">
              <div class="w-3 h-3 rounded-full transition-all duration-300"
                :style="{ background: p.hits.s ? 'var(--chalk-green)' : 'var(--chalk-line2)' }" title="Simple"></div>
              <div class="w-3 h-3 rounded-full transition-all duration-300"
                :style="{ background: p.hits.d ? 'var(--chalk-gold)' : 'var(--chalk-line2)' }" title="Double"></div>
              <div class="w-3 h-3 rounded-full transition-all duration-300"
                :style="{ background: p.hits.t ? 'var(--chalk-red)' : 'var(--chalk-line2)' }" title="Triple"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Saisir le score -->
    <div class="rounded-[14px] p-3 xl:p-5" style="border: 2px dashed var(--chalk-line)">
      <h3 class="text-base xl:text-[22px] mb-2 xl:mb-5 text-center" style="font-family: var(--font-display); letter-spacing: 0.5px">SAISIR LE SCORE</h3>

      <!-- Selecteur de type (vise auto le numero du round) -->
      <div class="grid grid-cols-2 gap-2 xl:flex xl:flex-wrap xl:gap-3 xl:justify-center">
        <button
          v-for="type in ['single', 'double', 'triple']"
          :key="type"
          @click="throwHit(type)"
          :disabled="state.finished"
          class="sh-score-btn"
          :style="{
            color: typeColor(type),
            borderColor: typeColor(type),
            opacity: state.finished ? 0.4 : 1,
            cursor: state.finished ? 'not-allowed' : 'pointer'
          }">
          {{ typeLabel(type) }}
        </button>

        <!-- Bouton Manque -->
        <button
          @click="throwMiss"
          :disabled="state.finished"
          class="sh-score-btn"
          :style="{
            color: 'var(--chalk-faint)',
            borderColor: 'var(--chalk-faint)',
            borderStyle: 'dashed',
            opacity: state.finished ? 0.4 : 1,
            cursor: state.finished ? 'not-allowed' : 'pointer'
          }">
          Manqu&eacute;
        </button>
      </div>
    </div>
  </div>
</template>

<script>
/* Board contract (every remote board follows this):
   props: { state: Object (reducer state), game: Object (reducer module: .meta/.selectors) }
   emits: 'throw' (the game-specific dart). undo/reset/back are handled by RemoteGameShell.

   Shanghai: the target is ALWAYS the current round's number, so there is no
   number grid. A dart only says how it landed on that number:
     { mult: 1 | 2 | 3 } for Simple / Double / Triple, or { miss: true }. */
export default {
  name: 'ShanghaiBoard',
  props: { state: { type: Object, required: true }, game: { type: Object, required: true } },
  emits: ['throw'],
  computed: {
    players() {
      const active = this.game.selectors.activePlayerId(this.state)
      return this.state.players.map((p) => ({
        id: p.id,
        name: p.name,
        totalScore: this.state.scores[p.id],
        hits: this.state.roundHits[p.id]?.[this.state.round] || { s: false, d: false, t: false },
        active: p.id === active,
        winner: this.state.winnerId === p.id,
      }))
    },
  },
  methods: {
    typeLabel(t) { return t === 'single' ? 'Simple' : t === 'double' ? 'Double' : 'Triple' },
    typeColor(t) { return t === 'single' ? 'var(--chalk-green)' : t === 'double' ? 'var(--chalk-gold)' : 'var(--chalk-red)' },
    cardStyle(p) {
      const border = p.active && !this.state.finished
        ? '2px solid var(--chalk-gold)'
        : p.winner
          ? '2px solid var(--chalk-green)'
          : '2px dashed var(--chalk-line)'
      const bg = p.active && !this.state.finished
        ? 'rgba(236,198,106,0.07)'
        : p.winner
          ? 'rgba(134,199,160,0.07)'
          : 'transparent'
      return { border, background: bg }
    },
    throwHit(type) {
      if (this.state.finished) return
      const mult = { single: 1, double: 2, triple: 3 }[type]
      this.$emit('throw', { mult })
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
.sh-score-btn {
  font-family: var(--font-display); letter-spacing: 0.5px; font-size: 22px;
  background: transparent; border: 2px solid; border-radius: 14px;
  padding: 16px 0; line-height: 1.1; transition: all 0.2s;
}
.sh-score-btn:hover:not(:disabled) { background: rgba(241,230,203,0.06); }
@media (min-width: 1280px) {
  .sh-score-btn { padding: 16px 24px; }
}
</style>
