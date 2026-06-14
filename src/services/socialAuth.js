// Native social sign-in (Apple / Google) for Capacitor.
// The native plugin only drives the OS sign-in UI (skipNativeAuth: true); the
// resulting credential is handed to the Firebase JS SDK so that auth.currentUser
// — and therefore Firestore writes in firebaseService.js — work as on the web.
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import { auth } from '../firebase.js'
import { GoogleAuthProvider, OAuthProvider, signInWithCredential } from 'firebase/auth'

export async function signInWithApple() {
  const result = await FirebaseAuthentication.signInWithApple({ skipNativeAuth: true })
  const provider = new OAuthProvider('apple.com')
  const credential = provider.credential({
    idToken: result.credential?.idToken,
    rawNonce: result.credential?.nonce,
  })
  await signInWithCredential(auth, credential)
  return auth.currentUser
}

export async function signInWithGoogle() {
  const result = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true })
  const credential = GoogleAuthProvider.credential(result.credential?.idToken)
  await signInWithCredential(auth, credential)
  return auth.currentUser
}

// Sign out of the native plugin too (the JS SDK sign-out is handled by the caller).
export async function nativeSignOut() {
  try {
    await FirebaseAuthentication.signOut()
  } catch (e) {
    /* no-op */
  }
}
