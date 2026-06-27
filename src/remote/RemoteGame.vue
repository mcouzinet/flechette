<template>
  <div class="rg">
    <!-- top bar -->
    <header class="rg-top">
      <button class="rg-ghost" @click="quit">‹ Quitter</button>
      <div class="rg-code" @click="share">
        <span class="rg-code-label">code</span>
        <span class="rg-code-val">{{ code }}</span>
      </div>
      <div class="rg-presence" :title="presenceTitle">
        <span class="rg-dot" :class="{ live: connected }"></span>{{ participantCount }}
      </div>
    </header>

    <div v-if="error" class="rg-msg">{{ error }}</div>
    <div v-else-if="!state" class="rg-msg">Connexion à la partie…</div>

    <template v-else>
      <div class="rg-gamename">{{ game.meta.name }}</div>

      <!-- scoreboard -->
      <div class="rg-board">
        <div v-for="row in scoreboard" :key="row.id"
          class="rg-row" :class="{ active: row.active, winner: row.winner }">
          <span class="rg-name">{{ row.name }}</span>
          <span class="rg-sub">{{ row.sub }}</span>
          <span class="rg-value">{{ row.value }}</span>
        </div>
      </div>

      <!-- cricket marks grid -->
      <div v-if="marksGrid" class="rg-cricket">
        <div class="rg-cr-head">
          <span></span>
          <span v-for="z in marksGrid.zones" :key="z.label" class="rg-cr-zone">{{ z.label }}</span>
        </div>
        <div v-for="r in marksGrid.rows" :key="r.id" class="rg-cr-row">
          <span class="rg-cr-pname">{{ r.name }}</span>
          <span v-for="(m, zi) in r.marks" :key="zi" class="rg-cr-cell" :class="{ closed: r.closed[zi] }">
            {{ markSymbol(m) }}
          </span>
        </div>
      </div>

      <!-- turn indicator -->
      <div class="rg-turn" v-if="!state.finished">
        <span class="rg-turn-name">{{ activeName }}</span>
        <span class="rg-turn-darts">
          <span v-for="d in 3" :key="d" class="rg-pip" :class="{ on: d <= dartsLeft }"></span>
        </span>
      </div>
      <div class="rg-status">{{ game.selectors.status(state) }}</div>

      <!-- score pad -->
      <ScorePad :numbers="padNumbers" :disabled="state.finished || busy" @throw="onThrow" />

      <div class="rg-actions">
        <button class="rg-ghost" @click="undo" :disabled="busy">↶ Annuler</button>
        <button class="rg-ghost" @click="reset" :disabled="busy">Réinitialiser</button>
      </div>

      <!-- winner overlay -->
      <div v-if="state.finished" class="rg-win">
        <div class="rg-win-card">
          <div class="rg-win-emoji">🎯</div>
          <div class="rg-win-title">VICTOIRE</div>
          <div class="rg-win-name">{{ winnerName }}</div>
          <div class="rg-win-actions">
            <button class="rg-green" @click="reset">Rejouer</button>
            <button class="rg-ghost" @click="quit">Quitter</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import ScorePad from './ScorePad.vue'
import { getGame, buildState } from './games/index.js'
import { subscribe, throwDart, undoLast, resetGame, leaveSession } from './session.js'
import { notifySuccess } from '../services/haptics.js'

const CRICKET_PAD = [20, 19, 18, 17, 16, 15, 25]
const DEFAULT_PAD = [...Array(20)].map((_, i) => i + 1).concat([25])

export default {
  name: 'RemoteGame',
  components: { ScorePad },
  props: { code: { type: String, required: true } },
  emits: ['home'],
  data() {
    return { session: null, error: '', busy: false, connected: false, unsub: null, wasFinished: false }
  },
  computed: {
    game() {
      return this.session ? getGame(this.session.gameId) : null
    },
    state() {
      return this.session && this.game ? buildState(this.session) : null
    },
    scoreboard() {
      return this.state ? this.game.selectors.scoreboard(this.state) : []
    },
    marksGrid() {
      return this.state && this.game.selectors.marksGrid ? this.game.selectors.marksGrid(this.state) : null
    },
    padNumbers() {
      return this.session && this.session.gameId === 'cricket' ? CRICKET_PAD : DEFAULT_PAD
    },
    activeName() {
      const id = this.state && this.game.selectors.activePlayerId(this.state)
      const p = id && this.state.players.find((x) => x.id === id)
      return p ? p.name : ''
    },
    dartsLeft() {
      return this.state ? this.state.dartsLeft : 0
    },
    winnerName() {
      const w = this.state && this.game.selectors.winner(this.state)
      return w ? w.name : ''
    },
    participantCount() {
      return this.session && this.session.participants ? Object.keys(this.session.participants).length : 0
    },
    presenceTitle() {
      if (!this.session || !this.session.participants) return ''
      return Object.values(this.session.participants).map((p) => p.name).join(', ')
    },
  },
  watch: {
    'state.finished'(now) {
      if (now && !this.wasFinished) notifySuccess()
      this.wasFinished = now
    },
  },
  mounted() {
    this.unsub = subscribe(
      this.code,
      (data) => {
        this.connected = true
        if (!data) {
          this.error = 'Partie introuvable ou terminée.'
          this.session = null
        } else {
          this.session = data
        }
      },
      (err) => {
        this.error = "Erreur de connexion. Vérifie que tu es connecté."
        console.error('subscribe error', err)
      },
    )
  },
  beforeUnmount() {
    if (this.unsub) this.unsub()
    leaveSession(this.code)
  },
  methods: {
    async onThrow(dart) {
      if (this.busy) return
      this.busy = true
      try {
        await throwDart(this.code, dart)
      } catch (e) {
        console.error(e)
      } finally {
        this.busy = false
      }
    },
    async undo() {
      this.busy = true
      try { await undoLast(this.code) } catch (e) { console.error(e) } finally { this.busy = false }
    },
    async reset() {
      this.busy = true
      try { await resetGame(this.code) } catch (e) { console.error(e) } finally { this.busy = false }
    },
    quit() {
      this.$emit('home')
    },
    markSymbol(m) {
      return ['·', '/', '✕', '⊘'][Math.min(m, 3)]
    },
    async share() {
      const text = `Rejoins ma partie de fléchettes Stonk avec le code ${this.code}`
      try {
        if (navigator.share) await navigator.share({ title: 'Stonk', text })
        else if (navigator.clipboard) await navigator.clipboard.writeText(this.code)
      } catch (_) { /* ignore */ }
    },
  },
}
</script>

