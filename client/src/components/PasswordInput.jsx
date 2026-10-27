import { useState } from 'react'
import Icon from './Icon'

/**
 * A password control for a <Field> row: the input plus an eye toggle at the
 * trailing edge. The glyph shows the current state (crossed eye = hidden, open
 * eye = visible); the label names the action. Every other prop goes to the input.
 */
export default function PasswordInput(props) {
  const [isVisible, setIsVisible] = useState(false)
  return (
    <>
      <input {...props} className="field__control" type={isVisible ? 'text' : 'password'} />
      <button
        type="button"
        className="field__toggle"
        aria-label={isVisible ? 'Hide password' : 'Show password'}
        aria-pressed={isVisible}
        onClick={() => setIsVisible((visible) => !visible)}
      >
        <Icon name={isVisible ? 'eye' : 'eyeSlash'} />
      </button>
    </>
  )
}
