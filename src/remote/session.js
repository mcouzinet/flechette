/* ============================================================
   Remote session service : tableau partagé sur PocketBase (stonk-api).

   Modèle (confiance entre amis, repris de la version Firebase) :
   - une session = un enregistrement `sessions` dont l'identifiant EST le code
     (en minuscules). Personne ne peut lister les sessions : il faut le code.
   - le journal d'actions vit dans la collection `actions`, une ligne par
     fléchette, numérotée par `seq`. Un index unique (session, epoch, seq)
     remplace la transaction Firestore : deux lancers simultanés visent le même
     seq, le second est refusé et réessaie avec seq + 1.
   - « Annuler » = supprimer l'action de seq maximal. « Réinitialiser » =
     epoch + 1 sur la session : les actions des epochs précédentes sont ignorées.
   - chaque appareil dérive l'état avec buildState() (= actions.reduce), comme
     avant ; subscribe() livre le même objet session qu'à l'époque de Firestore
     ({ gameId, config, players, participants, actions: [{ type, dart, by, at }] }),
     si bien que RemoteGame et les plateaux n'ont pas changé.
   - chaque joueur est connecté : le compte signe ses fléchettes (`by`).

   Le code de 6 lettres est un jeton d'édition partagé, pas une frontière
   d'intégrité : les règles figent les métadonnées mais ne valident pas le
   contenu des fléchettes. Les réducteurs restent robustes aux entrées farfelues.
   ============================================================ */
import { pb } from '../pocketbase.js'
import { getGame, buildState } from './games/index.js'
import { isValidDart } from './dart.js'

// alphabet sans ambiguïté (ni O/0 ni I/1)
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const CODE_LEN = 6 // 31^6 ≈ 887M codes : l'énumération à l'aveugle est impraticable

export function generateCode() {
  let code = ''
  for (let i = 0; i < CODE_LEN; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return code
}

export function normalizeCode(code) {
  return String(code || '').trim().toUpperCase()
}

const idOf = (code) => normalizeCode(code).toLowerCase()
const q = (code) => ({ s: idOf(code) }) // les règles exigent ?s=<code> pour lire les actions

// Identité du joueur : son compte (la connexion est obligatoire). Le champ
// `by` des actions et les clés de présence en dépendent.
export function deviceId() {
  return pb.authStore.record?.id || 'anon'
}

const isNotFound = (e) => e && e.status === 404
const isDuplicate = (e) => e && e.status === 400 && e.response && e.response.data &&
  Object.values(e.response.data).some((f) => f && f.code === 'validation_not_unique')

async function fetchSession(code) {
  try {
    return await pb.collection('sessions').getOne(idOf(code))
  } catch (e) {
    if (isNotFound(e)) throw new Error('Session introuvable')
    throw e
  }
}

async function fetchActions(code, epoch) {
  return pb.collection('actions').getFullList({
    filter: pb.filter('session = {:s} && epoch = {:e}', { s: idOf(code), e: epoch || 0 }),
    sort: 'seq',
    query: q(code),
  })
}

const toAction = (r) => ({ type: 'THROW', dart: r.dart, by: r.by, at: Date.parse(r.created) || 0 })

// Objet session tel que RemoteGame le consomme depuis toujours.
export function shapeSession(meta, rows) {
  return {
    code: normalizeCode(meta.id),
    gameId: meta.gameId,
    config: meta.config || {},
    players: meta.players || [],
    participants: meta.participants || {},
    epoch: meta.epoch || 0,
    actions: [...rows].sort((a, b) => a.seq - b.seq).map(toAction),
  }
}

/** Crée une session et rend son code. */
export async function createSession({ gameId, config = {}, players, hostName = 'Hôte' }) {
  if (!getGame(gameId)) throw new Error(`Jeu inconnu: ${gameId}`)
  if (!players || players.length < 2) throw new Error('Il faut au moins 2 joueurs')
  const normalized = players.map((p, i) => ({ id: String(p.id ?? `p${i}`), name: p.name }))
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    try {
      await pb.collection('sessions').create({
        id: code.toLowerCase(), gameId, config, players: normalized, hostName, epoch: 0,
        participants: { [deviceId()]: { name: hostName, joinedAt: Date.now() } },
      })
      return code
    } catch (e) {
      if (!isDuplicate(e)) throw e // collision de code (très improbable) : on retente
    }
  }
  throw new Error('Impossible de générer un code, réessaie')
}

/** Lit une session SANS s'y déclarer (l'écran de jonction montre le jeu et les joueurs). */
export async function peekSession(code) {
  const meta = await fetchSession(code)
  return shapeSession(meta, [])
}

