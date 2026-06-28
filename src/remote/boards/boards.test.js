// @vitest-environment happy-dom
/*
 * Board ↔ reducer contract: mount every remote board, click every enabled
 * input control, and assert that each emitted `throw` carries a dart the game
 * actually accepts (passes validate + reduces without throwing). This locks the
 * boards' emit shapes to their reducers — a malformed emit (e.g. {run:2} instead
 * of {runs:2}, or a clamped/typo'd payload) fails here.
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { GAMES } from '../games/index.js'
import { isValidDart } from '../dart.js'

import X01Board from './X01Board.vue'
import CricketBoard from './CricketBoard.vue'
import CountUpBoard from './CountUpBoard.vue'
import ShanghaiBoard from './ShanghaiBoard.vue'
import HorlogeBoard from './HorlogeBoard.vue'
import BaseballBoard from './BaseballBoard.vue'
import Bobs27Board from './Bobs27Board.vue'
import HalveItBoard from './HalveItBoard.vue'
import MorpionBoard from './MorpionBoard.vue'
import KillerBoard from './KillerBoard.vue'

const BOARDS = {
  x01: X01Board, cricket: CricketBoard, countup: CountUpBoard, shanghai: ShanghaiBoard,
  horloge: HorlogeBoard, baseball: BaseballBoard, bobs27: Bobs27Board, halveit: HalveItBoard,
  morpion: MorpionBoard, killer: KillerBoard,
}
const PLAYERS = [{ id: 'p0', name: 'Alice' }, { id: 'p1', name: 'Bob' }, { id: 'p2', name: 'Chloé' }]

function freshState(id) {
  const game = GAMES[id]
  const players = id === 'morpion' ? PLAYERS.slice(0, 2) : PLAYERS
  return game.createInitialState(players, id === 'x01' ? { start: 301 } : {})
}

describe('remote boards emit only darts their reducer accepts', () => {
  for (const [id, Board] of Object.entries(BOARDS)) {
    it(`${id}: every input control emits a valid, reducible dart`, async () => {
      const game = GAMES[id]
      const state = freshState(id)
      const wrapper = mount(Board, { props: { state, game } })

      const buttons = wrapper.findAll('button')
      expect(buttons.length, `${id} has no input buttons`).toBeGreaterThan(0)
      for (const btn of buttons) {
        if (!btn.element.disabled) await btn.trigger('click')
      }

      const darts = (wrapper.emitted('throw') || []).map((e) => e[0])
      expect(darts.length, `${id} emitted no throw`).toBeGreaterThan(0)
      for (const dart of darts) {
        const ok = game.validate ? game.validate(dart) : isValidDart(dart)
        expect(ok, `${id} emitted a dart its validate rejects: ${JSON.stringify(dart)}`).toBe(true)
        expect(() => game.reducer(state, { type: 'THROW', dart }), `${id} reducer threw on ${JSON.stringify(dart)}`).not.toThrow()
      }
    })
  }

  // x01/countup are select-then-validate: prove the scoring path (not just miss)
  it('x01: number + multiplier validates to {n,mult}', async () => {
    const game = GAMES.x01
    const state = freshState('x01')
    const wrapper = mount(X01Board, { props: { state, game } })
    // pick "Triple" then number 20 then "Valider"
    await wrapper.findAll('.x01-type-btn').find((b) => b.text() === 'Triple').trigger('click')
    await wrapper.findAll('.x01-num-btn').find((b) => b.text() === '20').trigger('click')
    await wrapper.findAll('button').find((b) => b.text().includes('Valider')).trigger('click')
    const darts = (wrapper.emitted('throw') || []).map((e) => e[0])
    expect(darts).toContainEqual({ n: 20, mult: 3 })
    expect(game.reducer(state, { type: 'THROW', dart: { n: 20, mult: 3 } }).scores.p0).toBe(301 - 60)
  })
})
