import { describe, it, expect } from 'vitest'
import { createInitialState, reducer, selectors, validate } from './shanghai.js'

const players = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }]
// In Shanghai every dart is aimed at the current round number; the dart only
// carries how it landed on that number.
const HIT = (mult = 1) => ({ type: 'THROW', dart: { mult } })
const MISS = { type: 'THROW', dart: { miss: true } }
const play = (state, actions) => actions.reduce(reducer, state)

describe('Shanghai', () => {
  it('initialises scores to 0, round 1, Alice to play', () => {
    const s = createInitialState(players)
    expect(s.scores).toEqual({ a: 0, b: 0 })
    expect(s.round).toBe(1)
    expect(s.dartsLeft).toBe(3)
    expect(selectors.activePlayerId(s)).toBe('a')
  })

  it('scores round * mult and consumes one dart', () => {
    // round 1, triple -> 1 * 3 = 3
    const s = reducer(createInitialState(players), HIT(3))
    expect(s.scores.a).toBe(3)
    expect(s.dartsLeft).toBe(2)
    expect(selectors.activePlayerId(s)).toBe('a') // still Alice's turn
  })

  it('a miss scores 0 but still consumes a dart', () => {
    const s = reducer(createInitialState(players), MISS)
    expect(s.scores.a).toBe(0)
    expect(s.dartsLeft).toBe(2)
  })

  it('passes to the next player after 3 darts (round unchanged)', () => {
    // Alice: single + double + miss = 1 + 2 + 0 = 3 (no shanghai, missing triple)
    const s = play(createInitialState(players), [HIT(1), HIT(2), MISS])
    expect(s.scores.a).toBe(3)
    expect(selectors.activePlayerId(s)).toBe('b')
    expect(s.dartsLeft).toBe(3)
    expect(s.round).toBe(1)
  })

  it('advances the round only after the last player of the round', () => {
    let s = play(createInitialState(players), [MISS, MISS, MISS]) // Alice done
    expect(s.round).toBe(1)
    expect(selectors.activePlayerId(s)).toBe('b')
    s = play(s, [MISS, MISS, MISS]) // Bob done -> round advances
    expect(s.round).toBe(2)
    expect(selectors.activePlayerId(s)).toBe('a')
  })

  it('scores the new round number after advancing', () => {
    // Round 1: both players miss everything -> round 2
    let s = play(createInitialState(players), [MISS, MISS, MISS, MISS, MISS, MISS])
    expect(s.round).toBe(2)
    // round 2, double -> 2 * 2 = 4
    s = reducer(s, HIT(2))
    expect(s.scores.a).toBe(4)
  })

  it('SHANGHAI: single + double + triple of the same round wins immediately', () => {
    const s = play(createInitialState(players), [HIT(1), HIT(2), HIT(3)])
    expect(s.finished).toBe(true)
    expect(s.winnerId).toBe('a')
    expect(selectors.winner(s).id).toBe('a')
    // 1*1 + 1*2 + 1*3 = 6 on round 1
    expect(s.scores.a).toBe(6)
    // further throws are ignored once finished
    expect(reducer(s, HIT(3))).toBe(s)
  })

  it('SHANGHAI order does not matter (triple, single, double also wins)', () => {
    const s = play(createInitialState(players), [HIT(3), HIT(1), HIT(2)])
    expect(s.finished).toBe(true)
    expect(s.winnerId).toBe('a')
  })

  it('does NOT trigger Shanghai across different rounds', () => {
    // Alice round 1: single only; Bob round 1: nothing.
    // round 2: Alice double; round 3: Alice triple. Same hit-types but
    // spread across rounds -> no Shanghai.
    let s = play(createInitialState(players), [HIT(1), MISS, MISS]) // Alice r1: single
    s = play(s, [MISS, MISS, MISS]) // Bob r1 -> round 2
    expect(s.round).toBe(2)
    s = play(s, [HIT(2), MISS, MISS]) // Alice r2: double
    s = play(s, [MISS, MISS, MISS]) // Bob r2 -> round 3
    expect(s.round).toBe(3)
    s = play(s, [HIT(3), MISS, MISS]) // Alice r3: triple
    expect(s.finished).toBe(false)
    // scores: 1*1 (r1) + 2*2 (r2) + 3*3 (r3) = 1 + 4 + 9 = 14
    expect(s.scores.a).toBe(14)
  })

  it('finishes after the configured rounds and the highest total wins', () => {
    // Use a tiny game (2 rounds) for speed; same advance logic as 20.
    let s = createInitialState(players, { rounds: 2 })
    // Round 1: Alice triple+triple+triple = 1*3*3 = 9 (no double/single -> no shanghai),
    //          Bob misses everything.
    s = play(s, [HIT(3), HIT(3), HIT(3)])
    expect(s.finished).toBe(false)
    expect(s.scores.a).toBe(9)
    s = play(s, [MISS, MISS, MISS]) // Bob r1 -> round 2
    expect(s.round).toBe(2)
    // Round 2: Alice misses, Bob triples thrice = 2*3*3 = 18 -> Bob wins on score
    s = play(s, [MISS, MISS, MISS]) // Alice r2
    s = play(s, [HIT(3), HIT(3), HIT(3)]) // Bob r2 -> game ends
    expect(s.finished).toBe(true)
    expect(s.scores).toEqual({ a: 9, b: 18 })
    expect(selectors.winner(s).id).toBe('b')
    // further throws ignored
    expect(reducer(s, HIT(3))).toBe(s)
  })

  it('ties on final score break to the first player in order', () => {
    let s = createInitialState(players, { rounds: 1 })
    // both score 1 (single on round 1), no shanghai -> Alice (first) wins the tie
    s = play(s, [HIT(1), MISS, MISS, HIT(1), MISS, MISS])
    expect(s.finished).toBe(true)
    expect(s.scores).toEqual({ a: 1, b: 1 })
    expect(selectors.winner(s).id).toBe('a')
  })

  it('plays a full 20-round game and finishes with a winner', () => {
    let s = createInitialState(players)
    // Every player misses every dart across all 20 rounds (40 turns of 3 darts).
    for (let i = 0; i < players.length * 20; i++) {
      s = play(s, [MISS, MISS, MISS])
    }
    expect(s.round).toBe(20) // round never advances past the last
    expect(s.finished).toBe(true)
    expect(s.scores).toEqual({ a: 0, b: 0 })
    expect(selectors.winner(s).id).toBe('a') // 0-0 tie -> first player
  })

  it('status reflects the round and target, then the finished label', () => {
    const s = createInitialState(players)
    expect(selectors.status(s)).toBe('Manche 1/20 · cible 1')
    const done = play(createInitialState(players), [HIT(1), HIT(2), HIT(3)]) // shanghai
    expect(selectors.status(done)).toBe('Partie terminée')
  })

  it('scoreboard exposes generic rows with active + winner flags', () => {
    const s = createInitialState(players)
    const board = selectors.scoreboard(s)
    expect(board).toHaveLength(2)
    expect(board[0]).toMatchObject({ id: 'a', name: 'Alice', value: 0, active: true, winner: false })
    expect(board[1]).toMatchObject({ id: 'b', name: 'Bob', active: false })

    const won = play(createInitialState(players), [HIT(1), HIT(2), HIT(3)])
    const wonBoard = selectors.scoreboard(won)
    expect(wonBoard[0]).toMatchObject({ id: 'a', winner: true, active: false })
  })

  it('is self-contained, JSON-serialisable and replayable (undo support)', () => {
    const init = createInitialState(players)
    // round-trips through JSON unchanged (no Maps/classes)
    expect(JSON.parse(JSON.stringify(init))).toEqual(init)
    expect(init.players).toEqual([{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }])

    const actions = [HIT(1), HIT(2), MISS] // Alice's 3 darts, no shanghai
    const full = play(init, actions)
    const undone = play(init, actions.slice(0, -1)) // drop last = undo
    expect(full.scores.a).toBe(3) // 1*1 + 1*2
    expect(selectors.activePlayerId(full)).toBe('b') // turn passed to Bob
    expect(undone.scores.a).toBe(3) // last dart was a miss anyway
    expect(undone.dartsLeft).toBe(1) // mid-turn, back to Alice
    expect(selectors.activePlayerId(undone)).toBe('a')
  })

  it('replaying the same action log reproduces identical state', () => {
    const init = createInitialState(players)
    const log = [HIT(2), MISS, HIT(1), MISS, MISS, HIT(3)]
    expect(play(init, log)).toEqual(play(createInitialState(players), log))
  })

  it('ignores non-THROW actions and throws after finish', () => {
    const s = createInitialState(players)
    expect(reducer(s, { type: 'RESET' })).toBe(s)
    expect(reducer(s, { type: 'UNDO' })).toBe(s)
    expect(reducer(s, null)).toBe(s)
  })

  describe('validate', () => {
    it('accepts a miss', () => {
      expect(validate({ miss: true })).toBe(true)
    })
    it('accepts single, double and triple', () => {
      expect(validate({ mult: 1 })).toBe(true)
      expect(validate({ mult: 2 })).toBe(true)
      expect(validate({ mult: 3 })).toBe(true)
    })
    it('rejects bad / missing multipliers and empty darts', () => {
      expect(validate({ mult: 0 })).toBe(false)
      expect(validate({ mult: 4 })).toBe(false)
      expect(validate({})).toBe(false)
      expect(validate(null)).toBe(false)
      expect(validate(undefined)).toBe(false)
    })
  })
})
