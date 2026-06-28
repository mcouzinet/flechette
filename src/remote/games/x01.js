/* ============================================================
   301 / 501 (X01) — pure, serialisable reducer for remote play.
   Follows the same shape as countup.js (the reference game).

   Conventions (shared by every remote game):
   - State is plain JSON (no class instances / Maps) so it round-trips
     through Firestore. It is fully self-contained (includes `players`).
   - The ONLY action a reducer handles is THROW (one dart):
        { type: 'THROW', dart: { n: 1..20 | 25, mult: 1 | 2 | 3 } }
        { type: 'THROW', dart: { miss: true } }
     (For X01, the dart value is subtracted from the remaining score.)
   - UNDO and RESET are NOT handled here. The session layer keeps the
     action log and recomputes state = actions.reduce(reducer, initial),
     so "undo" is just dropping the last action. Keeps reducers tiny + pure.
   - A turn is 3 darts. Going below zero "busts": the turn is cancelled,
     the score is restored to where it stood at the start of the turn, and
     play moves to the next player. Hitting exactly zero wins.
   ============================================================ */

const DARTS_PER_TURN = 3
const DEFAULT_START = 301

const clone = (s) => JSON.parse(JSON.stringify(s))

export const meta = {
  id: 'x01',
  name: '301 / 501',
  short: 'Tombe à zéro pile',
  minPlayers: 2,
  dartsPerTurn: DARTS_PER_TURN,
  options: [
    { key: 'start', label: 'Score de départ', values: [101, 301, 401, 501, 701, 1001], default: DEFAULT_START },
  ],
}

export function createInitialState(players, config = {}) {
  const start = Number(config.start) || DEFAULT_START
  const scores = {}
  const thrown = {}
  for (const p of players) {
    scores[p.id] = start
    thrown[p.id] = 0
  }
  return {
    game: 'x01',
    players: players.map((p) => ({ id: String(p.id), name: p.name })),
    start,
    currentPlayerIndex: 0,
    dartsLeft: DARTS_PER_TURN,
    finished: false,
    winnerId: null,
    scores, // id -> remaining score
    thrown, // id -> darts thrown (for average)
    turnStartScore: start, // active player's score at the start of their turn
  }
}

function dartValue(dart) {
  if (!dart || dart.miss) return 0
  return dart.n * dart.mult
}

// advance to the next player: reset darts and snapshot the new active
// player's score so a future bust can restore the turn correctly.
function advance(s) {
  s.dartsLeft = DARTS_PER_TURN
  s.currentPlayerIndex = (s.currentPlayerIndex + 1) % s.players.length
  s.turnStartScore = s.scores[s.players[s.currentPlayerIndex].id]
}

export function reducer(state, action) {
  if (state.finished || !action || action.type !== 'THROW') return state
  const s = clone(state)
  const pid = s.players[s.currentPlayerIndex].id

  s.thrown[pid] += 1
  const value = dartValue(action.dart)
  const newScore = s.scores[pid] - value

  if (newScore < 0) {
    // BUST: don't apply the dart, restore the turn-start score, end the turn.
    s.scores[pid] = s.turnStartScore
    advance(s)
    return s
  }

  s.scores[pid] = newScore
  s.dartsLeft -= 1

  if (newScore === 0) {
    // exact zero on any dart wins (no double-out required)
    s.finished = true
    s.winnerId = pid
    return s
  }

  if (s.dartsLeft === 0) advance(s)
  return s
}

const avg = (s, id) => (s.thrown[id] ? Math.round((s.start - s.scores[id]) / s.thrown[id] * 10) / 10 : 0)

export const selectors = {
  activePlayerId: (s) => (s.finished ? null : s.players[s.currentPlayerIndex].id),
  finished: (s) => s.finished,
  winner: (s) => (s.winnerId ? s.players.find((p) => p.id === s.winnerId) : null),
  status: (s) => (s.finished ? 'Partie terminée' : ''),
  // generic scoreboard rows the UI renders uniformly across games
  scoreboard: (s) =>
    s.players.map((p, i) => ({
      id: p.id,
      name: p.name,
      value: s.scores[p.id], // remaining score
      sub: s.scores[p.id] === 0 ? 'reste 0' : `moy. ${avg(s, p.id)}`,
      active: !s.finished && i === s.currentPlayerIndex,
      winner: s.winnerId === p.id,
    })),
}

export default { meta, createInitialState, reducer, selectors }
