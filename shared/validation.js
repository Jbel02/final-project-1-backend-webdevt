import {
  MAX_NIGHTS,
  MEAL_ADDONS,
  PAYMENT_STATUSES,
  ROOM_STATUSES,
  ROOM_TYPES,
  TOTAL_FLOORS,
} from './constants.js'
import { nightsBetween, parseDateOnly } from './dates.js'

/* ===== Validation rules =====
   Every validator returns an object of `{ field: message }`; an empty object
   means valid. The same functions run in the browser (instant feedback) and
   on the server (the actual gate), so the two can never disagree about what
   counts as a valid booking.

   Messages follow iOS tone: short, plain, one sentence, no blame. */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const CONTACT = /^\+?[\d\s()-]{7,20}$/
const ROOM_NUMBER = /^\d{3,4}$/

const text = (value) => (typeof value === 'string' ? value.trim() : '')
const isNumber = (value) => value !== '' && value !== null && Number.isFinite(Number(value))

export const hasErrors = (errors) => Object.keys(errors).length > 0

function checkName(errors, name) {
  const value = text(name)
  if (!value) errors.name = 'Enter a name.'
  else if (value.length > 80) errors.name = 'Name must be 80 characters or fewer.'
}

function checkEmail(errors, email) {
  const value = text(email)
  if (!value) errors.email = 'Enter an email address.'
  else if (!EMAIL.test(value)) errors.email = 'Enter a valid email address.'
}

function checkPassword(errors, password) {
  if (typeof password !== 'string' || password.length === 0) {
    errors.password = 'Enter a password.'
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Use at least one letter and one number.'
  }
}

function checkContactAndAddress(errors, { contact, address }) {
  const phone = text(contact)
  if (phone && !CONTACT.test(phone)) errors.contact = 'Enter a valid phone number.'
  if (text(address).length > 200) errors.address = 'Address must be 200 characters or fewer.'
}

/** The password rule on its own — used where there is no whole account form to validate. */
export function validateNewPassword(password) {
  const errors = {}
  checkPassword(errors, password)
  return errors
}

export function validateRegistration(values) {
  const errors = {}
  checkName(errors, values.name)
  checkEmail(errors, values.email)
  checkPassword(errors, values.password)
  checkContactAndAddress(errors, values)
  return errors
}

/** Same shape as a guest sign-up — a receptionist is a person with a login. */
export const validateStaffAccount = validateRegistration

export function validateLogin(values) {
  const errors = {}
  if (!text(values.email)) errors.email = 'Enter your email address.'
  if (!values.password) errors.password = 'Enter your password.'
  return errors
}

export function validateProfile(values) {
  const errors = {}
  checkName(errors, values.name)
  checkEmail(errors, values.email)
  checkContactAndAddress(errors, values)
  return errors
}

export function validateRoom(values) {
  const errors = {}
  const roomNumber = text(String(values.roomNumber ?? ''))
  const floor = Number(values.floor)

  if (!roomNumber) errors.roomNumber = 'Enter a room number.'
  else if (!ROOM_NUMBER.test(roomNumber)) errors.roomNumber = 'Use 3 or 4 digits, like 305.'

  if (!Number.isInteger(floor) || floor < 1 || floor > TOTAL_FLOORS) {
    errors.floor = `Choose a floor from 1 to ${TOTAL_FLOORS}.`
  } else if (roomNumber && !errors.roomNumber && !roomNumber.startsWith(String(floor))) {
    // Room numbers carry their floor (305 is on floor 3); a mismatch is
    // almost always a typo, and it would send a guest to the wrong floor.
    errors.roomNumber = `Rooms on floor ${floor} start with ${floor}.`
  }

  if (!ROOM_TYPES.includes(values.type)) errors.type = 'Choose a room type.'

  if (!isNumber(values.pricePerNight) || Number(values.pricePerNight) <= 0) {
    errors.pricePerNight = 'Enter a price above zero.'
  } else if (Number(values.pricePerNight) > 1_000_000) {
    errors.pricePerNight = 'Enter a realistic nightly price.'
  }

  const occupancy = Number(values.maxOccupancy)
  if (!Number.isInteger(occupancy) || occupancy < 1 || occupancy > 10) {
    errors.maxOccupancy = 'Choose 1 to 10 guests.'
  }

  const photoUrl = text(values.photoUrl)
  if (photoUrl && !/^https?:\/\/\S+$/i.test(photoUrl)) {
    errors.photoUrl = 'Enter a full link starting with https://.'
  }

  if (!ROOM_STATUSES.includes(values.status)) errors.status = 'Choose a status.'
  return errors
}

/** Check-in/out pair used by both the room search and the booking form. */
export function validateStayDates({ checkIn, checkOut }, { today } = {}) {
  const errors = {}
  const start = parseDateOnly(checkIn)
  const end = parseDateOnly(checkOut)

  if (!start) errors.checkIn = 'Choose a check-in date.'
  else if (today && checkIn < today) errors.checkIn = 'Check-in can’t be in the past.'

  if (!end) errors.checkOut = 'Choose a check-out date.'
  else if (start && end <= start) errors.checkOut = 'Check-out must be after check-in.'
  else if (start && nightsBetween(checkIn, checkOut) > MAX_NIGHTS) {
    errors.checkOut = `Stays can be up to ${MAX_NIGHTS} nights.`
  }
  return errors
}

/**
 * @param {object} values  checkIn, checkOut, guests, mealAddons, paymentStatus
 * @param {{today?: string, maxOccupancy?: number}} context
 */
export function validateBooking(values, { today, maxOccupancy } = {}) {
  const errors = validateStayDates(values, { today })
  const guests = Number(values.guests)

  if (!Number.isInteger(guests) || guests < 1) {
    errors.guests = 'Add at least 1 guest.'
  } else if (maxOccupancy && guests > maxOccupancy) {
    errors.guests = `This room fits up to ${maxOccupancy} ${maxOccupancy === 1 ? 'guest' : 'guests'}.`
  }

  if (!MEAL_ADDONS.includes(values.mealAddons)) errors.mealAddons = 'Choose a meal option.'
  if (!PAYMENT_STATUSES.includes(values.paymentStatus)) {
    errors.paymentStatus = 'Choose how you’d like to pay.'
  }
  return errors
}
