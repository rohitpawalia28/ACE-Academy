import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true)
  },
})

const shouldReloadForChunkError = (message) => {
  if (!message) return false
  const text = String(message).toLowerCase()
  return text.includes('failed to fetch dynamically imported module')
    || text.includes('importing a module script failed')
    || text.includes('chunkloaderror')
}

window.addEventListener('error', (event) => {
  if (shouldReloadForChunkError(event?.message)) window.location.reload()
})

window.addEventListener('unhandledrejection', (event) => {
  const reasonMessage = event?.reason?.message || event?.reason
  if (shouldReloadForChunkError(reasonMessage)) window.location.reload()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
