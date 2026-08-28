<template>
  <p v-for="(rule, i) in rules" :key="i">
    <span style="color: var(--chalk-cream)">{{ rule.label }}</span>{{ rule.text ? ' ' + rule.text : '' }}
  </p>
</template>

<script>
export default {
  name: 'RulesList',
  // Rend une entree de src/rules.js. Une ligne sans `text` s'affiche
  // entierement en craie claire, comme « 3 flechettes par tour. ».
  props: { rules: { type: Array, default: () => [] } },
}
</script>
