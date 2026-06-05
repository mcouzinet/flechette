import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Morpion from '../Morpion.vue'

describe('Morpion.vue', () => {
  let wrapper
  const mockPlayers = [
    { id: 1, name: 'Player 1' },
    { id: 2, name: 'Player 2' }
  ]

  beforeEach(() => {
    wrapper = mount(Morpion, {
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

    it('should only use first 2 players', () => {
      const threePlayerWrapper = mount(Morpion, {
        props: {
          players: [...mockPlayers, { id: 3, name: 'Player 3' }]
        }
      })
      expect(threePlayerWrapper.vm.gamePlayers).toHaveLength(2)
    })

    it('should initialize board correctly', () => {
      expect(wrapper.vm.board).toHaveLength(9)
      expect(wrapper.vm.board.every(cell => cell.owner === null)).toBe(true)
      expect(wrapper.vm.gridNumbers).toEqual([20, 18, 13, 12, 14, 16, 19, 15, 17])
    })

    it('should initialize scores to zero', () => {
      expect(wrapper.vm.scores).toEqual([0, 0, 0])
    })
  })

  describe('Game logic', () => {
    it('should claim cell for current player', () => {
      wrapper.vm.claimCell(0)
      expect(wrapper.vm.board[0].owner).toBe(0)
      expect(wrapper.vm.currentPlayerIndex).toBe(1)
    })

    it('should alternate players', () => {
      wrapper.vm.claimCell(0) // Player 1
      expect(wrapper.vm.currentPlayerIndex).toBe(1)

      wrapper.vm.claimCell(1) // Player 2
      expect(wrapper.vm.currentPlayerIndex).toBe(0)
    })

    it('should not allow claiming an occupied cell', () => {
      wrapper.vm.claimCell(0)
      const previousOwner = wrapper.vm.board[0].owner

      wrapper.vm.claimCell(0)
      expect(wrapper.vm.board[0].owner).toBe(previousOwner)
    })

    it('should detect horizontal win', () => {
      wrapper.vm.claimCell(0) // P1 - top left
      wrapper.vm.claimCell(3) // P2
      wrapper.vm.claimCell(1) // P1 - top middle
      wrapper.vm.claimCell(4) // P2
      wrapper.vm.claimCell(2) // P1 - top right -> WIN

      expect(wrapper.vm.gameFinished).toBe(true)
      expect(wrapper.vm.winner.id).toBe(1)
      expect(wrapper.vm.scores[0]).toBe(1)
    })

    it('should detect vertical win', () => {
      wrapper.vm.claimCell(0) // P1 - top left
      wrapper.vm.claimCell(1) // P2
      wrapper.vm.claimCell(3) // P1 - middle left
      wrapper.vm.claimCell(4) // P2
      wrapper.vm.claimCell(6) // P1 - bottom left -> WIN

      expect(wrapper.vm.gameFinished).toBe(true)
      expect(wrapper.vm.winner.id).toBe(1)
    })

    it('should detect diagonal win', () => {
      wrapper.vm.claimCell(0) // P1 - top left
      wrapper.vm.claimCell(1) // P2
      wrapper.vm.claimCell(4) // P1 - center
      wrapper.vm.claimCell(2) // P2
      wrapper.vm.claimCell(8) // P1 - bottom right -> WIN

      expect(wrapper.vm.gameFinished).toBe(true)
      expect(wrapper.vm.winner.id).toBe(1)
    })

    it('should detect draw', () => {
      // Fill board with no winner
      // X O X
      // X X O
      // O X O
      wrapper.vm.claimCell(0) // P1 X
      wrapper.vm.claimCell(1) // P2 O
      wrapper.vm.claimCell(2) // P1 X
      wrapper.vm.claimCell(5) // P2 O
      wrapper.vm.claimCell(3) // P1 X
      wrapper.vm.claimCell(6) // P2 O
      wrapper.vm.claimCell(4) // P1 X
      wrapper.vm.claimCell(8) // P2 O
      wrapper.vm.claimCell(7) // P1 X

      expect(wrapper.vm.gameFinished).toBe(true)
      expect(wrapper.vm.isDraw).toBe(true)
      expect(wrapper.vm.scores[2]).toBe(1)
    })

    it('should not allow play after game is finished', () => {
      wrapper.vm.gameFinished = true
      wrapper.vm.claimCell(0)
      expect(wrapper.vm.board[0].owner).toBe(null)
    })

    it('should identify winning cells', () => {
      wrapper.vm.claimCell(0) // P1
      wrapper.vm.claimCell(3) // P2
      wrapper.vm.claimCell(1) // P1
      wrapper.vm.claimCell(4) // P2
      wrapper.vm.claimCell(2) // P1 -> WIN

      expect(wrapper.vm.isWinningCell(0)).toBe(true)
      expect(wrapper.vm.isWinningCell(1)).toBe(true)
      expect(wrapper.vm.isWinningCell(2)).toBe(true)
      expect(wrapper.vm.isWinningCell(3)).toBe(false)
    })
  })

  describe('Undo', () => {
    it('should undo last move', () => {
      wrapper.vm.claimCell(0)
      expect(wrapper.vm.board[0].owner).toBe(0)

      wrapper.vm.undo()
      expect(wrapper.vm.board[0].owner).toBe(null)
      expect(wrapper.vm.currentPlayerIndex).toBe(0)
    })

    it('should undo a winning move', () => {
      wrapper.vm.claimCell(0)
      wrapper.vm.claimCell(3)
      wrapper.vm.claimCell(1)
      wrapper.vm.claimCell(4)
      wrapper.vm.claimCell(2) // WIN

      expect(wrapper.vm.scores[0]).toBe(1)

      wrapper.vm.undo()
      expect(wrapper.vm.gameFinished).toBe(false)
      expect(wrapper.vm.winner).toBe(null)
      expect(wrapper.vm.scores[0]).toBe(0)
    })

    it('should undo a draw', () => {
      wrapper.vm.claimCell(0)
      wrapper.vm.claimCell(1)
      wrapper.vm.claimCell(2)
      wrapper.vm.claimCell(5)
      wrapper.vm.claimCell(3)
      wrapper.vm.claimCell(6)
      wrapper.vm.claimCell(4)
      wrapper.vm.claimCell(8)
      wrapper.vm.claimCell(7) // DRAW

      expect(wrapper.vm.scores[2]).toBe(1)

      wrapper.vm.undo()
      expect(wrapper.vm.isDraw).toBe(false)
      expect(wrapper.vm.scores[2]).toBe(0)
    })

    it('should do nothing when history is empty', () => {
      wrapper.vm.undo()
      expect(wrapper.vm.currentPlayerIndex).toBe(0)
    })
  })

  describe('Game state management', () => {
    it('should reset board but keep scores', () => {
      wrapper.vm.claimCell(0)
      wrapper.vm.claimCell(3)
      wrapper.vm.claimCell(1)
      wrapper.vm.claimCell(4)
      wrapper.vm.claimCell(2) // WIN

      wrapper.vm.resetBoard()

      expect(wrapper.vm.board.every(cell => cell.owner === null)).toBe(true)
      expect(wrapper.vm.history).toHaveLength(0)
      expect(wrapper.vm.gameFinished).toBe(false)
      expect(wrapper.vm.scores[0]).toBe(1) // Score preserved
    })

    it('should reset everything with resetGame', () => {
      wrapper.vm.scores = [3, 2, 1]

      wrapper.vm.resetGame()

      expect(wrapper.vm.scores).toEqual([0, 0, 0])
      expect(wrapper.vm.board.every(cell => cell.owner === null)).toBe(true)
    })

    it('should count player cells correctly', () => {
      wrapper.vm.claimCell(0) // P1
      wrapper.vm.claimCell(1) // P2
      wrapper.vm.claimCell(2) // P1

      expect(wrapper.vm.getPlayerCells(0)).toHaveLength(2)
      expect(wrapper.vm.getPlayerCells(1)).toHaveLength(1)
    })
  })

  describe('Modal interactions', () => {
    it('should show reset modal', () => {
      wrapper.vm.confirmReset()
      expect(wrapper.vm.showResetModal).toBe(true)
    })

    it('should show winner modal on victory', async () => {
      wrapper.vm.claimCell(0)
      wrapper.vm.claimCell(3)
      wrapper.vm.claimCell(1)
      wrapper.vm.claimCell(4)
      wrapper.vm.claimCell(2) // WIN

      await new Promise(resolve => setTimeout(resolve, 600))

      expect(wrapper.vm.showWinnerModal).toBe(true)
    })
  })
})
