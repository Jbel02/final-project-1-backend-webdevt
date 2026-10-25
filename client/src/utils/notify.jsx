import { toast } from 'sonner'
import AuthBanner from '../components/AuthBanner'

/**
 * Sign-in / sign-out notifications, in one place.
 *
 * Every auth message (welcome, signed out, account created, session ended)
 * goes through here so guests, receptionists and managers get identical
 * behaviour, and so each message has a single presentation per screen:
 *
 *  - wide layout   the app's normal toast, bottom-centre
 *  - touch layout  an iOS-style banner at the top of the screen
 *
 * AppToaster tells this module which layout is current; it can't be read here
 * because this is plain code outside the React tree.
 *
 * Only one auth notice is ever on screen: showing a new one first dismisses the
 * previous, so e.g. two requests failing with 401 at once still produce a
 * single "You’ve been signed out". Each notice gets a fresh id rather than
 * reusing one — re-using an id after Sonner has removed a toast is a known
 * way for a later notification to silently not show.
 */
let currentNotice = null
export const BANNER_TOASTER_ID = 'auth-banner'
const BANNER_DURATION = 4000

let useBanner = false

/** Called by AppToaster whenever the screen switches between the two layouts. */
export function setAuthNoticeStyle(isBanner) {
  useBanner = isBanner
}

/**
 * @param {string} title
 * @param {{
 *   description?: string,
 *   bannerDescription?: string,
 *   tone?: 'success' | 'neutral' | 'error'
 * }} [options]  `description` shows in both presentations; `bannerDescription`
 *   is an extra line only the roomier iOS banner shows.
 */
export function notifyAuth(title, { description, bannerDescription, tone = 'success' } = {}) {
  if (currentNotice !== null) toast.dismiss(currentNotice)
  currentNotice = show(title, { description, bannerDescription, tone })
  return currentNotice
}

function show(title, { description, bannerDescription, tone }) {
  if (useBanner) {
    return toast.custom(
      (id) => (
        <AuthBanner id={id} title={title} description={description ?? bannerDescription} tone={tone} />
      ),
      { toasterId: BANNER_TOASTER_ID, duration: BANNER_DURATION },
    )
  }

  const options = { description }
  if (tone === 'error') return toast.error(title, options)
  if (tone === 'neutral') return toast(title, options)
  return toast.success(title, options)
}
