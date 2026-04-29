import React, { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import {
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_MODULES,
  AUDIENCE_OPTIONS,
} from '../../notifications/notificationTypes'

function pad(n) { return String(n).padStart(2, '0') }
function defaultDate() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function defaultTime() {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const ACTION_PRESETS = [
  { type: '',                          label: 'No action' },
  { type: 'OPEN_DIGIVRITTI_HOME',      label: 'Open DigiVritti' },
  { type: 'OPEN_NAMO_LAKSHMI',         label: 'Open Namo Lakshmi' },
  { type: 'OPEN_NAMO_SARASWATI',       label: 'Open Namo Saraswati' },
  { type: 'OPEN_APPLICATION_LIST',     label: 'Open application list' },
  { type: 'OPEN_PAYMENT_QUEUE',        label: 'Open payment queue' },
  { type: 'OPEN_CRC_PENDING_REVIEWS',  label: 'View pending approvals' },
  { type: 'OPEN_XAMTA_SCAN',           label: 'Open XAMTA' },
  { type: 'OPEN_MARK_ATTENDANCE',      label: 'Mark attendance' },
  { type: 'OPEN_STATE_DASHBOARD',      label: 'Open state dashboard' },
  { type: 'OPEN_SCHOOL_DASHBOARD',     label: 'Open school dashboard' },
  { type: 'OPEN_REPORT_CARD',          label: 'Open report card' },
]

export default function CreateBroadcastForm({ onBack, onDone, prefill = {} }) {
  const { createBroadcastNotification, showToast } = useApp()
  const [title, setTitle]         = useState(prefill.title || '')
  const [message, setMessage]     = useState(prefill.message || '')
  const [category, setCategory]   = useState(prefill.category || NOTIFICATION_CATEGORIES[0])
  const [audience, setAudience]   = useState(prefill.targetRoles?.[0] || 'teacher')
  const [date, setDate]           = useState(prefill.date || defaultDate())
  const [time, setTime]           = useState(prefill.time || defaultTime())
  const [priority, setPriority]   = useState(prefill.priority || 'normal')
  const [moduleId, setModuleId]   = useState(prefill.module || '')
  const [actionType, setActionType] = useState(prefill.action?.type || '')
  const [actionLabel, setActionLabel] = useState(prefill.action?.label || '')
  const [error, setError]         = useState('')

  const submit = (e) => {
    e?.preventDefault?.()
    if (!title.trim())   { setError('Title is required'); return }
    if (!message.trim()) { setError('Message is required'); return }
    if (!date || !time)  { setError('Date and time are required'); return }
    const scheduledAt = new Date(`${date}T${time}:00`).toISOString()
    const isFuture = new Date(scheduledAt).getTime() > Date.now() + 30000
    const action = actionType ? {
      label: actionLabel || (ACTION_PRESETS.find(p => p.type === actionType)?.label || 'Open'),
      type: actionType,
    } : null

    const n = createBroadcastNotification({
      title: title.trim(),
      message: message.trim(),
      category,
      priority,
      module: moduleId || null,
      targetRoles: [audience],
      scheduledAt,
      action,
    })
    if (!n) { setError('Only State users can broadcast'); return }
    showToast(isFuture ? 'Notification scheduled successfully.' : 'Notification sent successfully.', 'ok')
    onDone?.(n)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="h-12 px-2 flex items-center gap-1 flex-shrink-0 border-b border-bdr-light">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full text-txt-primary active:bg-surface-secondary">
          <ArrowLeft size={18} />
        </button>
        <div className="text-[14px] font-bold text-txt-primary">Create Broadcast</div>
      </div>

      <form onSubmit={submit} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        <Field label="Title">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Namo Lakshmi deadline tomorrow"
            className="w-full px-3 py-2.5 text-[13.5px] rounded-xl border border-bdr bg-white text-txt-primary outline-none focus:border-primary"
            autoFocus
          />
        </Field>

        <Field label="Message">
          <textarea
            rows={3}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Submit pending applications by EOD tomorrow."
            className="w-full px-3 py-2.5 text-[13.5px] rounded-xl border border-bdr bg-white text-txt-primary outline-none focus:border-primary resize-none"
          />
        </Field>

        <Field label="Category">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-2.5 text-[13.5px] rounded-xl border border-bdr bg-white text-txt-primary outline-none focus:border-primary"
          >
            {NOTIFICATION_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        <Field label="Target audience">
          <select
            value={audience}
            onChange={e => setAudience(e.target.value)}
            className="w-full px-3 py-2.5 text-[13.5px] rounded-xl border border-bdr bg-white text-txt-primary outline-none focus:border-primary"
          >
            {AUDIENCE_OPTIONS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
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

        <Field label="Action link (optional)">
          <select
            value={actionType}
            onChange={e => setActionType(e.target.value)}
            className="w-full px-3 py-2.5 text-[13.5px] rounded-xl border border-bdr bg-white text-txt-primary outline-none focus:border-primary"
          >
            {ACTION_PRESETS.map(a => <option key={a.type || 'none'} value={a.type}>{a.label}</option>)}
          </select>
        </Field>
        {actionType && (
          <Field label="Action button label">
            <input
              type="text"
              value={actionLabel}
              onChange={e => setActionLabel(e.target.value)}
              placeholder={ACTION_PRESETS.find(p => p.type === actionType)?.label || 'Open'}
              className="w-full px-3 py-2.5 text-[13.5px] rounded-xl border border-bdr bg-white text-txt-primary outline-none focus:border-primary"
            />
          </Field>
        )}

        {error && (
          <div className="text-[12px] text-danger bg-danger-light/40 px-3 py-2 rounded-xl">{error}</div>
        )}

        <button
          type="submit"
          className="mt-2 px-4 py-3 rounded-full bg-primary text-white text-[13.5px] font-bold active:bg-primary-dark transition-colors"
        >
          Send broadcast
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
