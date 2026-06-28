<template>
  <div class="flex flex-col gap-2 xl:gap-3">
    <div class="text-[20px] xl:text-[22px]" style="font-family: var(--font-display); letter-spacing: 0.5px">LE CLASSEMENT</div>
    <div class="flex flex-col gap-2 xl:gap-3">
      <div v-for="(p, rank) in ranked" :key="p.id"
        class="relative rounded-[14px] p-2.5 xl:p-3"
        :style="{
          border: p.eliminated
            ? '2px dashed var(--chalk-red)'
            : rank === 0
              ? '2px solid var(--chalk-gold)'
              : '2px dashed var(--chalk-line)',
          background: p.eliminated
            ? 'rgba(239,139,111,0.05)'
            : rank === 0
              ? 'rgba(236,198,106,0.07)'
              : 'transparent',
          opacity: p.eliminated ? 0.5 : 1
        }">
        <div class="flex items-center justify-between gap-2">
          <span :class="['text-lg xl:text-[24px]', p.eliminated ? 'line-through' : '']"
            :style="{ fontFamily: 'var(--font-hand)', fontWeight: 700, color: p.eliminated ? 'var(--chalk-faint2)' : 'var(--chalk-cream)' }">
            {{ p.name }}
          </span>
          <div class="flex gap-1">
            <span v-for="life in 3" :key="life" class="text-[14px]"
              :style="{ color: life <= p.lives ? 'var(--chalk-red)' : 'var(--chalk-line2)' }">&#10084;</span>
          </div>
        </div>
        <div class="flex justify-between items-end mt-1 text-[15px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">
          <span>N&#176;{{ p.number }} <span v-if="p.isKiller" style="color: var(--chalk-red)">- KILLER</span></span>
          <span v-if="p.eliminated" style="color: var(--chalk-red)">Éliminé</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* Killer standings aside (mirrors the classic "LE CLASSEMENT" panel).
   Reads game.selectors.board(state); sorts survivors first, then by lives desc,
   exactly like the classic rankedPlayers. Not wired into RemoteGame by default —
   register it in RemoteGame's STANDINGS map ({ killer: KillerStandings }) to show it. */
export default {
  name: 'KillerStandings',
  props: { state: { type: Object, required: true }, game: { type: Object, required: true } },
  computed: {
    ranked() {
      return [...this.game.selectors.board(this.state)].sort((a, b) => {
        if (a.eliminated && !b.eliminated) return 1
        if (!a.eliminated && b.eliminated) return -1
        return b.lives - a.lives
      })
    },
  },
}
</script>
