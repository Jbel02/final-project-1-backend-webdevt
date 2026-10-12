import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTheme } from '../context/ThemeContext'
import { SPRING_SNAPPY } from '../motion/transitions'
import Icon from './Icon'

/**
 * The app-wide light/dark switch.
 *
 * It reads and writes ThemeContext directly, which is the whole point of the
 * context: this component sits deep inside the Profile page, yet
 * flipping it re-themes the nav bar, the tab bar and every other screen —
 * with no `theme` prop passed anywhere along the way.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const prefersReducedMotion = useReducedMotion()
  const isDark = theme === 'dark'
  const transition = prefersReducedMotion ? { duration: 0 } : SPRING_SNAPPY

  return (
    <div className="row row--iconed">
      <span
        className="row__icon"
        style={{ backgroundColor: isDark ? 'var(--indigo)' : 'var(--orange)' }}
        aria-hidden="true"
      >
        <Icon name={isDark ? 'moon' : 'sun'} />
      </span>

      <span className="row__body">
        <span className="row__title">Dark mode</span>
        <span className="row__subtitle">
          Applies to every screen in the app
        </span>
      </span>

      <button
        type="button"
        className="switch"
        role="switch"
        aria-checked={isDark}
        aria-label="Dark mode"
        onClick={toggleTheme}
      >
        <motion.span
          className="switch__knob"
          animate={{ x: isDark ? 20 : 0 }}
          transition={transition}
        >
          {/* Cross-fade rather than a hard swap, so the knob reads as one
              object whose face changes. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ opacity: 0, rotate: -35 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 35 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.16 }}
              style={{ display: 'flex' }}
            >
              <Icon name={isDark ? 'moon' : 'sun'} />
            </motion.span>
          </AnimatePresence>
        </motion.span>
      </button>
    </div>
  )
}
