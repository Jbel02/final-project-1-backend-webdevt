import { useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { homePathFor } from '../data/navItems'
import { TransitionModeContext } from '../motion/transitionMode'
import { transitionModeFor } from '../motion/transitions'
import CreateAccount from '../pages/auth/CreateAccount'
import SignIn from '../pages/auth/SignIn'
import BookingDetail from '../pages/bookings/BookingDetail'
import Bookings from '../pages/bookings/Bookings'
import NotFound from '../pages/NotFound'
import Profile from '../pages/Profile'
import BookRoom from '../pages/rooms/BookRoom'
import RoomDetail from '../pages/rooms/RoomDetail'
import RoomEditor from '../pages/rooms/RoomEditor'
import Rooms from '../pages/rooms/Rooms'
import NewReceptionist from '../pages/users/NewReceptionist'
import UserDetail from '../pages/users/UserDetail'
import Users from '../pages/users/Users'
import RequireRole from './RequireRole'

/**
 * Every route, with the outgoing screen kept mounted long enough to animate
 * away (the midterm's technique: `<Routes location>` under a keyed subtree,
 * so AnimatePresence can hold the previous screen while the next one enters).
 *
 * Access per route mirrors the proposal's endpoint table. Rooms and room
 * detail are public, like GET /api/rooms.
 */
export default function AnimatedRoutes() {
  const location = useLocation()
  const { user } = useAuth()

  // Derived during render, so the entering screen never paints with the
  // previous navigation's direction.
  const [previousPath, setPreviousPath] = useState(location.pathname)
  const [mode, setMode] = useState('fade')

  if (previousPath !== location.pathname) {
    setMode(transitionModeFor(previousPath, location.pathname))
    setPreviousPath(location.pathname)
  }

  return (
    <AnimatePresence custom={mode} initial={false}>
      <TransitionModeContext.Provider key={location.pathname} value={mode}>
        <Routes location={location}>
          <Route path="/" element={<Navigate to={homePathFor(user)} replace />} />

          {/* Public */}
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/:id" element={<RoomDetail />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<CreateAccount />} />

          {/* Guest */}
          <Route path="/rooms/:id/book" element={<RequireRole roles={['guest']}><BookRoom /></RequireRole>} />

          {/* Any signed-in role — each screen adapts to who is looking */}
          <Route path="/bookings" element={<RequireRole><Bookings /></RequireRole>} />
          <Route path="/bookings/:id" element={<RequireRole><BookingDetail /></RequireRole>} />
          <Route path="/profile" element={<RequireRole><Profile /></RequireRole>} />

          {/* Manager */}
          <Route path="/rooms/new" element={<RequireRole roles={['manager']}><RoomEditor /></RequireRole>} />
          <Route path="/rooms/:id/edit" element={<RequireRole roles={['manager']}><RoomEditor /></RequireRole>} />
          <Route path="/users" element={<RequireRole roles={['manager']}><Users /></RequireRole>} />
          <Route path="/users/new" element={<RequireRole roles={['manager']}><NewReceptionist /></RequireRole>} />
          <Route path="/users/:id" element={<RequireRole roles={['manager']}><UserDetail /></RequireRole>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TransitionModeContext.Provider>
    </AnimatePresence>
  )
}
