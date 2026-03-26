import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@web/lib/i18n'
import '@web/styles/globals.css'
import { App } from '@web/App'

const root = document.getElementById('root')

if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
