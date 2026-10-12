import { memo } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { SPRING_SNAPPY } from '../motion/transitions'
import Icon from './Icon'

/**
 * Jumps the page's scroll area back to the top.
 *
 * Shown on every device, but only once you are far enough down that
 * scrolling back by hand is a chore. That single threshold is also what
 * keeps this off short pages without naming any of them: forms and detail
 * screens rarely reach it, so the button only turns up on long lists like
 * the room grid — see Page.jsx for the threshold itself.
 *
 * @param {React.RefObject} scrollRef the page's scrolling element
 * @param {boolean} visible whether the page has scrolled past the threshold
 */
function BackToTop({ scrollRef, visible }) {
  const prefersReducedMotion = useReducedMotion()

  const handleClick = () => {
    scrollRef.current?.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          className="back-to-top"
          onClick={handleClick}
          aria-label="Back to top"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={prefersReducedMotion ? { duration: 0 } : SPRING_SNAPPY}
        >
          <Icon name="chevronUp" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

export default memo(BackToTop)
