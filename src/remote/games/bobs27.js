/* ============================================================
   Bob's 27 — pure, serialisable reducer for remote play.
   Follows the shape of countup.js (the reference implementation).

   Conventions (shared by every remote game):
   - State is plain JSON (no class instances / Maps) so it round-trips
     through Firestore. It is fully self-contained (includes `players`).
   - The ONLY action a reducer handles is THROW (one dart):
        { type: 'THROW', dart: { hit: true } }   // hit the round's double
        { type: 'THROW', dart: { miss: true } }  // missed the double
   - UNDO and RESET are NOT handled here. The session layer keeps the
     action log and recomputes state = actions.reduce(reducer, initial),
     so "undo" is just dropping the last action. Keeps reducers tiny + pure.
   - A turn is 3 darts at the round's Double-N; the reducer advances the
     active player (skipping eliminated ones) and, when the last surviving
     player of a round finishes, advances the round. After round 21 the
     game finishes and the win is resolved.

   Rules:
   - 21 rounds. Round targets: Double 1, Double 2, …, Double 20, then
     Double Bull. Target N: rounds 1..20 → N=round; round 21 → N=25.
   - Every player starts with 27 points.
   - Each hit on the round's Double-N adds 2N. If a player records 0 hits
     across the 3 darts of a round, 2N is subtracted once (the penalty).
   - A player whose score drops to ≤ 0 is eliminated (out).
   - Win: the last player standing, OR — if all 21 rounds complete — the
     highest score among the survivors (first in order breaks ties).
   ============================================================ */

const DARTS_PER_TURN = 3
const ROUNDS = 21
const START_SCORE = 27
const BULL = 25

const clone = (s) => JSON.parse(JSON.stringify(s))

// The Double-N targeted on a given 1-based round (1..21).
function targetN(round) {
  return round >= ROUNDS ? BULL : round
}

export const meta = {
  id: 'bobs27',
  name: "Bob's 27",
  short: '21 doubles, démarre à 27',
  minPlayers: 2,
  dartsPerTurn: DARTS_PER_TURN,
}

export function createInitialState(players, config = {}) {
  const scores = {}
  const eliminated = {}
  const hitsThisTurn = {}
  for (const p of players) {
    const id = String(p.id)
    scores[id] = START_SCORE
    eliminated[id] = false
    hitsThisTurn[id] = 0
  }
  return {
    game: 'bobs27',
    players: players.map((p) => ({ id: String(p.id), name: p.name })),
    rounds: ROUNDS,
    round: 1, // 1-based, 1..21
    currentPlayerIndex: 0,
    dartsLeft: DARTS_PER_TURN,
    hitsThisTurn, // id -> hits recorded in the current turn
    finished: false,
    winnerId: null,
    scores, // id -> points (start 27)
    eliminated, // id -> bool
  }
}

const survivors = (s) => s.players.filter((p) => !s.eliminated[p.id])

// highest score among survivors wins; first player in order breaks ties.
function highestSurvivor(s) {
  let best = null
  for (const p of s.players) {
    if (s.eliminated[p.id]) continue
    if (best === null || s.scores[p.id] > s.scores[best]) best = p.id
  }
  return best
}

// Find the next non-eliminated player after `from`. Returns { index, wrapped }.
// `wrapped` is true when the scan passes the end of the player list (i.e. the
// round is over). Returns index -1 when nobody is left to play.
function nextActive(s, from) {
  const n = s.players.length
  for (let step = 1; step <= n; step++) {
    const idx = (from + step) % n
    if (!s.eliminated[s.players[idx].id]) {
      return { index: idx, wrapped: from + step >= n }
    }
  }
  return { index: -1, wrapped: true }
}

export function reducer(state, action) {
  if (state.finished || !action || action.type !== 'THROW') return state
  const s = clone(state)
  const pid = s.players[s.currentPlayerIndex].id

  // A hit on the round's Double-N adds 2N.
  const n = targetN(s.round)
  if (action.dart && action.dart.hit) {
    s.scores[pid] += 2 * n
    s.hitsThisTurn[pid] += 1
  }
  s.dartsLeft -= 1

  if (s.dartsLeft === 0) {
    // End of the turn: apply the all-miss penalty, resolve elimination.
    if (s.hitsThisTurn[pid] === 0) s.scores[pid] -= 2 * n
    s.hitsThisTurn[pid] = 0
    if (s.scores[pid] <= 0) s.eliminated[pid] = true

    // Last player standing wins immediately.
    if (survivors(s).length <= 1) {
      s.finished = true
      s.winnerId = survivors(s).length === 1 ? survivors(s)[0].id : highestSurvivor(s)
      return s
    }

    // Advance to the next surviving player; wrapping ends the round.
    const { index, wrapped } = nextActive(s, s.currentPlayerIndex)
    s.dartsLeft = DARTS_PER_TURN
    if (wrapped) {
      if (s.round >= s.rounds) {
        // All 21 rounds complete: highest survivor wins.
        s.finished = true
        s.winnerId = highestSurvivor(s)
        return s
      }
      s.round += 1
    }
    s.currentPlayerIndex = index
  }
  return s
}

// A legal Bob's 27 dart is an explicit hit or miss on the round's double.
export function validate(dart) {
  return !!dart && (dart.hit === true || dart.miss === true)
}

export const selectors = {
  activePlayerId: (s) => (s.finished ? null : s.players[s.currentPlayerIndex].id),
  finished: (s) => s.finished,
  winner: (s) => (s.winnerId ? s.players.find((p) => p.id === s.winnerId) : null),
  status: (s) => (s.finished ? 'Partie terminée' : `Double ${targetN(s.round)}`),
  // generic scoreboard rows the UI renders uniformly across games
  scoreboard: (s) =>
    s.players.map((p, i) => ({
      id: p.id,
      name: p.name,
      value: s.scores[p.id],
      sub: s.eliminated[p.id] ? 'éliminé' : '',
      active: !s.finished && !s.eliminated[p.id] && i === s.currentPlayerIndex,
      winner: s.winnerId === p.id,
    })),
}

export default { meta, createInitialState, reducer, selectors, validate }
