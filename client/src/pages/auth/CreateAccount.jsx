import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { validateRegistration } from '@shared/validation.js'
import Field, { FieldError } from '../../components/Field'
import Icon from '../../components/Icon'
import { CancelButton } from '../../components/NavButtons'
import Page from '../../components/Page'
import PasswordInput from '../../components/PasswordInput'
import { useAuth } from '../../context/AuthContext'
import { homePathFor } from '../../data/navItems'
import { useForm } from '../../hooks/useForm'
import { notifyAuth } from '../../utils/notify'
import { safeNext } from '../../utils/safeNext'

/** Guest self-registration. Staff accounts are made by the manager instead. */
export default function CreateAccount() {
  const { user, signUp } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const [isLeaving, setIsLeaving] = useState(false)
  const form = useForm(
    { name: '', email: '', password: '', contact: '', address: '' },
    validateRegistration,
  )

  // `isLeaving`: once this screen has navigated away it keeps rendering during
  // its exit animation — it must not redirect a second time.
  if (user && !isLeaving) return <Navigate to={next ?? homePathFor(user)} replace />

  const handleSubmit = (event) => {
    event.preventDefault()
    form.submit(async (values) => {
      setIsLeaving(true)
      const created = await signUp(values)
      notifyAuth('Account created', { description: `You’re signed in as ${created.email}.` })
      navigate(next ?? homePathFor(created), { replace: true })
    })
  }

  const { errors } = form

  return (
    <Page title="Create Account" leading={<CancelButton fallback="/rooms" />}>
      <form className="mx-auto max-w-md" onSubmit={handleSubmit} noValidate>
        <div className="group">
          <h2 className="t-section-header">Account</h2>
          <div className="card">
            <Field id="name" label="Name" invalid={Boolean(errors.name)}>
              <input {...form.bind('name')} className="field__control" autoComplete="name" placeholder="Juan Dela Cruz" />
            </Field>
            <Field id="email" label="Email" invalid={Boolean(errors.email)}>
              <input
                {...form.bind('email')}
                className="field__control"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="name@example.com"
              />
            </Field>
            <Field id="password" label="Password" invalid={Boolean(errors.password)}>
              <PasswordInput
                {...form.bind('password')}
                autoComplete="new-password"
                placeholder="8+ characters"
              />
            </Field>
          </div>
          {['name', 'email', 'password'].map(
            (field) => errors[field] && <FieldError key={field}>{errors[field]}</FieldError>,
          )}
          {!errors.password && (
            <p className="inline-note">Use at least 8 characters, with a letter and a number.</p>
          )}
        </div>

        <div className="group">
          <h2 className="t-section-header">Contact Details</h2>
          <div className="card">
            <Field id="contact" label="Phone" invalid={Boolean(errors.contact)}>
              <input
                {...form.bind('contact')}
                className="field__control"
                type="tel"
                autoComplete="tel"
                placeholder="Optional"
              />
            </Field>
            <Field id="address" label="Address" invalid={Boolean(errors.address)}>
              <input
                {...form.bind('address')}
                className="field__control"
                autoComplete="street-address"
                placeholder="Optional"
              />
            </Field>
          </div>
          {errors.contact && <FieldError>{errors.contact}</FieldError>}
          {errors.address && <FieldError>{errors.address}</FieldError>}
          <p className="inline-note">Helps the front desk reach you about your stay.</p>
        </div>

        {form.formError && Object.keys(errors).length === 0 && (
          <p className="notice notice--warning mb-4" role="alert">
            <Icon name="warning" />
            {form.formError}
          </p>
        )}

        <button type="submit" className="button" disabled={form.isSubmitting}>
          {form.isSubmitting ? 'Creating Account…' : 'Create Account'}
        </button>

        <p className="mt-6 text-center t-subhead t-secondary">
          Already have an account?{' '}
          <Link to={`/signin${next ? `?next=${encodeURIComponent(next)}` : ''}`} replace>
            Sign In
          </Link>
        </p>
      </form>
    </Page>
  )
}
