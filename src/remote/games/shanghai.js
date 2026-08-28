/* ============================================================
   Shanghai — pure, serialisable reducer for remote play.
   Follows the shape of countup.js (the reference implementation).

   Conventions (shared by every remote game):
   - State is plain JSON (no class instances / Maps) so it round-trips
     through Firestore. It is fully self-contained (includes `players`).
   - The ONLY action a reducer handles is THROW (one dart). In Shanghai
     the only target is the current round's number, so a dart just says
     how it landed on that number:
        { type: 'THROW', dart: { mult: 1 | 2 | 3 } } // single / double / triple
        { type: 'THROW', dart: { miss: true } }      // wasted dart
     The dart value added is `round * mult` (miss = 0).
   - UNDO and RESET are NOT handled here. The session layer keeps the
     action log and recomputes state = actions.reduce(reducer, initial),
     so "undo" is just dropping the last action. Keeps reducers tiny + pure.
   - A turn is 3 darts; the reducer advances the active player and, when
     the last player of the round finishes, advances the round.

   Rules:
   - 20 rounds. In round R (1..20) every dart is aimed at the number R.
   - SHANGHAI: if a player lands a single, a double AND a triple of the
     SAME round, they win immediately (a "Shanghai").
   - Otherwise, after all 20 rounds, the highest total score wins.
   ============================================================ */

const DARTS_PER_TURN = 3
const ROUNDS = 20

const clone = (s) => JSON.parse(JSON.stringify(s))

export const meta = {
  id: 'shanghai',
  name: 'Shanghai',
  short: '20 manches 1→20, Shanghai = victoire',
  scoreLabel: 'Points marqués', // legende de scoreboard().value (modale de victoire)
  minPlayers: 2,
  dartsPerTurn: DARTS_PER_TURN,
}

// A dart is valid if it's a miss, or a single/double/triple.
export function validate(dart) {
  if (!dart) return false
  if (dart.miss === true) return true
  return dart.mult === 1 || dart.mult === 2 || dart.mult === 3
}

export function createInitialState(players, config = {}) {
  const rounds = Number(config.rounds) || ROUNDS
  const scores = {}
  const roundHits = {}
  for (const p of players) {
    scores[String(p.id)] = 0
    roundHits[String(p.id)] = {} // round -> { s, d, t } booleans, lazily filled
  }
  return {
    game: 'shanghai',
    players: players.map((p) => ({ id: String(p.id), name: p.name })),
    rounds,
    round: 1, // 1-indexed: round number == target number
    currentPlayerIndex: 0,
    dartsLeft: DARTS_PER_TURN,
    finished: false,
    winnerId: null,
    scores, // id -> cumulative score
    roundHits, // id -> { [round]: { s, d, t } } hit-types landed this round
  }
}

// highest total wins; first player in order breaks ties (stable)
function winnerByScore(s) {
  let best = null
  for (const p of s.players) {
    if (best === null || s.scores[p.id] > s.scores[best]) best = p.id
  }
  return best
}

export function reducer(state, action) {
  if (state.finished || !action || action.type !== 'THROW') return state
  const s = clone(state)
  const pid = s.players[s.currentPlayerIndex].id
  const dart = action.dart

  if (dart && !dart.miss && (dart.mult === 1 || dart.mult === 2 || dart.mult === 3)) {
    const mult = dart.mult
    s.scores[pid] += s.round * mult

    const hits = s.roundHits[pid][s.round] || { s: false, d: false, t: false }
    if (mult === 1) hits.s = true
    else if (mult === 2) hits.d = true
    else if (mult === 3) hits.t = true
    s.roundHits[pid][s.round] = hits

    // SHANGHAI: single + double + triple of the same round -> instant win
    if (hits.s && hits.d && hits.t) {
      s.finished = true
      s.winnerId = pid
      return s
    }
  }

  s.dartsLeft -= 1
  if (s.dartsLeft === 0) {
    s.dartsLeft = DARTS_PER_TURN
    const next = (s.currentPlayerIndex + 1) % s.players.length
    if (next === 0) {
      // last player of the round just finished -> advance the round
      if (s.round >= s.rounds) {
        s.finished = true
        s.winnerId = winnerByScore(s)
        return s
      }
      s.round += 1
    }
    s.currentPlayerIndex = next
  }
  return s
}

export const selectors = {
  activePlayerId: (s) => (s.finished ? null : s.players[s.currentPlayerIndex].id),
  finished: (s) => s.finished,
  winner: (s) => (s.winnerId ? s.players.find((p) => p.id === s.winnerId) : null),
  status: (s) => (s.finished ? 'Partie terminée' : `Manche ${s.round}/${s.rounds} · cible ${s.round}`),
  // generic scoreboard rows the UI renders uniformly across games
  scoreboard: (s) =>
    s.players.map((p, i) => ({
      id: p.id,
      name: p.name,
      value: s.scores[p.id],
      sub: `cible ${s.round}`,
      active: !s.finished && i === s.currentPlayerIndex,
      winner: s.winnerId === p.id,
    })),
}

export default { meta, createInitialState, reducer, selectors, validate }
