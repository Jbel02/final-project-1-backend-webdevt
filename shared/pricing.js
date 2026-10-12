import { MEAL_PRICES, PARTIAL_RATE } from './constants.js'

const round2 = (value) => Math.round(value * 100) / 100

/** Meal cost per guest per night for an add-on choice. */
export function mealRate(mealAddons) {
  switch (mealAddons) {
    case 'lunch':
      return MEAL_PRICES.lunch
    case 'dinner':
      return MEAL_PRICES.dinner
    case 'both':
      return MEAL_PRICES.lunch + MEAL_PRICES.dinner
    default:
      return 0
  }
}

/**
 * The whole bill for a stay. The client calls this to show the quote and the
 * server calls it again to record the booking — the client's figures are
 * never trusted, only re-derived.
 *
 * @returns {{nights, roomTotal, mealTotal, totalAmount, paidAmount, balance}}
 */
export function quoteBooking({ pricePerNight, nights, guests, mealAddons, paymentStatus }) {
  const roomTotal = round2(pricePerNight * nights)
  const mealTotal = round2(mealRate(mealAddons) * guests * nights)
  const totalAmount = round2(roomTotal + mealTotal)
  const paidAmount =
    paymentStatus === 'partial' ? round2(totalAmount * PARTIAL_RATE) : totalAmount
  const balance = round2(totalAmount - paidAmount)

  return { nights, roomTotal, mealTotal, totalAmount, paidAmount, balance }
}
