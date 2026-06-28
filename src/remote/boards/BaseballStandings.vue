<template>
  <div class="flex flex-col gap-2 xl:gap-3">
    <div class="text-[20px] xl:text-[22px]" style="font-family: var(--font-display); letter-spacing: 0.5px">LE CLASSEMENT</div>
    <div class="flex flex-col gap-2 xl:gap-3">
      <div v-for="(p, rank) in ranked" :key="p.id"
        class="relative rounded-[14px] p-3"
        :style="{ border: `2px ${rank === 0 ? 'solid' : 'dashed'} ${rank === 0 ? 'var(--chalk-gold)' : 'var(--chalk-line)'}`, background: rank === 0 ? 'rgba(236,198,106,0.07)' : 'transparent' }">
        <div class="flex items-baseline justify-between gap-2">
          <span class="flex-1 text-lg xl:text-[24px] truncate" style="font-family: var(--font-hand); font-weight: 600">{{ p.name }}</span>
          <span class="text-[34px] leading-none shrink-0" style="font-family: var(--font-display)">{{ p.total }}</span>
        </div>
        <div class="mt-1 text-[17px]" style="font-family: var(--font-hand); font-weight: 600">
          <span v-if="rank === 0" style="color: var(--chalk-green)">Leader</span>
          <span v-else style="color: var(--chalk-faint2)">{{ p.total - ranked[0].total }} runs</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* Optional sidebar panel for remote Baseball — mirrors the classic
   "LE CLASSEMENT" ranking that sits aside the innings table in
   src/components/Baseball.vue (sorted by total runs desc, leader marked).

   Same board contract as the other panels:
     props: { state: Object (reducer state), game: Object (reducer module) }
   DISPLAY-only: it emits nothing and only reads real reducer data
   (game.selectors.inningScores → rows[{ id, name, total }]).

   NOT wired by default. To enable, register it in RemoteGame.vue's
   STANDINGS map ({ baseball: BaseballStandings }), exactly like Cricket. */
export default {
  name: 'BaseballStandings',
  props: { state: { type: Object, required: true }, game: { type: Object, required: true } },
  computed: {
    ranked() {
      const rows = this.game.selectors.inningScores(this.state).rows
      // highest cumulative total leads; original order breaks ties (stable),
      // matching the reducer's winnerId tiebreak.
      return rows
        .map((r) => ({ id: r.id, name: r.name, total: r.total }))
        .sort((a, b) => b.total - a.total)
    },
  },
}
</script>
