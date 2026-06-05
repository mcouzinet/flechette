<template>
  <div class="flex items-center justify-between">
    <span class="text-lg xl:text-[22px]" style="font-family: var(--font-display); letter-spacing: 0.5px">L'HISTORIQUE</span>
    <button
      @click="$emit('undo')"
      :class="history.length ? 'chalk-btn-red' : 'chalk-btn-ghost'"
      :disabled="history.length === 0">
      &#8634; Annuler
    </button>
  </div>

  <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5 chalk-scroll">
    <div v-if="history.length === 0" class="m-auto text-center py-6 text-[20px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">
      <div class="text-[30px] opacity-50">&#9998;</div>
      Aucun coup jou&eacute;...<br>l'historique s'affichera ici.
    </div>
    <div
      v-for="(entry, index) in reversedHistory"
      :key="index"
      class="py-2 px-1"
      style="border-bottom: 1.5px dashed var(--chalk-line2)">
      <slot name="entry" :entry="entry" :index="index" :total="history.length"></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HistoryPanel',
  props: {
    history: { type: Array, required: true }
  },
  emits: ['undo'],
  computed: {
    reversedHistory() {
      return [...this.history].reverse()
    }
  }
}
</script>
