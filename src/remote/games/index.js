/* Registry of remote-capable games. Each module exports the same shape
   (meta, createInitialState, reducer, selectors, validate). */
import x01 from './x01.js'
import cricket from './cricket.js'
import countup from './countup.js'
import shanghai from './shanghai.js'
import horloge from './horloge.js'
import baseball from './baseball.js'
import bobs27 from './bobs27.js'
import halveit from './halveit.js'
import morpion from './morpion.js'
import killer from './killer.js'

export const GAMES = { x01, cricket, countup, shanghai, horloge, baseball, bobs27, halveit, morpion, killer }

// Games offered in the remote lobby — only those with a finished board.
// Expand as each board lands.
export const PLAYABLE = ['x01']
export const GAME_LIST = PLAYABLE.map((id) => GAMES[id])

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
