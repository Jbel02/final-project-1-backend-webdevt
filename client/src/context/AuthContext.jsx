import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { authApi } from '../api'
import { setUnauthorizedHandler } from '../api/client'

/**
 * Who is signed in, app-wide. The proposal's "Context API (auth state)":
 * the tab bar, the sidebar, route guards and every page read the current user
 * from here rather than having it passed down.
 *
 * The session itself is the httpOnly cookie; this context only mirrors the
 * user it belongs to. On load it asks the server (GET /api/auth/me) instead
 * of trusting anything stored in the browser.
 */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let ignore = false
    authApi
      .me()
      .then(({ user: current }) => !ignore && setUser(current))
      .catch(() => !ignore && setUser(null))
      .finally(() => !ignore && setIsReady(true))
    return () => {
      ignore = true
    }
  }, [])

  // Any API call answered with 401 means the session ended (expired, or the
  // manager deactivated the account) — drop back to signed-out everywhere.
  // Read through a ref so the handler can tell "was signed in" without being
  // re-registered on every user change.
  const userRef = useRef(user)
  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (!userRef.current) return
      toast.error('You’ve been signed out', { description: 'Sign in again to continue.' })
      setUser(null)
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  const signIn = useCallback(async (values) => {
    const { user: signedIn } = await authApi.login(values)
    setUser(signedIn)
    return signedIn
  }, [])

  const signUp = useCallback(async (values) => {
    const { user: created } = await authApi.register(values)
    setUser(created)
    return created
  }, [])

  const signOut = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, isReady, signIn, signUp, signOut, setUser }),
    [user, isReady, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
