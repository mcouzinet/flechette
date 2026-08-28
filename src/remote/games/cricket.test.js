import { describe, it, expect } from 'vitest'
import { createInitialState, reducer, selectors, validate } from './cricket.js'

const players = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }]
// Clic libre : une marque sur la case (joueur, zone). Pas de tour, pas de
// multiplicateur — le Cricket distant suit le modèle du Cricket local.
const MARK = (player, zone) => ({ type: 'THROW', dart: { player, zone } })
const play = (state, actions) => actions.reduce(reducer, state)

// Zone indices: 0=Bull(25), 1=20, 2=19, 3=18, 4=17, 5=16, 6=15
describe('Cricket', () => {
  it('initialises marks and scores to zero, and nobody holds the turn', () => {
    const s = createInitialState(players)
    expect(s.marks).toEqual({ a: [0, 0, 0, 0, 0, 0, 0], b: [0, 0, 0, 0, 0, 0, 0] })
    expect(s.score).toEqual({ a: 0, b: 0 })
    // Free-click: there is no active player, exactly like the local Cricket.
    expect(selectors.activePlayerId(s)).toBe(null)
    expect(s.dartsLeft).toBeUndefined()
    expect(s.currentPlayerIndex).toBeUndefined()
    expect(s.finished).toBe(false)
  })

  it('three marks on 20 close that zone and score nothing', () => {
    const s = play(createInitialState(players), [MARK('a', 1), MARK('a', 1), MARK('a', 1)])
    expect(s.marks.a[1]).toBe(3)
    expect(s.score).toEqual({ a: 0, b: 0 }) // closing scores nothing
    const grid = selectors.marksGrid(s)
    expect(grid.rows[0].marks[1]).toBe(3)
    expect(grid.rows[0].closed[1]).toBe(true)
    expect(grid.rows[1].closed[1]).toBe(false)
  })

  it('any player can be marked at any time — no turn order to respect', () => {
    // Alice, Bob, Bob, Alice: an order no turn structure would allow.
    const s = play(createInitialState(players), [
      MARK('a', 1), MARK('b', 2), MARK('b', 2), MARK('a', 3),
    ])
    expect(s.marks.a[1]).toBe(1)
    expect(s.marks.a[3]).toBe(1)
    expect(s.marks.b[2]).toBe(2)
    expect(s.score).toEqual({ a: 0, b: 0 })
  })

  it('once a player closed 20, marking 20 again piles points onto opponents who have NOT closed it', () => {
    let s = play(createInitialState(players), [MARK('a', 1), MARK('a', 1), MARK('a', 1)])
    expect(s.score).toEqual({ a: 0, b: 0 })
    s = reducer(s, MARK('a', 1))
    expect(s.marks.a[1]).toBe(4)
    expect(s.score.b).toBe(20)
    expect(s.score.a).toBe(0) // points pile onto opponents, never the marker
  })

  it('does NOT pile points onto an opponent who has also closed the zone', () => {
    let s = play(createInitialState(players), [
      MARK('a', 1), MARK('a', 1), MARK('a', 1), // Alice closes 20
      MARK('b', 1), MARK('b', 1), MARK('b', 1), // Bob closes 20
    ])
    expect(s.marks.a[1]).toBe(3)
    expect(s.marks.b[1]).toBe(3)
    expect(s.score).toEqual({ a: 0, b: 0 })
    s = reducer(s, MARK('a', 1))
    expect(s.marks.a[1]).toBe(4)
    expect(s.score).toEqual({ a: 0, b: 0 })
  })

  it('each surplus mark scores exactly once — the mark that closes scores nothing', () => {
    let s = play(createInitialState(players), [MARK('a', 2), MARK('a', 2)])
    expect(s.marks.a[2]).toBe(2)
    expect(s.score.b).toBe(0)
    s = reducer(s, MARK('a', 2)) // 2 -> 3 : closes, scores nothing
    expect(s.score.b).toBe(0)
    s = reducer(s, MARK('a', 2)) // 3 -> 4 : +19
    s = reducer(s, MARK('a', 2)) // 4 -> 5 : +19
    expect(s.marks.a[2]).toBe(5)
    expect(s.score.b).toBe(38)
    expect(s.score.a).toBe(0)
  })

  it('the Bull is worth 25 like every other zone value', () => {
    let s = play(createInitialState(players), [MARK('a', 0), MARK('a', 0), MARK('a', 0)])
    expect(s.score.b).toBe(0)
    s = reducer(s, MARK('a', 0))
    expect(s.score.b).toBe(25)
  })

  it('rejects a malformed dart: unknown player, missing zone, out-of-range zone', () => {
    const init = createInitialState(players)
    expect(validate({ player: 'a', zone: 0 })).toBe(true)
    expect(validate({ player: 'a', zone: 6 })).toBe(true)
    expect(validate({ player: 'a', zone: 7 })).toBe(false)
    expect(validate({ player: 'a', zone: -1 })).toBe(false)
    expect(validate({ player: 'a' })).toBe(false)
    expect(validate({ zone: 1 })).toBe(false)
    expect(validate(null)).toBe(false)
    // The reducer is the last line of defence, not just validate().
    expect(reducer(init, MARK('zoe', 1))).toBe(init) // unknown player
    expect(reducer(init, MARK('a', 99))).toBe(init) // out-of-range zone
    expect(reducer(init, { type: 'THROW', dart: { miss: true } })).toBe(init)
  })

  it('wins when a player has closed ALL zones AND holds the lowest score among all players', () => {
    const actions = []
    for (let zi = 0; zi < 7; zi++) {
      actions.push(MARK('a', zi), MARK('a', zi), MARK('a', zi))
    }
    const s = play(createInitialState(players), actions)
    expect(s.finished).toBe(true)
    expect(s.winnerId).toBe('a')
    expect(selectors.winner(s).id).toBe('a')
    expect(s.marks.a.every((m) => m >= 3)).toBe(true)
    expect(s.score.a).toBe(0)
    expect(selectors.status(s)).toBe('Partie terminée')
  })

  it('does NOT win on all-zones-closed if another player has a strictly lower score', () => {
    const base = createInitialState(players)
    const s = {
      ...base,
      marks: { a: [3, 3, 3, 3, 3, 3, 3], b: [3, 0, 0, 0, 0, 0, 0] },
      score: { a: 25, b: 0 }, // Bob piled 25 onto Alice earlier
    }
    // Re-run resolution with a harmless mark on an already-closed-by-all zone.
    const after = reducer(s, MARK('b', 1))
    expect(after.finished).toBe(false)
    expect(after.winnerId).toBe(null)
  })

  it('ignores further marks once finished', () => {
    const actions = []
    for (let zi = 0; zi < 7; zi++) {
      actions.push(MARK('a', zi), MARK('a', zi), MARK('a', zi))
    }
    const s = play(createInitialState(players), actions)
    expect(s.finished).toBe(true)
    expect(reducer(s, MARK('b', 1))).toBe(s)
  })

  it('is replayable: reducing the action log reproduces state; dropping the last action = undo', () => {
    const init = createInitialState(players)
    // Alice closes 20 (3 marks), marks 20 once more (+20 to Bob), then marks 19.
    const actions = [MARK('a', 1), MARK('a', 1), MARK('a', 1), MARK('a', 1), MARK('a', 2)]
    const full = play(init, actions)
    const undone = play(init, actions.slice(0, -1)) // drop the 19

    expect(full.marks.a[1]).toBe(4)
    expect(full.marks.a[2]).toBe(1)
    expect(full.score.b).toBe(20)

    // Undone: the 19 mark is gone, the 20 marks and the points on Bob remain.
    expect(undone.marks.a[1]).toBe(4)
    expect(undone.marks.a[2]).toBe(0)
    expect(undone.score.b).toBe(20)

    // Undoing the surplus 20 also takes back the points it piled on Bob.
    const beforeSurplus = play(init, actions.slice(0, 3))
    expect(beforeSurplus.score.b).toBe(0)

    // Reducing the same log twice is deterministic.
    expect(play(init, actions)).toEqual(full)
  })

  it('keeps state plain JSON / serialisable (round-trips through JSON)', () => {
    const s = play(createInitialState(players), [MARK('a', 1), MARK('a', 1), MARK('b', 2)])
    expect(JSON.parse(JSON.stringify(s))).toEqual(s)
  })
})
