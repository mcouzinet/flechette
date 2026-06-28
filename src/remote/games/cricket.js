/* ============================================================
   Cricket — pure, serialisable reducer for remote play.
   Follows the shape of countup.js (the reference implementation).

   Conventions (shared by every remote game):
   - State is plain JSON (no class instances / Maps) so it round-trips
     through Firestore. It is fully self-contained (includes `players`).
   - The ONLY action a reducer handles is THROW (one dart):
        { type: 'THROW', dart: { n, mult } }   // n in {25,20,19,18,17,16,15}
        { type: 'THROW', dart: { miss: true } } // wasted dart
     A dart whose `n` is not a Cricket zone is a wasted dart: it scores
     no marks but still consumes one of the 3 darts in the turn.
   - UNDO and RESET are NOT handled here. The session layer keeps the
     action log and recomputes state = actions.reduce(reducer, initial),
     so "undo" is just dropping the last action.
   - A turn is 3 darts; the reducer advances the active player after the
     3rd dart (a deliberate, standard turn structure on top of the
     original free-tap Cricket).

   Rules:
   - 7 zones, default 3-bull mode: Bull(25), 20, 19, 18, 17, 16, 15.
   - Close a zone by reaching 3 marks on it.
   - Each mark on an already-closed zone, while an opponent has NOT closed
     it, piles that zone's points onto every such opponent. `score` is the
     points an opponent has piled ONTO a player (lower is better).
   - Win: a player who has closed ALL zones and whose score equals the
     lowest score among ALL players wins.
   ============================================================ */

const DARTS_PER_TURN = 3
const CLOSE = 3 // marks needed to close a zone (all zones)

// zone index -> { label, pts }; `pts` doubles as the dart number that hits it
const ZONES = [
  { label: 'Bull', pts: 25 },
  { label: '20', pts: 20 },
  { label: '19', pts: 19 },
  { label: '18', pts: 18 },
  { label: '17', pts: 17 },
  { label: '16', pts: 16 },
  { label: '15', pts: 15 },
]

// dart number -> zone index (25/20/19/18/17/16/15 -> 0..6)
const ZONE_BY_N = ZONES.reduce((acc, z, i) => {
  acc[z.pts] = i
  return acc
}, {})

const clone = (s) => JSON.parse(JSON.stringify(s))

export const meta = {
  id: 'cricket',
  name: 'Cricket',
  short: 'Ferme 20→15 + Bull, moins de points',
  minPlayers: 2,
  dartsPerTurn: DARTS_PER_TURN,
}

export function createInitialState(players, config = {}) {
  const marks = {}
  const score = {}
  for (const p of players) {
    marks[String(p.id)] = ZONES.map(() => 0)
    score[String(p.id)] = 0
  }
  return {
    game: 'cricket',
    players: players.map((p) => ({ id: String(p.id), name: p.name })),
    zones: ZONES.map((z) => ({ label: z.label, pts: z.pts })),
    close: CLOSE,
    currentPlayerIndex: 0,
    dartsLeft: DARTS_PER_TURN,
    finished: false,
    winnerId: null,
    marks, // id -> [marks per zone]
    score, // id -> points piled onto this player (lower is better)
  }
}

// Which zone does this dart target? Returns the zone index, or -1 (wasted).
function zoneIndex(dart) {
  if (!dart || dart.miss) return -1
  const zi = ZONE_BY_N[dart.n]
  return zi === undefined ? -1 : zi
}

// Has this player closed every zone?
function hasClosedAll(s, id) {
  return s.marks[id].every((m) => m >= s.close)
}

// Win resolution: a player who closed all zones AND has the lowest score
// among ALL players (matches the original). Stable: first such player.
function resolveWinner(s) {
  const closedAll = s.players.filter((p) => hasClosedAll(s, p.id))
  if (closedAll.length === 0) return null
  let lowest = Infinity
  for (const p of s.players) {
    if (s.score[p.id] < lowest) lowest = s.score[p.id]
  }
  const w = closedAll.find((p) => s.score[p.id] === lowest)
  return w ? w.id : null
}

export function reducer(state, action) {
  if (state.finished || !action || action.type !== 'THROW') return state
  const s = clone(state)
  const pid = s.players[s.currentPlayerIndex].id

  const zi = zoneIndex(action.dart)
  if (zi >= 0) {
    // clamp to 1..3 marks — the reducer is the last line of defence against a
    // malformed action (the shared code is a trust token, not a hard boundary).
    const mult = Math.min(3, Math.max(1, Math.floor(action.dart.mult) || 1))
    const pts = s.zones[zi].pts
    // Apply marks one at a time — order matters when a multi crosses the
    // close threshold (the marks that close the zone score nothing; only
    // marks placed while already closed pile points onto opponents).
    for (let k = 0; k < mult; k++) {
      if (s.marks[pid][zi] >= s.close) {
        for (const o of s.players) {
          if (o.id !== pid && s.marks[o.id][zi] < s.close) {
            s.score[o.id] += pts
          }
        }
      }
      s.marks[pid][zi] += 1
    }
  }

  s.dartsLeft -= 1
  if (s.dartsLeft === 0) {
    s.dartsLeft = DARTS_PER_TURN
    s.currentPlayerIndex = (s.currentPlayerIndex + 1) % s.players.length
  }

  const winnerId = resolveWinner(s)
  if (winnerId !== null) {
    s.finished = true
    s.winnerId = winnerId
  }
  return s
}

const closedCount = (s, id) => s.marks[id].filter((m) => m >= s.close).length

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
      value: s.score[p.id],
      sub: `${closedCount(s, p.id)}/${s.zones.length} fermés`,
      active: !s.finished && i === s.currentPlayerIndex,
      winner: s.winnerId === p.id,
    })),
  // render model for the marks board (zones x players)
  marksGrid: (s) => ({
    zones: s.zones.map((z) => ({ label: z.label, pts: z.pts })),
    rows: s.players.map((p) => ({
      id: p.id,
      name: p.name,
      marks: s.marks[p.id].slice(),
      closed: s.marks[p.id].map((m) => m >= s.close),
    })),
  }),
}

export default { meta, createInitialState, reducer, selectors }
