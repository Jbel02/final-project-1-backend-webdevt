import { useAuth } from '../../context/AuthContext'
import BrowseRooms from './BrowseRooms'
import ManageRooms from './ManageRooms'

/** One /rooms URL, two screens: the manager manages, everyone else browses. */
export default function Rooms() {
  const { user } = useAuth()
  return user?.role === 'manager' ? <ManageRooms /> : <BrowseRooms />
}
