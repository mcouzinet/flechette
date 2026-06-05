import { describe, it, expect, vi, beforeEach } from 'vitest'
import firebaseService from '../firebaseService.js'

describe('FirebaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('prepareGameData', () => {
    it('should prepare Cricket game data correctly', () => {
      const winner = { id: 1, name: 'Player 1', score: 10 }
      const participants = [
        { id: 1, name: 'Player 1', score: 10 },
        { id: 2, name: 'Player 2', score: 30 }
      ]
      const history = [{ action: 'hit' }, { action: 'hit' }]

      const result = firebaseService.prepareGameData(winner, participants, history, 'Cricket')

      expect(result.winner.name).toBe('Player 1')
      expect(result.winner.finalScore).toBe(10)
      expect(result.totalMoves).toBe(2)
      expect(result.gameType).toBe('Cricket')
      expect(result.participants[0].score).toBe(10)
    })

    it('should prepare Shanghai game data correctly', () => {
      const winner = { id: 1, name: 'Player 1', totalScore: 150 }
      const participants = [
        { id: 1, name: 'Player 1', totalScore: 150 },
        { id: 2, name: 'Player 2', totalScore: 100 }
      ]

      const result = firebaseService.prepareGameData(winner, participants, [], 'Shanghai')

      expect(result.winner.finalScore).toBe(150)
      expect(result.participants[0].totalScore).toBe(150)
    })

    it('should prepare 301 game data correctly', () => {
      const winner = { id: 1, name: 'Player 1', score: 0 }
      const participants = [
        { id: 1, name: 'Player 1', score: 0 },
        { id: 2, name: 'Player 2', score: 50 }
      ]

      const result = firebaseService.prepareGameData(winner, participants, [], '301')

      expect(result.winner.finalScore).toBe(301)
    })

    it('should prepare Horloge game data correctly', () => {
      const winner = { id: 1, name: 'Player 1', currentTarget: 22 }
      const participants = [
        { id: 1, name: 'Player 1', currentTarget: 22 },
        { id: 2, name: 'Player 2', currentTarget: 10 }
      ]

      const result = firebaseService.prepareGameData(winner, participants, [], 'Horloge')

      expect(result.winner.finalScore).toBe(21)
      expect(result.participants[0].currentTarget).toBe(22)
    })

    it('should prepare Killer game data correctly', () => {
      const winner = { id: 1, name: 'Player 1', lives: 2, eliminated: false }
      const participants = [
        { id: 1, name: 'Player 1', lives: 2, eliminated: false },
        { id: 2, name: 'Player 2', lives: 0, eliminated: true }
      ]

      const result = firebaseService.prepareGameData(winner, participants, [], 'Killer')

      expect(result.winner.finalScore).toBe(2)
    })

    it('should prepare Morpion game data correctly', () => {
      const winner = { id: 1, name: 'Player 1' }
      const participants = [
        { id: 1, name: 'Player 1' },
        { id: 2, name: 'Player 2' }
      ]

      const result = firebaseService.prepareGameData(winner, participants, [], 'Morpion')

      expect(result.winner.finalScore).toBe(1)
    })

    it('should sort Cricket participants by score ascending', () => {
      const winner = { id: 1, name: 'Player 1', score: 10 }
      const participants = [
        { id: 2, name: 'Player 2', score: 30 },
        { id: 1, name: 'Player 1', score: 10 }
      ]

      const result = firebaseService.prepareGameData(winner, participants, [], 'Cricket')

      expect(result.participants[0].score).toBe(10)
      expect(result.participants[1].score).toBe(30)
    })

    it('should sort Shanghai participants by score descending', () => {
      const winner = { id: 1, name: 'Player 1', totalScore: 150 }
      const participants = [
        { id: 2, name: 'Player 2', totalScore: 100 },
        { id: 1, name: 'Player 1', totalScore: 150 }
      ]

      const result = firebaseService.prepareGameData(winner, participants, [], 'Shanghai')

      expect(result.participants[0].totalScore).toBe(150)
      expect(result.participants[1].totalScore).toBe(100)
    })
  })

  describe('saveToLocalStorage', () => {
    it('should save game data to localStorage', () => {
      const gameData = {
        gameType: 'Cricket',
        winner: { name: 'Player 1', finalScore: 10 },
        participants: [{ name: 'Player 1' }],
        totalMoves: 5
      }

      window.localStorage.getItem.mockReturnValue('[]')
      firebaseService.saveToLocalStorage(gameData)

      expect(window.localStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('getLocalVictories', () => {
    it('should return empty array when no data', () => {
      window.localStorage.getItem.mockReturnValue(null)
      expect(firebaseService.getLocalVictories()).toEqual([])
    })

    it('should return stored victories', () => {
      const victories = [{ winner: 'Player 1' }]
      window.localStorage.getItem.mockReturnValue(JSON.stringify(victories))
      expect(firebaseService.getLocalVictories()).toEqual(victories)
    })
  })
})
