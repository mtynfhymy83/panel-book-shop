import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from './api'
import { SESSION_EVENT, sessionStore } from './session'
import type { AdminUser, AuthSession } from './types'

type AuthContextValue = {
  isAuthenticated: boolean
  user: AdminUser | null
  signIn: (session: AuthSession) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuthenticated] = useState(sessionStore.hasSession())
  const [user, setUser] = useState(sessionStore.getUser())

  useEffect(() => {
    const sync = () => {
      setAuthenticated(sessionStore.hasSession())
      setUser(sessionStore.getUser())
    }
    window.addEventListener(SESSION_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(SESSION_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated,
    user,
    signIn(session) { sessionStore.save(session) },
    async signOut() {
      try { await authApi.logout() } finally { sessionStore.clear() }
    },
  }), [isAuthenticated, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// The provider and its companion hook intentionally live together.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
