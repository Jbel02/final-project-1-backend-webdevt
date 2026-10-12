import { useCallback, useEffect, useState } from 'react'

/**
 * Loads data for a screen and keeps it in step with its inputs.
 *
 *   const { data, error, isLoading, reload } = useApi(
 *     () => roomsApi.list(filters), [filters.checkIn, filters.checkOut])
 *
 * - Refetches whenever a dependency changes; a response for an *old* set of
 *   inputs is ignored, so a slow early request can't overwrite a newer one.
 * - Keeps showing the previous data while the next load runs (the page dims
 *   it via `isLoading`), so filtering never flashes an empty screen.
 *
 * `isLoading` is derived — "the data on screen is for different inputs" —
 * rather than set in the effect, so there is never a render where the inputs
 * changed but the screen still claims to be up to date.
 */
export function useApi(load, deps) {
  const [reloadCount, setReloadCount] = useState(0)
  const key = JSON.stringify([deps, reloadCount])
  const [result, setResult] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    let ignore = false
    load().then(
      (data) => !ignore && setResult({ key, data, error: null }),
      (error) => !ignore && setResult((previous) => ({ key, data: previous.data, error })),
    )
    return () => {
      ignore = true
    }
    // `load` is a fresh closure every render; `key` captures what it depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const reload = useCallback(() => setReloadCount((count) => count + 1), [])

  /** Local update after a mutation, without a round trip. */
  const setData = useCallback(
    (update) =>
      setResult((previous) => ({
        ...previous,
        data: typeof update === 'function' ? update(previous.data) : update,
      })),
    [],
  )

  return {
    data: result.data,
    error: result.key === key ? result.error : null,
    isLoading: result.key !== key,
    reload,
    setData,
  }
}
