<template>
  <div class="score-pad">
    <!-- multiplier segmented control -->
    <div class="mult-row">
      <button v-for="m in mults" :key="m.v"
        @click="mult = m.v"
        :class="['mult-btn', mult === m.v && 'mult-on']"
        :style="mult === m.v ? { borderColor: m.color, color: m.color } : {}">
        {{ m.label }}
      </button>
    </div>

    <!-- number grid -->
    <div class="num-grid">
      <button v-for="n in numbers" :key="n"
        @click="throwDart(n)"
        :disabled="disabled || (n === 25 && mult === 3)"
        class="num-btn">
        {{ n === 25 ? 'Bull' : n }}
      </button>
    </div>

    <!-- miss -->
    <button @click="$emit('throw', { miss: true })" :disabled="disabled" class="miss-btn">
      Manqué
    </button>
  </div>
</template>

<script>
export default {
  name: 'ScorePad',
  props: {
    numbers: { type: Array, default: () => [...Array(20)].map((_, i) => i + 1).concat([25]) },
    disabled: { type: Boolean, default: false },
  },
  emits: ['throw'],
  data() {
    return {
      mult: 1,
      mults: [
        { v: 1, label: 'Simple', color: 'var(--chalk-cream)' },
        { v: 2, label: 'Double', color: 'var(--chalk-green)' },
        { v: 3, label: 'Triple', color: 'var(--chalk-gold)' },
      ],
    }
  },
  methods: {
    throwDart(n) {
      this.$emit('throw', { n, mult: this.mult })
      this.mult = 1 // reset to single after each dart, like the local games
    },
  },
}
</script>

<style scoped>
.score-pad { display: flex; flex-direction: column; gap: 10px; }
.mult-row { display: flex; gap: 8px; }
.mult-btn {
  flex: 1; padding: 10px 0; border: 2px solid var(--chalk-line); border-radius: 12px;
  background: transparent; color: var(--chalk-faint);
  font-family: var(--font-hand); font-weight: 600; font-size: 19px; cursor: pointer;
}
.mult-on { background: rgba(241, 230, 203, 0.06); }
.num-grid {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;
}
.num-btn {
  aspect-ratio: 1.3 / 1; min-height: 52px;
  border: 2px solid var(--chalk-line); border-radius: 12px;
  background: transparent; color: var(--chalk-cream);
  font-family: var(--font-display); font-size: 22px; cursor: pointer;
  transition: background 0.12s, transform 0.05s;
}
.num-btn:active { background: rgba(236, 198, 106, 0.18); transform: scale(0.96); }
.num-btn:disabled { opacity: 0.3; }
.miss-btn {
  padding: 12px 0; border: 2px dashed var(--chalk-line); border-radius: 12px;
  background: transparent; color: var(--chalk-faint2);
  font-family: var(--font-hand); font-weight: 600; font-size: 18px; cursor: pointer;
}
.miss-btn:active { background: rgba(239, 139, 111, 0.12); }
</style>
