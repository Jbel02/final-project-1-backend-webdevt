import axios from 'axios'

/**
 * One Axios instance for the whole app. `/api` is same-origin everywhere —
 * Vite proxies it in development, Vercel rewrites it to Render in
 * production — so the httpOnly auth cookie is always first-party and the app
 * never touches the token itself.
 */
export const http = axios.create({
  baseURL: '/api',
  withCredentials: true,
  // Generous: Render's free tier sleeps when idle and takes up to a minute to
  // wake, and the first request after that shouldn't fail.
  timeout: 60_000,
})

let handleUnauthorized = null

/** AuthContext registers this so an expired session signs the user out. */
export function setUnauthorizedHandler(handler) {
  handleUnauthorized = handler
}

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCheck = error.config?.url?.startsWith('/auth/')
    if (error.response?.status === 401 && !isAuthCheck) handleUnauthorized?.()
    return Promise.reject(error)
  },
)

/** The server's own sentence when it sent one, a plain fallback otherwise. */
export function errorMessage(error, fallback = 'Something went wrong. Try again.') {
  if (!error?.response) {
    return error?.code === 'ECONNABORTED'
      ? 'SuiteSpot is taking too long to respond. Try again in a moment.'
      : 'Can’t reach SuiteSpot. Check your connection and try again.'
  }
  return error.response.data?.message ?? fallback
}

/** Per-field messages from a 400/409, shaped like the shared validators. */
export const fieldErrors = (error) => error?.response?.data?.errors ?? {}
