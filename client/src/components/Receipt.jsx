import { createPortal } from 'react-dom'
import { nightsBetween } from '@shared/dates.js'
import { mealRate } from '@shared/pricing.js'
import {
  MEAL_LABELS,
  STATUS_STYLES,
  dateOnly,
  formatLongDate,
  formatPeso,
  plural,
} from '../utils/format'

/**
 * The printable receipt (the proposal's `window.print()` approach — no PDF
 * library). Portalled into <body>, outside the device frame; components.css
 * hides it on screen and hides everything *else* in print.
 *
 * Figures come from the booking's own snapshot, so a reprint months later
 * still shows the rate that was actually charged.
 */
export default function Receipt({ booking }) {
  const room = booking.roomSnapshot
  const nights = nightsBetween(dateOnly(booking.checkIn), dateOnly(booking.checkOut))
  const roomTotal = room.pricePerNight * nights
  const mealTotal = mealRate(booking.mealAddons) * booking.guests * nights

  const lines = [
    [`Room ${room.roomNumber} · ${room.type}`, `${formatPeso(room.pricePerNight)} × ${plural(nights, 'night')}`, roomTotal],
    ...(mealTotal > 0
      ? [[MEAL_LABELS[booking.mealAddons], `${plural(booking.guests, 'guest')} × ${plural(nights, 'night')}`, mealTotal]]
      : []),
  ]

  return createPortal(
    <div className="print-receipt">
      <div className="flex items-start justify-between border-b border-black pb-3">
        <div>
          <p className="text-[20pt] font-bold tracking-tight">SuiteSpot</p>
          <p className="text-[10pt]">Hotel Reservation Receipt</p>
        </div>
        <div className="text-right text-[10pt]">
          <p className="font-semibold">{booking.transactionId}</p>
          <p>Booked {formatLongDate(booking.createdAt)}</p>
          <p>Status: {STATUS_STYLES.booking[booking.status].label}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-[10.5pt]">
        <div>
          <p className="font-semibold">Guest</p>
          <p>{booking.guestSnapshot?.name}</p>
          <p>{booking.guestSnapshot?.email}</p>
        </div>
        <div>
          <p className="font-semibold">Stay</p>
          <p>Check-in: {formatLongDate(booking.checkIn)}</p>
          <p>Check-out: {formatLongDate(booking.checkOut)}</p>
          <p>
            {plural(nights, 'night')} · {plural(booking.guests, 'guest')} · Floor {room.floor}
          </p>
        </div>
      </div>

      <table className="mt-6 w-full border-collapse text-[10.5pt]">
        <thead>
          <tr className="border-b border-black text-left">
            <th className="py-1.5 font-semibold">Item</th>
            <th className="py-1.5 font-semibold">Details</th>
            <th className="py-1.5 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map(([item, detail, amount]) => (
            <tr key={item} className="border-b border-neutral-300">
              <td className="py-1.5">{item}</td>
              <td className="py-1.5">{detail}</td>
              <td className="py-1.5 text-right">{formatPeso(amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} className="pt-3 text-right font-semibold">Total</td>
            <td className="pt-3 text-right font-semibold">{formatPeso(booking.totalAmount)}</td>
          </tr>
          <tr>
            <td colSpan={2} className="text-right">
              Paid ({STATUS_STYLES.payment[booking.paymentStatus].label})
            </td>
            <td className="text-right">{formatPeso(booking.paidAmount)}</td>
          </tr>
          <tr>
            <td colSpan={2} className="text-right font-semibold">Balance Due</td>
            <td className="text-right font-semibold">{formatPeso(booking.balance)}</td>
          </tr>
        </tfoot>
      </table>

      <p className="mt-10 text-[9pt]">
        Thank you for staying with SuiteSpot. Please present this receipt at the front desk.
        Any balance is settled at check-out.
      </p>
    </div>,
    document.body,
  )
}
