import { useAnimationController } from '../context/AnimationController'
import { useAnchors } from '../context/Anchors'
import { useMemo } from 'react'

export default function DependencyArrows() {
  const { steps, stepIndex } = useAnimationController()
  const anchors = useAnchors()

  // Use the most recent dp_compute up to the current step so arrows persist if you step past quickly
  const compute = useMemo(() => {
    for (let k = stepIndex; k >= 0; k--) {
      const e = steps[k]
      if (e?.type === 'dp_compute') return e
    }
    return undefined
  }, [steps, stepIndex])

  if (!compute) return null

  const targetName = `cell-${compute.i}-${compute.j}`
  const target = anchors.getCenter(targetName)
  if (!target) return null

  const deps = compute.deps ?? []
  const lines = deps.map((d) => {
    const src = anchors.getCenter(`cell-${d.i}-${d.j}`)
    if (!src) return null
    return { x1: src.x, y1: src.y, x2: target.x, y2: target.y }
  }).filter(Boolean) as Array<{x1:number,y1:number,x2:number,y2:number}>

  if (lines.length === 0) return null

  return (
    <svg className="pointer-events-none fixed inset-0" style={{ zIndex: 1200 }}>
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L6,3 z" fill="#2bff00ff" />
        </marker>
      </defs>
      {lines.map((l, idx) => (
        <line key={idx} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="#2bff00ff" strokeWidth={3} markerEnd="url(#arrow)" opacity={0.95} />
      ))}
    </svg>
  )
}
