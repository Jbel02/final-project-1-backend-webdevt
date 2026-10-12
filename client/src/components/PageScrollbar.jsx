import { memo } from 'react'
import { useDevice } from '../context/DeviceContext'
import { useScrollProgress } from '../hooks/useScrollProgress'

/**
 * A slim vertical scroll indicator for the page's scrolling area, shown only
 * inside the Tablet and Phone frames.
 *
 * Those two frames hide the native scrollbar on purpose — it rendered past the
 * bezel's rounded corner (see .page__scroll in styles/ui.css) — which also
 * took away the one cue that tells you there is more page below. This puts
 * that cue back as an element that lives inside the frame and therefore
 * cannot escape it, the same approach ScrollProgress already uses for the
 * horizontal chip row.
 *
 * Desktop is untouched: its native scrollbar was never the problem and is
 * still the better affordance for a mouse.
 */
function PageScrollbar({ scrollRef, recomputeKey }) {
  const { device } = useDevice()
  const { hasOverflow, thumbSize, thumbOffset } = useScrollProgress(
    scrollRef,
    recomputeKey,
    'y',
  )

  if (device === 'desktop' || !hasOverflow) return null

  const thumbHeightPercent = Math.max(thumbSize * 100, 8)
  const topPercent = thumbOffset * (100 - thumbHeightPercent)

  return (
    <div className="page-scrollbar" aria-hidden="true">
      <div
        className="page-scrollbar__thumb"
        style={{ height: `${thumbHeightPercent}%`, top: `${topPercent}%` }}
      />
    </div>
  )
}

export default memo(PageScrollbar)
