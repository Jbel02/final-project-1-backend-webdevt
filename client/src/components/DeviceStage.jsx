import { motion, useReducedMotion } from 'motion/react'
import { useDevice } from '../context/DeviceContext'
import { useDeviceFrame } from '../hooks/useDeviceFrame'
import { SPRING } from '../motion/transitions'
import DevicePreviewToolbar from './DevicePreviewToolbar'
import StatusBar from './StatusBar'

/**
 * Wraps the entire app in the selected device frame.
 *
 * Switching device morphs the hardware rather than swapping it: the bezel's
 * size, corner radius and scale are all animated by the same critically
 * damped spring, so the frame reads as one object changing shape. The app
 * inside is never unmounted, so route, scroll and form state survive a
 * switch — and the layout genuinely re-flows to the new width, because
 * everything inside sizes off container queries against `.viewport`.
 */
export default function DeviceStage({ children }) {
  const { device } = useDevice()
  const frame = useDeviceFrame(device)
  const prefersReducedMotion = useReducedMotion()

  // Reduced motion: land on the new size immediately. The size change itself
  // still happens — it is the meaning of the control — just without travel.
  const transition = prefersReducedMotion ? { duration: 0 } : SPRING
  const isFramed = device !== 'desktop'

  return (
    <div className="stage" data-device={device}>
      <DevicePreviewToolbar />

      <motion.div
        className="device-fit"
        initial={false}
        animate={{ width: frame.fitWidth, height: frame.fitHeight }}
        transition={transition}
      >
        <motion.div
          className="device-frame"
          data-device={device}
          initial={false}
          animate={{
            width: frame.frameWidth,
            height: frame.frameHeight,
            padding: frame.spec.bezel,
            borderRadius: frame.spec.radius,
            scale: frame.scale,
          }}
          transition={transition}
        >
          {device === 'phone' && (
            <>
              <span className="device-button device-button--action" />
              <span className="device-button device-button--vol-up" />
              <span className="device-button device-button--vol-down" />
              <span className="device-button device-button--power" />
            </>
          )}
          {device === 'tablet' && (
            <>
              <span className="device-button device-button--power" />
              <span className="device-button device-button--volume" />
            </>
          )}

          <div className="viewport">
            {isFramed && <StatusBar />}
            {device === 'phone' && (
              <span className="dynamic-island" aria-hidden="true" />
            )}

            {children}

            {isFramed && <span className="home-indicator" aria-hidden="true" />}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
