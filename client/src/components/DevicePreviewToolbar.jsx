import { memo } from 'react'
import { motion } from 'motion/react'
import { useDevice } from '../context/DeviceContext'
import { DEVICE_SPECS } from '../hooks/useDeviceFrame'
import { SPRING_SNAPPY } from '../motion/transitions'
import Icon from './Icon'

const OPTIONS = [
  { value: 'desktop', icon: 'desktop' },
  { value: 'tablet', icon: 'tablet' },
  { value: 'phone', icon: 'phone' },
]

/**
 * Floating control for the device preview. Deliberately lives on the stage —
 * outside the frame — because it is developer chrome, not part of the app
 * being previewed.
 *
 * memo() because it re-renders only when the selected device changes, and it
 * sits next to a subtree that re-renders on every navigation.
 */
function DevicePreviewToolbar() {
  const { device, setDevice } = useDevice()

  return (
    <div
      className="preview-toolbar"
      role="group"
      aria-label="Device preview size"
    >
      {OPTIONS.map((option) => {
        const isActive = device === option.value
        return (
          <button
            key={option.value}
            type="button"
            className="preview-toolbar__btn"
            aria-pressed={isActive}
            aria-label={DEVICE_SPECS[option.value].label}
            title={DEVICE_SPECS[option.value].label}
            onClick={() => setDevice(option.value)}
          >
            {/* One shared element travelling between buttons (layoutId), not
                three pills cross-fading — the highlight keeps its identity, so
                the eye follows it instead of re-finding it. */}
            {isActive && (
              <motion.span
                className="preview-toolbar__pill"
                layoutId="device-pill"
                transition={SPRING_SNAPPY}
              />
            )}
            <Icon name={option.icon} />
          </button>
        )
      })}
    </div>
  )
}

export default memo(DevicePreviewToolbar)
