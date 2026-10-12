import { useAuth } from '../../context/AuthContext'
import FrontDesk from './FrontDesk'
import MyBookings from './MyBookings'

/** One /bookings URL: a guest sees their own, staff see everyone's. */
export default function Bookings() {
  const { user } = useAuth()
  return user.role === 'guest' ? <MyBookings /> : <FrontDesk />
}
