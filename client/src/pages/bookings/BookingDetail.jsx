import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { nightsBetween, todayDateOnly } from '@shared/dates.js'
import { bookingsApi } from '../../api'
import { errorMessage } from '../../api/client'
import ActionSheet from '../../components/ActionSheet'
import Icon from '../../components/Icon'
import { BackButton } from '../../components/NavButtons'
import Page from '../../components/Page'
import Receipt from '../../components/Receipt'
import RoomPhoto from '../../components/RoomPhoto'
import { LoadError, LoadingRows } from '../../components/States'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { MEAL_LABELS, dateOnly, formatDay, formatPeso, formatStay, plural } from '../../utils/format'

/**
 * One booking: the receipt on screen, plus whatever this role can do next —
 * guests cancel an upcoming stay, staff check in and out, the manager can
 * also cancel. "Print Receipt" prints the portalled <Receipt />.
 */
export default function BookingDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { data, error, reload, setData } = useApi(() => bookingsApi.get(id), [id])
  const [pending, setPending] = useState(null) // 'cancel' | 'checkout' while a sheet is open
  const [isWorking, setIsWorking] = useState(false)

  const booking = data?.booking
  const isStaff = user.role === 'receptionist' || user.role === 'manager'

  const run = async (action, successTitle) => {
    setPending(null)
    setIsWorking(true)
    try {
      const { booking: updated } = await action(id)
      setData({ booking: updated })
      toast.success(successTitle, {
        description: `Room ${updated.roomSnapshot.roomNumber} · ${updated.guestSnapshot.name}`,
      })
    } catch (failure) {
      toast.error('Couldn’t update booking', { description: errorMessage(failure) })
      reload()
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <Page
      title="Booking"
      leading={<BackButton fallback="/bookings" />}
      trailing={
        booking ? (
          <button
            type="button"
            className="bar-button bar-button--floating"
            aria-label="Print Receipt"
            onClick={() => window.print()}
          >
            <Icon name="printer" />
          </button>
        ) : null
      }
    >
      {error ? (
        <LoadError error={error} onRetry={reload} />
      ) : !booking ? (
        <LoadingRows count={5} />
      ) : (
        <BookingView
          booking={booking}
          user={user}
          isStaff={isStaff}
          isWorking={isWorking}
          onCheckIn={() => run(bookingsApi.checkIn, 'Checked in')}
          onRequestCheckOut={() => setPending('checkout')}
          onRequestCancel={() => setPending('cancel')}
        />
      )}

      {booking && (
        <>
          <ActionSheet
            open={pending === 'cancel'}
            title={`Cancel the stay in Room ${booking.roomSnapshot.roomNumber} for ${formatStay(booking.checkIn, booking.checkOut)}? The room will be released. This can’t be undone.`}
            actions={[
              { label: 'Cancel Booking', destructive: true, onSelect: () => run(bookingsApi.cancel, 'Booking cancelled') },
            ]}
            cancelLabel="Keep Booking"
            onClose={() => setPending(null)}
          />
          <ActionSheet
            open={pending === 'checkout'}
            title={
              booking.balance > 0
                ? `Check out ${booking.guestSnapshot.name}? Collect the ${formatPeso(booking.balance)} balance first — it will be marked as paid.`
                : `Check out ${booking.guestSnapshot.name} from Room ${booking.roomSnapshot.roomNumber}?`
            }
            actions={[{ label: 'Check Out', onSelect: () => run(bookingsApi.checkOut, 'Checked out') }]}
            onClose={() => setPending(null)}
          />
          <Receipt booking={booking} />
        </>
      )}
    </Page>
  )
}

