import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Horloge from '../Horloge.vue'

describe('Horloge.vue', () => {
  let wrapper
  const mockPlayers = [
    { id: 1, name: 'Player 1' },
    { id: 2, name: 'Player 2' }
  ]

  beforeEach(() => {
    wrapper = mount(Horloge, {
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

    it('should initialize players correctly', () => {
      expect(wrapper.vm.gamePlayers).toHaveLength(2)
      expect(wrapper.vm.gamePlayers[0].currentTarget).toBe(1)
      expect(wrapper.vm.gamePlayers[0].dartsLeft).toBe(3)
      expect(wrapper.vm.gamePlayers[0].winner).toBe(false)
    })

    it('should have correct target numbers', () => {
      expect(wrapper.vm.targetNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25])
    })
  })

  describe('Game logic', () => {
    it('should advance target when hitting correct number', () => {
      wrapper.vm.hitTarget(1)
      expect(wrapper.vm.gamePlayers[0].currentTarget).toBe(2)
    })

    it('should not advance target when hitting wrong number', () => {
      wrapper.vm.hitTarget(5)
      expect(wrapper.vm.gamePlayers[0].currentTarget).toBe(1)
    })

    it('should decrement darts on hit', () => {
      wrapper.vm.hitTarget(1)
      expect(wrapper.vm.gamePlayers[0].dartsLeft).toBe(2)
    })

    it('should decrement darts on miss', () => {
      wrapper.vm.miss()
      expect(wrapper.vm.gamePlayers[0].dartsLeft).toBe(2)
    })

    it('should switch to next player after 3 darts', () => {
      wrapper.vm.miss()
      wrapper.vm.miss()
      wrapper.vm.miss()
      expect(wrapper.vm.currentPlayerIndex).toBe(1)
      expect(wrapper.vm.gamePlayers[0].dartsLeft).toBe(3)
    })

    it('should handle bulle as last target', () => {
      const player = wrapper.vm.gamePlayers[0]
      player.currentTarget = 21 // After 20, need bulle

      wrapper.vm.hitTarget(25)
      expect(player.currentTarget).toBe(22)
      expect(player.winner).toBe(true)
      expect(wrapper.vm.gameFinished).toBe(true)
    })

    it('should detect victory when all targets hit', () => {
      const player = wrapper.vm.gamePlayers[0]

      // Hit 1 through 20
      for (let i = 1; i <= 20; i++) {
        player.currentTarget = i
        wrapper.vm.hitTarget(i)
      }

      // Hit bulle
      wrapper.vm.hitTarget(25)

      expect(player.winner).toBe(true)
      expect(wrapper.vm.gameFinished).toBe(true)
      expect(wrapper.vm.winner).toBe(player)
    })

    it('should not allow actions after game is finished', () => {
      wrapper.vm.gameFinished = true
      const player = wrapper.vm.gamePlayers[0]
      const target = player.currentTarget

      wrapper.vm.hitTarget(target)
      expect(player.currentTarget).toBe(target)
    })
  })

  describe('Undo', () => {
    it('should undo a hit correctly', () => {
      wrapper.vm.hitTarget(1)
      expect(wrapper.vm.gamePlayers[0].currentTarget).toBe(2)

      wrapper.vm.undo()
      expect(wrapper.vm.gamePlayers[0].currentTarget).toBe(1)
      expect(wrapper.vm.history).toHaveLength(0)
    })

    it('should undo a miss correctly', () => {
      wrapper.vm.miss()
      expect(wrapper.vm.gamePlayers[0].dartsLeft).toBe(2)

      wrapper.vm.undo()
      expect(wrapper.vm.gamePlayers[0].dartsLeft).toBe(3)
    })

    it('should do nothing when history is empty', () => {
      wrapper.vm.undo()
      expect(wrapper.vm.gamePlayers[0].currentTarget).toBe(1)
    })
  })

  describe('Game state management', () => {
    it('should reset game correctly', () => {
      wrapper.vm.hitTarget(1)
      wrapper.vm.hitTarget(2)
      wrapper.vm.gamePlayers[0].currentTarget = 5

      wrapper.vm.resetGame()

      expect(wrapper.vm.gamePlayers[0].currentTarget).toBe(1)
      expect(wrapper.vm.gamePlayers[0].dartsLeft).toBe(3)
      expect(wrapper.vm.history).toHaveLength(0)
      expect(wrapper.vm.gameFinished).toBe(false)
    })

    it('should sort players by progress', () => {
      wrapper.vm.gamePlayers[0].currentTarget = 5
      wrapper.vm.gamePlayers[1].currentTarget = 10

      const sorted = wrapper.vm.sortedPlayers
      expect(sorted[0].currentTarget).toBe(10)
      expect(sorted[1].currentTarget).toBe(5)
    })

    it('should count player darts correctly', () => {
      wrapper.vm.hitTarget(1)
      wrapper.vm.miss()

      expect(wrapper.vm.getPlayerDarts(wrapper.vm.gamePlayers[0])).toBe(2)
    })
  })

  describe('Modal interactions', () => {
    it('should show reset modal', () => {
      wrapper.vm.confirmReset()
      expect(wrapper.vm.showResetModal).toBe(true)
    })

    it('should show winner modal when game is won', async () => {
      const player = wrapper.vm.gamePlayers[0]
      player.currentTarget = 21

      wrapper.vm.hitTarget(25)

      await new Promise(resolve => setTimeout(resolve, 600))

      expect(wrapper.vm.showWinnerModal).toBe(true)
    })
  })
})
