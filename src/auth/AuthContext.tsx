/**
 * Session state: who is signed in, and signing in and out.
 *
 * mm.html had no login because it read straight from shared storage. Every
 * backend endpoint needs a bearer token, so the app keeps the session here and
 * gates the shell on it.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { authApi } from '@/api/endpoints'
import {
  clearTokens,
  hasSession,
  setUnauthorizedHandler,
  storeTokens,
} from '@/api/client'
import type { User } from '@/api/types'

export interface AuthContextValue {
  user: User | null
  /** True until the stored session has been checked on first load. */
  initialising: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, fullName: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [initialising, setInitialising] = useState(true)

  // A 401 that survives the refresh attempt means the session is gone for good.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearTokens()
      setUser(null)
    })
  }, [])

  useEffect(() => {
    let active = true

    if (!hasSession()) {
      setInitialising(false)
      return
    }

    authApi
      .me()
      .then((current) => {
        if (active) setUser(current)
      })
      .catch(() => {
        clearTokens()
      })
      .finally(() => {
        if (active) setInitialising(false)
      })

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const session = await authApi.login(email, password)
    storeTokens(session.tokens)
    setUser(session.user)
  }, [])

  /**
   * Create an account and sign in as it.
   *
   * POST /auth/register returns the same AuthSession as login, so the new
   * account is usable straight away instead of bouncing the user back to the
   * sign-in form.
   */
  const register = useCallback(async (email: string, fullName: string, password: string) => {
    const session = await authApi.register(email, fullName, password)
    storeTokens(session.tokens)
    setUser(session.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Revoking is best effort: the local session is cleared either way.
    }
    clearTokens()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, initialising, login, register, logout }),
    [user, initialising, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === null) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
