import React from 'react'
import { Bell, X, ChevronRight } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { priorityClass } from '../../notifications/notificationTypes'

// Sliding banner-style toast that appears when a scheduled notification fires
// while the app is open. Shows title/message + a "View" link that opens the
// notifications canvas, plus an action shortcut if the notification has one.
export default function NotificationToast() {
  const {
    activeToast, dismissActiveToast,
    openNotificationsCanvas, triggerNotificationAction,
    markNotificationRead, closeNotificationsCanvas,
  } = useApp()
  if (!activeToast?.notification) return null
  const n = activeToast.notification
  const pri = priorityClass(n.priority)

  const handleView = () => {
    markNotificationRead(n.id)
    dismissActiveToast()
    openNotificationsCanvas()
  }

  const handleAction = (e) => {
    e.stopPropagation()
    markNotificationRead(n.id)
    const handled = triggerNotificationAction(n)
    if (handled) closeNotificationsCanvas()
    dismissActiveToast()
  }

  return (
    <div
      onClick={handleView}
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-[420px] cursor-pointer"
      style={{
        animation: 'fadeIn 0.18s ease, bubbleIn 0.18s ease',
      }}
      role="alert"
      aria-live="polite"
    >
      <div className="bg-white rounded-2xl shadow-modal border border-bdr-light overflow-hidden flex">
        <div className="w-1.5 flex-shrink-0" style={{ background: pri.dot }} />
        <div className="flex items-start gap-2 px-3 py-2.5 flex-1 min-w-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: pri.bg, color: pri.fg }}
          >
            <Bell size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <div className="text-[13px] font-bold text-txt-primary truncate flex-1">{n.title}</div>
              <button
                onClick={(e) => { e.stopPropagation(); dismissActiveToast() }}
                className="p-0.5 rounded-full text-txt-secondary active:bg-surface-secondary -mt-0.5"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
            {n.message && (
              <div className="text-[12px] text-txt-secondary leading-snug mt-0.5 line-clamp-2">
                {n.message}
              </div>
            )}
            {n.action && (
              <button
                onClick={handleAction}
                className="mt-1.5 text-[11.5px] font-bold text-primary inline-flex items-center gap-0.5"
              >
                {n.action.label || 'Open'}
                <ChevronRight size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
