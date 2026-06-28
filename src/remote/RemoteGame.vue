<template>
  <div v-if="error" class="rg-fallback">
    <div class="rg-fallback-icon">⚠</div>
    <p>{{ error }}</p>
    <button class="rg-fallback-btn" @click="quit">Retour à l'accueil</button>
  </div>
  <div v-else-if="!state" class="rg-fallback">
    <div class="rg-spinner"></div>
    <p>Connexion à la partie…</p>
  </div>

  <RemoteGameShell v-else
    :title="game.meta.name"
    :subtitle="game.selectors.status(state)"
    :code="code"
    :participant-count="participantCount"
    :connected="connected"
    :presence-title="presenceTitle"
    :history="historyEntries"
    :finished="state.finished"
    :winner-name="winnerName"
    @back="quit"
    @undo="undo"
    @reset="reset"
    @share="share">

    <component v-if="board" :is="board" :state="state" :game="game" @throw="onThrow" />
    <div v-else class="rg-soon">
      <p style="font-family: var(--font-display); font-size: 22px">{{ game.meta.name }}</p>
      <p style="font-family: var(--font-hand); font-size: 19px; color: var(--chalk-gold)">Ce jeu arrive bientôt en mode à distance.</p>
    </div>

    <template v-if="standings" #sidebar-top>
      <component :is="standings" :state="state" :game="game" />
    </template>

    <template #history-entry="{ entry, index, total }">
      <div :style="{ opacity: entry.pending ? 0.5 : 1 }">
        <div class="flex justify-between items-baseline">
          <span class="text-[20px]" style="font-family: var(--font-hand); font-weight: 700">{{ entry.player }}</span>
          <span v-if="entry.pending" class="text-[12px]" style="color: var(--chalk-gold)">envoi…</span>
          <span v-else class="text-[13px]" style="color: var(--chalk-faint2)">#{{ total - index }}</span>
        </div>
        <div class="flex justify-between items-baseline gap-2">
          <span class="text-[15px]" style="color: var(--chalk-faint)">{{ entry.text }}</span>
          <span v-if="entry.result !== '' && entry.result != null" class="text-[16px] shrink-0"
            style="font-family: var(--font-display); color: var(--chalk-cream)">{{ entry.result }}</span>
        </div>
      </div>
    </template>
  </RemoteGameShell>

  <transition name="rg-toast">
    <div v-if="toast" class="rg-toast">{{ toast }}</div>
  </transition>

  <transition name="rg-band">
    <div v-if="state && !online" class="rg-offline">⚡ Hors ligne — reconnexion…</div>
  </transition>
</template>

<script>
import RemoteGameShell from './RemoteGameShell.vue'
import X01Board from './boards/X01Board.vue'
import CountUpBoard from './boards/CountUpBoard.vue'
import ShanghaiBoard from './boards/ShanghaiBoard.vue'
import CricketBoard from './boards/CricketBoard.vue'
import HorlogeBoard from './boards/HorlogeBoard.vue'
import BaseballBoard from './boards/BaseballBoard.vue'
import Bobs27Board from './boards/Bobs27Board.vue'
import HalveItBoard from './boards/HalveItBoard.vue'
import MorpionBoard from './boards/MorpionBoard.vue'
import KillerBoard from './boards/KillerBoard.vue'
import CricketStandings from './boards/CricketStandings.vue'
import ShanghaiStandings from './boards/ShanghaiStandings.vue'
import HorlogeStandings from './boards/HorlogeStandings.vue'
import BaseballStandings from './boards/BaseballStandings.vue'
import Bobs27Standings from './boards/Bobs27Standings.vue'
import HalveItStandings from './boards/HalveItStandings.vue'
import KillerStandings from './boards/KillerStandings.vue'
import { getGame } from './games/index.js'
import { subscribe, throwDart, undoLast, resetGame, leaveSession } from './session.js'
import { notifySuccess } from '../services/haptics.js'

