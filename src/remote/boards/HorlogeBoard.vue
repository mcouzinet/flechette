<template>
  <div class="flex flex-col gap-3 xl:gap-5">
    <!-- Cartes joueurs -->
    <div :class="['grid gap-2 pt-3 xl:gap-5 xl:pt-4 grid-cols-1 md:grid-cols-2',
      players.length === 3 ? 'xl:grid-cols-3' : players.length >= 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-2']">
      <div v-for="(p, i) in players" :key="p.id"
        class="relative rounded-[14px] p-2.5 xl:p-5 transition-all duration-300"
        :style="cardStyle(p)">
        <div v-if="p.active && !state.finished" class="card-badge" style="background: var(--chalk-gold); color: var(--chalk-bg)">À JOUER</div>
        <div v-if="p.winner" class="card-badge" style="background: var(--chalk-green); color: var(--chalk-bg)">GAGNANT</div>

        <div class="text-center">
          <h3 class="text-lg xl:text-[26px] mb-2 xl:mb-3" style="font-family: var(--font-hand); font-weight: 700">{{ p.name }}</h3>

          <!-- Cible actuelle -->
          <div class="relative mb-2 xl:mb-3">
            <div class="text-[12px] xl:text-[13px] uppercase tracking-wider mb-1" style="color: var(--chalk-faint2)">Cible actuelle</div>
            <div class="text-4xl xl:text-[56px] leading-none mb-1 xl:mb-2 transition-all duration-300"
              :style="{ fontFamily: 'var(--font-display)', color: targetColor(p) }">{{ targetText(p) }}</div>
            <div class="text-[14px] xl:text-[15px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">{{ p.passed }}/{{ totalTargets }} terminés</div>
          </div>

          <!-- Fléchettes restantes -->
          <div class="flex justify-center gap-1.5 xl:gap-2 mb-2 xl:mb-3">
            <div v-for="d in 3" :key="d" class="w-2.5 h-2.5 xl:w-3.5 xl:h-3.5 rounded-full transition-all duration-300"
              :style="{ background: (p.active ? d <= state.dartsLeft : p.winner) ? 'var(--chalk-gold)' : 'var(--chalk-line2)' }"></div>
          </div>

          <!-- Barre de progression -->
          <div class="w-full rounded-full h-[10px]" style="background: var(--chalk-line2)">
            <div class="h-[10px] rounded-full transition-all duration-500"
              :style="{ width: (p.passed / totalTargets * 100) + '%', background: 'var(--chalk-green)' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Saisir la cible -->
    <div class="rounded-[14px] p-3 xl:p-5" style="border: 2px dashed var(--chalk-line)">
      <div class="text-center mb-3 xl:mb-4">
        <div class="text-sm xl:text-base" style="font-family: var(--font-display); letter-spacing: 0.5px; color: var(--chalk-faint)">
          Cible : <span style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-gold); font-size: 2.5em; vertical-align: middle">{{ activeTargetLabel }}</span>
        </div>
        <div class="text-2xl xl:text-4xl mt-1" style="font-family: var(--font-hand); font-weight: 700; color: var(--chalk-cream)">{{ activePlayer?.name }}</div>
        <div class="flex gap-1.5 justify-center mt-2">
          <div v-for="d in 3" :key="d" class="w-2.5 h-2.5 xl:w-3.5 xl:h-3.5 rounded-full"
            :style="{ background: d <= state.dartsLeft && !state.finished ? 'var(--chalk-gold)' : 'var(--chalk-line2)' }"></div>
        </div>
      </div>

      <!-- Grille des numéros -->
      <div class="grid grid-cols-3 lg:grid-cols-7 gap-1.5 mb-3 xl:gap-3 xl:mb-5">
        <button v-for="n in targetNumbers" :key="n" @click="hit(n)" :disabled="state.finished"
          class="horloge-num"
          :style="numStyle(n)">
          {{ n === 25 ? 'BULLE' : n }}
        </button>
      </div>

      <!-- Bouton Manqué -->
      <div class="flex justify-center">
        <button @click="miss" :disabled="state.finished" class="hl-action-btn"
          :style="{ opacity: state.finished ? 0.4 : 1, cursor: state.finished ? 'not-allowed' : 'pointer', color: 'var(--chalk-faint)', borderColor: 'var(--chalk-faint)', borderStyle: 'dashed' }">
          Manqué
        </button>
      </div>
    </div>
  </div>
