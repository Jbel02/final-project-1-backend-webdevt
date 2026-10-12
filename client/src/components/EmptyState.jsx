import Icon from './Icon'

/** Shown wherever a list can legitimately be empty — an empty screen with no
 *  explanation reads as a bug. */
export default function EmptyState({ icon = 'list', title, children }) {
  return (
    <div className="empty">
      <span className="empty__glyph" aria-hidden="true">
        <Icon name={icon} />
      </span>
      <p className="empty__title">{title}</p>
      {children && <p className="t-subhead">{children}</p>}
    </div>
  )
}
