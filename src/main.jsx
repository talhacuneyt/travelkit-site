import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter
      scrollRestoration="manual"
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
        v7_fetcherPersist: true,
        v7_partialHydration: true,
        v7_normalizeFormMethod: true
      }}
    >
      <App />
    </BrowserRouter>
  </StrictMode>,
)