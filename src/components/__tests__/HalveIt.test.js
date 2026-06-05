import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import HalveIt from '../HalveIt.vue'

describe('HalveIt.vue', () => {
  let wrapper
  const mockPlayers = [
    { id: 1, name: 'Player 1' },
    { id: 2, name: 'Player 2' }
  ]

  beforeEach(() => {
    wrapper = mount(HalveIt, { props: { players: mockPlayers } })
  })

  describe('Initialization', () => {
    it('should render with players', () => {
      expect(wrapper.text()).toContain('Player 1')
      expect(wrapper.text()).toContain('Player 2')
    })

    it('should initialize players with score 0', () => {
      expect(wrapper.vm.gamePlayers[0].score).toBe(0)
      expect(wrapper.vm.gamePlayers[0].dartsLeft).toBe(3)
    })

    it('should have 9 rounds', () => {
      expect(wrapper.vm.rounds).toHaveLength(9)
    })
  })

  describe('Game logic', () => {
    it('should add score on hit', () => {
      wrapper.vm.hitTarget(19)
      expect(wrapper.vm.gamePlayers[0].score).toBe(19)
      expect(wrapper.vm.gamePlayers[0].dartsLeft).toBe(2)
    })

    it('should not change score on miss', () => {
      wrapper.vm.miss()
      expect(wrapper.vm.gamePlayers[0].score).toBe(0)
      expect(wrapper.vm.gamePlayers[0].dartsLeft).toBe(2)
    })

    it('should halve score when no hits in a round', () => {
      // Give player some score first
      wrapper.vm.gamePlayers[0].score = 100
      wrapper.vm.miss()
      wrapper.vm.miss()
      wrapper.vm.miss() // End of turn with 0 hits

      expect(wrapper.vm.gamePlayers[0].score).toBe(50) // Halved
      expect(wrapper.vm.gamePlayers[0].roundHalved[0]).toBe(true)
    })

    it('should not halve score of 0', () => {
      wrapper.vm.miss()
      wrapper.vm.miss()
      wrapper.vm.miss()

      expect(wrapper.vm.gamePlayers[0].score).toBe(0)
    })

    it('should switch player after 3 darts', () => {
      wrapper.vm.hitTarget(19)
      wrapper.vm.miss()
      wrapper.vm.miss()
      expect(wrapper.vm.currentPlayerIndex).toBe(1)
    })
  })

  describe('Undo', () => {
    it('should undo a hit', () => {
      wrapper.vm.hitTarget(19)
      expect(wrapper.vm.gamePlayers[0].score).toBe(19)

      wrapper.vm.undo()
      expect(wrapper.vm.gamePlayers[0].score).toBe(0)
    })

    it('should do nothing on empty history', () => {
      wrapper.vm.undo()
      expect(wrapper.vm.gamePlayers[0].score).toBe(0)
    })
  })

  describe('Game state', () => {
    it('should reset correctly', () => {
      wrapper.vm.hitTarget(19)
      wrapper.vm.resetGame()

      expect(wrapper.vm.gamePlayers[0].score).toBe(0)
      expect(wrapper.vm.currentRound).toBe(0)
      expect(wrapper.vm.history).toHaveLength(0)
    })

    it('should sort players by score descending', () => {
      wrapper.vm.gamePlayers[0].score = 30
      wrapper.vm.gamePlayers[1].score = 50

      expect(wrapper.vm.sortedPlayers[0].score).toBe(50)
    })

    it('should show reset modal', () => {
      wrapper.vm.confirmReset()
      expect(wrapper.vm.showResetModal).toBe(true)
    })
  })
})
