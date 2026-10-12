import NumberFlow from '@number-flow/react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { MEAL_PRICES } from '@shared/constants.js'
import { addDays, nightsBetween, todayDateOnly } from '@shared/dates.js'
import { mealRate, quoteBooking } from '@shared/pricing.js'
import { hasErrors, validateBooking, validateStayDates } from '@shared/validation.js'
import { bookingsApi, roomsApi } from '../../api'
import Field, { FieldError } from '../../components/Field'
import Icon from '../../components/Icon'
import { CancelButton } from '../../components/NavButtons'
import Page from '../../components/Page'
import RoomPhoto from '../../components/RoomPhoto'
import SegmentedControl from '../../components/SegmentedControl'
import { LoadError, LoadingRows } from '../../components/States'
import Stepper from '../../components/Stepper'
import { useApi } from '../../hooks/useApi'
import { useForm } from '../../hooks/useForm'
import { MEAL_LABELS, PESO_FORMAT, formatPeso, formatStay, plural } from '../../utils/format'

const MEAL_OPTIONS = ['none', 'lunch', 'dinner', 'both'].map((value) => ({
  value,
  label: value === 'none' ? 'None' : value === 'both' ? 'Both' : MEAL_LABELS[value],
}))

const PAYMENT_OPTIONS = [
  { value: 'full', label: 'Pay in Full' },
  { value: 'partial', label: 'Pay 30% Now' },
]

/**
 * Guest booking: dates, guest count, meal add-ons, full or partial (30%)
 * payment. The summary is computed with the same shared function the server
 * uses, so the total shown is the total charged.
 */
export default function BookRoom() {
  const { id } = useParams()
  const { data, error, reload } = useApi(() => roomsApi.get(id), [id])

  return error ? (
    <Page title="Book Room" leading={<CancelButton fallback={`/rooms/${id}`} />}>
      <LoadError error={error} onRetry={reload} />
    </Page>
  ) : !data ? (
    <Page title="Book Room" leading={<CancelButton fallback={`/rooms/${id}`} />}>
      <LoadingRows count={5} />
    </Page>
  ) : (
    // Mounted only once the room is known, so the form starts with the
    // room's real capacity instead of correcting itself after a load.
    <BookingForm room={data.room} />
  )
}

