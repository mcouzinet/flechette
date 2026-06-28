<template>
  <div class="gle-root">
    <div class="gle-icon">⚠</div>
    <p>Impossible de charger cet écran.</p>
    <button class="gle-btn" @click="reload">Recharger l'app</button>
  </div>
</template>

<script>
// Shown by defineAsyncComponent if a screen's chunk fails to load (e.g. a stale
// hashed chunk after a redeploy while the tab stayed open) — avoids a blank page.
export default { name: 'GameLoadError', methods: { reload() { window.location.reload() } } }
</script>

<style scoped>
.gle-root {
  height: 100%; display: flex; flex-direction: column; gap: 16px; align-items: center; justify-content: center; text-align: center; padding: 40px;
  font-family: var(--font-hand); font-size: 21px; color: var(--chalk-faint);
  background: radial-gradient(130% 90% at 50% -10%, #20322b, var(--chalk-bg) 72%);
}
.gle-icon { font-size: 40px; }
.gle-btn {
  border: 2px solid var(--chalk-gold); border-radius: 12px; padding: 8px 22px; background: transparent;
  color: var(--chalk-gold); font-family: var(--font-hand); font-weight: 600; font-size: 19px; cursor: pointer;
}
</style>
