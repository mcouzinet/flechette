import { describe, it, expect } from 'vitest'
import { createInitialState, reducer, selectors, validate } from './bobs27.js'

const players = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }]

const HIT = { type: 'THROW', dart: { hit: true } }
const MISS = { type: 'THROW', dart: { miss: true } }
const play = (state, actions) => actions.reduce(reducer, state)

// A full turn (3 darts): `hits` darts that hit, the rest miss.
const turn = (hits) => [
  ...Array.from({ length: hits }, () => HIT),
  ...Array.from({ length: 3 - hits }, () => MISS),
]
// Build a turn from an explicit dart pattern, e.g. turnOf(true,false,true).
const turnOf = (...hits) => hits.map((h) => (h ? HIT : MISS))

describe("Bob's 27", () => {
  it('starts every player at 27, on round 1 (Double 1), Alice to play', () => {
    const s = createInitialState(players)
    expect(s.scores).toEqual({ a: 27, b: 27 })
    expect(s.round).toBe(1)
    expect(s.eliminated).toEqual({ a: false, b: false })
    expect(selectors.activePlayerId(s)).toBe('a')
    expect(selectors.status(s)).toBe('Double 1')
    expect(s.dartsLeft).toBe(3)
  })

  it('adds 2N for each hit (round 1, Double 1 → +2 per hit)', () => {
    let s = reducer(createInitialState(players), HIT)
    expect(s.scores.a).toBe(29) // 27 + 2
    expect(s.dartsLeft).toBe(2)
    expect(selectors.activePlayerId(s)).toBe('a') // still Alice's turn
    s = reducer(s, HIT)
    expect(s.scores.a).toBe(31) // + 2 again
  })

  it('the double value scales with the round (Double 20 → +40 per hit)', () => {
    // Advance to round 20 by playing 19 full rounds (both players, all miss-free
    // so nobody is eliminated): each player hits all 3 darts every round.
    let s = createInitialState(players)
    for (let r = 0; r < 19; r++) s = play(s, [...turn(3), ...turn(3)])
    expect(s.round).toBe(20)
    expect(selectors.status(s)).toBe('Double 20')
    const before = s.scores.a
    s = reducer(s, HIT)
    expect(s.scores.a).toBe(before + 40) // 2 * 20
  })

  it('a hit on Double Bull (round 21) adds 50', () => {
    let s = createInitialState(players)
    for (let r = 0; r < 20; r++) s = play(s, [...turn(3), ...turn(3)])
    expect(s.round).toBe(21)
    expect(selectors.status(s)).toBe('Double 25')
    const before = s.scores.a
    s = reducer(s, HIT)
    expect(s.scores.a).toBe(before + 50) // 2 * 25
  })

  it('subtracts 2N once when a whole round is missed (no hits in the turn)', () => {
    // Round 1, Double 1: Alice misses all 3 darts -> -2 applied once at turn end.
    let s = play(createInitialState(players), turn(0))
    expect(s.scores.a).toBe(25) // 27 - 2
    expect(selectors.activePlayerId(s)).toBe('b') // turn passed to Bob
    expect(s.round).toBe(1) // round not yet over (Bob still to play)
  })

  it('applies the penalty only once per round, regardless of which darts miss', () => {
    // One hit anywhere in the turn means NO penalty.
    let s = play(createInitialState(players), turnOf(false, true, false))
    expect(s.scores.a).toBe(29) // 27 + 2, no -2 penalty
  })

  it('eliminates a player whose score drops to 0 or below', () => {
    // Drive Bob to elimination while Alice always hits (so Alice never goes out).
    // Bob misses every round; penalties are 2,4,6,8,10,... (= 2 * round).
    // 27 - 2 - 4 - 6 - 8 = 7 after round 4; round 5 penalty 10 -> 7-10 = -3 <= 0.
    let s = createInitialState(players)
    for (let r = 0; r < 5; r++) {
      s = play(s, turn(3)) // Alice hits all 3
      if (s.finished) break
      s = play(s, turn(0)) // Bob misses all 3
      if (s.finished) break
    }
    expect(s.eliminated.b).toBe(true)
    expect(s.scores.b).toBeLessThanOrEqual(0)
  })

  it('skips eliminated players in the rotation', () => {
    const trio = [
      { id: 'a', name: 'Alice' },
      { id: 'b', name: 'Bob' },
      { id: 'c', name: 'Cara' },
    ]
    // Round 1 Double 1 (penalty 2 per missed round). Bring Bob to exactly out
    // without ending the game (Alice & Cara survive).
    // Bob: 27 -> needs 14 missed rounds (penalties 2 each across rounds, but the
    // penalty grows). Easier: keep everyone on round 1 is impossible, so instead
    // verify the skip directly after eliminating Bob mid-game.
    let s = createInitialState(trio)
    // Make Bob the one to fall: Alice & Cara hit every dart, Bob misses every dart.
    // Penalties for Bob: round r contributes -2r. Cumulative after R rounds = -R(R+1).
    // 27 - R(R+1) <= 0 first at R=5 (27-30=-3).
    let eliminatedAtRound = null
    for (let r = 0; r < 6 && !s.finished; r++) {
      s = play(s, turn(3)) // Alice
      if (s.finished) break
      const bobOutBefore = s.eliminated.b
      s = play(s, turn(0)) // Bob
      if (!bobOutBefore && s.eliminated.b) eliminatedAtRound = s.round
      if (s.finished) break
      s = play(s, turn(3)) // Cara
    }
    expect(s.eliminated.b).toBe(true)
    expect(s.finished).toBe(false) // Alice & Cara still in
    // From here, the rotation must never make Bob active and must go A -> C -> A.
    const seen = []
    for (let i = 0; i < 4; i++) {
      seen.push(selectors.activePlayerId(s))
      s = play(s, turn(3)) // whoever is active hits all 3
    }
    expect(seen).not.toContain('b')
    // strictly alternates between the two survivors
    expect(new Set(seen)).toEqual(new Set(['a', 'c']))
    expect(eliminatedAtRound).not.toBeNull()
  })

  it('the last player standing wins immediately', () => {
    // Two players: eliminate Bob, Alice wins on the spot.
    let s = createInitialState(players)
    for (let r = 0; r < 5 && !s.finished; r++) {
      s = play(s, turn(3)) // Alice hits
      if (s.finished) break
      s = play(s, turn(0)) // Bob misses
    }
    expect(s.finished).toBe(true)
    expect(s.eliminated.b).toBe(true)
    expect(selectors.winner(s).id).toBe('a')
    expect(selectors.activePlayerId(s)).toBeNull()
    // throws are ignored once finished
    expect(reducer(s, HIT)).toBe(s)
  })

  it('after all 21 rounds the highest score among survivors wins', () => {
    // Both survive every round (always at least one hit -> no penalty), but
    // Alice out-scores Bob: Alice hits all 3 every round, Bob hits exactly 1.
    let s = createInitialState(players)
    for (let r = 0; r < 21 && !s.finished; r++) {
      s = play(s, turn(3)) // Alice: 3 hits
      s = play(s, turnOf(true, false, false)) // Bob: 1 hit (no penalty)
    }
    expect(s.finished).toBe(true)
    expect(s.round).toBe(21)
    expect(s.eliminated).toEqual({ a: false, b: false })
    expect(s.scores.a).toBeGreaterThan(s.scores.b)
    expect(selectors.winner(s).id).toBe('a')
  })

  it('breaks ties after 21 rounds in player order (first wins)', () => {
    // Identical play -> identical scores -> first player in order wins.
    let s = createInitialState(players)
    for (let r = 0; r < 21 && !s.finished; r++) {
      s = play(s, turn(3))
      s = play(s, turn(3))
    }
    expect(s.finished).toBe(true)
    expect(s.scores.a).toBe(s.scores.b)
    expect(selectors.winner(s).id).toBe('a')
  })

  it('advances the round only after the last surviving player finishes', () => {
    let s = play(createInitialState(players), turn(3)) // Alice done, round 1
    expect(s.round).toBe(1)
    expect(selectors.activePlayerId(s)).toBe('b')
    s = play(s, turn(3)) // Bob done -> round 2
    expect(s.round).toBe(2)
    expect(selectors.activePlayerId(s)).toBe('a')
    expect(selectors.status(s)).toBe('Double 2')
  })

  it('exposes a scoreboard with points, active flag, elimination and winner', () => {
    let s = createInitialState(players)
    let board = selectors.scoreboard(s)
    expect(board[0]).toMatchObject({ id: 'a', name: 'Alice', value: 27, active: true, winner: false })
    expect(board[1]).toMatchObject({ id: 'b', value: 27, active: false })

    // play to completion (Bob eliminated)
    for (let r = 0; r < 5 && !s.finished; r++) {
      s = play(s, turn(3))
      if (s.finished) break
      s = play(s, turn(0))
    }
    board = selectors.scoreboard(s)
    const bob = board.find((r) => r.id === 'b')
    const alice = board.find((r) => r.id === 'a')
    expect(bob.sub).toBe('éliminé')
    expect(alice.winner).toBe(true)
    expect(alice.active).toBe(false) // no active player once finished
  })

  it('is replayable: reducing the action log reproduces the same state (undo support)', () => {
    const init = createInitialState(players)
    const actions = [...turnOf(true, false, true), HIT] // Alice's 3 darts + Bob's 1st
    const full = play(init, actions)
    const undone = play(init, actions.slice(0, -1)) // drop last = undo
    // Alice: 2 hits on Double 1 = +4 -> 31, no penalty
    expect(full.scores.a).toBe(31)
    expect(selectors.activePlayerId(full)).toBe('b') // Bob is mid-turn
    expect(full.scores.b).toBe(29) // Bob's one hit applied (+2)
    // undo Bob's dart: back to start of Bob's turn, Bob untouched
    expect(undone.scores.b).toBe(27)
    expect(selectors.activePlayerId(undone)).toBe('b')
    expect(undone.dartsLeft).toBe(3)
  })

  it('validate(): true only for an explicit hit or miss dart', () => {
    expect(validate({ hit: true })).toBe(true)
    expect(validate({ miss: true })).toBe(true)
    expect(validate({ hit: false, miss: false })).toBe(false)
    expect(validate({})).toBe(false)
    expect(validate(null)).toBe(false)
    expect(validate(undefined)).toBe(false)
  })
})
