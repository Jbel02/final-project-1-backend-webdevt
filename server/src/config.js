import dns from 'node:dns'
import 'dotenv/config'

// Optional, for development machines where Node can't find the system's DNS
// server (on Windows it can fall back to 127.0.0.1, or sit behind a VPN stub
// like Cloudflare WARP) and `mongodb+srv://` lookups fail with
// "querySrv ECONNREFUSED". Set DNS_SERVERS=8.8.8.8,1.1.1.1 in server/.env.
// Unset on Render, where DNS works normally.
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(',').map((server) => server.trim()))
}

const isProduction = process.env.NODE_ENV === 'production'

export const config = {
  isProduction,
  isTest: process.env.NODE_ENV === 'test',
  // Render assigns PORT in production. Locally PORT is often already taken by
  // the tool running Vite, so development uses API_PORT (default 5000), which
  // is also where client/vite.config.js proxies /api.
  port: Number(isProduction ? process.env.PORT : process.env.API_PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || '',
  // A fixed fallback is fine for local dev and tests; production refuses to
  // start without a real secret (see index.js).
  jwtSecret: process.env.JWT_SECRET || 'suitespot-dev-only-secret',
  jwtExpiresIn: '7d',
  cookieName: 'suitespot_token',
  cookieMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
}
