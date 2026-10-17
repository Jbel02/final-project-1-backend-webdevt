import { useDeferredValue, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROOM_TYPES } from '@shared/constants.js'
import { roomsApi } from '../../api'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import Page from '../../components/Page'
import RoomPhoto from '../../components/RoomPhoto'
import SearchField from '../../components/SearchField'
import SegmentedControl from '../../components/SegmentedControl'
import { LoadError, LoadingRows } from '../../components/States'
import StatusBadge from '../../components/StatusBadge'
import { useApi } from '../../hooks/useApi'
import { ROOM_TYPE_ICONS, formatPeso, plural } from '../../utils/format'

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'maintenance', label: 'Maintenance' },
]

/**
 * The manager's view of all 80 rooms, grouped by floor like a Settings list.
 * The list is small enough to fetch once and filter in the browser; the
 * search box reads a deferred copy so typing never stutters (the midterm's
 * useDeferredValue technique).
 */
export default function ManageRooms() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const deferredSearch = useDeferredValue(search)

  const { data, error, reload } = useApi(() => roomsApi.list(), [])
  const allRooms = data?.rooms ?? []

  const term = deferredSearch.trim()
  const rooms = allRooms.filter(
    (room) =>
      (!term || room.roomNumber.includes(term)) &&
      (!type || room.type === type) &&
      (!status || room.status === status),
  )
  const floors = [...new Set(rooms.map((room) => room.floor))].sort((a, b) => a - b)
  const inMaintenance = allRooms.filter((room) => room.status === 'maintenance').length

  return (
    <Page
      title="Rooms"
      trailing={
        <button
          type="button"
          className="bar-button bar-button--floating"
          aria-label="Add Room"
          onClick={() => navigate('/rooms/new')}
        >
          <Icon name="plus" />
        </button>
      }
    >
      <SearchField value={search} onChange={setSearch} placeholder="Search room number" />

      <div className="chip-scroller" role="group" aria-label="Room type">
        {['', ...ROOM_TYPES].map((option) => (
          <button
            key={option || 'all'}
            type="button"
            className="chip"
            aria-pressed={type === option}
            onClick={() => setType(option)}
          >
            {option && <Icon name={ROOM_TYPE_ICONS[option]} className="chip__icon" />}
            {option || 'All Types'}
          </button>
        ))}
      </div>

      <SegmentedControl
        className="mb-5"
        label="Room status"
        options={STATUS_OPTIONS}
        value={status}
        onChange={setStatus}
      />

      {error ? (
        <LoadError error={error} onRetry={reload} />
      ) : !data ? (
        <LoadingRows count={6} thumb />
      ) : rooms.length === 0 ? (
        <div className="card">
          <EmptyState icon="bed" title="No Rooms Found">
            {allRooms.length ? 'Try a different room number or filter.' : 'Add your first room with the + button.'}
          </EmptyState>
        </div>
      ) : (
        <div data-stale={deferredSearch !== search}>
          {floors.map((floor) => (
            <section key={floor} className="group">
              <h2 className="t-section-header">Floor {floor}</h2>
              <div className="card">
                {rooms
                  .filter((room) => room.floor === floor)
                  .map((room) => (
                    <Link key={room.id} to={`/rooms/${room.id}`} className="row row--tappable row--thumbed">
                      <RoomPhoto src={room.photoUrl} className="row__thumb" />
                      <span className="row__body">
                        <span className="row__title">Room {room.roomNumber}</span>
                        <span className="row__subtitle">
                          {room.type} · Up to {plural(room.maxOccupancy, 'guest')} ·{' '}
                          {formatPeso(room.pricePerNight)}
                        </span>
                      </span>
                      <span className="row__trailing">
                        {room.status === 'maintenance' && <StatusBadge kind="room" value="maintenance" />}
                        <Icon name="chevronRight" className="row__chevron" />
                      </span>
                    </Link>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {data && (
        <p className="inline-note text-center">
          {plural(allRooms.length, 'room')} · {inMaintenance} in maintenance. Rooms in maintenance are
          hidden from guests.
        </p>
      )}
    </Page>
  )
}
