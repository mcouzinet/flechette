import { describe, it, expect } from 'vitest'
import { createInitialState, reducer, selectors, validate } from './horloge.js'

const players = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }]
// Horloge is multiplier-agnostic: a dart only carries its number.
const THROW = (n) => ({ type: 'THROW', dart: { n } })
const MISS = { type: 'THROW', dart: { miss: true } }
const play = (state, actions) => actions.reduce(reducer, state)

// Run a player from their current target (1) straight up to the Bull and
// past it, one matching dart per number. 21 darts total (1..20 + Bull).
const fullRun = () => [...Array.from({ length: 20 }, (_, i) => THROW(i + 1)), THROW(25)]

describe('Horloge (Around the Clock)', () => {
  it('starts everyone aiming for the 1, Alice to play', () => {
    const s = createInitialState(players)
    expect(s.targets).toEqual({ a: 1, b: 1 })
    expect(selectors.activePlayerId(s)).toBe('a')
    expect(selectors.target(s, 'a')).toBe(1)
    expect(s.dartsLeft).toBe(3)
  })

  it('advances the target only on an exact hit', () => {
    const s = reducer(createInitialState(players), THROW(1))
    expect(selectors.target(s, 'a')).toBe(2)
    expect(s.dartsLeft).toBe(2)
    expect(selectors.activePlayerId(s)).toBe('a') // still Alice's turn
  })

  it('does not advance when the wrong number is hit (no progress)', () => {
    const s = reducer(createInitialState(players), THROW(7)) // needs 1
    expect(selectors.target(s, 'a')).toBe(1)
    expect(s.dartsLeft).toBe(2) // dart still consumed
  })

  it('is multiplier-agnostic: any dart on the target number advances it', () => {
    // The dart only carries `n`; a "triple 1" and a "single 1" are identical.
    let s = createInitialState(players)
    s = reducer(s, THROW(1)) // -> target 2
    s = reducer(s, THROW(2)) // -> target 3
    expect(selectors.target(s, 'a')).toBe(3)
  })

  it('a miss is a no-op for progress but consumes a dart', () => {
    const s = reducer(createInitialState(players), MISS)
    expect(selectors.target(s, 'a')).toBe(1)
    expect(s.dartsLeft).toBe(2)
  })

  it('passes to the next player after 3 darts', () => {
    const s = play(createInitialState(players), [THROW(1), THROW(2), THROW(3)])
    expect(selectors.target(s, 'a')).toBe(4) // advanced through 1,2,3
    expect(selectors.activePlayerId(s)).toBe('b')
    expect(s.dartsLeft).toBe(3)
  })

  it('keeps each player on their own target across turns', () => {
    // Alice hits 1,2 then misses -> turn ends on target 3; Bob hits 1 -> target 2.
    let s = play(createInitialState(players), [THROW(1), THROW(2), MISS]) // Alice's turn
    s = reducer(s, THROW(1)) // Bob's first dart
    expect(selectors.target(s, 'a')).toBe(3)
    expect(selectors.target(s, 'b')).toBe(2)
    expect(selectors.activePlayerId(s)).toBe('b')
  })

  it('wins by advancing past the Bull (full run 1..20 then 25)', () => {
    // Solo game so the same player throws every dart (3-dart turns just wrap
    // back to the lone player), exercising the whole 1..20→Bull progression.
    const solo = [{ id: 'a', name: 'Alice' }]
    const s = play(createInitialState(solo), fullRun())
    expect(s.finished).toBe(true)
    expect(s.winnerId).toBe('a')
    expect(selectors.winner(s).id).toBe('a')
    expect(selectors.target(s, 'a')).toBe(26) // DONE sentinel
    expect(selectors.activePlayerId(s)).toBe(null)
    // further throws are ignored once finished
    expect(reducer(s, THROW(1))).toBe(s)
  })

  it('first player to finish wins, even mid-turn (two-player race)', () => {
    // Pre-set both near the end via state, then let the reducer finish it.
    let s = createInitialState(players)
    s.targets.a = 25 // Alice one dart from done (needs the Bull)
    s.targets.b = 20 // Bob one dart from the Bull
    s = reducer(s, THROW(25)) // Alice hits the Bull on her turn -> wins now
    expect(s.finished).toBe(true)
    expect(s.winnerId).toBe('a')
    expect(selectors.activePlayerId(s)).toBe(null)
    expect(selectors.target(s, 'b')).toBe(20) // Bob never got to throw
  })

  it('hitting the Bull while still on a number does not win', () => {
    // Alice still needs the 1; a Bull is the wrong number -> no progress.
    const s = reducer(createInitialState(players), THROW(25))
    expect(s.finished).toBe(false)
    expect(selectors.target(s, 'a')).toBe(1)
  })

  it('is replayable: reducing the action log reproduces the same state (undo support)', () => {
    const init = createInitialState(players)
    const actions = [THROW(1), THROW(2), THROW(9)] // Alice: hits 1,2; misses the 3 (had 9)
    const full = play(init, actions)
    const undone = play(init, actions.slice(0, -1)) // drop last = undo
    expect(selectors.target(full, 'a')).toBe(3)
    expect(selectors.activePlayerId(full)).toBe('b') // 3 darts done -> Bob
    expect(selectors.target(undone, 'a')).toBe(3) // target unchanged by removed dart
    expect(undone.dartsLeft).toBe(1) // mid-turn again
    expect(selectors.activePlayerId(undone)).toBe('a')
  })

  it('validate accepts misses and numbers 1..20 or the Bull, rejects the rest', () => {
    expect(validate({ miss: true })).toBe(true)
    expect(validate({ n: 1 })).toBe(true)
    expect(validate({ n: 20 })).toBe(true)
    expect(validate({ n: 25 })).toBe(true) // Bull
    expect(validate({ n: 0 })).toBe(false)
    expect(validate({ n: 21 })).toBe(false)
    expect(validate({ n: 24 })).toBe(false)
    expect(validate({ n: 26 })).toBe(false)
    expect(validate({ n: 3.5 })).toBe(false)
    expect(validate(null)).toBe(false)
    expect(validate({})).toBe(false)
  })
})
