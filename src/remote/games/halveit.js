/* ============================================================
   Halve It — pure, serialisable reducer for remote play.
   Follows the same shape as countup.js (the reference game).

   Conventions (shared by every remote game):
   - State is plain JSON (no class instances / Maps) so it round-trips
     through Firestore. It is fully self-contained (includes `players`).
   - The ONLY action a reducer handles is THROW (one dart):
        { type: 'THROW', dart: { hit: true } }   // hit the round's target
        { type: 'THROW', dart: { miss: true } }  // missed the target
     (For Halve It a "hit" adds the current round's value to the total;
     a "miss" scores nothing but still consumes one of the 3 darts.)
   - UNDO and RESET are NOT handled here. The session layer keeps the
     action log and recomputes state = actions.reduce(reducer, initial),
     so "undo" is just dropping the last action. Keeps reducers tiny + pure.
   - A turn is 3 darts at a single fixed target. If a player fails to hit
     the target even once across the 3 darts, their TOTAL score is HALVED
     (Math.floor(score / 2)) when the turn resolves. After 9 rounds the
     highest total wins.
   ============================================================ */

const DARTS_PER_TURN = 3

// One entry per round: the fixed target { label, value gained per hit }.
const DEFAULT_ROUNDS = [
  { label: '19', value: 19 },
  { label: 'Double 18', value: 36 },
  { label: 'Triple 17', value: 51 },
  { label: '20', value: 20 },
  { label: 'Bull', value: 25 },
  { label: 'Triple 15', value: 45 },
  { label: 'Double 16', value: 32 },
  { label: '14', value: 14 },
  { label: 'Double 20', value: 40 },
]

const clone = (s) => JSON.parse(JSON.stringify(s))

export const meta = {
  id: 'halveit',
  name: 'Halve It',
  short: '9 cibles, rate et ton score est divisé par 2',
  scoreLabel: 'Points marqués', // legende de scoreboard().value (modale de victoire)
  minPlayers: 2,
  dartsPerTurn: DARTS_PER_TURN,
}

export function createInitialState(players, config = {}) {
  const rounds = Array.isArray(config.rounds) && config.rounds.length
    ? config.rounds.map((r) => ({ label: String(r.label), value: Number(r.value) }))
    : DEFAULT_ROUNDS.map((r) => ({ ...r }))
  const scores = {}
  const hitsThisTurn = {}
  const halvedRounds = {}
  for (const p of players) {
    scores[String(p.id)] = 0
    hitsThisTurn[String(p.id)] = 0
    halvedRounds[String(p.id)] = []
  }
  return {
    game: 'halveit',
    players: players.map((p) => ({ id: String(p.id), name: p.name })),
    rounds,
    round: 0, // 0-indexed (0..rounds.length-1)
    currentPlayerIndex: 0,
    dartsLeft: DARTS_PER_TURN,
    finished: false,
    winnerId: null,
    scores, // id -> cumulative total
    hitsThisTurn, // id -> hits landed in the active turn (resets each turn)
    halvedRounds, // id -> [roundIdx, ...] rounds where this player was halved
  }
}

// Did this dart land on the round's target?
function isHit(dart) {
  return !!(dart && dart.hit && !dart.miss)
}

export function reducer(state, action) {
  if (state.finished || !action || action.type !== 'THROW') return state
  const s = clone(state)
  const pid = s.players[s.currentPlayerIndex].id

  if (isHit(action.dart)) {
    s.scores[pid] += s.rounds[s.round].value
    s.hitsThisTurn[pid] += 1
  }

  s.dartsLeft -= 1

  if (s.dartsLeft === 0) {
    // Turn over: apply the halve rule before handing over.
    if (s.hitsThisTurn[pid] === 0) {
      s.scores[pid] = Math.floor(s.scores[pid] / 2)
      s.halvedRounds[pid].push(s.round)
    }
    s.hitsThisTurn[pid] = 0
    s.dartsLeft = DARTS_PER_TURN

    const next = (s.currentPlayerIndex + 1) % s.players.length
    if (next === 0) {
      s.round += 1
      if (s.round >= s.rounds.length) {
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

export function validate(dart) {
  return !!dart && (dart.hit === true || dart.miss === true)
}

export const selectors = {
  activePlayerId: (s) => (s.finished ? null : s.players[s.currentPlayerIndex].id),
  finished: (s) => s.finished,
  winner: (s) => (s.winnerId ? s.players.find((p) => p.id === s.winnerId) : null),
  status: (s) => (s.finished ? 'Partie terminée' : `Cible : ${s.rounds[s.round].label}`),
  // generic scoreboard rows the UI renders uniformly across games
  scoreboard: (s) =>
    s.players.map((p, i) => ({
      id: p.id,
      name: p.name,
      value: s.scores[p.id], // cumulative total
      sub: s.halvedRounds[p.id].length
        ? `divisé ${s.halvedRounds[p.id].length}×`
        : `${s.scores[p.id]} pts`,
      active: !s.finished && i === s.currentPlayerIndex,
      winner: s.winnerId === p.id,
    })),
}

export default { meta, createInitialState, reducer, selectors, validate }
