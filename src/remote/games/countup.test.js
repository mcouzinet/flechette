import { describe, it, expect } from 'vitest'
import { createInitialState, reducer, selectors } from './countup.js'

const players = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }]
const THROW = (n, mult = 1) => ({ type: 'THROW', dart: { n, mult } })
const MISS = { type: 'THROW', dart: { miss: true } }
const play = (state, actions) => actions.reduce(reducer, state)

describe('Count Up', () => {
  it('initialises scores to 0 and Alice to play', () => {
    const s = createInitialState(players)
    expect(s.scores).toEqual({ a: 0, b: 0 })
    expect(selectors.activePlayerId(s)).toBe('a')
    expect(s.dartsLeft).toBe(3)
  })

  it('accumulates a dart with its multiplier and consumes one dart', () => {
    const s = reducer(createInitialState(players), THROW(20, 3))
    expect(s.scores.a).toBe(60)
    expect(s.dartsLeft).toBe(2)
    expect(selectors.activePlayerId(s)).toBe('a') // still Alice's turn
  })

  it('a miss scores 0', () => {
    const s = reducer(createInitialState(players), MISS)
    expect(s.scores.a).toBe(0)
    expect(s.dartsLeft).toBe(2)
  })

  it('passes to the next player after 3 darts', () => {
    const s = play(createInitialState(players), [THROW(20), THROW(20), THROW(20)])
    expect(s.scores.a).toBe(60)
    expect(selectors.activePlayerId(s)).toBe('b')
    expect(s.dartsLeft).toBe(3)
    expect(s.round).toBe(0)
  })

  it('increments the round only after the last player of the round', () => {
    let s = play(createInitialState(players), [THROW(1), THROW(1), THROW(1)]) // Alice done
    expect(s.round).toBe(0)
    s = play(s, [THROW(1), THROW(1), THROW(1)]) // Bob done -> round wraps
    expect(s.round).toBe(1)
    expect(selectors.activePlayerId(s)).toBe('a')
  })

  it('finishes after the configured rounds and the highest total wins', () => {
    let s = createInitialState(players, { rounds: 1 })
    // round 1: Alice 3x20=60, Bob 3x10=30
    s = play(s, [THROW(20), THROW(20), THROW(20), THROW(10), THROW(10), THROW(10)])
    expect(s.finished).toBe(true)
    expect(selectors.winner(s).id).toBe('a')
    // further throws are ignored once finished
    expect(reducer(s, THROW(20))).toBe(s)
  })

  it('is replayable: reducing the action log reproduces the same state (undo support)', () => {
    const init = createInitialState(players)
    const actions = [THROW(20), THROW(5, 2), THROW(19)] // Alice's 3 darts
    const full = play(init, actions)
    const undone = play(init, actions.slice(0, -1)) // drop last = undo
    expect(full.scores.a).toBe(49) // 20 + 10 + 19
    expect(selectors.activePlayerId(full)).toBe('b') // turn passed to Bob
    expect(undone.scores.a).toBe(30) // last dart removed
    expect(selectors.activePlayerId(undone)).toBe('a') // back to Alice mid-turn
  })
})
