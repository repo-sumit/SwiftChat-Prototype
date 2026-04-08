import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [screen, setScreen] = useState('splash')
  const [stack, setStack] = useState(['splash'])
  const [role, setRole] = useState(null) // 'teacher' | 'principal' | 'deo' | 'parent'
  const [lang, setLang] = useState('en')
  const [toast, setToast] = useState({ message: '', type: '', visible: false })
  const [call, setCall] = useState(null)
  const [canvasOpen, setCanvasOpen] = useState(false)
  const [canvasContext, setCanvasContext] = useState(null)
  const [ssoState, setSsoState] = useState('Gujarat')
  const toastTimer = useRef(null)

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

  const signOut = useCallback(() => {
    setRole(null)
    setStack(['splash'])
    setScreen('splash')
    setCanvasOpen(false)
    setCall(null)
  }, [])

  const openCall = useCallback((chatId, botName) => {
    setCall({ chatId, botName, active: true })
  }, [])

  const endCall = useCallback(() => setCall(null), [])

  const openCanvas = useCallback((ctx = null) => {
    setCanvasContext(ctx)
    setCanvasOpen(true)
  }, [])

  const closeCanvas = useCallback(() => setCanvasOpen(false), [])

  return (
    <AppContext.Provider value={{
      screen, navigate, goBack,
      stack, role, setRole,
      lang, setLang,
      toast, showToast,
      call, openCall, endCall,
      canvasOpen, canvasContext, openCanvas, closeCanvas,
      ssoState, setSsoState,
      signOut,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
