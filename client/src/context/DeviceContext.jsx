import { createContext, useContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

/**
 * Which device frame the app is previewed in (desktop / tablet / phone).
 *
 * Kept separate from ThemeContext rather than merged into one "UI" context:
 * switching device would otherwise re-render every theme consumer and vice
 * versa. Two small contexts, each changing for its own reason.
 *
 * The choice is persisted through the same generic useLocalStorage hook the
 * theme uses.
 */
const DeviceContext = createContext(null)

const DEVICES = ['desktop', 'tablet', 'phone']

export function DeviceProvider({ children }) {
  const [device, setDevice] = useLocalStorage('suitespot-device', 'desktop')

  const value = useMemo(
    () => ({
      // Guards against a stale/hand-edited storage value naming a device that
      // no longer exists.
      device: DEVICES.includes(device) ? device : 'desktop',
      setDevice,
    }),
    [device, setDevice],
  )

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>
}

export function useDevice() {
  const context = useContext(DeviceContext)
  if (!context) {
    throw new Error('useDevice must be used inside <DeviceProvider>')
  }
  return context
}
