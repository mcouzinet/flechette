import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Cricket from '../Cricket.vue'

describe('Cricket.vue', () => {
  let wrapper
  const mockPlayers = [
    { id: 1, name: 'Player 1' },
    { id: 2, name: 'Player 2' }
  ]

  beforeEach(() => {
    wrapper = mount(Cricket, {
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

    it('should initialize participants correctly', () => {
      expect(wrapper.vm.participants).toHaveLength(2)
      expect(wrapper.vm.participants[0].name).toBe('Player 1')
      expect(wrapper.vm.participants[1].name).toBe('Player 2')
      expect(wrapper.vm.participants[0].state).toEqual([0, 0, 0, 0, 0, 0, 0])
      expect(wrapper.vm.participants[0].score).toBe(0)
    })

    it('should have correct zones configuration', () => {
      expect(wrapper.vm.zones).toEqual(['Bulle', '20', '19', '18', '17', '16', '15'])
      expect(wrapper.vm.indexScore).toEqual([25, 20, 19, 18, 17, 16, 15])
    })
  })

  describe('Game logic', () => {
    it('should score correctly for a player', () => {
      const participant = wrapper.vm.participants[0]
      wrapper.vm.score(participant.id, 1) // Hit zone 20
      
      expect(participant.state[1]).toBe(1)
      expect(participant.score).toBe(0)
      expect(wrapper.vm.history).toHaveLength(1)
    })

    it('should add points to opponents when zone is closed', () => {
      const participant1 = wrapper.vm.participants[0]
      const participant2 = wrapper.vm.participants[1]
      
      // Close zone 20 for participant1 (3 hits)
      wrapper.vm.score(participant1.id, 1)
      wrapper.vm.score(participant1.id, 1)
      wrapper.vm.score(participant1.id, 1)
      
      expect(participant1.state[1]).toBe(3)
      expect(participant1.score).toBe(0)
      expect(participant2.score).toBe(0)
      
      // Hit zone 20 again (should add points to participant2)
      wrapper.vm.score(participant1.id, 1)
      
      expect(participant1.state[1]).toBe(4)
      expect(participant1.score).toBe(0)
      expect(participant2.score).toBe(20)
    })

    it('should check zone closure correctly', () => {
      const participant1 = wrapper.vm.participants[0]
      const participant2 = wrapper.vm.participants[1]
      
      // Close zone 20 for both participants
      wrapper.vm.score(participant1.id, 1)
      wrapper.vm.score(participant1.id, 1)
      wrapper.vm.score(participant1.id, 1)
      
      expect(wrapper.vm.isZoneClosed(1)).toBe(false)
      
      wrapper.vm.score(participant2.id, 1)
      wrapper.vm.score(participant2.id, 1)
      wrapper.vm.score(participant2.id, 1)
      
      expect(wrapper.vm.isZoneClosed(1)).toBe(true)
    })

    it('should determine winner correctly', () => {
      const participant1 = wrapper.vm.participants[0]
      
      // Close all zones for participant1
      for (let i = 0; i < 7; i++) {
        participant1.state[i] = 3
      }
      
      expect(wrapper.vm.isWinner(participant1)).toBe(true)
      
      // Add score to participant1
      participant1.score = 50
      
      expect(wrapper.vm.isWinner(participant1)).toBe(false)
    })

    it('should handle undo correctly', () => {
      const participant = wrapper.vm.participants[0]
      
      wrapper.vm.score(participant.id, 1)
      expect(participant.state[1]).toBe(1)
      expect(wrapper.vm.history).toHaveLength(1)
      
      wrapper.vm.cancel()
      expect(participant.state[1]).toBe(0)
      expect(wrapper.vm.history).toHaveLength(0)
    })

    it('should handle undo with points correctly', () => {
      const participant1 = wrapper.vm.participants[0]
      const participant2 = wrapper.vm.participants[1]
      
      // Close zone and add points to opponent
      wrapper.vm.score(participant1.id, 1) // 1 hit
      wrapper.vm.score(participant1.id, 1) // 2 hits
      wrapper.vm.score(participant1.id, 1) // 3 hits (zone closed)
      wrapper.vm.score(participant1.id, 1) // 4 hits (adds 20 points to participant2)
      
      expect(participant2.score).toBe(20)
      
      wrapper.vm.cancel()
      expect(participant1.state[1]).toBe(3)
      expect(participant2.score).toBe(0)
    })
  })

  describe('Game state management', () => {
    it('should reset game correctly', () => {
      const participant = wrapper.vm.participants[0]
      
      wrapper.vm.score(participant.id, 1)
      participant.score = 50
      wrapper.vm.gameFinished = true
      
      wrapper.vm.resetGame()
      
      expect(participant.state).toEqual([0, 0, 0, 0, 0, 0, 0])
      expect(participant.score).toBe(0)
      expect(wrapper.vm.history).toHaveLength(0)
      expect(wrapper.vm.gameFinished).toBe(false)
    })

    it('should order participants correctly', () => {
      wrapper.vm.participants[0].score = 50
      wrapper.vm.participants[1].score = 30
      
      const ordered = wrapper.vm.participantOrdered
      expect(ordered[0].score).toBe(30)
      expect(ordered[1].score).toBe(50)
    })

    it('should check victory condition correctly', () => {
      const participant1 = wrapper.vm.participants[0]
      const participant2 = wrapper.vm.participants[1]
      
      // Close all zones for participant1
      for (let i = 0; i < 7; i++) {
        participant1.state[i] = 3
      }
      
      // participant1 has lower score
      participant1.score = 10
      participant2.score = 20
      
      wrapper.vm.checkWin()
      
      expect(wrapper.vm.gameFinished).toBe(true)
      expect(wrapper.vm.winner).toBe(participant1)
    })

    it('should not declare winner if someone has better score', () => {
      const participant1 = wrapper.vm.participants[0]
      const participant2 = wrapper.vm.participants[1]
      
      // Close all zones for participant1
      for (let i = 0; i < 7; i++) {
        participant1.state[i] = 3
      }
      
      // participant2 has better score
      participant1.score = 50
      participant2.score = 10
      
      wrapper.vm.checkWin()
      
      expect(wrapper.vm.gameFinished).toBe(false)
      expect(wrapper.vm.winner).toBe(null)
    })
  })

  describe('UI styling methods', () => {
    it('should return correct zone classes', () => {
      expect(wrapper.vm.getZoneClass(0)).toBe('bg-gray-700 border-gray-600 text-gray-400')
      expect(wrapper.vm.getZoneClass(1)).toBe('bg-[#2cadfe]/20 border-[#2cadfe]/50 text-[#2cadfe]')
      expect(wrapper.vm.getZoneClass(2)).toBe('bg-[#2cadfe]/40 border-[#2cadfe] text-white')
      expect(wrapper.vm.getZoneClass(3)).toBe('bg-green-500 border-green-900 text-white')
    })

    it('should return correct progress colors', () => {
      expect(wrapper.vm.getZoneProgressColor(0)).toBe('text-red-500')
      expect(wrapper.vm.getZoneProgressColor(3)).toBe('text-orange-400')
      expect(wrapper.vm.getZoneProgressColor(7)).toBe('text-green-500')
    })
  })

  describe('Modal interactions', () => {
    it('should show reset modal', () => {
      wrapper.vm.confirmReset()
      expect(wrapper.vm.showResetModal).toBe(true)
    })

    it('should show winner modal when game is won', async () => {
      const participant = wrapper.vm.participants[0]
      
      for (let i = 0; i < 7; i++) {
        participant.state[i] = 3
      }
      
      wrapper.vm.checkWin()
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(wrapper.vm.showWinnerModal).toBe(true)
    })
  })

  describe('Keyboard interactions', () => {
    it('should handle backspace for undo', () => {
      const participant = wrapper.vm.participants[0]
      
      wrapper.vm.score(participant.id, 1)
      expect(wrapper.vm.history).toHaveLength(1)
      
      // Simulate backspace key
      const event = new KeyboardEvent('keydown', { key: 'Backspace' })
      document.dispatchEvent(event)
      
      expect(wrapper.vm.history).toHaveLength(0)
    })
  })
})