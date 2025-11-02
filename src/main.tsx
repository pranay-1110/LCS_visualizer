import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AnimationControllerProvider } from './context/AnimationController'
import { AnchorsProvider } from './context/Anchors'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AnimationControllerProvider>
      <AnchorsProvider>
        <App />
      </AnchorsProvider>
    </AnimationControllerProvider>
  </StrictMode>,
)
