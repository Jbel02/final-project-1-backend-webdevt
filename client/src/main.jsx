import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import './index.css'
import App from './App.jsx'

// BrowserRouter (real paths, not #hashes) — /rooms/:id and /bookings/:id are
// meant to be shareable, bookmarkable URLs. Deploys need the host to serve
// index.html for unknown paths; vercel.json does exactly that.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
