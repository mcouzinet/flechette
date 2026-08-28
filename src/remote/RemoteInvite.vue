<template>
  <!-- Le panneau d'invitation : il ne s'ouvre QUE si la partie a ete lancee
       avec l'option « jouer a distance ». Ce n'est pas un mode, c'est l'ecran
       qui donne le lien juste apres le lancement — et que la pastille du code
       rouvre a la demande. -->
  <div class="ri-veil" role="dialog" aria-modal="true" aria-labelledby="ri-title" @click.self="$emit('close')">
    <div class="ri-card chalk-grain">
      <h2 id="ri-title" class="ri-title">LA PARTIE EST OUVERTE</h2>
      <p class="ri-sub">{{ gameName }} · {{ playerCount }} joueur{{ playerCount > 1 ? 's' : '' }}</p>

      <p class="ri-lead">Envoie le lien. Chacun ouvre la partie sur son téléphone et note ses points.</p>

      <div class="ri-code-wrap">
        <span class="ri-code-label">le code</span>
        <span class="ri-code">{{ code }}</span>
      </div>

      <p class="ri-link">{{ link }}</p>

      <div class="ri-actions">
        <button v-if="canShare" class="ri-btn ri-btn-gold" @click="share">Partager le lien</button>
        <button class="ri-btn" :class="copied ? 'ri-btn-green' : 'ri-btn-gold'" @click="copy">
          {{ copied ? '✓ Lien copié' : 'Copier le lien' }}
        </button>
      </div>

      <button class="ri-close" @click="$emit('close')">Commencer à jouer</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RemoteInvite',
  props: {
    code: { type: String, required: true },
    gameName: { type: String, default: '' },
    playerCount: { type: Number, default: 0 },
  },
  emits: ['close'],
  data() {
    return { copied: false, copyTimer: null }
  },
  computed: {
    link() {
      if (typeof window === 'undefined') return ''
      const { origin, pathname } = window.location
      return `${origin}${pathname}?partie=${this.code}`
    },
    canShare() {
      return typeof navigator !== 'undefined' && !!navigator.share
    },
  },
  mounted() {
    this._esc = (e) => { if (e.key === 'Escape') this.$emit('close') }
    window.addEventListener('keydown', this._esc)
  },
  beforeUnmount() {
    if (this.copyTimer) clearTimeout(this.copyTimer)
    window.removeEventListener('keydown', this._esc)
  },
  methods: {
    async share() {
      try {
        await navigator.share({
          title: 'Stonk',
          text: `Rejoins ma partie de fléchettes (code ${this.code})`,
          url: this.link,
        })
      } catch (_) { /* l'utilisateur a annule le partage */ }
    },
    async copy() {
      try {
        await navigator.clipboard.writeText(this.link)
        this.copied = true
        if (this.copyTimer) clearTimeout(this.copyTimer)
        this.copyTimer = setTimeout(() => { this.copied = false }, 2200)
      } catch (_) {
        // Pas de presse-papier (contexte non securise, vieux navigateur) : on
        // selectionne le lien pour que la copie manuelle reste possible.
        const el = this.$el.querySelector('.ri-link')
        if (el && window.getSelection) {
          const range = document.createRange()
          range.selectNodeContents(el)
          const sel = window.getSelection()
          sel.removeAllRanges()
          sel.addRange(range)
        }
      }
    },
  },
}
</script>

<style scoped>
.ri-veil {
  position: fixed; inset: 0; z-index: 70; display: flex; align-items: center; justify-content: center;
  padding: 20px; background: rgba(0, 0, 0, 0.62); backdrop-filter: blur(3px);
}
.ri-card {
  width: 100%; max-width: 420px; max-height: 100%; overflow-y: auto;
  display: flex; flex-direction: column; gap: 10px; text-align: center;
  padding: 24px 20px calc(20px + env(safe-area-inset-bottom));
  border: 2px dashed var(--chalk-line); border-radius: 18px;
  background: radial-gradient(120% 80% at 50% 0%, #1e2e28, var(--chalk-bg) 70%);
  color: var(--chalk-cream);
}
.ri-title { font-family: var(--font-display); font-size: 22px; letter-spacing: 1px; margin: 0; }
.ri-sub { font-family: var(--font-hand); font-weight: 600; font-size: 19px; color: var(--chalk-gold); margin: -4px 0 0; }
.ri-lead { font-family: var(--font-hand); font-weight: 600; font-size: 18px; color: var(--chalk-faint); margin: 6px 0 2px; line-height: 1.25; }
.ri-code-wrap {
  display: flex; flex-direction: column; gap: 2px; align-items: center;
  border: 2px solid var(--chalk-gold); border-radius: 14px; padding: 10px 14px;
  background: rgba(236, 198, 106, 0.08);
}
.ri-code-label { font-family: var(--font-hand); font-weight: 600; font-size: 15px; color: var(--chalk-faint); }
.ri-code { font-family: var(--font-display); font-size: 38px; letter-spacing: 8px; color: var(--chalk-gold); line-height: 1.1; }
.ri-link {
  font-family: var(--font-ui); font-size: 13px; color: var(--chalk-faint2);
  word-break: break-all; margin: 0; user-select: all;
}
.ri-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.ri-btn {
  flex: 1 1 150px; min-height: 44px; border-radius: 12px; padding: 8px 14px; background: transparent;
  border: 2px solid currentColor; font-family: var(--font-hand); font-weight: 600; font-size: 19px; cursor: pointer;
}
.ri-btn-gold { color: var(--chalk-gold); }
.ri-btn-green { color: var(--chalk-green); }
.ri-close {
  min-height: 48px; margin-top: 4px; border: 2px solid var(--chalk-red); border-radius: 14px; padding: 8px 18px;
  background: transparent; color: var(--chalk-red); font-family: var(--font-hand); font-weight: 600; font-size: 24px; cursor: pointer;
}
</style>
