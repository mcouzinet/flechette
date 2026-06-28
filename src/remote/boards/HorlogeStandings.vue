<template>
  <div class="flex flex-col gap-2 xl:gap-3">
    <div class="text-[20px] xl:text-[22px]" style="font-family: var(--font-display); letter-spacing: 0.5px">LE CLASSEMENT</div>
    <div class="flex flex-col gap-2 xl:gap-3">
      <div v-for="(p, rank) in ranked" :key="p.id"
        class="relative rounded-[14px] p-2.5 xl:p-3"
        :style="{ border: `2px ${rank === 0 ? 'solid' : 'dashed'} ${rank === 0 ? 'var(--chalk-gold)' : 'var(--chalk-line)'}`, background: rank === 0 ? 'rgba(236,198,106,0.07)' : 'transparent' }">
        <div class="flex items-baseline justify-between gap-2">
          <span class="w-5 text-[16px] xl:text-[18px] shrink-0" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">{{ rank + 1 }}.</span>
          <span class="flex-1 text-[19px] xl:text-[24px] min-w-0 truncate" style="font-family: var(--font-hand); font-weight: 600">{{ p.name }}</span>
          <span class="text-[28px] xl:text-[34px] leading-none shrink-0" style="font-family: var(--font-display)">{{ p.label }}</span>
        </div>
        <div class="flex justify-between items-end mt-1 ml-5" style="font-family: var(--font-hand); font-weight: 600">
          <div class="text-[15px] xl:text-[17px] leading-tight">
            <span v-if="rank === 0" style="color: var(--chalk-green)">Leader ✦</span>
            <span v-else style="color: var(--chalk-gold)">{{ p.behind }} cible{{ p.behind > 1 ? 's' : '' }} de retard</span>
          </div>
          <span class="text-[17px] xl:text-[19px] leading-tight" style="color: var(--chalk-faint2)">{{ p.passed }}/{{ totalTargets }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* Optional sidebar panel for Horloge — mirrors the classic "LE CLASSEMENT"
   ranking aside (Horloge.vue lines 159-192). NOT wired by default; register it
   in RemoteGame.vue's STANDINGS map (like CricketStandings) to enable.

   Board-panel contract: props { state, game }; read-only, derives everything
   from the reducer state + selectors. No emits. */
const BULL = 25
const DONE = 26
// 1..20 then the Bull — the ordered targets a player must clear.
const SEQUENCE = [...Array.from({ length: 20 }, (_, i) => i + 1), BULL]

export default {
  name: 'HorlogeStandings',
  props: { state: { type: Object, required: true }, game: { type: Object, required: true } },
  computed: {
    totalTargets() { return SEQUENCE.length },
    ranked() {
      const rows = this.state.players.map((p) => {
        const t = this.state.targets[p.id]
        const idx = SEQUENCE.indexOf(t)
        // targets already cleared (0..21) — same metric as the classic "X/21"
        const passed = t >= DONE ? this.totalTargets : (idx === -1 ? 0 : idx)
        return {
          id: p.id,
          name: p.name,
          passed,
          winner: this.state.winnerId === p.id,
          label: t >= DONE ? 'Fini' : (t === BULL ? 'Bulle' : t),
        }
      })
      // most targets cleared leads; finished players sit on top
      rows.sort((a, b) => b.passed - a.passed)
      const lead = rows.length ? rows[0].passed : 0
      for (const r of rows) r.behind = lead - r.passed
      return rows
    },
  },
}
</script>
