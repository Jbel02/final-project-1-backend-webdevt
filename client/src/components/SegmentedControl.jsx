import { motion, useReducedMotion } from 'motion/react'
import { SPRING_SNAPPY } from '../motion/transitions'

/**
 * iOS-style segmented control.
 *
 * The highlight is one always-mounted element, moved and resized with a
 * plain percentage transform (`x: index * 100%`, width `100% / count`)
 * computed directly from the selected index — deliberately not Motion's
 * `layoutId`/FLIP system, which was the original design here.
 *
 * The reason: this control renders inside the app's own Tablet/Phone
 * device-preview frame, which is itself scaled down via a CSS `transform`
 * to fit the window. `layoutId` animates by measuring each render's DOM
 * rect and computing a delta between them — and that measurement doesn't
 * reliably compose with a scaled ancestor Motion isn't tracking through its
 * own `layout` system (this component's ancestor animates `scale` via a
 * plain `animate` prop, not `layout`). In practice that showed up as the
 * highlight appearing to fly in from the wrong direction, specifically
 * inside the scaled frame and not on the unscaled desktop view. A
 * percentage transform has no such dependency — it's arithmetic from the
 * selected index, not a measured rect, so it behaves identically at every
 * device-preview size.
 *
 * A side benefit: with the thumb no longer nested *inside* each button (it's
 * a sibling of all of them now, positioned first in the DOM so every button
 * paints over it), the earlier z-index/position tricks needed to keep a
 * label above a same-button thumb are gone — plain DOM order does that for
 * free once they're no longer sharing a stacking context.
 */
export default function SegmentedControl({
  options,
  value,
  onChange,
  label,
  className = '',
}) {
  const prefersReducedMotion = useReducedMotion()
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )

  return (
    <div
      className={`segmented ${className}`.trim()}
      role="radiogroup"
      aria-label={label}
    >
      <motion.span
        className="segmented__thumb"
        style={{ width: `${100 / options.length}%` }}
        animate={{ x: `${selectedIndex * 100}%` }}
        transition={prefersReducedMotion ? { duration: 0 } : SPRING_SNAPPY}
        aria-hidden="true"
      />

      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          className="segmented__option"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
