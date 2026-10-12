import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { usersApi } from '../../api'
import { errorMessage } from '../../api/client'
import ActionSheet from '../../components/ActionSheet'
import Avatar from '../../components/Avatar'
import Icon from '../../components/Icon'
import { BackButton } from '../../components/NavButtons'
import Page from '../../components/Page'
import { LoadError, LoadingRows } from '../../components/States'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { formatLongDate, plural } from '../../utils/format'

/** One account (manager only): details, deactivate/reactivate, delete. */
export default function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: me } = useAuth()
  const { data, error, reload, setData } = useApi(() => usersApi.get(id), [id])
  const [pending, setPending] = useState(null) // 'deactivate' | 'delete'
  const [isWorking, setIsWorking] = useState(false)

  const user = data?.user
  const isProtected = user && (user.id === me.id || user.role === 'manager')

  const setActive = async (active) => {
    setPending(null)
    setIsWorking(true)
    try {
      const { user: updated } = await (active ? usersApi.activate(id) : usersApi.deactivate(id))
      setData((current) => ({ ...current, user: updated }))
      toast.success(active ? 'Account reactivated' : 'Account deactivated', { description: updated.name })
    } catch (failure) {
      toast.error('Couldn’t update account', { description: errorMessage(failure) })
    } finally {
      setIsWorking(false)
    }
  }

  const remove = async () => {
    setPending(null)
    setIsWorking(true)
    try {
      await usersApi.remove(id)
      toast.success('Account deleted', { description: user.name })
      navigate('/users', { replace: true })
    } catch (failure) {
      toast.error('Couldn’t delete account', { description: errorMessage(failure) })
      setIsWorking(false)
    }
  }

  return (
    <Page title="Account" leading={<BackButton fallback="/users" label="Users" />}>
      {error ? (
        <LoadError error={error} onRetry={reload} />
      ) : !user ? (
        <LoadingRows count={5} />
      ) : (
        <>
          <div className="group">
            <div className="card">
              <div className="detail-hero">
                <Avatar name={user.name} role={user.role} size="large" />
                <p className="t-title mt-1">{user.name}</p>
                <div className="flex gap-2">
                  <StatusBadge kind="role" value={user.role} />
                  <StatusBadge kind="account" value={user.isActive ? 'active' : 'inactive'} />
                </div>
              </div>
            </div>
          </div>

          <div className="group">
            <h2 className="t-section-header">Contact</h2>
            <div className="card">
              <InfoRow label="Email">{user.email}</InfoRow>
              <InfoRow label="Phone">{user.contact || '—'}</InfoRow>
              <InfoRow label="Address">{user.address || '—'}</InfoRow>
            </div>
          </div>

          <div className="group">
            <h2 className="t-section-header">Account</h2>
            <div className="card">
              <InfoRow label="Joined">{formatLongDate(user.createdAt)}</InfoRow>
              {user.role === 'guest' && <InfoRow label="Bookings">{plural(data.bookingCount, 'booking')}</InfoRow>}
            </div>
          </div>

          {isProtected ? (
            <p className="notice">
              <Icon name="shield" />
              {user.id === me.id
                ? 'This is your account. Edit your details from Profile.'
                : 'Manager accounts can’t be deactivated or deleted here.'}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {user.isActive ? (
                <button type="button" className="button button--plain" disabled={isWorking} onClick={() => setPending('deactivate')}>
                  Deactivate Account
                </button>
              ) : (
                <button type="button" className="button button--tinted" disabled={isWorking} onClick={() => setActive(true)}>
                  Reactivate Account
                </button>
              )}
              <button type="button" className="button button--destructive" disabled={isWorking} onClick={() => setPending('delete')}>
                <Icon name="trash" />
                Delete Account
              </button>
              <p className="inline-note text-center">
                Deactivating blocks sign-in but keeps the account. Deleting removes it; past receipts keep
                the guest’s name.
              </p>
            </div>
          )}

          <ActionSheet
            open={pending === 'deactivate'}
            title={`Deactivate ${user.name}? They’ll be signed out and won’t be able to sign in until you reactivate the account.`}
            actions={[{ label: 'Deactivate Account', destructive: true, onSelect: () => setActive(false) }]}
            onClose={() => setPending(null)}
          />
          <ActionSheet
            open={pending === 'delete'}
            title={`Delete ${user.name}’s account? This can’t be undone.`}
            actions={[{ label: 'Delete Account', destructive: true, onSelect: remove }]}
            onClose={() => setPending(null)}
          />
        </>
      )}
    </Page>
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
