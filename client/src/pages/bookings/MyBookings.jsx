import { useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingsApi } from '../../api'
import EmptyState from '../../components/EmptyState'
import Page from '../../components/Page'
import SegmentedControl from '../../components/SegmentedControl'
import { LoadError, LoadingRows } from '../../components/States'
import { useApi } from '../../hooks/useApi'
import BookingRow from './BookingRow'

const SCOPES = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
]

const isUpcoming = (booking) => booking.status === 'confirmed' || booking.status === 'checked-in'

/** A guest's own booking history (GET /api/bookings/mine). */
export default function MyBookings() {
  const [scope, setScope] = useState('upcoming')
  const { data, error, reload } = useApi(() => bookingsApi.mine(), [])

  const all = data?.bookings ?? []
  const bookings =
    scope === 'upcoming'
      ? all.filter(isUpcoming).sort((a, b) => a.checkIn.localeCompare(b.checkIn))
      : all.filter((booking) => !isUpcoming(booking))

  return (
    <Page title="My Bookings">
      <SegmentedControl className="mb-5" label="Show" options={SCOPES} value={scope} onChange={setScope} />

      {error ? (
        <LoadError error={error} onRetry={reload} />
      ) : !data ? (
        <LoadingRows count={3} thumb />
      ) : bookings.length === 0 ? (
        <div className="card">
          <EmptyState icon="calendar" title={scope === 'upcoming' ? 'No Upcoming Stays' : 'No Past Stays'}>
            {scope === 'upcoming'
              ? 'Rooms you book will appear here.'
              : 'Completed and cancelled stays will appear here.'}
          </EmptyState>
          {scope === 'upcoming' && (
            <div className="px-4 pb-5">
              <Link className="button button--tinted" to="/rooms">
                Browse Rooms
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          {bookings.map((booking) => (
            <BookingRow key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </Page>
  )
}
