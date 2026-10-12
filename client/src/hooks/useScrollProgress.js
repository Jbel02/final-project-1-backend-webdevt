import { useEffect, useState } from 'react'

const INITIAL = { hasOverflow: false, thumbSize: 1, thumbOffset: 0 }

/**
 * Tracks how much of a horizontally-scrollable element is currently
 * visible, for driving a custom scroll-position indicator.
 *
 * A native scrollbar already gives a user this information for free, but
 * this app hides native scrollbars on rows like the category chip filter
 * (see .chip-scroller) for a cleaner look — this hook is what a custom
 * indicator needs to replace the affordance that hiding it took away:
 * "there's more to see" and "roughly how far through you are."
 *
 * @param {React.RefObject} ref the scrollable element
 * @param {unknown} [recomputeKey] forces an immediate re-measure when
 *   content that changes the element's scroll size without resizing the
 *   element itself changes — e.g. a different set of chips rendering.
 *   ResizeObserver below only reports the *element's own* box size, so a
 *   content-only change needs this to be noticed at all.
 * @param {'x'|'y'} [axis] which direction to measure. Defaults to horizontal
 *   (the chip filter); the page's own scroll container passes 'y'. The
 *   returned shape is deliberately axis-neutral — `thumbSize` and
 *   `thumbOffset` are fractions either way — so both consumers read the same.
 */
export function useScrollProgress(ref, recomputeKey, axis = 'x') {
  const [progress, setProgress] = useState(INITIAL)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => {
      const vertical = axis === 'y'
      const scrollSize = vertical ? el.scrollHeight : el.scrollWidth
      const clientSize = vertical ? el.clientHeight : el.clientWidth
      const scrollPos = vertical ? el.scrollTop : el.scrollLeft

      // A couple of px of slack: sub-pixel font/border rounding can make
      // the scroll size exceed the client size with nothing actually
      // scrollable.
      if (scrollSize <= clientSize + 2) {
        setProgress(INITIAL)
        return
      }

      const thumbSize = clientSize / scrollSize
      const maxScroll = scrollSize - clientSize
      const thumbOffset = maxScroll > 0 ? scrollPos / maxScroll : 0
      setProgress({ hasOverflow: true, thumbSize, thumbOffset })
    }

    measure()

    // Tracks position 1:1 as the user drags/swipes — no transition on the
    // consuming side either, same as a real scrollbar's thumb.
    el.addEventListener('scroll', measure, { passive: true })

    // Catches the container's own box resizing — this app's device-preview
    // frame can resize it at runtime without unmounting anything, the same
    // reason several other measurement hooks in this app use
    // ResizeObserver instead of a plain window 'resize' listener.
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(el)

    return () => {
      el.removeEventListener('scroll', measure)
      resizeObserver.disconnect()
    }
  }, [ref, recomputeKey, axis])

  return progress
}
