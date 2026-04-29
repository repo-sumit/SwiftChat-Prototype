// Notification system — shared constants & type helpers.
//
// Pure, no-side-effect module. Imported by store, targeting, scheduler,
// components and the AppContext.

export const NOTIFICATION_TYPES = {
  BROADCAST: 'broadcast',
  REMINDER:  'reminder',
  SYSTEM:    'system',
}

export const NOTIFICATION_PRIORITIES = ['low', 'normal', 'high', 'urgent']

export const NOTIFICATION_CATEGORIES = [
  'Namo Lakshmi / Namo Saraswati Deadline',
  'XAMTA Data Entry',
  'Holiday',
  'Important Announcement',
  'Payment / PFMS',
  'Attendance',
  'General',
]

export const NOTIFICATION_MODULES = [
  'digivritti',
  'xamta',
  'attendance',
  'dashboard',
  'reports',
  'general',
]

// Audience options shown to State broadcasters. Internal id → label.
export const AUDIENCE_OPTIONS = [
  { id: 'all',        label: 'All users' },
  { id: 'teacher',    label: 'Teachers' },
  { id: 'state',      label: 'State' },
  { id: 'brc',        label: 'BRC' },
  { id: 'crc',        label: 'CRC' },
  { id: 'principal',  label: 'Principal' },
  { id: 'pfms',       label: 'PFMS' },
  { id: 'deo',        label: 'DEO' },
  { id: 'parent',     label: 'Parent' },
  { id: 'not_state',  label: 'Not a State (everyone except State)' },
]

// State-tier roles used by targeting (`not_state` excludes these).
export const STATE_ROLES = ['state', 'state_secretary']

// Roles that may broadcast to others.
export const BROADCAST_ROLES = ['state', 'state_secretary']

export function isStateRole(role) {
  return STATE_ROLES.includes(role)
}

export function canRoleBroadcast(role) {
  return BROADCAST_ROLES.includes(role)
}

// Normalise a role string. Some places use 'state' as alias for 'state_secretary'.
export function normaliseRole(role) {
  if (!role) return null
  return String(role).trim().toLowerCase()
}

// Build a fresh notification object with safe defaults.
export function makeNotification(partial = {}) {
  const now = new Date().toISOString()
  return {
    id:            partial.id || `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type:          partial.type || NOTIFICATION_TYPES.SYSTEM,
    title:         partial.title || '',
    message:       partial.message || '',
    category:      partial.category || 'General',
    priority:      partial.priority || 'normal',
    module:        partial.module || null,
    createdBy:     partial.createdBy || 'system',
    createdByRole: partial.createdByRole || 'system',
    targetRoles:   Array.isArray(partial.targetRoles) ? partial.targetRoles : [],
    targetUserIds: Array.isArray(partial.targetUserIds) ? partial.targetUserIds : [],
    scheduledAt:   partial.scheduledAt || now,
    deliveredAt:   partial.deliveredAt || null,
    expiresAt:     partial.expiresAt || null,
    action:        partial.action || null,
    readBy:        Array.isArray(partial.readBy) ? partial.readBy : [],
    dismissedBy:   Array.isArray(partial.dismissedBy) ? partial.dismissedBy : [],
    createdAt:     partial.createdAt || now,
    updatedAt:     partial.updatedAt || now,
  }
}

// Priority sort weight (urgent first).
export const PRIORITY_WEIGHT = { urgent: 4, high: 3, normal: 2, low: 1 }

export function priorityClass(priority) {
  switch (priority) {
    case 'urgent': return { bg: '#FFEBEE', fg: '#C62828', dot: '#E53935', label: 'Urgent' }
    case 'high':   return { bg: '#FFF3E0', fg: '#E65100', dot: '#F57C00', label: 'High' }
    case 'low':    return { bg: '#F0F4FA', fg: '#7383A5', dot: '#B8C0CC', label: 'Low' }
    default:       return { bg: '#EEF2FF', fg: '#345CCC', dot: '#386AF6', label: 'Normal' }
  }
}