// Registry of bespoke per-game boards (mirrors the classic UI). Games not yet
// listed render a placeholder until their board lands.
const BOARDS = {
  x01: X01Board,
  countup: CountUpBoard,
  shanghai: ShanghaiBoard,
  cricket: CricketBoard,
  horloge: HorlogeBoard,
  baseball: BaseballBoard,
  bobs27: Bobs27Board,
  halveit: HalveItBoard,
  morpion: MorpionBoard,
  killer: KillerBoard,
}

// Game-specific sidebar panels (rendered above the history) — mirrors the
// classic games that put a standings/ranking aside next to the board.
const STANDINGS = {
  cricket: CricketStandings,
  shanghai: ShanghaiStandings,
  horloge: HorlogeStandings,
  baseball: BaseballStandings,
  bobs27: Bobs27Standings,
  halveit: HalveItStandings,
  killer: KillerStandings,
}

function describeDart(dart) {
  if (!dart || dart.miss) return 'Manqué'
  if (dart.cell !== undefined) return `Case ${dart.cell + 1}`
  if (dart.assign !== undefined) return `N° ${dart.assign}`
  if (dart.self) return 'Devient killer'
  if (dart.target !== undefined) return 'Attaque'
  if (dart.runs !== undefined) return dart.runs === 0 ? 'Manqué' : `${dart.runs} run${dart.runs > 1 ? 's' : ''}`
  if (dart.hit) return 'Touché'
  if (dart.n !== undefined) {
    const pre = dart.mult === 2 ? 'Double ' : dart.mult === 3 ? 'Triple ' : ''
    return `${pre}${dart.n === 25 ? 'Bulle' : dart.n}`
  }
  if (dart.mult !== undefined) return ['Manqué', 'Simple', 'Double', 'Triple'][dart.mult] || 'Tir'
  return 'Tir'
}

