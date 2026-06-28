<template>
  <div class="gl-root">
    <div class="gl-dot"></div>
    <span class="gl-text">Chargement…</span>
  </div>
</template>

<script>
// Shown by defineAsyncComponent while a game screen's chunk downloads.
export default { name: 'GameLoading' }
</script>

<style scoped>
.gl-root {
  height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
  background: radial-gradient(130% 90% at 50% -10%, #20322b, var(--chalk-bg) 72%);
}
.gl-dot {
  width: 28px; height: 28px; border-radius: 50%;
  border: 3px solid var(--chalk-line2); border-top-color: var(--chalk-gold);
  animation: gl-spin 0.7s linear infinite;
}
.gl-text { font-family: var(--font-hand); font-weight: 600; font-size: 20px; color: var(--chalk-faint); letter-spacing: 0.3px; }
@keyframes gl-spin { to { transform: rotate(360deg); } }
</style>
