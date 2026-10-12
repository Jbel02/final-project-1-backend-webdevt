import { memo } from 'react'
import { Link } from 'react-router-dom'
import { nightsBetween } from '@shared/dates.js'
import Icon from '../../components/Icon'
import RoomPhoto from '../../components/RoomPhoto'
import StatusBadge from '../../components/StatusBadge'
import { dateOnly, formatPeso, formatStay, plural } from '../../utils/format'

/**
 * One booking in a list. memo(): filtering re-renders the list, but each row
 * only changes when its own booking does (the midterm's TransactionRow
 * technique).
 *
 * @param {boolean} [showGuest] staff lists lead with the guest's name
 */
function BookingRow({ booking, showGuest = false }) {
  const room = booking.roomSnapshot
  const nights = nightsBetween(dateOnly(booking.checkIn), dateOnly(booking.checkOut))
  const stay = `${formatStay(booking.checkIn, booking.checkOut)} · ${plural(nights, 'night')}`

  return (
    <Link to={`/bookings/${booking.id}`} className="row row--tappable row--thumbed">
      <RoomPhoto src={booking.room?.photoUrl} className="row__thumb" />
      <span className="row__body">
        <span className="row__title">
          {showGuest ? booking.guestSnapshot?.name : `Room ${room.roomNumber} · ${room.type}`}
        </span>
        <span className="row__subtitle">
          {showGuest ? `Room ${room.roomNumber} · ${stay}` : stay}
        </span>
        {showGuest && <span className="row__subtitle t-numeric">{booking.transactionId}</span>}
      </span>
      <span className="row__trailing flex-col items-end gap-1">
        <StatusBadge kind="booking" value={booking.status} />
        {booking.balance > 0 && booking.status !== 'cancelled' && (
          <span className="t-caption t-numeric text-orange">{formatPeso(booking.balance)} due</span>
        )}
      </span>
      <Icon name="chevronRight" className="row__chevron flex-none" />
    </Link>
  )
}

export default memo(BookingRow)
