import { useCallback, useState } from 'react'
import { errorMessage, fieldErrors } from '../api/client'
import { hasErrors } from '@shared/validation.js'

/**
 * Form state with the proposal's two layers of validation:
 *
 * 1. Frontend — `validate` is one of the shared validators (the very same
 *    function the server runs), re-run on every change. A field's message
 *    appears once it has been left (blur) or the form submitted, so nobody
 *    is told they're wrong before they've started typing.
 * 2. Backend — whatever the server rejects comes back as per-field messages
 *    (400/409) and is shown in the same place, until that field is edited.
 *
 * @param {object} initialValues
 * @param {(values) => object} validate  returns { field: message }
 */
export function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues)
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErrors, setServerErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const clientErrors = validate(values)
  const errors = {}
  for (const field of new Set([...Object.keys(clientErrors), ...Object.keys(serverErrors)])) {
    if (clientErrors[field] && (submitted || touched[field])) errors[field] = clientErrors[field]
    else if (serverErrors[field]) errors[field] = serverErrors[field]
  }

  const setField = useCallback((name, value) => {
    setValues((current) => ({ ...current, [name]: value }))
    setServerErrors((current) => {
      if (!(name in current)) return current
      const next = { ...current }
      delete next[name]
      return next
    })
    setFormError('')
  }, [])

  /** Spreads onto an <input>/<select>: id, name, value, onChange, onBlur. */
  const bind = (name) => ({
    id: name,
    name,
    value: values[name] ?? '',
    onChange: (event) => setField(name, event.target.value),
    onBlur: () => setTouched((current) => (current[name] ? current : { ...current, [name]: true })),
    'aria-invalid': Boolean(errors[name]) || undefined,
  })

  /** Validates, then runs `action(values)`; server errors land on the form. */
  const submit = async (action) => {
    setSubmitted(true)
    if (hasErrors(clientErrors)) return
    setIsSubmitting(true)
    setFormError('')
    try {
      await action(values)
    } catch (error) {
      setServerErrors(fieldErrors(error))
      setFormError(errorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return { values, setValues, setField, bind, errors, formError, isSubmitting, submit }
}
