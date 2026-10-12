import { memo } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { navItemsFor } from '../data/navItems'
import { SPRING_SNAPPY } from '../motion/transitions'
import { STATUS_STYLES } from '../utils/format'
import Avatar from './Avatar'
import Icon from './Icon'

/**
 * Desktop navigation. Shown instead of the tab bar once the viewport is wide
 * enough (a container query, so the iPad frame keeps its tab bar even though
 * the real window is far wider).
 *
 * Same destinations as the tab bar — per role — with room for labels and the
 * signed-in account at the foot.
 */
function Sidebar() {
  const { user } = useAuth()

  return (
    <nav className="sidebar" aria-label="Main">
      <div className="sidebar__brand">
        <span className="sidebar__mark" aria-hidden="true">
          <Icon name="bed" />
        </span>
        <span className="t-headline">SuiteSpot</span>
      </div>

      {navItemsFor(user).map((item) => (
        <NavLink key={item.to} to={item.to} className="sidebar__item">
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  className="sidebar__selection"
                  layoutId="sidebar-selection"
                  transition={SPRING_SNAPPY}
                />
              )}
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}

      {user && (
        <div className="sidebar__footer">
          <Avatar name={user.name} role={user.role} size="small" />
          <span className="min-w-0">
            <span className="block truncate text-subhead font-semibold">{user.name}</span>
            <span className="block text-caption text-label-secondary">
              {STATUS_STYLES.role[user.role].label}
            </span>
          </span>
        </div>
      )}
    </nav>
  )
}

export default memo(Sidebar)
