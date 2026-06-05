<template>
  <header class="flex flex-wrap items-center justify-between gap-2 px-4 pt-2 pb-2 xl:gap-3 xl:px-5 xl:pt-3 xl:pb-3 relative" style="border-bottom: 2px dashed var(--chalk-line); margin: 9px 9px 0">
    <button @click="$emit('back')" class="chalk-btn-ghost text-base xl:text-[21px]">&#8249; Retour</button>
    <div class="flex items-center gap-2 min-w-0">
      <span class="text-xl xl:text-[28px]" style="font-family: var(--font-display); letter-spacing: 0.5px">{{ title }}</span>
      <slot name="title-extra"></slot>
      <span v-if="subtitle" class="text-[19px] whitespace-nowrap hidden xl:inline" style="font-family: var(--font-hand); font-weight: 600" :style="{ color: subtitleColor }">{{ subtitle }}</span>
    </div>
    <div class="flex gap-2 flex-none">
      <button v-if="showRules" @click="$emit('show-rules')" class="chalk-btn-ghost text-base xl:text-[21px]">? R&egrave;gles</button>
      <button @click="$emit('toggle-fullscreen')" class="chalk-btn-ghost text-base xl:text-[21px] hidden xl:block btn-fullscreen">{{ isFullscreen ? 'Quitter' : '&#9974; Plein &eacute;cran' }}</button>
      <button @click="$emit('confirm-reset')" class="chalk-btn-green text-base xl:text-[21px]">&#8635; Relancer</button>
    </div>
  </header>
</template>

<script>
export default {
  name: 'GameHeader',
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    subtitleColor: { type: String, default: 'var(--chalk-gold)' },
    isFullscreen: { type: Boolean, default: false },
    showRules: { type: Boolean, default: true }
  },
  emits: ['back', 'show-rules', 'toggle-fullscreen', 'confirm-reset']
}
</script>
