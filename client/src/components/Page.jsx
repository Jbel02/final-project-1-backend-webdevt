import { useCallback, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useTransitionMode } from '../motion/transitionMode'
import {
  PAGE_VARIANTS,
  PAGE_VARIANTS_REDUCED,
  SPRING,
} from '../motion/transitions'
import BackToTop from './BackToTop'
import PageScrollbar from './PageScrollbar'

/** Roughly a screen and a half down — far enough that scrolling back by hand
 *  is a chore rather than a flick. */
const BACK_TO_TOP_AT = 600

/**
 * The screen shell every route renders into: translucent nav bar on top, one
 * scrolling content area beneath it, and the enter/exit animation for the
 * route transition.
 *
 * Each page owns its own scroll container (rather than the app scrolling as a
 * whole) so a pushed screen starts at the top while the screen behind it
 * keeps its position — and so both can be on screen at once mid-transition.
 *
 * @param {string} title centred nav-bar title
 * @param {React.ReactNode} [leading] left-hand bar item, e.g. a Back button
 * @param {React.ReactNode} [trailing] right-hand bar item, e.g. Edit / Save
 * @param {boolean} [wide] wider content column, for grids like the room list
 */
export default function Page({ title, leading, trailing, wide = false, children }) {
  const mode = useTransitionMode()
  const prefersReducedMotion = useReducedMotion()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isDeepScrolled, setIsDeepScrolled] = useState(false)
  const scrollRef = useRef(null)

  // Fires on every scroll event, but setState with an unchanged value bails
  // out before rendering — so this only costs a render at the two moments
  // that matter: when content first slips under the bar, and when the page
  // passes the back-to-top threshold.
  const handleScroll = useCallback((event) => {
    const { scrollTop } = event.currentTarget
    setIsScrolled(scrollTop > 2)
    setIsDeepScrolled(scrollTop > BACK_TO_TOP_AT)
  }, [])

  return (
    <motion.div
      className="page"
      custom={mode}
      variants={prefersReducedMotion ? PAGE_VARIANTS_REDUCED : PAGE_VARIANTS}
      initial="enter"
      animate="center"
      exit="exit"
      transition={prefersReducedMotion ? { duration: 0.15 } : SPRING}
    >
      <header className="nav-bar" data-scrolled={isScrolled}>
        <div className="nav-bar__side">{leading}</div>
        <h1 className="nav-bar__title">{title}</h1>
        <div className="nav-bar__side nav-bar__side--trailing">{trailing}</div>
      </header>

      <div className="page__scroll" ref={scrollRef} onScroll={handleScroll}>
        <div className={`page__inner${wide ? ' page__inner--wide' : ''}`}>{children}</div>
      </div>

      {/* `children` as the recompute key: a page whose content grows or
          shrinks (filtering the list, switching month) changes the scroll
          height without resizing the container, which a ResizeObserver alone
          would not see. */}
      <PageScrollbar scrollRef={scrollRef} recomputeKey={children} />
      <BackToTop scrollRef={scrollRef} visible={isDeepScrolled} />
    </motion.div>
  )
}
