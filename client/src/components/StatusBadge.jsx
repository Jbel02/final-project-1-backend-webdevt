import { STATUS_STYLES } from '../utils/format'

/**
 * Plain status label — no coloured pill. Kept as a component so every screen
 * still reads its wording from STATUS_STYLES in one place.
 * @param {'booking'|'room'|'payment'|'role'|'account'} kind
 */
export default function StatusBadge({ kind, value }) {
  const style = STATUS_STYLES[kind]?.[value]
  if (!style) return null
  return <span className="status-label">{style.label}</span>
}
