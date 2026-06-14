// Thin wrapper around @capacitor/haptics. All calls are no-ops on the web
// (Capacitor.isNativePlatform() === false), so callers never need to guard.
import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

const enabled = Capacitor.isNativePlatform()

export function impactLight() {
  if (!enabled) return
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
}

export function notifySuccess() {
  if (!enabled) return
  Haptics.notification({ type: NotificationType.Success }).catch(() => {})
}

// Light tactile feedback on every button press, app-wide, without touching
// each component. Attached once at startup on native platforms only.
export function installGlobalTapHaptics() {
  if (!enabled) return
  document.addEventListener(
    'pointerdown',
    (e) => {
      const el = e.target && e.target.closest && e.target.closest('button')
      if (el && !el.disabled) impactLight()
    },
    { capture: true, passive: true }
  )
}
