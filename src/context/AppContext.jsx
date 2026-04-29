import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { USER_PROFILES } from '../data/mockData'
import * as chatHistory from '../utils/chatHistory'
import * as notifStore from '../notifications/notificationStore'
import { NOTIFICATION_TYPES, canRoleBroadcast } from '../notifications/notificationTypes'
import { matchesNotificationTarget, visibleNotificationsFor, unreadCountFor } from '../notifications/notificationTargeting'
import { startScheduler, stopScheduler, subscribeScheduler, setSchedulerUser, tickScheduler } from '../notifications/notificationScheduler'
import { playNotificationSound, unlockAudioOnGesture } from '../notifications/notificationSound'
import { seedNotificationsOnce } from '../notifications/notificationSeed'

const AppContext = createContext(null)

// localStorage key for persistent session.
// Bumping the version invalidates older shapes when the schema changes.
const SESSION_KEY = 'swiftchat.session.v1'

// ─── Persistence helpers ────────────────────────────────────────────────────
// Self-contained read/write so any caller can see the same shape.
function safeLocalStorage() {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

function loadSession() {
  const ls = safeLocalStorage()
  if (!ls) return null
  try {
    const raw = ls.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    // Reject sessions that don't carry a recognised role — defends against
    // stale/corrupt entries that would block the user on a half-state.
    if (!parsed.role) return null
    return parsed
  } catch {
    return null
  }
}

function saveSession(state) {
  const ls = safeLocalStorage()
  if (!ls) return
  try {
    ls.setItem(SESSION_KEY, JSON.stringify(state))
  } catch {
    /* quota / disabled — silently degrade */
  }
}

function clearSession() {
  const ls = safeLocalStorage()
  if (!ls) return
  try { ls.removeItem(SESSION_KEY) } catch { /* noop */ }
}

// Lazy initialiser — ensures `loadSession()` is called exactly once during
// the first render of the provider, never again, and the result is captured
// inside React state so subsequent renders read from state, not storage.
const PERSISTED = loadSession()

export function AppProvider({ children }) {
  // Hydrate from localStorage on first render. If a valid persisted session
  // exists with a role, restore everything (including the last screen).
  // Otherwise start at the splash screen as a fresh anonymous session.
  const [screen, setScreen]               = useState(() => PERSISTED?.screen || 'splash')
  const [stack, setStack]                 = useState(() => PERSISTED?.stack  || [PERSISTED?.screen || 'splash'])
  const [role, setRoleRaw]                = useState(() => PERSISTED?.role || null)
  const [userProfile, setUserProfile]     = useState(() => PERSISTED?.userProfile || null)
  const [lang, setLang]                   = useState(() => PERSISTED?.lang || 'en')
  const [ssoState, setSsoState]           = useState(() => PERSISTED?.ssoState || 'Gujarat')
  const [toast, setToast]                 = useState({ message: '', type: '', visible: false })
  const [call, setCall]                   = useState(null)
  const [canvasOpen, setCanvasOpen]       = useState(false)
  const [canvasContext, setCanvasContext] = useState(null)
  const toastTimer = useRef(null)
  // Tracks whether the user has explicitly logged out — prevents the
  // persistence effect from re-saving stale state during the sign-out tear-down.
  const signingOut = useRef(false)

  // ── Chat history (per-user, localStorage-backed) ──────────────────────────
  // userId derived from the profile's stateId/employeeId, falling back to
  // role. Keys all chat sessions so different users never see each other's.
  const userId = chatHistory.userIdFor(userProfile, role)
  // `chatTick` is bumped to force consumers to re-read from localStorage
  // after any mutation routed through the helpers below.
  const [chatTick, setChatTick] = useState(0)
  const bumpChats = useCallback(() => setChatTick(t => t + 1), [])
  const [activeChatId, setActiveChatIdState] = useState(() =>
    role ? chatHistory.getActiveChatId(chatHistory.userIdFor(userProfile, role)) : null
  )

  const refreshActiveChat = useCallback(() => {
    if (!role) { setActiveChatIdState(null); return null }
    const uid = chatHistory.userIdFor(userProfile, role)
    const id  = chatHistory.getActiveChatId(uid)
    setActiveChatIdState(id)
    return id
  }, [role, userProfile])

  // Re-read the active chat pointer whenever the logged-in user changes.
  useEffect(() => { refreshActiveChat() }, [refreshActiveChat])

  const userChats = useMemo(() => {
    if (!role) return []
    return chatHistory.getChatsForUser(userId)
    // chatTick re-evaluates after mutations; userId switches the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, role, chatTick])

  const activeChat = useMemo(() => {
    if (!activeChatId) return null
    return chatHistory.getChatById(activeChatId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId, chatTick])

  const createChat = useCallback((opts = {}) => {
    if (!role) return null
    const uid = chatHistory.userIdFor(userProfile, role)
    const chat = chatHistory.createChat({
      userId: uid, role,
      title: opts.title,
      tool: opts.tool,
      initialMessages: opts.initialMessages,
    })
    setActiveChatIdState(chat.id)
    bumpChats()
    return chat
  }, [role, userProfile, bumpChats])

  const switchChat = useCallback((chatId) => {
    if (!role || !chatId) return
    const uid = chatHistory.userIdFor(userProfile, role)
    chatHistory.setActiveChatId(uid, chatId)
    setActiveChatIdState(chatId)
    bumpChats()
  }, [role, userProfile, bumpChats])

  const appendMessage = useCallback((chatId, message) => {
    if (!chatId) return null
    const result = chatHistory.appendMessage(chatId, message)
    bumpChats()
    return result
  }, [bumpChats])

  const setChatMessages = useCallback((chatId, messages) => {
    if (!chatId) return null
    const result = chatHistory.setMessages(chatId, messages)
    bumpChats()
    return result
  }, [bumpChats])

  const updateChatCanvas = useCallback((chatId, canvasState) => {
    if (!chatId) return null
    const result = chatHistory.updateCanvas(chatId, canvasState)
    bumpChats()
    return result
  }, [bumpChats])

  const updateChatToolState = useCallback((chatId, toolState) => {
    if (!chatId) return null
    const result = chatHistory.updateToolState(chatId, toolState)
    bumpChats()
    return result
  }, [bumpChats])

  const renameChat = useCallback((chatId, title) => {
    chatHistory.renameChat(chatId, title); bumpChats()
  }, [bumpChats])

  const deleteChat = useCallback((chatId) => {
    chatHistory.deleteChat(chatId); bumpChats()
    // If we deleted the active chat, refresh the pointer.
    if (chatId === activeChatId) {
      const uid = chatHistory.userIdFor(userProfile, role)
      const next = chatHistory.getActiveChatId(uid)
      setActiveChatIdState(next)
    }
  }, [activeChatId, role, userProfile, bumpChats])

  // Persist on every change to durable state. We DO NOT clear the session
  // here when role becomes null — that path is owned exclusively by
  // signOut(), so anonymous splash/login flows never wipe a fresh session.
  useEffect(() => {
    if (signingOut.current) return            // sign-out path clears explicitly
    if (!role) return                          // pre-login: nothing to persist yet
    saveSession({ screen, stack, role, userProfile, lang, ssoState })
  }, [screen, stack, role, userProfile, lang, ssoState])

  // Unified role setter — also loads matching profile from mock data
  const setRole = useCallback((r) => {
    setRoleRaw(r)
    setUserProfile(r ? (USER_PROFILES[r] ?? null) : null)
  }, [])

  const navigate = useCallback((id, replace = false) => {
    setStack(s => replace ? [...s.slice(0, -1), id] : [...s, id])
    setScreen(id)
  }, [])

  const goBack = useCallback(() => {
    setStack(s => {
      if (s.length <= 1) return s
      const next = s.slice(0, -1)
      setScreen(next[next.length - 1])
      return next
    })
  }, [])

  const showToast = useCallback((message, type = '') => {
    setToast({ message, type, visible: true })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => {
      setToast(t => ({ ...t, visible: false }))
    }, 2600)
  }, [])

  // Explicit sign-out — the ONLY path that clears the persisted session.
  const signOut = useCallback(() => {
    signingOut.current = true
    clearSession()
    setRoleRaw(null)
    setUserProfile(null)
    setStack(['splash'])
    setScreen('splash')
    setCanvasOpen(false)
    setCanvasContext(null)
    setCall(null)
    setNotificationsOpen(false)
    setActiveToast(null)
    stopScheduler()
    // Allow the persistence effect to resume for the next session.
    setTimeout(() => { signingOut.current = false }, 0)
  }, [])

  const openCall    = useCallback((chatId, botName) => setCall({ chatId, botName, active: true }), [])
  const endCall     = useCallback(() => setCall(null), [])
  // Intercept the special 'notifications' canvas type so NLP/action-registry
  // payloads (`{ type: 'notifications', view? }`) route to the global
  // notifications panel instead of CanvasPanel.
  const openCanvas  = useCallback((ctx = null) => {
    if (ctx && ctx.type === 'notifications') {
      setNotificationsOpen(true)
      // The notifications panel manages its own internal view state; if
      // future NLP wants a deep-link, surface it on window for the panel
      // to pick up. For now we just open the list.
      if (ctx.op === 'mark_all_read' && typeof window !== 'undefined') {
        try { window.dispatchEvent(new CustomEvent('swiftchat:notifications:markAllRead')) } catch { /* noop */ }
      }
      if (ctx.view && typeof window !== 'undefined') {
        try { window.dispatchEvent(new CustomEvent('swiftchat:notifications:view', { detail: { view: ctx.view, prefill: ctx.prefill } })) } catch { /* noop */ }
      }
      return
    }
    setCanvasContext(ctx); setCanvasOpen(true)
  }, [])
  const closeCanvas = useCallback(() => setCanvasOpen(false), [])
  const updateCanvas = useCallback((patch) => setCanvasContext(c => ({ ...(c || {}), ...patch })), [])

  // ── Notifications ──────────────────────────────────────────────────────────
  // Self-contained slice: one tick counter forces consumers to re-derive
  // their lists from localStorage. Keeps the store as the single source of
  // truth and avoids splitting state across React + storage.
  const [notifTick, setNotifTick]     = useState(0)
  const bumpNotifs                    = useCallback(() => setNotifTick(t => t + 1), [])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [activeToast, setActiveToast]             = useState(null) // { notification }
  const toastClearTimer = useRef(null)
  // Bell shake / urgency pulse trigger.
  const [bellShake, setBellShake]     = useState(0)

  // Seed once on first load.
  useEffect(() => { seedNotificationsOnce() }, [])

  // Build a stable user object for targeting/scheduling.
  const notifUser = useMemo(() => {
    if (!role) return null
    return { id: userId, role }
  }, [role, userId])

  // Drive the scheduler — re-bind whenever the user changes, tear down
  // on sign-out.
  useEffect(() => {
    if (!notifUser) { stopScheduler(); return }
    setSchedulerUser(notifUser)
    const unsub = subscribeScheduler((n) => {
      // The scheduler only emits items the current user is targeted by.
      if (!matchesNotificationTarget(n, notifUser)) return
      bumpNotifs()
      setBellShake(s => s + 1)
      setActiveToast({ notification: n })
      playNotificationSound({ urgent: n.priority === 'urgent' })
      // Auto-dismiss the toast after 4s (urgent stays a touch longer).
      clearTimeout(toastClearTimer.current)
      toastClearTimer.current = setTimeout(
        () => setActiveToast(null),
        n.priority === 'urgent' ? 6500 : 4000,
      )
    })
    const stop = startScheduler({ user: notifUser, intervalMs: 30000 })
    return () => { unsub(); stop() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifUser?.id, notifUser?.role])

  // Re-derive list / count whenever notifications change.
  const notifications = useMemo(() => {
    const all = notifStore.loadAllNotifications()
    return notifStore.sortNotifications(all)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifTick])

  const visibleNotifications = useMemo(() => {
    if (!notifUser) return []
    return visibleNotificationsFor(notifications, notifUser)
  }, [notifications, notifUser])

  const unreadNotifications = useMemo(() => {
    if (!notifUser) return 0
    return unreadCountFor(notifications, notifUser)
  }, [notifications, notifUser])

  const openNotificationsCanvas = useCallback(() => {
    // Any user gesture in this app is fine to "unlock" audio.
    unlockAudioOnGesture()
    setNotificationsOpen(true)
  }, [])

  const closeNotificationsCanvas = useCallback(() => setNotificationsOpen(false), [])
  const dismissActiveToast       = useCallback(() => setActiveToast(null), [])

  const addNotification = useCallback((partial) => {
    const n = notifStore.addNotification(partial)
    bumpNotifs()
    // If due immediately, run a scheduler tick so the toast/sound fires.
    tickScheduler()
    return n
  }, [bumpNotifs])

  const markNotificationRead = useCallback((id) => {
    if (!userId) return
    notifStore.markRead(id, userId)
    bumpNotifs()
  }, [userId, bumpNotifs])

  const markAllNotificationsRead = useCallback(() => {
    if (!notifUser) return 0
    const n = notifStore.markAllRead(userId, (item) => matchesNotificationTarget(item, notifUser))
    bumpNotifs()
    return n
  }, [userId, notifUser, bumpNotifs])

  const dismissNotification = useCallback((id) => {
    if (!userId) return
    notifStore.dismiss(id, userId)
    bumpNotifs()
  }, [userId, bumpNotifs])

  const createBroadcastNotification = useCallback((partial) => {
    if (!canRoleBroadcast(role)) return null
    const n = notifStore.addNotification({
      ...partial,
      type: NOTIFICATION_TYPES.BROADCAST,
      createdBy: userId,
      createdByRole: role,
    })
    bumpNotifs()
    tickScheduler()
    return n
  }, [role, userId, bumpNotifs])

  const createReminder = useCallback((partial) => {
    if (!role || !userId) return null
    const n = notifStore.addNotification({
      ...partial,
      type: NOTIFICATION_TYPES.REMINDER,
      createdBy: userId,
      createdByRole: role,
      targetUserIds: [userId],
      targetRoles: [],
    })
    bumpNotifs()
    tickScheduler()
    return n
  }, [role, userId, bumpNotifs])

  // Resolve a notification action (e.g. "Open DigiVritti") into an open
  // canvas. Returns true if handled, false otherwise so the caller can
  // fall back to a toast.
  const triggerNotificationAction = useCallback((notification) => {
    if (!notification?.action) return false
    const a = notification.action
    // Direct canvas payloads pass through unchanged (caller built one).
    if (a.canvas) {
      openCanvas(a.canvas)
      return true
    }
    const map = {
      OPEN_DIGIVRITTI_HOME:        { type: 'digivritti', role },
      OPEN_NAMO_LAKSHMI:           { type: 'digivritti', scheme: 'namo_lakshmi', role },
      OPEN_NAMO_SARASWATI:         { type: 'digivritti', scheme: 'namo_saraswati', role },
      OPEN_APPLICATION_LIST:       { type: 'digivritti', view: 'list', role },
      OPEN_REJECTED_APPLICATIONS:  { type: 'digivritti', view: 'list', filter: 'rejected', role },
      OPEN_PAYMENT_QUEUE:          { type: 'digivritti', view: 'payment-queue', filter: 'pending', role },
      OPEN_CRC_PENDING_REVIEWS:    { type: 'digivritti', view: 'review', role },
      OPEN_XAMTA_SCAN:             { type: 'digivritti', view: 'analytics', role },
      OPEN_MARK_ATTENDANCE:        { type: 'attendance', classId: '6-B', role },
      OPEN_STATE_DASHBOARD:        { type: 'dashboard', scope: 'state', role },
      OPEN_DISTRICT_DASHBOARD:     { type: 'dashboard', scope: 'district', role },
      OPEN_SCHOOL_DASHBOARD:       { type: 'dashboard', scope: 'school', role },
      OPEN_REPORT_CARD:            { type: 'report', role },
      OPEN_DIGIVRITTI_AI:          { type: 'digivritti', view: 'analytics', role },
      OPEN_NOTIFICATIONS:          { type: 'notifications' },
    }
    const target = map[a.type]
    if (!target) return false
    openCanvas(target)
    return true
  }, [openCanvas, role])

  return (
    <AppContext.Provider value={{
      screen, navigate, goBack,
      stack, role, setRole,
      userProfile, setUserProfile,
      lang, setLang,
      toast, showToast,
      call, openCall, endCall,
      canvasOpen, canvasContext, openCanvas, closeCanvas, updateCanvas,
      ssoState, setSsoState,
      signOut,
      isAuthenticated: !!role,
      // Chat history — per-user, localStorage-backed.
      userId,
      chats: userChats, activeChatId, activeChat,
      createChat, switchChat, appendMessage, setChatMessages,
      updateChatCanvas, updateChatToolState, renameChat, deleteChat,
      // Notifications — per-user view of a global localStorage store.
      notifications, visibleNotifications, unreadNotifications,
      notificationsOpen, openNotificationsCanvas, closeNotificationsCanvas,
      activeToast, dismissActiveToast, bellShake,
      addNotification, markNotificationRead, markAllNotificationsRead,
      dismissNotification, createBroadcastNotification, createReminder,
      triggerNotificationAction,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
