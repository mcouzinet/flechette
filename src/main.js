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
