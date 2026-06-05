import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Shanghai from '../Shanghai.vue'

describe('Shanghai.vue', () => {
  let wrapper
  const mockPlayers = [
    { id: 1, name: 'Player 1' },
    { id: 2, name: 'Player 2' }
  ]

  beforeEach(() => {
    wrapper = mount(Shanghai, {
      props: {
        players: mockPlayers
      }
    })
  })

  describe('Component initialization', () => {
    it('should render properly with players', () => {
      expect(wrapper.find('.min-h-screen').exists()).toBe(true)
      expect(wrapper.text()).toContain('Player 1')
      expect(wrapper.text()).toContain('Player 2')
    })

    it('should initialize game players correctly', () => {
      expect(wrapper.vm.gamePlayers).toHaveLength(2)
      expect(wrapper.vm.gamePlayers[0].name).toBe('Player 1')
      expect(wrapper.vm.gamePlayers[1].name).toBe('Player 2')
      expect(wrapper.vm.gamePlayers[0].totalScore).toBe(0)
      expect(wrapper.vm.gamePlayers[0].roundScores).toHaveLength(20)
      expect(wrapper.vm.gamePlayers[0].roundHits).toHaveLength(20)
      expect(wrapper.vm.gamePlayers[0].dartsLeft).toBe(3)
    })

    it('should start with round 1', () => {
      expect(wrapper.vm.currentRound).toBe(1)
      expect(wrapper.vm.currentPlayerIndex).toBe(0)
    })

    it('should initialize round hits correctly', () => {
      const roundHits = wrapper.vm.gamePlayers[0].roundHits[0]
      expect(roundHits.single).toBe(false)
      expect(roundHits.double).toBe(false)
      expect(roundHits.triple).toBe(false)
    })
  })

  describe('Score selection', () => {
    it('should select target correctly', () => {
      wrapper.vm.selectTarget()
      expect(wrapper.vm.selectedScore).toBe(wrapper.vm.currentRound)
    })

    it('should select miss correctly', () => {
      wrapper.vm.selectMiss()
      expect(wrapper.vm.selectedScore).toBe(0)
      expect(wrapper.vm.scoreType).toBe('miss')
    })

    it('should set score type to single when selecting zero', () => {
      wrapper.vm.selectScore(0)
      expect(wrapper.vm.selectedScore).toBe(0)
      expect(wrapper.vm.scoreType).toBe('single')
    })
  })

  describe('Game scoring logic', () => {
    beforeEach(() => {
      wrapper.vm.scoreType = 'single'
    })

    it('should add single score correctly', () => {
      wrapper.vm.addScore()
      
      expect(wrapper.vm.currentPlayer.totalScore).toBe(1) // Round 1, single = 1
      expect(wrapper.vm.currentPlayer.roundScores[0]).toBe(1)
      expect(wrapper.vm.currentPlayer.roundHits[0].single).toBe(true)
      expect(wrapper.vm.currentPlayer.dartsLeft).toBe(2)
      expect(wrapper.vm.history).toHaveLength(1)
    })

    it('should add double score correctly', () => {
      wrapper.vm.scoreType = 'double'
      wrapper.vm.addScore()
      
      expect(wrapper.vm.currentPlayer.totalScore).toBe(2) // Round 1, double = 2
      expect(wrapper.vm.currentPlayer.roundScores[0]).toBe(2)
      expect(wrapper.vm.currentPlayer.roundHits[0].double).toBe(true)
      expect(wrapper.vm.history[0].type).toBe('double')
    })

    it('should add triple score correctly', () => {
      wrapper.vm.scoreType = 'triple'
      wrapper.vm.addScore()
      
      expect(wrapper.vm.currentPlayer.totalScore).toBe(3) // Round 1, triple = 3
      expect(wrapper.vm.currentPlayer.roundScores[0]).toBe(3)
      expect(wrapper.vm.currentPlayer.roundHits[0].triple).toBe(true)
      expect(wrapper.vm.history[0].type).toBe('triple')
    })

    it('should handle miss correctly', () => {
      wrapper.vm.scoreType = 'miss'
      const initialScore = wrapper.vm.currentPlayer.totalScore
      wrapper.vm.addScore()
      
      expect(wrapper.vm.currentPlayer.totalScore).toBe(initialScore)
      expect(wrapper.vm.currentPlayer.roundScores[0]).toBe(0)
      expect(wrapper.vm.currentPlayer.roundHits[0].single).toBe(false)
      expect(wrapper.vm.history[0].score).toBe(0)
      expect(wrapper.vm.history[0].type).toBe('miss')
    })

    it('should advance round correctly', () => {
      // Play all darts for both players in round 1
      wrapper.vm.scoreType = 'single'
      
      // Player 1 - 3 darts
      wrapper.vm.addScore()
      wrapper.vm.addScore()
      wrapper.vm.addScore()
      
      // Player 2 - 3 darts
      wrapper.vm.addScore()
      wrapper.vm.addScore()
      wrapper.vm.addScore()
      
      expect(wrapper.vm.currentRound).toBe(2)
      expect(wrapper.vm.currentPlayerIndex).toBe(0)
    })

    it('should check Shanghai victory condition', () => {
      expect(wrapper.vm.checkShanghai(wrapper.vm.gamePlayers[0], 0)).toBe(false)
      
      // Set all three hit types for round 1
      wrapper.vm.gamePlayers[0].roundHits[0].single = true
      wrapper.vm.gamePlayers[0].roundHits[0].double = true
      wrapper.vm.gamePlayers[0].roundHits[0].triple = true
      
      expect(wrapper.vm.checkShanghai(wrapper.vm.gamePlayers[0], 0)).toBe(true)
    })

    it('should declare Shanghai winner', () => {
      const player = wrapper.vm.gamePlayers[0]
      
      // Hit single
      wrapper.vm.scoreType = 'single'
      wrapper.vm.addScore()
      
      // Hit double
      wrapper.vm.scoreType = 'double'
      wrapper.vm.addScore()
      
      // Hit triple (should trigger Shanghai win)
      wrapper.vm.scoreType = 'triple'
      wrapper.vm.addScore()
      
      expect(wrapper.vm.gameFinished).toBe(true)
      expect(wrapper.vm.winner).toBe(player)
      expect(wrapper.vm.isShangaiWin).toBe(true)
      expect(wrapper.vm.shangaiRound).toBe(1)
      expect(player.winner).toBe(true)
    })
  })

  describe('Turn management', () => {
    it('should move to next player after 3 darts', () => {
      wrapper.vm.scoreType = 'single'
      
      // Use all 3 darts for player 1
      wrapper.vm.addScore()
      wrapper.vm.addScore()
      wrapper.vm.addScore()
      
      expect(wrapper.vm.currentPlayerIndex).toBe(1)
      expect(wrapper.vm.currentPlayer.dartsLeft).toBe(3)
    })

    it('should advance round after all players have played', () => {
      wrapper.vm.scoreType = 'single'
      
      // Both players use all 3 darts
      for (let i = 0; i < 6; i++) {
        wrapper.vm.addScore()
      }
      
      expect(wrapper.vm.currentRound).toBe(2)
      expect(wrapper.vm.currentPlayerIndex).toBe(0)
    })

    it('should end game after 20 rounds', () => {
      wrapper.vm.currentRound = 20
      wrapper.vm.scoreType = 'single'
      
      // Complete round 20
      for (let i = 0; i < 6; i++) {
        wrapper.vm.addScore()
      }
      
      expect(wrapper.vm.gameFinished).toBe(true)
      expect(wrapper.vm.winner).toBeTruthy()
    })
  })

  describe('Computed properties', () => {
    it('should calculate canAddScore correctly', () => {
      expect(wrapper.vm.canAddScore).toBe(false)
      
      wrapper.vm.scoreType = 'single'
      expect(wrapper.vm.canAddScore).toBe(true)
      
      wrapper.vm.gameFinished = true
      expect(wrapper.vm.canAddScore).toBe(false)
    })

    it('should return current player correctly', () => {
      expect(wrapper.vm.currentPlayer).toBe(wrapper.vm.gamePlayers[0])
      
      wrapper.vm.currentPlayerIndex = 1
      expect(wrapper.vm.currentPlayer).toBe(wrapper.vm.gamePlayers[1])
    })

    it('should sort players correctly', () => {
      wrapper.vm.gamePlayers[0].totalScore = 50
      wrapper.vm.gamePlayers[1].totalScore = 75
      
      const sorted = wrapper.vm.sortedPlayers
      expect(sorted[0].totalScore).toBe(75)
      expect(sorted[1].totalScore).toBe(50)
    })
  })

  describe('Undo functionality', () => {
    it('should undo last score correctly', () => {
      wrapper.vm.scoreType = 'single'
      const initialScore = wrapper.vm.currentPlayer.totalScore
      
      wrapper.vm.addScore()
      expect(wrapper.vm.currentPlayer.totalScore).toBe(initialScore + 1)
      
      wrapper.vm.undoLastScore()
      expect(wrapper.vm.currentPlayer.totalScore).toBe(initialScore)
      expect(wrapper.vm.currentPlayer.roundScores[0]).toBe(0)
      expect(wrapper.vm.currentPlayer.roundHits[0].single).toBe(false)
      expect(wrapper.vm.history).toHaveLength(0)
    })

    it('should handle undo when no history exists', () => {
      const initialScore = wrapper.vm.currentPlayer.totalScore
      wrapper.vm.undoLastScore()
      expect(wrapper.vm.currentPlayer.totalScore).toBe(initialScore)
    })

    it('should reset game state on undo', () => {
      wrapper.vm.gameFinished = true
      wrapper.vm.winner = wrapper.vm.gamePlayers[0]
      wrapper.vm.isShangaiWin = true
      wrapper.vm.shangaiRound = 5
      
      wrapper.vm.history = [{
        player: wrapper.vm.gamePlayers[0],
        round: 1,
        score: 1,
        type: 'single'
      }]
      
      wrapper.vm.undoLastScore()
      
      expect(wrapper.vm.gameFinished).toBe(false)
      expect(wrapper.vm.winner).toBe(null)
      expect(wrapper.vm.isShangaiWin).toBe(false)
      expect(wrapper.vm.shangaiRound).toBe(null)
      expect(wrapper.vm.gamePlayers[0].winner).toBe(false)
    })
  })

  describe('Game reset', () => {
    it('should reset game correctly', () => {
      wrapper.vm.currentPlayer.totalScore = 50
      wrapper.vm.currentPlayer.roundScores[0] = 10
      wrapper.vm.currentPlayer.roundHits[0].single = true
      wrapper.vm.currentPlayer.dartsLeft = 1
      wrapper.vm.currentPlayerIndex = 1
      wrapper.vm.currentRound = 5
      wrapper.vm.history = [{ player: wrapper.vm.gamePlayers[0], score: 10 }]
      wrapper.vm.gameFinished = true
      
      wrapper.vm.resetGame()
      
      expect(wrapper.vm.gamePlayers[0].totalScore).toBe(0)
      expect(wrapper.vm.gamePlayers[0].roundScores[0]).toBe(0)
      expect(wrapper.vm.gamePlayers[0].roundHits[0].single).toBe(false)
      expect(wrapper.vm.gamePlayers[0].dartsLeft).toBe(3)
      expect(wrapper.vm.gamePlayers[0].winner).toBe(false)
      expect(wrapper.vm.currentPlayerIndex).toBe(0)
      expect(wrapper.vm.currentRound).toBe(1)
      expect(wrapper.vm.history).toHaveLength(0)
      expect(wrapper.vm.gameFinished).toBe(false)
    })
  })

  describe('Victory conditions', () => {
    it('should check win after 20 rounds', () => {
      wrapper.vm.gamePlayers[0].totalScore = 100
      wrapper.vm.gamePlayers[1].totalScore = 80
      
      wrapper.vm.checkWin()
      
      expect(wrapper.vm.gameFinished).toBe(true)
      expect(wrapper.vm.winner).toBe(wrapper.vm.gamePlayers[0])
      expect(wrapper.vm.gamePlayers[0].winner).toBe(true)
    })

    it('should prioritize Shanghai win over regular win', () => {
      const player = wrapper.vm.gamePlayers[0]
      
      // Simulate Shanghai (single + double + triple)
      wrapper.vm.scoreType = 'single'
      wrapper.vm.addScore()
      wrapper.vm.scoreType = 'double'
      wrapper.vm.addScore()
      wrapper.vm.scoreType = 'triple'
      wrapper.vm.addScore()
      
      expect(wrapper.vm.gameFinished).toBe(true)
      expect(wrapper.vm.isShangaiWin).toBe(true)
      expect(wrapper.vm.winner).toBe(player)
    })
  })

  describe('Fullscreen functionality', () => {
    it('should toggle fullscreen state', () => {
      // Mock fullscreen API
      document.documentElement.requestFullscreen = vi.fn()
      document.exitFullscreen = vi.fn()
      
      expect(wrapper.vm.isFullscreen).toBe(false)
      
      wrapper.vm.toggleFullscreen()
      expect(wrapper.vm.isFullscreen).toBe(true)
      
      wrapper.vm.toggleFullscreen()
      expect(wrapper.vm.isFullscreen).toBe(false)
    })
  })

  describe('Modal interactions', () => {
    it('should show reset modal', () => {
      wrapper.vm.confirmReset()
      expect(wrapper.vm.showResetModal).toBe(true)
    })

    it('should show winner modal when game is finished', async () => {
      wrapper.vm.checkWin()
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 600))
      
      expect(wrapper.vm.showWinnerModal).toBe(true)
    })

    it('should show Shanghai win information', () => {
      wrapper.vm.isShangaiWin = true
      wrapper.vm.shangaiRound = 5
      wrapper.vm.showWinnerModal = true
      
      expect(wrapper.vm.isShangaiWin).toBe(true)
      expect(wrapper.vm.shangaiRound).toBe(5)
    })
  })

  describe('Round scoring', () => {
    it('should track scores per round', () => {
      wrapper.vm.currentRound = 5
      wrapper.vm.scoreType = 'double'
      
      wrapper.vm.addScore()
      
      expect(wrapper.vm.currentPlayer.roundScores[4]).toBe(10) // Round 5, double = 10
      expect(wrapper.vm.currentPlayer.totalScore).toBe(10)
    })

    it('should accumulate scores across rounds', () => {
      // Round 1
      wrapper.vm.currentRound = 1
      wrapper.vm.scoreType = 'single'
      wrapper.vm.addScore()
      
      // Round 2
      wrapper.vm.currentRound = 2
      wrapper.vm.scoreType = 'double'
      wrapper.vm.addScore()
      
      expect(wrapper.vm.currentPlayer.roundScores[0]).toBe(1)
      expect(wrapper.vm.currentPlayer.roundScores[1]).toBe(4)
      expect(wrapper.vm.currentPlayer.totalScore).toBe(5)
    })
  })
})