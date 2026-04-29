import React, { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { NOTIFICATION_PRIORITIES, NOTIFICATION_MODULES } from '../../notifications/notificationTypes'

function pad(n) { return String(n).padStart(2, '0') }
function defaultDate() {
  const d = new Date(Date.now() + 60 * 60 * 1000) // 1h from now
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function defaultTime() {
  const d = new Date(Date.now() + 60 * 60 * 1000)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function CreateReminderForm({ onBack, onDone, prefill = {} }) {
  const { createReminder, showToast } = useApp()
  const [title, setTitle]       = useState(prefill.title || '')
  const [message, setMessage]   = useState(prefill.message || '')
  const [date, setDate]         = useState(prefill.date || defaultDate())
  const [time, setTime]         = useState(prefill.time || defaultTime())
  const [priority, setPriority] = useState(prefill.priority || 'normal')
  const [moduleId, setModuleId] = useState(prefill.module || '')
  const [error, setError]       = useState('')

  const submit = (e) => {
    e?.preventDefault?.()
    if (!title.trim()) { setError('Title is required'); return }
    if (!date || !time) { setError('Date and time are required'); return }
    const scheduledAt = new Date(`${date}T${time}:00`).toISOString()
    const n = createReminder({
      title: title.trim(),
      message: message.trim(),
      priority,
      module: moduleId || null,
      category: 'General',
      scheduledAt,
    })
    if (!n) { setError('Could not save reminder'); return }
    showToast('Reminder set', 'ok')
    onDone?.(n)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="h-12 px-2 flex items-center gap-1 flex-shrink-0 border-b border-bdr-light">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full text-txt-primary active:bg-surface-secondary">
          <ArrowLeft size={18} />
        </button>
        <div className="text-[14px] font-bold text-txt-primary">Add Reminder</div>
      </div>

      <form onSubmit={submit} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        <Field label="Title">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Review Namo Saraswati pending approvals"
            className="w-full px-3 py-2.5 text-[13.5px] rounded-xl border border-bdr bg-white text-txt-primary outline-none focus:border-primary"
            autoFocus
          />
        </Field>

        <Field label="Message / topic">
          <textarea
            rows={3}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Add details for this reminder…"
            className="w-full px-3 py-2.5 text-[13.5px] rounded-xl border border-bdr bg-white text-txt-primary outline-none focus:border-primary resize-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2.5 text-[13.5px] rounded-xl border border-bdr bg-white text-txt-primary outline-none focus:border-primary"
            />
          </Field>
          <Field label="Time">
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full px-3 py-2.5 text-[13.5px] rounded-xl border border-bdr bg-white text-txt-primary outline-none focus:border-primary"
            />
          </Field>
        </div>

        <Field label="Priority">
          <div className="flex flex-wrap gap-1.5">
            {NOTIFICATION_PRIORITIES.map(p => (
              <button
                type="button"
                key={p}
                onClick={() => setPriority(p)}
                className={`px-3 py-1.5 rounded-full text-[11.5px] font-semibold border-[1.5px] capitalize ${
                  priority === p
                    ? 'border-primary bg-primary text-white'
                    : 'border-bdr text-txt-secondary bg-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Module (optional)">
          <select
            value={moduleId}
            onChange={e => setModuleId(e.target.value)}
            className="w-full px-3 py-2.5 text-[13.5px] rounded-xl border border-bdr bg-white text-txt-primary outline-none focus:border-primary"
          >
            <option value="">None</option>
            {NOTIFICATION_MODULES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>

        {error && (
          <div className="text-[12px] text-danger bg-danger-light/40 px-3 py-2 rounded-xl">{error}</div>
        )}

        <button
          type="submit"
          className="mt-2 px-4 py-3 rounded-full bg-primary text-white text-[13.5px] font-bold active:bg-primary-dark transition-colors"
        >
          Set reminder
        </button>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wide">{label}</span>
      {children}
    </label>
  )
}
