import Icon from './Icon'

/** iOS stepper: − | + in one pill, disabled at its limits rather than hidden. */
export default function Stepper({ value, min = 1, max = 10, onChange, label }) {
  return (
    <span className="stepper" role="group" aria-label={label}>
      <button
        type="button"
        className="stepper__button"
        aria-label={`Fewer ${label.toLowerCase()}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Icon name="minus" />
      </button>
      <span className="stepper__divider" aria-hidden="true" />
      <button
        type="button"
        className="stepper__button"
        aria-label={`More ${label.toLowerCase()}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Icon name="plus" />
      </button>
    </span>
  )
}
