import { createContext, useContext, useMemo } from 'react'
import { useThemeState } from '../hooks/useThemeState'

/**
 * Theme lives in context so the toggle on the Profile page can re-theme the
 * whole app — nav bar, tab bar, every card — without a single `theme` prop
 * being threaded through the tree. Any component that needs it calls
 * useTheme() directly, however deep it sits.
 */
const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const { theme, toggleTheme } = useThemeState()

  // Without this memo the provider would hand out a brand-new object on every
  // render, and *every* consumer would re-render even when the theme is
  // unchanged. `toggleTheme` is already stable (useCallback), so the value
  // only changes when `theme` actually does.
  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used inside <ThemeProvider>')
  }
  return context
}
