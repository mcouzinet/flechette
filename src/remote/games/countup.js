/* ============================================================
   Count Up — pure, serialisable reducer for remote play.
   REFERENCE IMPLEMENTATION — other games follow this exact shape.

   Conventions (shared by every remote game):
   - State is plain JSON (no class instances / Maps) so it round-trips
     through Firestore. It is fully self-contained (includes `players`).
   - The ONLY action a reducer handles is THROW (one dart):
        { type: 'THROW', dart: { n: 1..20 | 25, mult: 1 | 2 | 3 } }
        { type: 'THROW', dart: { miss: true } }
     (For Count Up, mult multiplies the dart value; n=25 is the bull.)
   - UNDO and RESET are NOT handled here. The session layer keeps the
     action log and recomputes state = actions.reduce(reducer, initial),
     so "undo" is just dropping the last action. Keeps reducers tiny + pure.
   - A turn is 3 darts; the reducer advances the active player and, for
     Count Up, the round, then resolves the win when all rounds are done.
   ============================================================ */

const DARTS_PER_TURN = 3
const DEFAULT_ROUNDS = 8

const clone = (s) => JSON.parse(JSON.stringify(s))

export const meta = {
  id: 'countup',
  name: 'Count Up',
  short: '8 manches, max de points',
  minPlayers: 2,
  dartsPerTurn: DARTS_PER_TURN,
}

export function createInitialState(players, config = {}) {
  const rounds = Number(config.rounds) || DEFAULT_ROUNDS
  const scores = {}
  const thrown = {}
  for (const p of players) {
    scores[p.id] = 0
    thrown[p.id] = 0
  }
  return {
    game: 'countup',
    players: players.map((p) => ({ id: String(p.id), name: p.name })),
    rounds,
    round: 0, // 0-indexed
    currentPlayerIndex: 0,
    dartsLeft: DARTS_PER_TURN,
    finished: false,
    winnerId: null,
    scores, // id -> cumulative score
    thrown, // id -> darts thrown (for average)
  }
}

function dartValue(dart) {
  if (!dart || dart.miss) return 0
  return dart.n * dart.mult
}

export function reducer(state, action) {
  if (state.finished || !action || action.type !== 'THROW') return state
  const s = clone(state)
  const pid = s.players[s.currentPlayerIndex].id

  s.scores[pid] += dartValue(action.dart)
  s.thrown[pid] += 1
  s.dartsLeft -= 1

  if (s.dartsLeft === 0) {
    s.dartsLeft = DARTS_PER_TURN
    const next = (s.currentPlayerIndex + 1) % s.players.length
    if (next === 0) {
      s.round += 1
      if (s.round >= s.rounds) {
        s.finished = true
        s.winnerId = winnerId(s)
        return s
      }
    }
    s.currentPlayerIndex = next
  }
  return s
}

// highest total wins; first player in order breaks ties (stable)
function winnerId(s) {
  let best = null
  for (const p of s.players) {
    if (best === null || s.scores[p.id] > s.scores[best]) best = p.id
  }
  return best
}

const avg = (s, id) => (s.thrown[id] ? Math.round((s.scores[id] / s.thrown[id]) * 10) / 10 : 0)

export const selectors = {
  activePlayerId: (s) => (s.finished ? null : s.players[s.currentPlayerIndex].id),
  finished: (s) => s.finished,
  winner: (s) => (s.winnerId ? s.players.find((p) => p.id === s.winnerId) : null),
  status: (s) => (s.finished ? 'Partie terminée' : `Manche ${s.round + 1}/${s.rounds}`),
  // generic scoreboard rows the UI renders uniformly across games
  scoreboard: (s) =>
    s.players.map((p, i) => ({
      id: p.id,
      name: p.name,
      value: s.scores[p.id],
      sub: `moy. ${avg(s, p.id)}`,
      active: !s.finished && i === s.currentPlayerIndex,
      winner: s.winnerId === p.id,
    })),
}

export default { meta, createInitialState, reducer, selectors }
