import React from 'react'
import { Trash2, ChevronRight } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { priorityClass } from '../../notifications/notificationTypes'

function timeAgo(iso) {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  const diff = Date.now() - t
  if (diff < 0) {
    // Future scheduled — show date/time.
    return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7)   return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

const TYPE_LABEL = { broadcast: 'Broadcast', reminder: 'Reminder', system: 'System' }

export default function NotificationItem({ notification }) {
  const { userId, markNotificationRead, dismissNotification, triggerNotificationAction, closeNotificationsCanvas } = useApp()
  const n = notification
  const isUnread = !!userId && !(n.readBy || []).includes(userId)
  const pri      = priorityClass(n.priority)
  const typeLbl  = TYPE_LABEL[n.type] || 'Notification'

  const handleClick = () => {
    if (isUnread) markNotificationRead(n.id)
  }

  const handleAction = (e) => {
    e.stopPropagation()
    if (isUnread) markNotificationRead(n.id)
    const handled = triggerNotificationAction(n)
    if (handled) closeNotificationsCanvas()
  }

  const handleDismiss = (e) => {
    e.stopPropagation()
    dismissNotification(n.id)
  }

  return (
    <div
      onClick={handleClick}
      className={`relative px-4 py-3 border-b border-bdr-light cursor-pointer transition-colors ${
        isUnread ? 'bg-primary-light/40' : 'bg-white'
      } active:bg-surface-secondary`}
    >
      {/* Left blue accent for unread */}
      {isUnread && (
        <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
      )}

      <div className="flex items-start gap-2.5">
        {/* Priority dot */}
        <span
          className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: pri.dot }}
          aria-hidden
        />

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start gap-2">
            <div className={`text-[13.5px] leading-5 ${isUnread ? 'font-bold text-txt-primary' : 'font-semibold text-txt-primary'} truncate`}>
              {n.title}
            </div>
            <div className="ml-auto text-[10.5px] text-txt-secondary whitespace-nowrap pl-2">
              {timeAgo(n.scheduledAt || n.createdAt)}
            </div>
          </div>

          {/* Message */}
          {n.message && (
            <div className="text-[12.5px] text-txt-secondary mt-0.5 leading-5 line-clamp-2">
              {n.message}
            </div>
          )}

          {/* Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: pri.bg, color: pri.fg }}
            >
              {pri.label}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-secondary text-txt-secondary">
              {typeLbl}
            </span>
            {n.category && n.category !== 'General' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-secondary text-txt-secondary">
                {n.category}
              </span>
            )}
            {n.module && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary-light text-primary">
                {n.module}
              </span>
            )}
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-2 mt-2.5">
            {n.action && (
              <button
                onClick={handleAction}
                className="px-3 py-1.5 rounded-full text-[11.5px] font-bold border-[1.5px] border-primary text-primary bg-white active:bg-primary active:text-white transition-colors flex items-center gap-1"
              >
                {n.action.label || 'Open'}
                <ChevronRight size={13} />
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="ml-auto p-1.5 rounded-full text-txt-secondary active:bg-surface-secondary"
              aria-label="Dismiss"
              title="Dismiss"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
