import { useEffect, useState } from 'react'

/**
 * The value, but only once it has stopped changing for `delay` ms — so typing
 * "4500" into a price filter sends one request, not four.
 */
export function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}
