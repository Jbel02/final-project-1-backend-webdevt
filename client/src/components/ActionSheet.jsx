import { useEffect } from 'react'
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react'
import { SPRING, SPRING_MOMENTUM, projectMomentum } from '../motion/transitions'

/**
 * iOS action sheet: rises from the bottom edge, dims what's behind it, and
 * can be thrown back down.
 *
 * The drag is the interesting part. The sheet tracks the finger 1:1 downward
 * and resists upward (there is nothing above it to reveal). On release the
 * decision is not "how far did it move" but "where is it *going*" — the
 * release velocity is projected forward with the same deceleration curve
 * scroll uses, so a short fast flick dismisses while a long slow drag that
 * has already stopped springs back.
 *
 * @param {boolean} open
 * @param {{label: string, destructive?: boolean, onSelect: Function}[]} actions
 */
export default function ActionSheet({
  open,
  title,
  actions,
  cancelLabel = 'Cancel',
  onClose,
}) {
  const prefersReducedMotion = useReducedMotion()

  // Escape is the keyboard's version of tapping the scrim.
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const handleDragEnd = (_event, info) => {
    const projected = info.offset.y + projectMomentum(info.velocity.y)
    // Downward intent wins outright; otherwise it has to be projected past
    // roughly a third of the sheet to count as a dismissal.
    if (info.velocity.y > 350 || projected > 120) onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="sheet-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />

          <motion.div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={prefersReducedMotion ? { opacity: 0 } : { y: '100%' }}
            animate={prefersReducedMotion ? { opacity: 1 } : { y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { y: '100%' }}
            transition={prefersReducedMotion ? { duration: 0.15 } : SPRING}
            drag={prefersReducedMotion ? false : 'y'}
            // Only the top edge is constrained, so the sheet follows the
            // finger 1:1 on the way down and rubber-bands on the way up.
            dragConstraints={{ top: 0 }}
            dragElastic={0.08}
            onDragEnd={handleDragEnd}
            // The gesture carried momentum, so the settle is allowed a little
            // overshoot — the one place in the app that gets bounce.
            dragTransition={SPRING_MOMENTUM}
          >
            <SheetContent
              title={title}
              actions={actions}
              cancelLabel={cancelLabel}
              onClose={onClose}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/**
 * The buttons. While the sheet slides away it is still in the DOM, so it is
 * made inert — a quick second tap must not fire the action again.
 */
function SheetContent({ title, actions, cancelLabel, onClose }) {
  const isPresent = useIsPresent()

  return (
    <div className="sheet__inner" inert={!isPresent}>
      <div className="sheet__grabber" aria-hidden="true" />

      <div className="sheet__group">
        {title && <p className="sheet__title">{title}</p>}
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className={`sheet__action${action.destructive ? ' sheet__action--destructive' : ''}`}
            onClick={action.onSelect}
          >
            {action.label}
          </button>
        ))}
      </div>

      <button type="button" className="sheet__action sheet__action--cancel" onClick={onClose}>
        {cancelLabel}
      </button>
    </div>
  )
}
