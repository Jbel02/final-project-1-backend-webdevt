import { STATUS_STYLES } from '../utils/format'

/**
 * Tinted pill for a status value.
 * @param {'booking'|'room'|'payment'|'role'|'account'} kind
 */
export default function StatusBadge({ kind, value }) {
  const style = STATUS_STYLES[kind]?.[value]
  if (!style) return null
  return (
    <span className="badge" style={{ '--badge': style.color }}>
      {style.label}
    </span>
  )
}
