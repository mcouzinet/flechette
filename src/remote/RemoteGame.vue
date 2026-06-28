<template>
  <div v-if="error" class="rg-fallback">{{ error }}</div>
  <div v-else-if="!state" class="rg-fallback">Connexion à la partie…</div>

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
      <div class="flex justify-between items-baseline">
        <span class="text-[20px]" style="font-family: var(--font-hand); font-weight: 700">{{ entry.player }}</span>
        <span class="text-[13px]" style="color: var(--chalk-faint2)">#{{ total - index }}</span>
      </div>
      <div class="flex justify-between items-baseline gap-2">
        <span class="text-[15px]" style="color: var(--chalk-faint)">{{ entry.text }}</span>
        <span v-if="entry.result !== '' && entry.result != null" class="text-[16px] shrink-0"
          style="font-family: var(--font-display); color: var(--chalk-cream)">{{ entry.result }}</span>
      </div>
    </template>
  </RemoteGameShell>
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
import { getGame, buildState } from './games/index.js'
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
    return { session: null, error: '', busy: false, connected: false, unsub: null }
  },
  computed: {
    game() { return this.session ? getGame(this.session.gameId) : null },
    state() { return this.session && this.game ? buildState(this.session) : null },
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
    historyEntries() {
      if (!this.session || !this.game) return []
      const sel = this.game.selectors
      let s = this.game.createInitialState(this.session.players, this.session.config || {})
      const out = []
      for (const a of this.session.actions || []) {
        const activeId = sel.activePlayerId(s)
        const player = (s.players.find((p) => p.id === activeId) || {}).name || ''
        s = this.game.reducer(s, a)
        // resulting value for the player who just threw (from the scoreboard
        // selector) — gives the history the same "→ result" context as local
        let result = ''
        try {
          const row = (sel.scoreboard(s) || []).find((r) => r.id === activeId)
          if (row && row.value != null) result = row.value
        } catch (_) { /* ignore */ }
        out.push({ player, text: describeDart(a.dart), result })
      }
      return out
    },
  },
  watch: {
    'state.finished'(now, was) {
      if (now && was === false) notifySuccess()
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
  },
  beforeUnmount() {
    if (this.unsub) this.unsub()
    leaveSession(this.code)
  },
  methods: {
    async onThrow(dart) {
      if (this.busy) return
      this.busy = true
      try { await throwDart(this.code, dart) } catch (e) { console.error(e) } finally { this.busy = false }
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
.rg-fallback { height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; padding: 40px;
  font-family: var(--font-hand); font-size: 22px; color: var(--chalk-faint);
  background: radial-gradient(130% 90% at 50% -10%, #20322b, var(--chalk-bg) 72%); }
.rg-soon { display: flex; flex-direction: column; gap: 8px; align-items: center; justify-content: center; text-align: center; padding: 60px 20px; }
</style>
