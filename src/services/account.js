// Comptes Stonk sur PocketBase (stonk-api). Remplace Firebase Auth.
// Web : connexion par code à 6 chiffres reçu par email. App native : Apple ou
// Google via OAuth2 (navigateur système), avec le code email en secours.
// Chargé à la demande seulement : « jouer sans compte » reste le chemin par défaut.
import { pb } from '../pocketbase.js'

// La session PocketBase est rangée par le SDK sous cette clé : on peut savoir
// s'il y a un compte sans charger ce module.
export const AUTH_KEY = 'pocketbase_auth'

export const currentUser = () => (pb.authStore.isValid ? pb.authStore.record : null)

export function onUserChange(cb) {
  return pb.authStore.onChange(() => cb(currentUser()))
}

// Revalide la session au démarrage (jeton expiré ou compte supprimé : on l'oublie).
export async function refresh() {
  if (!pb.authStore.isValid) return null
  try {
    await pb.collection('users').authRefresh()
  } catch (_) {
    pb.authStore.clear()
  }
  return currentUser()
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

/** Apple ou Google. Le SDK attend la réponse par le temps réel pendant que le
 *  navigateur (système, dans l'app native) fait l'aller-retour chez le fournisseur. */
export async function signInWithProvider(provider) {
  const native = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()
  const options = { provider }
  if (native) {
    const { Browser } = await import('@capacitor/browser')
    options.urlCallback = (url) => Browser.open({ url })
  }
  try {
    await pb.collection('users').authWithOAuth2(options)
  } finally {
    if (native) {
      const { Browser } = await import('@capacitor/browser')
      Browser.close().catch(() => {})
    }
  }
  return currentUser()
}

export function logout() {
  pb.authStore.clear()
}
