// @vitest-environment happy-dom
/* Reprise des victoires du navigateur à la première connexion : chacune part
   une fois, et quitte le stockage local dès qu'elle est enregistrée. */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const created = []
let failAt = -1
vi.mock('./account.js', () => ({ currentUser: () => ({ id: 'u1' }) }))
vi.mock('../pocketbase.js', () => ({
  pb: { collection: () => ({ create: async (r) => { if (created.length === failAt) throw new Error('réseau'); created.push(r) } }) },
}))
import results from './resultsService.js'

const victory = (winner) => ({ date: '2026-10-28T20:00:00.000Z', gameType: 'Cricket', winner, score: 0, participants: [winner, 'B'], totalMoves: 30 })

describe('importLocalVictories', () => {
  beforeEach(() => { created.length = 0; failAt = -1; localStorage.clear() })

  it('envoie chaque victoire locale dans le compte puis vide le stockage', async () => {
    localStorage.setItem('dartVictories', JSON.stringify([victory('A'), victory('C')]))
    expect(await results.importLocalVictories()).toBe(2)
    expect(created.map((r) => [r.vainqueur, r.user, r.extra.importeDe])).toEqual([['A', 'u1', 'navigateur'], ['C', 'u1', 'navigateur']])
    expect(results.getLocalVictories()).toEqual([])
    expect(await results.importLocalVictories()).toBe(0) // rien de renvoyé deux fois
  })

  it('une coupure en route : ce qui est parti ne repart pas, le reste attend', async () => {
    localStorage.setItem('dartVictories', JSON.stringify([victory('A'), victory('C')]))
    failAt = 1
    await expect(results.importLocalVictories()).rejects.toThrow('réseau')
    expect(results.getLocalVictories().map((v) => v.winner)).toEqual(['C'])
    failAt = -1
    await results.importLocalVictories()
    expect(created.map((r) => r.vainqueur)).toEqual(['A', 'C'])
  })
})
