// @vitest-environment happy-dom
/* Contrat entre l'accueil et le moteur distant.

   L'accueil ne connait pas les jeux distants : chaque entree declare le
   `remoteId` de son moteur. Une faute de frappe ne casserait rien a la
   compilation — elle sortirait en « Jeu inconnu » au moment ou l'utilisateur
   lance sa partie. C'est ce que ce fichier verrouille. */
import { describe, it, expect } from 'vitest'
import App from './App.vue'
import { GAMES } from './remote/games/index.js'

const data = App.data.call({})
const games = data.games

describe('accueil ↔ moteur distant', () => {
  it('chaque jeu de l’accueil pointe vers un moteur distant qui existe', () => {
    for (const g of games) {
      if (!g.remoteId) continue // jeu pas encore portable : la case se desactive
      expect(GAMES[g.remoteId], `${g.id} → ${g.remoteId}`).toBeTruthy()
    }
  })

  it('les dix jeux de l’accueil sont jouables à distance', () => {
    expect(games).toHaveLength(10)
    expect(games.filter((g) => g.remoteId)).toHaveLength(10)
  })

  it('le 301 local se lance sur le moteur x01, qui prend un score de départ', () => {
    const g = games.find((x) => x.id === '301')
    expect(g.remoteId).toBe('x01')
    // Les pastilles de l'accueil doivent rester des valeurs que x01 accepte.
    const option = GAMES.x01.meta.options.find((o) => o.key === 'start')
    for (const s of data.startScores) expect(option.values).toContain(s)
    expect(data.remoteStart).toBe(option.default)
  })

  it('un jeu de l’accueil ne se lance jamais sur un moteur d’un autre jeu', () => {
    const ids = games.map((g) => g.remoteId)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('code de partie dans l’URL', () => {
  const read = () => App.methods.readUrlCode.call({})

  const withSearch = (search, fn) => {
    const url = new URL(window.location.href)
    url.search = search
    window.history.replaceState({}, '', url.pathname + url.search)
    try { return fn() } finally { window.history.replaceState({}, '', url.pathname) }
  }

  it('accepte un code de six caractères, quelle que soit la casse', () => {
    expect(withSearch('?partie=npxuzd', () => read())).toBe('NPXUZD')
    expect(withSearch('?partie=ABC123', () => read())).toBe('ABC123')
  })

  it('ignore tout ce qui n’est pas un code : trop court, trop long, symboles, vide', () => {
    for (const bad of ['?partie=ABC', '?partie=ABCDEFG', '?partie=AB-DEF', '?partie=', '']) {
      expect(withSearch(bad, () => read()), bad).toBe('')
    }
  })
})
