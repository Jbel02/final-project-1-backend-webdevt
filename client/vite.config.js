import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // The pricing and validation rules the server enforces, imported as-is.
    alias: { '@shared': fileURLToPath(new URL('../shared', import.meta.url)) },
  },
  server: {
    port: 5173,
    // Same-origin in development too: the browser talks only to Vite, Vite
    // forwards /api to Express, and the auth cookie stays first-party.
    proxy: { '/api': `http://localhost:${process.env.API_PORT || 5000}` },
    fs: { allow: ['..'] },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
