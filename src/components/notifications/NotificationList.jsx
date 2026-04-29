import React from 'react'
import { BellOff } from 'lucide-react'
import NotificationItem from './NotificationItem'

export default function NotificationList({ items }) {
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
        <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center text-primary mb-3">
          <BellOff size={24} />
        </div>
        <div className="text-[14px] font-bold text-txt-primary">You're all caught up</div>
        <div className="text-[12px] text-txt-secondary mt-1 max-w-xs">
          No notifications in this view. Reminders you set will appear here when they're due.
        </div>
      </div>
    )
  }
  return (
    <div className="divide-y divide-bdr-light">
      {items.map(n => <NotificationItem key={n.id} notification={n} />)}
    </div>
  )
}
