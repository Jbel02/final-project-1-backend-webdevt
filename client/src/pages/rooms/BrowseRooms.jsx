import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ROOM_TYPES } from '@shared/constants.js'
import { addDays, nightsBetween, todayDateOnly } from '@shared/dates.js'
import { hasErrors, validateStayDates } from '@shared/validation.js'
import { roomsApi } from '../../api'
import EmptyState from '../../components/EmptyState'
import DateField from '../../components/DateField'
import { FieldError } from '../../components/Field'
import Icon from '../../components/Icon'
import Page from '../../components/Page'
import PickerField from '../../components/PickerField'
import RoomPhoto from '../../components/RoomPhoto'
import { LoadError } from '../../components/States'
import Stepper from '../../components/Stepper'
import { useApi } from '../../hooks/useApi'
import { useDevice } from '../../context/DeviceContext'
import { ROOM_TYPE_ICONS, formatPeso, formatStay, plural } from '../../utils/format'

/**
 * Price / Night is a pick-one list, not two typed boxes — no keyboard, one tap.
 * The ranges follow the room-type prices (1,500 / 2,500 / 3,500 / 6,000); the
 * API's min and max are inclusive, so each range stops one peso short of the next.
 */
const PRICE_RANGES = [
  { value: 'any', label: 'Any Price', minPrice: '', maxPrice: '' },
  { value: 'under-2000', label: 'Under ₱2,000', minPrice: '', maxPrice: '1999' },
  { value: '2000-2999', label: '₱2,000 – ₱2,999', minPrice: '2000', maxPrice: '2999' },
  { value: '3000-4999', label: '₱3,000 – ₱4,999', minPrice: '3000', maxPrice: '4999' },
  { value: '5000-up', label: '₱5,000 and up', minPrice: '5000', maxPrice: '' },
]

/**
 * Room search for guests and visitors: date range, guest count (capacity),
 * price range and type. Every filter lives in the URL, like the midterm's
 * month — so a search survives a refresh, can be shared, and Back from a
 * room returns to exactly this list.
 */
