<template>
  <div class="flex flex-col gap-2 xl:gap-3">
    <div class="text-[20px] xl:text-[22px]" style="font-family: var(--font-display); letter-spacing: 0.5px">LE CLASSEMENT</div>
    <div class="flex flex-col gap-2 xl:gap-3">
      <div v-for="(p, rank) in ranked" :key="p.id"
        class="relative rounded-[14px] p-2.5 xl:p-3"
        :style="{ border: `2px ${rank === 0 ? 'solid' : 'dashed'} ${rank === 0 ? 'var(--chalk-gold)' : 'var(--chalk-line)'}`, background: rank === 0 ? 'rgba(236,198,106,0.07)' : 'transparent' }">
        <div class="flex items-baseline justify-between gap-2">
          <span class="w-6 text-[22px] xl:text-[28px] shrink-0" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">{{ rank + 1 }}.</span>
          <span class="flex-1 truncate text-[19px] xl:text-[24px] min-w-0" style="font-family: var(--font-hand); font-weight: 600">{{ p.name }}</span>
          <span class="text-[28px] xl:text-[34px] leading-none shrink-0" style="font-family: var(--font-display)">{{ p.score }}</span>
        </div>
        <div class="flex justify-between items-end mt-1 ml-8" style="font-family: var(--font-hand); font-weight: 600">
          <div class="text-[15px] xl:text-[17px] leading-tight">
            <span v-if="rank === 0" style="color: var(--chalk-green)">Meneur ✦</span>
            <span v-else-if="p.score === ranked[0].score" style="color: var(--chalk-gold)">= meneur</span>
            <span v-else style="color: var(--chalk-faint2)">{{ p.score - ranked[0].score }} pts</span>
          </div>
          <div v-if="p.halved" class="text-[15px] xl:text-[17px] leading-tight" style="color: var(--chalk-red)">divisé {{ p.halved }}×</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* Optional Halve-It sidebar panel (mirrors the classic "LE CLASSEMENT" ranking).
   Modeled on CricketStandings: props { state, game }, derives everything from
   state. NOT wired in RemoteGame.vue — register it under STANDINGS there to use it.

   Halve It has no team colours, so rank is shown as a number prefix rather than a
   colour dot. Higher cumulative total leads (matches the reducer's winner rule and
   the classic's sortedPlayers). The "divisé N×" detail comes from halvedRounds. */
export default {
  name: 'HalveItStandings',
  props: { state: { type: Object, required: true }, game: { type: Object, required: true } },
  computed: {
    ranked() {
      return this.state.players
        .map((p) => ({
          id: p.id,
          name: p.name,
          score: this.state.scores[p.id],
          halved: (this.state.halvedRounds[p.id] || []).length,
        }))
        .sort((a, b) => b.score - a.score) // higher total leads
    },
  },
}
</script>