/** Rejoint une session et y déclare l'appareil. */
export async function joinSession(code, name = 'Invité') {
  const meta = await fetchSession(code)
  const participants = { ...(meta.participants || {}), [deviceId()]: { name, joinedAt: Date.now() } }
  await pb.collection('sessions').update(meta.id, { participants })
  return shapeSession({ ...meta, participants }, [])
}

/** Abonnement temps réel. cb reçoit l'objet session (ou null si elle disparaît). Rend la fonction de désabonnement. */
export function subscribe(code, cb, onError) {
  let meta = null
  let rows = []
  let closed = false
  const unsubs = []
  const emit = () => { if (!closed && meta) cb(shapeSession(meta, rows)) }
  const fail = (e) => {
    if (closed) return
    if (isNotFound(e) || (e && e.message === 'Session introuvable')) cb(null)
    else if (onError) onError(e)
  }

  // Rechargement complet : au démarrage, après une reconnexion, et quand l'epoch change.
  const reload = async () => {
    meta = await fetchSession(code)
    rows = await fetchActions(code, meta.epoch)
    emit()
  }

  ;(async () => {
    try {
      await reload()
      unsubs.push(await pb.collection('sessions').subscribe(idOf(code), (e) => {
        if (e.action === 'delete') { meta = null; cb(null); return }
        const epochChanged = (e.record.epoch || 0) !== (meta.epoch || 0)
        meta = e.record
        if (epochChanged) reload().catch(fail)
        else emit()
      }))
      unsubs.push(await pb.collection('actions').subscribe('*', (e) => {
        if (!meta || e.record.session !== meta.id) return
        if (e.action === 'delete') rows = rows.filter((r) => r.id !== e.record.id)
        else if ((e.record.epoch || 0) === (meta.epoch || 0) && !rows.some((r) => r.id === e.record.id)) rows = [...rows, e.record]
        emit()
      }, { query: q(code), filter: pb.filter('session = {:s}', { s: idOf(code) }) }))
      // Après une coupure, des événements ont pu être perdus : on relit tout.
      let first = true
      unsubs.push(await pb.realtime.subscribe('PB_CONNECT', () => {
        if (first) { first = false; return }
        reload().catch(fail)
      }))
      if (closed) unsubs.forEach((u) => u())
    } catch (e) {
      fail(e)
    }
  })()

  return () => {
    closed = true
    unsubs.forEach((u) => { try { u() } catch (_) { /* déjà fermé */ } })
  }
}

/** Ajoute une fléchette. Rend true si elle est enregistrée, false si la partie
 *  était déjà finie (le client lève alors son affichage optimiste). */
export async function throwDart(code, dart) {
  const meta = await fetchSession(code)
  const game = getGame(meta.gameId)
  const valid = game && (game.validate ? game.validate(dart) : isValidDart(dart))
  if (!valid) throw new Error('Tir invalide')
  for (let attempt = 0; attempt < 8; attempt++) {
    const rows = await fetchActions(code, meta.epoch)
    const state = buildState(shapeSession(meta, rows))
    if (state && state.finished) return false // pas de tir après la fin
    const seq = rows.length ? rows[rows.length - 1].seq + 1 : 1
    try {
      await pb.collection('actions').create({ session: meta.id, epoch: meta.epoch || 0, seq, dart, by: deviceId() })
      return true
    } catch (e) {
      // Quota de requêtes atteint (rafale de tirs) : on souffle et on retente.
      if (e && e.status === 429) { await new Promise((r) => setTimeout(r, 1000)); continue }
      if (!isDuplicate(e)) throw e // un autre appareil a pris ce seq : on relit et on retente
    }
  }
  throw new Error('Trop de tirs simultanés, réessaie')
}

/** Annule la dernière action de l'epoch en cours. */
export async function undoLast(code) {
  const meta = await fetchSession(code)
  const last = await pb.collection('actions').getList(1, 1, {
    filter: pb.filter('session = {:s} && epoch = {:e}', { s: meta.id, e: meta.epoch || 0 }),
    sort: '-seq',
    query: q(code),
  })
  if (last.items.length) await pb.collection('actions').delete(last.items[0].id, { query: q(code) })
}

/** Réinitialise la partie (mêmes joueurs, journal vidé) : on passe à l'epoch suivante. */
export async function resetGame(code) {
  const meta = await fetchSession(code)
  await pb.collection('sessions').update(meta.id, { epoch: (meta.epoch || 0) + 1 })
}

/** Retire la présence de l'appareil (au mieux, en quittant). */
export async function leaveSession(code) {
  try {
    const meta = await fetchSession(code)
    const participants = { ...(meta.participants || {}) }
    delete participants[deviceId()]
    await pb.collection('sessions').update(meta.id, { participants })
  } catch (_) {
    /* ignoré */
  }
}
