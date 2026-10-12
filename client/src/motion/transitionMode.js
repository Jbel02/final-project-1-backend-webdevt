import { createContext, useContext } from 'react'

/**
 * The transition currently running ('push' | 'pop' | 'present' | 'dismiss' |
 * 'fade'). Set by AnimatedRoutes for the *entering* page; the exiting page
 * receives the same value through AnimatePresence's `custom`, so both sides
 * of a transition animate as one movement.
 *
 * Lives in its own module to keep the import graph acyclic — AnimatedRoutes
 * imports the pages, and the pages import Page, which needs this.
 */
export const TransitionModeContext = createContext('fade')

export function useTransitionMode() {
  return useContext(TransitionModeContext)
}
