/* ============================================================
   Morpion — darts tic-tac-toe. Pure, serialisable reducer for remote play.
   Follows the Count Up reference shape (see countup.js).

   Conventions (shared by every remote game):
   - State is plain JSON (no class instances / Maps) so it round-trips
     through Firestore. It is fully self-contained (includes `players`).
   - The ONLY action a reducer handles is THROW (one dart). For Morpion a
     dart claims a board cell:
        { type: 'THROW', dart: { cell: 0..8 } }
   - UNDO and RESET are NOT handled here. The session layer keeps the
     action log and recomputes state = actions.reduce(reducer, initial),
     so "undo" is just dropping the last action. Keeps reducers tiny + pure.
   - 2 players only (the first two are used). Each turn is a single claim,
     after which play alternates to the other player. Claiming an already
     owned cell is a no-op. Once finished, throws are ignored.

   The 3x3 grid maps each cell index to a dart number (row-major), used for
   display only — the cell is identified by its index, not the number.
   ============================================================ */

// cell index -> dart number (row-major), display only
const CELL_NUMBERS = [20, 18, 13, 12, 14, 16, 19, 15, 17]

// the 8 winning lines (3 rows, 3 cols, 2 diagonals)
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

const MARKS = ['✕', '◯'] // player index -> mark, display only

const clone = (s) => JSON.parse(JSON.stringify(s))

export const meta = {
  id: 'morpion',
  name: 'Morpion',
  short: 'Aligne 3 cases',
  scoreLabel: 'Cases prises', // legende de scoreboard().value (modale de victoire)
  minPlayers: 2,
  maxPlayers: 2,
  dartsPerTurn: 1,
}

export function createInitialState(players, _config = {}) {
  const two = players.slice(0, 2)
  return {
    game: 'morpion',
    players: two.map((p) => ({ id: String(p.id), name: p.name })),
    currentPlayerIndex: 0,
    board: CELL_NUMBERS.map((number) => ({ number, owner: null })),
    finished: false,
    winnerId: null,
    winningLine: null,
    draw: false,
  }
}

// returns the winning line (array of 3 indices) for `owner`, or null
function findWinningLine(board, owner) {
  for (const line of LINES) {
    if (line.every((i) => board[i].owner === owner)) return line
  }
  return null
}

export function reducer(state, action) {
  if (state.finished || !action || action.type !== 'THROW') return state
  const dart = action.dart
  // ignore invalid darts
  if (!dart || !Number.isInteger(dart.cell) || dart.cell < 0 || dart.cell > 8) return state

  const cell = dart.cell
  // claiming an already-owned cell is a no-op
  if (state.board[cell].owner !== null) return state

  const s = clone(state)
  const owner = s.currentPlayerIndex
  s.board[cell].owner = owner

  const line = findWinningLine(s.board, owner)
  if (line) {
    s.finished = true
    s.winnerId = s.players[owner].id
    s.winningLine = line
    return s
  }

  // no win — draw if the board is full, else alternate
  if (s.board.every((c) => c.owner !== null)) {
    s.finished = true
    s.winnerId = null
    s.draw = true
    return s
  }

  s.currentPlayerIndex = (s.currentPlayerIndex + 1) % s.players.length
  return s
}

// a dart is valid if it targets an integer cell in 0..8
export function validate(dart) {
  return !!dart && Number.isInteger(dart.cell) && dart.cell >= 0 && dart.cell <= 8
}

// count of cells owned by player index `i`
const marks = (s, i) => s.board.reduce((n, c) => n + (c.owner === i ? 1 : 0), 0)

export const selectors = {
  activePlayerId: (s) => (s.finished ? null : s.players[s.currentPlayerIndex].id),
  finished: (s) => s.finished,
  winner: (s) => (s.winnerId ? s.players.find((p) => p.id === s.winnerId) : null),
  status: (s) => {
    if (!s.finished) return `Au tour de ${s.players[s.currentPlayerIndex].name}`
    if (s.draw) return 'Match nul'
    const w = s.players.find((p) => p.id === s.winnerId)
    return w ? `${w.name} gagne` : 'Partie terminée'
  },
  // generic scoreboard rows the UI renders uniformly across games
  scoreboard: (s) =>
    s.players.map((p, i) => {
      const n = marks(s, i)
      return {
        id: p.id,
        name: p.name,
        value: n > 0 ? `${MARKS[i]} ${n}` : '—',
        active: !s.finished && i === s.currentPlayerIndex,
        winner: s.winnerId === p.id,
      }
    }),
  // expose the 9 cells (+ winning line) so the UI can draw the grid
  board: (s) => ({
    cells: s.board.map((c) => ({ number: c.number, owner: c.owner })),
    winningLine: s.winningLine,
  }),
}

export default { meta, createInitialState, reducer, selectors, validate }
