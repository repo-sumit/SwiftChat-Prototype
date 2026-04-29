// Notification scheduler.
//
// Polls localStorage every 30s (and on demand). Any notification whose
// scheduledAt has passed and that has no deliveredAt yet is marked delivered.
// If the current user is a target, the scheduler emits a "due" event so the
// bell can shake, the toast can show, and the sound can play.
//
// Intentionally a tiny event-emitter (no React) so multiple consumers can
// subscribe without prop drilling.

import { loadAllNotifications, markDelivered } from './notificationStore.js'
import { matchesNotificationTarget } from './notificationTargeting.js'

let intervalId = null
let currentUser = null
const subscribers = new Set()
// Tracks which deliveredAt we've already toasted *in this session*.
// Prevents repeat-buzzing when a user logs in long after a reminder fired.
const sessionToasted = new Set()

function emit(notification) {
  for (const fn of subscribers) {
    try { fn(notification) } catch { /* ignore subscriber errors */ }
  }
}

export function setSchedulerUser(user) {
  currentUser = user || null
  // When the user changes, treat already-delivered items as "seen" so they
  // don't re-toast on next tick.
  sessionToasted.clear()
  for (const n of loadAllNotifications()) {
    if (n.deliveredAt) sessionToasted.add(n.id)
  }
}

export function subscribeScheduler(fn) {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

export function tickScheduler() {
  const all = loadAllNotifications()
  const now = Date.now()
  for (const n of all) {
    if (!n.scheduledAt) continue
    if (n.deliveredAt) continue
    const due = new Date(n.scheduledAt).getTime() <= now
    if (!due) continue

    // Mark delivered in storage so we don't fire again across reloads.
    markDelivered(n.id)
    n.deliveredAt = new Date().toISOString()

    // Fire toast/sound only if this user is a recipient AND we haven't
    // toasted it during this session.
    if (currentUser && matchesNotificationTarget(n, currentUser) && !sessionToasted.has(n.id)) {
      sessionToasted.add(n.id)
      emit(n)
    }
  }
}

export function startScheduler({ user, intervalMs = 30000 } = {}) {
  if (user) setSchedulerUser(user)
  // Run an immediate tick on boot so a reminder due at login fires now.
  tickScheduler()
  if (intervalId) clearInterval(intervalId)
  intervalId = setInterval(tickScheduler, intervalMs)
  return () => stopScheduler()
}

export function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}
