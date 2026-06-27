/* ============================================================
   Baseball — pure, serialisable reducer for remote play.
   Follows the shape of countup.js (the reference implementation).

   Conventions (shared by every remote game):
   - State is plain JSON (no class instances / Maps) so it round-trips
     through Firestore. It is fully self-contained (includes `players`).
   - The ONLY action a reducer handles is THROW (one dart):
        { type: 'THROW', dart: { runs: 0 | 1 | 2 | 3 } }
     A dart already carries how many runs it scored on the inning's target:
     0 = miss / no hit, 1 = single, 2 = double, 3 = triple. The number that
     must be hit is implied by the inning, so the reducer just banks `runs`.
   - UNDO and RESET are NOT handled here. The session layer keeps the
     action log and recomputes state = actions.reduce(reducer, initial),
     so "undo" is just dropping the last action. Keeps reducers tiny + pure.
   - A turn is 3 darts; the reducer advances the active player and, once
     all players have batted, the inning, then resolves the win after the
     9th inning (highest total wins).

   Rules:
   - 9 innings. In inning I (1..9) the target is the number I.
   - Each of the 3 darts in a turn scores its `runs` (single/double/triple
     of the inning number) onto the batter's running total.
   - After 9 innings the highest cumulative total wins.
   ============================================================ */

const DARTS_PER_TURN = 3
const INNINGS = 9

const clone = (s) => JSON.parse(JSON.stringify(s))

export const meta = {
  id: 'baseball',
  name: 'Baseball',
  short: '9 manches, max de runs',
  minPlayers: 2,
  dartsPerTurn: DARTS_PER_TURN,
}

export function createInitialState(players, config = {}) {
  const totals = {}
  const inningScores = {}
  for (const p of players) {
    totals[String(p.id)] = 0
    // one running run-total per inning (1..9), 0-filled
    inningScores[String(p.id)] = Array.from({ length: INNINGS }, () => 0)
  }
  return {
    game: 'baseball',
    players: players.map((p) => ({ id: String(p.id), name: p.name })),
    innings: INNINGS,
    inning: 1, // 1-based: the inning is also the target number
    currentPlayerIndex: 0,
    dartsLeft: DARTS_PER_TURN,
    finished: false,
    winnerId: null,
    totals, // id -> cumulative runs across all innings
    inningScores, // id -> [runs scored per inning], indexed inning-1
  }
}

// Runs this dart scored on the inning target (0..3); anything else = 0.
function dartRuns(dart) {
  if (!dart) return 0
  const r = dart.runs
  return r === 1 || r === 2 || r === 3 ? r : 0
}

// highest total wins; first player in order breaks ties (stable)
function winnerId(s) {
  let best = null
  for (const p of s.players) {
    if (best === null || s.totals[p.id] > s.totals[best]) best = p.id
  }
  return best
}

export function reducer(state, action) {
  if (state.finished || !action || action.type !== 'THROW') return state
  const s = clone(state)
  const pid = s.players[s.currentPlayerIndex].id

  const runs = dartRuns(action.dart)
  s.totals[pid] += runs
  s.inningScores[pid][s.inning - 1] += runs
  s.dartsLeft -= 1

  if (s.dartsLeft === 0) {
    s.dartsLeft = DARTS_PER_TURN
    const next = (s.currentPlayerIndex + 1) % s.players.length
    if (next === 0) {
      // every player has batted this inning -> advance
      if (s.inning >= s.innings) {
        s.finished = true
        s.winnerId = winnerId(s)
        return s
      }
      s.inning += 1
    }
    s.currentPlayerIndex = next
  }
  return s
}

export const selectors = {
  activePlayerId: (s) => (s.finished ? null : s.players[s.currentPlayerIndex].id),
  finished: (s) => s.finished,
  winner: (s) => (s.winnerId ? s.players.find((p) => p.id === s.winnerId) : null),
  status: (s) => (s.finished ? 'Partie terminée' : `Manche ${s.inning}/${s.innings} · cible ${s.inning}`),
  // generic scoreboard rows the UI renders uniformly across games
  scoreboard: (s) =>
    s.players.map((p, i) => ({
      id: p.id,
      name: p.name,
      value: s.totals[p.id],
      sub: s.finished ? `${s.totals[p.id]} runs` : `manche ${s.inningScores[p.id][s.inning - 1]}`,
      active: !s.finished && i === s.currentPlayerIndex,
      winner: s.winnerId === p.id,
    })),
  // render model for the innings board (innings x players)
  inningScores: (s) => ({
    innings: Array.from({ length: s.innings }, (_, i) => i + 1),
    rows: s.players.map((p) => ({
      id: p.id,
      name: p.name,
      scores: s.inningScores[p.id].slice(),
      total: s.totals[p.id],
    })),
  }),
}

// validate(dart): a legal Baseball dart is { runs } with runs in {0,1,2,3}.
export function validate(dart) {
  return !!dart && (dart.runs === 0 || dart.runs === 1 || dart.runs === 2 || dart.runs === 3)
}

export default { meta, createInitialState, reducer, selectors, validate }
