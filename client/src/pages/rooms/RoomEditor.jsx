import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ROOM_TYPE_DEFAULTS, ROOM_TYPES, TOTAL_FLOORS } from '@shared/constants.js'
import { validateRoom } from '@shared/validation.js'
import { roomsApi } from '../../api'
import { errorMessage } from '../../api/client'
import ActionSheet from '../../components/ActionSheet'
import Field, { FieldError } from '../../components/Field'
import Icon from '../../components/Icon'
import { CancelButton } from '../../components/NavButtons'
import Page from '../../components/Page'
import PickerField from '../../components/PickerField'
import RoomPhoto from '../../components/RoomPhoto'
import SegmentedControl from '../../components/SegmentedControl'
import { LoadError, LoadingRows } from '../../components/States'
import Stepper from '../../components/Stepper'
import { useApi } from '../../hooks/useApi'
import { useForm } from '../../hooks/useForm'

const NEW_ROOM = {
  roomNumber: '',
  floor: 1,
  type: 'Single',
  ...ROOM_TYPE_DEFAULTS.Single,
  photoUrl: '',
  status: 'available',
}

const FLOOR_OPTIONS = Array.from({ length: TOTAL_FLOORS }, (_, index) => ({
  value: index + 1,
  label: `Floor ${index + 1}`,
}))

const TYPE_OPTIONS = ROOM_TYPES.map((type) => ({ value: type, label: type }))

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'maintenance', label: 'Maintenance' },
]

/** /rooms/new and /rooms/:id/edit — manager only. */
export default function RoomEditor() {
  const { id } = useParams()
  const { data, error, reload } = useApi(() => (id ? roomsApi.get(id) : Promise.resolve(null)), [id])

  if (!id) return <RoomForm initial={NEW_ROOM} />
  if (error || !data) {
    return (
      <Page title="Edit Room" leading={<CancelButton fallback="/rooms" />}>
        {error ? <LoadError error={error} onRetry={reload} /> : <LoadingRows count={6} />}
      </Page>
    )
  }
  return <RoomForm initial={data.room} roomId={id} />
}

