/* ============================================================
   Remote session service — shared scoring over Firestore.

   Model (trust-based shared board):
   - A session lives at sessions/{code} and stores the ordered ACTION LOG
     (the source of truth) plus meta. Every device derives the game state
     with buildState() (= actions.reduce(reducer, initial)) — one source of
     truth, no cached-state divergence.
   - Anyone in the session can score: throwDart appends a THROW action inside
     a transaction (read-modify-write), so concurrent scores stay consistent.
   - "Undo" = drop the last action. "Reset" = clear the log.
   - Identity is anonymous Firebase auth (ensureAuth) — no login needed to play.
   ============================================================ */
import { db, auth } from '../firebase.js'
import { signInAnonymously } from 'firebase/auth'
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, runTransaction, serverTimestamp, deleteField,
} from 'firebase/firestore'
import { getGame, buildState } from './games/index.js'

const COL = 'sessions'
// unambiguous alphabet (no O/0/I/1)
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LEN = 5

export function generateCode() {
  let code = ''
  for (let i = 0; i < CODE_LEN; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return code
}

export async function ensureAuth() {
  if (auth.currentUser) return auth.currentUser.uid
  const cred = await signInAnonymously(auth)
  return cred.user.uid
}

/** Create a session and return its short code. */
export async function createSession({ gameId, config = {}, players, hostName = 'Hôte' }) {
  if (!getGame(gameId)) throw new Error(`Jeu inconnu: ${gameId}`)
  if (!players || players.length < 2) throw new Error('Il faut au moins 2 joueurs')
  const uid = await ensureAuth()
  const normalized = players.map((p, i) => ({ id: String(p.id ?? `p${i}`), name: p.name }))

  // retry a couple of times on the (very unlikely) code collision
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    const ref = doc(db, COL, code)
    const existing = await getDoc(ref)
    if (existing.exists()) continue
    await setDoc(ref, {
      code,
      gameId,
      config,
      players: normalized,
      actions: [],
      hostUid: uid,
      participants: { [uid]: { name: hostName, joinedAt: Date.now() } },
      status: 'playing',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return code
  }
  throw new Error('Impossible de générer un code, réessaie')
}

/** Join an existing session by code; registers presence. Returns the data. */
export async function joinSession(code, name = 'Invité') {
  const uid = await ensureAuth()
  const ref = doc(db, COL, normalizeCode(code))
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Session introuvable')
  await updateDoc(ref, {
    [`participants.${uid}`]: { name, joinedAt: Date.now() },
    updatedAt: serverTimestamp(),
  })
  return snap.data()
}

/** Live subscription. cb receives the raw session doc (or null if deleted). */
export function subscribe(code, cb, onError) {
  const ref = doc(db, COL, normalizeCode(code))
  return onSnapshot(
    ref,
    (snap) => cb(snap.exists() ? snap.data() : null),
    (err) => onError && onError(err),
  )
}

/** Append a dart throw (transactional, concurrency-safe). dart = {n,mult} | {miss:true} */
export async function throwDart(code, dart) {
  const uid = await ensureAuth()
  const ref = doc(db, COL, normalizeCode(code))
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('Session introuvable')
    const data = snap.data()
    const state = buildState(data)
    if (state && state.finished) return // ignore throws after the game ends
    const action = { type: 'THROW', dart, by: uid, at: Date.now() }
    const actions = [...(data.actions || []), action]
    tx.update(ref, { actions, status: nextStatus(data, actions), updatedAt: serverTimestamp() })
  })
}

/** Undo the last action (transactional). */
export async function undoLast(code) {
  await ensureAuth()
  const ref = doc(db, COL, normalizeCode(code))
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('Session introuvable')
    const data = snap.data()
    const actions = (data.actions || []).slice(0, -1)
    tx.update(ref, { actions, status: nextStatus(data, actions), updatedAt: serverTimestamp() })
  })
}

/** Reset the game (keep players, clear the log). */
export async function resetGame(code) {
  await ensureAuth()
  const ref = doc(db, COL, normalizeCode(code))
  await updateDoc(ref, { actions: [], status: 'playing', updatedAt: serverTimestamp() })
}

/** Remove our presence (best-effort, on leaving). */
export async function leaveSession(code) {
  const uid = auth.currentUser?.uid
  if (!uid) return
  try {
    await updateDoc(doc(db, COL, normalizeCode(code)), {
      [`participants.${uid}`]: deleteField(),
    })
  } catch (_) {
    /* ignore */
  }
}

function nextStatus(data, actions) {
  const state = buildState({ ...data, actions })
  return state && state.finished ? 'finished' : 'playing'
}

export function normalizeCode(code) {
  return String(code || '').trim().toUpperCase()
}
