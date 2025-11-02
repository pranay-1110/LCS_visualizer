import { useEffect, useRef, useState } from 'react'
import { useAnimationController } from '../context/AnimationController'
import { useAnchors } from '../context/Anchors'
import { motion } from 'framer-motion'

type ArrowInfo = { x1:number,y1:number,x2:number,y2:number,dir:'forward'|'back' }

export default function ReturnArrows() {
  const { steps, stepIndex, speed } = useAnimationController()
  const anchors = useAnchors()

  type Dir = 'forward' | 'back'
  // Compute info every render so it responds when anchors register
  let info: (ArrowInfo & { dir: Dir }) | undefined
  if (stepIndex >= 0 && stepIndex < steps.length) {
    const parents = new Map<string, string>()
    const stack: string[] = []
    let snapshotStack: string[] = []
    for (let k = 0; k <= stepIndex; k++) {
      const e = steps[k]
      if (!e) continue
      if (k === stepIndex) {
        // snapshot before applying this event so we know the caller at this moment
        snapshotStack = stack.slice()
      }
      if (e.type === 'call_start') {
        const id = `${e.i},${e.j}`
        const parent = e.parent ?? stack[stack.length - 1]
        if (parent) parents.set(id, parent)
        stack.push(id)
      } else if (e.type === 'call_end') {
        const id = `${e.i},${e.j}`
        if (stack[stack.length - 1] === id) stack.pop()
      }
    }
    const e = steps[stepIndex]
    if (e && (e.type === 'call_start' || e.type === 'call_end')) {
      let fromId: string | undefined
      let toId: string | undefined
      let dir: Dir = 'forward'
      if (e.type === 'call_start') {
        const child = `${e.i},${e.j}`
        const parent = parents.get(child) ?? e.parent ?? snapshotStack[snapshotStack.length - 1]
        if (parent) { fromId = parent; toId = child; dir = 'forward' }
      } else {
        const child = `${e.i},${e.j}`
        const callerIdx = snapshotStack.length >= 2 ? snapshotStack.length - 2 : snapshotStack.length - 1
        const inferredCaller = callerIdx >= 0 ? snapshotStack[callerIdx] : undefined
        const parent = parents.get(child) ?? inferredCaller
        if (parent) { fromId = child; toId = parent; dir = 'back' }
      }
      if (fromId && toId) {
        const [fi, fj] = fromId.split(',').map(Number)
        const [ti, tj] = toId.split(',').map(Number)
        const from = anchors.getCenter(`node-${fi}-${fj}`)
        const to = anchors.getCenter(`node-${ti}-${tj}`)
        if (from && to) {
          const dx = to.x - from.x
          const dy = to.y - from.y
          const len = Math.hypot(dx, dy) || 1
          const trim = Math.max(0, Math.min(44, Math.max(2, len / 2 - 2)))
          const ox = (dx / len) * trim
          const oy = (dy / len) * trim
          const x1 = from.x + ox
          const y1 = from.y + oy
          const x2 = to.x - ox
          const y2 = to.y - oy
          info = { x1, y1, x2, y2, dir }
        }
      }
    }
  }

  // Lock an animation instance so it isn't cut off by step changes
  const [anim, setAnim] = useState<{
    id: number,
    arrow: ArrowInfo,
    isReturn: boolean,
    duration: number,
  } | null>(null)
  const timeoutRef = useRef<number | null>(null)

  const lastKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (!info) return
    const key = `${info.dir}:${Math.round(info.x1)}:${Math.round(info.y1)}:${Math.round(info.x2)}:${Math.round(info.y2)}`
    if (lastKeyRef.current === key) return
    lastKeyRef.current = key
    const dist = Math.hypot(info.x2 - info.x1, info.y2 - info.y1)
    const speedFactor = Math.max(0.25, Math.min(4, speed))
    const base = Math.max(0.8, dist / 300)
    const stepInterval = 600 / speedFactor
    const duration = Math.max(0.25, Math.min(base / speedFactor, (stepInterval * 0.65) / 1000))
    const id = performance.now() | 0
    setAnim({ id, arrow: info, isReturn: info.dir === 'back', duration })
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setAnim(a => (a && a.id === id ? null : a)), (duration * 1000) + 80)
    return () => { if (timeoutRef.current) window.clearTimeout(timeoutRef.current) }
  }, [info])

  const render = anim?.arrow
  if (!render) return null
  const isReturn = anim.isReturn
  const color = isReturn ? '#10b981' : '#64748b'
  const d = `M ${render.x1} ${render.y1} L ${render.x2} ${render.y2}`
  const duration = anim.duration

  return (
    <svg className="pointer-events-none fixed inset-0" style={{ zIndex: 2000 }}>
      <defs>
        <marker id="rf-arrow-grey" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,8 L8,4 z" fill="#64748b" />
        </marker>
        <marker id="rf-arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,8 L8,4 z" fill="#10b981" />
        </marker>
      </defs>
      <motion.path
        key={`arr-${anim.id}`}
        d={d}
        stroke={color}
        strokeWidth={isReturn ? 4 : 3}
        strokeLinecap="round"
        fill="none"
        pathLength={1}
        style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
        initial={{ strokeDashoffset: 1, opacity: 0.9 }}
        animate={{ strokeDashoffset: 0, opacity: 1 }}
        transition={{ duration, ease: 'linear' }}
        markerEnd={`url(#${render.dir === 'back' ? 'rf-arrow-green' : 'rf-arrow-grey'})`}
      />
      {/* Moving dot along the arrow */}
      <motion.circle
        key={`dot-${anim.id}`}
        r={isReturn ? 6 : 5}
        fill={color}
        stroke={isReturn ? 'rgba(16,185,129,0.35)' : 'rgba(100,116,139,0.25)'}
        strokeWidth={isReturn ? 6 : 4}
        initial={{ cx: render.x1, cy: render.y1, opacity: 0.0 }}
        animate={{ cx: render.x2, cy: render.y2, opacity: 1 }}
        transition={{ duration, ease: 'linear' }}
      />
      {/* Destination pulse when arrow completes */}
      <motion.circle
        key={`pulse-${anim.id}`}
        cx={render.x2}
        cy={render.y2}
        r={6}
        stroke={color}
        strokeWidth={2}
        fill="transparent"
        initial={{ scale: 0.6, opacity: 0.0 }}
        animate={{ scale: [0.6, 1.2, 1], opacity: [0, 0.8, 0] }}
        transition={{ duration: Math.max(0.35, duration * 0.8), ease: 'easeOut', delay: Math.max(0.05, duration * 0.8) }}
      />
    </svg>
  )
}
