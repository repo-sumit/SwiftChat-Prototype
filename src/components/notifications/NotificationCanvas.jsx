import React, { useEffect, useMemo, useState } from 'react'
import { X, Plus, Megaphone, CheckCheck } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { canRoleBroadcast } from '../../notifications/notificationTypes'
import NotificationFilters from './NotificationFilters'
import NotificationList from './NotificationList'
import CreateReminderForm from './CreateReminderForm'
import CreateBroadcastForm from './CreateBroadcastForm'

// Renders the notifications panel — full-screen on mobile, right-side panel
// on desktop. Mounted globally at app root so any page can open it via
// `openNotificationsCanvas()`.
export default function NotificationCanvas() {
  const {
    notificationsOpen, closeNotificationsCanvas,
    visibleNotifications, userId, role,
    markAllNotificationsRead,
  } = useApp()
  const [tab, setTab]   = useState('all')
  const [view, setView] = useState('list') // 'list' | 'reminder' | 'broadcast'
  const [prefill, setPrefill] = useState(null)

  // Listen for NLP-driven deep-link / op events.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onView = (e) => {
      const v = e?.detail?.view
      if (v === 'reminder' || v === 'broadcast') setView(v)
      if (e?.detail?.prefill) setPrefill(e.detail.prefill)
    }
    const onMarkAll = () => markAllNotificationsRead()
    window.addEventListener('swiftchat:notifications:view', onView)
    window.addEventListener('swiftchat:notifications:markAllRead', onMarkAll)
    return () => {
      window.removeEventListener('swiftchat:notifications:view', onView)
      window.removeEventListener('swiftchat:notifications:markAllRead', onMarkAll)
    }
  }, [markAllNotificationsRead])

  // Reset internal view when panel closes.
  useEffect(() => {
    if (!notificationsOpen) {
      setView('list')
      setPrefill(null)
      setTab('all')
    }
  }, [notificationsOpen])

  const filtered = useMemo(() => {
    const base = visibleNotifications || []
    switch (tab) {
      case 'unread':
        return base.filter(n => !userId || !(n.readBy || []).includes(userId))
      case 'broadcast':
        return base.filter(n => n.type === 'broadcast')
      case 'reminder':
        return base.filter(n => n.type === 'reminder')
      case 'system':
        return base.filter(n => n.type === 'system')
      default:
        return base
    }
  }, [visibleNotifications, tab, userId])

  const counts = useMemo(() => {
    const c = { all: 0, unread: 0, broadcast: 0, reminder: 0, system: 0 }
    for (const n of (visibleNotifications || [])) {
      c.all++
      if (!userId || !(n.readBy || []).includes(userId)) c.unread++
      if (n.type in c) c[n.type]++
    }
    return c
  }, [visibleNotifications, userId])

  if (!notificationsOpen) return null

  const showBroadcastBtn = canRoleBroadcast(role)

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 z-[60]"
        onClick={closeNotificationsCanvas}
      />

      {/* Panel — full-width on mobile, right-side on desktop */}
      <div className="absolute inset-y-0 right-0 z-[70] flex flex-col bg-white animate-canvas-slide overflow-hidden border-l border-bdr-light shadow-canvas
                      w-full md:w-[60%] lg:w-[480px] xl:w-[520px] max-w-full">
        {view === 'list' && (
          <>
            {/* Header */}
            <div className="h-14 flex items-center gap-2 px-3 border-b border-bdr-light flex-shrink-0 bg-white">
              <button
                onClick={closeNotificationsCanvas}
                className="w-10 h-10 flex items-center justify-center rounded-full text-txt-secondary active:bg-surface-secondary"
                aria-label="Close"
              >
                <X size={20} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold text-txt-primary truncate">Notifications</div>
                <div className="text-[11px] text-txt-secondary">
                  {counts.unread > 0 ? `${counts.unread} unread` : 'You\'re all caught up'}
                </div>
              </div>
              {counts.unread > 0 && (
                <button
                  onClick={markAllNotificationsRead}
                  className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold text-primary active:bg-primary-light flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
            </div>

            {/* Tabs */}
            <NotificationFilters active={tab} onChange={setTab} counts={counts} />

            {/* List */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-white">
              <NotificationList items={filtered} />
            </div>

            {/* Footer actions */}
            <div className="flex-shrink-0 border-t border-bdr-light px-3 py-2.5 bg-white flex items-center gap-2">
              <button
                onClick={() => setView('reminder')}
                className="flex-1 px-3 py-2.5 rounded-full bg-primary text-white text-[12.5px] font-bold active:bg-primary-dark flex items-center justify-center gap-1.5"
              >
                <Plus size={15} />
                Add Reminder
              </button>
              {showBroadcastBtn && (
                <button
                  onClick={() => setView('broadcast')}
                  className="flex-1 px-3 py-2.5 rounded-full bg-white border-[1.5px] border-primary text-primary text-[12.5px] font-bold active:bg-primary-light flex items-center justify-center gap-1.5"
                >
                  <Megaphone size={15} />
                  Create Broadcast
                </button>
              )}
            </div>
          </>
        )}

        {view === 'reminder' && (
          <CreateReminderForm
            onBack={() => setView('list')}
            onDone={() => { setView('list'); setPrefill(null) }}
            prefill={prefill || {}}
          />
        )}

        {view === 'broadcast' && showBroadcastBtn && (
          <CreateBroadcastForm
            onBack={() => setView('list')}
            onDone={() => { setView('list'); setPrefill(null) }}
            prefill={prefill || {}}
          />
        )}
      </div>
    </>
  )
}
