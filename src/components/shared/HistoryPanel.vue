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

  <div v-if="history.length" class="hp-spacer" aria-hidden="true"></div>

  <Teleport to="body">
    <div v-if="history.length" class="hp-bar">
      <button @click="$emit('undo')" class="chalk-btn-red hp-bar-btn">
        &#8634; Annuler{{ lastLabel ? ' : ' + lastLabel : ' le dernier coup' }}
      </button>
    </div>
  </Teleport>
</template>

<script>
export default {
  name: 'HistoryPanel',
  props: {
    history: { type: Array, required: true },
    lastLabel: { type: String, default: '' }
  },
  emits: ['undo'],
  computed: {
    reversedHistory() {
      return [...this.history].reverse()
    }
  }
}
</script>

<style scoped>
/* Annuler etait a 846 px de defilement en Cricket a 8 joueurs, alors que c'est
   le geste le plus frequent du produit. Une barre fixe le garde sous le pouce
   sur telephone ; rendue par le panneau, les dix jeux en heritent. */
.hp-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 45;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
  background: linear-gradient(to top, #16241f 78%, rgba(22, 36, 31, 0) 100%);
  border-top: 2px dashed var(--chalk-line);
}

.hp-spacer {
  height: 68px;
  flex: none;
}

@media (min-width: 1280px) {
  .hp-spacer { display: none; }
}

.hp-bar-btn {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (min-width: 1280px) {
  .hp-bar { display: none; }
}
</style>
