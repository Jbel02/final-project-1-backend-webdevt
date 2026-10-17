/* ===== Display formatting =====
   Pesos and calendar dates, iOS-style ("Mon, Oct 12", "Oct 12 – 15").
   Stay dates arrive as UTC-midnight ISO strings (see shared/dates.js), so
   they are always formatted in UTC — otherwise a browser west of Greenwich
   would show every stay one day early. */

const pesoWhole = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})
const pesoCents = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatPeso(amount) {
  const value = Number(amount) || 0
  return (Number.isInteger(value) ? pesoWhole : pesoCents).format(value)
}

/** Options for NumberFlow, so animated figures match formatPeso. */
export const PESO_FORMAT = {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  trailingZeroDisplay: 'stripIfInteger',
}

const dayFormat = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})
const longFormat = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})
const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const dayOnly = new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'UTC' })

/** Accepts 'YYYY-MM-DD' or an ISO timestamp. */
const asDate = (value) => new Date(value.length === 10 ? `${value}T00:00:00Z` : value)

const pickerFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

/** "Oct 17, 2026" — the date shown in the iOS-style date pill. */
export const formatPickerDate = (value) => pickerFormat.format(asDate(value))

export const dateOnly = (value) => (value ? String(value).slice(0, 10) : '')
export const formatDay = (value) => dayFormat.format(asDate(value))
export const formatLongDate = (value) => longFormat.format(asDate(value))

/** "Oct 12 – 15" in one month, "Oct 30 – Nov 2" across two. */
export function formatStay(checkIn, checkOut) {
  const start = asDate(checkIn)
  const end = asDate(checkOut)
  const sameMonth =
    start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear()
  return `${monthDay.format(start)} – ${(sameMonth ? dayOnly : monthDay).format(end)}`
}

export const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`

export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? '?').slice(0, 2)
  return letters.toUpperCase()
}

export const MEAL_LABELS = {
  none: 'No Meals',
  lunch: 'Lunch',
  dinner: 'Dinner',
  both: 'Lunch & Dinner',
}

/** Label + iOS system colour for every status-like value in the app. */
export const STATUS_STYLES = {
  booking: {
    confirmed: { label: 'Confirmed', color: 'var(--blue)' },
    'checked-in': { label: 'Checked In', color: 'var(--green)' },
    completed: { label: 'Completed', color: 'var(--gray)' },
    cancelled: { label: 'Cancelled', color: 'var(--red)' },
  },
  room: {
    available: { label: 'Available', color: 'var(--green)' },
    maintenance: { label: 'Maintenance', color: 'var(--orange)' },
  },
  payment: {
    full: { label: 'Paid in Full', color: 'var(--green)' },
    partial: { label: 'Partial (30%)', color: 'var(--orange)' },
  },
  role: {
    guest: { label: 'Guest', color: 'var(--blue)' },
    receptionist: { label: 'Receptionist', color: 'var(--purple)' },
    manager: { label: 'Manager', color: 'var(--indigo)' },
  },
  account: {
    active: { label: 'Active', color: 'var(--green)' },
    inactive: { label: 'Deactivated', color: 'var(--red)' },
  },
}

/** Icon name (see Icon.jsx) for each room type, used by the type filter chips. */
export const ROOM_TYPE_ICONS = {
  Single: 'roomSingle',
  Double: 'roomDouble',
  King: 'roomKing',
  Suite: 'roomSuite',
}
