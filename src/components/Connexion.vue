<template>
  <div class="cx">
    <div class="cx-card">
      <div class="cx-brand">
        <div class="chalk-target w-9 h-9"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill="currentColor" opacity=".25"/><circle cx="20" cy="20" r="13" fill="var(--chalk-bg, #142019)"/><circle cx="20" cy="20" r="8" fill="currentColor" opacity=".25"/><circle cx="20" cy="20" r="3" fill="currentColor"/></svg></div>
        <h1 class="cx-title">STONK</h1>
      </div>
      <p class="cx-lead">{{ invited ? 'Connecte-toi pour rejoindre la partie.' : 'Connecte-toi pour jouer. Tes scores te suivent partout.' }}</p>

      <!-- Fournisseurs configurés sur le serveur seulement (lus dans auth-methods). -->
      <div v-if="providers.length" class="cx-providers">
        <button v-for="p in providers" :key="p" class="cx-btn" :class="'cx-' + p" :disabled="busy"
          @click="withProvider(p)">{{ LABELS[p] || p }}</button>
        <p class="cx-or">ou par email</p>
      </div>

      <div v-if="!otpId" class="cx-pane">
        <label for="cx-email" class="sr-only">Ton adresse email</label>
        <input id="cx-email" v-model="email" type="email" placeholder="ton adresse email" @keyup.enter="sendCode"
          autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="email" enterkeyhint="send" class="cx-input" />
        <button class="cx-go" :disabled="!email.trim() || busy" @click="sendCode">
          {{ busy ? 'Envoi en cours…' : 'Recevoir un code' }}</button>
      </div>

      <div v-else class="cx-pane">
        <p class="cx-note">Code envoyé à {{ email }}.</p>
        <label for="cx-code" class="sr-only">Code reçu par email</label>
        <input id="cx-code" v-model="code" placeholder="code à 6 chiffres" @keyup.enter="checkCode"
          inputmode="numeric" autocomplete="one-time-code" maxlength="6" enterkeyhint="go" class="cx-input cx-code" />
        <button class="cx-go" :disabled="code.trim().length < 6 || busy" @click="checkCode">
          {{ busy ? 'Vérification…' : 'Se connecter' }}</button>
        <button class="cx-link" @click="otpId = null; code = ''; error = ''">changer d'adresse</button>
      </div>

      <p v-if="error" class="cx-error" role="alert">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import { requestCode, verifyCode, signInWithProvider, listProviders } from '../services/account.js'

export default {
  name: 'Connexion',
  props: { invited: { type: Boolean, default: false } },
  emits: ['connected'],
  data() {
    return {
      LABELS: { google: 'Continuer avec Google', discord: 'Continuer avec Discord', apple: ' Continuer avec Apple' },
      providers: [], email: '', code: '', otpId: null, busy: false, error: '',
    }
  },
  async mounted() {
    this.providers = await listProviders()
  },
  methods: {
    // Pas d'await avant signInWithProvider : la fenêtre du fournisseur doit
    // s'ouvrir dans le geste du clic (Safari iOS bloque sinon).
    withProvider(p) {
      this.busy = true
      this.error = ''
      signInWithProvider(p)
        .then((u) => { if (u) this.$emit('connected', u) })
        .catch((e) => { console.error('Connexion ' + p + ' :', e); this.error = 'La connexion a échoué. Réessaie ou passe par l\'email.' })
        .finally(() => { this.busy = false })
    },
    async sendCode() {
      if (!this.email.trim()) return
      this.busy = true
      this.error = ''
      try {
        this.otpId = await requestCode(this.email)
        this.code = ''
      } catch (e) {
        console.error('Envoi du code :', e)
        this.error = 'Erreur lors de l\'envoi. Vérifie l\'adresse email.'
      } finally {
        this.busy = false
      }
    },
    async checkCode() {
      this.busy = true
      this.error = ''
      try {
        const u = await verifyCode(this.otpId, this.code)
        if (u) this.$emit('connected', u)
      } catch (e) {
        console.error('Vérification du code :', e)
        this.error = 'Code invalide ou expiré.'
      } finally {
        this.busy = false
      }
    },
  },
}
</script>

<style scoped>
.cx {
  min-height: 100%; display: flex; align-items: center; justify-content: center;
  padding: calc(24px + env(safe-area-inset-top)) 18px calc(24px + env(safe-area-inset-bottom));
}
.cx-card { width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 14px; color: var(--chalk-cream); }
.cx-brand { display: flex; align-items: center; gap: 12px; }
.cx-title { font-family: var(--font-display); font-size: 40px; letter-spacing: 2px; margin: 0; text-shadow: 0 1px 0 rgba(0,0,0,.3); }
.cx-lead { font-family: var(--font-hand); font-weight: 600; font-size: 21px; color: var(--chalk-gold); margin: 0 0 8px; line-height: 1.25; }
.cx-providers { display: flex; flex-direction: column; gap: 10px; }
.cx-btn {
  min-height: 48px; border: 2px solid currentColor; border-radius: 14px; background: transparent; cursor: pointer;
  font-family: var(--font-hand); font-weight: 600; font-size: 21px; color: var(--chalk-cream);
}
.cx-google { color: var(--chalk-gold); }
.cx-discord { color: var(--chalk-blue); }
.cx-btn:disabled, .cx-go:disabled { opacity: 0.4; }
.cx-or { text-align: center; margin: 4px 0 0; font-family: var(--font-hand); font-weight: 600; font-size: 17px; color: var(--chalk-faint2); }
.cx-pane { display: flex; flex-direction: column; gap: 12px; }
.cx-input {
  min-height: 48px; background: transparent; border: none; border-bottom: 2px solid var(--chalk-line); border-radius: 0;
  padding: 8px 4px; color: var(--chalk-cream); font-family: var(--font-ui); font-size: 17px; -webkit-appearance: none;
}
.cx-code { text-align: center; font-family: var(--font-display); font-size: 28px; letter-spacing: 0.4em; color: var(--chalk-gold); }
.cx-note { margin: 0; text-align: center; font-family: var(--font-hand); font-weight: 600; font-size: 17px; color: var(--chalk-faint); }
.cx-go {
  min-height: 52px; border: 2px solid var(--chalk-red); border-radius: 16px; background: transparent; cursor: pointer;
  color: var(--chalk-red); font-family: var(--font-hand); font-weight: 600; font-size: 26px;
}
.cx-link { min-height: 44px; background: transparent; border: none; cursor: pointer; font-family: var(--font-hand); font-size: 16px; color: var(--chalk-faint2); }
.cx-error { margin: 0; text-align: center; font-family: var(--font-hand); font-weight: 600; font-size: 18px; color: var(--chalk-red); }
</style>
