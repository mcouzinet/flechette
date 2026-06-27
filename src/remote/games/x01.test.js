import { describe, it, expect } from 'vitest'
import { createInitialState, reducer, selectors, meta } from './x01.js'

const players = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }]
const THROW = (n, mult = 1) => ({ type: 'THROW', dart: { n, mult } })
const MISS = { type: 'THROW', dart: { miss: true } }
const play = (state, actions) => actions.reduce(reducer, state)

describe('301 / 501 (X01)', () => {
  it('initialises every score to the starting total (default 301) and Alice to play', () => {
    const s = createInitialState(players)
    expect(s.start).toBe(301)
    expect(s.scores).toEqual({ a: 301, b: 301 })
    expect(s.turnStartScore).toBe(301)
    expect(selectors.activePlayerId(s)).toBe('a')
    expect(s.dartsLeft).toBe(3)
    expect(s.finished).toBe(false)
    expect(s.winnerId).toBe(null)
  })

  it('supports a 501 start via config', () => {
    const s = createInitialState(players, { start: 501 })
    expect(s.scores).toEqual({ a: 501, b: 501 })
    expect(s.turnStartScore).toBe(501)
  })

  it('subtracts the dart value (with multiplier) and consumes one dart', () => {
    const s = reducer(createInitialState(players), THROW(20, 3)) // 60
    expect(s.scores.a).toBe(241) // 301 - 60
    expect(s.dartsLeft).toBe(2)
    expect(selectors.activePlayerId(s)).toBe('a') // still Alice's turn
  })

  it('counts the bull as 25 (single) and 50 (double)', () => {
    expect(reducer(createInitialState(players), THROW(25, 1)).scores.a).toBe(276) // 301 - 25
    expect(reducer(createInitialState(players), THROW(25, 2)).scores.a).toBe(251) // 301 - 50
  })

  it('a miss subtracts nothing but consumes a dart', () => {
    const s = reducer(createInitialState(players), MISS)
    expect(s.scores.a).toBe(301)
    expect(s.dartsLeft).toBe(2)
  })

  it('passes to the next player after 3 darts', () => {
    const s = play(createInitialState(players), [THROW(20), THROW(20), THROW(20)])
    expect(s.scores.a).toBe(241) // 301 - 60
    expect(selectors.activePlayerId(s)).toBe('b')
    expect(s.dartsLeft).toBe(3)
    expect(s.turnStartScore).toBe(301) // snapshot of Bob's starting score
  })

  it('busts when going below zero: restores the turn-start score and ends the turn', () => {
    // Bring Alice down to 30 (turn-start for her next turn), then bust.
    let s = createInitialState(players, { start: 501 })
    // Drive Alice's score down to exactly 30 across full turns so a fresh
    // turn begins with turnStartScore = 30.
    // Turn 1 (Alice): 471 left ; Turn for Bob ; etc. Simpler: build a state directly.
    s = {
      ...s,
      scores: { a: 30, b: 200 },
      currentPlayerIndex: 0,
      dartsLeft: 3,
      turnStartScore: 30,
    }
    // First dart of the turn: T20 = 60 > 30 -> immediate bust.
    const busted = reducer(s, THROW(20, 3))
    expect(busted.scores.a).toBe(30) // restored to turn-start, dart NOT applied
    expect(selectors.activePlayerId(busted)).toBe('b') // turn ended -> Bob
    expect(busted.dartsLeft).toBe(3)
    expect(busted.turnStartScore).toBe(200) // now Bob's turn-start
  })

  it('restores to turn-start even after several valid darts in the same turn', () => {
    let s = createInitialState(players, { start: 301 })
    s = { ...s, scores: { a: 50, b: 100 }, currentPlayerIndex: 0, dartsLeft: 3, turnStartScore: 50 }
    s = reducer(s, THROW(10)) // 40, dartsLeft 2
    s = reducer(s, THROW(10)) // 30, dartsLeft 1
    const busted = reducer(s, THROW(20, 3)) // 60 > 30 -> bust
    expect(busted.scores.a).toBe(50) // back to the start of the turn, not 30
    expect(selectors.activePlayerId(busted)).toBe('b')
  })

  it('wins on exactly zero on any dart', () => {
    let s = createInitialState(players, { start: 301 })
    s = { ...s, scores: { a: 40, b: 100 }, currentPlayerIndex: 0, dartsLeft: 2, turnStartScore: 60 }
    s = reducer(s, THROW(20, 2)) // 40 - 40 = 0
    expect(s.scores.a).toBe(0)
    expect(s.finished).toBe(true)
    expect(s.winnerId).toBe('a')
    expect(selectors.winner(s).id).toBe('a')
    expect(selectors.activePlayerId(s)).toBe(null)
    expect(selectors.status(s)).toBe('Partie terminée')
  })

  it('ignores throws once finished', () => {
    let s = createInitialState(players, { start: 301 })
    s = { ...s, scores: { a: 20, b: 100 }, currentPlayerIndex: 0, dartsLeft: 3, turnStartScore: 20 }
    s = reducer(s, THROW(20)) // win
    expect(s.finished).toBe(true)
    expect(reducer(s, THROW(20))).toBe(s) // unchanged, same reference
    expect(reducer(s, MISS)).toBe(s)
  })

  it('is replayable: reducing the action log reproduces the same state (undo support)', () => {
    const init = createInitialState(players, { start: 301 })
    const actions = [THROW(20), THROW(5, 2), THROW(19)] // Alice's 3 darts: 20 + 10 + 19 = 49
    const full = play(init, actions)
    const undone = play(init, actions.slice(0, -1)) // drop last = undo

    expect(full.scores.a).toBe(252) // 301 - 49
    expect(selectors.activePlayerId(full)).toBe('b') // turn passed to Bob
    expect(undone.scores.a).toBe(271) // 301 - (20 + 10), last dart removed
    expect(selectors.activePlayerId(undone)).toBe('a') // back to Alice mid-turn
    expect(undone.dartsLeft).toBe(1)
  })

  it('exposes a uniform scoreboard with remaining scores', () => {
    let s = createInitialState(players, { start: 301 })
    s = reducer(s, THROW(20, 3)) // Alice 301 -> 241
    const board = selectors.scoreboard(s)
    expect(board[0]).toMatchObject({ id: 'a', name: 'Alice', value: 241, active: true, winner: false })
    expect(board[1]).toMatchObject({ id: 'b', name: 'Bob', value: 301, active: false, winner: false })
  })

  it('meta matches the X01 contract', () => {
    expect(meta.id).toBe('x01')
    expect(meta.name).toBe('301 / 501')
    expect(meta.short).toBe('Tombe à zéro pile')
    expect(meta.minPlayers).toBe(2)
    expect(meta.dartsPerTurn).toBe(3)
  })
})
