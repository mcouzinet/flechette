import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Killer from '../Killer.vue'

describe('Killer.vue', () => {
  let wrapper
  const mockPlayers = [
    { id: 1, name: 'Player 1' },
    { id: 2, name: 'Player 2' },
    { id: 3, name: 'Player 3' }
  ]

  beforeEach(() => {
    wrapper = mount(Killer, {
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
      expect(wrapper.text()).toContain('Player 3')
    })

    it('should initialize in setup phase', () => {
      expect(wrapper.vm.phase).toBe('setup')
      expect(wrapper.vm.setupPlayerIndex).toBe(0)
    })

    it('should initialize players correctly', () => {
      expect(wrapper.vm.gamePlayers).toHaveLength(3)
      expect(wrapper.vm.gamePlayers[0].lives).toBe(3)
      expect(wrapper.vm.gamePlayers[0].isKiller).toBe(false)
      expect(wrapper.vm.gamePlayers[0].eliminated).toBe(false)
      expect(wrapper.vm.gamePlayers[0].number).toBe(null)
    })
  })

  describe('Setup phase', () => {
    it('should assign number to player', () => {
      wrapper.vm.assignNumber(5)
      expect(wrapper.vm.gamePlayers[0].number).toBe(5)
      expect(wrapper.vm.setupPlayerIndex).toBe(1)
    })

    it('should prevent duplicate numbers', () => {
      wrapper.vm.assignNumber(5)
      expect(wrapper.vm.isNumberTaken(5)).toBe(true)
      expect(wrapper.vm.isNumberTaken(6)).toBe(false)
    })

    it('should transition to game phase after all players assigned', () => {
      wrapper.vm.assignNumber(5)
      wrapper.vm.assignNumber(10)
      wrapper.vm.assignNumber(15)

      expect(wrapper.vm.phase).toBe('game')
    })
  })

  describe('Game logic', () => {
    beforeEach(() => {
      // Setup: assign numbers to all players
      wrapper.vm.assignNumber(5)
      wrapper.vm.assignNumber(10)
      wrapper.vm.assignNumber(15)
    })

    it('should make player a killer', () => {
      wrapper.vm.becomeKiller()
      expect(wrapper.vm.gamePlayers[0].isKiller).toBe(true)
      expect(wrapper.vm.history).toHaveLength(1)
    })

    it('should handle miss dart', () => {
      wrapper.vm.missDart()
      expect(wrapper.vm.gamePlayers[0].dartsLeft).toBe(2)
      expect(wrapper.vm.history).toHaveLength(1)
    })

    it('should switch player after 3 darts', () => {
      wrapper.vm.missDart()
      wrapper.vm.missDart()
      wrapper.vm.missDart()
      expect(wrapper.vm.currentPlayerIndex).toBe(1)
    })

    it('should attack player and remove life', () => {
      wrapper.vm.gamePlayers[0].isKiller = true
      const target = wrapper.vm.gamePlayers[1]

      wrapper.vm.attackPlayer(target)
      expect(target.lives).toBe(2)
    })

    it('should eliminate player when lives reach 0', () => {
      wrapper.vm.gamePlayers[0].isKiller = true
      const target = wrapper.vm.gamePlayers[1]
      target.lives = 1

      wrapper.vm.attackPlayer(target)
      expect(target.eliminated).toBe(true)
      expect(target.lives).toBe(0)
    })

    it('should declare winner when only one player remains', () => {
      wrapper.vm.gamePlayers[0].isKiller = true
      wrapper.vm.gamePlayers[1].lives = 1
      wrapper.vm.gamePlayers[1].eliminated = false
      wrapper.vm.gamePlayers[2].eliminated = true
      wrapper.vm.gamePlayers[2].lives = 0

      wrapper.vm.attackPlayer(wrapper.vm.gamePlayers[1])

      expect(wrapper.vm.gameFinished).toBe(true)
      expect(wrapper.vm.winner).toBe(wrapper.vm.gamePlayers[0])
    })

    it('should skip eliminated players', () => {
      wrapper.vm.gamePlayers[1].eliminated = true

      wrapper.vm.missDart()
      wrapper.vm.missDart()
      wrapper.vm.missDart()

      // Should skip player 2 (index 1) and go to player 3 (index 2)
      expect(wrapper.vm.currentPlayerIndex).toBe(2)
    })

    it('should list targetable players correctly', () => {
      wrapper.vm.gamePlayers[1].eliminated = true

      expect(wrapper.vm.targetablePlayers).toHaveLength(1)
      expect(wrapper.vm.targetablePlayers[0].id).toBe(3)
    })
  })

  describe('Undo', () => {
    beforeEach(() => {
      wrapper.vm.assignNumber(5)
      wrapper.vm.assignNumber(10)
      wrapper.vm.assignNumber(15)
    })

    it('should undo becoming killer', () => {
      wrapper.vm.becomeKiller()
      expect(wrapper.vm.gamePlayers[0].isKiller).toBe(true)

      wrapper.vm.undo()
      expect(wrapper.vm.gamePlayers[0].isKiller).toBe(false)
    })

    it('should undo attack and restore life', () => {
      wrapper.vm.gamePlayers[0].isKiller = true
      const target = wrapper.vm.gamePlayers[1]

      wrapper.vm.attackPlayer(target)
      expect(target.lives).toBe(2)

      wrapper.vm.undo()
      expect(target.lives).toBe(3)
    })

    it('should undo elimination', () => {
      wrapper.vm.gamePlayers[0].isKiller = true
      const target = wrapper.vm.gamePlayers[1]
      target.lives = 1

      wrapper.vm.attackPlayer(target)
      expect(target.eliminated).toBe(true)

      wrapper.vm.undo()
      expect(target.eliminated).toBe(false)
      expect(target.lives).toBe(1)
    })
  })

  describe('Game state management', () => {
    it('should reset game correctly', () => {
      wrapper.vm.assignNumber(5)
      wrapper.vm.assignNumber(10)
      wrapper.vm.assignNumber(15)

      wrapper.vm.resetGame()

      expect(wrapper.vm.phase).toBe('setup')
      expect(wrapper.vm.setupPlayerIndex).toBe(0)
      expect(wrapper.vm.gamePlayers[0].number).toBe(null)
      expect(wrapper.vm.gamePlayers[0].lives).toBe(3)
      expect(wrapper.vm.history).toHaveLength(0)
    })

    it('should rank players correctly', () => {
      wrapper.vm.assignNumber(5)
      wrapper.vm.assignNumber(10)
      wrapper.vm.assignNumber(15)

      wrapper.vm.gamePlayers[1].eliminated = true
      wrapper.vm.gamePlayers[1].lives = 0

      const ranked = wrapper.vm.rankedPlayers
      expect(ranked[ranked.length - 1].eliminated).toBe(true)
    })

    it('should count kills correctly', () => {
      wrapper.vm.assignNumber(5)
      wrapper.vm.assignNumber(10)
      wrapper.vm.assignNumber(15)

      wrapper.vm.gamePlayers[0].isKiller = true
      wrapper.vm.gamePlayers[1].lives = 1
      wrapper.vm.attackPlayer(wrapper.vm.gamePlayers[1])

      expect(wrapper.vm.getPlayerKills(wrapper.vm.gamePlayers[0])).toBe(1)
    })
  })
})
