// Self-hosted fonts (offline-ready, replaces the Google Fonts CDN <link>).
import '@fontsource/anton/400.css'
import '@fontsource/caveat/500.css'
import '@fontsource/caveat/600.css'
import '@fontsource/caveat/700.css'
import '@fontsource/hanken-grotesk/400.css'
import '@fontsource/hanken-grotesk/500.css'
import '@fontsource/hanken-grotesk/600.css'
import '@fontsource/hanken-grotesk/700.css'
import '@fontsource/hanken-grotesk/800.css'

import './assets/main.css'
import './assets/chalk-buttons.css'

import { createApp } from 'vue'
import App from './App.vue'
import { Capacitor } from '@capacitor/core'
import { installGlobalTapHaptics } from './services/haptics.js'

// Après un déploiement, un onglet resté ouvert (ou un index.html gardé en cache
// par le navigateur, le serveur n'envoie pas de Cache-Control) réclame des
// morceaux de code qui n'existent plus. On recharge, au plus une fois par minute
// pour ne jamais boucler si le serveur est vraiment en panne.
window.addEventListener('vite:preloadError', (event) => {
  try {
    const last = Number(sessionStorage.getItem('stonk-reload') || 0)
    if (Date.now() - last < 60000) return
    sessionStorage.setItem('stonk-reload', String(Date.now()))
  } catch (_) { /* stockage indisponible : on recharge quand même */ }
  event.preventDefault()
  window.location.reload()
})

createApp(App).mount('#app')

// Native (Capacitor) chrome: immersive status bar, splash hide, tap haptics.
if (Capacitor.isNativePlatform()) {
  installGlobalTapHaptics()
  Promise.all([
    import('@capacitor/status-bar'),
    import('@capacitor/splash-screen'),
  ])
    .then(([{ StatusBar, Style }, { SplashScreen }]) => {
      StatusBar.setOverlaysWebView({ overlay: true })
      StatusBar.setStyle({ style: Style.Dark }) // light text over the dark green background
      SplashScreen.hide()
    })
    .catch(() => {})
}
