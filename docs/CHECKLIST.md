# SuiteSpot — Proposal Checklist

Tracks every item in `final-project-proposal-G1.pdf` against the build, plus every gap,
default and addition. Nothing from the proposal is dropped; anything beyond it is marked ➕.

| Mark | Meaning |
| --- | --- |
| ✅ | Built and verified (automated test and/or clicked through in the browser) |
| 🟡 | Built using a **default value we chose** — works, but confirm or change it |
| ❓ | **Needs your decision or action** before it can be finished |
| ➕ | Addition beyond the proposal (allowed: "we can add on top of it") |

**Verification legend** — `T` = automated test in `server/test/` or `client/src/**/*.test.js`,
`B` = clicked through in the browser on 2026-10-05.

---

## 1. Objectives (Proposal §I-B)

| Objective | Status | Where |
| --- | --- | --- |
| Complete MERN app: React (Vite), Node, Express, MongoDB/Mongoose | ✅ | `client/`, `server/` |
| Full CRUD | ✅ | §2 below |
| User authentication | ✅ T B | JWT in httpOnly cookie, bcrypt — `server/src/middleware/auth.js` |
| Role-based authorization (Guest / Receptionist / Manager) | ✅ T B | `requireRole()` on every route; 76-case permission matrix in `server/test/permissions.test.js` |
| Frontend **and** backend validation | ✅ T B | Same validators in `shared/validation.js` run in the browser (`client/src/hooks/useForm.js`) and on the server (`assertValid()`) |
| Translate the Java console system into a multi-user web app | ✅ | — |
| True availability: numbered rooms + date ranges, not counters | ✅ T B | `server/src/services/availability.js` — overlap query on bookings |
| Filters by date, price, capacity; room photos; printable receipts | ✅ T B | Rooms screen, `RoomPhoto`, `Receipt` (window.print) |
| "Real-time" availability | ✅ | Interpreted as *always computed live from the database* — no WebSockets (see §5) |

## 2. CRUD (Proposal §II)

### Create
| Item | Status | Screen → Endpoint |
| --- | --- | --- |
| Guest self-registers | ✅ T B | Create Account → `POST /api/auth/register` (role always forced to `guest`) |
| Guest creates booking (dates, guest count, meal add-ons, payment) | ✅ T B | Book Room → `POST /api/bookings` |
| Manager adds room records | ✅ T B | Rooms → **+** → `POST /api/rooms` |
| Manager creates Receptionist accounts | ✅ T | Users → **+** → `POST /api/users/receptionist` |

### Read
| Item | Status | Screen → Endpoint |
| --- | --- | --- |
| Guest browses/filters rooms by date range, price, capacity | ✅ T B | Rooms → `GET /api/rooms?checkIn&checkOut&minPrice&maxPrice&guests&type` |
| Guest views own booking history | ✅ B | Bookings (Upcoming / Past) → `GET /api/bookings/mine` |
| Guest views printable receipt | ✅ B | Booking → **Print Receipt** (portalled print-only layout) |
| Receptionist & Manager view all bookings, filter by date and payment status | ✅ T B | Bookings → `GET /api/bookings?date&paymentStatus` (+ ➕ status, search) |
| Manager views all registered users | ✅ B | Users → `GET /api/users` |

### Update
| Item | Status | Screen → Endpoint |
| --- | --- | --- |
| Guest updates own profile | ✅ T B | Profile → Edit → ➕ `PATCH /api/users/me` |
| Manager edits room (price, capacity, photo, status) | ✅ T B | Room → Edit → `PUT /api/rooms/:id` |
| Manager deactivates staff accounts | ✅ T B | Account → Deactivate → `PATCH /api/users/:id/deactivate` |
| Receptionist updates booking status (check-in / check-out) | ✅ T B | Booking → Check In / Check Out → `PATCH …/checkin`, `PATCH …/checkout` |

