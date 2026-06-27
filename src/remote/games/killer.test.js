import { describe, it, expect } from 'vitest'
import { createInitialState, reducer, selectors, validate } from './killer.js'

const players = [
  { id: 'a', name: 'Alice' },
  { id: 'b', name: 'Bob' },
  { id: 'c', name: 'Carol' },
]
const ASSIGN = (n) => ({ type: 'THROW', dart: { assign: n } })
const SELF = { type: 'THROW', dart: { self: true } }
const TARGET = (id) => ({ type: 'THROW', dart: { target: id } })
const MISS = { type: 'THROW', dart: { miss: true } }
const play = (state, actions) => actions.reduce(reducer, state)

// Walk through the setup phase assigning a,b,c -> 1,2,3.
const setupDone = (ps = players) =>
  play(
    createInitialState(ps),
    ps.map((p, i) => ASSIGN(i + 1)),
  )

describe('Killer — setup phase', () => {
  it('starts in setup with the first player choosing and 3 lives each', () => {
    const s = createInitialState(players)
    expect(s.phase).toBe('setup')
    expect(selectors.activePlayerId(s)).toBe('a')
    expect(selectors.status(s)).toBe('Choix des numéros')
    expect(s.lives).toEqual({ a: 3, b: 3, c: 3 })
    expect(s.numbers).toEqual({ a: null, b: null, c: null })
  })

  it('assigns a number and advances to the next player', () => {
    const s = reducer(createInitialState(players), ASSIGN(7))
    expect(s.numbers.a).toBe(7)
    expect(selectors.activePlayerId(s)).toBe('b') // next player chooses
    expect(s.phase).toBe('setup')
  })

  it('rejects an already-taken number (no-op, stays on same player)', () => {
    let s = reducer(createInitialState(players), ASSIGN(5)) // a -> 5
    s = reducer(s, ASSIGN(5)) // b tries 5, taken
    expect(s.numbers.b).toBe(null)
    expect(selectors.activePlayerId(s)).toBe('b') // still Bob to choose
  })

  it('transitions to the game phase once every player has a number', () => {
    const s = setupDone()
    expect(s.phase).toBe('game')
    expect(s.numbers).toEqual({ a: 1, b: 2, c: 3 })
    expect(selectors.activePlayerId(s)).toBe('a') // first player to play
    expect(s.dartsLeft).toBe(3)
    expect(selectors.status(s)).toBe('En jeu')
  })
})

