// Targeting logic — does this notification apply to this user?
//
// Pure function. Used by the canvas list filter, scheduler, toast trigger,
// and unread-count derivation.

import { STATE_ROLES, normaliseRole } from './notificationTypes.js'

/**
 * @param {Notification} notification
 * @param {{ id?: string, role?: string }} user
 */
export function matchesNotificationTarget(notification, user) {
  if (!notification || !user) return false
  const role = normaliseRole(user.role)
  const userId = user.id

  const targetUserIds = notification.targetUserIds || []
  const targetRoles   = notification.targetRoles   || []

  // 1) Direct user-id targeting wins.
  if (userId && targetUserIds.includes(userId)) return true

  // 2) "all" matches anybody logged in.
  if (targetRoles.includes('all')) return true

  // 3) "not_state" matches everyone except state-tier users.
  if (targetRoles.includes('not_state') && !STATE_ROLES.includes(role)) return true

  // 4) Direct role match — including the 'state' alias for state_secretary.
  if (role && targetRoles.includes(role)) return true
  if (STATE_ROLES.includes(role) && targetRoles.includes('state')) return true

  return false
}

/**
 * Filter a notification list down to what's visible to this user, taking
 * dismiss state and (optionally) un-delivered scheduled items into account.
 */
export function visibleNotificationsFor(list, user, { includePending = false } = {}) {
  if (!Array.isArray(list) || !user) return []
  const now = Date.now()
  return list.filter(n => {
    if (!matchesNotificationTarget(n, user)) return false
    if (user.id && (n.dismissedBy || []).includes(user.id)) return false
    if (!includePending) {
      // Hide future-scheduled notifications until they're due.
      if (n.scheduledAt && new Date(n.scheduledAt).getTime() > now && !n.deliveredAt) {
        return false
      }
    }
    return true
  })
}

export function unreadCountFor(list, user) {
  return visibleNotificationsFor(list, user)
    .filter(n => !user.id || !(n.readBy || []).includes(user.id))
    .length
}
