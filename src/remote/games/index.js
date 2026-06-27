/* Registry of remote-capable games. Each module exports the same shape
   (meta, createInitialState, reducer, selectors). x01 and cricket are added
   here once their modules exist. */
import countup from './countup.js'
import x01 from './x01.js'
import cricket from './cricket.js'

export const GAMES = { countup, x01, cricket }
export const GAME_LIST = [x01, cricket, countup]

export function getGame(id) {
  return GAMES[id] || null
}

// state = actions.reduce(reducer, initialState) — the single source of truth
export function buildState(session) {
  const g = getGame(session.gameId)
  if (!g) return null
  let state = g.createInitialState(session.players, session.config || {})
  for (const action of session.actions || []) {
    state = g.reducer(state, action)
  }
  return state
}