export default {
  name: 'RemoteGame',
  components: { RemoteGameShell },
  props: { code: { type: String, required: true } },
  emits: ['home'],
  data() {
    return { session: null, error: '', busy: false, connected: false, unsub: null, pendingDart: null, pendingFromCount: -1, toast: '', toastTimer: null, online: typeof navigator !== 'undefined' ? navigator.onLine : true }
  },
  computed: {
    game() { return this.session ? getGame(this.session.gameId) : null },
    // Single replay of the action log yields BOTH the authoritative state and the
    // history (was two separate O(n) replays per snapshot). It also overlays the
    // OPTIMISTIC dart we just threw, until the snapshot confirms it — so remote
    // play feels instant despite the Firestore transaction round-trip.
    derived() {
      if (!this.session || !this.game) return { state: null, history: [] }
      const g = this.game
      const sel = g.selectors
      let s = g.createInitialState(this.session.players, this.session.config || {})
      const history = []
      const record = (action, dart, pending) => {
        const activeId = sel.activePlayerId(s)
        const player = (s.players.find((p) => p.id === activeId) || {}).name || ''
        s = g.reducer(s, action)
        let result = ''
        try {
          const row = (sel.scoreboard(s) || []).find((r) => r.id === activeId)
          if (row && row.value != null) result = row.value
        } catch (_) { /* ignore */ }
        history.push({ player, text: describeDart(dart), result, pending })
      }
      for (const a of this.session.actions || []) record(a, a.dart, false)
      if (this.pendingDart && (this.session.actions || []).length <= this.pendingFromCount && !s.finished) {
        record({ type: 'THROW', dart: this.pendingDart }, this.pendingDart, true)
      }
      return { state: s, history }
    },
    state() { return this.derived.state },
    historyEntries() { return this.derived.history },
    board() { return this.session ? BOARDS[this.session.gameId] || null : null },
    standings() { return this.session ? STANDINGS[this.session.gameId] || null : null },
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
    'state.finished'(now, was) {
      if (now && was === false) notifySuccess()
    },
    // drop the optimistic overlay once the live snapshot includes our throw
    session(now) {
      if (this.pendingDart && now && (now.actions || []).length > this.pendingFromCount) {
        this.pendingDart = null
      }
    },
  },
  mounted() {
    this.unsub = subscribe(
      this.code,
      (data) => {
        this.connected = true
        if (!data) { this.error = 'Partie introuvable ou terminée.'; this.session = null }
        else this.session = data
      },
      () => { this.error = 'Erreur de connexion. Vérifie que tu es connecté.' },
    )
    this._setOnline = () => { this.online = true }
    this._setOffline = () => { this.online = false }
    window.addEventListener('online', this._setOnline)
    window.addEventListener('offline', this._setOffline)
  },
  beforeUnmount() {
    if (this.unsub) this.unsub()
    if (this.toastTimer) clearTimeout(this.toastTimer)
    window.removeEventListener('online', this._setOnline)
    window.removeEventListener('offline', this._setOffline)
    leaveSession(this.code)
  },
  methods: {
    async onThrow(dart) {
      // block re-entry until the previous throw's snapshot has reconciled, so a
      // rapid second tap can't overlay onto a stale (pre-commit) state
      if (this.busy || this.pendingDart || (this.state && this.state.finished)) return
      this.busy = true
      // optimistic: render the dart immediately; the snapshot watcher clears it
      this.pendingDart = dart
      this.pendingFromCount = this.session && this.session.actions ? this.session.actions.length : 0
      try {
        const applied = await throwDart(this.code, dart)
        if (applied === false) this.pendingDart = null // finished elsewhere; nothing to reconcile
      } catch (e) {
        this.pendingDart = null // revert the optimistic dart
        this.showToast('Tir refusé, réessaie')
        console.error(e)
      } finally {
        this.busy = false
      }
    },
    showToast(msg) {
      this.toast = msg
      if (this.toastTimer) clearTimeout(this.toastTimer)
      this.toastTimer = setTimeout(() => { this.toast = '' }, 2600)
    },
    async undo() {
      this.busy = true
      try { await undoLast(this.code) } catch (e) { console.error(e) } finally { this.busy = false }
    },
    async reset() {
      this.busy = true
      try { await resetGame(this.code) } catch (e) { console.error(e) } finally { this.busy = false }
    },
    quit() { this.$emit('home') },
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
.rg-fallback { height: 100%; display: flex; flex-direction: column; gap: 16px; align-items: center; justify-content: center; text-align: center; padding: 40px;
  font-family: var(--font-hand); font-size: 22px; color: var(--chalk-faint);
  background: radial-gradient(130% 90% at 50% -10%, #20322b, var(--chalk-bg) 72%); }
.rg-fallback-icon { font-size: 40px; }
.rg-fallback-btn { border: 2px solid var(--chalk-line); border-radius: 12px; padding: 8px 20px; background: transparent;
  color: var(--chalk-cream); font-family: var(--font-hand); font-weight: 600; font-size: 19px; cursor: pointer; }
.rg-spinner { width: 30px; height: 30px; border-radius: 50%; border: 3px solid var(--chalk-line2); border-top-color: var(--chalk-gold); animation: rg-spin 0.7s linear infinite; }
@keyframes rg-spin { to { transform: rotate(360deg); } }
.rg-offline { position: fixed; left: 50%; top: calc(8px + env(safe-area-inset-top)); transform: translateX(-50%); z-index: 60;
  background: var(--chalk-gold); color: var(--chalk-bg); font-family: var(--font-hand); font-weight: 700; font-size: 15px;
  padding: 6px 16px; border-radius: 9999px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4); white-space: nowrap; }
.rg-band-enter-active, .rg-band-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.rg-band-enter-from, .rg-band-leave-to { opacity: 0; transform: translate(-50%, -10px); }
.rg-soon { display: flex; flex-direction: column; gap: 8px; align-items: center; justify-content: center; text-align: center; padding: 60px 20px; }
.rg-toast {
  position: fixed; left: 50%; bottom: calc(22px + env(safe-area-inset-bottom)); transform: translateX(-50%);
  background: var(--chalk-red); color: var(--chalk-bg); z-index: 60;
  font-family: var(--font-hand); font-weight: 700; font-size: 17px;
  padding: 9px 20px; border-radius: 12px; box-shadow: 0 6px 22px rgba(0, 0, 0, 0.45); white-space: nowrap;
}
.rg-toast-enter-active, .rg-toast-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.rg-toast-enter-from, .rg-toast-leave-to { opacity: 0; transform: translate(-50%, 12px); }
</style>
