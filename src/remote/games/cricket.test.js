import { describe, it, expect } from 'vitest'
import { createInitialState, reducer, selectors } from './cricket.js'

const players = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }]
const THROW = (n, mult = 1) => ({ type: 'THROW', dart: { n, mult } })
const MISS = { type: 'THROW', dart: { miss: true } }
const play = (state, actions) => actions.reduce(reducer, state)

// Zone indices: 0=Bull(25), 1=20, 2=19, 3=18, 4=17, 5=16, 6=15
describe('Cricket', () => {
  it('initialises marks and scores to zero and Alice to play', () => {
    const s = createInitialState(players)
    expect(s.marks).toEqual({ a: [0, 0, 0, 0, 0, 0, 0], b: [0, 0, 0, 0, 0, 0, 0] })
    expect(s.score).toEqual({ a: 0, b: 0 })
    expect(selectors.activePlayerId(s)).toBe('a')
    expect(s.dartsLeft).toBe(3)
    expect(s.finished).toBe(false)
  })

  it('a triple on 20 adds 3 marks and closes that zone (no points scored)', () => {
    const s = reducer(createInitialState(players), THROW(20, 3))
    expect(s.marks.a[1]).toBe(3) // zone index 1 = "20"
    expect(s.score).toEqual({ a: 0, b: 0 }) // closing scores nothing
    expect(s.dartsLeft).toBe(2) // still Alice's turn
    expect(selectors.activePlayerId(s)).toBe('a')
    // marksGrid reflects the closed zone
    const grid = selectors.marksGrid(s)
    expect(grid.rows[0].marks[1]).toBe(3)
    expect(grid.rows[0].closed[1]).toBe(true)
    expect(grid.rows[1].closed[1]).toBe(false)
  })

  it('once a player closed 20, hitting 20 again piles points onto opponents who have NOT closed it (and not onto those who have)', () => {
    let s = createInitialState(players)
    // Alice closes 20 (3 darts), turn passes to Bob
    s = play(s, [THROW(20), THROW(20), THROW(20)])
    expect(selectors.activePlayerId(s)).toBe('b')
    expect(s.score).toEqual({ a: 0, b: 0 })
    // Bob throws non-zone darts to pass the turn back to Alice without closing 20
    s = play(s, [MISS, MISS, MISS])
    expect(selectors.activePlayerId(s)).toBe('a')
    // Alice hits 20 again while Bob has NOT closed 20 -> Bob takes 20 points
    s = reducer(s, THROW(20))
    expect(s.marks.a[1]).toBe(4)
    expect(s.score.b).toBe(20)
    expect(s.score.a).toBe(0) // points pile onto opponents, never the thrower
  })

  it('does NOT pile points onto an opponent who has also closed the zone', () => {
    let s = createInitialState(players)
    // Alice closes 20
    s = play(s, [THROW(20), THROW(20), THROW(20)])
    // Bob also closes 20
    s = play(s, [THROW(20), THROW(20), THROW(20)])
    expect(s.marks.a[1]).toBe(3)
    expect(s.marks.b[1]).toBe(3)
    expect(s.score).toEqual({ a: 0, b: 0 })
    // Back to Alice: hitting closed 20 scores nothing (Bob has it closed too)
    s = reducer(s, THROW(20))
    expect(s.marks.a[1]).toBe(4)
    expect(s.score).toEqual({ a: 0, b: 0 })
  })

  it('applies marks one at a time: a triple that crosses the close threshold only scores the surplus marks', () => {
    let s = createInitialState(players)
    // Alice puts 2 marks on 19 (double), turn still hers (1 dart left)
    s = reducer(s, THROW(19, 2))
    expect(s.marks.a[2]).toBe(2)
    expect(s.score.b).toBe(0)
    // Alice throws a TRIPLE on 19: marks go 2->3 (closes, no score),
    // 3->4 (scores 19), 4->5 (scores 19) = +38 onto Bob
    s = reducer(s, THROW(19, 3))
    expect(s.marks.a[2]).toBe(5)
    expect(s.score.b).toBe(38) // exactly the 2 surplus marks, not all 3
    expect(s.score.a).toBe(0)
  })

  it('passes to the next player after exactly 3 darts and resets dartsLeft', () => {
    let s = createInitialState(players)
    s = reducer(s, THROW(20))
    expect(selectors.activePlayerId(s)).toBe('a')
    expect(s.dartsLeft).toBe(2)
    s = reducer(s, THROW(19))
    expect(s.dartsLeft).toBe(1)
    s = reducer(s, THROW(18))
    expect(selectors.activePlayerId(s)).toBe('b')
    expect(s.dartsLeft).toBe(3)
  })

  it('a non-zone dart (or a miss) wastes a dart: no marks but consumes one of the 3', () => {
    let s = reducer(createInitialState(players), THROW(7)) // 7 is not a Cricket zone
    expect(s.marks.a).toEqual([0, 0, 0, 0, 0, 0, 0])
    expect(s.dartsLeft).toBe(2)
    s = reducer(s, MISS)
    expect(s.marks.a).toEqual([0, 0, 0, 0, 0, 0, 0])
    expect(s.dartsLeft).toBe(1)
    expect(selectors.activePlayerId(s)).toBe('a')
  })

  it('wins when a player has closed ALL zones AND holds the lowest score among all players', () => {
    let s = createInitialState(players)
    const zoneNs = [25, 20, 19, 18, 17, 16, 15]
    // Drive Alice through closing all 7 zones with triples, with Bob
    // wasting his turns (3 misses) so he never closes anything and never
    // gets points piled on him. 7 triples for Alice = 3 turns (with one
    // surplus dart) interleaved with Bob's wasted turns.
    const actions = []
    for (let i = 0; i < zoneNs.length; i++) {
      actions.push(THROW(zoneNs[i], 3)) // Alice closes zone i
      // After every 3rd Alice dart the turn flips to Bob; insert Bob's
      // wasted turn whenever it's Bob's turn.
      let probe = play(s, actions)
      if (selectors.activePlayerId(probe) === 'b' && !probe.finished) {
        actions.push(MISS, MISS, MISS) // Bob wastes a full turn
      }
    }
    s = play(createInitialState(players), actions)
    expect(s.finished).toBe(true)
    expect(s.winnerId).toBe('a')
    expect(selectors.winner(s).id).toBe('a')
    // Alice closed everything; her score (0) is the lowest of all players.
    expect(s.marks.a.every((m) => m >= 3)).toBe(true)
    expect(s.score.a).toBe(0)
    expect(selectors.status(s)).toBe('Partie terminée')
  })

  it('does NOT win on all-zones-closed if another player has a strictly lower score', () => {
    // Construct a state by hand: Alice closed all zones but piled points on
    // herself is impossible, so instead make Alice closed-all with a higher
    // score than Bob, who is NOT closed-all. Then no winner.
    let s = createInitialState(players)
    // Manually set up via the reducer is awkward for "Alice closed all but
    // higher score"; build the state directly (still plain JSON).
    s = {
      ...s,
      marks: { a: [3, 3, 3, 3, 3, 3, 3], b: [3, 0, 0, 0, 0, 0, 0] },
      score: { a: 25, b: 0 }, // Bob piled 25 onto Alice earlier
    }
    // Re-run resolution by issuing a harmless wasted dart for the active player.
    const after = reducer(s, MISS)
    // Alice closed all zones but Bob (0) has a strictly lower score than
    // Alice (25), so the only closed-all player is not the lowest -> no win.
    expect(after.finished).toBe(false)
    expect(after.winnerId).toBe(null)
  })

  it('ignores further throws once finished', () => {
    let s = createInitialState(players)
    const zoneNs = [25, 20, 19, 18, 17, 16, 15]
    const actions = []
    for (let i = 0; i < zoneNs.length; i++) {
      actions.push(THROW(zoneNs[i], 3))
      let probe = play(s, actions)
      if (selectors.activePlayerId(probe) === 'b' && !probe.finished) {
        actions.push(MISS, MISS, MISS)
      }
    }
    s = play(createInitialState(players), actions)
    expect(s.finished).toBe(true)
    // any further THROW is a no-op returning the same reference
    expect(reducer(s, THROW(20))).toBe(s)
    expect(reducer(s, MISS)).toBe(s)
  })

  it('is replayable: reducing the action log reproduces state; dropping the last action = undo', () => {
    const init = createInitialState(players)
    // Alice: triple-20 (closes 20), then 20 again (+20 to Bob), then 19.
    const actions = [THROW(20, 3), THROW(20), THROW(19)]
    const full = play(init, actions)
    const undone = play(init, actions.slice(0, -1)) // drop the 19

    // Full: 20 closed (4 marks), Bob has 20 points, 19 has 1 mark, turn -> Bob
    expect(full.marks.a[1]).toBe(4)
    expect(full.marks.a[2]).toBe(1)
    expect(full.score.b).toBe(20)
    expect(selectors.activePlayerId(full)).toBe('b')

    // Undone: the 19 mark is gone, score on Bob and the 20 marks remain,
    // and it is still Alice mid-turn with 1 dart left.
    expect(undone.marks.a[1]).toBe(4)
    expect(undone.marks.a[2]).toBe(0)
    expect(undone.score.b).toBe(20)
    expect(selectors.activePlayerId(undone)).toBe('a')
    expect(undone.dartsLeft).toBe(1)

    // Reducing the same log twice is deterministic.
    expect(play(init, actions)).toEqual(full)
  })

  it('keeps state plain JSON / serialisable (round-trips through JSON)', () => {
    let s = play(createInitialState(players), [THROW(20, 3), THROW(19, 2), MISS])
    expect(JSON.parse(JSON.stringify(s))).toEqual(s)
  })
})
