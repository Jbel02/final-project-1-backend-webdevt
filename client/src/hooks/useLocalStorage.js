import { useCallback, useEffect, useState } from 'react'

/**
 * `useState`, but the value is mirrored to localStorage.
 *
 * Carried over from the midterm. In SuiteSpot the real data lives in MongoDB,
 * so this only holds per-browser preferences: the theme (useThemeState) and
 * the device-preview choice (DeviceContext). It knows about storage —
 * reading, writing, JSON, failure modes, cross-tab sync — and nothing else.
 *
 * @param {string} key localStorage key
 * @param {*|Function} initialValue value — or lazy factory — for a first run
 * @returns {[*, Function]} same shape as useState, setter accepts an updater
 */
export function useLocalStorage(key, initialValue) {
  const resolveInitial = () =>
    typeof initialValue === 'function' ? initialValue() : initialValue

  // Lazy initialiser: storage is read once on mount, not on every render.
  const [value, setValue] = useState(() => {
    const stored = readStorage(key)
    return stored !== undefined ? stored : resolveInitial()
  })

  // A changed `key` means a different slot entirely, so the value has to come
  // from that slot rather than carry over. Without this the write effect below
  // fires first and copies the *previous* key's value into the new key —
  // silently corrupting it (a real bug in the midterm, hit while renaming
  // keys during hot reload).
  //
  // Derived during render rather than in an effect so no frame is ever painted
  // with the wrong key's data — the same reason AnimatedRoutes derives its
  // transition mode during render.
  const [loadedKey, setLoadedKey] = useState(key)
  if (loadedKey !== key) {
    const stored = readStorage(key)
    setLoadedKey(key)
    setValue(stored !== undefined ? stored : resolveInitial())
  }

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Quota exceeded or storage disabled (Safari private mode). The app
      // stays fully usable in memory — only persistence is lost.
    }
  }, [key, value])

  // Keeps two tabs of the app in agreement: `storage` fires in every *other*
  // tab when one of them writes.
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== key || event.newValue === null) return
      try {
        setValue(JSON.parse(event.newValue))
      } catch {
        /* another tab wrote something unparsable — keep the current value */
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [key])

  // Stable identity, so consumers can safely list it in dependency arrays and
  // memoised children don't re-render just because the parent did.
  const update = useCallback((next) => setValue(next), [])

  return [value, update]
}

function readStorage(key) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? undefined : JSON.parse(raw)
  } catch {
    return undefined
  }
}
