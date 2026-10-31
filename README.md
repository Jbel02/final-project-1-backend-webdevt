# SuiteSpot — Backend (Hotel Reservation & Booking API)

Final project, **Group 1 · C3A** — Cortez, Cedric · Elpedes, Dustin · Maliñana, Johnbel

The REST API for SuiteSpot, an 80-room hotel reservation system (8 floors × 10 rooms; Single,
Double, King and Suite). Guests search and book rooms, the front desk checks guests in and out,
and the manager runs rooms, bookings and accounts.

| | |
| --- | --- |
| **Frontend repository** | https://github.com/Jbel02/final-project-1-frontend-webdevt |
| **Frontend (live)** | `https://finals-project-webdevt.vercel.app` |
| **Backend (live)** | https://suitespot-api.onrender.com — [`/api/health`](https://suitespot-api.onrender.com/api/health) |
| **Database** | MongoDB Atlas |

> The live API sleeps when idle (Render's free tier). The first request after a pause can take up
> to a minute.

**Stack:** Node.js 20+, Express 5, Mongoose 8, JWT in an httpOnly cookie, bcryptjs, helmet,
express-rate-limit. Tests use Vitest + Supertest on an in-memory MongoDB replica set.

> **Proposal tracking:** every item of `final-project-proposal-G1.pdf`, every gap we found and every
> addition is listed in the frontend repository's `docs/CHECKLIST.md`.

---

## Quick start

```bash
npm run install:all
npm run dev
```

The API listens on http://localhost:5000 (open `/` or `/api/health` to check).

No database setup is needed for development: without `MONGODB_URI` the API starts an
**in-memory MongoDB** and seeds it (the first run downloads a ~600 MB MongoDB binary once). The
data resets whenever the API restarts.

To use a real database, copy `server/.env.example` to `server/.env` and set `MONGODB_URI` to your
Atlas connection string. Run `npm run seed` once to load demo data (it asks before wiping anything).

To use the app itself, run the frontend repository next to this one — its dev server forwards
`/api` to this API on port 5000.

### Environment variables (`server/.env`)

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Atlas connection string. Leave empty in development for the in-memory database. |
| `JWT_SECRET` | Long random string that signs login tokens. Required in production. |
| `API_PORT` | Local port (default 5000). Render sets `PORT` itself. |
| `NODE_ENV` | `development` or `production`. |
| `SEED_MANAGER_PASSWORD` | Optional: the Manager password used when an empty database is first seeded. |
| `DNS_SERVERS` | Optional: e.g. `8.8.8.8,1.1.1.1` if `mongodb+srv` lookups fail on your network. |

`.env` is git-ignored. Never commit real values.

### Demo accounts (seeded test data)

| Role | Email | Password |
| --- | --- | --- |
| Manager | manager@suitespot.test | Manager123 |
| Receptionist | frontdesk@suitespot.test | Desk12345 |
| Guest | guest@suitespot.test | Guest1234 |
| Guest | maria@suitespot.test, ana@…, carlo@… | Guest1234 |

If the live Manager password stops matching this table, `npm run reset-manager-password` restores
it without touching any other data.

### Scripts (run from the repo root)

| Script | What it does |
| --- | --- |
| `npm run dev` | API with auto-restart on port 5000 |
| `npm start` | API, no auto-restart (what Render runs) |
| `npm test` | Server tests, including a 76-case role-permission matrix |
| `npm run seed` | Reset the database in `MONGODB_URI` to demo data |
| `npm run reset-manager-password` | Set the demo Manager's password (default `Manager123`) in `MONGODB_URI`, without wiping data |

---

## API endpoints

The 19 endpoints from the approved proposal, all built and tested:

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| POST | /api/auth/logout | Authenticated |
| GET | /api/auth/me | Authenticated |
| GET | /api/rooms | Public |
| GET | /api/rooms/:id | Public |
| POST | /api/rooms | Manager |
| PUT | /api/rooms/:id | Manager |
| DELETE | /api/rooms/:id | Manager |
| POST | /api/bookings | Guest |
| GET | /api/bookings/mine | Guest |
| GET | /api/bookings | Receptionist, Manager |
| PATCH | /api/bookings/:id/checkin | Receptionist, Manager |
| PATCH | /api/bookings/:id/checkout | Receptionist, Manager |
| PATCH | /api/bookings/:id/cancel | Guest (own), Manager (any) |
| GET | /api/users | Manager |
| POST | /api/users/receptionist | Manager |
| PATCH | /api/users/:id/deactivate | Manager |
| DELETE | /api/users/:id | Manager |

Additions beyond the proposal: `PATCH /api/users/me` (any signed-in user edits their profile),
`GET /api/bookings/:id` (owner or staff, for the receipt), `GET /api/users/:id` (manager),
`PATCH /api/users/:id/activate` (manager, undoes a deactivation), `GET /api/health` and `GET /`
(status).

## How it works

**Authentication.** Login sets a JWT in an **httpOnly cookie** — page scripts never see the token.
Every request re-reads the account, so deactivating someone signs them out immediately. Passwords
are hashed with bcrypt. Self-registration always creates a guest; receptionists are created by the
manager.

**Authorization.** `requireRole('manager')` and friends guard every route. The role-matrix test
checks all 19 proposal endpoints against all four kinds of caller (public, guest, receptionist,
manager).

**Validation.** `shared/validation.js` holds every form's validator. The frontend runs it as you
type; the server runs **the same function** again and returns per-field messages.

**Availability.** A room is free for a stay when no active booking for it overlaps the dates
(check-out day is free for the next guest). Creating a booking runs inside a MongoDB transaction
that also writes the room document, so two guests booking the same room at the same moment can't
both succeed — a test fires both requests at once.

**Money.** The server prices every stay with `quoteBooking()` and never trusts amounts sent by the
browser. Partial payment is 30% now, with the balance settled at check-out. Each booking stores a
snapshot of the room and guest, so receipts stay correct after a price change or a deletion.

**Dates.** Stays are calendar dates stored as UTC midnight, and "today" is the hotel's day in
Asia/Manila.

## Project map

```
shared/                 rules used by BOTH repositories (no dependencies)
  constants.js            room types, prices, meal rates, statuses
  dates.js                date-only helpers, hotel time zone, overlap rule
  pricing.js              quoteBooking() — the one place a bill is computed
  validation.js           every form's validator

server/
  src/models/             User, Room, Booking
  src/middleware/         auth (JWT cookie, requireRole), errors
  src/routes/             auth.js · rooms.js · bookings.js · users.js
  src/services/           availability.js (date-overlap availability)
  src/seed/               80 rooms, demo accounts, demo bookings
  src/scripts/            seed.js, resetManagerPassword.js
  test/                   Supertest + in-memory replica set
```

> `shared/` is mirrored in the frontend repository, because both sides run the same rules. If you
> change a file there, change it in both repositories.

## Deployment (Render + MongoDB Atlas)

Hosting isn't specified in the proposal; this setup is an addition.

1. **Atlas** — create a free cluster and a database user with read/write on one database, allow
   access from `0.0.0.0/0`, and copy the connection string (with the database name in it, e.g.
   `.../suitespot?retryWrites=true&w=majority`).
2. **Render** — New → Blueprint → select this repo (`render.yaml`). Set `MONGODB_URI`.
   `JWT_SECRET` is generated for you. The empty database seeds itself on first start.
3. **Frontend** — the Vercel project forwards `/api/*` to this service, so the browser only talks
   to the Vercel domain and the auth cookie stays first-party.

To set the Manager password on an already-seeded database, run this from your computer with the
production connection string (PowerShell shown) and answer `y`:

```powershell
$env:MONGODB_URI = "<your Atlas connection string>"
npm run reset-manager-password
```

## Team

| Member | Owns |
| --- | --- |
| Maliñana, Johnbel | Manager screens (rooms, users), server and database setup, Atlas, Render and Vercel deployment |
| Cortez, Cedric | Guest flow (browse, book, my bookings), shared UI components, screenshots |
| Elpedes, Dustin | Front desk (bookings, check-in/out), server tests, receipt printing |

Work is done on branches and merged through reviewed pull requests.
