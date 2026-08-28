<template>
  <div class="rj">
    <header class="rj-top">
      <button class="rj-ghost" @click="$emit('home')">‹ Accueil</button>
      <span class="rj-title">REJOINDRE</span>
      <span style="width: 74px"></span>
    </header>

    <!-- 0. Le lien portait deja le code : on ne demande rien, on connecte -->
    <div v-if="!session && busy" class="rj-wait">
      <div class="rj-spinner"></div>
      <p>Connexion à la partie…</p>
    </div>

    <!-- 1. Le code, seulement si on n'est pas arrive par le lien -->
    <div v-else-if="!session" class="rj-pane">
      <p class="rj-lead">Entre le code que l'organisateur t'a donné.</p>
      <label for="rj-code" class="sr-only">Code de la partie</label>
      <input id="rj-code" v-model="codeInput" :maxlength="codeLen" :placeholder="placeholder"
        class="rj-code" @input="onCodeInput" @keyup.enter="lookup"
        autocapitalize="characters" autocorrect="off" autocomplete="off" spellcheck="false" enterkeyhint="go" />
      <button class="rj-go" :disabled="busy || codeInput.length !== codeLen" @click="lookup">
        {{ busy ? 'Recherche…' : 'Continuer' }}
      </button>
    </div>

    <!-- 2. Qui es-tu ? -->
    <div v-else class="rj-pane">
      <p class="rj-lead">
        <span class="rj-strong">{{ gameName }}</span> · {{ session.players.length }} joueurs
      </p>
      <div class="rj-label">Qui es-tu ?</div>
      <div class="rj-roster">
        <button v-for="p in session.players" :key="p.id"
          :class="['rj-who', name === p.name && 'on']" @click="name = p.name">{{ p.name }}</button>
      </div>
      <label for="rj-name" class="sr-only">Ou entre ton nom</label>
      <input id="rj-name" v-model="name" placeholder="ou entre ton nom…" class="rj-name"
        autocapitalize="words" autocorrect="off" spellcheck="false" enterkeyhint="go" @keyup.enter="join" />
      <button class="rj-go" :disabled="busy || !name.trim()" @click="join">
        {{ busy ? 'Connexion…' : 'Rejoindre la partie' }}
      </button>
    </div>

    <p v-if="error" class="rj-error">{{ error }}</p>
  </div>
</template>

<script>
import { peekSession, joinSession, normalizeCode, CODE_LEN } from './session.js'
import { GAMES } from './games/index.js'

export default {
  name: 'RemoteJoin',
  props: { code: { type: String, default: '' } },
  emits: ['joined', 'home'],
  data() {
    return {
      codeInput: normalizeCode(this.code).slice(0, CODE_LEN),
      codeLen: CODE_LEN,
      session: null,
      name: '',
      error: '',
      // Deja vrai au premier rendu quand le lien portait le code : sans ca,
      // l'ecran de saisie clignote une frame avant la recherche.
      busy: normalizeCode(this.code).length === CODE_LEN,
    }
  },
  computed: {
    placeholder() { return 'ABCDEFGH'.slice(0, this.codeLen) },
    gameName() {
      const g = this.session && GAMES[this.session.gameId]
      return g ? g.meta.name : 'Partie'
    },
  },
  mounted() {
    // Arrive par le lien : le code est deja connu, on saute l'etape saisie.
    if (this.codeInput.length === this.codeLen) this.lookup()
    else this.busy = false
  },
  methods: {
    onCodeInput() {
      this.codeInput = normalizeCode(this.codeInput).slice(0, this.codeLen)
    },
    async lookup() {
      if (this.codeInput.length !== this.codeLen) return
      this.error = ''
      this.busy = true
      try {
        this.session = await peekSession(this.codeInput)
        this.name = ''
      } catch (e) {
        const msg = String((e && e.message) || '')
        // « Session introuvable » est le vocabulaire du service, pas celui du
        // joueur : il a tape 6 lettres, on lui parle de ces 6 lettres.
        this.error = msg.includes('introuvable')
          ? 'Aucune partie avec ce code. Vérifie les 6 lettres.'
          : msg || 'La partie n\'a pas pu être ouverte.'
      } finally {
        this.busy = false
      }
    },
    async join() {
      const who = this.name.trim()
      if (!who) return
      this.error = ''
      this.busy = true
      try {
        await joinSession(this.codeInput, who)
        this.$emit('joined', this.codeInput)
      } catch (e) {
        this.error = (e && e.message) || 'Impossible de rejoindre.'
      } finally {
        this.busy = false
      }
    },
  },
}
</script>

