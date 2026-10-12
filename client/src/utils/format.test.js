import { describe, expect, it } from 'vitest'
import { formatDay, formatPeso, formatStay, initials } from './format'

describe('format', () => {
  it('formats pesos without trailing zeros on whole amounts', () => {
    expect(formatPeso(3500)).toBe('₱3,500')
    expect(formatPeso(3960.5)).toBe('₱3,960.50')
  })

  it('formats stay dates in UTC so they never shift a day', () => {
    expect(formatDay('2026-10-12T00:00:00.000Z')).toBe('Mon, Oct 12')
    expect(formatStay('2026-10-12', '2026-10-15')).toBe('Oct 12 – 15')
    expect(formatStay('2026-10-30', '2026-11-02')).toBe('Oct 30 – Nov 2')
  })

  it('takes first and last initials', () => {
    expect(initials('Juan Dela Cruz')).toBe('JC')
    expect(initials('Front')).toBe('FR')
  })
})
