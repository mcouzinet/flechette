<template>
  <div class="chalk-grain"
    style="font-family: var(--font-ui); color: var(--chalk-cream); height: 100%; overflow: hidden; position: relative; display: flex; flex-direction: column; background: radial-gradient(130% 90% at 50% -10%, #20322b, #142019 72%)">
    <!-- Cadre -->
    <div style="position: absolute; inset: 9px; border: 2px solid var(--chalk-line); border-radius: 12px; pointer-events: none; opacity: 0.5"></div>

    <!-- Header -->
    <header class="flex flex-wrap items-center justify-between gap-3 px-5 pt-3 pb-2 relative" style="border-bottom: 2px dashed var(--chalk-line); margin: 9px 9px 0">
      <button @click="$emit('exit')" class="chalk-btn-ghost text-base xl:text-[21px]">&#8249; Retour</button>
      <span class="text-xl xl:text-[28px]" style="font-family: var(--font-display); letter-spacing: 0.5px">HISTORIQUE DES PARTIES</span>
      <button
        @click="loadResults"
        :disabled="loading"
        class="chalk-btn-green text-base xl:text-[21px]"
        style="opacity: 1"
        :style="loading ? 'opacity: 0.5; cursor: not-allowed' : ''">
        {{ loading ? 'Chargement...' : 'Actualiser' }}
      </button>
    </header>

    <div class="flex-1 overflow-y-auto px-5 py-5 chalk-scroll relative">
      <!-- Les parties jouees sans compte sont ecrites en local : elles
           s'affichent toujours. La connexion sert a les retrouver ailleurs,
           elle ne conditionne plus l'acces a son propre historique. -->
      <div v-if="!user && results.length > 0" class="flex flex-wrap items-baseline justify-center gap-3 mb-6 text-center">
        <span class="text-lg" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">Ces parties vivent sur cet appareil.</span>
        <button @click="$emit('login')" class="chalk-btn" style="color: var(--chalk-gold)">Se connecter</button>
      </div>

      <!-- Filtres -->
      <div v-if="availableGames.length > 1" class="flex flex-wrap gap-2 mb-6 justify-center">
        <button
          @click="filter = null"
          :class="filter === null ? 'chalk-filter-active' : 'chalk-filter'">
          Tous
        </button>
        <button
          v-for="game in availableGames"
          :key="game"
          @click="filter = game"
          :class="filter === game ? 'chalk-filter-active' : 'chalk-filter'">
          {{ game }}
        </button>
      </div>

      <!-- Stats résumées -->
      <div v-if="filteredResults.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 max-w-4xl mx-auto">
        <div class="chalk-stat-card">
          <div class="text-[32px]" style="font-family: var(--font-display); color: var(--chalk-gold)">{{ filteredResults.length }}</div>
          <div class="text-[15px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">Parties</div>
        </div>
        <div class="chalk-stat-card">
          <div class="text-[32px]" style="font-family: var(--font-display); color: var(--chalk-green)">{{ uniqueWinners.length }}</div>
          <div class="text-[15px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">Vainqueurs</div>
        </div>
        <div class="chalk-stat-card">
          <div class="text-[26px] truncate" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-gold)">{{ topWinner?.name || '-' }}</div>
          <div class="text-[15px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">Meilleur joueur</div>
        </div>
        <div class="chalk-stat-card">
          <div class="text-[32px]" style="font-family: var(--font-display); color: var(--chalk-red)">{{ topWinner?.wins || 0 }}</div>
          <div class="text-[15px]" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint2)">Victoires</div>
        </div>
      </div>

      <!-- Liste des résultats -->
      <div class="max-w-4xl mx-auto flex flex-col gap-3">
        <div
          v-for="result in filteredResults"
          :key="result.id"
          class="chalk-result-item">

          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <!-- Info jeu -->
            <div class="flex items-center gap-3">
              <span class="chalk-game-badge" :style="gameColor(result.jeu)">
                {{ result.jeu }}
              </span>
              <div>
                <div class="text-lg" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-cream)">
                  {{ result.vainqueur }}
                  <span style="color: var(--chalk-gold); font-size: 14px; margin-left: 4px">&#9813;</span>
                </div>
                <div class="text-sm" style="color: var(--chalk-faint2)">
                  vs {{ result.joueurs?.filter(j => j !== result.vainqueur).join(', ') }}
                </div>
              </div>
            </div>

            <!-- Score et date -->
            <div class="flex items-center gap-4 text-right">
              <div>
                <div class="text-xl" style="font-family: var(--font-display); color: var(--chalk-cream)">{{ result.scoreVainqueur }}</div>
                <div class="text-xs" style="color: var(--chalk-faint2)">score</div>
              </div>
              <div>
                <div class="text-sm" style="color: var(--chalk-faint)">{{ result.totalMoves }} coups</div>
                <div class="text-xs" style="color: var(--chalk-faint2)">{{ result.date }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- État vide -->
      <div v-if="!loading && filteredResults.length === 0" class="text-center py-16">
        <div class="text-6xl mb-4" style="opacity: 0.15"></div>
        <div class="text-lg xl:text-3xl" style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">Aucune partie enregistrée</div>
        <div class="text-sm xl:text-xl mt-2" style="font-family: var(--font-hand); color: var(--chalk-faint2)">Jouez une partie pour voir les résultats ici</div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-16">
        <div style="font-family: var(--font-hand); font-weight: 600; color: var(--chalk-faint)">Chargement des résultats...</div>
      </div>
    </div>
  </div>
</template>

<script>
import firebaseService from '../services/firebaseService.js'
import { auth } from '../firebase.js'
import { onAuthStateChanged } from 'firebase/auth'

export default {
  name: "Resultats",
  emits: ['exit', 'login'],
  data() {
    return {
      results: [],
      filter: null,
      loading: false,
      user: auth.currentUser
    }
  },
  mounted() {
    this._unsubAuth = onAuthStateChanged(auth, (user) => {
      this.user = user
      this.loadResults()
    })
    this.loadResults()
  },
  beforeUnmount() {
    if (this._unsubAuth) this._unsubAuth()
  },
  computed: {
    availableGames() {
      const games = new Set(this.results.map(r => r.jeu))
      return [...games].sort()
    },
    filteredResults() {
      if (!this.filter) return this.results
      return this.results.filter(r => r.jeu === this.filter)
    },
    uniqueWinners() {
      return [...new Set(this.filteredResults.map(r => r.vainqueur))]
    },
    topWinner() {
      const wins = {}
      this.filteredResults.forEach(r => {
        wins[r.vainqueur] = (wins[r.vainqueur] || 0) + 1
      })
      const sorted = Object.entries(wins).sort((a, b) => b[1] - a[1])
      if (sorted.length === 0) return null
      return { name: sorted[0][0], wins: sorted[0][1] }
    }
  },
  methods: {
    // Les victoires hors compte etaient collectees dans localStorage puis
    // cachees derriere un mur de connexion - a rebours de la contrainte
    // produit "on peut jouer sans compte". Elles s'affichent maintenant
    // toujours, et le distant vient en complement quand on est connecte.
    localResults() {
      return firebaseService.getLocalVictories().map((v, i) => ({
        id: 'local-' + i,
        jeu: v.gameType,
        joueurs: v.participants || [],
        vainqueur: v.winner,
        scoreVainqueur: v.score,
        totalMoves: v.totalMoves,
        date: (v.date || '').split('T')[0],
        _local: true
      }))
    },

    async loadResults() {
      this.loading = true
      const local = this.localResults()
      const distant = this.user ? await firebaseService.getGameResults(100) : []
      this.results = [...distant, ...local].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      this.loading = false
    },
    gameColor(game) {
      const colors = {
        'Cricket': 'border-color: var(--chalk-green); color: var(--chalk-green)',
        '301': 'color: var(--chalk-cream)',
        '501': 'color: var(--chalk-cream)',
        'Shanghai': 'color: var(--chalk-gold)',
        'Horloge': 'color: var(--chalk-gold)',
        'Killer': 'color: var(--chalk-red)',
        'Morpion': 'color: var(--chalk-red)'
      }
      return colors[game] || 'color: var(--chalk-faint)'
    }
  }
}
</script>

<style scoped>
.chalk-btn-ghost {
  font-family: var(--font-hand); font-weight: 600; font-size: 21px;
  color: var(--chalk-faint); background: transparent;
  border: 2px dashed var(--chalk-faint); border-radius: 12px;
  padding: 5px 18px; cursor: pointer; line-height: 1.1; white-space: nowrap;
}
.chalk-btn-green {
  font-family: var(--font-hand); font-weight: 600; font-size: 21px;
  color: var(--chalk-green); background: transparent;
  border: 2px solid var(--chalk-green); border-radius: 12px;
  padding: 5px 18px; cursor: pointer; line-height: 1.1; white-space: nowrap;
  box-shadow: inset 0 0 0 1px rgba(134,199,160,0.2);
}
.chalk-btn-green:disabled {
  opacity: 0.5; cursor: not-allowed;
}
/* Plancher tactile. */
.chalk-filter {
  min-height: 44px;
  font-family: var(--font-hand); font-weight: 600; font-size: 19px;
  color: var(--chalk-faint); background: transparent;
  border: 2px dashed var(--chalk-line); border-radius: 12px;
  padding: 5px 16px; cursor: pointer; line-height: 1.1; white-space: nowrap;
  transition: all 0.3s;
}
.chalk-filter:hover {
  border-color: var(--chalk-faint);
  color: var(--chalk-cream);
}
.chalk-filter-active {
  min-height: 44px;
  font-family: var(--font-hand); font-weight: 600; font-size: 19px;
  color: var(--chalk-gold); background: transparent;
  border: 2px solid var(--chalk-gold); border-radius: 12px;
  padding: 5px 16px; cursor: pointer; line-height: 1.1; white-space: nowrap;
  box-shadow: inset 0 0 0 1px rgba(236,198,106,0.2);
}
.chalk-stat-card {
  background: transparent;
  border: 2px dashed var(--chalk-line);
  border-radius: 14px;
  padding: 16px;
  text-align: center;
}
.chalk-result-item {
  background: transparent;
  border: 1.5px dashed var(--chalk-line);
  border-radius: 14px;
  padding: 16px;
  transition: border-color 0.3s;
}
.chalk-result-item:hover {
  border-color: var(--chalk-faint);
}
.chalk-game-badge {
  font-family: var(--font-display);
  font-size: 13px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  border: 1.5px dashed var(--chalk-line);
  border-radius: 8px;
  padding: 4px 12px;
  white-space: nowrap;
}
</style>