function RoomForm({ initial, roomId }) {
  const navigate = useNavigate()
  const isNew = !roomId
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const form = useForm(
    {
      roomNumber: initial.roomNumber,
      floor: initial.floor,
      type: initial.type,
      pricePerNight: String(initial.pricePerNight),
      maxOccupancy: initial.maxOccupancy,
      photoUrl: initial.photoUrl ?? '',
      status: initial.status,
    },
    validateRoom,
  )
  const { values, errors, setField } = form

  // A new room starts from its type's usual rate and capacity; an existing
  // room keeps whatever the manager set.
  const setType = (type) => {
    setField('type', type)
    if (isNew) {
      setField('pricePerNight', String(ROOM_TYPE_DEFAULTS[type].pricePerNight))
      setField('maxOccupancy', ROOM_TYPE_DEFAULTS[type].maxOccupancy)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    form.submit(async (formValues) => {
      const payload = { ...formValues, floor: Number(formValues.floor), pricePerNight: Number(formValues.pricePerNight) }
      const { room } = isNew ? await roomsApi.create(payload) : await roomsApi.update(roomId, payload)
      toast.success(isNew ? 'Room added' : 'Changes saved', { description: `Room ${room.roomNumber}` })
      navigate(`/rooms/${room.id}`, { replace: true })
    })
  }

  const handleDelete = async () => {
    setIsConfirmingDelete(false)
    try {
      await roomsApi.remove(roomId)
      toast.success('Room deleted', { description: `Room ${initial.roomNumber}` })
      navigate('/rooms', { replace: true })
    } catch (error) {
      toast.error('Couldn’t delete room', { description: errorMessage(error) })
    }
  }

  const groupErrors = (fields) =>
    fields.map((field) => errors[field] && <FieldError key={field}>{errors[field]}</FieldError>)

  return (
    <Page
      title={isNew ? 'New Room' : 'Edit Room'}
      leading={<CancelButton fallback={isNew ? '/rooms' : `/rooms/${roomId}`} />}
      trailing={
        <button
          type="submit"
          form="room-form"
          className="bar-button bar-button--strong bar-button--floating"
          disabled={form.isSubmitting}
        >
          {isNew ? 'Add' : 'Save'}
        </button>
      }
    >
      <form id="room-form" onSubmit={handleSubmit} noValidate>
        <div className="group overflow-hidden rounded-card">
          <RoomPhoto src={values.photoUrl.trim()} alt="Photo preview" className="aspect-[16/9]" />
        </div>

        <div className="group">
          <h2 className="t-section-header">Room</h2>
          <div className="card">
            <Field id="roomNumber" label="Room Number" invalid={Boolean(errors.roomNumber)}>
              <input {...form.bind('roomNumber')} className="field__control" inputMode="numeric" placeholder="e.g. 305" />
            </Field>
            <PickerField
              id="floor"
              label="Floor"
              title="Select Floor"
              invalid={Boolean(errors.floor)}
              value={values.floor}
              options={FLOOR_OPTIONS}
              onChange={(floor) => setField('floor', floor)}
              onBlur={form.bind('floor').onBlur}
            />
            <PickerField
              id="type"
              label="Type"
              title="Room Type"
              invalid={Boolean(errors.type)}
              value={values.type}
              options={TYPE_OPTIONS}
              onChange={setType}
              onBlur={form.bind('type').onBlur}
            />
          </div>
          {groupErrors(['roomNumber', 'floor', 'type'])}
        </div>

        <div className="group">
          <h2 className="t-section-header">Rate & Capacity</h2>
          <div className="card">
            <Field id="pricePerNight" label="Price / Night" invalid={Boolean(errors.pricePerNight)}>
              <span className="t-secondary">₱</span>
              <input
                {...form.bind('pricePerNight')}
                className="field__control"
                type="number"
                inputMode="decimal"
                min="0"
                step="50"
              />
            </Field>
            <div className={`field${errors.maxOccupancy ? ' field--invalid' : ''}`}>
              <span className="field__label">Max Guests</span>
              <span className="flex flex-1 items-center justify-end gap-3">
                <span className="t-numeric font-medium">{values.maxOccupancy}</span>
                <Stepper
                  label="Guests"
                  value={Number(values.maxOccupancy)}
                  min={1}
                  max={10}
                  onChange={(value) => setField('maxOccupancy', value)}
                />
              </span>
            </div>
          </div>
          {groupErrors(['pricePerNight', 'maxOccupancy'])}
        </div>

        <div className="group">
          <h2 className="t-section-header">Photo</h2>
          <div className="card">
            <Field id="photoUrl" label="Photo Link" invalid={Boolean(errors.photoUrl)}>
              <input {...form.bind('photoUrl')} className="field__control" type="url" inputMode="url" placeholder="https://…" />
            </Field>
          </div>
          {groupErrors(['photoUrl'])}
          <p className="inline-note">Paste a link to an image. Leave it blank to show a placeholder.</p>
        </div>

        <div className="group">
          <h2 className="t-section-header">Status</h2>
          <SegmentedControl
            label="Room status"
            options={STATUS_OPTIONS}
            value={values.status}
            onChange={(value) => setField('status', value)}
          />
          {groupErrors(['status'])}
          <p className="inline-note">Rooms in maintenance are hidden from guests and can’t be booked.</p>
        </div>

        {form.formError && (
          <p className="notice notice--warning mb-4" role="alert">
            <Icon name="warning" />
            {form.formError}
          </p>
        )}

        <button type="submit" className="button" disabled={form.isSubmitting}>
          {form.isSubmitting ? 'Saving…' : isNew ? 'Add Room' : 'Save Changes'}
        </button>

        {!isNew && (
          <button
            type="button"
            className="button button--destructive mt-4"
            onClick={() => setIsConfirmingDelete(true)}
          >
            <Icon name="trash" />
            Delete Room
          </button>
        )}
      </form>

      <ActionSheet
        open={isConfirmingDelete}
        title={`Delete Room ${initial.roomNumber}? Past bookings keep their receipts. This can’t be undone.`}
        actions={[{ label: 'Delete Room', destructive: true, onSelect: handleDelete }]}
        onClose={() => setIsConfirmingDelete(false)}
      />
    </Page>
  )
}
