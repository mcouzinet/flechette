import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App.vue', () => {
  let wrapper

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    
    // Mock alert
    global.alert = vi.fn()
    
    wrapper = mount(App, {
      global: {
        stubs: {
          Cricket: { template: '<div>Cricket Component</div>' },
          Game301: { template: '<div>Game301 Component</div>' },
          Shanghai: { template: '<div>Shanghai Component</div>' }
        }
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component initialization', () => {
    it('should render properly', () => {
      expect(wrapper.find('main').exists()).toBe(true)
      expect(wrapper.text()).toContain('FLÉCHETTES')
      expect(wrapper.text()).toContain('Choisissez votre jeu favori')
    })

    it('should initialize with empty players list', () => {
      expect(wrapper.vm.players).toEqual([])
      expect(wrapper.vm.nextPlayerId).toBe(1)
      expect(wrapper.vm.currentComponent).toBe(null)
    })

    it('should have correct games configuration', () => {
      expect(wrapper.vm.games).toHaveLength(6)
      expect(wrapper.vm.games[0].name).toBe('Cricket')
      expect(wrapper.vm.games[1].name).toBe('301')
      expect(wrapper.vm.games[2].name).toBe('Shanghai')
    })
  })

  describe('Player management', () => {
    it('should add a player correctly', () => {
      wrapper.vm.newPlayerName = 'Test Player'
      wrapper.vm.addPlayer()

      expect(wrapper.vm.players).toHaveLength(1)
      expect(wrapper.vm.players[0].name).toBe('Test Player')
      expect(wrapper.vm.players[0].id).toBe(1)
      expect(wrapper.vm.newPlayerName).toBe('')
      expect(wrapper.vm.nextPlayerId).toBe(2)
    })

    it('should not add empty player name', () => {
      wrapper.vm.newPlayerName = '   '
      wrapper.vm.addPlayer()

      expect(wrapper.vm.players).toHaveLength(0)
    })

    it('should trim player name when adding', () => {
      wrapper.vm.newPlayerName = '  Test Player  '
      wrapper.vm.addPlayer()

      expect(wrapper.vm.players[0].name).toBe('Test Player')
    })

    it('should remove a player correctly', () => {
      wrapper.vm.players = [
        { id: 1, name: 'Player 1' },
        { id: 2, name: 'Player 2' }
      ]

      wrapper.vm.removePlayer(1)

      expect(wrapper.vm.players).toHaveLength(1)
      expect(wrapper.vm.players[0].name).toBe('Player 2')
    })

    it('should clear all players', () => {
      wrapper.vm.players = [
        { id: 1, name: 'Player 1' },
        { id: 2, name: 'Player 2' }
      ]

      wrapper.vm.clearPlayers()

      expect(wrapper.vm.players).toHaveLength(0)
    })

    it('should increment player IDs correctly', () => {
      wrapper.vm.addPlayer = vi.fn().mockImplementation(() => {
        wrapper.vm.players.push({
          id: wrapper.vm.nextPlayerId++,
          name: 'Test'
        })
      })

      wrapper.vm.addPlayer()
      wrapper.vm.addPlayer()

      expect(wrapper.vm.nextPlayerId).toBe(3)
      expect(wrapper.vm.players[0].id).toBe(1)
      expect(wrapper.vm.players[1].id).toBe(2)
    })
  })

  describe('Local storage integration', () => {
    it('should save players to localStorage when adding', () => {
      const spy = vi.spyOn(wrapper.vm, 'savePlayersToStorage')
      
      wrapper.vm.newPlayerName = 'Test Player'
      wrapper.vm.addPlayer()

      expect(spy).toHaveBeenCalled()
      expect(localStorage.getItem('flechette-players')).toBeTruthy()
    })

    it('should save players to localStorage when removing', () => {
      wrapper.vm.players = [{ id: 1, name: 'Test' }]
      const spy = vi.spyOn(wrapper.vm, 'savePlayersToStorage')
      
      wrapper.vm.removePlayer(1)

      expect(spy).toHaveBeenCalled()
    })

    it('should save players to localStorage when clearing', () => {
      wrapper.vm.players = [{ id: 1, name: 'Test' }]
      const spy = vi.spyOn(wrapper.vm, 'savePlayersToStorage')
      
      wrapper.vm.clearPlayers()

      expect(spy).toHaveBeenCalled()
    })

    it('should load players from localStorage on mount', () => {
      const testPlayers = [
        { id: 1, name: 'Stored Player 1' },
        { id: 3, name: 'Stored Player 2' }
      ]
      localStorage.setItem('flechette-players', JSON.stringify(testPlayers))

      // Remount component to trigger mounted lifecycle
      wrapper = mount(App, {
        global: {
          stubs: {
            Cricket: { template: '<div>Cricket Component</div>' },
            Game301: { template: '<div>Game301 Component</div>' },
            Shanghai: { template: '<div>Shanghai Component</div>' }
          }
        }
      })

      expect(wrapper.vm.players).toEqual(testPlayers)
      expect(wrapper.vm.nextPlayerId).toBe(4) // Max ID + 1
    })

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('flechette-players', 'invalid json')
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      wrapper = mount(App, {
        global: {
          stubs: {
            Cricket: { template: '<div>Cricket Component</div>' },
            Game301: { template: '<div>Game301 Component</div>' },
            Shanghai: { template: '<div>Shanghai Component</div>' }
          }
        }
      })

      expect(wrapper.vm.players).toEqual([])
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Game selection', () => {
    it('should start game when enough players', () => {
      wrapper.vm.players = [
        { id: 1, name: 'Player 1' },
        { id: 2, name: 'Player 2' }
      ]
      
      const cricketGame = wrapper.vm.games.find(g => g.id === 'cricket')
      wrapper.vm.startGameDirectly(cricketGame)

      expect(wrapper.vm.currentComponent).toBe('Cricket')
    })

    it('should not start game without enough players', () => {
      wrapper.vm.players = [{ id: 1, name: 'Player 1' }]
      
      const cricketGame = wrapper.vm.games.find(g => g.id === 'cricket')
      wrapper.vm.startGameDirectly(cricketGame)

      expect(wrapper.vm.currentComponent).toBe(null)
    })

    it('should show alert when trying to start game without enough players', () => {
      wrapper.vm.players = [{ id: 1, name: 'Player 1' }]
      
      const cricketGame = wrapper.vm.games.find(g => g.id === 'cricket')
      wrapper.vm.startGameDirectly(cricketGame)

      expect(global.alert).toHaveBeenCalledWith('Ajoutez au moins 2 joueurs pour commencer')
    })

    it('should not start unavailable games', () => {
      wrapper.vm.players = [
        { id: 1, name: 'Player 1' },
        { id: 2, name: 'Player 2' }
      ]
      
      const horlogeGame = wrapper.vm.games.find(g => g.id === 'horloge')
      wrapper.vm.startGameDirectly(horlogeGame)

      expect(wrapper.vm.currentComponent).toBe(null)
    })
  })

  describe('UI interactions', () => {
    it('should add player on Enter key press', async () => {
      wrapper.vm.newPlayerName = 'Test Player'
      
      const input = wrapper.find('input[placeholder="Nom du joueur"]')
      await input.trigger('keyup.enter')

      expect(wrapper.vm.players).toHaveLength(1)
      expect(wrapper.vm.players[0].name).toBe('Test Player')
    })

    it('should disable add button when name is empty', async () => {
      await wrapper.setData({ newPlayerName: '' })
      
      const addButton = wrapper.find('button').element
      expect(addButton.disabled).toBe(true)
    })

    it('should enable add button when name is provided', async () => {
      await wrapper.setData({ newPlayerName: 'Test' })
      
      const buttons = wrapper.findAll('button')
      const addButton = buttons.find(btn => btn.text().includes('+') || btn.text().includes('Ajouter'))
      expect(addButton.element.disabled).toBe(false)
    })

    it('should return to home when clicking back button', async () => {
      wrapper.vm.currentComponent = 'Cricket'
      await wrapper.vm.$nextTick()

      const backButton = wrapper.find('button')
      await backButton.trigger('click')

      expect(wrapper.vm.currentComponent).toBe(null)
    })
  })

  describe('Computed properties', () => {
    it('should return correct sheet URL from environment', () => {
      // Mock import.meta.env
      const originalEnv = import.meta.env
      import.meta.env = { VITE_GOOGLE_SHEET_URL: 'https://test-sheet.com' }

      const url = wrapper.vm.sheetUrl
      expect(url).toBe('https://test-sheet.com')

      // Restore
      import.meta.env = originalEnv
    })

    it('should return fallback sheet URL when not configured', () => {
      const originalEnv = import.meta.env
      import.meta.env = {}

      const url = wrapper.vm.sheetUrl
      expect(url).toBe('https://docs.google.com/spreadsheets')

      // Restore
      import.meta.env = originalEnv
    })
  })

  describe('Component rendering', () => {
    it('should render home page by default', () => {
      expect(wrapper.find('h1').text()).toContain('FLÉCHETTES')
      expect(wrapper.findAll('.group').length).toBeGreaterThan(0) // Game cards
    })

    it('should render game component when selected', async () => {
      wrapper.vm.players = [
        { id: 1, name: 'Player 1' },
        { id: 2, name: 'Player 2' }
      ]
      wrapper.vm.currentComponent = 'Cricket'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Cricket Component')
    })

    it('should show footer only on home page', () => {
      expect(wrapper.find('footer').exists()).toBe(true)
      
      wrapper.vm.currentComponent = 'Cricket'
      expect(wrapper.find('footer').exists()).toBe(false)
    })

    it('should display correct player count in mobile view', async () => {
      wrapper.vm.players = [
        { id: 1, name: 'Player 1' },
        { id: 2, name: 'Player 2' },
        { id: 3, name: 'Player 3' }
      ]
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Joueurs inscrits (3)')
    })

    it('should show game requirements correctly', async () => {
      // Test with no players
      expect(wrapper.text()).toContain('Minimum 2 joueurs requis')
      
      // Test with enough players
      wrapper.vm.players = [
        { id: 1, name: 'Player 1' },
        { id: 2, name: 'Player 2' }
      ]
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Jouer maintenant')
    })
  })

  describe('Game availability', () => {
    it('should mark games as available or unavailable correctly', () => {
      const availableGames = wrapper.vm.games.filter(g => g.component)
      const unavailableGames = wrapper.vm.games.filter(g => !g.component)

      expect(availableGames).toHaveLength(3) // Cricket, 301, Shanghai
      expect(unavailableGames).toHaveLength(3) // Horloge, Killer, Morpion
    })

    it('should render unavailable games with correct styling', async () => {
      const gameCards = wrapper.findAll('.group')
      const unavailableCard = gameCards.find(card => 
        card.text().includes('Autour de l\'horloge')
      )

      expect(unavailableCard.classes()).toContain('opacity-50')
      expect(unavailableCard.classes()).toContain('cursor-not-allowed')
    })
  })
})