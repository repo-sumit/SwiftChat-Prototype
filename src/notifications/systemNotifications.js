// System notification helper.
//
// Used by workflow code (DigiVritti approvals, PFMS retries, attendance
// gaps, XAMTA scans) to drop a notification into the user's bell without
// caring about UI. Returns the persisted notification object.

import { addNotification } from './notificationStore.js'
import { NOTIFICATION_TYPES } from './notificationTypes.js'

/**
 * createSystemNotification({
 *   userId, role, title, message,
 *   category, module, priority, action
 * })
 *
 * If both userId and role are omitted, the notification is broadcast to
 * everyone (targetRoles: ['all']).
 */
export function createSystemNotification({
  userId,
  role,
  title,
  message,
  category = 'General',
  module = null,
  priority = 'normal',
  action = null,
  scheduledAt = null,
} = {}) {
  const targetUserIds = userId ? [userId] : []
  const targetRoles = role ? [role] : (userId ? [] : ['all'])

  return addNotification({
    type: NOTIFICATION_TYPES.SYSTEM,
    title,
    message,
    category,
    priority,
    module,
    createdBy: 'system',
    createdByRole: 'system',
    targetRoles,
    targetUserIds,
    action,
    scheduledAt: scheduledAt || new Date().toISOString(),
  })
}
