import { describe, expect, it } from 'vitest'
import { visibleUsers } from './users'

// As the API sends them: newest first, which put a receptionist above the manager.
const FROM_API = [
  { name: 'Mik', email: 'mikmik@gmail.com', role: 'receptionist' },
  { name: 'Ana Reyes', email: 'ana@suitespot.test', role: 'guest' },
  { name: 'Night Desk', email: 'night@suitespot.test', role: 'receptionist' },
  { name: 'Hotel Manager', email: 'manager@suitespot.test', role: 'manager' },
  { name: 'Front Desk', email: 'frontdesk@suitespot.test', role: 'receptionist' },
  { name: 'Juan Dela Cruz', email: 'guest@suitespot.test', role: 'guest' },
]

const names = (users) => users.map((user) => user.name)

describe('visibleUsers', () => {
  it('Staff: the manager first, then every receptionist', () => {
    expect(names(visibleUsers(FROM_API, 'staff', ''))).toEqual([
      'Hotel Manager',
      'Mik',
      'Night Desk',
      'Front Desk',
    ])
  })

  it('All: managers, then receptionists, then guests', () => {
    expect(visibleUsers(FROM_API, 'all', '').map((user) => user.role)).toEqual([
      'manager',
      'receptionist',
      'receptionist',
      'receptionist',
      'guest',
      'guest',
    ])
  })

  it('keeps the order the API sent within a role (it is not re-sorted by name)', () => {
    expect(names(visibleUsers(FROM_API, 'all', '').filter((user) => user.role === 'receptionist'))).toEqual([
      'Mik',
      'Night Desk',
      'Front Desk',
    ])
  })

  it('search results are ordered by role too', () => {
    // "desk" matches two receptionists; "suitespot" matches five accounts of every role.
    expect(names(visibleUsers(FROM_API, 'all', 'suitespot')).slice(0, 2)).toEqual(['Hotel Manager', 'Night Desk'])
    expect(visibleUsers(FROM_API, 'staff', 'suitespot').map((user) => user.role)).toEqual([
      'manager',
      'receptionist',
      'receptionist',
    ])
  })

  it('Guests lists only guests and does not touch the source array', () => {
    const copy = [...FROM_API]
    expect(visibleUsers(FROM_API, 'guest', '').every((user) => user.role === 'guest')).toBe(true)
    expect(FROM_API).toEqual(copy)
  })

  it('stays correct as more receptionists are added, whatever their names', () => {
    const more = [{ name: 'Aaron A.', email: 'aaron@x.test', role: 'receptionist' }, ...FROM_API, { name: 'Zed', email: 'zed@x.test', role: 'receptionist' }]
    const staff = visibleUsers(more, 'staff', '')
    expect(staff[0].role).toBe('manager')
    expect(staff.slice(1).every((user) => user.role === 'receptionist')).toBe(true)
    expect(staff).toHaveLength(6)
  })
})
