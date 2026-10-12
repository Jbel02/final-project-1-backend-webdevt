import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { validateLogin } from '@shared/validation.js'
import Field, { FieldError } from '../../components/Field'
import Icon from '../../components/Icon'
import { CancelButton } from '../../components/NavButtons'
import Page from '../../components/Page'
import { useAuth } from '../../context/AuthContext'
import { homePathFor } from '../../data/navItems'
import { useForm } from '../../hooks/useForm'
import { safeNext } from '../../utils/safeNext'

const firstName = (name) => name.split(' ')[0]

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
      toast.success(`Welcome back, ${firstName(signedIn.name)}`)
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
                <input
                  {...form.bind('password')}
                  className="field__control"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Required"
                />
              </Field>
            </div>
            {form.errors.email && <FieldError>{form.errors.email}</FieldError>}
            {form.errors.password && <FieldError>{form.errors.password}</FieldError>}
          </div>

          {form.formError && !form.errors.email && !form.errors.password && (
            <p className="notice notice--warning mb-4" role="alert">
              <Icon name="warning" />
              {form.formError}
            </p>
          )}

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
