/* Pure test of the shared-log sync model that session.js relies on:
   every device derives state = actions.reduce(reducer, initial), so two
   devices with the same log compute identical state; a throw is an append;
   an undo is dropping the last action. (No Firebase here — that's the thin
   transactional wrapper; this proves the semantics both clients share.) */
import { describe, it, expect } from 'vitest'
import { buildState } from './games/index.js'
import { isValidDart } from './dart.js'

const session = (over = {}) => ({
  gameId: 'x01',
  config: { start: 301 },
  players: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
  actions: [],
  ...over,
})
const THROW = (n, mult = 1) => ({ type: 'THROW', dart: { n, mult } })

describe('session shared-log model', () => {
  it('two devices with the same log derive identical state', () => {
    const actions = [THROW(20, 3), THROW(20, 3), THROW(20)]
    const s1 = buildState(session({ actions }))
    const s2 = buildState(session({ actions: [...actions] }))
    expect(s1).toEqual(s2)
    expect(s1.scores.a).toBe(301 - 140) // 60 + 60 + 20
    expect(s1.currentPlayerIndex).toBe(1) // turn passed to B after 3 darts
  })

  it('appending a throw advances the derived state', () => {
    const before = buildState(session({ actions: [THROW(20)] }))
    const after = buildState(session({ actions: [THROW(20), THROW(20)] }))
    expect(before.scores.a).toBe(281)
    expect(after.scores.a).toBe(261)
  })

  it('undo is just dropping the last action', () => {
    const actions = [THROW(20), THROW(19), THROW(18)]
    const full = buildState(session({ actions }))
    const undone = buildState(session({ actions: actions.slice(0, -1) }))
    expect(full.scores.a).toBe(301 - 57)
    expect(undone.scores.a).toBe(301 - 39)
  })

  it('builds state for every registered game id', () => {
    expect(buildState(session({ gameId: 'countup', config: {} })).game).toBe('countup')
    expect(buildState(session({ gameId: 'cricket', config: {} }))).toBeTruthy()
    expect(buildState(session({ gameId: 'x01' })).players).toHaveLength(2)
  })

  it('returns null for an unknown game id', () => {
    expect(buildState(session({ gameId: 'nope' }))).toBeNull()
  })
})

describe('dart validation (trust boundary)', () => {
  it('accepts valid darts and a miss', () => {
    expect(isValidDart({ n: 20, mult: 3 })).toBe(true)
    expect(isValidDart({ n: 25, mult: 2 })).toBe(true) // double bull
    expect(isValidDart({ miss: true })).toBe(true)
  })
  it('rejects malformed or hostile darts', () => {
    expect(isValidDart({ n: 999, mult: 99 })).toBe(false)
    expect(isValidDart({ n: 25, mult: 3 })).toBe(false) // triple bull not allowed
    expect(isValidDart({ n: 0, mult: 1 })).toBe(false)
    expect(isValidDart({ n: 21, mult: 1 })).toBe(false)
    expect(isValidDart(null)).toBe(false)
    expect(isValidDart(5)).toBe(false)
    expect(isValidDart({})).toBe(false)
  })
})
