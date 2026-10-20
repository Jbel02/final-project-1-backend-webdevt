import { useId, useMemo, useState } from 'react'
import { parseDateOnly, todayDateOnly } from '@shared/dates.js'
import { useDevice } from '../context/DeviceContext'
import { formatPickerDate } from '../utils/format'
import Field from './Field'
import Icon from './Icon'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] // prettier-ignore

const pad = (n) => String(n).padStart(2, '0')
const toKey = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`
const monthOf = (dateOnly) => {
  const date = parseDateOnly(dateOnly)
  return date ? { year: date.getUTCFullYear(), month: date.getUTCMonth() } : null
}

/**
 * A date row for a grouped form card.
 *
 * - Desktop preview: the browser's own date input, exactly as before.
 * - Tablet / Phone preview: an iOS-Calendar-style row. The date sits in a
 *   rounded pill; tapping it unfolds an inline month calendar underneath
 *   (red-free, in the app's accent colour). The calendar is sized by the
 *   screen it is drawn in (container queries on `.viewport`), so it follows
 *   the device preview instead of inheriting desktop sizing.
 *
 * @param {string} value        'YYYY-MM-DD' or ''
 * @param {(value: string) => void} onChange
 * @param {string} [min]        earliest selectable date
 * @param {string} [max]        latest selectable date
 * @param {boolean} [clearable] show a Clear action (optional dates)
 * @param {boolean} [strongPlaceholder] draw the empty "Select" text in the
 *   primary label colour (black in light mode) instead of the faint tertiary
 *   grey. Touch layouts only; the Desktop native input is unaffected.
 */
export default function DateField({
  id,
  label,
  value,
  onChange,
  onBlur,
  min,
  max,
  invalid = false,
  clearable = false,
  strongPlaceholder = false,
}) {
  const { device } = useDevice()

  if (device === 'desktop') {
    return (
      <Field id={id} label={label} invalid={invalid}>
        <input
          id={id}
          className="field__control"
          type="date"
          min={min}
          max={max}
          value={value}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
        />
      </Field>
    )
  }

  return (
    <TouchDateField
      {...{ id, label, value, onChange, onBlur, min, max, invalid, clearable, strongPlaceholder }}
    />
  )
}

function TouchDateField({
  id,
  label,
  value,
  onChange,
  onBlur,
  min,
  max,
  invalid,
  clearable,
  strongPlaceholder,
}) {
  const panelId = useId()
  const today = todayDateOnly()
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState('days') // 'days' | 'months'
  const [shown, setShown] = useState(
    () => monthOf(value) ?? monthOf(min && min > today ? min : today),
  )

  const open = () => {
    // Re-centre on the selected date each time the calendar unfolds.
    setShown(monthOf(value) ?? monthOf(min && min > today ? min : today))
    setView('days')
    setIsOpen(true)
  }
  const close = () => {
    setIsOpen(false)
    onBlur?.()
  }

  const isDisabled = (key) => Boolean((min && key < min) || (max && key > max))
  const pick = (key) => {
    onChange(key)
    close()
  }

  const stepMonth = (delta) =>
    setShown(({ year, month }) => {
      const next = new Date(Date.UTC(year, month + delta, 1))
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() }
    })

  const canClear = clearable && Boolean(value)
  const canToday = !isDisabled(today)

  const canGoBack = !min || toKey(shown.year, shown.month, 1) > min.slice(0, 8) + '01'
  const canGoForward = !max || toKey(shown.year, shown.month + 1, 1) <= max

  return (
    <>
      <div className={`field${invalid ? ' field--invalid' : ''}`}>
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
        <button
          id={id}
          type="button"
          className={`date-pill${strongPlaceholder ? ' date-pill--strong' : ''}`}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => (isOpen ? close() : open())}
        >
          {value ? formatPickerDate(value) : <span className="date-pill__placeholder">Select</span>}
        </button>
      </div>

      {isOpen && (
        <div className="date-panel" id={panelId}>
          <div className="calendar">
            <div className="calendar__header">
              <button
                type="button"
                className="calendar__title"
                aria-expanded={view === 'months'}
                onClick={() => setView(view === 'days' ? 'months' : 'days')}
              >
                {view === 'days' ? `${MONTH_NAMES[shown.month]} ${shown.year}` : shown.year}
                <Icon name="chevronRight" className="calendar__title-chevron" />
              </button>
              <span className="calendar__nav">
                <button
                  type="button"
                  className="calendar__arrow"
                  aria-label={view === 'days' ? 'Previous month' : 'Previous year'}
                  disabled={view === 'days' ? !canGoBack : false}
                  onClick={() =>
                    view === 'days' ? stepMonth(-1) : setShown((s) => ({ ...s, year: s.year - 1 }))
                  }
                >
                  <Icon name="chevronLeft" />
                </button>
                <button
                  type="button"
                  className="calendar__arrow"
                  aria-label={view === 'days' ? 'Next month' : 'Next year'}
                  disabled={view === 'days' ? !canGoForward : false}
                  onClick={() =>
                    view === 'days' ? stepMonth(1) : setShown((s) => ({ ...s, year: s.year + 1 }))
                  }
                >
                  <Icon name="chevronRight" />
                </button>
              </span>
            </div>

            {view === 'days' ? (
              <DayGrid
                shown={shown}
                value={value}
                today={today}
                isDisabled={isDisabled}
                onPick={pick}
              />
            ) : (
              <div className="calendar__months" role="group" aria-label="Month">
                {MONTH_NAMES.map((name, month) => {
                  const monthKey = `${shown.year}-${pad(month + 1)}`
                  const disabled = Boolean(
                    (min && monthKey < min.slice(0, 7)) || (max && monthKey > max.slice(0, 7)),
                  )
                  return (
                    <button
                      key={name}
                      type="button"
                      className="calendar__month"
                      aria-pressed={shown.month === month}
                      disabled={disabled}
                      onClick={() => {
                        setShown({ year: shown.year, month })
                        setView('days')
                      }}
                    >
                      {name.slice(0, 3)}
                    </button>
                  )
                })}
              </div>
            )}

            {(canClear || canToday) && (
              <div className="calendar__footer">
                {canClear ? (
                  <button type="button" className="calendar__action" onClick={() => pick('')}>
                    Clear
                  </button>
                ) : (
                  <span />
                )}
                {canToday && (
                  <button type="button" className="calendar__action" onClick={() => pick(today)}>
                    Today
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function DayGrid({ shown, value, today, isDisabled, onPick }) {
  const { year, month } = shown
  const cells = useMemo(() => {
    const leading = new Date(Date.UTC(year, month, 1)).getUTCDay()
    const total = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    return [
      ...Array.from({ length: leading }, () => null),
      ...Array.from({ length: total }, (_, index) => index + 1),
    ]
  }, [year, month])

  return (
    <div className="calendar__grid" role="grid" aria-label={`${MONTH_NAMES[month]} ${year}`}>
      {WEEKDAYS.map((day) => (
        <span key={day} className="calendar__weekday" role="columnheader">
          {day}
        </span>
      ))}
      {cells.map((day, index) => {
        if (day === null) return <span key={`blank-${index}`} />
        const key = toKey(year, month, day)
        return (
          <button
            key={key}
            type="button"
            className="calendar__day"
            aria-pressed={key === value}
            aria-current={key === today ? 'date' : undefined}
            aria-label={formatPickerDate(key)}
            disabled={isDisabled(key)}
            onClick={() => onPick(key)}
          >
            {day}
          </button>
        )
      })}
    </div>
  )
}
