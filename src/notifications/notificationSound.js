// Lightweight Web Audio beep for new/due notifications.
//
// Browsers gate AudioContext start until a user gesture. We lazily build
// the context on the first interaction-triggered call. If it's still
// suspended we silently no-op — the bell still shakes and the toast still
// appears, so the user doesn't lose information.

import { loadPrefs, updatePrefs } from './notificationStore.js'

let audioCtx = null

function ensureCtx() {
  if (typeof window === 'undefined') return null
  if (audioCtx) return audioCtx
  const Ctor = window.AudioContext || window.webkitAudioContext
  if (!Ctor) return null
  try { audioCtx = new Ctor() } catch { audioCtx = null }
  return audioCtx
}

// Mark audio as "unlocked" the first time the user gestures.
export function unlockAudioOnGesture() {
  const ctx = ensureCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      updatePrefs({ audioUnlocked: true })
    }).catch(() => { /* ignore */ })
  } else {
    updatePrefs({ audioUnlocked: true })
  }
}

/**
 * Play a short two-tone "buzz" sound. Returns true if it played, false if
 * suppressed (sound disabled, ctx unavailable, or autoplay-blocked).
 */
export function playNotificationSound({ urgent = false } = {}) {
  const prefs = loadPrefs()
  if (prefs.soundEnabled === false) return false

  const ctx = ensureCtx()
  if (!ctx) return false
  if (ctx.state === 'suspended') {
    // Best-effort resume; if blocked we just bail and let the bell animate.
    ctx.resume().catch(() => {})
    if (ctx.state === 'suspended') return false
  }

  try {
    const now = ctx.currentTime
    const tone = (freq, start, dur, gain) => {
      const osc = ctx.createOscillator()
      const g   = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      g.gain.setValueAtTime(0.0001, now + start)
      g.gain.exponentialRampToValueAtTime(gain, now + start + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur)
      osc.connect(g).connect(ctx.destination)
      osc.start(now + start)
      osc.stop(now + start + dur + 0.02)
    }
    if (urgent) {
      tone(880, 0,    0.12, 0.18)
      tone(660, 0.16, 0.12, 0.18)
      tone(880, 0.32, 0.16, 0.18)
    } else {
      tone(660, 0,    0.12, 0.16)
      tone(880, 0.13, 0.18, 0.16)
    }
    return true
  } catch {
    return false
  }
}

export function setSoundEnabled(enabled) {
  updatePrefs({ soundEnabled: !!enabled })
}

export function isSoundEnabled() {
  return loadPrefs().soundEnabled !== false
}
