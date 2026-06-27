import { describe, it, expect } from 'vitest'
import { createInitialState, reducer, selectors, validate } from './baseball.js'

const players = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }]
const THROW = (runs) => ({ type: 'THROW', dart: { runs } })
const MISS = THROW(0)
const play = (state, actions) => actions.reduce(reducer, state)
// A full inning for both players given their per-dart runs arrays.
const inning = (aDarts, bDarts) => [...aDarts, ...bDarts].map(THROW)

describe('Baseball', () => {
  it('initialises totals to 0, inning 1, and Alice to play', () => {
    const s = createInitialState(players)
    expect(s.totals).toEqual({ a: 0, b: 0 })
    expect(s.inning).toBe(1)
    expect(s.innings).toBe(9)
    expect(selectors.activePlayerId(s)).toBe('a')
    expect(s.dartsLeft).toBe(3)
    expect(s.inningScores).toEqual({
      a: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      b: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    })
  })

  it('adds runs only from {runs} and consumes one dart', () => {
    const s = reducer(createInitialState(players), THROW(3))
    expect(s.totals.a).toBe(3)
    expect(s.inningScores.a[0]).toBe(3)
    expect(s.dartsLeft).toBe(2)
    expect(selectors.activePlayerId(s)).toBe('a') // still Alice's turn
  })

  it('a miss (runs 0) scores nothing but still uses a dart', () => {
    const s = reducer(createInitialState(players), MISS)
    expect(s.totals.a).toBe(0)
    expect(s.inningScores.a[0]).toBe(0)
    expect(s.dartsLeft).toBe(2)
  })

  it('ignores out-of-range runs (treated as 0)', () => {
    let s = createInitialState(players)
    s = reducer(s, THROW(5)) // not 0..3 -> no runs
    s = reducer(s, THROW(-1)) // negative -> no runs
    s = reducer(s, { type: 'THROW', dart: {} }) // no runs field -> 0
    expect(s.totals.a).toBe(0)
    expect(s.inningScores.a[0]).toBe(0)
    expect(selectors.activePlayerId(s)).toBe('b') // 3 darts consumed -> next
  })

  it('accumulates the 3 darts of a turn into the inning total', () => {
    const s = play(createInitialState(players), [THROW(1), THROW(2), THROW(3)])
    expect(s.totals.a).toBe(6)
    expect(s.inningScores.a[0]).toBe(6)
    expect(selectors.activePlayerId(s)).toBe('b')
    expect(s.dartsLeft).toBe(3)
    expect(s.inning).toBe(1) // Bob hasn't batted yet
  })

  it('advances the inning only after the last player of the inning', () => {
    let s = play(createInitialState(players), [THROW(1), THROW(1), THROW(1)]) // Alice done
    expect(s.inning).toBe(1)
    expect(selectors.activePlayerId(s)).toBe('b')
    s = play(s, [THROW(2), THROW(2), THROW(2)]) // Bob done -> inning advances
    expect(s.inning).toBe(2)
    expect(selectors.activePlayerId(s)).toBe('a')
    expect(s.totals).toEqual({ a: 3, b: 6 })
    expect(s.inningScores.a[0]).toBe(3)
    expect(s.inningScores.b[0]).toBe(6)
  })

  it('records runs into the correct inning bucket across innings', () => {
    let s = createInitialState(players)
    // inning 1: Alice 1 run, Bob 0
    s = play(s, inning([1, 0, 0], [0, 0, 0]))
    // inning 2: Alice 0, Bob 2 runs
    s = play(s, inning([0, 0, 0], [2, 0, 0]))
    expect(s.inning).toBe(3)
    expect(s.inningScores.a).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0])
    expect(s.inningScores.b).toEqual([0, 2, 0, 0, 0, 0, 0, 0, 0])
    expect(s.totals).toEqual({ a: 1, b: 2 })
  })

  it('finishes after 9 innings and the highest total wins', () => {
    let s = createInitialState(players)
    // Alice scores 1 run each inning (3 runs/inning via singles is overkill —
    // give her 1 dart of 1 run per inning), Bob always misses.
    for (let i = 0; i < 9; i++) {
      s = play(s, inning([1, 0, 0], [0, 0, 0]))
    }
    expect(s.finished).toBe(true)
    expect(s.inning).toBe(9) // stays on the final inning
    expect(s.totals).toEqual({ a: 9, b: 0 })
    expect(selectors.winner(s).id).toBe('a')
    expect(selectors.activePlayerId(s)).toBe(null)
    expect(selectors.status(s)).toBe('Partie terminée')
    // further throws are ignored once finished
    expect(reducer(s, THROW(3))).toBe(s)
  })

  it('breaks ties stably in favour of the first player in order', () => {
    let s = createInitialState(players)
    for (let i = 0; i < 9; i++) {
      s = play(s, inning([1, 0, 0], [1, 0, 0])) // equal totals every inning
    }
    expect(s.finished).toBe(true)
    expect(s.totals).toEqual({ a: 9, b: 9 })
    expect(selectors.winner(s).id).toBe('a') // first player wins the tie
  })

  it('is replayable: reducing the action log reproduces the same state (undo support)', () => {
    const init = createInitialState(players)
    const actions = [THROW(1), THROW(2), THROW(3)] // Alice's 3 darts
    const full = play(init, actions)
    const undone = play(init, actions.slice(0, -1)) // drop last = undo
    expect(full.totals.a).toBe(6) // 1 + 2 + 3
    expect(selectors.activePlayerId(full)).toBe('b') // turn passed to Bob
    expect(undone.totals.a).toBe(3) // last dart removed
    expect(undone.inningScores.a[0]).toBe(3)
    expect(selectors.activePlayerId(undone)).toBe('a') // back to Alice mid-turn
    expect(undone.dartsLeft).toBe(1)
  })

  it('exposes an innings board via the inningScores selector', () => {
    let s = createInitialState(players)
    s = play(s, inning([1, 1, 0], [3, 0, 0])) // inning 1
    const board = selectors.inningScores(s)
    expect(board.innings).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(board.rows).toEqual([
      { id: 'a', name: 'Alice', scores: [2, 0, 0, 0, 0, 0, 0, 0, 0], total: 2 },
      { id: 'b', name: 'Bob', scores: [3, 0, 0, 0, 0, 0, 0, 0, 0], total: 3 },
    ])
  })

  it('scoreboard reflects totals, active flag and current-inning runs', () => {
    let s = createInitialState(players)
    s = reducer(s, THROW(2)) // Alice scores 2 in inning 1, still batting
    const rows = selectors.scoreboard(s)
    expect(rows[0]).toMatchObject({ id: 'a', value: 2, active: true, winner: false })
    expect(rows[0].sub).toBe('manche 2')
    expect(rows[1]).toMatchObject({ id: 'b', value: 0, active: false, winner: false })
  })

  it('validate accepts only { runs } with runs in {0,1,2,3}', () => {
    expect(validate({ runs: 0 })).toBe(true)
    expect(validate({ runs: 1 })).toBe(true)
    expect(validate({ runs: 2 })).toBe(true)
    expect(validate({ runs: 3 })).toBe(true)
    expect(validate({ runs: 4 })).toBe(false)
    expect(validate({ runs: -1 })).toBe(false)
    expect(validate({ runs: 1.5 })).toBe(false)
    expect(validate({})).toBe(false)
    expect(validate(null)).toBe(false)
    expect(validate(undefined)).toBe(false)
  })
})
