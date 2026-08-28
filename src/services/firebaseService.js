// Rien de Firebase n'est importe statiquement : le chemin sans compte n'ecrit
// que dans localStorage et ne doit donc rien telecharger.
let sdk = null

async function loadSdk() {
  if (!sdk) {
    const [{ auth }, { db }, fs] = await Promise.all([
      import('../firebase.js'),
      import('../firestore.js'),
      import('firebase/firestore'),
    ])
    sdk = { auth, db, ...fs }
  }
  return sdk
}

// Un compte n'existe que si Firebase a laisse sa trace : on peut le savoir
// sans charger une seule ligne du SDK.
function mayHaveAccount() {
  try {
    return Object.keys(localStorage).some(k => k.startsWith('firebase:authUser:'))
  } catch {
    return false
  }
}

class FirebaseService {
  async sendGameVictory(gameData) {
    if (!mayHaveAccount()) {
      this.saveToLocalStorage(gameData)
      return null
    }
    const { auth, db, collection, addDoc, serverTimestamp } = await loadSdk()
    if (!auth.currentUser) {
      this.saveToLocalStorage(gameData)
      return null
    }
    try {
      const payload = {
        jeu: gameData.gameType,
        joueurs: gameData.participants.map(p => p.name),
        scores: gameData.participants.map(p => {
          if (gameData.gameType === 'Shanghai' || gameData.gameType === 'CountUp') {
            return p.totalScore || 0
          } else if (gameData.gameType === 'Cricket') {
            return p.score || 0
          } else if (['Horloge', 'Killer', 'Morpion'].includes(gameData.gameType)) {
            return p.score || p.totalScore || 0
          } else {
            const gameRule = parseInt(gameData.gameType)
            return gameRule - (p.score || 0)
          }
        }),
        vainqueur: gameData.winner.name,
        scoreVainqueur: gameData.winner.finalScore,
        totalMoves: gameData.totalMoves,
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        userId: auth.currentUser.uid
      }

      const docRef = await addDoc(collection(db, 'game_results'), payload)
      console.log('Victoire enregistrée dans Firebase :', docRef.id)
      return docRef
    } catch (error) {
      console.error('Erreur Firebase, sauvegarde locale :', error)
      this.saveToLocalStorage(gameData)
      throw error
    }
  }

  saveToLocalStorage(gameData) {
    try {
      const victories = JSON.parse(localStorage.getItem('dartVictories') || '[]')
      victories.push({
        date: new Date().toISOString(),
        gameType: gameData.gameType,
        winner: gameData.winner.name,
        score: gameData.winner.finalScore,
        participants: gameData.participants.map(p => p.name),
        totalMoves: gameData.totalMoves
      })
      localStorage.setItem('dartVictories', JSON.stringify(victories))
      console.log('Victoire sauvegardée localement !')
    } catch (error) {
      console.warn('Erreur sauvegarde locale:', error)
    }
  }

  getLocalVictories() {
    try {
      return JSON.parse(localStorage.getItem('dartVictories') || '[]')
    } catch {
      return []
    }
  }

  async getGameResults(maxResults = 50) {
    if (!mayHaveAccount()) return []
    const { auth, db, collection, getDocs, query, orderBy, limit, where } = await loadSdk()
    const uid = auth.currentUser?.uid
    if (!uid) return []

    try {
      const q = query(
        collection(db, 'game_results'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(maxResults)
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Erreur lecture Firestore:', error)
      return []
    }
  }

  prepareGameData(winner, participants, history, gameType) {
    let sortedParticipants, scoreDifference, winnerScore

    if (gameType === 'Shanghai') {
      sortedParticipants = [...participants].sort((a, b) => b.totalScore - a.totalScore)
      const secondPlace = sortedParticipants[1]
      scoreDifference = secondPlace ? winner.totalScore - secondPlace.totalScore : 0
      winnerScore = winner.totalScore
    } else if (gameType === 'Cricket') {
      sortedParticipants = [...participants].sort((a, b) => a.score - b.score)
      const secondPlace = sortedParticipants[1]
      scoreDifference = secondPlace ? secondPlace.score - winner.score : 0
      winnerScore = winner.score
    } else if (gameType === 'Horloge') {
      sortedParticipants = [...participants].sort((a, b) => b.currentTarget - a.currentTarget)
      scoreDifference = 0
      winnerScore = 21
    } else if (gameType === 'Killer') {
      sortedParticipants = [...participants].sort((a, b) => {
        if (a.eliminated && !b.eliminated) return 1
        if (!a.eliminated && b.eliminated) return -1
        return b.lives - a.lives
      })
      scoreDifference = 0
      winnerScore = winner.lives
    } else if (gameType === 'Morpion') {
      sortedParticipants = [...participants]
      scoreDifference = 0
      winnerScore = 1
    } else if (gameType === 'CountUp') {
      sortedParticipants = [...participants].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
      const secondPlace = sortedParticipants[1]
      winnerScore = winner.totalScore || 0
      scoreDifference = secondPlace ? winnerScore - (secondPlace.totalScore || 0) : 0
    } else if (gameType === 'Halve-It' || gameType === 'Baseball') {
      sortedParticipants = [...participants].sort((a, b) => (b.totalScore || b.score || 0) - (a.totalScore || a.score || 0))
      const secondPlace = sortedParticipants[1]
      winnerScore = winner.totalScore || winner.score || 0
      scoreDifference = secondPlace ? winnerScore - (secondPlace.totalScore || secondPlace.score || 0) : 0
    } else if (gameType === 'Bobs27') {
      sortedParticipants = [...participants].sort((a, b) => {
        if (a.eliminated && !b.eliminated) return 1
        if (!a.eliminated && b.eliminated) return -1
        return b.score - a.score
      })
      scoreDifference = 0
      winnerScore = winner.score
    } else {
      const gameRule = parseInt(gameType)
      sortedParticipants = [...participants].sort((a, b) => a.score - b.score)
      const secondPlace = sortedParticipants[1]
      scoreDifference = secondPlace ? secondPlace.score - winner.score : 0
      winnerScore = gameRule - winner.score
    }

    return {
      winner: {
        ...winner,
        finalScore: winnerScore
      },
      participants: sortedParticipants,
      scoreDifference,
      totalMoves: history.length,
      gameType: gameType || 'Cricket',
      date: new Date().toISOString()
    }
  }
}

export default new FirebaseService()
