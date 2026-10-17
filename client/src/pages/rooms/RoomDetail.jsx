import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { nightsBetween, todayDateOnly } from '@shared/dates.js'
import { hasErrors, validateStayDates } from '@shared/validation.js'
import { roomsApi } from '../../api'
import Icon from '../../components/Icon'
import { BackButton } from '../../components/NavButtons'
import Page from '../../components/Page'
import RoomPhoto from '../../components/RoomPhoto'
import { LoadError, LoadingRows } from '../../components/States'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { formatPeso, formatStay, plural } from '../../utils/format'

/**
 * One room — photo and details, public. If the guest arrived from a dated
 * search, the stay comes along in the URL and the screen says up front
 * whether the room is free for it.
 */
export default function RoomDetail() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const stay = { checkIn: params.get('checkIn') ?? '', checkOut: params.get('checkOut') ?? '' }
  const hasStay = !hasErrors(validateStayDates(stay, { today: todayDateOnly() }))

  const { data, error, reload } = useApi(
    () => roomsApi.get(id, hasStay ? stay : undefined),
    [id, hasStay, stay.checkIn, stay.checkOut],
  )
  const room = data?.room
  const isManager = user?.role === 'manager'
  const bookPath = `/rooms/${id}/book${params.size ? `?${params}` : ''}`

  return (
    <Page
      title={room ? `Room ${room.roomNumber}` : 'Room'}
      leading={<BackButton fallback="/rooms" />}
      trailing={
        isManager && room ? (
          <button
            type="button"
            className="bar-button bar-button--floating"
            onClick={() => navigate(`/rooms/${id}/edit`)}
          >
            Edit
          </button>
        ) : null
      }
    >
      {error ? (
        <LoadError error={error} onRetry={reload} />
      ) : !room ? (
        <LoadingRows count={4} />
      ) : (
        <>
          <div className="group overflow-hidden rounded-card">
            <RoomPhoto src={room.photoUrl} alt={`Room ${room.roomNumber}`} className="aspect-[16/10]" />
          </div>

          <div className="mb-6 flex items-start justify-between gap-4 px-1">
            <div>
              <h2 className="t-title">Room {room.roomNumber}</h2>
              <p className="t-subhead t-secondary mt-1">
                {room.type} · Floor {room.floor} · Up to {plural(room.maxOccupancy, 'guest')}
              </p>
            </div>
            <p className="text-right">
              <span className="t-title t-numeric">{formatPeso(room.pricePerNight)}</span>
              <span className="block t-footnote t-secondary">per night</span>
            </p>
          </div>

          <div className="group">
            <h2 className="t-section-header">Details</h2>
            <div className="card">
              <DetailRow label="Type">
                {room.type}
              </DetailRow>
              <DetailRow label="Floor">{room.floor}</DetailRow>
              <DetailRow label="Max Occupancy">{plural(room.maxOccupancy, 'guest')}</DetailRow>
              <DetailRow label="Price per Night">{formatPeso(room.pricePerNight)}</DetailRow>
              {isManager && (
                <DetailRow label="Status">
                  <StatusBadge kind="room" value={room.status} />
                </DetailRow>
              )}
            </div>
          </div>

          {data.availability && (
            <div className="group">
              <h2 className="t-section-header">Your Stay</h2>
              <div className="card">
                <DetailRow label="Dates">{formatStay(stay.checkIn, stay.checkOut)}</DetailRow>
                <DetailRow label="Room Total">
                  {formatPeso(room.pricePerNight * nightsBetween(stay.checkIn, stay.checkOut))} ·{' '}
                  {plural(nightsBetween(stay.checkIn, stay.checkOut), 'night')}
                </DetailRow>
              </div>
              {data.availability.available ? (
                <p className="notice notice--success mt-3">
                  <Icon name="check" />
                  Available for your dates.
                </p>
              ) : (
                <p className="notice notice--warning mt-3">
                  <Icon name="warning" />
                  Already booked for some of these dates. Try other dates or another room.
                </p>
              )}
            </div>
          )}

          <BookingAction
            user={user}
            room={room}
            bookPath={bookPath}
            blocked={data.availability ? !data.availability.available : false}
          />
        </>
      )}
    </Page>
  )
}

function DetailRow({ label, children }) {
  return (
    <div className="row">
      <span className="row__body">
        <span className="row__title">{label}</span>
      </span>
      <span className="row__trailing t-secondary">{children}</span>
    </div>
  )
}

/** Booking is for guests; visitors are sent to sign in first, staff get a note. */
function BookingAction({ user, room, bookPath, blocked }) {
  if (room.status !== 'available') {
    return (
      <p className="notice notice--warning">
        <Icon name="wrench" />
        This room is in maintenance and hidden from guests.
      </p>
    )
  }
  if (!user) {
    return (
      <>
        <Link className="button" to={`/signin?next=${encodeURIComponent(bookPath)}`}>
          Sign In to Book
        </Link>
        <p className="inline-note text-center">You’ll come right back here after signing in.</p>
      </>
    )
  }
  if (user.role !== 'guest') {
    return <p className="inline-note text-center">Rooms are booked by guests from their own account.</p>
  }
  return (
    <Link className="button" to={bookPath} aria-disabled={blocked} onClick={(event) => blocked && event.preventDefault()}>
      {blocked ? 'Not Available for These Dates' : 'Book This Room'}
    </Link>
  )
}
