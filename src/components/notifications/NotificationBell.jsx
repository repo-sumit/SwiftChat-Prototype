import React, { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { useApp } from '../../context/AppContext'

// Icon-button bell with red unread badge. Shakes when `bellShake` ticks
// up (driven by the scheduler emitting a "due" event in AppContext).
//
// Intentionally self-contained: no portal, no global CSS leak. The bell-shake
// keyframes are inlined as a <style> block scoped by id so we don't need a
// tailwind config change to ship the animation.
export default function NotificationBell({ size = 20, className = '', dark = false }) {
  const { unreadNotifications, openNotificationsCanvas, bellShake, isAuthenticated } = useApp()
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (!bellShake) return
    setShake(true)
    const t = setTimeout(() => setShake(false), 1400)
    return () => clearTimeout(t)
  }, [bellShake])

  if (!isAuthenticated) return null

  const count = unreadNotifications
  const badge = count > 99 ? '99+' : String(count)

  const btnCls = dark
    ? 'text-white active:bg-white/15'
    : 'text-txt-primary active:bg-surface-secondary'

  return (
    <>
      <style>{`
        @keyframes notif-bell-buzz {
          0%   { transform: rotate(0deg); }
          15%  { transform: rotate(14deg); }
          30%  { transform: rotate(-12deg); }
          45%  { transform: rotate(10deg); }
          60%  { transform: rotate(-8deg); }
          75%  { transform: rotate(5deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
      <button
        onClick={openNotificationsCanvas}
        className={`relative w-11 h-11 flex items-center justify-center rounded-full transition-colors ${btnCls} ${className}`}
        aria-label={`Notifications${count ? `, ${count} unread` : ''}`}
        title={count ? `${count} unread notification${count === 1 ? '' : 's'}` : 'Notifications'}
      >
        <span
          className="inline-flex"
          style={{
            transformOrigin: '50% 0%',
            animation: shake ? 'notif-bell-buzz 0.6s ease-in-out 2' : 'none',
          }}
        >
          <Bell size={size} />
        </span>
        {count > 0 && (
          <span
            className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center pointer-events-none"
            style={{ background: '#E53935', boxShadow: '0 0 0 2px #fff' }}
          >
            {badge}
          </span>
        )}
      </button>
    </>
  )
}
