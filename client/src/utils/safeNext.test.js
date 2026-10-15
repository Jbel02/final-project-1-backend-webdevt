import { describe, expect, it } from 'vitest'
import { safeNext } from './safeNext'

describe('safeNext', () => {
  it('keeps a normal in-app path', () => {
    expect(safeNext('/rooms')).toBe('/rooms')
  })

  it('keeps a path with a query string', () => {
    expect(safeNext('/rooms?type=Suite')).toBe('/rooms?type=Suite')
  })

  it('rejects a protocol-relative URL', () => {
    expect(safeNext('//evil.com')).toBeNull()
  })

  it('rejects a full external URL', () => {
    expect(safeNext('https://evil.com')).toBeNull()
  })

  it('rejects empty and missing values', () => {
    expect(safeNext('')).toBeNull()
    expect(safeNext(null)).toBeNull()
  })
})