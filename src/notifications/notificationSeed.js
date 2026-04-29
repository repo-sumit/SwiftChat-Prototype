// One-time seed of demo notifications so the prototype has realistic
// data on first run. Idempotent — checks a flag in localStorage and bails
// if it's already been seeded.

import { addNotification, loadAllNotifications } from './notificationStore.js'
import { NOTIFICATION_TYPES } from './notificationTypes.js'

const SEED_FLAG_KEY = 'swiftchat.notifications.seeded.v1'

function hoursAgo(h)   { return new Date(Date.now() - h * 3600 * 1000).toISOString() }
function minutesAgo(m) { return new Date(Date.now() - m * 60   * 1000).toISOString() }
function daysFromNow(d){ return new Date(Date.now() + d * 24 * 3600 * 1000).toISOString() }

// All seed entries are pre-delivered (deliveredAt set) so the scheduler
// doesn't re-toast them on first load.
function seed(partial) {
  return addNotification({
    ...partial,
    deliveredAt: partial.deliveredAt || partial.scheduledAt || new Date().toISOString(),
    createdBy: partial.createdBy || 'system',
    createdByRole: partial.createdByRole || 'system',
  })
}

export function seedNotificationsOnce() {
  try {
    if (typeof window === 'undefined') return
    const flag = window.localStorage.getItem(SEED_FLAG_KEY)
    if (flag) return
    // If notifications already exist (dev / migration) skip seeding too.
    if (loadAllNotifications().length > 0) {
      window.localStorage.setItem(SEED_FLAG_KEY, '1')
      return
    }

    // ── Teacher ────────────────────────────────────────────────────────────
    seed({
      type: NOTIFICATION_TYPES.BROADCAST,
      title: 'Namo Lakshmi deadline is tomorrow',
      message: 'Submit pending Namo Lakshmi applications by EOD tomorrow.',
      category: 'Namo Lakshmi / Namo Saraswati Deadline',
      priority: 'high',
      module: 'digivritti',
      targetRoles: ['teacher', 'principal'],
      createdByRole: 'state_secretary',
      action: { label: 'Open DigiVritti', type: 'OPEN_DIGIVRITTI_HOME' },
      scheduledAt: hoursAgo(2),
    })
    seed({
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'Application approved',
      message: 'Patel Kavya’s Namo Saraswati application was approved.',
      category: 'General',
      priority: 'normal',
      module: 'digivritti',
      targetRoles: ['teacher'],
      action: { label: 'View applications', type: 'OPEN_APPLICATION_LIST' },
      scheduledAt: hoursAgo(5),
    })
    seed({
      type: NOTIFICATION_TYPES.BROADCAST,
      title: 'XAMTA data entry pending for Class 6',
      message: 'Submit XAMTA scan results for Class 6 by this Friday.',
      category: 'XAMTA Data Entry',
      priority: 'normal',
      module: 'xamta',
      targetRoles: ['teacher'],
      createdByRole: 'state_secretary',
      action: { label: 'Open XAMTA', type: 'OPEN_XAMTA_SCAN' },
      scheduledAt: hoursAgo(20),
    })
    seed({
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'Attendance not submitted for Class 8',
      message: 'You have not marked attendance for Class 8 today.',
      category: 'Attendance',
      priority: 'high',
      module: 'attendance',
      targetRoles: ['teacher'],
      action: { label: 'Mark attendance', type: 'OPEN_MARK_ATTENDANCE' },
      scheduledAt: minutesAgo(40),
    })

    // ── CRC ────────────────────────────────────────────────────────────────
    seed({
      type: NOTIFICATION_TYPES.SYSTEM,
      title: '12 applications pending review',
      message: '12 DigiVritti applications are pending review in MADHAPAR cluster.',
      category: 'General',
      priority: 'high',
      module: 'digivritti',
      targetRoles: ['crc'],
      action: { label: 'Open pending', type: 'OPEN_CRC_PENDING_REVIEWS' },
      scheduledAt: hoursAgo(3),
    })
    seed({
      type: NOTIFICATION_TYPES.SYSTEM,
      title: '3 resubmitted applications',
      message: '3 resubmitted applications need re-review in your cluster.',
      category: 'General',
      priority: 'normal',
      module: 'digivritti',
      targetRoles: ['crc'],
      action: { label: 'Review applications', type: 'OPEN_APPLICATION_LIST' },
      scheduledAt: hoursAgo(7),
    })

    // ── PFMS ───────────────────────────────────────────────────────────────
    seed({
      type: NOTIFICATION_TYPES.SYSTEM,
      title: '8 failed payments are retry-eligible',
      message: '8 Aadhaar/IFSC failures from last batch are retry-eligible.',
      category: 'Payment / PFMS',
      priority: 'high',
      module: 'digivritti',
      targetRoles: ['pfms'],
      action: { label: 'Open payment queue', type: 'OPEN_PAYMENT_QUEUE' },
      scheduledAt: minutesAgo(30),
    })
    seed({
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'Batch BATCH-2025-08-001 completed',
      message: 'Batch BATCH-2025-08-001 completed with 8 failures and 142 successes.',
      category: 'Payment / PFMS',
      priority: 'normal',
      module: 'digivritti',
      targetRoles: ['pfms'],
      action: { label: 'Open payment queue', type: 'OPEN_PAYMENT_QUEUE' },
      scheduledAt: hoursAgo(6),
    })

    // ── State ──────────────────────────────────────────────────────────────
    seed({
      type: NOTIFICATION_TYPES.REMINDER,
      title: 'State dashboard review reminder',
      message: 'Daily state dashboard review at 4:00 PM.',
      category: 'General',
      priority: 'normal',
      module: 'dashboard',
      targetRoles: [],
      targetUserIds: ['SEC4001'],
      createdBy: 'SEC4001',
      createdByRole: 'state_secretary',
      action: { label: 'Open state dashboard', type: 'OPEN_STATE_DASHBOARD' },
      scheduledAt: hoursAgo(1),
    })
    seed({
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'Monsoon manual approval workload crossed threshold',
      message: 'Manual approval queue >150 — consider auto-approval review.',
      category: 'Important Announcement',
      priority: 'urgent',
      module: 'digivritti',
      targetRoles: ['state', 'state_secretary'],
      action: { label: 'Open analytics', type: 'OPEN_DIGIVRITTI_AI' },
      scheduledAt: minutesAgo(50),
    })

    // ── Principal ──────────────────────────────────────────────────────────
    seed({
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'School scholarship coverage report ready',
      message: 'Your school scholarship coverage report is available.',
      category: 'General',
      priority: 'normal',
      module: 'reports',
      targetRoles: ['principal'],
      action: { label: 'Open report', type: 'OPEN_REPORT_CARD' },
      scheduledAt: hoursAgo(12),
    })
    seed({
      type: NOTIFICATION_TYPES.SYSTEM,
      title: '6 pending scholarship drafts',
      message: 'Teachers in your school have 6 pending scholarship drafts.',
      category: 'General',
      priority: 'normal',
      module: 'digivritti',
      targetRoles: ['principal'],
      action: { label: 'Open applications', type: 'OPEN_APPLICATION_LIST' },
      scheduledAt: hoursAgo(18),
    })

    // ── Holiday + announcement (broadcast to all) ─────────────────────────
    seed({
      type: NOTIFICATION_TYPES.BROADCAST,
      title: 'Holiday: Mahatma Gandhi Jayanti',
      message: 'All schools closed on 02 Oct. Re-open 03 Oct.',
      category: 'Holiday',
      priority: 'normal',
      targetRoles: ['all'],
      createdByRole: 'state_secretary',
      scheduledAt: hoursAgo(48),
    })

    window.localStorage.setItem(SEED_FLAG_KEY, '1')
  } catch {
    /* swallow — seeding is best-effort */
  }
}

// Export the future-date helper for components/forms that need to schedule.
export { daysFromNow }
