/**
 * One stroked icon set for the whole app, in a single 24×24 grid with a
 * consistent 1.7 stroke weight — mixing icon sets is the fastest way to make
 * an interface look assembled rather than designed.
 *
 * Carried over from the midterm (same grid, same stroke, same SF Symbols-like
 * shapes); the budget glyphs were swapped for hotel ones.
 *
 * Paths only: the <svg> wrapper (sizing, stroke, aria) lives in <Icon /> so
 * every glyph inherits the same treatment and colour (`currentColor`).
 */
const PATHS = {
  // --- Navigation ---
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  chevronLeft: <path d="M15 5 8 12l7 7" />,
  chevronRight: <path d="m9 5 7 7-7 7" />,
  chevronUp: <path d="M5 15 12 8l7 7" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  close: <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />,
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m15.5 15.5 4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M10 4h4M9.5 11v6M14.5 11v6" />
      <path d="M6 7l1 12.2A2 2 0 0 0 9 21h6a2 2 0 0 0 2-1.8L18 7" />
    </>
  ),
  warning: (
    <>
      <path d="M12 4.5 2.8 20h18.4L12 4.5Z" />
      <path d="M12 10v4.5M12 17.4v.1" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 11v5.5M12 7.8v.1" />
    </>
  ),

  // --- Room types (filter chips) ---
  // Solid bed glyphs: a stroked headboard over a filled mattress with feet.
  roomSingle: (
    <>
      <path d="M7.4 11V7.4a2.4 2.4 0 0 1 2.4-2.4h4.4a2.4 2.4 0 0 1 2.4 2.4V11" strokeWidth="2.2" />
      <rect x="4.4" y="10" width="15.2" height="7" rx="2.6" fill="currentColor" stroke="none" />
      <rect x="4.9" y="15" width="2.6" height="4.6" rx="1.3" fill="currentColor" stroke="none" />
      <rect x="16.5" y="15" width="2.6" height="4.6" rx="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  roomDouble: (
    <>
      <path d="M3.9 11V8.1A2.1 2.1 0 0 1 6 6h12a2.1 2.1 0 0 1 2.1 2.1V11" strokeWidth="2.2" />
      <rect x="6.6" y="8.4" width="4.6" height="3.2" rx="1.1" fill="currentColor" stroke="none" />
      <rect x="12.8" y="8.4" width="4.6" height="3.2" rx="1.1" fill="currentColor" stroke="none" />
      <rect x="2.4" y="10.8" width="19.2" height="6.4" rx="2.4" fill="currentColor" stroke="none" />
      <rect x="2.9" y="15.2" width="2.6" height="4.4" rx="1.3" fill="currentColor" stroke="none" />
      <rect x="18.5" y="15.2" width="2.6" height="4.4" rx="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  roomKing: (
    <>
      <path d="M4 17.5 3 8l5 4 4-6 4 6 5-4-1 9.5Z" />
      <path d="M5 20.5h14" />
    </>
  ),
  roomSuite: (
    <>
      <path d="M12 3.6 14.3 9l5.7.5-4.3 3.8 1.3 5.7L12 16l-5 3 1.3-5.7L4 9.5 9.7 9 12 3.6Z" />
    </>
  ),

  // --- Hotel ---
  bed: (
    <>
      <path d="M3 18.5V6.5M3 14h18v4.5M21 14v-2.5a3 3 0 0 0-3-3h-7.5V14" />
      <circle cx="6.8" cy="10.6" r="1.9" />
    </>
  ),
  building: (
    <>
      <rect x="4.5" y="3" width="15" height="18" rx="1.6" />
      <path d="M8.5 7h2M13.5 7h2M8.5 11h2M13.5 11h2M8.5 15h2M13.5 15h2M10.5 21v-2.6h3V21" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.6" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.5 20.2a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8.4" r="3.3" />
      <path d="M2.8 19.6a6.2 6.2 0 0 1 12.4 0" />
      <path d="M15.3 5.4a3.2 3.2 0 0 1 0 6.1M17.6 13.9a6.2 6.2 0 0 1 3.6 5.7" />
    </>
  ),
  personPlus: (
    <>
      <circle cx="10" cy="8" r="3.8" />
      <path d="M2.8 20.2a7.3 7.3 0 0 1 11.5-6M18.5 14v6M15.5 17h6" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4.3" />
      <path d="m11.1 12 8.4-8.4M16.4 6.7l2.6 2.6M14.2 8.9l1.9 1.9" />
    </>
  ),
  checkIn: (
    <>
      <path d="M13.5 4.5h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-4" />
      <path d="M3.5 12h11M10.5 8l4 4-4 4" />
    </>
  ),
  checkOut: (
    <>
      <path d="M10.5 4.5h-4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h4" />
      <path d="M9.5 12h11M16.5 8l4 4-4 4" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3h12v18l-2.4-1.6L13.2 21 12 20.2 10.8 21l-2.4-1.6L6 21V3Z" />
      <path d="M9 8h6M9 11.5h6M9 15h3.5" />
    </>
  ),
  printer: (
    <>
      <path d="M7 8V3.5h10V8" />
      <rect x="3" y="8" width="18" height="8.5" rx="2" />
      <path d="M7 14h10v6.5H7z" />
    </>
  ),
  fork: (
    <>
      <path d="M7 3v6.5a2.5 2.5 0 0 0 5 0V3M9.5 3v18" />
      <path d="M17 21V3c-1.9 1.3-3 3.6-3 6.5V13h3" />
    </>
  ),
  creditCard: (
    <>
      <rect x="2.8" y="5.5" width="18.4" height="13" rx="2.4" />
      <path d="M2.8 10h18.4M6.5 15h3.5" />
    </>
  ),
  wrench: (
    <path d="M14.6 6.2a4 4 0 0 0 5.2 5.2l-8.6 8.6a2.3 2.3 0 0 1-3.3-3.3l8.6-8.6a4 4 0 0 0-1.9-1.9Z" />
  ),
  shield: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6L12 3Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  signOut: (
    <>
      <path d="M10 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H10" />
      <path d="M9.5 12h11M16.5 8l4 4-4 4" />
    </>
  ),
  photo: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.6" />
      <circle cx="8.5" cy="9.5" r="1.7" />
      <path d="m3.5 17 5-4.6 3.6 3.2 3.4-2.9 5 4.3" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2.4" />
      <path d="m3.8 7 8.2 6 8.2-6" />
    </>
  ),
  slider: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2.2" />
      <circle cx="9" cy="17" r="2.2" />
    </>
  ),

  // --- Theme ---
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.6v2.1M12 19.3v2.1M4.4 4.4l1.5 1.5M18.1 18.1l1.5 1.5M2.6 12h2.1M19.3 12h2.1M4.4 19.6l1.5-1.5M18.1 5.9l1.5-1.5" />
    </>
  ),
  moon: <path d="M20.5 13.2A8.4 8.4 0 1 1 10.8 3.5a6.6 6.6 0 0 0 9.7 9.7Z" />,

  // --- Devices ---
  desktop: (
    <>
      <rect x="2.5" y="4" width="19" height="13" rx="2" />
      <path d="M9 21h6M12 17v4" />
    </>
  ),
  tablet: (
    <>
      <rect x="5" y="2.5" width="14" height="19" rx="2.4" />
      <path d="M11 18.6h2" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2.6" />
      <path d="M11 18.6h2" />
    </>
  ),

  // --- Status bar ---
  bellSlash: (
    <>
      <path d="M17.5 12.5A16 16 0 0 1 17 8a5 5 0 0 0-8.2-3.9" />
      <path d="M6.3 6.3A5 5 0 0 0 6 8a16 16 0 0 1-2.7 9h13" />
      <path d="M10.3 20a2 2 0 0 0 3.4 0" />
      <path d="M3 3l18 18" />
    </>
  ),
  signal: (
    <>
      <rect x="0.5" y="7" width="3" height="4" rx="1" fill="currentColor" />
      <rect x="5" y="5" width="3" height="6" rx="1" fill="currentColor" />
      <rect x="9.5" y="3" width="3" height="8" rx="1" fill="currentColor" />
      <rect x="14" y="1" width="3" height="10" rx="1" fill="currentColor" />
    </>
  ),
  wifi: (
    <>
      <path d="M1 4.2a11 11 0 0 1 14 0M3.8 7.3a7 7 0 0 1 8.4 0M6.5 10.2a3 3 0 0 1 3 0" />
      <circle cx="8" cy="12.4" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  battery: (
    <>
      <rect x="0.7" y="2.2" width="19" height="9.6" rx="3" opacity="0.45" />
      <rect x="2.4" y="3.9" width="13" height="6.2" rx="1.8" fill="currentColor" stroke="none" />
      <path d="M21.2 5.6v2.8" opacity="0.45" strokeWidth="2.4" />
    </>
  ),
}

/**
 * @param {string} name key of PATHS
 * @param {string} [viewBox] status-bar glyphs are drawn on their own grids
 */
export default function Icon({ name, viewBox = '0 0 24 24', ...rest }) {
  const path = PATHS[name]
  if (!path) return null

  return (
    <svg
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {path}
    </svg>
  )
}
