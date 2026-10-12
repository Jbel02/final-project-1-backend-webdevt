import { useCallback, useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

const STORAGE_KEY = 'suitespot-theme'

/**
 * Light/dark state, persisted and mirrored onto `<html data-theme>` so plain
 * CSS variables do the actual theming (styles/tokens.css).
 *
 * Reuses useLocalStorage rather than re-implementing the storage dance — the
 * inline script in index.html applies the same rules before first paint to
 * avoid a flash of the wrong theme, so the two must stay in sync.
 *
 * Consumed once, by ThemeProvider; components read the context, never this.
 */
export function useThemeState() {
  const [theme, setTheme] = useLocalStorage(STORAGE_KEY, systemPreference)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    // Keeps the browser UI (mobile address bar) in step with the app.
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#000000' : '#f2f2f7')
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [setTheme])

  return { theme, toggleTheme, setTheme }
}

function systemPreference() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}
