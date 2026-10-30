import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { validateLogin } from '@shared/validation.js'
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

const firstName = (name) => name.split(' ')[0]

/** Staff are greeted by role (their names are "Hotel Manager", "Front Desk"); guests by first name. */
const ROLE_GREETING = { receptionist: 'Receptionist', manager: 'Manager' }
const greetingName = (user) => ROLE_GREETING[user.role] ?? firstName(user.name)

export default function SignIn() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const [isLeaving, setIsLeaving] = useState(false)
  const form = useForm({ email: '', password: '' }, validateLogin)

  // Already signed in (e.g. Back after signing in): this screen has no job.
  // `isLeaving`: once this screen has navigated away it keeps rendering during
  // its exit animation — it must not redirect a second time.
  if (user && !isLeaving) return <Navigate to={next ?? homePathFor(user)} replace />

  const handleSubmit = (event) => {
    event.preventDefault()
    form.submit(async (values) => {
      setIsLeaving(true)
      const signedIn = await signIn(values)
      notifyAuth(`Welcome back, ${greetingName(signedIn)}`, {
        bannerDescription: 'You’re signed in to SuiteSpot.',
      })
      navigate(next ?? homePathFor(signedIn), { replace: true })
    })
  }

  return (
    <Page title="Sign In" leading={<CancelButton fallback="/rooms" />}>
      <div className="mx-auto max-w-md">
        <div className="flex flex-col items-center gap-2 px-4 pt-4 pb-7 text-center">
          <span className="grid size-16 place-items-center rounded-[18px] bg-accent text-white shadow-lg">
            <Icon name="bed" className="size-9" />
          </span>
          <h2 className="t-title mt-2">Welcome to SuiteSpot</h2>
          <p className="t-subhead t-secondary">Sign in to book rooms and manage your stays.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="group">
            <div className="card">
              <Field id="email" label="Email" invalid={Boolean(form.errors.email)}>
                <input
                  {...form.bind('email')}
                  className="field__control"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="name@example.com"
                />
              </Field>
              <Field id="password" label="Password" invalid={Boolean(form.errors.password)}>
                <PasswordInput
                  {...form.bind('password')}
                  autoComplete="current-password"
                  placeholder="Required"
                />
              </Field>
            </div>
            {form.errors.email && <FieldError>{form.errors.email}</FieldError>}
            {form.errors.password && <FieldError>{form.errors.password}</FieldError>}
            {form.formError && !form.errors.email && !form.errors.password && (
              <FieldError>{form.formError}</FieldError>
            )}
          </div>

          <button type="submit" className="button" disabled={form.isSubmitting}>
            {form.isSubmitting ? 'Signing In…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center t-subhead t-secondary">
          New to SuiteSpot?{' '}
          <Link to={`/signup${next ? `?next=${encodeURIComponent(next)}` : ''}`} replace>
            Create Account
          </Link>
        </p>
        <p className="inline-note text-center">
          Staff accounts are created by the hotel manager.
        </p>
      </div>
    </Page>
  )
}
