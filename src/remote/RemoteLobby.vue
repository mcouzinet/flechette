<template>
  <div class="lb">
    <header class="lb-top">
      <button class="lb-ghost" @click="$emit('home')">‹ Accueil</button>
      <span class="lb-title">À DISTANCE</span>
      <span style="width: 64px"></span>
    </header>

    <p class="lb-intro">Une partie, deux téléphones. Chacun note en direct.</p>

    <div class="lb-tabs">
      <button :class="['lb-tab', tab === 'create' && 'on']" @click="tab = 'create'">Créer</button>
      <button :class="['lb-tab', tab === 'join' && 'on']" @click="tab = 'join'">Rejoindre</button>
    </div>

    <!-- CREATE -->
    <div v-if="tab === 'create'" class="lb-pane">
      <div class="lb-label">Le jeu</div>
      <div class="lb-games">
        <button v-for="g in games" :key="g.meta.id"
          :class="['lb-game', gameId === g.meta.id && 'sel']" @click="gameId = g.meta.id">
          <span class="lb-game-name">{{ g.meta.name }}</span>
          <span class="lb-game-short">{{ g.meta.short }}</span>
        </button>
      </div>

      <div v-if="gameId === 'x01'" class="lb-opt">
        <button v-for="s in [301, 501]" :key="s"
          :class="['lb-pill', config.start === s && 'on']" @click="config.start = s">{{ s }}</button>
      </div>

      <div class="lb-label">Les joueurs</div>
      <div class="lb-players">
        <div v-for="(p, i) in players" :key="i" class="lb-prow">
          <span class="lb-pnum">{{ i + 1 }}.</span>
          <input v-model="p.name" :placeholder="`joueur ${i + 1}`" class="lb-pinput" />
          <button v-if="players.length > 2" class="lb-px" @click="players.splice(i, 1)">×</button>
        </div>
        <button v-if="players.length < 6" class="lb-add" @click="players.push({ name: '' })">+ ajouter</button>
      </div>

      <button class="lb-go" :disabled="busy || !canCreate" @click="create">
        {{ busy ? 'Création…' : 'Créer la partie' }}
      </button>
    </div>

    <!-- JOIN -->
    <div v-else class="lb-pane">
      <div class="lb-label">Code de la partie</div>
      <input v-model="code" :placeholder="placeholder" :maxlength="codeLen"
        class="lb-code" @input="code = code.toUpperCase()" />
      <div class="lb-label">Ton nom</div>
      <input v-model="joinName" placeholder="ton nom" class="lb-pinput lb-joinname" />
      <button class="lb-go" :disabled="busy || code.trim().length !== codeLen" @click="join">
        {{ busy ? 'Connexion…' : 'Rejoindre' }}
      </button>
    </div>

    <div v-if="error" class="lb-error">{{ error }}</div>
  </div>
</template>

<script>
import { GAME_LIST } from './games/index.js'
import { createSession, joinSession, CODE_LEN } from './session.js'

export default {
  name: 'RemoteLobby',
  props: { players: { type: Array, default: () => [] } },
  emits: ['start', 'home'],
  data() {
    const prefill = (this.players || []).filter((p) => p.name).map((p) => ({ name: p.name }))
    while (prefill.length < 2) prefill.push({ name: '' })
    return {
      tab: 'create',
      games: GAME_LIST,
      gameId: 'x01',
      config: { start: 301 },
      players: prefill,
      code: '',
      codeLen: CODE_LEN,
      joinName: prefill[0]?.name || 'Invité',
      error: '',
      busy: false,
    }
  },
  computed: {
    canCreate() {
      return this.players.filter((p) => p.name.trim()).length >= 2
    },
    placeholder() {
      return 'ABCDEFGH'.slice(0, this.codeLen)
    },
  },

  methods: {
    async create() {
      this.error = ''
      const named = this.players.filter((p) => p.name.trim()).map((p, i) => ({ id: `p${i}`, name: p.name.trim() }))
      if (named.length < 2) {
        this.error = 'Il faut au moins 2 joueurs.'
        return
      }
      this.busy = true
      try {
        const cfg = this.gameId === 'x01' ? { start: this.config.start } : {}
        const code = await createSession({ gameId: this.gameId, config: cfg, players: named, hostName: named[0].name })
        this.$emit('start', code)
      } catch (e) {
        this.error = e.message || 'Erreur à la création.'
      } finally {
        this.busy = false
      }
    },
    async join() {
      this.error = ''
      this.busy = true
      try {
        await joinSession(this.code, this.joinName.trim() || 'Invité')
        this.$emit('start', this.code.trim().toUpperCase())
      } catch (e) {
        this.error = e.message || 'Session introuvable.'
      } finally {
        this.busy = false
      }
    },
  },
}
</script>