<style scoped>
.rj {
  height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 16px;
  padding: 14px 18px calc(24px + env(safe-area-inset-bottom));
  color: var(--chalk-cream); font-family: var(--font-ui);
  background: radial-gradient(130% 90% at 50% -10%, #20322b, var(--chalk-bg) 72%);
}
.rj-top { display: flex; align-items: center; justify-content: space-between; }
.rj-title { font-family: var(--font-display); font-size: 22px; letter-spacing: 1px; }
.rj-ghost {
  min-height: 44px; border: 2px solid var(--chalk-line); border-radius: 12px; padding: 6px 14px;
  background: transparent; color: var(--chalk-faint); font-family: var(--font-hand); font-weight: 600; font-size: 17px; cursor: pointer;
}
.rj-pane { display: flex; flex-direction: column; gap: 12px; }
.rj-wait {
  flex: 1; display: flex; flex-direction: column; gap: 14px; align-items: center; justify-content: center;
  font-family: var(--font-hand); font-weight: 600; font-size: 21px; color: var(--chalk-faint);
}
.rj-spinner {
  width: 30px; height: 30px; border-radius: 50%;
  border: 3px solid var(--chalk-line); border-top-color: var(--chalk-gold);
  animation: rj-spin 0.7s linear infinite;
}
@keyframes rj-spin { to { transform: rotate(360deg); } }
.rj-lead { font-family: var(--font-hand); font-weight: 600; font-size: 20px; color: var(--chalk-gold); margin: 0; }
.rj-strong { color: var(--chalk-cream); font-family: var(--font-display); font-size: 19px; letter-spacing: 0.5px; }
.rj-label { font-family: var(--font-display); font-size: 16px; letter-spacing: 0.5px; }
.rj-code {
  width: 100%; text-align: center; letter-spacing: 8px; background: transparent;
  border: 2px solid var(--chalk-line); border-radius: 14px; padding: 14px 0; color: var(--chalk-gold);
  font-family: var(--font-display); font-size: 32px; -webkit-appearance: none; text-transform: uppercase;
}
.rj-roster { display: flex; flex-wrap: wrap; gap: 8px; }
.rj-who {
  min-height: 44px; padding: 6px 16px; border: 2px dashed var(--chalk-line); border-radius: 12px;
  background: transparent; color: var(--chalk-cream); font-family: var(--font-hand); font-weight: 600; font-size: 22px; cursor: pointer;
}
.rj-who.on { border-style: solid; border-color: var(--chalk-gold); color: var(--chalk-gold); background: rgba(236, 198, 106, 0.1); }
.rj-name {
  min-height: 44px; background: transparent; border: none; border-bottom: 1.5px dashed var(--chalk-line);
  color: var(--chalk-cream); font-family: var(--font-hand); font-weight: 600; font-size: 24px; -webkit-appearance: none;
}
.rj-go {
  min-height: 48px; margin-top: 4px; border: 2px solid var(--chalk-red); border-radius: 16px; padding: 10px 0;
  background: transparent; color: var(--chalk-red); font-family: var(--font-hand); font-weight: 600; font-size: 26px; cursor: pointer;
}
.rj-go:disabled { opacity: 0.4; }
.rj-error { text-align: center; font-family: var(--font-hand); font-weight: 600; font-size: 18px; color: var(--chalk-red); }
</style>