<style scoped>
.rg {
  height: 100%; display: flex; flex-direction: column; gap: 12px;
  padding: 14px 16px calc(16px + env(safe-area-inset-bottom));
  color: var(--chalk-cream); font-family: var(--font-ui);
  background: radial-gradient(130% 90% at 50% -10%, #20322b, var(--chalk-bg) 72%);
  overflow-y: auto;
}
.rg-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.rg-ghost {
  border: 2px solid var(--chalk-line); border-radius: 12px; padding: 6px 14px;
  background: transparent; color: var(--chalk-faint); font-family: var(--font-hand);
  font-weight: 600; font-size: 17px; cursor: pointer;
}
.rg-code { text-align: center; cursor: pointer; }
.rg-code-label { display: block; font-family: var(--font-hand); font-size: 13px; color: var(--chalk-faint2); }
.rg-code-val { font-family: var(--font-display); font-size: 26px; letter-spacing: 3px; color: var(--chalk-gold); }
.rg-presence { display: flex; align-items: center; gap: 5px; font-family: var(--font-hand); font-size: 17px; color: var(--chalk-faint); }
.rg-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--chalk-faint2); }
.rg-dot.live { background: var(--chalk-green); }
.rg-msg { text-align: center; padding: 40px 0; font-family: var(--font-hand); font-size: 22px; color: var(--chalk-faint); }
.rg-gamename { font-family: var(--font-display); font-size: 22px; letter-spacing: 0.5px; }

.rg-board { display: flex; flex-direction: column; gap: 8px; }
.rg-row {
  display: grid; grid-template-columns: 1fr auto auto; align-items: baseline; gap: 12px;
  padding: 12px 14px; border: 2px dashed var(--chalk-line); border-radius: 14px;
}
.rg-row.active { border-style: solid; border-color: var(--chalk-gold); background: rgba(236, 198, 106, 0.1); }
.rg-row.winner { border-color: var(--chalk-green); background: rgba(134, 199, 160, 0.12); }
.rg-name { font-family: var(--font-hand); font-weight: 700; font-size: 26px; }
.rg-sub { font-family: var(--font-hand); font-size: 16px; color: var(--chalk-faint2); }
.rg-value { font-family: var(--font-display); font-size: 30px; color: var(--chalk-cream); }

.rg-cricket { font-family: var(--font-ui); font-size: 13px; }
.rg-cr-head, .rg-cr-row { display: grid; grid-template-columns: 1.4fr repeat(7, 1fr); align-items: center; }
.rg-cr-zone { text-align: center; color: var(--chalk-gold); font-family: var(--font-display); font-size: 13px; }
.rg-cr-pname { font-family: var(--font-hand); font-weight: 600; font-size: 17px; }
.rg-cr-cell { text-align: center; color: var(--chalk-faint2); padding: 3px 0; }
.rg-cr-cell.closed { color: var(--chalk-green); }

.rg-turn { display: flex; align-items: center; justify-content: center; gap: 12px; }
.rg-turn-name { font-family: var(--font-hand); font-weight: 700; font-size: 24px; color: var(--chalk-gold); }
.rg-turn-darts { display: flex; gap: 6px; }
.rg-pip { width: 9px; height: 9px; border-radius: 50%; border: 1.5px solid var(--chalk-line); }
.rg-pip.on { background: var(--chalk-cream); border-color: var(--chalk-cream); }
.rg-status { text-align: center; font-family: var(--font-hand); font-size: 16px; color: var(--chalk-faint2); margin-top: -6px; }

.rg-actions { display: flex; gap: 10px; }
.rg-actions .rg-ghost { flex: 1; }

.rg-win { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 50; }
.rg-win-card {
  text-align: center; padding: 30px; margin: 0 24px; border: 2px solid var(--chalk-gold); border-radius: 20px;
  background: radial-gradient(120% 80% at 50% 0%, #1e2e28, var(--chalk-bg) 70%);
}
.rg-win-emoji { font-size: 44px; }
.rg-win-title { font-family: var(--font-display); font-size: 34px; color: var(--chalk-gold); margin: 8px 0; }
.rg-win-name { font-family: var(--font-hand); font-weight: 700; font-size: 26px; margin-bottom: 18px; }
.rg-win-actions { display: flex; gap: 10px; justify-content: center; }
.rg-green {
  border: 2px solid var(--chalk-green); border-radius: 14px; padding: 8px 22px; background: transparent;
  color: var(--chalk-green); font-family: var(--font-hand); font-weight: 600; font-size: 22px; cursor: pointer;
}
</style>
