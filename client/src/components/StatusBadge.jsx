import { STATUS_STYLES } from '../utils/format'

/** Booking statuses that get a coloured label; everything else stays neutral. */
const TONES = { confirmed: 'green', cancelled: 'red' }

/**
 * Plain status label — no coloured pill, just coloured text for a confirmed
 * (green) or cancelled (red) booking. Kept as a component so every screen
 * still reads its wording from STATUS_STYLES in one place.
 * @param {'booking'|'room'|'payment'|'role'|'account'} kind
 */
export default function StatusBadge({ kind, value }) {
  const style = STATUS_STYLES[kind]?.[value]
  if (!style) return null
  const tone = kind === 'booking' ? TONES[value] : undefined
  return (
    <span className="status-label" data-tone={tone}>
      {style.label}
    </span>
  )
}
