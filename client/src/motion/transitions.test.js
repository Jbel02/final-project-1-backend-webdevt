import { describe, expect, it } from 'vitest'
import { transitionModeFor } from './transitions'

describe('transitionModeFor', () => {
  it('pushes into a detail screen and pops back out', () => {
    expect(transitionModeFor('/rooms', '/rooms/abc')).toBe('push')
    expect(transitionModeFor('/bookings/abc', '/bookings')).toBe('pop')
  })

  it('presents task screens as sheets and dismisses them', () => {
    expect(transitionModeFor('/rooms/abc', '/rooms/abc/book')).toBe('present')
    expect(transitionModeFor('/rooms/abc/book', '/bookings/xyz')).toBe('dismiss')
    expect(transitionModeFor('/rooms', '/signin')).toBe('present')
  })

  it('cross-fades between tabs', () => {
    expect(transitionModeFor('/rooms', '/bookings')).toBe('fade')
    expect(transitionModeFor('/rooms/abc', '/profile')).toBe('fade')
  })
})
