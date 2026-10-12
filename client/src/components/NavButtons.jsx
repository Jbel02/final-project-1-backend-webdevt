import { useLocation, useNavigate } from 'react-router-dom'
import Icon from './Icon'

/**
 * Goes back to wherever the user came from, unless this URL was opened
 * directly — a Back button that leaves the app is a trap — in which case it
 * goes to `fallback` instead.
 */
function useGoBack(fallback) {
  const navigate = useNavigate()
  const location = useLocation()
  return () => (location.key === 'default' ? navigate(fallback, { replace: true }) : navigate(-1))
}

export function BackButton({ fallback, label = 'Back' }) {
  const goBack = useGoBack(fallback)
  return (
    <button type="button" className="bar-button" onClick={goBack}>
      <Icon name="chevronLeft" />
      {label}
    </button>
  )
}

/** "Cancel" on a sheet-style screen: same behaviour, iOS wording. */
export function CancelButton({ fallback }) {
  const goBack = useGoBack(fallback)
  return (
    <button type="button" className="bar-button" onClick={goBack}>
      Cancel
    </button>
  )
}
