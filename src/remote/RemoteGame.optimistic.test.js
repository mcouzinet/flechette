// @vitest-environment happy-dom
/*
 * Locks the optimistic-throw reconciliation state machine in RemoteGame:
 *  - the pending dart overlays on top of the live snapshot,
 *  - it clears when the snapshot confirms our throw (log grows),
 *  - it clears when the log is reset/rewound under us (log shrinks) — P1b,
 *  - it is suppressed when another device acts first (log jumps) — concurrent case.
 * session.js is mocked so nothing touches Firestore.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('./session.js', () => ({
  subscribe: () => () => {},
  throwDart: vi.fn(),
  undoLast: vi.fn(),
  resetGame: vi.fn(),
  leaveSession: vi.fn(),
}))
vi.mock('../services/haptics.js', () => ({ notifySuccess: () => {} }))

import RemoteGame from './RemoteGame.vue'

const THROW = (dart) => ({ type: 'THROW', dart })
const session = (actions = []) => ({
  gameId: 'x01',
  config: { start: 301 },
  players: [{ id: 'p0', name: 'A' }, { id: 'p1', name: 'B' }],
  actions,
  participants: {},
})

describe('RemoteGame — optimistic overlay reconciliation', () => {
  let wrapper
  beforeEach(() => { wrapper = mount(RemoteGame, { props: { code: 'TEST01' } }) })
  afterEach(() => wrapper.unmount())

  it('overlays the pending dart, then drops it when the snapshot confirms (grows)', async () => {
    wrapper.vm.session = session([])
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.state.scores.p0).toBe(301)

    wrapper.vm.pendingFromCount = 0
    wrapper.vm.pendingDart = { n: 20, mult: 3 } // Triple 20 = 60
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.state.scores.p0).toBe(241) // overlay applied instantly
    expect(wrapper.vm.historyEntries.some((e) => e.pending)).toBe(true)

    wrapper.vm.session = session([THROW({ n: 20, mult: 3 })]) // our action lands
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.pendingDart).toBe(null) // watcher cleared it
    expect(wrapper.vm.state.scores.p0).toBe(241) // now from the real action
    expect(wrapper.vm.historyEntries.some((e) => e.pending)).toBe(false)
  })

  it('drops a phantom overlay when the log is reset/rewound under it (P1b)', async () => {
    wrapper.vm.session = session([THROW({ n: 20, mult: 1 })]) // score 281, 1 action
    await wrapper.vm.$nextTick()
    wrapper.vm.pendingFromCount = 1
    wrapper.vm.pendingDart = { n: 19, mult: 1 }
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.state.scores.p0).toBe(281 - 19) // overlay shows

    wrapper.vm.session = session([]) // reset clears the log (0 < pendingFromCount)
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.pendingDart).toBe(null) // no longer stranded
    expect(wrapper.vm.state.scores.p0).toBe(301) // back to start, no phantom dart
  })

  it('suppresses the overlay when another device acts first (log jumps past us)', async () => {
    wrapper.vm.session = session([])
    await wrapper.vm.$nextTick()
    wrapper.vm.pendingFromCount = 0
    wrapper.vm.pendingDart = { n: 20, mult: 3 }
    await wrapper.vm.$nextTick()

    wrapper.vm.session = session([THROW({ n: 5, mult: 1 })]) // someone else's dart
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.pendingDart).toBe(null) // suppressed, not applied onto stale state
    expect(wrapper.vm.state.scores.p0).toBe(301 - 5) // only the other device's action
  })
})
