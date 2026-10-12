import { STATUS_STYLES, initials } from '../utils/format'

/** Initials on a role-coloured circle, like Contacts. */
export default function Avatar({ name, role, size = 'regular' }) {
  const color = STATUS_STYLES.role[role]?.color ?? 'var(--gray)'
  return (
    <span
      className={`avatar${size === 'large' ? ' avatar--large' : ''}`}
      style={{ '--avatar': color, ...(size === 'small' && { width: 30, height: 30, fontSize: 12 }) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}
