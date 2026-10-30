import { describe, expect, it } from 'vitest'
import { sortUsersByRole } from './userOrder'

const user = (id, role, name = id) => ({ id, role, name })

describe('sortUsersByRole', () => {
  it('puts managers first and receptionists last, whatever the incoming order', () => {
    const incoming = [
      user('r-new', 'receptionist', 'Zed Desk'),
      user('g1', 'guest'),
      user('r-mid', 'receptionist', 'Amy Desk'),
      user('m1', 'manager'),
      user('r-old', 'receptionist', 'Mia Desk'),
      user('m2', 'manager'),
    ]
    expect(sortUsersByRole(incoming).map((u) => u.id)).toEqual([
      'm1', 'm2', 'g1', 'r-new', 'r-mid', 'r-old',
    ])
  })

  it('orders the Staff list manager first with several receptionists', () => {
    const staff = [
      user('r3', 'receptionist'),
      user('r2', 'receptionist'),
      user('r1', 'receptionist'),
      user('m1', 'manager'),
    ]
    expect(sortUsersByRole(staff).map((u) => u.role)).toEqual([
      'manager', 'receptionist', 'receptionist', 'receptionist',
    ])
  })

  it('keeps the server order within a role instead of sorting by name', () => {
    const list = [user('b', 'receptionist', 'Bea'), user('a', 'receptionist', 'Ann')]
    expect(sortUsersByRole(list).map((u) => u.id)).toEqual(['b', 'a'])
  })

  it('does not change the array it was given', () => {
    const list = [user('r', 'receptionist'), user('m', 'manager')]
    sortUsersByRole(list)
    expect(list.map((u) => u.id)).toEqual(['r', 'm'])
  })
})