### Delete
| Item | Status | Screen → Endpoint |
| --- | --- | --- |
| Guest cancels own upcoming (not checked-in) booking | ✅ T B | Booking → Cancel Booking → `PATCH /api/bookings/:id/cancel` (status → `cancelled`, record kept) |
| Manager deletes room records | ✅ T B | Edit Room → Delete Room → `DELETE /api/rooms/:id` |
| Manager deletes user accounts (guest or staff) | ✅ T B | Account → Delete Account → `DELETE /api/users/:id` |

## 3. Roles (Proposal §III)

| Permission | Guest | Receptionist | Manager | Status |
| --- | :-: | :-: | :-: | --- |
| Browse/filter rooms, view details & photos | ✓ | ✓ (read-only) | ✓ (+ maintenance rooms) | ✅ T B |
| Book a room (dates, guests, meals, full / 30% payment) | ✓ | — | — | ✅ T B |
| View own bookings + printable receipt | ✓ | — | — | ✅ B |
| Cancel own upcoming booking | ✓ | — | — | ✅ T B |
| Edit own profile | ✓ | ➕ ✓ | ➕ ✓ | ✅ T B |
| View all bookings, filter by date / payment status | — | ✓ | ✓ | ✅ T B |
| Check guests in and out | — | ✓ | ✓ | ✅ T B |
| No access to room management or user admin (receptionist) | — | ✓ blocked | — | ✅ T |
| Full CRUD on rooms | — | — | ✓ | ✅ T B |
| View and cancel any booking | — | — | ✓ | ✅ T |
| View all users | — | — | ✓ | ✅ T B |
| Create and deactivate Receptionist accounts | — | — | ✓ | ✅ T B |
| Delete guest or staff accounts | — | — | ✓ | ✅ T B |
| Receptionists are created by the Manager, not self-registered | — | — | — | ✅ T (register always creates `guest`) |

## 4. Technology (Proposal §IV-A)

| Item | Status | Notes |
| --- | --- | --- |
| React (Vite) | ✅ | Vite 8, React 19 |
| Tailwind CSS | ✅ | Tailwind v4; the midterm's iOS tokens are its theme (`client/src/index.css`) |
| React Router | ✅ | Real URLs, deep links, Back/Forward |
| Context API (auth state) | ✅ | `AuthContext` (+ Theme and Device contexts carried over from the midterm) |
| Axios | ✅ | `client/src/api/` |
| Node.js + Express (REST) | ✅ | Express 5 |
| MongoDB + Mongoose | ✅ | Mongoose 8 |
| JWT in httpOnly cookie | ✅ T | `SameSite=Lax`, `Secure` in production |
| bcrypt password hashing | ✅ | `bcryptjs` (pure-JS bcrypt — no native build needed on Windows/Render) |
| Role-based middleware | ✅ T | `authenticate`, `requireRole(...)` |
| Receipts via `window.print()` (no PDF library) | ✅ B | `client/src/components/Receipt.jsx` |
| Room photos as admin-supplied URLs (no upload service) | ✅ B | Photo Link field + live preview; placeholder when blank/broken |
| UI/UX matches `midterm-project-webdevt` (iOS design, fonts, wording) | ✅ B | Same tokens, type scale, font stack, nav bar, tab bar/sidebar, sheets, springs, device frame |

## 5. Data models (Proposal §IV-B)

The PDF's schema tables extracted with columns misaligned; fields below are read as intended.
**Please sanity-check against your copy.**

| Model | Proposal fields | Status | ➕ Added |
| --- | --- | --- | --- |
| **User** | name (required), email (required, unique), passwordHash (required), role (guest / receptionist / manager), contact, address, isActive (default true) | ✅ | `createdAt`/`updatedAt` |
| **Room** | roomNumber (unique, e.g. "101"), floor (1–8), type (Single / Double / King / Suite), pricePerNight, maxOccupancy, photoUrl, status (available / maintenance) | ✅ | timestamps |
| **Booking** | transactionId (unique, generated), guest → User, room → Room, checkIn, checkOut, guests, mealAddons (none / lunch / dinner / both), totalAmount, paidAmount, balance, paymentStatus (full / partial), status (confirmed / checked-in / completed / cancelled) | ✅ | `roomSnapshot`, `guestSnapshot` (receipts survive price edits and deletions), timestamps |

