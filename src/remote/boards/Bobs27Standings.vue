<template>
  <div class="flex flex-col gap-2 xl:gap-3">
    <div class="text-[20px] xl:text-[22px]" style="font-family: var(--font-display); letter-spacing: 0.5px">LE CLASSEMENT</div>
    <div class="flex flex-col gap-2 xl:gap-3">
      <div v-for="(p, rank) in ranked" :key="p.id"
        class="relative rounded-[14px] p-2.5 xl:p-3"
        :style="rowStyle(p, rank)">
        <div class="flex items-baseline justify-between gap-2">
          <span :class="['flex-1 text-[19px] xl:text-[24px] min-w-0 truncate', p.eliminated ? 'line-through' : '']"
            :style="{ fontFamily: 'var(--font-hand)', fontWeight: 600, color: p.eliminated ? 'var(--chalk-faint2)' : 'var(--chalk-cream)' }">{{ p.name }}</span>
          <span class="text-[28px] xl:text-[34px] leading-none shrink-0"
            :style="{ fontFamily: 'var(--font-display)', color: p.score <= 0 ? 'var(--chalk-red)' : 'var(--chalk-cream)' }">{{ p.score }}</span>
        </div>
        <div class="mt-1 text-[15px] xl:text-[17px]" style="font-family: var(--font-hand); font-weight: 600">
          <span v-if="p.eliminated" style="color: var(--chalk-red)">Éliminé</span>
          <span v-else-if="rank === 0" style="color: var(--chalk-green)">Leader</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* Mirrors the classic Bob's 27 "LE CLASSEMENT" sidebar panel (Bobs27.vue).
   Same board contract as CricketStandings: props { state, game }, no emits.
   Not wired in RemoteGame.vue yet — see STANDINGS registry there. */
export default {
  name: 'Bobs27Standings',
  props: { state: { type: Object, required: true }, game: { type: Object, required: true } },
  computed: {
    ranked() {
      return this.state.players
        .map((p) => ({
          id: p.id,
          name: p.name,
          score: this.state.scores[p.id],
          eliminated: this.state.eliminated[p.id],
        }))
        .sort((a, b) => {
          // survivors first, then by score desc (matches classic sortedPlayers)
          if (a.eliminated && !b.eliminated) return 1
          if (!a.eliminated && b.eliminated) return -1
          return b.score - a.score
        })
    },
  },
  methods: {
    rowStyle(p, rank) {
      const border = p.eliminated
        ? '2px dashed rgba(239,139,111,0.3)'
        : rank === 0
          ? '2px solid var(--chalk-gold)'
          : '2px dashed var(--chalk-line)'
      const bg = p.eliminated
        ? 'rgba(239,139,111,0.05)'
        : rank === 0
          ? 'rgba(236,198,106,0.07)'
          : 'transparent'
      return { border, background: bg, opacity: p.eliminated ? 0.55 : 1 }
    },
  },
}
</script>
