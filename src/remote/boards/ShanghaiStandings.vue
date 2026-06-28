<template>
  <div class="flex flex-col gap-2 xl:gap-3">
    <div class="text-[20px] xl:text-[22px]" style="font-family: var(--font-display); letter-spacing: 0.5px">LE CLASSEMENT</div>
    <div class="flex flex-col gap-2 xl:gap-3">
      <div v-for="(p, rank) in ranked" :key="p.id"
        class="relative rounded-[14px] p-2.5 xl:p-3"
        :style="{ border: `2px ${rank === 0 ? 'solid' : 'dashed'} ${rank === 0 ? 'var(--chalk-gold)' : 'var(--chalk-line)'}`, background: rank === 0 ? 'rgba(236,198,106,0.07)' : 'transparent' }">
        <div class="flex items-baseline justify-between gap-2">
          <span class="w-6 text-[22px] xl:text-[28px] shrink-0" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">{{ rank + 1 }}.</span>
          <span class="flex-1 flex items-center gap-2 text-[19px] xl:text-[24px] min-w-0" style="font-family: var(--font-hand); font-weight: 600">
            <span class="w-[10px] h-[10px] rounded-full flex-none" :style="{ background: color(p.id), boxShadow: `0 0 8px ${color(p.id)}66` }"></span>
            <span class="truncate">{{ p.name }}</span>
          </span>
          <span class="text-[28px] xl:text-[34px] leading-none shrink-0" style="font-family: var(--font-display)">{{ p.score }}</span>
        </div>
        <div class="ml-8 mt-1 text-[15px] xl:text-[17px] leading-tight" style="font-family: var(--font-hand); font-weight: 600">
          <span v-if="rank === 0" style="color: var(--chalk-green)">Meneur &#10022;</span>
          <span v-else-if="p.score === ranked[0].score" style="color: var(--chalk-gold)">= meneur</span>
          <span v-else style="color: var(--chalk-gold)">{{ p.score - ranked[0].score }} pts de retard</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* Shanghai sidebar ranking — mirrors the classic "LE CLASSEMENT" aside.
   NOT wired in RemoteGame.vue (Shanghai shows only history by default);
   register it in the STANDINGS map there to enable.
   Highest total wins, so rows are sorted descending and laggards show a
   negative "… pts de retard" (e.g. "-12 pts de retard"), matching Shanghai.vue. */

// same palette the other boards use so a player's colour stays consistent
const TEAM_COLORS = ['#ef8b6f', '#86c7a0', '#ecc66a', '#6fb5ef', '#ef8fbf', '#efad6f', '#b58fef', '#6fd9d9']

export default {
  name: 'ShanghaiStandings',
  props: { state: { type: Object, required: true }, game: { type: Object, required: true } },
  computed: {
    ranked() {
      return this.state.players
        .map((p) => ({ id: p.id, name: p.name, score: this.state.scores[p.id] }))
        .sort((a, b) => b.score - a.score) // higher total leads
    },
  },
  methods: {
    color(id) {
      const i = this.state.players.findIndex((p) => p.id === id)
      return TEAM_COLORS[i % TEAM_COLORS.length]
    },
  },
}
</script>