80 rooms on 8 floors (10 per floor) — ✅ seeded: positions 01–04 Single, 05–07 Double, 08–09 King, 10 Suite.

## 6. API endpoints (Proposal §IV-C) — 19 in the proposal, all built

| Method | Endpoint | Access | Status |
| --- | --- | --- | --- |
| POST | /api/auth/register | Public | ✅ T |
| POST | /api/auth/login | Public | ✅ T |
| POST | /api/auth/logout | Authenticated | ✅ T |
| GET | /api/auth/me | Authenticated | ✅ T |
| GET | /api/rooms | Public | ✅ T |
| GET | /api/rooms/:id | Public | ✅ T |
| POST | /api/rooms | Manager | ✅ T |
| PUT | /api/rooms/:id | Manager | ✅ T |
| DELETE | /api/rooms/:id | Manager | ✅ T |
| POST | /api/bookings | Guest | ✅ T |
| GET | /api/bookings/mine | Guest | ✅ T |
| GET | /api/bookings | Receptionist, Manager | ✅ T |
| PATCH | /api/bookings/:id/checkin | Receptionist, Manager | ✅ T |
| PATCH | /api/bookings/:id/checkout | Receptionist, Manager | ✅ T |
| PATCH | /api/bookings/:id/cancel | Guest (own), Manager (any) | ✅ T |
| GET | /api/users | Manager | ✅ T |
| POST | /api/users/receptionist | Manager | ✅ T |
| PATCH | /api/users/:id/deactivate | Manager | ✅ T |
| DELETE | /api/users/:id | Manager | ✅ T |

➕ Added endpoints: `PATCH /api/users/me` (any signed-in user), `GET /api/bookings/:id` (owner or
staff — receipt screen), `GET /api/users/:id` (manager — account screen),
`PATCH /api/users/:id/activate` (manager — undo a deactivation), `GET /api/health` (Render health check).

---

## 7. Gaps & conflicts found in the proposal

| # | Gap / conflict | Resolution | Status |
| --- | --- | --- | --- |
| G1 | Tailwind (proposal) vs. midterm's hand-written CSS | Tailwind v4 with the midterm's tokens as theme; iOS primitives in `@layer components` | ✅ decided by you |
| G2 | Device preview frame not in proposal | Kept (Desktop / iPad Pro 11″ / iPhone 17 Pro Max) | ✅ decided by you |
| G3 | "Guest edits own profile" has no endpoint | ➕ `PATCH /api/users/me` | ✅ |
| G4 | Printable receipt needs a single-booking read | ➕ `GET /api/bookings/:id` | ✅ |
| G5 | 80 rooms + first Manager must come from somewhere | ➕ Seed (`server/src/seed/seed.js`), automatic on an empty DB | ✅ |
| G6 | Two guests booking the same room at the same moment | ➕ Transaction + room write-lock; tested with simultaneous requests | ✅ T |
| G7 | "Guest cancels" listed under *Delete*, but endpoint is `PATCH …/cancel` | Status → `cancelled`; record and receipt kept | ✅ |
| G8 | "Real-time" in objectives, no WebSockets in stack | Live database computation on every request | ✅ |
| G9 | Hosting not specified | ➕ Vercel (client) + Render (API) + Atlas (DB) | ✅ decided by you — see §9 |
| G10 | Cross-site cookies (Vercel ↔ Render) blocked by Safari | ➕ Vercel rewrites `/api/*` to Render so the cookie stays first-party | ✅ configured, ❓ needs deploy |
| G11 | "Today" on a UTC server vs. Philippine time | All date rules use the hotel's calendar (Asia/Manila) | ✅ T |
| G12 | PDF schema tables garbled | Interpreted as in §5 | 🟡 please confirm |
| G13 | Receptionist can't book walk-ins (proposal: booking is Guest-only) | Kept as written — receptionist sees a note instead of "Book" | 🟡 confirm this is intended |

## 8. Defaults we chose (🟡 — change any of these)

