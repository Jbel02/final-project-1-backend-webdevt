import { AuthProvider, useAuth } from './context/AuthContext'
import { DeviceProvider } from './context/DeviceContext'
import { ThemeProvider } from './context/ThemeContext'
import AnimatedRoutes from './components/AnimatedRoutes'
import AppToaster from './components/AppToaster'
import DeviceStage from './components/DeviceStage'
import Sidebar from './components/Sidebar'
import TabBar from './components/TabBar'

/**
 * Provider order is deliberate:
 *
 *   ThemeProvider   — outermost; sets `data-theme`, which everything below
 *                     inherits its colours from
 *   DeviceProvider  — the preview frame (Desktop / iPad / iPhone)
 *   AuthProvider    — who is signed in; the tab bar, sidebar and every route
 *                     read it
 *
 * Inside, the layout is the midterm's: one persistent shell (sidebar or tab
 * bar, depending on the width of the *previewed* screen) around a page host
 * where routes come and go.
 */
export default function App() {
  return (
    <ThemeProvider>
      <DeviceProvider>
        <AuthProvider>
          <DeviceStage>
            <Shell />
            {/* Mounted at viewport level on purpose — inside a `.page` it
                would slide away with a route transition. */}
            <AppToaster />
          </DeviceStage>
        </AuthProvider>
      </DeviceProvider>
    </ThemeProvider>
  )
}

/** Waits for the session check, so a signed-in user never sees signed-out tabs flash. */
function Shell() {
  const { isReady } = useAuth()
  if (!isReady) return <div className="flex-1" aria-busy="true" />

  return (
    <>
      <div className="shell">
        <Sidebar />
        <div className="page-host">
          <AnimatedRoutes />
        </div>
      </div>
      <TabBar />
    </>
  )
}
