import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Baseball from '../Baseball.vue'

describe('Baseball.vue', () => {
  let wrapper
  const mockPlayers = [
    { id: 1, name: 'Player 1' },
    { id: 2, name: 'Player 2' }
  ]

  beforeEach(() => {
    wrapper = mount(Baseball, { props: { players: mockPlayers } })
  })

  describe('Initialization', () => {
    it('should render with players', () => {
      expect(wrapper.text()).toContain('Player 1')
      expect(wrapper.text()).toContain('Player 2')
    })

    it('should initialize players with score 0', () => {
      expect(wrapper.vm.gamePlayers[0].totalScore).toBe(0)
      expect(wrapper.vm.gamePlayers[0].dartsLeft).toBe(3)
    })

    it('should start at inning 0', () => {
      expect(wrapper.vm.currentInning).toBe(0)
    })
  })

  describe('Game logic', () => {
    it('should add 1 run for single', () => {
      wrapper.vm.addRuns(1)
      expect(wrapper.vm.gamePlayers[0].totalScore).toBe(1)
    })

    it('should add 2 runs for double', () => {
      wrapper.vm.addRuns(2)
      expect(wrapper.vm.gamePlayers[0].totalScore).toBe(2)
    })

    it('should add 3 runs for triple', () => {
      wrapper.vm.addRuns(3)
      expect(wrapper.vm.gamePlayers[0].totalScore).toBe(3)
    })

    it('should add 0 for miss', () => {
      wrapper.vm.addRuns(0)
      expect(wrapper.vm.gamePlayers[0].totalScore).toBe(0)
    })

    it('should accumulate runs within an inning', () => {
      wrapper.vm.addRuns(1)
      wrapper.vm.addRuns(2)
      expect(wrapper.vm.gamePlayers[0].totalScore).toBe(3)
      expect(wrapper.vm.gamePlayers[0].currentInningRuns).toBe(3)
    })

    it('should record inning score after 3 darts', () => {
      wrapper.vm.addRuns(1)
      wrapper.vm.addRuns(2)
      wrapper.vm.addRuns(3) // End of turn

      expect(wrapper.vm.gamePlayers[0].inningScores[0]).toBe(6)
      expect(wrapper.vm.currentPlayerIndex).toBe(1)
    })

    it('should advance inning after all players play', () => {
      // Player 1
      wrapper.vm.addRuns(1)
      wrapper.vm.addRuns(0)
      wrapper.vm.addRuns(0)
      // Player 2
      wrapper.vm.addRuns(0)
      wrapper.vm.addRuns(0)
      wrapper.vm.addRuns(0)

      expect(wrapper.vm.currentInning).toBe(1)
    })
  })

  describe('Undo', () => {
    it('should undo a run', () => {
      wrapper.vm.addRuns(3)
      expect(wrapper.vm.gamePlayers[0].totalScore).toBe(3)

      wrapper.vm.undo()
      expect(wrapper.vm.gamePlayers[0].totalScore).toBe(0)
    })

    it('should do nothing on empty history', () => {
      wrapper.vm.undo()
      expect(wrapper.vm.gamePlayers[0].totalScore).toBe(0)
    })
  })

  describe('Game state', () => {
    it('should reset correctly', () => {
      wrapper.vm.addRuns(3)
      wrapper.vm.resetGame()

      expect(wrapper.vm.gamePlayers[0].totalScore).toBe(0)
      expect(wrapper.vm.currentInning).toBe(0)
      expect(wrapper.vm.history).toHaveLength(0)
    })

    it('should sort players by total score descending', () => {
      wrapper.vm.gamePlayers[0].totalScore = 10
      wrapper.vm.gamePlayers[1].totalScore = 20

      expect(wrapper.vm.sortedPlayers[0].totalScore).toBe(20)
    })

    it('should show reset modal', () => {
      wrapper.vm.confirmReset()
      expect(wrapper.vm.showResetModal).toBe(true)
    })
  })
})
