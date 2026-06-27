/* ============================================================================
   END-TO-END emulator integration test for the remote-multiplayer feature.

   Runs the REAL firestore.rules (loaded by the emulator from firebase.json) and
   the REAL game logic (buildState / isValidDart imported from ../). It does NOT
   import src/firebase.js (a singleton — one client only); instead it stands up
   TWO independent firebase app instances (host + guest), each with its own auth
   + firestore pointed at the emulator, so we can prove cross-client live sync.

   The write shapes below mirror src/remote/session.js exactly so the test
   exercises the same documents the production service produces — only the
   firebase *handle* differs (per-client instead of the singleton).

   Run via:
     npx firebase emulators:exec --only firestore,auth --project demo-stonk \
       "node src/remote/emulator-test/remote-session.emulator.test.mjs"
   ============================================================================ */
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, signInAnonymously } from 'firebase/auth'
import {
  getFirestore, connectFirestoreEmulator,
  doc, getDoc, setDoc, updateDoc, onSnapshot, runTransaction, serverTimestamp,
} from 'firebase/firestore'

import { buildState } from '../games/index.js'
import { isValidDart } from '../dart.js'

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'demo-stonk'
const FS_HOST = '127.0.0.1'
const FS_PORT = 8080
const AUTH_URL = 'http://127.0.0.1:9099'
const COL = 'sessions'

