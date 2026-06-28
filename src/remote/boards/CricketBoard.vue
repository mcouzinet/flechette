<template>
  <div class="flex flex-col gap-3 xl:gap-5">
    <!-- ===================== ARDOISE DE SCORE (grille des marques, DISPLAY) ===================== -->
    <section class="rounded-[14px] p-3 xl:p-5" style="border: 2px dashed var(--chalk-line)">

      <!-- VERSION MOBILE : zones en lignes, joueurs en colonnes -->
      <div class="xl:hidden">
        <div class="grid" :style="{ gridTemplateColumns: `74px repeat(${rows.length}, 1fr)`, columnGap: '4px' }">
          <!-- Header : vide + noms joueurs -->
          <div></div>
          <div v-for="(p, pi) in rows" :key="'mh' + p.id" class="text-center pb-2">
            <span class="w-[9px] h-[9px] rounded-full inline-block mb-1"
              :style="{ background: color(pi), boxShadow: `0 0 6px ${color(pi)}66`, outline: p.id === activeId ? '2px solid var(--chalk-gold)' : 'none', outlineOffset: '2px' }"></span>
            <div class="text-sm md:text-lg leading-tight truncate" style="font-family: var(--font-hand); font-weight: 600">{{ p.name }}</div>
            <div class="text-[13px] leading-none" :style="{ fontFamily: 'var(--font-display)', color: scoreColor(p.score) }">{{ p.score }}</div>
          </div>

          <!-- Lignes par zone -->
          <template v-for="(zone, zi) in zones" :key="'mz' + zi">
            <div class="flex items-center py-2" style="border-top: 1.5px dashed var(--chalk-line2)">
              <div class="text-base font-bold transition-opacity duration-500"
                :style="{ fontFamily: 'var(--font-display)', letterSpacing: '0.3px', textDecoration: zoneClosed(zi) ? 'line-through' : 'none', opacity: zoneClosed(zi) ? 0.25 : 1 }">{{ zone.label }}</div>
            </div>
            <div v-for="(p, pi) in rows" :key="'mc' + p.id + zi"
              class="grid place-items-center min-h-[58px] relative"
              :style="{ borderTop: '1.5px dashed var(--chalk-line2)', padding: '6px 0 8px' }">
              <div class="transition-opacity duration-500" :style="{ opacity: zoneClosed(zi) ? 0.3 : 1 }">
                <span v-if="p.marks[zi] === 0" class="w-[6px] h-[6px] rounded-full opacity-70 inline-block" style="background: var(--chalk-line)"></span>
                <span v-else class="relative inline-block w-[36px] h-[36px]">
                  <!-- "/" : 1re marque -->
                  <span v-if="p.marks[zi] >= 1" class="absolute left-1/2 top-1/2 w-[3px] h-[62%] rounded-[4px] -translate-x-1/2 -translate-y-1/2 rotate-[46deg]"
                    :style="{ background: color(pi), boxShadow: `0 0 1.5px ${color(pi)}`, opacity: 0.92 }"></span>
                  <!-- "✕" : 2e marque -->
                  <span v-if="p.marks[zi] >= 2" class="absolute left-1/2 top-1/2 w-[3px] h-[62%] rounded-[4px] -translate-x-1/2 -translate-y-1/2 -rotate-[46deg]"
                    :style="{ background: color(pi), boxShadow: `0 0 1.5px ${color(pi)}`, opacity: 0.92 }"></span>
                  <!-- "⊘" : fermé -->
                  <span v-if="p.closed[zi]" class="absolute rounded-full"
                    :style="{ inset: '8%', border: `2.5px solid ${color(pi)}`, opacity: 0.9 }"></span>
                </span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- VERSION DESKTOP : joueurs en lignes, zones en colonnes -->
      <div class="hidden xl:block">
        <div class="grid" :style="{ gridTemplateColumns: `minmax(110px,160px) repeat(${zones.length}, 1fr)`, columnGap: '4px' }">
          <div class="self-end pb-2 text-[22px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">Joueurs</div>
          <div v-for="(zone, zi) in zones" :key="'h' + zi" class="text-center pb-2">
            <div class="transition-opacity duration-500" :style="{ opacity: zoneClosed(zi) ? 0.25 : 1 }">
              <div :class="zone.label === 'Bull' ? 'text-[24px]' : 'text-[27px]'"
                :style="{ fontFamily: 'var(--font-display)', letterSpacing: '0.5px', textDecoration: zoneClosed(zi) ? 'line-through' : 'none' }">{{ zone.label === 'Bull' ? 'Bulle' : zone.label }}</div>
              <div class="text-[15px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">{{ zone.pts }} pts</div>
            </div>
          </div>

          <template v-for="(p, pi) in rows" :key="p.id">
            <div class="flex items-center gap-3 py-2 px-1 relative" style="border-top: 1.5px dashed var(--chalk-line2)">
              <span class="w-[11px] h-[11px] rounded-full flex-none"
                :style="{ background: color(pi), boxShadow: `0 0 8px ${color(pi)}66`, outline: p.id === activeId ? '2px solid var(--chalk-gold)' : 'none', outlineOffset: '2px' }"></span>
              <span class="text-[24px] leading-none truncate" style="font-family: var(--font-hand); font-weight: 600">{{ p.name }}</span>
              <span class="ml-auto text-[26px] leading-none" :style="{ fontFamily: 'var(--font-display)', color: scoreColor(p.score) }">{{ p.score }}</span>
            </div>
            <div v-for="(zone, zi) in zones" :key="p.id + '-' + zi"
              class="grid place-items-center min-h-[90px] relative"
              :style="{ borderTop: '1.5px dashed var(--chalk-line2)', padding: '8px 0 10px' }">
              <div class="transition-opacity duration-500" :style="{ opacity: zoneClosed(zi) ? 0.3 : 1 }">
                <span v-if="p.marks[zi] === 0" class="w-[7px] h-[7px] rounded-full opacity-70 inline-block" style="background: var(--chalk-line)"></span>
                <span v-else class="relative inline-block w-[50px] h-[50px]">
                  <span v-if="p.marks[zi] >= 1" class="absolute left-1/2 top-1/2 w-[3.4px] h-[62%] rounded-[4px] -translate-x-1/2 -translate-y-1/2 rotate-[46deg]"
                    :style="{ background: color(pi), boxShadow: `0 0 1.5px ${color(pi)}`, opacity: 0.92, filter: 'blur(.2px)' }"></span>
                  <span v-if="p.marks[zi] >= 2" class="absolute left-1/2 top-1/2 w-[3.4px] h-[62%] rounded-[4px] -translate-x-1/2 -translate-y-1/2 -rotate-[46deg]"
                    :style="{ background: color(pi), boxShadow: `0 0 1.5px ${color(pi)}`, opacity: 0.92, filter: 'blur(.2px)' }"></span>
                  <span v-if="p.closed[zi]" class="absolute rounded-full"
                    :style="{ inset: '9%', border: `3px solid ${color(pi)}`, opacity: 0.9, filter: 'blur(.2px)', boxShadow: `0 0 2px ${color(pi)}55` }"></span>
                </span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Légende -->
      <div class="mt-3 flex items-center gap-3 xl:gap-5 pt-3 flex-wrap text-sm xl:text-[18px]"
        style="border-top: 2px dashed var(--chalk-line); font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
        <span class="inline-flex items-center gap-1"><span class="ckb-legend" data-hits="1"></span> 1 touche</span>
        <span class="inline-flex items-center gap-1"><span class="ckb-legend" data-hits="2"></span> 2 touches</span>
        <span class="inline-flex items-center gap-1"><span class="ckb-legend" data-hits="3"></span> fermé</span>
      </div>
    </section>

    <!-- ===================== PAD DE SAISIE (joueur actif, 3 fléchettes / tour) ===================== -->
    <div class="rounded-[14px] p-3 xl:p-5" style="border: 2px dashed var(--chalk-line)">
      <div class="flex items-center justify-between mb-2 xl:mb-5">
        <h3 class="text-base xl:text-[22px]" style="font-family: var(--font-display); letter-spacing: 0.5px">SAISIR LE SCORE</h3>
        <div v-if="activePlayer" class="flex items-center gap-2 xl:gap-3">
          <span class="text-sm xl:text-[20px] truncate" style="font-family: var(--font-hand); font-weight: 600">{{ activePlayer.name }}</span>
          <span class="flex gap-1.5 xl:gap-2">
            <span v-for="d in 3" :key="d" class="w-2.5 h-2.5 xl:w-3.5 xl:h-3.5 rounded-full"
              :style="{ background: d <= state.dartsLeft ? 'var(--chalk-gold)' : 'var(--chalk-line2)' }"></span>
          </span>
        </div>
      </div>

      <!-- Sélecteur Simple / Double / Triple + Manqué -->
      <div class="grid grid-cols-2 gap-2 mb-3 xl:flex xl:flex-wrap xl:gap-2 xl:mb-5 xl:justify-center">
        <button v-for="m in [1, 2, 3]" :key="m" @click="mult = m" class="ckb-type-btn"
          :disabled="state.finished" :style="typeStyle(m === mult, 'var(--chalk-gold)')">{{ multLabel(m) }}</button>
        <button @click="emitMiss" class="ckb-type-btn" :disabled="state.finished"
          :style="typeStyle(false, 'var(--chalk-red)')">Manqué</button>
      </div>

      <!-- Boutons de zone : taper = émettre une fléchette -->
      <div class="grid grid-cols-4 lg:grid-cols-7 gap-1.5 xl:gap-2">
        <button v-for="z in zones" :key="z.pts" @click="emitZone(z)" class="ckb-num-btn"
          :disabled="state.finished">
          {{ z.label === 'Bull' ? 'Bulle' : z.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
/* Board contract (every remote board follows this):
   props: { state: Object (reducer state), game: Object (reducer module: .meta/.selectors) }
   emits: 'throw' (the game-specific dart). undo/reset/back are handled by RemoteGameShell.

   Cricket specifics:
   - The marks grid (game.selectors.marksGrid) is DISPLAY-only.
   - The remote reducer is 3-darts-per-turn (not classic free-click), so input is a pad:
     a Simple/Double/Triple selector (= marks added) + zone buttons.
       zone tap  -> throw { n, mult }   (Bull -> n:25, mult 1/2/3)
       "Manqué"  -> throw { miss: true } */
const TEAM_COLORS = ['#ef8b6f', '#86c7a0', '#ecc66a', '#6fb5ef', '#ef8fbf', '#efad6f', '#b58fef', '#6fd9d9']

export default {
  name: 'CricketBoard',
  props: { state: { type: Object, required: true }, game: { type: Object, required: true } },
  emits: ['throw'],
  data() {
    return { mult: 1 }
  },
  computed: {
    grid() {
      return this.game.selectors.marksGrid(this.state)
    },
    zones() {
      return this.grid.zones
    },
    rows() {
      return this.grid.rows.map((r) => ({ ...r, score: this.state.score[r.id] }))
    },
    activeId() {
      return this.game.selectors.activePlayerId(this.state)
    },
    activePlayer() {
      return this.rows.find((r) => r.id === this.activeId) || null
    },
  },
  methods: {
    color(i) {
      return TEAM_COLORS[i % TEAM_COLORS.length]
    },
    // A zone is "closed on the board" only when every player has closed it.
    zoneClosed(zi) {
      return this.rows.length > 0 && this.rows.every((r) => r.closed[zi])
    },
    scoreColor(s) {
      return s <= 0 ? 'var(--chalk-green)' : s < 20 ? 'var(--chalk-cream)' : s < 50 ? 'var(--chalk-gold)' : 'var(--chalk-red)'
    },
    multLabel(m) {
      return m === 1 ? 'Simple' : m === 2 ? 'Double' : 'Triple'
    },
    typeStyle(on, onColor) {
      return {
        color: on ? 'var(--chalk-bg)' : 'var(--chalk-faint)',
        background: on ? onColor : 'transparent',
        borderColor: on ? onColor : 'var(--chalk-line)',
      }
    },
    emitZone(zone) {
      if (this.state.finished) return
      // Bull's dart number is 25; other zones use their label number (= pts).
      const n = zone.label === 'Bull' ? 25 : zone.pts
      // there is no triple bull — the bull tops out at double (2 marks).
      const mult = n === 25 ? Math.min(this.mult, 2) : this.mult
      this.$emit('throw', { n, mult })
    },
    emitMiss() {
      if (this.state.finished) return
      this.$emit('throw', { miss: true })
    },
  },
}
</script>

<style scoped>
.ckb-type-btn {
  font-family: var(--font-display); letter-spacing: 0.5px; font-size: 22px;
  border: 2px solid; border-radius: 14px; padding: 16px 0; cursor: pointer;
  line-height: 1.1; transition: all 0.2s;
}
.ckb-type-btn:hover:not(:disabled) { background: rgba(241, 230, 203, 0.06); }
.ckb-type-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.ckb-num-btn {
  height: 44px; border: 2px solid var(--chalk-line); border-radius: 10px;
  font-family: var(--font-display); font-size: 17px; letter-spacing: 0.5px;
  color: var(--chalk-cream); cursor: pointer; transition: all 0.15s; background: transparent;
}
.ckb-num-btn:hover:not(:disabled) { background: rgba(241, 230, 203, 0.06); border-color: var(--chalk-gold); }
.ckb-num-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.ckb-legend { position: relative; width: 22px; height: 22px; display: inline-block; flex: none; }
.ckb-legend::before, .ckb-legend::after {
  content: ''; position: absolute; left: 50%; top: 50%; width: 2.4px; height: 60%;
  background: var(--chalk-faint); border-radius: 3px;
}
.ckb-legend::before { transform: translate(-50%, -50%) rotate(46deg); }
.ckb-legend[data-hits="1"]::after { display: none; }
.ckb-legend[data-hits="2"]::after { transform: translate(-50%, -50%) rotate(-46deg); }
.ckb-legend[data-hits="3"]::after { transform: translate(-50%, -50%) rotate(-46deg); }
.ckb-legend[data-hits="3"] { border-radius: 9999px; box-shadow: inset 0 0 0 2.4px var(--chalk-faint); }
.ckb-legend[data-hits="3"]::before, .ckb-legend[data-hits="3"]::after { display: none; }
@media (min-width: 1280px) {
  .ckb-type-btn { padding: 16px 24px; }
  .ckb-num-btn { height: 54px; font-size: 20px; }
}
</style>
