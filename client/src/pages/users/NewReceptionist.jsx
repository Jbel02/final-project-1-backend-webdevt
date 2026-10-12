import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { validateStaffAccount } from '@shared/validation.js'
import { usersApi } from '../../api'
import Field, { FieldError } from '../../components/Field'
import Icon from '../../components/Icon'
import { CancelButton } from '../../components/NavButtons'
import Page from '../../components/Page'
import { useForm } from '../../hooks/useForm'

/** Manager creates a receptionist — staff are never self-registered. */
export default function NewReceptionist() {
  const navigate = useNavigate()
  const form = useForm({ name: '', email: '', password: '', contact: '' }, validateStaffAccount)
  const { errors } = form

  const handleSubmit = (event) => {
    event.preventDefault()
    form.submit(async (values) => {
      const { user } = await usersApi.createReceptionist(values)
      toast.success('Receptionist added', { description: `${user.name} can sign in now.` })
      navigate(`/users/${user.id}`, { replace: true })
    })
  }

  return (
    <Page
      title="New Receptionist"
      leading={<CancelButton fallback="/users" />}
      trailing={
        <button
          type="submit"
          form="receptionist-form"
          className="bar-button bar-button--strong bar-button--floating"
          disabled={form.isSubmitting}
        >
          Add
        </button>
      }
    >
      <form id="receptionist-form" className="mx-auto max-w-md" onSubmit={handleSubmit} noValidate>
        <div className="group">
          <h2 className="t-section-header">Account</h2>
          <div className="card">
            <Field id="name" label="Name" invalid={Boolean(errors.name)}>
              <input {...form.bind('name')} className="field__control" autoComplete="off" placeholder="Full name" />
            </Field>
            <Field id="email" label="Email" invalid={Boolean(errors.email)}>
              <input
                {...form.bind('email')}
                className="field__control"
                type="email"
                inputMode="email"
                autoComplete="off"
                placeholder="name@suitespot.test"
              />
            </Field>
            <Field id="password" label="Password" invalid={Boolean(errors.password)}>
              <input
                {...form.bind('password')}
                className="field__control"
                type="password"
                autoComplete="new-password"
                placeholder="8+ characters"
              />
            </Field>
            <Field id="contact" label="Phone" invalid={Boolean(errors.contact)}>
              <input {...form.bind('contact')} className="field__control" type="tel" placeholder="Optional" />
            </Field>
          </div>
          {['name', 'email', 'password', 'contact'].map(
            (field) => errors[field] && <FieldError key={field}>{errors[field]}</FieldError>,
          )}
          <p className="inline-note">
            Share the password with them in person. Receptionists can view bookings and check guests in
            and out, but can’t manage rooms or accounts.
          </p>
        </div>

        {form.formError && Object.keys(errors).length === 0 && (
          <p className="notice notice--warning mb-4" role="alert">
            <Icon name="warning" />
            {form.formError}
          </p>
        )}

        <button type="submit" className="button" disabled={form.isSubmitting}>
          {form.isSubmitting ? 'Adding…' : 'Add Receptionist'}
        </button>
      </form>
    </Page>
  )
}