function BookingView({ booking, user, isStaff, isWorking, onCheckIn, onRequestCheckOut, onRequestCancel }) {
  const room = booking.roomSnapshot
  const checkIn = dateOnly(booking.checkIn)
  const checkOut = dateOnly(booking.checkOut)
  const nights = nightsBetween(checkIn, checkOut)
  const today = todayDateOnly()

  const canCancel =
    booking.status === 'confirmed' && (user.role === 'manager' || user.role === 'guest')
  const isArrivalWindow = today >= checkIn && today < checkOut

  return (
    <>
      <div className="group">
        <div className="card">
          <div className="detail-hero">
            <StatusBadge kind="booking" value={booking.status} />
            <p className="detail-hero__amount t-numeric">{formatPeso(booking.totalAmount)}</p>
            <p className="t-subhead t-secondary">
              Room {room.roomNumber} · {room.type} · {plural(nights, 'night')}
            </p>
            <p className="t-footnote t-numeric select-all text-label-tertiary">{booking.transactionId}</p>
          </div>
        </div>
      </div>

      <div className="group">
        <h2 className="t-section-header">Stay</h2>
        <div className="card">
          <div className="row row--thumbed">
            <RoomPhoto src={booking.room?.photoUrl} className="row__thumb" />
            <span className="row__body">
              <span className="row__title">Room {room.roomNumber}</span>
              <span className="row__subtitle">
                {room.type} · Floor {room.floor} · {formatPeso(room.pricePerNight)} / night
              </span>
            </span>
          </div>
          <InfoRow label="Check-in">{formatDay(checkIn)}</InfoRow>
          <InfoRow label="Check-out">{formatDay(checkOut)}</InfoRow>
          <InfoRow label="Guests">{plural(booking.guests, 'guest')}</InfoRow>
          <InfoRow label="Meals">{MEAL_LABELS[booking.mealAddons]}</InfoRow>
        </div>
      </div>

      {isStaff && (
        <div className="group">
          <h2 className="t-section-header">Guest</h2>
          <div className="card">
            <InfoRow label="Name">{booking.guestSnapshot.name}</InfoRow>
            <InfoRow label="Email">{booking.guestSnapshot.email}</InfoRow>
            {booking.guest?.contact && <InfoRow label="Phone">{booking.guest.contact}</InfoRow>}
            {!booking.guest && <InfoRow label="Account">Deleted</InfoRow>}
          </div>
        </div>
      )}

      <div className="group">
        <h2 className="t-section-header">Payment</h2>
        <div className="card">
          <InfoRow label="Payment">
            <StatusBadge kind="payment" value={booking.paymentStatus} />
          </InfoRow>
          <InfoRow label="Total">{formatPeso(booking.totalAmount)}</InfoRow>
          <InfoRow label="Paid">{formatPeso(booking.paidAmount)}</InfoRow>
          <InfoRow label="Balance">
            <span className={booking.balance > 0 ? 'highlight' : undefined}>
              {formatPeso(booking.balance)}
            </span>
          </InfoRow>
        </div>
        {booking.balance > 0 && booking.status !== 'cancelled' && (
          <p className="inline-note">The balance is settled at the front desk on check-out.</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {isStaff && booking.status === 'confirmed' && (
          <>
            <button type="button" className="button" disabled={isWorking || !isArrivalWindow} onClick={onCheckIn}>
              <Icon name="checkIn" />
              Check In
            </button>
            {!isArrivalWindow && (
              <p className="inline-note -mt-1 text-center">
                {today < checkIn
                  ? `Check-in opens on ${formatDay(checkIn)}.`
                  : 'This stay’s dates have passed.'}
              </p>
            )}
          </>
        )}

        {isStaff && booking.status === 'checked-in' && (
          <button type="button" className="button" disabled={isWorking} onClick={onRequestCheckOut}>
            <Icon name="checkOut" />
            Check Out
          </button>
        )}

        <button type="button" className="button button--plain" onClick={() => window.print()}>
          <Icon name="printer" />
          Print Receipt
        </button>

        {canCancel && (
          <button type="button" className="button button--destructive" disabled={isWorking} onClick={onRequestCancel}>
            Cancel Booking
          </button>
        )}
      </div>
    </>
  )
}

function InfoRow({ label, children }) {
  return (
    <div className="row">
      <span className="row__body">
        <span className="row__title">{label}</span>
      </span>
      <span className="row__trailing t-secondary min-w-0 truncate">{children}</span>
    </div>
  )
}
