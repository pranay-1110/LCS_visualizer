import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type Mode = 'dp' | 'memo'

export type InitEvent = { type: 'init', id: string, x: string, y: string }
export type CodeEvent = { type: 'code', id: string, codeLine: number }
export type DPComputeEvent = { type: 'dp_compute', id: string, i: number, j: number, deps?: Array<{ i: number; j: number }> }
export type DPSetEvent = { type: 'dp_set', id: string, i: number, j: number, value: number }
export type CallStartEvent = { type: 'call_start', id: string, i: number, j: number, parent?: string }
export type CallEndEvent = { type: 'call_end', id: string, i: number, j: number, value: number }
export type MemoHitEvent = { type: 'memo_hit', id: string, i: number, j: number, value: number }
export type TransferEvent = { type: 'transfer', id: string, from: { kind: 'node' | 'cell', i: number, j: number }, to: { kind: 'node' | 'cell', i: number, j: number }, value: number }

export type AlgorithmEvent = InitEvent | CodeEvent | DPComputeEvent | DPSetEvent | CallStartEvent | CallEndEvent | MemoHitEvent | TransferEvent

export type ControllerAPI = {
  mode: Mode
  setMode: (m: Mode) => void
  playing: boolean
  speed: number
  stepIndex: number
  steps: AlgorithmEvent[]
  current?: AlgorithmEvent
  x: string
  y: string
  n: number
  m: number
  play: () => void
  pause: () => void
  reset: () => void
  step: (dir?: 1 | -1) => void
  skipToNextFill: () => void
  setSpeed: (s: number) => void
  loadSteps: (steps: AlgorithmEvent[]) => void
  seek: (index: number) => void
}

const AnimationControllerContext = createContext<ControllerAPI | null>(null)

export function useAnimationController() {
  const ctx = useContext(AnimationControllerContext)
  if (!ctx) throw new Error('useAnimationController must be used within AnimationControllerProvider')
  return ctx
}

export function AnimationControllerProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('dp')
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [steps, setSteps] = useState<AlgorithmEvent[]>([])
  const [stepIndex, setStepIndex] = useState(0)

  const current = steps[stepIndex]

  // derive x,y and sizes from first init event
  const init = useMemo(() => steps.find(s => s.type === 'init') as InitEvent | undefined, [steps])
  const x = init?.x ?? 'ABC'
  const y = init?.y ?? 'BDC'
  const n = x.length
  const m = y.length

  const play = useCallback(() => {
    if (playing || steps.length === 0) return
    setPlaying(true)
  }, [playing, steps.length])

  const pause = useCallback(() => {
    setPlaying(false)
  }, [])

  const reset = useCallback(() => {
    pause()
    setStepIndex(0)
  }, [pause])

  const step = useCallback((dir: 1 | -1 = 1) => {
    pause()
    setStepIndex((idx) => Math.max(0, Math.min(steps.length - 1, idx + dir)))
  }, [pause, steps.length])

  const skipToNextFill = useCallback(() => {
    pause()
    setStepIndex((idx) => {
      for (let k = idx + 1; k < steps.length; k++) {
        const e = steps[k]
        if (e?.type === 'dp_set') return k
        if (e?.type === 'transfer' && e.to.kind === 'cell') return k
      }
      return idx
    })
  }, [pause, steps])

  const seek = useCallback((index: number) => {
    const wasPlaying = playing
    pause()
    setStepIndex(() => Math.max(0, Math.min(steps.length - 1, Math.floor(index))))
    if (wasPlaying) setPlaying(true)
  }, [pause, steps.length, playing])

  const loadSteps = useCallback((s: AlgorithmEvent[]) => {
    pause()
    setSteps(s)
    setStepIndex(0)
  }, [pause])

  useEffect(() => {
    if (!playing) return
    let raf: number
    let last = performance.now()
    const loop = (t: number) => {
      const delta = t - last
      const interval = 600 / Math.max(0.25, Math.min(4, speed))
      if (delta >= interval) {
        setStepIndex((idx) => {
          const next = Math.min(steps.length - 1, idx + 1)
          if (next === steps.length - 1) setPlaying(false)
          return next
        })
        last = t
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, steps.length])

  const value: ControllerAPI = useMemo(() => ({
    mode, setMode,
    playing, speed, stepIndex, steps, current,
    x, y, n, m,
    play, pause, reset, step, skipToNextFill, setSpeed, loadSteps, seek,
  }), [mode, playing, speed, stepIndex, steps, current, x, y, n, m, play, pause, reset, step, skipToNextFill, seek])

  return (
    <AnimationControllerContext.Provider value={value}>
      {children}
    </AnimationControllerContext.Provider>
  )
}
