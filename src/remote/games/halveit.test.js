import { describe, it, expect } from 'vitest'
import { createInitialState, reducer, selectors, validate } from './halveit.js'

const players = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }]
const HIT = { type: 'THROW', dart: { hit: true } }
const MISS = { type: 'THROW', dart: { miss: true } }
const play = (state, actions) => actions.reduce(reducer, state)

// A full 3-dart turn made of identical darts.
const turn = (action) => [action, action, action]

describe('Halve It', () => {
  it('initialises scores to 0, Alice to play, first target shown', () => {
    const s = createInitialState(players)
    expect(s.scores).toEqual({ a: 0, b: 0 })
    expect(selectors.activePlayerId(s)).toBe('a')
    expect(s.dartsLeft).toBe(3)
    expect(s.round).toBe(0)
    expect(s.rounds).toHaveLength(9)
    expect(selectors.status(s)).toBe('Cible : 19')
  })

  it('a hit adds the round value and consumes one dart', () => {
    const s = reducer(createInitialState(players), HIT) // round 0 -> '19' = 19
    expect(s.scores.a).toBe(19)
    expect(s.dartsLeft).toBe(2)
    expect(s.hitsThisTurn.a).toBe(1)
    expect(selectors.activePlayerId(s)).toBe('a') // still Alice's turn
  })

  it('a miss scores 0 but still consumes a dart', () => {
    const s = reducer(createInitialState(players), MISS)
    expect(s.scores.a).toBe(0)
    expect(s.dartsLeft).toBe(2)
    expect(s.hitsThisTurn.a).toBe(0)
  })

  it('accumulates multiple hits within a turn (round value each)', () => {
    // round 0 value = 19, three hits = 57
    const s = play(createInitialState(players), turn(HIT))
    expect(s.scores.a).toBe(57)
    expect(selectors.activePlayerId(s)).toBe('b') // turn passed after 3 darts
    expect(s.dartsLeft).toBe(3)
    expect(s.round).toBe(0) // still round 0 until Bob also plays
  })

  it('halves the total (floor) when a player hits the target 0 times in a turn', () => {
    let s = createInitialState(players)
    // Alice round 0: 3 hits of 19 = 57
    s = play(s, turn(HIT))
    // Bob round 0: doesn't matter, just finish his turn so round advances
    s = play(s, turn(MISS))
    expect(s.round).toBe(1) // now round 1 (value 36)
    expect(s.scores.a).toBe(57)
    // Alice round 1: misses all 3 -> total halved: floor(57/2) = 28
    s = play(s, turn(MISS))
    expect(s.scores.a).toBe(28)
    expect(s.halvedRounds.a).toEqual([1])
  })

  it('floors the halved score for odd totals', () => {
    let s = createInitialState(players)
    // Alice round 0: a single hit of 19 then two misses -> not halved (1 hit)
    s = play(s, [HIT, MISS, MISS])
    expect(s.scores.a).toBe(19)
    s = play(s, turn(MISS)) // Bob round 0
    expect(s.round).toBe(1)
    // Alice round 1: all misses -> floor(19/2) = 9
    s = play(s, turn(MISS))
    expect(s.scores.a).toBe(9)
  })

  it('does NOT halve when at least one dart hits the target', () => {
    let s = createInitialState(players)
    s = play(s, turn(HIT)) // Alice 57
    s = play(s, turn(MISS)) // Bob, advance to round 1
    // Alice round 1: 2 misses + 1 hit (value 36) -> 57 + 36 = 93, no halving
    s = play(s, [MISS, MISS, HIT])
    expect(s.scores.a).toBe(93)
    expect(s.halvedRounds.a).toEqual([])
  })

  it('passes to the next player after 3 darts and advances the round after the last player', () => {
    let s = play(createInitialState(players), turn(HIT)) // Alice done
    expect(selectors.activePlayerId(s)).toBe('b')
    expect(s.round).toBe(0)
    s = play(s, turn(HIT)) // Bob done -> round wraps
    expect(s.round).toBe(1)
    expect(selectors.activePlayerId(s)).toBe('a')
    expect(selectors.status(s)).toBe('Cible : Double 18')
  })

  it('finishes after 9 rounds and the highest total wins', () => {
    let s = createInitialState(players)
    // 9 rounds. Alice hits every dart, Bob always misses (and gets halved,
    // but halving 0 stays 0). Each round Alice = 3 * value.
    for (let r = 0; r < 9; r++) {
      s = play(s, turn(HIT)) // Alice
      s = play(s, turn(MISS)) // Bob
    }
    expect(s.finished).toBe(true)
    expect(selectors.activePlayerId(s)).toBe(null)
    expect(selectors.winner(s).id).toBe('a')
    // sum of all round values * 3
    const sum = (19 + 36 + 51 + 20 + 25 + 45 + 32 + 14 + 40) * 3
    expect(s.scores.a).toBe(sum)
    expect(s.scores.b).toBe(0)
    // further throws are ignored once finished
    expect(reducer(s, HIT)).toBe(s)
  })

  it('uses a custom rounds config when provided', () => {
    const rounds = [
      { label: '5', value: 5 },
      { label: 'Bull', value: 25 },
    ]
    let s = createInitialState(players, { rounds })
    expect(s.rounds).toHaveLength(2)
    expect(selectors.status(s)).toBe('Cible : 5')
    // round 0 value 5
    s = play(s, turn(HIT)) // Alice 15
    s = play(s, turn(HIT)) // Bob 15 -> round 1
    expect(s.round).toBe(1)
    expect(selectors.status(s)).toBe('Cible : Bull')
    // round 1 value 25
    s = play(s, turn(HIT)) // Alice 15 + 75 = 90
    s = play(s, turn(MISS)) // Bob misses all -> halved floor(15/2)=7, finish
    expect(s.finished).toBe(true)
    expect(s.scores.a).toBe(90)
    expect(s.scores.b).toBe(7)
    expect(selectors.winner(s).id).toBe('a')
  })

  it('is replayable: reducing the action log reproduces the same state (undo support)', () => {
    const init = createInitialState(players)
    const actions = [HIT, MISS, HIT] // Alice's 3 darts on round 0 (value 19)
    const full = play(init, actions)
    const undone = play(init, actions.slice(0, -1)) // drop last = undo
    expect(full.scores.a).toBe(38) // two hits of 19
    expect(selectors.activePlayerId(full)).toBe('b') // turn passed to Bob
    expect(undone.scores.a).toBe(19) // last dart removed (one hit)
    expect(selectors.activePlayerId(undone)).toBe('a') // back to Alice mid-turn
    expect(undone.dartsLeft).toBe(1)
  })

  it('replays a halving turn deterministically from the log', () => {
    const init = createInitialState(players)
    const log = [
      ...turn(HIT), // Alice r0: 57
      ...turn(MISS), // Bob r0 -> r1
      ...turn(MISS), // Alice r1: halved -> 28
    ]
    const a = play(init, log)
    const b = log.reduce(reducer, init)
    expect(a).toEqual(b)
    expect(a.scores.a).toBe(28)
    expect(a.halvedRounds.a).toEqual([1])
  })

  it('validate accepts hit/miss darts and rejects anything else', () => {
    expect(validate({ hit: true })).toBe(true)
    expect(validate({ miss: true })).toBe(true)
    expect(validate({ hit: false, miss: false })).toBe(false)
    expect(validate({ n: 20, mult: 1 })).toBe(false)
    expect(validate({})).toBe(false)
    expect(validate(null)).toBe(false)
    expect(validate(undefined)).toBe(false)
  })
})