describe('Killer — game phase', () => {
  it('a non-killer becomes a killer by hitting their own double', () => {
    const s = reducer(setupDone(), SELF)
    expect(s.isKiller.a).toBe(true)
    expect(s.dartsLeft).toBe(2)
    expect(selectors.activePlayerId(s)).toBe('a') // still Alice's turn
  })

  it('a killer removes one life from a target', () => {
    let s = setupDone()
    s = reducer(s, SELF) // Alice becomes killer
    s = reducer(s, TARGET('b')) // Alice hits Bob
    expect(s.lives.b).toBe(2)
    expect(s.eliminated.b).toBe(false)
  })

  it('a non-killer targeting someone has no effect', () => {
    let s = setupDone()
    s = reducer(s, TARGET('b')) // Alice is not a killer yet
    expect(s.lives.b).toBe(3)
  })

  it('a killer cannot remove their own life', () => {
    let s = setupDone()
    s = reducer(s, SELF)
    s = reducer(s, TARGET('a')) // self target ignored
    expect(s.lives.a).toBe(3)
  })

  it('a miss has no effect but consumes a dart', () => {
    let s = setupDone()
    s = reducer(s, SELF)
    const before = JSON.parse(JSON.stringify(s.lives))
    s = reducer(s, MISS)
    expect(s.lives).toEqual(before)
    expect(s.dartsLeft).toBe(1)
  })

  it('eliminates a target when its lives reach 0', () => {
    let s = setupDone()
    s = reducer(s, SELF) // Alice killer (dart 1)
    s = reducer(s, TARGET('b')) // Bob 3 -> 2 (dart 2)
    s = reducer(s, TARGET('b')) // Bob 2 -> 1 (dart 3, turn ends -> Bob to play)
    expect(selectors.activePlayerId(s)).toBe('b')
    // Rotation a -> b -> c -> a; two miss turns bring us back to Alice.
    s = play(s, [MISS, MISS, MISS]) // Bob -> Carol
    expect(selectors.activePlayerId(s)).toBe('c')
    s = play(s, [MISS, MISS, MISS]) // Carol -> Alice
    expect(selectors.activePlayerId(s)).toBe('a')
    s = reducer(s, TARGET('b')) // Bob 1 -> 0 eliminated
    expect(s.lives.b).toBe(0)
    expect(s.eliminated.b).toBe(true)
  })

  it('skips eliminated players in the rotation', () => {
    // Give everyone a number, then eliminate Bob and check A -> C rotation.
    let s = setupDone()
    // Alice becomes killer and burns Bob down to 0 over multiple turns.
    s = reducer(s, SELF) // d1
    s = reducer(s, TARGET('b')) // b:2 (d2)
    s = reducer(s, TARGET('b')) // b:1 (d3) -> turn passes to Bob
    s = play(s, [MISS, MISS, MISS]) // Bob -> Carol
    s = play(s, [MISS, MISS, MISS]) // Carol -> Alice
    expect(selectors.activePlayerId(s)).toBe('a')
    s = reducer(s, TARGET('b')) // b:0 eliminated (d1 of Alice's turn)
    expect(s.eliminated.b).toBe(true)
    // Finish Alice's turn; next alive after Alice is Carol (Bob skipped).
    s = play(s, [MISS, MISS]) // d2,d3 end Alice's turn
    expect(selectors.activePlayerId(s)).toBe('c')
  })

  it('wins when only one player remains (last standing)', () => {
    // 2-player game makes the win condition easy to drive to completion.
    const two = [
      { id: 'a', name: 'Alice' },
      { id: 'b', name: 'Bob' },
    ]
    let s = play(createInitialState(two), [ASSIGN(1), ASSIGN(2)])
    expect(s.phase).toBe('game')
    s = reducer(s, SELF) // Alice killer (d1)
    s = reducer(s, TARGET('b')) // b:2 (d2)
    s = reducer(s, TARGET('b')) // b:1 (d3) -> Bob's turn
    s = play(s, [MISS, MISS, MISS]) // Bob whiffs -> back to Alice
    expect(selectors.activePlayerId(s)).toBe('a')
    s = reducer(s, TARGET('b')) // b:0 eliminated -> Alice last standing
    expect(s.finished).toBe(true)
    expect(s.winnerId).toBe('a')
    expect(selectors.winner(s).id).toBe('a')
    // further throws are ignored once finished
    expect(reducer(s, SELF)).toBe(s)
  })

  it('the killing dart ends the game immediately, mid-turn', () => {
    const two = [
      { id: 'a', name: 'Alice' },
      { id: 'b', name: 'Bob' },
    ]
    let s = play(createInitialState(two), [ASSIGN(1), ASSIGN(2)])
    s = reducer(s, SELF) // d1
    s = reducer(s, TARGET('b')) // b:2 (d2)
    s = reducer(s, TARGET('b')) // b:1 (d3) -> Bob
    s = play(s, [MISS, MISS, MISS]) // back to Alice
    s = reducer(s, TARGET('b')) // b:0 -> win on dart 1
    expect(s.finished).toBe(true)
    expect(s.dartsLeft).toBe(2) // turn did not roll over; ended immediately
  })
})

describe('Killer — replayability & validate', () => {
  it('is replayable: reducing the action log reproduces the same state (undo support)', () => {
    const init = createInitialState(players)
    const actions = [ASSIGN(1), ASSIGN(2), ASSIGN(3), SELF, TARGET('b')]
    const full = play(init, actions)
    const undone = play(init, actions.slice(0, -1)) // drop last = undo
    // Deterministic re-reduce yields an identical object.
    expect(play(init, actions)).toEqual(full)
    expect(full.lives.b).toBe(2)
    expect(full.isKiller.a).toBe(true)
    expect(undone.lives.b).toBe(3) // last (the hit) removed
    expect(undone.isKiller.a).toBe(true)
  })

  it('does not mutate the input state', () => {
    const s = setupDone()
    const snapshot = JSON.parse(JSON.stringify(s))
    reducer(s, SELF)
    expect(s).toEqual(snapshot)
  })

  it('validate accepts the four legal dart shapes', () => {
    expect(validate({ assign: 1 })).toBe(true)
    expect(validate({ assign: 20 })).toBe(true)
    expect(validate({ self: true })).toBe(true)
    expect(validate({ target: 'b' })).toBe(true)
    expect(validate({ miss: true })).toBe(true)
  })

  it('validate rejects malformed darts', () => {
    expect(validate({ assign: 0 })).toBe(false)
    expect(validate({ assign: 21 })).toBe(false)
    expect(validate({ assign: 2.5 })).toBe(false)
    expect(validate({ target: 42 })).toBe(false)
    expect(validate({ self: false })).toBe(false)
    expect(validate({})).toBe(false)
    expect(validate(null)).toBe(false)
    expect(validate(undefined)).toBe(false)
  })
})