function BookingForm({ room }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const today = todayDateOnly()

  const form = useForm(
    {
      checkIn: params.get('checkIn') ?? '',
      checkOut: params.get('checkOut') ?? '',
      guests: Math.min(Number(params.get('guests')) || 1, room.maxOccupancy),
      mealAddons: 'none',
      paymentStatus: 'full',
    },
    (values) => validateBooking(values, { today, maxOccupancy: room.maxOccupancy }),
  )
  const { values, errors, setField } = form

  const datesValid = !hasErrors(validateStayDates(values, { today }))
  const nights = datesValid ? nightsBetween(values.checkIn, values.checkOut) : 0

  // Live availability for the chosen dates, before the guest commits.
  const availability = useApi(
    () =>
      datesValid
        ? roomsApi.get(room.id, { checkIn: values.checkIn, checkOut: values.checkOut })
        : Promise.resolve(null),
    [room.id, datesValid, values.checkIn, values.checkOut],
  )
  const isUnavailable = datesValid && availability.data?.availability?.available === false

  const quote = quoteBooking({
    pricePerNight: room.pricePerNight,
    nights,
    guests: values.guests,
    mealAddons: values.mealAddons,
    paymentStatus: values.paymentStatus,
  })

  const setCheckIn = (value) => {
    setField('checkIn', value)
    if (value && (!values.checkOut || values.checkOut <= value)) setField('checkOut', addDays(value, 1))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    form.submit(async (formValues) => {
      const { booking } = await bookingsApi.create({ room: room.id, ...formValues })
      toast.success('Booking confirmed', {
        description: `Room ${room.roomNumber} · ${formatStay(formValues.checkIn, formValues.checkOut)}`,
      })
      navigate(`/bookings/${booking.id}`, { replace: true })
    })
  }

  return (
    <Page title="Book Room" leading={<CancelButton fallback={`/rooms/${room.id}`} />}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="group">
          <div className="card">
            <div className="row row--thumbed">
              <RoomPhoto src={room.photoUrl} className="row__thumb" />
              <span className="row__body">
                <span className="row__title">Room {room.roomNumber}</span>
                <span className="row__subtitle">
                  {room.type} · Floor {room.floor} · Up to {plural(room.maxOccupancy, 'guest')}
                </span>
              </span>
              <span className="row__trailing t-numeric">{formatPeso(room.pricePerNight)}</span>
            </div>
          </div>
        </div>

        <div className="group">
          <h2 className="t-section-header">Stay</h2>
          <div className="card">
            <Field id="checkIn" label="Check-in" invalid={Boolean(errors.checkIn)}>
              <input
                {...form.bind('checkIn')}
                onChange={(event) => setCheckIn(event.target.value)}
                className="field__control"
                type="date"
                min={today}
              />
            </Field>
            <Field id="checkOut" label="Check-out" invalid={Boolean(errors.checkOut)}>
              <input
                {...form.bind('checkOut')}
                className="field__control"
                type="date"
                min={values.checkIn ? addDays(values.checkIn, 1) : addDays(today, 1)}
              />
            </Field>
            <div className={`field${errors.guests ? ' field--invalid' : ''}`}>
              <span className="field__label">Guests</span>
              <span className="flex flex-1 items-center justify-end gap-3">
                <span className="t-numeric font-medium">{values.guests}</span>
                <Stepper
                  label="Guests"
                  value={values.guests}
                  min={1}
                  max={room.maxOccupancy}
                  onChange={(value) => setField('guests', value)}
                />
              </span>
            </div>
          </div>
          {['checkIn', 'checkOut', 'guests'].map(
            (field) => errors[field] && <FieldError key={field}>{errors[field]}</FieldError>,
          )}
          {datesValid && !availability.isLoading && (
            isUnavailable ? (
              <p className="notice notice--warning mt-3" role="status">
                <Icon name="warning" />
                Room {room.roomNumber} is already booked for some of these dates.
              </p>
            ) : (
              <p className="notice notice--success mt-3" role="status">
                <Icon name="check" />
                Available · {plural(nights, 'night')}, {formatStay(values.checkIn, values.checkOut)}
              </p>
            )
          )}
        </div>

        <div className="group">
          <h2 className="t-section-header">Meals</h2>
          <SegmentedControl
            label="Meal add-ons"
            options={MEAL_OPTIONS}
            value={values.mealAddons}
            onChange={(value) => setField('mealAddons', value)}
          />
          <p className="inline-note">
            Lunch {formatPeso(MEAL_PRICES.lunch)} and dinner {formatPeso(MEAL_PRICES.dinner)} per guest,
            per night.
          </p>
        </div>

        <div className="group">
          <h2 className="t-section-header">Payment</h2>
          <SegmentedControl
            label="Payment"
            options={PAYMENT_OPTIONS}
            value={values.paymentStatus}
            onChange={(value) => setField('paymentStatus', value)}
          />
          <p className="inline-note">
            {values.paymentStatus === 'partial'
              ? 'Pay 30% now to hold the room. The balance is settled at check-out.'
              : 'Pay the whole stay now. Nothing is due at check-out.'}{' '}
            Payment is simulated for this project — no card details are collected.
          </p>
        </div>

        <div className="group">
          <h2 className="t-section-header">Summary</h2>
          <div className="card">
            <SummaryRow
              label="Room"
              detail={nights ? `${formatPeso(room.pricePerNight)} × ${plural(nights, 'night')}` : 'Choose dates'}
              amount={quote.roomTotal}
            />
            {values.mealAddons !== 'none' && (
              <SummaryRow
                label={MEAL_LABELS[values.mealAddons]}
                detail={`${formatPeso(mealRate(values.mealAddons))} × ${plural(values.guests, 'guest')} × ${plural(nights, 'night')}`}
                amount={quote.mealTotal}
              />
            )}
            <SummaryRow label="Total" amount={quote.totalAmount} total />
            <SummaryRow label="Due Now" amount={quote.paidAmount} />
            {values.paymentStatus === 'partial' && (
              <SummaryRow label="Due at Check-out" amount={quote.balance} />
            )}
          </div>
        </div>

        {form.formError && (
          <p className="notice notice--warning mb-4" role="alert">
            <Icon name="warning" />
            {form.formError}
          </p>
        )}

        <button type="submit" className="button" disabled={form.isSubmitting || isUnavailable}>
          {form.isSubmitting ? 'Confirming…' : 'Confirm Booking'}
        </button>
      </form>
    </Page>
  )
}

function SummaryRow({ label, detail, amount, total = false }) {
  return (
    <div className={`row${total ? ' row--total' : ''}`}>
      <span className="row__body">
        <span className="row__title">{label}</span>
        {detail && <span className="row__subtitle">{detail}</span>}
      </span>
      <span className="row__trailing t-numeric">
        <NumberFlow value={amount} format={PESO_FORMAT} locales="en-PH" />
      </span>
    </div>
  )
}
