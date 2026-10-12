import { useState } from 'react'
import Icon from './Icon'

/**
 * A room's photo — an admin-supplied URL, per the proposal. A missing or
 * broken link shows a quiet placeholder instead of a broken-image icon.
 */
export default function RoomPhoto({ src, alt = '', className = '' }) {
  const [failedSrc, setFailedSrc] = useState(null)
  const showImage = src && failedSrc !== src

  return (
    <span className={`photo ${className}`.trim()}>
      {showImage ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailedSrc(src)} />
      ) : (
        <span className="photo__fallback" role={alt ? 'img' : undefined} aria-label={alt || undefined}>
          <Icon name="bed" />
        </span>
      )}
    </span>
  )
}
