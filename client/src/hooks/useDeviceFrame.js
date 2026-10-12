import { useEffect, useState } from 'react'

/**
 * Physical dimensions for the preview frames, in CSS pixels — the logical
 * resolutions of the real hardware, so a layout previewed here matches what
 * the device would actually render.
 */
export const DEVICE_SPECS = {
  desktop: { label: 'Desktop', screen: null, bezel: 0, radius: 0 },
  tablet: { label: 'iPad Pro 11″', screen: [834, 1194], bezel: 14, radius: 42 },
  phone: {
    label: 'iPhone 17 Pro Max',
    screen: [440, 956],
    bezel: 12,
    radius: 66,
  },
}

const STAGE_PADDING_X = 32
const STAGE_PADDING_Y = 48

/**
 * Works out how big the chosen device frame is, and how far it has to be
 * scaled down to fit the real browser window.
 *
 * Scaling (rather than shrinking the frame) is what keeps the preview honest:
 * the screen stays exactly 440×956 in CSS pixels no matter how small the
 * window is, so container queries inside it resolve to the same breakpoints a
 * real iPhone would hit.
 *
 * Desktop reports the live window size, which keeps every consumer on one
 * code path — pixel values all the way through, no `null` special case.
 */
export function useDeviceFrame(device) {
  const [window_, setWindow_] = useState(getWindowSize)

  useEffect(() => {
    // Measured straight from the event rather than inside a
    // requestAnimationFrame: rAF is paused while a tab isn't compositing, so
    // a resize that happens in a background tab would never be applied and
    // the frame would still be the old size when the tab came back. Reading
    // innerWidth is cheap, and React batches the resulting renders.
    const handleResize = () => setWindow_(getWindowSize())

    // A resize can land between the first render and this effect running.
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const spec = DEVICE_SPECS[device] ?? DEVICE_SPECS.desktop

  if (!spec.screen) {
    return {
      spec,
      screenWidth: window_.width,
      screenHeight: window_.height,
      frameWidth: window_.width,
      frameHeight: window_.height,
      fitWidth: window_.width,
      fitHeight: window_.height,
      scale: 1,
    }
  }

  const [screenWidth, screenHeight] = spec.screen
  const frameWidth = screenWidth + spec.bezel * 2
  const frameHeight = screenHeight + spec.bezel * 2

  // Never scale up — a 440px phone blown up on a 4K monitor looks like a toy.
  const scale = Math.min(
    1,
    (window_.width - STAGE_PADDING_X) / frameWidth,
    (window_.height - STAGE_PADDING_Y) / frameHeight,
  )

  return {
    spec,
    screenWidth,
    screenHeight,
    frameWidth,
    frameHeight,
    // The footprint the scaled frame actually occupies, so the stage can
    // centre it without the un-scaled box overflowing the page.
    fitWidth: frameWidth * scale,
    fitHeight: frameHeight * scale,
    scale,
  }
}

function getWindowSize() {
  return { width: window.innerWidth, height: window.innerHeight }
}
