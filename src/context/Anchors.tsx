import { createContext, useContext, useRef, useState, useLayoutEffect } from 'react'
import type { RefObject } from 'react'

export type Anchor = { name: string, ref: RefObject<HTMLElement | null> }

type RegistryAPI = {
  register: (name: string, ref: RefObject<HTMLElement | null>) => void
  getCenter: (name: string) => { x: number, y: number } | null
}

const AnchorsContext = createContext<RegistryAPI | null>(null)

export function useAnchors() {
  const ctx = useContext(AnchorsContext)
  if (!ctx) throw new Error('useAnchors must be used within AnchorsProvider')
  return ctx
}

export function useRegisterAnchor(name: string) {
  const { register } = useAnchors()
  const ref = useRef<HTMLElement | null>(null)
  useLayoutEffect(() => { register(name, ref) }, [name])
  return ref
}

export function AnchorsProvider({ children }: { children: React.ReactNode }) {
  const map = useRef(new Map<string, RefObject<HTMLElement | null>>())
  const [, force] = useState(0)

  const api: RegistryAPI = {
    register: (name, ref) => {
      map.current.set(name, ref)
      // trigger a reflow for TeleportAnimator measurements
      force(x => x + 1)
    },
    getCenter: (name) => {
      const ref = map.current.get(name)
      const el = ref?.current
      if (!el) return null
      const rect = el.getBoundingClientRect()
      return { x: rect.left + rect.width/2, y: rect.top + rect.height/2 }
    }
  }

  return (
    <AnchorsContext.Provider value={api}>
      {children}
    </AnchorsContext.Provider>
  )
}
