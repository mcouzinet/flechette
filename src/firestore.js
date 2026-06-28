// Firestore is split out of firebase.js so the home bundle — which only needs
// `auth` (App.vue) — doesn't pull the Firestore SDK. `db` is imported only by
// the remote session layer and the local victory logger, both of which live in
// lazy chunks, so Firestore loads on demand with the game/remote screens.
import { getFirestore } from 'firebase/firestore'
import app from './firebase.js'

export const db = getFirestore(app)
