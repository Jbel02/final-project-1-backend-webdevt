import { useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { validateProfile } from '@shared/validation.js'
import { usersApi } from '../api'
import Avatar from '../components/Avatar'
import Field, { FieldError } from '../components/Field'
import Icon from '../components/Icon'
import Page from '../components/Page'
import StatusBadge from '../components/StatusBadge'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { useForm } from '../hooks/useForm'

const FIELDS = [
  { name: 'name', label: 'Name', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'contact', label: 'Phone', type: 'tel', autoComplete: 'tel', placeholder: 'Optional' },
  { name: 'address', label: 'Address', autoComplete: 'street-address', placeholder: 'Optional' },
]

/**
 * Everyone's own account: edit profile (Guest "edits own profile" in the
 * proposal; staff get it too), dark mode, sign out. Read and edit are two
 * views, like the midterm's transaction detail — Edit swaps in the form,
 * Cancel simply unmounts it and the draft is gone.
 */
export default function Profile() {
  const [isEditing, setIsEditing] = useState(false)
  return (
    <AnimatePresence initial={false}>
      {isEditing ? (
        <EditProfile key="edit" onDone={() => setIsEditing(false)} />
      ) : (
        <ProfileView key="read" onEdit={() => setIsEditing(true)} />
      )}
    </AnimatePresence>
  )
}

function ProfileView({ onEdit }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  // Leave first, then end the session: if the user went null while this
  // screen was still the current route, its guard would redirect to Sign In.
  const handleSignOut = async () => {
    navigate('/rooms', { replace: true })
    await signOut()
    toast('Signed out')
  }

  return (
    <Page
      title="Profile"
      trailing={
        <button type="button" className="bar-button bar-button--floating" onClick={onEdit}>
          Edit
        </button>
      }
    >
      <div className="group">
        <div className="card">
          <div className="detail-hero">
            <Avatar name={user.name} role={user.role} size="large" />
            <p className="t-title mt-1">{user.name}</p>
            <p className="t-subhead t-secondary">{user.email}</p>
            <StatusBadge kind="role" value={user.role} />
          </div>
        </div>
      </div>

      <div className="group">
        <h2 className="t-section-header">Personal Information</h2>
        <div className="card">
          {FIELDS.map((field) => (
            <div key={field.name} className="row">
              <span className="row__body">
                <span className="row__title">{field.label}</span>
              </span>
              <span className="row__trailing t-secondary min-w-0 truncate">{user[field.name] || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="group">
        <h2 className="t-section-header">Appearance</h2>
        <div className="card">
          <ThemeToggle />
        </div>
      </div>

      <button type="button" className="button button--destructive" onClick={handleSignOut}>
        <Icon name="signOut" />
        Sign Out
      </button>
    </Page>
  )
}

function EditProfile({ onDone }) {
  const { user, setUser } = useAuth()
  const form = useForm(
    { name: user.name, email: user.email, contact: user.contact ?? '', address: user.address ?? '' },
    validateProfile,
  )

  const handleSubmit = (event) => {
    event.preventDefault()
    form.submit(async (values) => {
      const { user: updated } = await usersApi.updateMe(values)
      setUser(updated)
      toast.success('Profile updated')
      onDone()
    })
  }

  return (
    <Page
      title="Edit Profile"
      leading={
        <button type="button" className="bar-button" onClick={onDone}>
          Cancel
        </button>
      }
      trailing={
        <button
          type="submit"
          form="profile-form"
          className="bar-button bar-button--strong bar-button--floating"
          disabled={form.isSubmitting}
        >
          Save
        </button>
      }
    >
      <form id="profile-form" onSubmit={handleSubmit} noValidate>
        <div className="group">
          <h2 className="t-section-header">Personal Information</h2>
          <div className="card">
            {FIELDS.map((field) => (
              <Field key={field.name} id={field.name} label={field.label} invalid={Boolean(form.errors[field.name])}>
                <input
                  {...form.bind(field.name)}
                  className="field__control"
                  type={field.type ?? 'text'}
                  autoComplete={field.autoComplete}
                  placeholder={field.placeholder}
                />
              </Field>
            ))}
          </div>
          {FIELDS.map(
            (field) => form.errors[field.name] && <FieldError key={field.name}>{form.errors[field.name]}</FieldError>,
          )}
        </div>

        {form.formError && Object.keys(form.errors).length === 0 && (
          <p className="notice notice--warning mb-4" role="alert">
            <Icon name="warning" />
            {form.formError}
          </p>
        )}

        <button type="submit" className="button" disabled={form.isSubmitting}>
          {form.isSubmitting ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </Page>
  )
}
