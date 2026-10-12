import { HOTEL_TIME_ZONE } from './constants.js'

/* ===== Date-only helpers =====
   A stay is a pair of calendar dates, not instants. Everything here works on
   'YYYY-MM-DD' strings, and anything stored becomes UTC midnight of that
   date — so a booking for 12 Oct is 12 Oct no matter which time zone the
   browser or the server happens to be in. */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 86_400_000

/** 'YYYY-MM-DD' → Date at UTC midnight, or null if it isn't a real date. */
export function parseDateOnly(value) {
  if (typeof value !== 'string' || !DATE_ONLY.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  // Rejects rollovers like 2026-02-31, which Date would quietly turn into March.
  return Number.isNaN(date.getTime()) || toDateOnly(date) !== value ? null : date
}

/** Date → 'YYYY-MM-DD', read in UTC (the inverse of parseDateOnly). */
export function toDateOnly(date) {
  return new Date(date).toISOString().slice(0, 10)
}

/** The hotel's current calendar date, regardless of the machine's zone. */
export function todayDateOnly(now = new Date()) {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: HOTEL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function addDays(dateOnly, days) {
  const date = parseDateOnly(dateOnly)
  if (!date) return null
  return toDateOnly(new Date(date.getTime() + days * DAY_MS))
}

/** Nights between check-in and check-out (check-out day is not a night). */
export function nightsBetween(checkIn, checkOut) {
  const start = parseDateOnly(checkIn)
  const end = parseDateOnly(checkOut)
  if (!start || !end) return 0
  return Math.round((end.getTime() - start.getTime()) / DAY_MS)
}

/**
 * Two stays clash when each starts before the other ends. Check-out day is
 * free for the next guest, so [10–12) and [12–14) do not overlap.
 */
export function rangesOverlap(aIn, aOut, bIn, bOut) {
  return aIn < bOut && aOut > bIn
}
