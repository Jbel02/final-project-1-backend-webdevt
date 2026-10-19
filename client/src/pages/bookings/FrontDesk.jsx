import { useDeferredValue, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { todayDateOnly } from '@shared/dates.js'
import { bookingsApi } from '../../api'
import EmptyState from '../../components/EmptyState'
import DateField from '../../components/DateField'
import Page from '../../components/Page'
import SearchField from '../../components/SearchField'
import SegmentedControl from '../../components/SegmentedControl'
import { LoadError, LoadingRows } from '../../components/States'
import { useApi } from '../../hooks/useApi'
import { formatDay, plural } from '../../utils/format'
import BookingRow from './BookingRow'

const STATUS_CHIPS = [
  { value: '', label: 'All' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked-in', label: 'Checked In' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const PAYMENT_OPTIONS = [
  { value: '', label: 'Any Payment' },
  { value: 'full', label: 'Paid in Full' },
  { value: 'partial', label: 'Partial' },
]

/**
 * All bookings, for the receptionist and the manager — filterable by date
 * and payment status (the proposal), plus booking status and a search over
 * guest, room and reference. Date, status and payment are server-side
 * filters kept in the URL; the search box narrows the loaded list instantly.
 */
export default function FrontDesk() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const today = todayDateOnly()

  const date = params.get('date') ?? ''
  const status = params.get('status') ?? ''
  const paymentStatus = params.get('payment') ?? ''

  const setFilter = (name, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(name, value)
    else next.delete(name)
    setParams(next, { replace: true })
  }

  const query = useMemo(
    () => ({
      ...(date && { date }),
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
    }),
    [date, status, paymentStatus],
  )
  const { data, error, isLoading, reload } = useApi(() => bookingsApi.list(query), [query])

  const term = deferredSearch.trim().toLowerCase()
  const bookings = (data?.bookings ?? []).filter(
    (booking) =>
      !term ||
      booking.transactionId.toLowerCase().includes(term) ||
      booking.guestSnapshot?.name?.toLowerCase().includes(term) ||
      booking.guestSnapshot?.email?.toLowerCase().includes(term) ||
      booking.roomSnapshot.roomNumber.includes(term),
  )

  return (
    <Page title="Bookings">
      <SearchField value={search} onChange={setSearch} placeholder="Search guest, room or reference" />

      <div className="group mb-4">
        <div className="card">
          <DateField
            id="date"
            label="Date"
            value={date}
            onChange={(value) => setFilter('date', value)}
            clearable
            strongPlaceholder
          />
        </div>
        <div className="mt-2 flex gap-2">
          <button type="button" className="chip" aria-pressed={date === today} onClick={() => setFilter('date', today)}>
            Today
          </button>
          <button type="button" className="chip" aria-pressed={!date} onClick={() => setFilter('date', '')}>
            Any Date
          </button>
        </div>
      </div>

      <div className="chip-scroller" role="group" aria-label="Booking status">
        {STATUS_CHIPS.map((chip) => (
          <button
            key={chip.value || 'all'}
            type="button"
            className="chip"
            aria-pressed={status === chip.value}
            onClick={() => setFilter('status', chip.value)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <SegmentedControl
        className="mb-5"
        label="Payment status"
        options={PAYMENT_OPTIONS}
        value={paymentStatus}
        onChange={(value) => setFilter('payment', value)}
      />

      {error ? (
        <LoadError error={error} onRetry={reload} />
      ) : !data ? (
        <LoadingRows count={5} thumb />
      ) : bookings.length === 0 ? (
        <div className="card">
          <EmptyState icon="calendar" title="No Bookings">
            {date ? `Nothing matches for ${formatDay(date)}.` : 'Nothing matches these filters.'}
          </EmptyState>
        </div>
      ) : (
        <>
          <h2 className="t-section-header">
            {date ? `Staying on ${formatDay(date)}` : 'All Bookings'} · {plural(bookings.length, 'booking')}
          </h2>
          <div className="card" data-stale={isLoading || deferredSearch !== search}>
            {bookings.map((booking) => (
              <BookingRow key={booking.id} booking={booking} showGuest />
            ))}
          </div>
          {date && (
            <p className="inline-note">Includes guests arriving, staying and leaving on this day.</p>
          )}
        </>
      )}
    </Page>
  )
}
