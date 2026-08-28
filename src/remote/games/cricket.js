/* ============================================================
   Cricket — pure, serialisable reducer for remote play.
   Follows the shape of countup.js (the reference implementation).

   Conventions (shared by every remote game):
   - State is plain JSON (no class instances / Maps) so it round-trips
     through Firestore. It is fully self-contained (includes `players`).
   - The ONLY action a reducer handles is THROW (one mark):
        { type: 'THROW', dart: { player, zone } }  // zone = index 0..6
     Le Cricket de cette app se joue en CLIC LIBRE, comme la version locale :
     on tape la case d'un joueur, elle prend une marque. Il n'y a ni tour, ni
     multiplicateur — c'est le modele du jeu classique, et le distant doit s'y
     conformer (une version precedente imposait un tour de 3 flechettes, ce qui
     obligeait le board a remplacer la grille par un pave de saisie).
   - UNDO and RESET are NOT handled here. The session layer keeps the
     action log and recomputes state = actions.reduce(reducer, initial),
     so "undo" is just dropping the last action.

   Rules:
   - 7 zones, default 3-bull mode: Bull(25), 20, 19, 18, 17, 16, 15.
   - Close a zone by reaching 3 marks on it.
   - Each mark on an already-closed zone, while an opponent has NOT closed
     it, piles that zone's points onto every such opponent. `score` is the
     points an opponent has piled ONTO a player (lower is better).
   - Win: a player who has closed ALL zones and whose score equals the
     lowest score among ALL players wins.
   ============================================================ */

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

const clone = (s) => JSON.parse(JSON.stringify(s))

export const meta = {
  id: 'cricket',
  name: 'Cricket',
  short: 'Ferme 20→15 + Bull, moins de points',
  minPlayers: 2,
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
    finished: false,
    winnerId: null,
    marks, // id -> [marks per zone]
    score, // id -> points piled onto this player (lower is better)
  }
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

// Le code partage est un jeton de confiance, pas une frontiere : le reducer
// reste la derniere ligne de defense contre une action malformee.
export function validate(dart) {
  return !!dart && dart.player != null && Number.isInteger(dart.zone) &&
    dart.zone >= 0 && dart.zone < ZONES.length
}

export function reducer(state, action) {
  if (state.finished || !action || action.type !== 'THROW') return state
  const dart = action.dart
  if (!validate(dart)) return state

  const s = clone(state)
  const pid = String(dart.player)
  if (!s.marks[pid]) return state // joueur inconnu : action ignoree
  const zi = dart.zone
  const pts = s.zones[zi].pts

  // Une marque posee sur une zone DEJA fermee par ce joueur empile les points
  // de la zone sur chaque adversaire qui ne l'a pas fermee. Exactement la
  // regle du Cricket local.
  if (s.marks[pid][zi] >= s.close) {
    for (const o of s.players) {
      if (o.id !== pid && s.marks[o.id][zi] < s.close) {
        s.score[o.id] += pts
      }
    }
  }
  s.marks[pid][zi] += 1

  const winnerId = resolveWinner(s)
  if (winnerId !== null) {
    s.finished = true
    s.winnerId = winnerId
  }
  return s
}

const closedCount = (s, id) => s.marks[id].filter((m) => m >= s.close).length

export const selectors = {
  // Pas de tour au Cricket : personne n'a « la main », chacun note quand il veut.
  activePlayerId: () => null,
  finished: (s) => s.finished,
  winner: (s) => (s.winnerId ? s.players.find((p) => p.id === s.winnerId) : null),
  status: (s) => (s.finished ? 'Partie terminée' : ''),
  // generic scoreboard rows the UI renders uniformly across games
  scoreboard: (s) =>
    s.players.map((p) => ({
      id: p.id,
      name: p.name,
      value: s.score[p.id],
      sub: `${closedCount(s, p.id)}/${s.zones.length} fermés`,
      active: false,
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

export default { meta, createInitialState, reducer, selectors, validate }
