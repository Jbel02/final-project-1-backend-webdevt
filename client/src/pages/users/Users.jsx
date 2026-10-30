import { useDeferredValue, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usersApi } from '../../api'
import Avatar from '../../components/Avatar'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import Page from '../../components/Page'
import SearchField from '../../components/SearchField'
import SegmentedControl from '../../components/SegmentedControl'
import { LoadError, LoadingRows } from '../../components/States'
import StatusBadge from '../../components/StatusBadge'
import { useApi } from '../../hooks/useApi'
import { plural } from '../../utils/format'
import { sortUsersByRole } from '../../utils/userOrder'

const SCOPES = [
  { value: 'all', label: 'All' },
  { value: 'guest', label: 'Guests' },
  { value: 'staff', label: 'Staff' },
]

/** Every registered account (manager only). */
export default function Users() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState('all')
  const deferredSearch = useDeferredValue(search)
  const { data, error, reload } = useApi(() => usersApi.list(), [])

  const term = deferredSearch.trim().toLowerCase()
  // Sorted by role after filtering, so All, Staff and search results all agree.
  const users = sortUsersByRole(
    (data?.users ?? []).filter(
      (user) =>
        (scope === 'all' || (scope === 'guest' ? user.role === 'guest' : user.role !== 'guest')) &&
        (!term || user.name.toLowerCase().includes(term) || user.email.includes(term)),
    ),
  )

  return (
    <Page
      title="Users"
      trailing={
        <button
          type="button"
          className="bar-button bar-button--floating"
          aria-label="New Receptionist"
          onClick={() => navigate('/users/new')}
        >
          <Icon name="personPlus" />
        </button>
      }
    >
      <SearchField value={search} onChange={setSearch} placeholder="Search name or email" />
      <SegmentedControl className="mb-5" label="Show" options={SCOPES} value={scope} onChange={setScope} />

      {error ? (
        <LoadError error={error} onRetry={reload} />
      ) : !data ? (
        <LoadingRows count={6} />
      ) : users.length === 0 ? (
        <div className="card">
          <EmptyState icon="people" title="No Accounts Found">
            Try a different name or email.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="card" data-stale={deferredSearch !== search}>
            {users.map((user) => (
              <Link key={user.id} to={`/users/${user.id}`} className="row row--tappable row--iconed">
                <Avatar name={user.name} role={user.role} />
                <span className="row__body">
                  <span className="row__title">{user.name}</span>
                  <span className="row__subtitle">{user.email}</span>
                </span>
                <span className="row__trailing">
                  {!user.isActive && <StatusBadge kind="account" value="inactive" />}
                  <StatusBadge kind="role" value={user.role} />
                  <Icon name="chevronRight" className="row__chevron" />
                </span>
              </Link>
            ))}
          </div>
          <p className="inline-note text-center">{plural(users.length, 'account')}</p>
        </>
      )}
    </Page>
  )
}