| # | Default | Where to change |
| --- | --- | --- |
| D1 | Nightly rates: Single ₱1,500 · Double ₱2,500 · King ₱3,500 · Suite ₱6,000 | `shared/constants.js` → `ROOM_TYPE_DEFAULTS` (then re-seed) |
| D2 | Capacity: Single 1 · Double 2 · King 3 · Suite 4 guests | same |
| D3 | Meals: lunch ₱350, dinner ₱450 per guest, per night | `shared/constants.js` → `MEAL_PRICES` |
| D4 | Partial payment = 30% now; **balance settled at check-out** (booking becomes "Paid in Full") | `PARTIAL_RATE`; check-out logic in `server/src/routes/bookings.js` |
| D5 | Can't delete a room or guest with an upcoming/current stay → message suggests Maintenance / Deactivate | `rooms.js` / `users.js` delete handlers |
| D6 | Managers can't deactivate/delete themselves or other managers (prevents lock-out) | `findManageableUser()` in `users.js` |
| D7 | Check-in allowed from the check-in date until the day before check-out | `PATCH …/checkin` |
| D8 | Max stay 30 nights | `MAX_NIGHTS` |
| D9 | Cancelling doesn't refund (amount paid stays on the record) — proposal is silent on refunds | — |
| D10 | Payment is simulated (no card fields) — proposal is silent on a gateway | Footnote on Book Room |
| D11 | Rooms 207 and 609 seeded in Maintenance so the status is visible in demos | `MAINTENANCE_ROOMS` in seed |

## 9. Needs you (❓)

| # | Item | Why it's blocked |
| --- | --- | --- |
| N1 | **Who builds which part** (e.g. Guest / Front desk / Manager slices) | Your call — the code is already split along those lines (see README "Project map") |
| N2 | **GitHub usernames** of Cedric Cortez and Dustin Elpedes + public or private repo | Needed to add them as collaborators; `gh` CLI isn't installed on this machine |
| N3 | **Create the GitHub repo** and push (nothing has been committed yet) | Waiting for your go-ahead, after N1 |
| N4 | **MongoDB Atlas**: create a free cluster, a database user, allow `0.0.0.0/0`, copy the connection string | Needs your Atlas account |
| N5 | **Render**: New → Blueprint → pick the repo (uses `render.yaml`); set `MONGODB_URI` and `SEED_MANAGER_PASSWORD` | Needs your Render account |
| N6 | **Vercel**: import the repo (root directory = repo root; `vercel.json` does the rest). If Render gives a URL other than `suitespot-api.onrender.com`, update it in `vercel.json` | Needs your Vercel account and the final Render URL |
| N7 | Confirm or change D1–D11 and G12–G13 | Business rules |

## 10. Known limitations (not proposal items)

- Render's free tier sleeps after ~15 min idle; the first request then takes up to a minute
  (the client waits 60 s). Open the site once before a live demo.
- Local development without `MONGODB_URI` uses an in-memory database: it **resets on every API
  restart** (including when you edit server code), which also signs you out.
- The JS bundle is ~180 KB gzipped (Vite warns above 500 KB uncompressed). Route-level code
  splitting is an easy later improvement.

## 11. Verification log

- `npm test` — server: **109 tests passing** (shared rules, 76-case role matrix, bookings incl.
  simultaneous double-booking, rooms, users); client: 6 tests (transitions, formatting).
- `npm run lint` — clean. `npm run build` — succeeds.
- Browser walk-through (2026-10-05): guest sign-in validation, dated search (overlap + maintenance
  exclusion), room detail availability, booking with dinner + 30% (₱6,800 / ₱2,040 / ₱4,760),
  guest cancel via action sheet, receptionist "today" view, check-in, check-out settling a
  ₱19,320 balance, manager room list (iPhone frame, light + dark), add / validate / delete room,
  deactivate account, refused delete with server message, sign-up with on-blur validation,
  profile edit, sign-out, receipt print layout.
- Bugs found and fixed during the walk-through: row thumbnails rendering full width; toasts
  covering action sheets; sign-out from Profile redirecting to Sign In; a closing action sheet
  still accepting taps; API grabbing the Vite port; duplicate MongoDB binary download.
