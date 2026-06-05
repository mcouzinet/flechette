import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Game301 from '../301.vue'

describe('301.vue', () => {
  let wrapper
  const mockPlayers = [
    { id: 1, name: 'Player 1' },
    { id: 2, name: 'Player 2' }
  ]

  beforeEach(() => {
    wrapper = mount(Game301, {
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
      expect(wrapper.vm.gamePlayers[0].score).toBe(301)
      expect(wrapper.vm.gamePlayers[0].dartsLeft).toBe(3)
      expect(wrapper.vm.gamePlayers[0].winner).toBe(false)
    })

    it('should have correct dart numbers', () => {
      expect(wrapper.vm.dartNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25])
    })

    it('should start with correct game rule', () => {
      expect(wrapper.vm.gameRule).toBe(301)
    })
  })

  describe('Score selection', () => {
    it('should select score correctly', () => {
      wrapper.vm.selectScore(20)
      expect(wrapper.vm.selectedScore).toBe(20)
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
      wrapper.vm.selectedScore = 20
      wrapper.vm.scoreType = 'single'
    })

    it('should add single score correctly', () => {
      const initialScore = wrapper.vm.currentPlayer.score
      wrapper.vm.addScore()
      
      expect(wrapper.vm.currentPlayer.score).toBe(initialScore - 20)
      expect(wrapper.vm.currentPlayer.dartsLeft).toBe(2)
      expect(wrapper.vm.history).toHaveLength(1)
      expect(wrapper.vm.history[0].score).toBe(20)
      expect(wrapper.vm.history[0].type).toBe('single')
    })

    it('should add double score correctly', () => {
      wrapper.vm.scoreType = 'double'
      const initialScore = wrapper.vm.currentPlayer.score
      wrapper.vm.addScore()
      
      expect(wrapper.vm.currentPlayer.score).toBe(initialScore - 40)
      expect(wrapper.vm.history[0].score).toBe(40)
      expect(wrapper.vm.history[0].type).toBe('double')
    })

    it('should add triple score correctly', () => {
      wrapper.vm.scoreType = 'triple'
      const initialScore = wrapper.vm.currentPlayer.score
      wrapper.vm.addScore()
      
      expect(wrapper.vm.currentPlayer.score).toBe(initialScore - 60)
      expect(wrapper.vm.history[0].score).toBe(60)
      expect(wrapper.vm.history[0].type).toBe('triple')
    })

    it('should handle miss correctly', () => {
      wrapper.vm.selectedScore = 0
      wrapper.vm.scoreType = 'miss'
      const initialScore = wrapper.vm.currentPlayer.score
      wrapper.vm.addScore()
      
      expect(wrapper.vm.currentPlayer.score).toBe(initialScore)
      expect(wrapper.vm.history[0].score).toBe(0)
      expect(wrapper.vm.history[0].type).toBe('miss')
    })

    it('should prevent going below zero', () => {
      wrapper.vm.currentPlayer.score = 10
      wrapper.vm.selectedScore = 20
      wrapper.vm.scoreType = 'single'
      
      wrapper.vm.addScore()
      
      // The game resets to original score when going below zero
      expect(wrapper.vm.currentPlayer.score).toBe(10)
      expect(wrapper.vm.showErrorModal).toBe(true)
      expect(wrapper.vm.errorMessage).toContain('Score trop élevé')
    })

    it('should declare winner when reaching exactly zero', () => {
      wrapper.vm.currentPlayer.score = 20
      wrapper.vm.selectedScore = 20
      wrapper.vm.scoreType = 'single'
      
      wrapper.vm.addScore()
      
      expect(wrapper.vm.currentPlayer.score).toBe(0)
      expect(wrapper.vm.currentPlayer.winner).toBe(true)
      expect(wrapper.vm.gameFinished).toBe(true)
      expect(wrapper.vm.winner).toBe(wrapper.vm.currentPlayer)
    })

    it('should move to next player after 3 darts', () => {
      const initialPlayerIndex = wrapper.vm.currentPlayerIndex
      
      // Use 3 darts
      wrapper.vm.addScore()
      wrapper.vm.addScore()
      wrapper.vm.addScore()
      
      expect(wrapper.vm.currentPlayerIndex).toBe((initialPlayerIndex + 1) % wrapper.vm.gamePlayers.length)
      expect(wrapper.vm.currentPlayer.dartsLeft).toBe(3)
    })
  })

  describe('Computed properties', () => {
    it('should calculate canAddScore correctly', () => {
      expect(wrapper.vm.canAddScore).toBe(false)
      
      wrapper.vm.selectedScore = 20
      wrapper.vm.scoreType = 'single'
      expect(wrapper.vm.canAddScore).toBe(true)
      
      wrapper.vm.selectedScore = 25
      wrapper.vm.scoreType = 'triple'
      expect(wrapper.vm.canAddScore).toBe(false) // No triple bull
    })

    it('should return current player correctly', () => {
      expect(wrapper.vm.currentPlayer).toBe(wrapper.vm.gamePlayers[0])
      
      wrapper.vm.currentPlayerIndex = 1
      expect(wrapper.vm.currentPlayer).toBe(wrapper.vm.gamePlayers[1])
    })
  })

  describe('Player average calculation', () => {
    it('should calculate player average correctly', () => {
      const player = wrapper.vm.gamePlayers[0]
      expect(wrapper.vm.getPlayerAverage(player)).toBe(0)
      
      wrapper.vm.history = [
        { playerName: player.name, score: 60 },
        { playerName: player.name, score: 40 },
        { playerName: 'Other Player', score: 20 }
      ]
      
      expect(wrapper.vm.getPlayerAverage(player)).toBe(50)
    })

    it('should return 0 for player with no history', () => {
      const player = wrapper.vm.gamePlayers[0]
      expect(wrapper.vm.getPlayerAverage(player)).toBe(0)
    })
  })

  describe('Undo functionality', () => {
    it('should undo last score correctly', () => {
      wrapper.vm.selectedScore = 20
      wrapper.vm.scoreType = 'single'
      const initialScore = wrapper.vm.currentPlayer.score
      
      wrapper.vm.addScore()
      expect(wrapper.vm.currentPlayer.score).toBe(initialScore - 20)
      
      wrapper.vm.undoLastScore()
      expect(wrapper.vm.currentPlayer.score).toBe(initialScore)
      expect(wrapper.vm.currentPlayer.dartsLeft).toBe(3)
      expect(wrapper.vm.history).toHaveLength(0)
    })

    it('should handle undo when no history exists', () => {
      const initialScore = wrapper.vm.currentPlayer.score
      wrapper.vm.undoLastScore()
      expect(wrapper.vm.currentPlayer.score).toBe(initialScore)
    })

    it('should reset winner status on undo', () => {
      wrapper.vm.currentPlayer.score = 20
      wrapper.vm.selectedScore = 20
      wrapper.vm.scoreType = 'single'
      
      wrapper.vm.addScore()
      expect(wrapper.vm.gameFinished).toBe(true)
      
      wrapper.vm.undoLastScore()
      expect(wrapper.vm.gameFinished).toBe(false)
      expect(wrapper.vm.currentPlayer.winner).toBe(false)
    })
  })

  describe('Game rule changes', () => {
    it('should change game rule and reset scores', () => {
      wrapper.vm.gameRule = 501
      wrapper.vm.resetGame()
      
      expect(wrapper.vm.gamePlayers[0].score).toBe(501)
      expect(wrapper.vm.gamePlayers[1].score).toBe(501)
    })

    it('should trigger confirmation modal on rule change', () => {
      wrapper.vm.gameRule = 501
      wrapper.vm.changeGameRule()
      
      expect(wrapper.vm.showResetModal).toBe(true)
    })

    it('should cancel rule change correctly', () => {
      wrapper.vm.gameRule = 301
      wrapper.vm.previousGameRule = 301
      wrapper.vm.gameRule = 501
      wrapper.vm.cancelReset()
      
      expect(wrapper.vm.gameRule).toBe(301)
      expect(wrapper.vm.showResetModal).toBe(false)
    })
  })

  describe('Game reset', () => {
    it('should reset game correctly', () => {
      wrapper.vm.currentPlayer.score = 200
      wrapper.vm.currentPlayer.dartsLeft = 1
      wrapper.vm.currentPlayerIndex = 1
      wrapper.vm.history = [{ playerName: 'Test', score: 20 }]
      wrapper.vm.gameFinished = true
      
      wrapper.vm.resetGame()
      
      expect(wrapper.vm.gamePlayers[0].score).toBe(wrapper.vm.gameRule)
      expect(wrapper.vm.gamePlayers[0].dartsLeft).toBe(3)
      expect(wrapper.vm.gamePlayers[0].winner).toBe(false)
      expect(wrapper.vm.currentPlayerIndex).toBe(0)
      expect(wrapper.vm.history).toHaveLength(0)
      expect(wrapper.vm.gameFinished).toBe(false)
    })
  })

  describe('Error handling', () => {
    it('should handle invalid score (going below zero)', () => {
      wrapper.vm.currentPlayer.score = 10
      wrapper.vm.selectedScore = 20
      wrapper.vm.scoreType = 'single'
      
      wrapper.vm.addScore()
      
      expect(wrapper.vm.showErrorModal).toBe(true)
      expect(wrapper.vm.errorMessage).toContain('Score trop élevé')
      expect(wrapper.vm.currentPlayer.score).toBe(10)
    })

    it('should auto-close error modal after timeout', async () => {
      wrapper.vm.showErrorModal = true
      
      // Fast-forward time
      vi.useFakeTimers()
      setTimeout(() => {
        wrapper.vm.showErrorModal = false
      }, 5000)
      
      vi.advanceTimersByTime(5000)
      
      expect(wrapper.vm.showErrorModal).toBe(false)
      vi.useRealTimers()
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

  describe('Modal states', () => {
    it('should show winner modal when game is finished', async () => {
      wrapper.vm.currentPlayer.score = 20
      wrapper.vm.selectedScore = 20
      wrapper.vm.scoreType = 'single'
      
      wrapper.vm.addScore()
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 600))
      
      expect(wrapper.vm.showWinnerModal).toBe(true)
    })

    it('should confirm reset through modal', () => {
      wrapper.vm.confirmReset()
      expect(wrapper.vm.showResetModal).toBe(true)
    })
  })
})