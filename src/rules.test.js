/* Les regles sont desormais une source unique lue par les ecrans locaux ET par
   le mode a distance. Ce fichier verrouille la couverture : un jeu ajoute sans
   ses regles retombait avant sur le texte generique « Regles du jeu. », en
   silence, et seulement cote distant. */
import { describe, it, expect } from 'vitest'
import { RULES, rulesFor } from './rules.js'
import { GAMES } from './remote/games/index.js'
import App from './App.vue'

const localGames = App.data.call({}).games

describe('regles des jeux', () => {
  it('chaque moteur distant a ses regles', () => {
    for (const id of Object.keys(GAMES)) {
      expect(rulesFor(id).length, id).toBeGreaterThan(0)
    }
  })

  it('chaque jeu de l’accueil retrouve ses regles via son moteur', () => {
    for (const g of localGames) {
      expect(rulesFor(g.remoteId).length, g.id).toBeGreaterThan(0)
    }
  })

  it('aucune ligne vide, aucun libelle manquant', () => {
    for (const [id, lines] of Object.entries(RULES)) {
      for (const line of lines) {
        expect(line.label, id).toBeTruthy()
        if ('text' in line) expect(line.text, id).toBeTruthy()
      }
    }
  })

  it('rulesFor rend un tableau vide sur un jeu inconnu, jamais undefined', () => {
    expect(rulesFor('inexistant')).toEqual([])
    expect(rulesFor(undefined)).toEqual([])
  })
})
