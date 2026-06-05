<template>
  <!-- Modal Regles -->
  <div v-if="showRules" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="chalk-grain rounded-2xl p-6 xl:p-8 border-2 border-dashed max-w-lg mx-4 max-h-[80vh] overflow-y-auto chalk-scroll"
      style="background: radial-gradient(120% 80% at 50% 0%, #1e2e28, var(--chalk-bg) 70%); border-color: var(--chalk-line)">
      <h3 class="text-2xl text-center mb-4" style="font-family: var(--font-display); color: var(--chalk-gold)">{{ rulesTitle }}</h3>
      <div class="space-y-3 text-[15px] leading-relaxed" style="font-family: var(--font-ui); color: var(--chalk-faint)">
        <slot name="rules-content"></slot>
      </div>
      <div class="flex justify-center mt-5">
        <button @click="$emit('close-rules')" class="chalk-btn-ghost">Compris !</button>
      </div>
    </div>
  </div>

  <!-- Modal Reset -->
  <div v-if="showReset" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="chalk-grain rounded-2xl p-8 border-2 border-dashed max-w-md mx-4"
      style="background: radial-gradient(120% 80% at 50% 0%, #1e2e28, var(--chalk-bg) 70%); border-color: var(--chalk-line)">
      <h3 class="text-2xl text-center mb-4" style="font-family: var(--font-display); color: var(--chalk-red)">CONFIRMER LE RESET</h3>
      <p class="text-center mb-6" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">
        {{ resetMessage }}
      </p>
      <div class="flex gap-3 justify-center">
        <button @click="$emit('close-reset')" class="chalk-btn-ghost">Annuler</button>
        <button @click="$emit('confirm-reset')" class="chalk-btn-red">Reset</button>
      </div>
    </div>
  </div>

  <!-- Modal Victoire -->
  <div v-if="showWinner" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="chalk-grain rounded-2xl p-8 border-2 border-solid max-w-lg mx-4 text-center"
      style="background: radial-gradient(120% 80% at 50% 0%, #1e2e28, var(--chalk-bg) 70%); border-color: var(--chalk-gold)">
      <div class="text-5xl mb-4">&#127881;</div>
      <h2 class="text-4xl mb-4" style="font-family: var(--font-display); color: var(--chalk-gold)">VICTOIRE !</h2>
      <div class="mb-6">
        <div class="text-2xl mb-2" style="font-family: var(--font-hand); font-weight: 700">{{ winnerName }}</div>
        <div style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">{{ winnerSubtitle }}</div>
      </div>

      <div v-if="$slots['winner-stats']" class="rounded-xl p-4 mb-6" style="background: rgba(134,199,160,0.1); border: 2px dashed var(--chalk-green)">
        <div class="grid grid-cols-2 gap-4 text-center">
          <slot name="winner-stats"></slot>
        </div>
      </div>

      <div class="flex gap-3 justify-center">
        <button @click="$emit('close-winner')" class="chalk-btn-ghost">Continuer</button>
        <button @click="$emit('new-game')" class="chalk-btn-green">Nouvelle partie</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GameModals',
  props: {
    showRules: { type: Boolean, default: false },
    showReset: { type: Boolean, default: false },
    showWinner: { type: Boolean, default: false },
    rulesTitle: { type: String, default: 'REGLES' },
    resetMessage: { type: String, default: 'Remettre a zero la partie ?<br><span style="color: var(--chalk-red)">Cette action est irreversible.</span>' },
    winnerName: { type: String, default: '' },
    winnerSubtitle: { type: String, default: 'a remporte la partie !' }
  },
  emits: ['close-rules', 'close-reset', 'confirm-reset', 'close-winner', 'new-game']
}
</script>