<style scoped>
.lb {
  height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 14px;
  padding: 14px 18px calc(20px + env(safe-area-inset-bottom));
  color: var(--chalk-cream); font-family: var(--font-ui);
  background: radial-gradient(130% 90% at 50% -10%, #20322b, var(--chalk-bg) 72%);
}
.lb-top { display: flex; align-items: center; justify-content: space-between; }
.lb-title { font-family: var(--font-display); font-size: 22px; letter-spacing: 1px; }
.lb-ghost {
  border: 2px solid var(--chalk-line); border-radius: 12px; padding: 6px 14px; background: transparent;
  color: var(--chalk-faint); font-family: var(--font-hand); font-weight: 600; font-size: 17px; cursor: pointer;
}
.lb-intro { font-family: var(--font-hand); font-size: 20px; color: var(--chalk-gold); margin: -4px 0 0; }
.lb-tabs { display: flex; gap: 10px; }
.lb-tab {
  flex: 1; padding: 10px 0; border: 2px solid var(--chalk-line); border-radius: 12px; background: transparent;
  color: var(--chalk-faint); font-family: var(--font-hand); font-weight: 600; font-size: 20px; cursor: pointer;
}
.lb-tab.on { border-color: var(--chalk-gold); color: var(--chalk-gold); background: rgba(236, 198, 106, 0.08); }
.lb-pane { display: flex; flex-direction: column; gap: 12px; }
.lb-label { font-family: var(--font-display); font-size: 16px; letter-spacing: 0.5px; color: var(--chalk-cream); }
.lb-games { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.lb-game {
  text-align: left; border: 2px dashed var(--chalk-line); border-radius: 12px; padding: 12px; background: transparent; cursor: pointer;
}
.lb-game.sel { border-style: solid; border-color: var(--chalk-gold); background: rgba(236, 198, 106, 0.1); }
.lb-game-name { display: block; font-family: var(--font-display); font-size: 18px; color: var(--chalk-cream); }
.lb-game-short { display: block; font-family: var(--font-hand); font-size: 16px; color: var(--chalk-faint); margin-top: 2px; }
.lb-opt { display: flex; gap: 8px; }
.lb-pill {
  padding: 6px 18px; border: 2px solid var(--chalk-line); border-radius: 20px; background: transparent;
  color: var(--chalk-faint); font-family: var(--font-display); font-size: 16px; cursor: pointer;
}
.lb-pill.on { border-color: var(--chalk-gold); color: var(--chalk-gold); }
.lb-players { display: flex; flex-direction: column; gap: 6px; }
.lb-prow { display: flex; align-items: center; gap: 10px; border-bottom: 1.5px dashed var(--chalk-line); padding: 4px 0; }
.lb-pnum { font-family: var(--font-hand); font-size: 20px; color: var(--chalk-faint2); width: 22px; }
.lb-pinput {
  flex: 1; background: transparent; border: none; outline: none; color: var(--chalk-cream);
  font-family: var(--font-hand); font-weight: 600; font-size: 24px; -webkit-appearance: none;
}
.lb-joinname { border-bottom: 1.5px dashed var(--chalk-line); }
.lb-px { background: transparent; border: none; color: var(--chalk-faint2); font-size: 22px; cursor: pointer; padding: 0 6px; }
.lb-add {
  align-self: flex-start; margin-top: 4px; border: 2px solid var(--chalk-green); border-radius: 12px; padding: 4px 16px;
  background: transparent; color: var(--chalk-green); font-family: var(--font-hand); font-size: 18px; cursor: pointer;
}
.lb-code {
  width: 100%; text-align: center; letter-spacing: 8px; background: transparent;
  border: 2px solid var(--chalk-line); border-radius: 14px; padding: 14px 0; color: var(--chalk-gold);
  font-family: var(--font-display); font-size: 32px; outline: none; -webkit-appearance: none; text-transform: uppercase;
}
.lb-go {
  margin-top: 6px; border: 2px solid var(--chalk-red); border-radius: 16px; padding: 12px 0; background: transparent;
  color: var(--chalk-red); font-family: var(--font-hand); font-weight: 600; font-size: 26px; cursor: pointer;
}
.lb-go:disabled { opacity: 0.4; }
.lb-error { text-align: center; font-family: var(--font-hand); font-size: 18px; color: var(--chalk-red); }
</style>
