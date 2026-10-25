import { toast } from 'sonner'
import Icon from './Icon'

const TONE_LABEL = { success: 'Signed in', neutral: 'Signed out', error: 'Session ended' }

/**
 * An iOS-style notification banner: the app icon, the app name with "now",
 * then a bold title and a line of detail, on a blurred rounded card.
 *
 * Rendered by Sonner as a custom toast, so Sonner still handles stacking,
 * the auto-dismiss timer, pause-on-touch and swipe-up-to-dismiss. Tapping the
 * banner dismisses it too, as on iOS.
 */
export default function AuthBanner({ id, title, description, tone }) {
  return (
    <div
      className={`auth-banner auth-banner--${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-label={TONE_LABEL[tone]}
    >
      <button
        type="button"
        className="auth-banner__body"
        aria-label={`${title}. Dismiss notification`}
        onClick={() => toast.dismiss(id)}
      >
        <span className="auth-banner__icon" aria-hidden="true">
          <Icon name="bed" />
        </span>
        <span className="auth-banner__text">
          <span className="auth-banner__meta">
            <span>SuiteSpot</span>
            <span>now</span>
          </span>
          <span className="auth-banner__title">{title}</span>
          {description && <span className="auth-banner__description">{description}</span>}
        </span>
      </button>
    </div>
  )
}