export default function BrowseRooms() {
  const [params, setParams] = useSearchParams()
  const { device } = useDevice()
  const today = todayDateOnly()

  const filters = {
    checkIn: params.get('checkIn') ?? '',
    checkOut: params.get('checkOut') ?? '',
    guests: Number(params.get('guests')) || 1,
    type: params.get('type') ?? '',
  }

  // The URL keeps minPrice / maxPrice; a pair that is not one of the listed
  // ranges (an old link) reads as "Any Price".
  const priceRange =
    PRICE_RANGES.find(
      (range) =>
        range.minPrice === (params.get('minPrice') ?? '') && range.maxPrice === (params.get('maxPrice') ?? ''),
    ) ?? PRICE_RANGES[0]
  const { minPrice, maxPrice } = priceRange

  const setFilter = (name, value) => {
    const next = new URLSearchParams(params)
    if (value === '' || value === null || (name === 'guests' && value === 1)) next.delete(name)
    else next.set(name, String(value))
    // Picking a check-in on or after the current check-out moves check-out to
    // the next day, instead of leaving an impossible range on screen.
    if (name === 'checkIn' && value && (!filters.checkOut || filters.checkOut <= value)) {
      next.set('checkOut', addDays(value, 1))
    }
    setParams(next, { replace: true })
  }

  // Both bounds change together, so this is one URL update (two setFilter
  // calls would each start from the same stale params).
  const setPriceRange = (value) => {
    const range = PRICE_RANGES.find((option) => option.value === value) ?? PRICE_RANGES[0]
    const next = new URLSearchParams(params)
    next.delete('minPrice')
    next.delete('maxPrice')
    if (range.minPrice) next.set('minPrice', range.minPrice)
    if (range.maxPrice) next.set('maxPrice', range.maxPrice)
    setParams(next, { replace: true })
  }

  const hasDates = Boolean(filters.checkIn || filters.checkOut)
  const dateErrors = hasDates ? validateStayDates(filters, { today }) : {}
  const datesValid = hasDates && !hasErrors(dateErrors)

  const query = useMemo(
    () => ({
      ...(datesValid && { checkIn: filters.checkIn, checkOut: filters.checkOut }),
      ...(filters.guests > 1 && { guests: filters.guests }),
      ...(minPrice && { minPrice }),
      ...(maxPrice && { maxPrice }),
      ...(filters.type && { type: filters.type }),
    }),
    [datesValid, filters.checkIn, filters.checkOut, filters.guests, minPrice, maxPrice, filters.type],
  )

  const { data, error, isLoading, reload } = useApi(() => roomsApi.list(query), [query])
  const rooms = data?.rooms ?? []
  const nights = datesValid ? nightsBetween(filters.checkIn, filters.checkOut) : 0
  const isFiltered = hasDates || filters.guests > 1 || priceRange.value !== 'any' || filters.type

  return (
    <Page title="Rooms" wide>
      <div className="group">
        <h2 className="t-section-header">Your Stay</h2>
        <div
          className={
            device === 'tablet'
              ? 'grid gap-3'
              : 'grid gap-3 @min-[700px]/viewport:grid-cols-2'
          }
        >
          <div className="card">
            <DateField
              id="checkIn"
              strongPlaceholder
              label="Check-in"
              invalid={Boolean(dateErrors.checkIn)}
              min={today}
              value={filters.checkIn}
              onChange={(value) => setFilter('checkIn', value)}
            />
            <DateField
              id="checkOut"
              strongPlaceholder
              label="Check-out"
              invalid={Boolean(dateErrors.checkOut)}
              min={filters.checkIn ? addDays(filters.checkIn, 1) : addDays(today, 1)}
              value={filters.checkOut}
              onChange={(value) => setFilter('checkOut', value)}
            />
          </div>

          <div className="card">
            <div className="field">
              <span className="field__label">Guests</span>
              <span className="flex flex-1 items-center justify-end gap-3">
                <span className="t-numeric font-medium">{filters.guests}</span>
                <Stepper
                  label="Guests"
                  value={filters.guests}
                  min={1}
                  max={4}
                  onChange={(value) => setFilter('guests', value)}
                />
              </span>
            </div>
            <PickerField
              id="price"
              label="Price / Night"
              title="Price / Night"
              value={priceRange.value}
              options={PRICE_RANGES}
              onChange={setPriceRange}
            />
          </div>
        </div>
        {dateErrors.checkIn && <FieldError>{dateErrors.checkIn}</FieldError>}
        {dateErrors.checkOut && <FieldError>{dateErrors.checkOut}</FieldError>}
      </div>

      <div className="chip-scroller" role="group" aria-label="Room type">
        {['', ...ROOM_TYPES].map((type) => (
          <button
            key={type || 'all'}
            type="button"
            className="chip"
            aria-pressed={filters.type === type}
            onClick={() => setFilter('type', type)}
          >
            {type && <Icon name={ROOM_TYPE_ICONS[type]} className="chip__icon" />}
            {type || 'All Types'}
          </button>
        ))}
      </div>

      {!datesValid && !error && (
        <p className="notice mb-4">
          <Icon name="calendar" />
          Choose check-in and check-out dates to see which rooms are free for your stay.
        </p>
      )}

      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="t-headline">
          {data ? plural(rooms.length, datesValid ? 'Room Available' : 'Room', datesValid ? 'Rooms Available' : 'Rooms') : 'Rooms'}
        </h2>
        {datesValid && (
          <span className="t-footnote t-secondary">
            {formatStay(filters.checkIn, filters.checkOut)} · {plural(nights, 'night')}
          </span>
        )}
      </div>

      {error ? (
        <LoadError error={error} onRetry={reload} />
      ) : !data ? (
        <RoomGridSkeleton />
      ) : rooms.length === 0 ? (
        <div className="card">
          <EmptyState icon="bed" title="No Rooms Match">
            Try different dates, fewer guests or a wider price range.
          </EmptyState>
          {isFiltered && (
            <div className="px-4 pb-5">
              <button type="button" className="button button--tinted" onClick={() => setParams({}, { replace: true })}>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <ul
          className="grid gap-4 @min-[560px]/viewport:grid-cols-2 @min-[1100px]/viewport:grid-cols-3"
          data-stale={isLoading}
          data-toast-anchor
        >
          {rooms.map((room) => (
            <li key={room.id}>
              <RoomCard room={room} nights={nights} search={params.toString()} />
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}

function RoomCard({ room, nights, search }) {
  return (
    <Link to={{ pathname: `/rooms/${room.id}`, search }} className="room-card">
      <RoomPhoto src={room.photoUrl} alt={`Room ${room.roomNumber}`} className="room-card__photo" />
      <span className="room-card__body">
        <span className="flex items-center justify-between gap-2">
          <span className="t-headline">Room {room.roomNumber}</span>
          <span className="status-label">{room.type}</span>
        </span>
        <span className="t-footnote t-secondary">
          Floor {room.floor} · Up to {plural(room.maxOccupancy, 'guest')}
        </span>
        <span className="mt-1.5 flex items-baseline justify-between gap-2">
          <span>
            <span className="t-headline t-numeric">{formatPeso(room.pricePerNight)}</span>
            <span className="t-footnote t-secondary"> / night</span>
          </span>
          {nights > 0 && (
            <span className="t-footnote t-secondary t-numeric">
              {formatPeso(room.pricePerNight * nights)} total
            </span>
          )}
        </span>
      </span>
    </Link>
  )
}

function RoomGridSkeleton() {
  return (
    <div
      className="grid gap-4 @min-[560px]/viewport:grid-cols-2 @min-[1100px]/viewport:grid-cols-3"
      aria-busy="true"
      aria-label="Loading rooms"
      data-toast-anchor
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="room-card">
          <span className="skeleton room-card__photo rounded-none" />
          <span className="room-card__body gap-2">
            <span className="skeleton h-4 w-1/3" />
            <span className="skeleton h-3 w-1/2" />
          </span>
        </div>
      ))}
    </div>
  )
}
