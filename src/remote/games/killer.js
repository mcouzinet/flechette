/* ============================================================
   Killer — pure, serialisable reducer for remote play.
   Follows the Count Up reference shape exactly (see countup.js).

   Two phases:
   - 'setup': each player, in turn order, is assigned a unique
     number 1..20.  dart = { assign: n }.  After everyone has a
     number we move to phase 'game'.
   - 'game': everyone starts with 3 lives, 3 darts per turn.
       * A NON-killer hits the DOUBLE of THEIR OWN number to become
         a killer:   dart = { self: true }  -> isKiller = true.
       * A KILLER hits the DOUBLE of a TARGET's number to remove one
         of that target's lives:  dart = { target: <playerId> }
         -> target.lives -= 1 (target != self, not eliminated).
         A player at 0 lives is eliminated.
       * { miss: true } = no effect.
   - Turn = 3 darts, then the next non-eliminated player plays.
   - Win: when only ONE non-eliminated player remains, they win.

   Conventions shared by every remote game:
   - State is plain JSON (no class instances / Maps) so it round-trips
     through Firestore. It is fully self-contained (includes `players`).
   - The ONLY action handled is THROW (one dart). UNDO / RESET are NOT
     handled here: the session keeps the action log and recomputes
     state = actions.reduce(reducer, initial), so the reducer must be
     deterministic.
   ============================================================ */

const DARTS_PER_TURN = 3
const START_LIVES = 3

const clone = (s) => JSON.parse(JSON.stringify(s))

export const meta = {
  id: 'killer',
  name: 'Killer',
  short: 'Deviens killer, élimine les autres',
  minPlayers: 2,
  dartsPerTurn: DARTS_PER_TURN,
}

export function createInitialState(players, config = {}) {
  const numbers = {}
  const lives = {}
  const isKiller = {}
  const eliminated = {}
  for (const p of players) {
    numbers[String(p.id)] = null
    lives[String(p.id)] = START_LIVES
    isKiller[String(p.id)] = false
    eliminated[String(p.id)] = false
  }
  return {
    game: 'killer',
    players: players.map((p) => ({ id: String(p.id), name: p.name })),
    phase: 'setup', // 'setup' | 'game'
    setupIndex: 0, // which player is assigning a number (setup phase)
    currentPlayerIndex: 0, // active player (game phase)
    dartsLeft: DARTS_PER_TURN,
    finished: false,
    winnerId: null,
    numbers, // id -> 1..20 | null
    lives, // id -> remaining lives
    isKiller, // id -> bool
    eliminated, // id -> bool
  }
}

// How many players are still in the game (not eliminated).
function aliveCount(s) {
  return s.players.reduce((n, p) => n + (s.eliminated[p.id] ? 0 : 1), 0)
}

// Index of the next non-eliminated player after `from`, wrapping around.
function nextAliveIndex(s, from) {
  const n = s.players.length
  for (let step = 1; step <= n; step++) {
    const i = (from + step) % n
    if (!s.eliminated[s.players[i].id]) return i
  }
  return from
}

// Resolve a win when only one player is left standing.
function resolveWin(s) {
  if (aliveCount(s) <= 1) {
    const survivor = s.players.find((p) => !s.eliminated[p.id])
    s.finished = true
    s.winnerId = survivor ? survivor.id : null
    return true
  }
  return false
}

function reduceSetup(s, dart) {
  const pid = s.players[s.setupIndex].id
  const n = dart ? dart.assign : undefined
  const taken = Object.values(s.numbers).includes(n)
  // Only a valid, free number 1..20 assigns; anything else is a no-op
  // (the dart is still consumed so the action log stays faithful).
  if (Number.isInteger(n) && n >= 1 && n <= 20 && !taken) {
    s.numbers[pid] = n
  } else {
    return s
  }
  // Advance through every player once; then start the game.
  if (s.setupIndex + 1 >= s.players.length) {
    s.phase = 'game'
    s.setupIndex = s.players.length
    s.currentPlayerIndex = 0
    s.dartsLeft = DARTS_PER_TURN
  } else {
    s.setupIndex += 1
  }
  return s
}

function reduceGame(s, dart) {
  const pid = s.players[s.currentPlayerIndex].id

  if (dart && dart.self === true) {
    // Become a killer (hitting the double of your own number).
    if (!s.eliminated[pid]) s.isKiller[pid] = true
  } else if (dart && typeof dart.target === 'string') {
    // Killers remove a life from a valid target.
    const tid = dart.target
    const targetExists = Object.prototype.hasOwnProperty.call(s.lives, tid)
    if (s.isKiller[pid] && targetExists && tid !== pid && !s.eliminated[tid]) {
      s.lives[tid] = Math.max(0, s.lives[tid] - 1)
      if (s.lives[tid] === 0) s.eliminated[tid] = true
    }
  }
  // { miss: true } and any other shape: no effect.

  s.dartsLeft -= 1

  // Win can trigger mid-turn the instant someone is eliminated.
  if (resolveWin(s)) return s

  if (s.dartsLeft === 0) {
    s.dartsLeft = DARTS_PER_TURN
    s.currentPlayerIndex = nextAliveIndex(s, s.currentPlayerIndex)
  }
  return s
}

export function reducer(state, action) {
  if (state.finished || !action || action.type !== 'THROW') return state
  const s = clone(state)
  return s.phase === 'setup' ? reduceSetup(s, action.dart) : reduceGame(s, action.dart)
}

const activeIndex = (s) => (s.phase === 'setup' ? s.setupIndex : s.currentPlayerIndex)

export const selectors = {
  activePlayerId: (s) => {
    if (s.finished) return null
    const i = activeIndex(s)
    return s.players[i] ? s.players[i].id : null
  },
  finished: (s) => s.finished,
  winner: (s) => (s.winnerId ? s.players.find((p) => p.id === s.winnerId) : null),
  phase: (s) => s.phase,
  status: (s) => {
    if (s.finished) return 'Partie terminée'
    return s.phase === 'setup' ? 'Choix des numéros' : 'En jeu'
  },
  // generic scoreboard rows the UI renders uniformly across games
  scoreboard: (s) => {
    const i = activeIndex(s)
    return s.players.map((p, idx) => {
      const elim = s.eliminated[p.id]
      const num = s.numbers[p.id]
      const sub = s.isKiller[p.id] ? 'KILLER' : num != null ? `n°${num}` : '—'
      return {
        id: p.id,
        name: p.name,
        value: elim ? '☠' : s.lives[p.id],
        sub,
        active: !s.finished && idx === i,
        winner: s.winnerId === p.id,
      }
    })
  },
  // per-player view for the board (phase exposed alongside)
  board: (s) =>
    s.players.map((p) => ({
      id: p.id,
      name: p.name,
      number: s.numbers[p.id],
      lives: s.lives[p.id],
      isKiller: s.isKiller[p.id],
      eliminated: s.eliminated[p.id],
    })),
}

export function validate(dart) {
  if (!dart || typeof dart !== 'object') return false
  if (Number.isInteger(dart.assign)) return dart.assign >= 1 && dart.assign <= 20
  if (dart.self === true) return true
  if (typeof dart.target === 'string') return true
  if (dart.miss === true) return true
  return false
}

export default { meta, createInitialState, reducer, selectors, validate }
