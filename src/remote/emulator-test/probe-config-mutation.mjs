/* Adversarial probe: are there fields a participant can mutate that the rules
   do NOT freeze, but which buildState() depends on? If so, a malicious/buggy
   client could desync everyone's derived state. We test `config` (feeds
   createInitialState -> buildState) and `status`. */
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, signInAnonymously } from 'firebase/auth'
import {
  getFirestore, connectFirestoreEmulator,
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { buildState } from '../games/index.js'

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'demo-stonk'
const COL = 'sessions'
let notes = []

function makeClient(label) {
  const app = initializeApp({ projectId: PROJECT_ID, apiKey: 'demo-key' }, `p-${label}-${Math.random()}`)
  const auth = getAuth(app); connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  const db = getFirestore(app); connectFirestoreEmulator(db, '127.0.0.1', 8080)
  return { app, auth, db }
}
async function tryUpdate(label, ref, patch) {
  try { await updateDoc(ref, patch); console.log(`  ALLOWED  ${label}`); return true }
  catch (e) { console.log(`  DENIED   ${label} (${e.code || e.message})`); return false }
}

const host = makeClient('host'); const guest = makeClient('guest')
const huid = (await signInAnonymously(host.auth)).user.uid
const guid = (await signInAnonymously(guest.auth)).user.uid
const CODE = 'PROBE' + Math.random().toString(36).slice(2, 4).toUpperCase()
const hRef = doc(host.db, COL, CODE)
const gRef = doc(guest.db, COL, CODE)

await setDoc(hRef, {
  code: CODE, gameId: 'x01', config: { start: 301 },
  players: [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }],
  actions: [], hostUid: huid, participants: { [huid]: { name: 'H', joinedAt: Date.now() } },
  status: 'playing', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
})
const start = buildState((await getDoc(hRef)).data())
console.log(`\nInitial Alice score (config.start=301): ${start.scores.a}`)

console.log('\n-- guest attempts (rules-enforced) --')
const cfgChanged = await tryUpdate('guest mutates config.start 301 -> 9999', gRef,
  { config: { start: 9999 }, updatedAt: serverTimestamp() })
const statusChanged = await tryUpdate('guest mutates status playing -> finished', gRef,
  { status: 'finished', updatedAt: serverTimestamp() })
const partFreeze = await tryUpdate('guest stomps participants (wipe host presence)', gRef,
  { participants: {}, updatedAt: serverTimestamp() })

const after = buildState((await getDoc(hRef)).data())
console.log(`\nAlice score after guest's config write: ${after.scores.a}`)

if (cfgChanged) notes.push(`config is NOT frozen by firestore.rules: a participant changed config.start, which feeds createInitialState/buildState — Alice's derived starting score moved ${start.scores.a} -> ${after.scores.a}. Every client replaying the log now computes a DIFFERENT game. Potential desync/cheat vector.`)
if (statusChanged) notes.push(`status is NOT frozen: a participant set status='finished' directly (it's meant to be derived from build(...).finished via nextStatus). A client could prematurely end the displayed game.`)
if (partFreeze) notes.push(`participants is NOT frozen: a participant overwrote the whole participants map (could erase others' presence).`)

console.log('\n=== PROBE NOTES ===')
if (notes.length === 0) console.log('  (none — all mutable fields are either frozen or harmless)')
notes.forEach((n) => console.log('  * ' + n))

await Promise.allSettled([deleteApp(host.app), deleteApp(guest.app)])
process.exit(0)
