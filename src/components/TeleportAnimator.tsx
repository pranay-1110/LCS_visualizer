import { motion, AnimatePresence } from 'framer-motion'
import { useAnimationController } from '../context/AnimationController'
import { useAnchors } from '../context/Anchors'
import { useMemo, useEffect, useState, useRef } from 'react'

export default function TeleportAnimator() {
  const { steps, stepIndex, speed } = useAnimationController()
  const anchors = useAnchors()

  const transfer = useMemo(() => {
    const e = steps[stepIndex]
    if (e?.type === 'transfer') return e
    return undefined
  }, [steps, stepIndex])

  // Persist the last transfer overlay long enough to finish the animation
  const [sticky, setSticky] = useState<{ idx: number; speedAt: number } | null>(null)
  // Remember the last fully rendered transfer key to avoid duplicate animations
  const lastKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (transfer) {
      setSticky({ idx: stepIndex, speedAt: speed })
    } else {
      // clear sticky when we move far beyond and no overlay is needed
      // leave cleanup to timeout below
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, !!transfer])

  // Pre-schedule sticky cleanup based on last known speed, before any early returns
  useEffect(() => {
    if (transfer) return
    if (!sticky) return
    const speedFactor = Math.max(0.25, Math.min(4, sticky.speedAt))
    const stepInterval = 600 / speedFactor
    const baseDur = 1.25 / speedFactor
    const duration = Math.max(0.18, Math.min(baseDur, (stepInterval * 0.65) / 1000))
    const t = setTimeout(() => setSticky(null), (duration * 1000) + 80)
    return () => clearTimeout(t)
    // safe to ignore sticky.speedAt changes during the same sticky window
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transfer, !!sticky])

  const activeIdx = transfer ? stepIndex : sticky?.idx
  const e = activeIdx != null ? steps[activeIdx] : undefined

  // Build names and a stable key even when not renderable
  const fromName = e?.type === 'transfer' ? `${e.from.kind}-${e.from.i}-${e.from.j}` : ''
  const toName = e?.type === 'transfer' ? `${e.to.kind}-${e.to.i}-${e.to.j}` : ''
  const chip = e?.type === 'transfer' ? `${e.value}` : ''
  const key = e?.type === 'transfer' ? `${fromName}->${toName}-${chip}-${activeIdx}` : `no-transfer-${activeIdx ?? -1}`

  // Determine if this would be a duplicate animation for the exact same transfer
  const isDuplicate = !!transfer && e?.type === 'transfer' && lastKeyRef.current === key

  // Update lastKeyRef whenever a new transfer key appears
  useEffect(() => {
    if (!!transfer && e?.type === 'transfer') {
      lastKeyRef.current = key
    }
  }, [key, !!transfer, e?.type])

  // Now resolve anchor positions and perform early returns (after all hooks above)
  if (activeIdx == null) return null
  if (e?.type !== 'transfer') return null
  const from = anchors.getCenter(fromName)
  const to = anchors.getCenter(toName)
  if (!from || !to) return null
  if (isDuplicate) return null

  // Compute duration scaled by playback speed (faster playback => shorter anim)
  const speedForDur = transfer ? speed : (sticky?.speedAt ?? speed)
  const speedFactor = Math.max(0.25, Math.min(4, speedForDur))
  const stepInterval = 600 / speedFactor // keep in sync with AnimationController
  const baseDur = 1.25 / speedFactor
  const duration = Math.max(0.18, Math.min(baseDur, (stepInterval * 0.65) / 1000))

  // SVG overlay bounds cover the viewport; line animates from source to target
  return (
    <AnimatePresence>
      <>
        <motion.svg
          key={`${key}-svg`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 35 }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#64748b" />
            </marker>
          </defs>
          <motion.line
            x1={from.x}
            y1={from.y}
            initial={{ x2: from.x, y2: from.y }}
            animate={{ x2: to.x, y2: to.y }}
            transition={{ duration, ease: 'easeInOut' }}
            stroke="#94a3b8"
            strokeWidth={2}
            markerEnd="url(#arrowhead)"
          />
        </motion.svg>
        <motion.div
          key={key}
          initial={{ x: from.x, y: from.y, opacity: 0, scale: 0.9, position: 'fixed' as const }}
          animate={{
            x: [from.x, from.x, to.x],
            y: [from.y, from.y, to.y],
            opacity: [0, 1, 1],
            scale: [0.9, 1, 1],
          }}
          exit={{ opacity: 0 }}
          transition={{ duration, times: [0, 0.18, 1], ease: 'easeInOut' }}
          style={{ pointerEvents: 'none', zIndex: 40 }}
          className="-translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-full bg-white shadow-lg border text-xs font-semibold text-gray-800"
        >
          {chip}
        </motion.div>
        {e.to.kind === 'cell' && (
          <motion.div
            key={`${key}-pulse`}
            initial={{ opacity: 0, scale: 0.55, x: to.x, y: to.y, position: 'fixed' as const }}
            animate={{ opacity: [0, 0.95, 0], scale: [0.55, 1.25, 1] }}
            transition={{ duration: Math.max(0.28, duration * 0.7), ease: 'easeOut', delay: Math.max(0, duration * 0.8) }}
            style={{ pointerEvents: 'none', zIndex: 35, boxShadow: '0 0 0 6px rgba(16,185,129,0.35), 0 0 18px rgba(16,185,129,0.45)' }}
            className="-translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 border-emerald-500 bg-emerald-50/40"
          />
        )}
        {e.to.kind === 'node' && (
          <motion.div
            key={`${key}-pulse-node`}
            initial={{ opacity: 0, scale: 0.6, x: to.x, y: to.y, position: 'fixed' as const }}
            animate={{ opacity: [0, 0.8, 0], scale: [0.6, 1.15, 1] }}
            transition={{ duration: Math.max(0.25, duration * 0.6), ease: 'easeOut', delay: Math.max(0, duration * 0.85) }}
            style={{ pointerEvents: 'none', zIndex: 35 }}
            className="-translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-sky-500"
          />
        )}
      </>
    </AnimatePresence>
  )
}
