/* Stats de la modale de victoire, cote distant.

   Les jeux locaux ecrivent les leurs a la main depuis leur etat interne ; les
   reducteurs distants exposent une forme uniforme, si bien que la coquille
   n'affichait rien. On les derive donc de ce que tous fournissent : le nombre
   de coups joues, et scoreboard().value du gagnant — dont le sens change d'un
   jeu a l'autre, d'ou la legende declaree par chaque moteur. */
import { describe, it, expect } from 'vitest'
import RemoteGame from './RemoteGame.vue'
import { GAMES } from './games/index.js'
import cricket from './games/cricket.js'

const winnerStats = (ctx) => RemoteGame.computed.winnerStats.call(ctx)

// Contexte minimal : winnerStats ne lit que state, game et session.actions.
const ctx = (game, state, actions = []) => ({ game, state, session: { actions } })

const finishedCricket = () => {
  const players = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }]
  const actions = []
  for (let z = 0; z < 7; z++) {
    for (let n = 0; n < 3; n++) actions.push({ type: 'THROW', dart: { player: 'a', zone: z } })
  }
  const state = actions.reduce(cricket.reducer, cricket.createInitialState(players))
  return { state, actions }
}

describe('stats de victoire à distance', () => {
  it('chaque moteur déclare la légende de sa valeur', () => {
    for (const [id, g] of Object.entries(GAMES)) {
      expect(g.meta.scoreLabel, id).toBeTruthy()
    }
  })

  it('rend les coups joués et la valeur du gagnant, légendée par son moteur', () => {
    const { state, actions } = finishedCricket()
    expect(state.finished).toBe(true)
    expect(winnerStats(ctx(cricket, state, actions))).toEqual([
      { value: 21, label: 'Coups joués' },
      { value: 0, label: 'Points encaissés' },
    ])
  })

  it('n’affiche rien tant que la partie n’est pas finie', () => {
    const players = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]
    const state = cricket.createInitialState(players)
    expect(winnerStats(ctx(cricket, state))).toEqual([])
  })

  it('omet la seconde case plutôt que d’afficher un nombre sans légende', () => {
    const { state, actions } = finishedCricket()
    const sansLegende = { ...cricket, meta: { ...cricket.meta, scoreLabel: undefined } }
    expect(winnerStats(ctx(sansLegende, state, actions))).toEqual([
      { value: 21, label: 'Coups joués' },
    ])
  })

  it('ne plante pas quand l’état arrive sans partie chargée', () => {
    expect(winnerStats({ state: null, game: null, session: null })).toEqual([])
  })
})
