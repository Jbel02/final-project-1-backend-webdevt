import { Toaster } from 'sonner'
import { useTheme } from '../context/ThemeContext'
import { useDevice } from '../context/DeviceContext'

/**
 * Distance from the bottom of the simulated screen, per device.
 *
 * Passed as a prop rather than set in CSS because Sonner writes
 * `--offset-bottom` as an *inline* style, which no stylesheet rule can beat.
 * The values clear each device's tab bar: 34px of bar plus that device's
 * home-indicator inset (34 on phone, 18 on tablet), plus breathing room.
 * Desktop shows a sidebar instead of a tab bar, so it only needs a margin.
 */
const BOTTOM_OFFSET = { desktop: 24, tablet: 80, phone: 96 }

/**
 * Sonner, wired into the app's theme and its device frame.
 *
 * Two details that are easy to get wrong:
 *
 * 1. `theme` must be passed. Sonner defaults to "light" and scopes its
 *    palette with `[data-sonner-toaster][data-theme='light']`, which outranks
 *    a plain `[data-sonner-toaster]` override — so without this a dark-mode
 *    user gets a white toast.
 * 2. It is mounted inside `.viewport` (see App.jsx) and switched to
 *    `position: absolute` in CSS, so toasts anchor to the *simulated* screen.
 *    Left alone they would appear against the browser window, outside the
 *    phone mockup entirely.
 *
 * It is deliberately not rendered `unstyled`: that strips Sonner's
 * positioning along with its skin. Its layout is kept; only the visuals are
 * overridden — see the `.toast` rules in styles/ui.css.
 */
export default function AppToaster() {
  const { theme } = useTheme()
  const { device } = useDevice()
  const offset = BOTTOM_OFFSET[device] ?? BOTTOM_OFFSET.desktop

  return (
    <Toaster
      theme={theme}
      position="bottom-center"
      visibleToasts={3}
      offset={{ bottom: offset }}
      mobileOffset={{ bottom: offset }}
      toastOptions={{
        classNames: {
          toast: 'toast',
          title: 'toast__title',
          description: 'toast__description',
          actionButton: 'toast__action',
          error: 'toast--error',
          success: 'toast--success',
        },
      }}
    />
  )
}
