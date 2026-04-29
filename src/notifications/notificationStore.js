// Notification store — localStorage-backed CRUD layer.
//
// Mirrors the chatHistory module pattern: pure helpers (no React) so the
// scheduler, NLP layer, and AppContext can all share one source of truth.
//
// Storage shape:
//   swiftchat.notifications.v1   → Notification[]
//   swiftchat.notificationPrefs.v1 → { soundEnabled, lastSeenAt, ... }

import { makeNotification, PRIORITY_WEIGHT } from './notificationTypes.js'

const NOTIFS_KEY = 'swiftchat.notifications.v1'
const PREFS_KEY  = 'swiftchat.notificationPrefs.v1'

// ─── localStorage primitives ───────────────────────────────────────────────
function ls() {
  try { return typeof window === 'undefined' ? null : window.localStorage }
  catch { return null }
}
function readJson(key, fallback) {
  const s = ls(); if (!s) return fallback
  try {
    const raw = s.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch { return fallback }
}
function writeJson(key, value) {
  const s = ls(); if (!s) return
  try { s.setItem(key, JSON.stringify(value)) } catch { /* quota / disabled */ }
}

// ─── Public API ────────────────────────────────────────────────────────────
export function loadAllNotifications() {
  const arr = readJson(NOTIFS_KEY, [])
  return Array.isArray(arr) ? arr : []
}

export function saveAllNotifications(list) {
  writeJson(NOTIFS_KEY, Array.isArray(list) ? list : [])
}

export function loadPrefs() {
  return readJson(PREFS_KEY, { soundEnabled: true, audioUnlocked: false })
}

export function savePrefs(prefs) {
  writeJson(PREFS_KEY, prefs || {})
}

export function updatePrefs(patch) {
  const cur = loadPrefs()
  const next = { ...cur, ...(patch || {}) }
  savePrefs(next)
  return next
}

// Add a fully-formed notification (or partial — defaults will fill in).
// Returns the canonical, stored notification.
export function addNotification(partial) {
  const n = makeNotification(partial)
  const all = loadAllNotifications()
  // Guard against duplicate IDs (shouldn't happen, but be safe).
  const existing = all.findIndex(x => x.id === n.id)
  if (existing >= 0) all[existing] = n
  else all.push(n)
  saveAllNotifications(all)
  return n
}

export function removeNotification(id) {
  const all = loadAllNotifications().filter(n => n.id !== id)
  saveAllNotifications(all)
}

export function patchNotification(id, patch) {
  const all = loadAllNotifications()
  const idx = all.findIndex(n => n.id === id)
  if (idx < 0) return null
  const next = { ...all[idx], ...(patch || {}), updatedAt: new Date().toISOString() }
  all[idx] = next
  saveAllNotifications(all)
  return next
}

export function markRead(id, userId) {
  if (!userId) return null
  const all = loadAllNotifications()
  const idx = all.findIndex(n => n.id === id)
  if (idx < 0) return null
  const n = all[idx]
  if (!n.readBy.includes(userId)) {
    n.readBy = [...n.readBy, userId]
    n.updatedAt = new Date().toISOString()
    all[idx] = n
    saveAllNotifications(all)
  }
  return n
}

export function markAllRead(userId, predicate) {
  if (!userId) return 0
  const all = loadAllNotifications()
  let n = 0
  const now = new Date().toISOString()
  for (const item of all) {
    if (predicate && !predicate(item)) continue
    if (!item.readBy.includes(userId)) {
      item.readBy.push(userId)
      item.updatedAt = now
      n++
    }
  }
  if (n > 0) saveAllNotifications(all)
  return n
}

export function dismiss(id, userId) {
  if (!userId) return null
  const all = loadAllNotifications()
  const idx = all.findIndex(n => n.id === id)
  if (idx < 0) return null
  const n = all[idx]
  // For reminders that the user owns, full delete. Otherwise add to dismissedBy
  // so other recipients keep seeing it.
  const isOwnReminder = n.type === 'reminder' && n.createdBy === userId
  if (isOwnReminder) {
    all.splice(idx, 1)
    saveAllNotifications(all)
    return null
  }
  if (!n.dismissedBy.includes(userId)) {
    n.dismissedBy = [...n.dismissedBy, userId]
    n.updatedAt = new Date().toISOString()
    all[idx] = n
    saveAllNotifications(all)
  }
  return n
}

export function markDelivered(id) {
  return patchNotification(id, { deliveredAt: new Date().toISOString() })
}

// Newest-first, with priority bumping urgent items above same-time normals.
export function sortNotifications(list) {
  return [...list].sort((a, b) => {
    const dt = (b.scheduledAt || b.createdAt || '').localeCompare(a.scheduledAt || a.createdAt || '')
    if (dt !== 0) return dt
    return (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0)
  })
}
