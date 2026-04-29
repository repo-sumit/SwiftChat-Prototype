import React from 'react'

const TABS = [
  { id: 'all',        label: 'All' },
  { id: 'unread',     label: 'Unread' },
  { id: 'broadcast',  label: 'Broadcasts' },
  { id: 'reminder',   label: 'Reminders' },
  { id: 'system',     label: 'System' },
]

export default function NotificationFilters({ active, onChange, counts = {} }) {
  return (
    <div className="flex gap-1 px-2 py-2 border-b border-bdr-light overflow-x-auto scrollbar-hide flex-shrink-0 bg-white">
      {TABS.map(t => {
        const isActive = active === t.id
        const c = counts[t.id]
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`px-3 py-1.5 rounded-full flex-shrink-0 text-[12px] font-semibold transition-colors flex items-center gap-1 ${
              isActive
                ? 'bg-primary text-white'
                : 'bg-surface-secondary text-txt-secondary active:bg-bdr-light'
            }`}
          >
            {t.label}
            {typeof c === 'number' && c > 0 && (
              <span
                className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  isActive ? 'bg-white/25 text-white' : 'bg-bdr-light text-txt-primary'
                }`}
              >
                {c > 99 ? '99+' : c}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