</template>

<script>
/* Board contract (every remote board follows this):
   props: { state: Object (reducer state), game: Object (reducer module: .meta/.selectors) }
   emits: 'throw' (the game-specific dart). undo/reset/back are handled by RemoteGameShell.

   Horloge is multiplier-agnostic: a dart carries only the number hit.
   state.targets[id] = current target per player (1..20, 25=Bull, 26=DONE). */
const BULL = 25
const DONE = 26
// Ordered targets the player must clear, in order: 1..20 then the Bull.
const SEQUENCE = [...Array.from({ length: 20 }, (_, i) => i + 1), BULL]

export default {
  name: 'HorlogeBoard',
  props: { state: { type: Object, required: true }, game: { type: Object, required: true } },
  emits: ['throw'],
  data() {
    return { targetNumbers: [...SEQUENCE] }
  },
  computed: {
    totalTargets() { return SEQUENCE.length },
    activeId() { return this.game.selectors.activePlayerId(this.state) },
    players() {
      return this.state.players.map((p) => {
        const t = this.state.targets[p.id]
        const idx = SEQUENCE.indexOf(t)
        return {
          id: p.id,
          name: p.name,
          target: t,
          // how many targets this player has already cleared (0..21)
          passed: t >= DONE ? this.totalTargets : (idx === -1 ? 0 : idx),
          active: p.id === this.activeId,
          winner: this.state.winnerId === p.id,
        }
      })
    },
    activePlayer() { return this.players.find((p) => p.active) || null },
    // The current target number the active player is aiming for (1..20 or 25).
    activeTarget() { return this.activePlayer ? this.activePlayer.target : null },
    activeTargetLabel() {
      const t = this.activeTarget
      if (t == null || t >= DONE) return '—'
      return t === BULL ? 'Bulle' : t
    },
  },
  methods: {
    targetText(p) {
      if (p.winner || p.target >= DONE) return 'FINI'
      return p.target === BULL ? 'BULLE' : p.target
    },
    targetColor(p) {
      if (p.winner || p.target >= DONE) return 'var(--chalk-green)'
      return p.target === BULL ? 'var(--chalk-gold)' : 'var(--chalk-cream)'
    },
    cardStyle(p) {
      const border = p.winner ? '2px solid var(--chalk-green)' : p.active ? '2px solid var(--chalk-gold)' : '2px dashed var(--chalk-line)'
      const bg = p.winner ? 'rgba(134,199,160,0.08)' : p.active ? 'rgba(236,198,106,0.06)' : 'transparent'
      return { border, background: bg }
    },
    // Highlight the active player's current target (gold); fade numbers
    // already passed (green); leave upcoming numbers neutral.
    numStyle(n) {
      const t = this.activeTarget
      const isTarget = t != null && t < DONE && n === t
      const passed = t != null && SEQUENCE.indexOf(n) < SEQUENCE.indexOf(t)
      return {
        fontFamily: 'var(--font-display)',
        border: isTarget ? '2px solid var(--chalk-gold)' : '2px dashed var(--chalk-line2)',
        background: isTarget ? 'rgba(236,198,106,0.12)' : passed ? 'rgba(134,199,160,0.08)' : 'transparent',
        color: isTarget ? 'var(--chalk-gold)' : passed ? 'var(--chalk-green)' : 'var(--chalk-faint2)',
        opacity: this.state.finished ? 0.4 : 1,
      }
    },
    hit(n) {
      if (this.state.finished) return
      // Multiplier-agnostic: only the number matters (Bulle -> 25).
      this.$emit('throw', { n })
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
.horloge-num { height: 48px; border-radius: 10px; font-size: 17px; letter-spacing: 0.5px; cursor: pointer; transition: all 0.2s; }
.horloge-num:hover:not(:disabled) { background: rgba(241,230,203,0.06) !important; }
.horloge-num:disabled { cursor: not-allowed; }
.hl-action-btn { font-family: var(--font-display); letter-spacing: 0.5px; font-size: 22px; background: transparent; border: 2px solid; border-radius: 14px; padding: 14px 24px; line-height: 1.1; transition: all 0.2s; }
.hl-action-btn:hover:not(:disabled) { background: rgba(241,230,203,0.06); }
@media (min-width: 1280px) {
  .horloge-num { height: 58px; font-size: 20px; }
  .hl-action-btn { padding: 16px 24px; }
}
</style>
