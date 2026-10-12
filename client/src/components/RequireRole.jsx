import { useIsPresent } from 'motion/react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { homePathFor } from '../data/navItems'

/**
 * Route guard. Signed-out visitors go to Sign In and come back afterwards;
 * signed-in users without the role go to their own home screen.
 *
 * This only decides what the UI shows. The server enforces every rule again
 * on each request (middleware/auth.js), so hiding a screen is a courtesy,
 * not the security.
 *
 * @param {string[]} [roles] omit to allow any signed-in user
 */
export default function RequireRole({ roles, children }) {
  const { user } = useAuth()
  const location = useLocation()
  // A screen sliding out after sign-out still renders for a moment. It must
  // not redirect a second time — it just has nothing left to show.
  const isPresent = useIsPresent()

  if (!user) {
    if (!isPresent) return null
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/signin?next=${next}`} replace />
  }
  if (roles && !roles.includes(user.role)) {
    return isPresent ? <Navigate to={homePathFor(user)} replace /> : null
  }
  return children
}
