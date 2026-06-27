import { describe, it, expect } from 'vitest'
import { createInitialState, reducer, selectors, validate, meta } from './morpion.js'
import game from './morpion.js'

const players = [
  { id: 'a', name: 'Alice' },
  { id: 'b', name: 'Bob' },
]
const THROW = (cell) => ({ type: 'THROW', dart: { cell } })
const play = (state, actions) => actions.reduce(reducer, state)

describe('Morpion', () => {
  it('initialises an empty 3x3 board with the right numbers and Alice to play', () => {
    const s = createInitialState(players)
    expect(s.board).toHaveLength(9)
    expect(s.board.map((c) => c.number)).toEqual([20, 18, 13, 12, 14, 16, 19, 15, 17])
    expect(s.board.every((c) => c.owner === null)).toBe(true)
    expect(s.finished).toBe(false)
    expect(s.winnerId).toBe(null)
    expect(s.winningLine).toBe(null)
    expect(selectors.activePlayerId(s)).toBe('a')
  })

  it('uses only the first two players', () => {
    const three = [...players, { id: 'c', name: 'Carol' }]
    const s = createInitialState(three)
    expect(s.players).toEqual([
      { id: 'a', name: 'Alice' },
      { id: 'b', name: 'Bob' },
    ])
  })

  it('claims a cell for the active player and alternates turns', () => {
    let s = reducer(createInitialState(players), THROW(0))
    expect(s.board[0].owner).toBe(0) // Alice (index 0)
    expect(selectors.activePlayerId(s)).toBe('b') // turn passed to Bob
    s = reducer(s, THROW(1))
    expect(s.board[1].owner).toBe(1) // Bob (index 1)
    expect(selectors.activePlayerId(s)).toBe('a') // back to Alice
  })

  it('ignores a claim on an already-owned cell (no-op)', () => {
    const s1 = reducer(createInitialState(players), THROW(4)) // Alice takes 4
    const s2 = reducer(s1, THROW(4)) // Bob tries the same cell
    expect(s2).toBe(s1) // unchanged, still Bob to play
    expect(selectors.activePlayerId(s2)).toBe('b')
    expect(s2.board[4].owner).toBe(0)
  })

  it('detects a row win (top row: cells 0,1,2)', () => {
    // A:0  B:3  A:1  B:4  A:2 -> Alice completes top row
    const s = play(createInitialState(players), [
      THROW(0),
      THROW(3),
      THROW(1),
      THROW(4),
      THROW(2),
    ])
    expect(s.finished).toBe(true)
    expect(s.winnerId).toBe('a')
    expect(s.winningLine).toEqual([0, 1, 2])
    expect(s.draw).toBe(false)
    expect(selectors.winner(s).name).toBe('Alice')
    expect(selectors.activePlayerId(s)).toBe(null)
  })

  it('detects a column win (left column: cells 0,3,6)', () => {
    // A:0  B:1  A:3  B:2  A:6 -> Alice completes left column
    const s = play(createInitialState(players), [
      THROW(0),
      THROW(1),
      THROW(3),
      THROW(2),
      THROW(6),
    ])
    expect(s.finished).toBe(true)
    expect(s.winnerId).toBe('a')
    expect(s.winningLine).toEqual([0, 3, 6])
  })

  it('detects a diagonal win for the second player (cells 2,4,6)', () => {
    // A:0  B:2  A:1  B:4  A:3  B:6 -> Bob completes anti-diagonal
    const s = play(createInitialState(players), [
      THROW(0),
      THROW(2),
      THROW(1),
      THROW(4),
      THROW(3),
      THROW(6),
    ])
    expect(s.finished).toBe(true)
    expect(s.winnerId).toBe('b')
    expect(s.winningLine).toEqual([2, 4, 6])
    expect(selectors.winner(s).name).toBe('Bob')
  })

  it('declares a draw when the board fills with no line', () => {
    // A board layout that fills completely with no winner.
    // owners by cell:  A B A | A B B | B A A   (5 A, 4 B, no line)
    // index:           0 1 2   3 4 5   6 7 8
    // A cells: 0,2,3,7,8   B cells: 1,4,5,6
    // Move order alternating A,B,A,B...:
    // A:0 B:1 A:2 B:4 A:3 B:5 A:7 B:6 A:8
    const s = play(createInitialState(players), [
      THROW(0),
      THROW(1),
      THROW(2),
      THROW(4),
      THROW(3),
      THROW(5),
      THROW(7),
      THROW(6),
      THROW(8),
    ])
    expect(s.board.every((c) => c.owner !== null)).toBe(true)
    expect(s.finished).toBe(true)
    expect(s.winnerId).toBe(null)
    expect(s.draw).toBe(true)
    expect(s.winningLine).toBe(null)
    expect(selectors.winner(s)).toBe(null)
    expect(selectors.status(s)).toBe('Match nul')
  })

  it('ignores throws once finished', () => {
    const s = play(createInitialState(players), [
      THROW(0),
      THROW(3),
      THROW(1),
      THROW(4),
      THROW(2),
    ])
    expect(s.finished).toBe(true)
    expect(reducer(s, THROW(5))).toBe(s) // no-op once finished
    expect(reducer(s, THROW(8))).toBe(s)
  })

  it('is replayable: reducing the action log reproduces the same state (undo support)', () => {
    const init = createInitialState(players)
    const actions = [THROW(0), THROW(3), THROW(1)] // A:0, B:3, A:1
    const full = play(init, actions)
    const undone = play(init, actions.slice(0, -1)) // drop last = undo
    expect(full.board[1].owner).toBe(0) // Alice's last claim present
    expect(selectors.activePlayerId(full)).toBe('b') // turn passed to Bob
    expect(undone.board[1].owner).toBe(null) // last claim removed
    expect(selectors.activePlayerId(undone)).toBe('a') // back to Alice
  })

  it('exposes the board (cells + winning line) for drawing', () => {
    const empty = selectors.board(createInitialState(players))
    expect(empty.cells).toHaveLength(9)
    expect(empty.cells[0]).toEqual({ number: 20, owner: null })
    expect(empty.winningLine).toBe(null)

    const won = play(createInitialState(players), [
      THROW(0),
      THROW(3),
      THROW(1),
      THROW(4),
      THROW(2),
    ])
    const view = selectors.board(won)
    expect(view.winningLine).toEqual([0, 1, 2])
    expect(view.cells[0]).toEqual({ number: 20, owner: 0 })
  })

  it('scoreboard reflects marks, active player and winner', () => {
    let s = createInitialState(players)
    let rows = selectors.scoreboard(s)
    expect(rows[0]).toMatchObject({ id: 'a', value: '—', active: true, winner: false })
    expect(rows[1]).toMatchObject({ id: 'b', value: '—', active: false })

    s = play(s, [THROW(0), THROW(3), THROW(1), THROW(4), THROW(2)]) // Alice wins top row
    rows = selectors.scoreboard(s)
    expect(rows[0]).toMatchObject({ id: 'a', value: '✕ 3', winner: true, active: false })
    expect(rows[1]).toMatchObject({ id: 'b', value: '◯ 2', winner: false, active: false })
  })

  describe('validate', () => {
    it('accepts an integer cell in 0..8', () => {
      expect(validate({ cell: 0 })).toBe(true)
      expect(validate({ cell: 8 })).toBe(true)
      expect(validate({ cell: 4 })).toBe(true)
      // also exposed on the default bundle
      expect(game.validate({ cell: 5 })).toBe(true)
    })

    it('rejects out-of-range, non-integer or malformed darts', () => {
      expect(validate({ cell: -1 })).toBe(false)
      expect(validate({ cell: 9 })).toBe(false)
      expect(validate({ cell: 1.5 })).toBe(false)
      expect(validate({ cell: '3' })).toBe(false)
      expect(validate({})).toBe(false)
      expect(validate(null)).toBe(false)
      expect(validate(undefined)).toBe(false)
    })
  })

  it('exposes meta with single-dart turns', () => {
    expect(meta.id).toBe('morpion')
    expect(meta.minPlayers).toBe(2)
    expect(meta.dartsPerTurn).toBe(1)
  })
})
