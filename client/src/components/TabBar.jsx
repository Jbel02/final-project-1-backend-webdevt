import { memo } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { navItemsFor } from '../data/navItems'
import { SPRING_SNAPPY } from '../motion/transitions'
import Icon from './Icon'

/**
 * Bottom tab bar for the Phone and Tablet frames — persistent chrome that
 * lives outside the animated page stack, so it never slides with a screen
 * transition. Hidden by CSS above 900px of *container* width, where the
 * sidebar takes over.
 *
 * The tabs come from the signed-in user's role (data/navItems.js), so a
 * guest, a receptionist and the manager each see only their own sections.
 */
function TabBar() {
  const prefersReducedMotion = useReducedMotion()
  const { user } = useAuth()

  return (
    <nav className="tab-bar" aria-label="Main">
      {navItemsFor(user).map((item) => (
        <NavLink key={item.to} to={item.to} className="tab-bar__item">
          {({ isActive }) => (
            <>
              <motion.span
                // A small lift on selection: the icon nudges toward the label
                // it belongs to instead of just changing colour.
                animate={{ y: isActive && !prefersReducedMotion ? -1 : 0 }}
                transition={SPRING_SNAPPY}
                style={{ display: 'flex' }}
              >
                <Icon name={item.icon} />
              </motion.span>
              <span className="tab-bar__label">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export default memo(TabBar)
