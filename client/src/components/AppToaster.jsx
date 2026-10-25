import { useEffect, useLayoutEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useDevice } from '../context/DeviceContext'
import { BANNER_TOASTER_ID, setAuthNoticeStyle } from '../utils/notify'

/** Below this screen width the app shows its tab-bar (touch) layout, not the sidebar. */
const SIDEBAR_MIN_WIDTH = 900

/**
 * Distance from the bottom of the simulated screen, per layout.
 *
 * Passed as a prop rather than set in CSS because Sonner writes
 * `--offset-bottom` as an *inline* style, which no stylesheet rule can beat.
 * The touch values clear the tab bar (34px on phone, 40px on tablet) plus the
 * home-indicator inset (34 on phone, 18 on tablet), plus breathing room.
 * The sidebar layout has no tab bar, so it only needs a margin.
 */
const BOTTOM_OFFSET = { desktop: 24, tablet: 86, phone: 96, touchWindow: 80 }

/**
 * Whether the screen is showing a touch (iPad / iPhone) layout rather than the
 * sidebar desktop one: the Tablet or Phone preview, a narrow window (the app
 * switches to its tab bar below 900px, even in the Desktop preview), or a
 * real touch device — which covers an iPad turned to landscape, where the
 * screen is wide but is still an iPad.
 *
 * "Touch device" means a coarse pointer *and no hover*. A laptop with a touch
 * screen has a coarse pointer too, but it also hovers, and it is a desktop:
 * it must keep the desktop toast.
 */
const TOUCH_DEVICE_QUERY = '(pointer: coarse) and (hover: none)'

function useTouchLayout() {
  const { device } = useDevice()
  const [isNarrow, setIsNarrow] = useState(false)
  const [isCoarse, setIsCoarse] = useState(
    () => typeof matchMedia === 'function' && matchMedia(TOUCH_DEVICE_QUERY).matches,
  )

  useEffect(() => {
    const screen = document.querySelector('.viewport')
    if (!screen) return undefined
    const measure = () => setIsNarrow(screen.clientWidth < SIDEBAR_MIN_WIDTH)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(screen)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const query = matchMedia(TOUCH_DEVICE_QUERY)
    const update = () => setIsCoarse(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return { device, isTouchLayout: device !== 'desktop' || isNarrow || isCoarse }
}

/**
 * Keeps `--toast-center-x` / `--toast-area-w` on the screen element equal to the
 * centre and width of the *main content area* — the page host beside the
 * sidebar — measured from the real layout rather than assumed from a sidebar
 * width. With no sidebar (a narrow window) the host is the whole screen, so the
 * centre is the screen's. styles/components.css uses these to place the
 * desktop toast; nothing else reads them.
 *
 * The page host only exists once the session check is done, hence `isReady`.
 * A ResizeObserver on it catches both window resizes and sidebar changes.
 */
function useMainAreaCenter() {
  const { isReady } = useAuth()

  useEffect(() => {
    const screen = document.querySelector('.viewport')
    const host = screen?.querySelector('.page-host')
    if (!screen || !host) return undefined

    const update = () => {
      const screenBox = screen.getBoundingClientRect()
      const hostBox = host.getBoundingClientRect()
      // The preview frame can be scaled; express the numbers in the screen's own pixels.
      const scale = screenBox.width / screen.offsetWidth || 1
      screen.style.setProperty(
        '--toast-center-x',
        `${(hostBox.left - screenBox.left + hostBox.width / 2) / scale}px`,
      )
      screen.style.setProperty('--toast-area-w', `${hostBox.width / scale}px`)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(host)
    observer.observe(screen)
    return () => {
      observer.disconnect()
      screen.style.removeProperty('--toast-center-x')
      screen.style.removeProperty('--toast-area-w')
    }
  }, [isReady])
}

/**
 * Sonner, wired into the app's theme and its device frame.
 *
 * Two toasters share the screen:
 *
 *  - the default one (bottom-centre) carries ordinary confirmations such as
 *    "Profile updated", and desktop sign-in / sign-out messages;
 *  - the "banner" one (top-centre) carries sign-in / sign-out messages on
 *    touch layouts, drawn as iOS notification banners (see AuthBanner and
 *    utils/notify.jsx, which picks between them).
 *
 * Details that are easy to get wrong:
 *
 * 1. `theme` must be passed. Sonner defaults to "light" and scopes its
 *    palette with `[data-sonner-toaster][data-theme='light']`, which outranks
 *    a plain `[data-sonner-toaster]` override — so without this a dark-mode
 *    user gets a white toast.
 * 2. Both are mounted inside `.viewport` (see App.jsx) and switched to
 *    `position: absolute` in CSS, so toasts anchor to the *simulated* screen.
 *    Left alone they would appear against the browser window, outside the
 *    phone mockup entirely.
 * 3. The default toaster is not rendered `unstyled`: that strips Sonner's
 *    positioning along with its skin. Its layout is kept; only the visuals are
 *    overridden — see the `.toast` rules in styles/components.css.
 */
export default function AppToaster() {
  const { theme } = useTheme()
  const { device, isTouchLayout } = useTouchLayout()
  useMainAreaCenter()

  // Before paint, so a notification fired right after a route change already
  // knows which layout to use.
  useLayoutEffect(() => {
    setAuthNoticeStyle(isTouchLayout)
    return () => setAuthNoticeStyle(false)
  }, [isTouchLayout])

  const bottom = device === 'desktop' && isTouchLayout ? BOTTOM_OFFSET.touchWindow : BOTTOM_OFFSET[device]

  // Banners hang from just below the status bar / Dynamic Island (--safe-top
  // is 0 on a plain window) and keep clear of a notch on either side.
  const bannerTop = 'calc(var(--safe-top) + 6px)'
  const bannerSide = 'max(12px, env(safe-area-inset-left))'
  const bannerSideEnd = 'max(12px, env(safe-area-inset-right))'

  return (
    <>
      <Toaster
        theme={theme}
        position="bottom-center"
        visibleToasts={3}
        offset={{ bottom }}
        mobileOffset={{ bottom }}
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
      <Toaster
        id={BANNER_TOASTER_ID}
        className="banner-toaster"
        theme={theme}
        position="top-center"
        visibleToasts={1}
        offset={{ top: bannerTop }}
        mobileOffset={{ top: bannerTop, left: bannerSide, right: bannerSideEnd }}
      />
    </>
  )
}
