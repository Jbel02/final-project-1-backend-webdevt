/* ===== Shared motion constants =====
   Apple describes springs with two designer-facing numbers — damping ratio
   (overshoot) and response (how fast it reaches the target). Motion's
   `bounce` + `duration` spring API maps onto exactly that, so these are the
   only two knobs used anywhere in the app:

     bounce 0    ≈ damping 1.0  — critically damped, graceful, no overshoot
     bounce 0.2+ ≈ damping 0.8  — reserved for momentum-driven gestures

   Every UI transition here is the critically damped one; the sheet's
   drag-release is the single place that earns bounce, because the gesture
   itself carried momentum. */

export const SPRING = { type: 'spring', bounce: 0, duration: 0.42 }
export const SPRING_SNAPPY = { type: 'spring', bounce: 0, duration: 0.26 }
export const SPRING_MOMENTUM = { type: 'spring', bounce: 0.22, duration: 0.45 }

/**
 * Where a flick would come to rest, given its release velocity — Apple's
 * projection function from *Designing Fluid Interfaces*, not the
 * physics-textbook v²/2a form.
 *
 * Using it means a gesture is judged by where it is *going*, so a short fast
 * flick and a long slow drag resolve the way the hand expects.
 *
 * @param {number} velocity px/s at release
 * @param {number} [decelerationRate] 0.998 ≈ scroll feel
 */
export function projectMomentum(velocity, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate)
}

/**
 * Which transition is currently running. Computed once per navigation from
 * the previous and next paths, then handed to both the entering page (via
 * context) and the exiting one (via AnimatePresence's `custom`), so the two
 * halves of a transition always agree about what is happening.
 */
export function transitionModeFor(previousPath, nextPath) {
  if (previousPath === nextPath) return 'fade'

  const wasModal = isModal(previousPath)
  const isNowModal = isModal(nextPath)
  if (isNowModal && !wasModal) return 'present'
  if (wasModal && !isNowModal) return 'dismiss'
  if (wasModal && isNowModal) return 'fade'

  // Within one section, deeper is a push (Rooms → Room 305) and shallower a
  // pop; moving between sections is a tab switch, which cross-fades.
  if (section(previousPath) !== section(nextPath)) return 'fade'
  const before = depth(previousPath)
  const after = depth(nextPath)
  if (after > before) return 'push'
  if (after < before) return 'pop'
  return 'fade'
}

/** Screens that are a task to finish or cancel, so they rise like a sheet. */
const MODAL_PATHS = [
  /^\/signin$/,
  /^\/signup$/,
  /^\/rooms\/new$/,
  /^\/rooms\/[^/]+\/(edit|book)$/,
  /^\/users\/new$/,
]

export const isModal = (path) => MODAL_PATHS.some((pattern) => pattern.test(path))
const segments = (path) => path.split('/').filter(Boolean)
const section = (path) => segments(path)[0] ?? ''
const depth = (path) => segments(path).length

/**
 * Enter and exit travel the same path in reverse: a screen pushed in from the
 * right dismisses to the right, a sheet that rose from the bottom returns to
 * the bottom (apple-design §7 — spatial consistency). The parent screen
 * doesn't just sit still either; it slides a short distance and dims, which
 * is what makes a push read as a stack rather than a swap.
 */
export const PAGE_VARIANTS = {
  enter: (mode) => {
    switch (mode) {
      case 'push':
        return { x: '100%', opacity: 1, scale: 1 }
      case 'pop':
        return { x: '-26%', opacity: 0.6, scale: 1 }
      case 'present':
        return { y: '100%', opacity: 1, scale: 1 }
      case 'dismiss':
        return { scale: 0.94, opacity: 0.6, y: 0 }
      default:
        return { opacity: 0, scale: 0.985 }
    }
  },
  center: {
    x: 0,
    y: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (mode) => {
    switch (mode) {
      case 'push':
        return { x: '-26%', opacity: 0.6 }
      case 'pop':
        return { x: '100%', opacity: 1 }
      case 'present':
        return { scale: 0.94, opacity: 0.6 }
      case 'dismiss':
        return { y: '100%', opacity: 1 }
      default:
        return { opacity: 0, scale: 1.008 }
    }
  },
}

/** Reduced motion keeps the change legible but drops the travel. */
export const PAGE_VARIANTS_REDUCED = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
}
