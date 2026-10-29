// Comptes Stonk sur PocketBase (stonk-api). La connexion est obligatoire pour
// jouer : Google, Discord ou Apple (OAuth2), ou un code à 6 chiffres par email.
import { pb } from '../pocketbase.js'

// La session PocketBase est rangée par le SDK sous cette clé : on peut savoir
// s'il y a un compte sans charger ce module.
export const AUTH_KEY = 'pocketbase_auth'

export const currentUser = () => (pb.authStore.isValid ? pb.authStore.record : null)

export function onUserChange(cb) {
  return pb.authStore.onChange(() => cb(currentUser()))
}

// Nom à afficher : celui du fournisseur (Google, Discord), sinon le début de l'email.
export const displayName = (u) => (u && (u.name || String(u.email || '').split('@')[0])) || ''

// Revalide la session au démarrage. Seul un refus explicite du serveur (jeton
// expiré, compte supprimé) déconnecte : hors ligne ou serveur en panne, on
// garde la session pour que le jeu local reste jouable.
export async function refresh() {
  if (!pb.authStore.isValid) return null
  try {
    await pb.collection('users').authRefresh()
  } catch (e) {
    if (e && [401, 403, 404].includes(e.status)) pb.authStore.clear()
  }
  return currentUser()
}

/** Fournisseurs OAuth configurés sur le serveur (Google, Discord, Apple...). */
export async function listProviders() {
  try {
    const m = await pb.collection('users').listAuthMethods()
    return (m.oauth2 && m.oauth2.enabled ? m.oauth2.providers : []).map((p) => p.name)
  } catch (_) {
    return []
  }
}

const randomPassword = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, '0')).join('')

/** Envoie un code à 6 chiffres par email ; crée le compte au premier passage. Rend l'otpId à repasser à verifyCode. */
export async function requestCode(email) {
  const users = pb.collection('users')
  const address = String(email || '').trim().toLowerCase()
  const password = randomPassword() // jamais utilisé : la connexion passe par le code
  try {
    await users.create({ email: address, password, passwordConfirm: password })
  } catch (e) {
    // Compte déjà existant : on enchaîne sur l'envoi du code.
    const known = e && e.status === 400 && e.response?.data?.email
    if (!known) throw e
  }
  const { otpId } = await users.requestOTP(address)
  return otpId
}

export async function verifyCode(otpId, code) {
  await pb.collection('users').authWithOTP(otpId, String(code).trim())
  return currentUser()
}

/** Google, Discord, Apple. À appeler DIRECTEMENT dans le gestionnaire de clic :
 *  sur le web, la fenêtre du fournisseur est ouverte avant tout `await`, sinon
 *  Safari iOS la bloque. Le SDK attend le résultat par le temps réel. */
export async function signInWithProvider(provider) {
  const native = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()
  const popup = native ? null : window.open('', 'stonk-oauth', 'width=520,height=680')
  const options = { provider }
  if (native) {
    const { Browser } = await import('@capacitor/browser')
    options.urlCallback = (url) => Browser.open({ url })
  } else {
    options.urlCallback = (url) => { if (popup) popup.location.href = url; else window.open(url) }
  }
  try {
    await pb.collection('users').authWithOAuth2(options)
  } finally {
    if (native) {
      const { Browser } = await import('@capacitor/browser')
      Browser.close().catch(() => {})
    } else if (popup && !popup.closed) {
      popup.close()
    }
  }
  return currentUser()
}

export function logout() {
  pb.authStore.clear()
}
