# SuiteSpot — Hotel Reservation & Booking System

Final project, **Group 1 · C3A** — Cortez, Cedric · Elpedes, Dustin · Maliñana, Johnbel

A full-stack MERN app for an 80-room hotel (8 floors × 10 rooms; Single, Double, King and
Suite): guests search by date, price and capacity and book rooms; the front desk checks guests in
and out; the manager runs rooms, bookings and accounts.

The interface carries over the iOS design language of `midterm-project-webdevt` — the same system
colours, type scale, fonts, translucent nav bar and tab bar, action sheets, spring transitions and
the Desktop / iPad / iPhone preview frame.

> **Proposal tracking:** every item of `final-project-proposal-G1.pdf`, every gap we found, every
> default we chose and every addition is listed in [`docs/CHECKLIST.md`](docs/CHECKLIST.md).

---

## Quick start

Requires **Node.js 20+**.

```bash
npm run install:all
npm run dev
```

Open http://localhost:5173.

No database setup is needed for development: without `MONGODB_URI` the API starts an
**in-memory MongoDB** and seeds it (the first run downloads a ~600 MB MongoDB binary once). The
data resets whenever the API restarts — including when you edit server code — and you'll be
signed out when that happens.

To use a real database instead, copy `server/.env.example` to `server/.env` and set
`MONGODB_URI` to your Atlas connection string. Run `npm run seed` once to load demo data (it asks
before wiping anything).

### Demo accounts (seeded test data)

| Role | Email | Password |
| --- | --- | --- |
| Manager | manager@suitespot.test | Manager123 |
| Receptionist | frontdesk@suitespot.test | Desk12345 |
| Guest | guest@suitespot.test | Guest1234 |
| Guest | maria@suitespot.test, ana@…, carlo@… | Guest1234 |

Seeded bookings are placed relative to today, so there is always a guest checked in, one arriving
today, one leaving today, plus past, future and cancelled stays.

### Scripts (run from the repo root)

| Script | What it does |
| --- | --- |
| `npm run dev` | API (port 5000) + Vite (port 5173) together |
| `npm test` | Server tests (109, incl. a 76-case role matrix) + client tests |
| `npm run lint` | ESLint over the client |
| `npm run build` | Production build of the client into `client/dist` |
| `npm run seed` | Reset the database in `MONGODB_URI` to demo data |

---

## Project map

The code is organised so it can be split by role. Every slice uses the same shared pieces.

```
shared/                 rules used by BOTH client and server (no dependencies)
  constants.js            room types, prices, meal rates, statuses
  dates.js                date-only helpers, hotel time zone, overlap rule
  pricing.js              quoteBooking() — the one place a bill is computed
  validation.js           every form's validator (frontend + backend validation)

server/                 Express + Mongoose API
  src/models/             User, Room, Booking
  src/middleware/         auth (JWT cookie, requireRole), errors
  src/routes/             auth.js · rooms.js · bookings.js · users.js
  src/services/           availability.js (date-overlap availability)
  src/seed/               80 rooms, demo accounts, demo bookings
  test/                   Supertest + in-memory replica set

client/                 React (Vite) + Tailwind
  src/api/                one function per endpoint (Axios)
  src/context/            AuthContext, ThemeContext, DeviceContext
  src/components/         iOS primitives ported from the midterm + Receipt, RoomPhoto…
  src/pages/auth/         Sign In, Create Account
  src/pages/rooms/        Browse (guest), Manage (manager), Detail, Book, Editor
  src/pages/bookings/     My Bookings (guest), Front Desk (staff), Booking detail/receipt
  src/pages/users/        Users, New Receptionist, Account (manager)
  src/pages/Profile.jsx   everyone
  src/styles/             tokens.css (midterm), components.css (iOS primitives), device.css
```

Possible three-way split:

| Slice | Client | Server |
| --- | --- | --- |
| **Guest** | `pages/auth`, `pages/rooms/BrowseRooms`, `RoomDetail`, `BookRoom`, `pages/bookings/MyBookings`, `Profile` | `routes/auth.js`, `POST /bookings`, `GET /bookings/mine`, `PATCH /users/me` |
| **Front desk** | `pages/bookings/FrontDesk`, `BookingDetail`, `components/Receipt` | `GET /bookings`, check-in / check-out / cancel, `services/availability.js` |
| **Manager** | `pages/rooms/ManageRooms`, `RoomEditor`, `pages/users/*` | `routes/rooms.js`, `routes/users.js`, `seed/` |

---

## How it works

**Authentication.** Login sets a JWT in an **httpOnly cookie** — page scripts never see the
token. Every request re-reads the account, so deactivating someone signs them out immediately.
Passwords are hashed with bcrypt. Self-registration always creates a guest; receptionists are
created by the manager.

**Authorization.** `requireRole('manager')` and friends guard every route on the server. The
client hides screens a role can't use (`RequireRole`), but that's a courtesy — the server is the
gate, and `server/test/permissions.test.js` checks all 19 proposal endpoints against all four
kinds of caller.

**Validation, twice.** Each form runs a validator from `shared/validation.js` as you type (a
field's message appears after you leave it or submit). The server runs **the same function**
again and returns per-field messages, which appear in the same place.

**Availability.** No "rooms left" counters: a room is free for a stay when no active booking for
it overlaps the dates (check-out day is free for the next guest). Creating a booking runs inside
a MongoDB transaction that also writes the room document, so two guests booking the same room at
the same moment can't both succeed — there's a test that fires both requests at once.

**Money.** The booking form and the server both price a stay with `quoteBooking()`; the server
never trusts amounts sent by the browser. Partial payment is 30% now, with the balance settled at
check-out. Each booking stores a snapshot of the room and guest, so receipts stay correct after a
price change or a deletion.

**Receipts.** "Print Receipt" calls `window.print()`. A print-only receipt is portalled into
`<body>`, outside the phone frame; print CSS hides everything else.

**Dates.** Stays are calendar dates stored as UTC midnight, and "today" is the hotel's day in
Asia/Manila — so a server running in UTC never thinks it's still yesterday.

---

## Design (carried over from the midterm)

- `client/src/styles/tokens.css` is the midterm's token file, unchanged; Tailwind reads it
  through `@theme inline`, so `bg-card`, `text-label-secondary` or `text-green` re-theme with dark
  mode automatically.
- Same font stack as the midterm: SF Pro on Apple devices, Segoe UI Variable on Windows, Roboto
  on Android. Apple's licence doesn't allow serving SF Pro as a web font, so it comes from the OS.
- iOS wording: centred nav titles, Title Case buttons ("Book This Room", "Check In"), Cancel /
  Save / Edit in the bar, action sheets for destructive choices ("Cancel Booking" / "Keep
  Booking"), short sentence-case footnotes under grouped lists.
- Push transitions for detail screens, sheet-style presentation for tasks (booking, sign in,
  editors), cross-fades between tabs — all critically damped springs.
- Device preview (top-right control): Desktop, iPad Pro 11″, iPhone 17 Pro Max. Layout inside
  responds to container queries on the simulated screen.
- Reduced motion, reduced transparency and increased contrast are honoured.

---

## Deployment (Vercel + Render + MongoDB Atlas)

Hosting isn't specified in the proposal; this setup is an addition (see the checklist).

1. **Atlas** — create a free cluster and a database user, allow access from `0.0.0.0/0`, and
   copy the connection string.
2. **Render** — New → Blueprint → select this repo (`render.yaml`). Set `MONGODB_URI`, and
   `SEED_MANAGER_PASSWORD` so the public demo password isn't the real manager login.
   `JWT_SECRET` is generated for you. The empty database seeds itself on first start.
3. **Vercel** — import the repo with the repo root as the root directory; `vercel.json` builds
   `client/` and forwards `/api/*` to Render. If Render assigned a URL other than
   `https://suitespot-api.onrender.com`, update it in `vercel.json`.

The browser only ever talks to the Vercel domain, so the auth cookie is first-party everywhere
(Safari blocks cross-site cookies). Render's free tier sleeps when idle — open the site a minute
before a demo.
