import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { USER_PROFILES } from '../data/mockData'

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
    // Allow the persistence effect to resume for the next session.
    setTimeout(() => { signingOut.current = false }, 0)
  }, [])

  const openCall    = useCallback((chatId, botName) => setCall({ chatId, botName, active: true }), [])
  const endCall     = useCallback(() => setCall(null), [])
  const openCanvas  = useCallback((ctx = null) => { setCanvasContext(ctx); setCanvasOpen(true) }, [])
  const closeCanvas = useCallback(() => setCanvasOpen(false), [])
  const updateCanvas = useCallback((patch) => setCanvasContext(c => ({ ...(c || {}), ...patch })), [])

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
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
