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
 * Keeps `--toast-center-x` / `--toast-area-w` on the screen element pointing at
 * where the desktop toast should be centred. styles/components.css uses them to
 * place it; nothing else reads them.
 *
 * Where it goes is measured from the real layout, never assumed from a sidebar
 * width:
 *
 *  - on a page with a room grid (the Rooms page) — the centre of that grid.
 *    With three columns that is the midpoint of the middle room card, so the
 *    toast sits over the middle card's photo; with one column, over the card;
 *  - everywhere else — the centre of the main content area beside the sidebar
 *    (the whole screen when there is no sidebar).
 *
 * A page marks the element to follow with `data-toast-anchor`. Pages come and
 * go and the grid appears only once rooms have loaded, so the page host is
 * watched for changes and the target is re-picked when it changes. The page
 * host itself only exists after the session check, hence `isReady`.
 */
function useToastAnchor() {
  const { isReady } = useAuth()

  useEffect(() => {
    const screen = document.querySelector('.viewport')
    const host = screen?.querySelector('.page-host')
    if (!screen || !host) return undefined

    const pick = () => host.querySelector('[data-toast-anchor]') ?? host
    let target = pick()

    const update = () => {
      const screenBox = screen.getBoundingClientRect()
      const targetBox = target.getBoundingClientRect()
      // The preview frame can be scaled; express the numbers in the screen's own pixels.
      const scale = screenBox.width / screen.offsetWidth || 1
      screen.style.setProperty(
        '--toast-center-x',
        `${(targetBox.left - screenBox.left + targetBox.width / 2) / scale}px`,
      )
      screen.style.setProperty('--toast-area-w', `${host.getBoundingClientRect().width / scale}px`)
    }

    const resizeObserver = new ResizeObserver(update)
    const watch = () => {
      resizeObserver.disconnect()
      target = pick()
      resizeObserver.observe(screen)
      resizeObserver.observe(host)
      resizeObserver.observe(target)
      update()
    }
    watch()

    // Re-pick when a page is swapped or its room grid appears / disappears.
    const mutationObserver = new MutationObserver(() => {
      if (pick() !== target) watch()
    })
    mutationObserver.observe(host, { childList: true, subtree: true })

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
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
  useToastAnchor()

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