// ---- tiny test harness ----------------------------------------------------
let passed = 0
let failed = 0
const failures = []
function check(name, cond, detail = '') {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; failures.push(`${name}${detail ? ' — ' + detail : ''}`); console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}
async function expectReject(name, p) {
  try { await p; check(name, false, 'expected a rejection but the write SUCCEEDED') }
  catch (e) { check(name, true); /* expected */ void e }
}
async function expectResolve(name, p) {
  try { await p; check(name, true) }
  catch (e) { check(name, false, `unexpected rejection: ${e?.code || e?.message || e}`) }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---- client factory: an isolated app + emulator-wired auth/db -------------
function makeClient(label) {
  const app = initializeApp({ projectId: PROJECT_ID, apiKey: 'demo-key' }, `client-${label}-${Math.random().toString(36).slice(2)}`)
  const auth = getAuth(app)
  connectAuthEmulator(auth, AUTH_URL, { disableWarnings: true })
  const db = getFirestore(app)
  connectFirestoreEmulator(db, FS_HOST, FS_PORT)
  return { app, auth, db, label }
}

// ---- session ops re-expressed against a per-client {db,uid} ----------------
// (Byte-for-byte the same field shapes / rule-relevant predicates as session.js.)
async function createSession(c, { code, gameId, config = {}, players, hostName = 'Hôte' }) {
  const normalized = players.map((p, i) => ({ id: String(p.id ?? `p${i}`), name: p.name }))
  const ref = doc(c.db, COL, code)
  await setDoc(ref, {
    code,
    gameId,
    config,
    players: normalized,
    actions: [],
    hostUid: c.uid,
    participants: { [c.uid]: { name: hostName, joinedAt: Date.now() } },
    status: 'playing',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return code
}
async function joinSession(c, code, name = 'Invité') {
  const ref = doc(c.db, COL, code)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Session introuvable')
  await updateDoc(ref, {
    [`participants.${c.uid}`]: { name, joinedAt: Date.now() },
    updatedAt: serverTimestamp(),
  })
  return snap.data()
}
function nextStatus(data, actions) {
  const state = buildState({ ...data, actions })
  return state && state.finished ? 'finished' : 'playing'
}
async function throwDart(c, code, dart) {
  if (!isValidDart(dart)) throw new Error('Tir invalide')
  const ref = doc(c.db, COL, code)
  await runTransaction(c.db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('Session introuvable')
    const data = snap.data()
    const state = buildState(data)
    if (state && state.finished) return
    const action = { type: 'THROW', dart, by: c.uid, at: Date.now() }
    const actions = [...(data.actions || []), action]
    tx.update(ref, { actions, status: nextStatus(data, actions), updatedAt: serverTimestamp() })
  })
}
async function undoLast(c, code) {
  const ref = doc(c.db, COL, code)
  await runTransaction(c.db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('Session introuvable')
    const data = snap.data()
    const actions = (data.actions || []).slice(0, -1)
    tx.update(ref, { actions, status: nextStatus(data, actions), updatedAt: serverTimestamp() })
  })
}
async function resetGame(c, code) {
  const ref = doc(c.db, COL, code)
  await updateDoc(ref, { actions: [], status: 'playing', updatedAt: serverTimestamp() })
}

const THROW = (n, mult = 1) => ({ n, mult })

// ===========================================================================
async function main() {
  console.log(`\n=== Remote-session emulator E2E (project=${PROJECT_ID}) ===\n`)

  const host = makeClient('host')
  const guest = makeClient('guest')
  host.uid = (await signInAnonymously(host.auth)).user.uid
  guest.uid = (await signInAnonymously(guest.auth)).user.uid
  check('two distinct anonymous clients authenticated', host.uid && guest.uid && host.uid !== guest.uid,
    `host=${host.uid} guest=${guest.uid}`)

  // unique code per run so re-runs against a warm emulator don't collide
  const CODE = 'TEST' + Math.random().toString(36).slice(2, 4).toUpperCase()

  // -- CHECK 1: create -------------------------------------------------------
  await createSession(host, {
    code: CODE, gameId: 'x01', config: { start: 301 },
    players: [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }],
  })
  const created = await getDoc(doc(host.db, COL, CODE))
  check('CHECK1 create: doc exists at sessions/{code}', created.exists())
  check('CHECK1 create: hostUid + gameId + empty actions persisted',
    created.data()?.hostUid === host.uid && created.data()?.gameId === 'x01' && (created.data()?.actions?.length === 0))

  // -- CHECK 2: second distinct client joins --------------------------------
  await expectResolve('CHECK2 join: guest (distinct auth) joins session',
    joinSession(guest, CODE, 'Bob'))
  const afterJoin = await getDoc(doc(guest.db, COL, CODE))
  check('CHECK2 join: guest presence registered in participants',
    !!afterJoin.data()?.participants?.[guest.uid] && !!afterJoin.data()?.participants?.[host.uid])

  // -- CHECK 3: live sync — guest SUBSCRIBES, host THROWS --------------------
  const received = []
  const unsub = onSnapshot(doc(guest.db, COL, CODE), (snap) => { if (snap.exists()) received.push(snap.data()) })
  await sleep(300) // let the initial snapshot land
  const before = received.length

  // host throws a full turn: T20, T20, T20  -> Alice 301 -> 121
  await throwDart(host, CODE, THROW(20, 3))
  await throwDart(host, CODE, THROW(20, 3))
  await throwDart(host, CODE, THROW(20, 3))
  await sleep(500) // let onSnapshot deliver

  check('CHECK3 sync: guest subscriber received update(s) after host threw', received.length > before,
    `before=${before} after=${received.length}`)
  const last = received[received.length - 1]
  const guestState = buildState(last)
  check('CHECK3 sync: guest-derived buildState score matches expected (301-180=121)',
    guestState?.scores?.a === 121, `got ${guestState?.scores?.a}`)
  check('CHECK3 sync: turn advanced to player B after 3 darts', guestState?.currentPlayerIndex === 1,
    `idx=${guestState?.currentPlayerIndex}`)
  check('CHECK3 sync: action log length is 3', (last?.actions?.length === 3),
    `len=${last?.actions?.length}`)

  // -- CHECK 4: undo + reset -------------------------------------------------
  await undoLast(guest, CODE) // guest can mutate gameplay too (trust-based board)
  await sleep(300)
  const afterUndo = received[received.length - 1]
  check('CHECK4 undo: action log dropped to 2', afterUndo?.actions?.length === 2,
    `len=${afterUndo?.actions?.length}`)
  check('CHECK4 undo: derived score reflects 2 darts (301-120=181)',
    buildState(afterUndo)?.scores?.a === 181, `got ${buildState(afterUndo)?.scores?.a}`)

  await resetGame(host, CODE)
  await sleep(300)
  const afterReset = received[received.length - 1]
  check('CHECK4 reset: action log cleared', afterReset?.actions?.length === 0, `len=${afterReset?.actions?.length}`)
  check('CHECK4 reset: status back to playing', afterReset?.status === 'playing', `status=${afterReset?.status}`)
  check('CHECK4 reset: derived score back to start 301', buildState(afterReset)?.scores?.a === 301,
    `got ${buildState(afterReset)?.scores?.a}`)

  // -- CHECK 5: drive to a WIN (status finished + winnerId) ------------------
  // Fresh game already reset above. Alice: 60,60,60 -> 121. Bob: 3 misses.
  // Alice: 60,60,1 -> 0 => exact checkout, finished, winnerId = 'a'.
  await throwDart(host, CODE, THROW(20, 3))
  await throwDart(host, CODE, THROW(20, 3))
  await throwDart(host, CODE, THROW(20, 3)) // Alice 121, turn -> Bob
  await throwDart(guest, CODE, { miss: true })
  await throwDart(guest, CODE, { miss: true })
  await throwDart(guest, CODE, { miss: true }) // Bob turn done -> Alice
  await throwDart(host, CODE, THROW(20, 3)) // 121 -> 61
  await throwDart(host, CODE, THROW(20, 3)) // 61 -> 1
  await throwDart(host, CODE, THROW(1, 1))  // 1 -> 0  WIN
  await sleep(500)
  const finalDoc = await getDoc(doc(guest.db, COL, CODE))
  const finalData = finalDoc.data()
  const finalState = buildState(finalData)
  check('CHECK5 win: derived state finished === true', finalState?.finished === true)
  check('CHECK5 win: derived winnerId === "a" (Alice)', finalState?.winnerId === 'a', `winner=${finalState?.winnerId}`)
  check('CHECK5 win: persisted status === "finished"', finalData?.status === 'finished', `status=${finalData?.status}`)
  // throws after finish are ignored by throwDart
  const lenBeforeExtra = finalData?.actions?.length
  await throwDart(host, CODE, THROW(20, 3))
  const afterExtra = (await getDoc(doc(host.db, COL, CODE))).data()
  check('CHECK5 win: throws after finish are ignored (log unchanged)',
    afterExtra?.actions?.length === lenBeforeExtra, `before=${lenBeforeExtra} after=${afterExtra?.actions?.length}`)

  // -- CHECK 6: RULES ENFORCEMENT -------------------------------------------
  // 6a: unauthenticated read is DENIED
  const anon = makeClient('anon') // NOT signed in
  await expectReject('CHECK6a rules: unauthenticated read is DENIED',
    getDoc(doc(anon.db, COL, CODE)))

  // 6b: a participant cannot overwrite frozen fields hostUid / gameId
  await expectReject('CHECK6b rules: guest cannot overwrite frozen hostUid',
    updateDoc(doc(guest.db, COL, CODE), { hostUid: guest.uid, updatedAt: serverTimestamp() }))
  await expectReject('CHECK6b rules: guest cannot overwrite frozen gameId',
    updateDoc(doc(guest.db, COL, CODE), { gameId: 'countup', updatedAt: serverTimestamp() }))
  // sanity: a legitimate gameplay update is still ALLOWED
  await expectResolve('CHECK6b rules: legitimate gameplay update still allowed (control)',
    updateDoc(doc(guest.db, COL, CODE), { actions: [], status: 'playing', updatedAt: serverTimestamp() }))

  // 6c: actions length > 2000 is rejected
  const tooMany = Array.from({ length: 2001 }, () => ({ type: 'THROW', dart: { miss: true }, by: host.uid, at: Date.now() }))
  await expectReject('CHECK6c rules: write with actions.length > 2000 is rejected',
    updateDoc(doc(host.db, COL, CODE), { actions: tooMany, status: 'playing', updatedAt: serverTimestamp() }))
  // control: exactly 2000 is allowed (boundary)
  const exactly = Array.from({ length: 2000 }, () => ({ type: 'THROW', dart: { miss: true }, by: host.uid, at: Date.now() }))
  await expectResolve('CHECK6c rules: write with actions.length == 2000 allowed (boundary control)',
    updateDoc(doc(host.db, COL, CODE), { actions: exactly, status: 'playing', updatedAt: serverTimestamp() }))

  // 6d: isValidDart keeps malformed darts out (throwDart guards before any write)
  await expectReject('CHECK6d guard: throwDart rejects malformed dart {n:999,mult:99}',
    throwDart(host, CODE, { n: 999, mult: 99 }))
  await expectReject('CHECK6d guard: throwDart rejects triple-bull {n:25,mult:3}',
    throwDart(host, CODE, { n: 25, mult: 3 }))
  check('CHECK6d guard: isValidDart unit — accepts valid, rejects hostile',
    isValidDart({ n: 20, mult: 3 }) && isValidDart({ miss: true }) &&
    !isValidDart({ n: 999, mult: 99 }) && !isValidDart({ n: 25, mult: 3 }) && !isValidDart(null))

  // 6e (bonus): create with a non-self hostUid is DENIED (impersonation guard)
  await expectReject('CHECK6 bonus: create with hostUid != auth.uid is DENIED',
    setDoc(doc(guest.db, COL, 'FORGED' + CODE), {
      code: 'FORGED' + CODE, gameId: 'x01', config: {}, players: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
      actions: [], hostUid: host.uid /* not guest! */, participants: {}, status: 'playing',
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    }))

  // ---- teardown -----------------------------------------------------------
  unsub()
  await Promise.allSettled([deleteApp(host.app), deleteApp(guest.app), deleteApp(anon.app)])

  console.log(`\n=== RESULT: ${passed} passed, ${failed} failed ===`)
  if (failed) { console.log('Failures:'); failures.forEach((f) => console.log('  - ' + f)) }
  // give firestore listeners a beat to close before exit
  await sleep(200)
  process.exit(failed ? 1 : 0)
}

main().catch((e) => { console.error('FATAL test error:', e); process.exit(1) })
