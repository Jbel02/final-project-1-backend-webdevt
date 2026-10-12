import Icon from './Icon'

/**
 * A labelled row inside a grouped form card: label on the left, control
 * right-aligned on the right. Keeping label and control on one line is what
 * makes an iOS form read as a list of settings rather than a web form.
 */
export default function Field({ id, label, invalid = false, children }) {
  return (
    <div className={`field${invalid ? ' field--invalid' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  )
}

/**
 * Validation message. Rendered under the group it belongs to, next to what it
 * describes — and only after a field has been interacted with or the form
 * submitted, so nobody is told they're wrong before they've started.
 */
export function FieldError({ children }) {
  return (
    <p className="field-error" role="alert">
      <Icon name="warning" />
      {children}
    </p>
  )
}
