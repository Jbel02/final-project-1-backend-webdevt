import { useEffect, useState } from 'react'
import Icon from './Icon'

/**
 * The iOS status bar for the Tablet/Phone frames. Purely decorative — but a
 * device frame without one reads as a rectangle with rounded corners rather
 * than a phone, and the app's chrome is designed to sit below it.
 *
 * On Phone the two halves split around the Dynamic Island; on Tablet they sit
 * at the far edges of a single 24px strip.
 */
export default function StatusBar() {
  const time = useClockTime()

  return (
    <div className="status-bar" aria-hidden="true">
      <span className="status-bar__time">
        <span className="t-numeric">{time}</span>
        <Icon name="bellSlash" style={{ width: 13 }} />
      </span>
      <span className="status-bar__icons">
        <Icon name="signal" viewBox="0 0 17.5 12" style={{ width: 17 }} />
        <Icon name="wifi" viewBox="0 0 16 13.5" style={{ width: 16 }} />
        <Icon name="battery" viewBox="0 0 22 14" style={{ width: 24 }} />
      </span>
    </div>
  )
}

/** Ticks once a minute rather than once a second — the display has no seconds,
 *  so a 1s interval would be 59 wasted renders. */
function useClockTime() {
  const [time, setTime] = useState(currentTime)

  useEffect(() => {
    const id = setInterval(() => setTime(currentTime()), 30_000)
    return () => clearInterval(id)
  }, [])

  return time
}

function currentTime() {
  // hour12 stays true so the hour numbers themselves are 1-12, not 0-23 —
  // there's no Intl option for "12-hour numbering, no AM/PM", so the marker
  // is formatted in and then stripped back out.
  const formatted = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return formatted.replace(/\s?[AP]M$/i, '')
}
