import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Bobs27 from '../Bobs27.vue'

describe('Bobs27.vue', () => {
  let wrapper
  const mockPlayers = [
    { id: 1, name: 'Player 1' },
    { id: 2, name: 'Player 2' }
  ]

  beforeEach(() => {
    wrapper = mount(Bobs27, { props: { players: mockPlayers } })
  })

  describe('Initialization', () => {
    it('should render with players', () => {
      expect(wrapper.text()).toContain('Player 1')
      expect(wrapper.text()).toContain('Player 2')
    })

    it('should initialize players with score 27', () => {
      expect(wrapper.vm.gamePlayers[0].score).toBe(27)
      expect(wrapper.vm.gamePlayers[0].eliminated).toBe(false)
    })

    it('should have 21 targets (doubles 1-20 + bulle)', () => {
      expect(wrapper.vm.targets).toHaveLength(21)
      expect(wrapper.vm.targets[0]).toBe(1)
      expect(wrapper.vm.targets[20]).toBe(25)
    })
  })

  describe('Game logic', () => {
    it('should add double value on hit', () => {
      wrapper.vm.hitDouble() // Double 1 = +2
      expect(wrapper.vm.gamePlayers[0].score).toBe(29)
    })

    it('should subtract double value on miss', () => {
      wrapper.vm.miss() // Miss double 1 = -2
      expect(wrapper.vm.gamePlayers[0].score).toBe(25)
    })

    it('should eliminate player when score drops to 0 or below', () => {
      wrapper.vm.gamePlayers[0].score = 1
      wrapper.vm.miss() // -2, score = -1
      expect(wrapper.vm.gamePlayers[0].eliminated).toBe(true)
    })

    it('should switch player after 3 darts', () => {
      wrapper.vm.hitDouble()
      wrapper.vm.miss()
      wrapper.vm.miss()
      expect(wrapper.vm.currentPlayerIndex).toBe(1)
    })

    it('should not allow eliminated player to play', () => {
      wrapper.vm.gamePlayers[0].eliminated = true
      const score = wrapper.vm.gamePlayers[0].score
      wrapper.vm.hitDouble()
      expect(wrapper.vm.gamePlayers[0].score).toBe(score)
    })
  })

  describe('Undo', () => {
    it('should undo a hit', () => {
      wrapper.vm.hitDouble()
      expect(wrapper.vm.gamePlayers[0].score).toBe(29)

      wrapper.vm.undo()
      expect(wrapper.vm.gamePlayers[0].score).toBe(27)
    })

    it('should undo elimination', () => {
      wrapper.vm.gamePlayers[0].score = 1
      wrapper.vm.miss()
      expect(wrapper.vm.gamePlayers[0].eliminated).toBe(true)

      wrapper.vm.undo()
      expect(wrapper.vm.gamePlayers[0].eliminated).toBe(false)
      expect(wrapper.vm.gamePlayers[0].score).toBe(1)
    })
  })

  describe('Game state', () => {
    it('should reset correctly', () => {
      wrapper.vm.hitDouble()
      wrapper.vm.miss()
      wrapper.vm.resetGame()

      expect(wrapper.vm.gamePlayers[0].score).toBe(27)
      expect(wrapper.vm.currentRound).toBe(0)
      expect(wrapper.vm.history).toHaveLength(0)
    })

    it('should sort players with eliminated last', () => {
      wrapper.vm.gamePlayers[1].eliminated = true
      wrapper.vm.gamePlayers[1].score = -5

      const sorted = wrapper.vm.sortedPlayers
      expect(sorted[0].eliminated).toBe(false)
      expect(sorted[1].eliminated).toBe(true)
    })
  })
})
