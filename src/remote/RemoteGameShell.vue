<template>
  <div class="chalk-grain"
    style="font-family: var(--font-ui); color: var(--chalk-cream); height: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column; background: radial-gradient(130% 90% at 50% -10%, #20322b, #142019 72%)">
    <!-- Cadre -->
    <div style="position: absolute; inset: 9px; border: 2px solid var(--chalk-line); border-radius: 12px; pointer-events: none; opacity: 0.5"></div>

    <GameHeader
      :title="title"
      :subtitle="subtitle"
      :is-fullscreen="false"
      @back="$emit('back')"
      @show-rules="showRules = true"
      @toggle-fullscreen="() => {}"
      @confirm-reset="showReset = true">
      <template #title-extra>
        <!-- remote code + presence chip, in place of the local variant select -->
        <span class="rgs-code" @click="$emit('share')">{{ code }}</span>
        <span class="rgs-presence" :title="presenceTitle">
          <span class="rgs-dot" :class="{ live: connected }"></span>{{ participantCount }}
        </span>
      </template>
    </GameHeader>

    <!-- Body -->
    <div class="flex-1 min-h-0 flex flex-col xl:grid gap-3 px-4 py-3 xl:gap-5 xl:px-5 xl:py-5 relative overflow-auto rgs-body">
      <section class="flex flex-col min-w-0 overflow-auto chalk-scroll gap-3 xl:gap-5">
        <slot></slot>
      </section>

      <aside class="flex flex-col gap-2 xl:gap-3 min-h-0 xl:pl-5 pt-3 xl:pt-0 rgs-sidebar">
        <!-- game-specific sidebar content (e.g. Cricket standings) above the log -->
        <slot name="sidebar-top"></slot>
        <HistoryPanel :history="history" @undo="$emit('undo')">
          <template #entry="slotProps">
            <slot name="history-entry" v-bind="slotProps">
              <!-- default generic entry -->
              <div class="flex justify-between items-baseline">
                <span class="text-[20px]" style="font-family: var(--font-hand); font-weight: 700">{{ slotProps.entry.player }}</span>
                <span class="text-[13px]" style="color: var(--chalk-faint2)">#{{ slotProps.total - slotProps.index }}</span>
              </div>
              <div class="text-[15px]" style="color: var(--chalk-faint)">{{ slotProps.entry.text }}</div>
            </slot>
          </template>
        </HistoryPanel>
      </aside>
    </div>

    <GameModals
      :show-rules="showRules"
      :show-reset="showReset"
      :show-winner="finished"
      :rules-title="`RÈGLES · ${title}`"
      reset-message="Réinitialiser la partie pour tout le monde ?<br><span style=&quot;color: var(--chalk-red)&quot;>Cette action est irréversible.</span>"
      :winner-name="winnerName"
      @close-rules="showRules = false"
      @close-reset="showReset = false"
      @confirm-reset="onReset"
      @close-winner="$emit('back')"
      @new-game="onReset">
      <template #rules-content><slot name="rules-content">Règles du jeu.</slot></template>
      <template #winner-stats><slot name="winner-stats"></slot></template>
    </GameModals>
  </div>
</template>

<script>
import GameHeader from '../components/shared/GameHeader.vue'
import GameModals from '../components/shared/GameModals.vue'
import HistoryPanel from '../components/shared/HistoryPanel.vue'

export default {
  name: 'RemoteGameShell',
  components: { GameHeader, GameModals, HistoryPanel },
  props: {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    code: { type: String, default: '' },
    participantCount: { type: Number, default: 1 },
    connected: { type: Boolean, default: false },
    presenceTitle: { type: String, default: '' },
    history: { type: Array, default: () => [] },
    finished: { type: Boolean, default: false },
    winnerName: { type: String, default: '' },
  },
  emits: ['back', 'undo', 'reset', 'share'],
  data() {
    return { showRules: false, showReset: false }
  },
  methods: {
    onReset() {
      this.showReset = false
      this.$emit('reset')
    },
  },
}
</script>

<style scoped>
.rgs-code {
  font-family: var(--font-display); font-size: 18px; letter-spacing: 2px;
  color: var(--chalk-gold); cursor: pointer; padding: 0 4px;
}
.rgs-presence { display: inline-flex; align-items: center; gap: 4px; font-family: var(--font-hand); font-size: 16px; color: var(--chalk-faint); }
.rgs-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--chalk-faint2); }
.rgs-dot.live { background: var(--chalk-green); }
@media (min-width: 1280px) {
  .rgs-body { grid-template-columns: 1fr 332px; }
  .rgs-sidebar { border-left: 2px dashed var(--chalk-line); }
}
@media (max-width: 1279px) {
  .rgs-sidebar { border-top: 2px dashed var(--chalk-line); }
}
</style>
