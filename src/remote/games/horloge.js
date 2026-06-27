/* ============================================================
   Horloge (Around the Clock) — pure, serialisable reducer for remote play.
   Follows the shape of countup.js (the reference implementation).

   Conventions (shared by every remote game):
   - State is plain JSON (no class instances / Maps) so it round-trips
     through Firestore. It is fully self-contained (includes `players`).
   - The ONLY action a reducer handles is THROW (one dart):
        { type: 'THROW', dart: { n } }          // n in 1..20 or 25 (Bull)
        { type: 'THROW', dart: { miss: true } } // wasted dart
     Horloge is multiplier-agnostic: only the NUMBER hit matters, so the
     dart carries just `n` (any single/double/triple of n counts the same).
   - UNDO and RESET are NOT handled here. The session layer keeps the
     action log and recomputes state = actions.reduce(reducer, initial),
     so "undo" is just dropping the last action. Keeps reducers tiny + pure.
   - A turn is 3 darts; the reducer advances the active player after the
     3rd dart.

   Rules:
   - Each player must hit 1 → 2 → … → 20, then the Bull (25), in order.
   - A dart that matches the player's CURRENT target advances them to the
     next target; any other dart (wrong number or miss) is a no-op for
     progress but still consumes one of the 3 darts.
   - A player WINS the instant they advance past the Bull (their target
     reaches the DONE sentinel). First to finish wins.
   ============================================================ */

const DARTS_PER_TURN = 3
const BULL = 25
// Ordered targets: 1..20, then the Bull, then a "done" sentinel.
const SEQUENCE = [...Array.from({ length: 20 }, (_, i) => i + 1), BULL]
const DONE = BULL + 1 // 26 — sentinel meaning the player has finished

const clone = (s) => JSON.parse(JSON.stringify(s))

// next target after `t` in the 1..20,25 sequence (or DONE once past the Bull)
function nextTarget(t) {
  const i = SEQUENCE.indexOf(t)
  if (i === -1 || i === SEQUENCE.length - 1) return DONE
  return SEQUENCE[i + 1]
}

export const meta = {
  id: 'horloge',
  name: 'Horloge',
  short: 'Enchaîne 1→20 puis le Bull',
  minPlayers: 2,
  dartsPerTurn: DARTS_PER_TURN,
}

export function createInitialState(players, config = {}) {
  const targets = {}
  for (const p of players) {
    targets[String(p.id)] = 1 // everyone starts aiming for the 1
  }
  return {
    game: 'horloge',
    players: players.map((p) => ({ id: String(p.id), name: p.name })),
    currentPlayerIndex: 0,
    dartsLeft: DARTS_PER_TURN,
    finished: false,
    winnerId: null,
    targets, // id -> current target (1..20, then 25, then DONE=26)
  }
}

export function reducer(state, action) {
  if (state.finished || !action || action.type !== 'THROW') return state
  const s = clone(state)
  const pid = s.players[s.currentPlayerIndex].id
  const dart = action.dart

  // Multiplier-agnostic: only the number matters. A dart matching the
  // current target advances it; anything else (miss / wrong number) doesn't.
  if (dart && !dart.miss && dart.n === s.targets[pid]) {
    s.targets[pid] = nextTarget(s.targets[pid])
    if (s.targets[pid] === DONE) {
      s.finished = true
      s.winnerId = pid
      return s
    }
  }

  s.dartsLeft -= 1
  if (s.dartsLeft === 0) {
    s.dartsLeft = DARTS_PER_TURN
    s.currentPlayerIndex = (s.currentPlayerIndex + 1) % s.players.length
  }
  return s
}

// Validate a single dart payload before it is appended to the action log.
export function validate(dart) {
  if (!dart) return false
  if (dart.miss === true) return true
  return Number.isInteger(dart.n) && ((dart.n >= 1 && dart.n <= 20) || dart.n === BULL)
}

// Human label for a player's current target: a checkmark once finished,
// "Bull" on the Bull, else "cible N".
function targetLabel(t) {
  if (t >= DONE) return '✓'
  if (t === BULL) return 'Bull'
  return `cible ${t}`
}

export const selectors = {
  activePlayerId: (s) => (s.finished ? null : s.players[s.currentPlayerIndex].id),
  finished: (s) => s.finished,
  winner: (s) => (s.winnerId ? s.players.find((p) => p.id === s.winnerId) : null),
  status: (s) => (s.finished ? 'Partie terminée' : ''),
  // expose each player's current target for the board (1..20, 25, or DONE)
  target: (s, id) => s.targets[id],
  // generic scoreboard rows the UI renders uniformly across games
  scoreboard: (s) =>
    s.players.map((p, i) => ({
      id: p.id,
      name: p.name,
      value: targetLabel(s.targets[p.id]),
      sub: s.targets[p.id] >= DONE ? 'terminé' : `${SEQUENCE.indexOf(s.targets[p.id]) + 1}/${SEQUENCE.length}`,
      active: !s.finished && i === s.currentPlayerIndex,
      winner: s.winnerId === p.id,
    })),
}

export default { meta, createInitialState, reducer, selectors, validate }
