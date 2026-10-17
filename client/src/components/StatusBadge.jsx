import { STATUS_STYLES } from '../utils/format'

/** Booking statuses that get a coloured label; everything else stays neutral. */
const TONES = {
  booking: { confirmed: 'green', completed: 'green', cancelled: 'red' },
  room: { maintenance: 'yellow' },
}

/**
 * Plain status label — no coloured pill, just coloured text for a confirmed or completed
 * (green) or cancelled (red) booking, and a room under maintenance (yellow). Kept as a component so every screen
 * still reads its wording from STATUS_STYLES in one place.
 * @param {'booking'|'room'|'payment'|'role'|'account'} kind
 */
export default function StatusBadge({ kind, value }) {
  const style = STATUS_STYLES[kind]?.[value]
  if (!style) return null
  const tone = TONES[kind]?.[value]
  return (
    <span className="status-label" data-tone={tone}>
      {style.label}
    </span>
  )
}
