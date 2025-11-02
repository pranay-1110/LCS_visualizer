import ReactFlow, { Background, Controls, type Edge, type Node, Position, Handle } from 'reactflow'
import { motion } from 'framer-motion'
import 'reactflow/dist/style.css'
import { useAnimationController } from '../context/AnimationController'
import { useMemo, memo, useEffect, useRef, useState } from 'react'
import { useRegisterAnchor } from '../context/Anchors'

type NodeState = 'active' | 'done' | 'memo'

type CustomNodeData = { i: number, j: number, label: string, color: string, highlight: boolean, memoClass?: 'partial' | 'full', justCreated?: boolean, appearDelay?: number }

const CustomNode = memo(({ data }: { data: CustomNodeData }) => {
  const ref = useRegisterAnchor(`node-${data.i}-${data.j}`)
  return (
    <motion.div
      ref={ref as any}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: data.highlight ? 1.04 : 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: data.appearDelay ?? 0 }}
      className="rounded border bg-white px-2 py-1 text-sm"
      style={{
        borderColor: data.color,
        boxShadow: data.memoClass === 'full'
          ? '0 0 0 3px rgba(29,78,137,0.35)'
          : data.memoClass === 'partial'
          ? '0 0 0 3px rgba(0,178,202,0.35)'
          : data.highlight
          ? '0 0 0 3px rgba(245,158,11,0.25)'
          : 'none',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0.1 }} />
      {data.label}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0.1 }} />
    </motion.div>
  )
})

const nodeTypes = { custom: CustomNode }

export default function RecursionTree() {
  const { steps, stepIndex, x, y, seek } = useAnimationController()
  const containerRef = useRef<HTMLDivElement>(null)
  const rfRef = useRef<any>(null)
  const [autoFit, setAutoFit] = useState(false)

  const { nodes, edges, firstStep } = useMemo(() => {
    type State = { state: NodeState, value?: number }
    const map = new Map<string, State>()
    const edges: Edge[] = []
    const edgeIds = new Set<string>()
    const parents = new Map<string, string>()
    const children = new Map<string, string[]>()
    const stack: string[] = []
    let lastActive: string | null = null
    const firstStep = new Map<string, number>()
    // Track per-caller flags and finalize on call_end
    const hadMemo = new Map<string, boolean>()
    const hadTraditional = new Map<string, boolean>()
    const nodeMemoClass = new Map<string, 'partial' | 'full'>()

    const upto = steps.slice(0, stepIndex + 1)
    const lastEvt = upto[upto.length - 1]
    let justCreatedId: string | null = null
    if (lastEvt && lastEvt.type === 'call_start') {
      justCreatedId = `${lastEvt.i},${lastEvt.j}`
    }
    for (let idx = 0; idx < upto.length; idx++) {
      const e = upto[idx]
      if (!e) continue
      if (e.type === 'call_start') {
        const id = `${e.i},${e.j}`
        if (!firstStep.has(id)) firstStep.set(id, idx)
        // derive parent from explicit parent field or current call stack top
        const inferredParent = e.parent ?? stack[stack.length - 1]
        if (inferredParent) {
          parents.set(id, inferredParent)
          if (!children.has(inferredParent)) children.set(inferredParent, [])
          children.get(inferredParent)!.push(id)
          // parent attempted a real recursive call
          hadTraditional.set(inferredParent, true)
        }
        map.set(id, { state: 'active' })
        lastActive = id
        if (inferredParent) {
          const eid = `${inferredParent}->${id}`
          // Hide the structural edge for the just-created child during growth so it doesn't look pre-connected
          if (!edgeIds.has(eid) && id !== justCreatedId) {
            edgeIds.add(eid)
            edges.push({ id: eid, type: 'straight', source: inferredParent, target: id, style: { stroke: '#cbd5e1', strokeWidth: 1 } })
          }
        }
        stack.push(id)
      } else if (e.type === 'call_end') {
        const id = `${e.i},${e.j}`
        map.set(id, { state: 'done', value: e.value })
        // finalize memo classification for this caller over its full execution window
        const m = hadMemo.get(id) || false
        const t = hadTraditional.get(id) || false
        if (m && !nodeMemoClass.has(id)) nodeMemoClass.set(id, t ? 'partial' : 'full')
        // pop matching id if on stack
        if (stack[stack.length - 1] === id) stack.pop()
      } else if (e.type === 'memo_hit') {
        const id = `${e.i},${e.j}`
        // Only show/update the callee node if it previously existed via a traditional call
        if (map.has(id)) {
          map.set(id, { state: 'memo', value: e.value })
        }
        // top of stack is the caller that used memo
        const caller = stack[stack.length - 1]
        if (caller) {
          hadMemo.set(caller, true)
          lastActive = caller
        }
      }
    }

    // Tidy-tree layout (simple Reingold–Tilford style)
    const depthOf = new Map<string, number>()
    for (const id of map.keys()) {
      const [i, j] = id.split(',').map(Number)
      depthOf.set(id, i + j)
    }
    const allIds = Array.from(map.keys())
    const roots = allIds.filter(id => !parents.has(id))

    // Build a stable children array per node (deterministic order)
    const kidsOf = (id: string) => (children.get(id) || []).slice().sort()

    // Compute subtree widths
    const nodeWidth = 120 // nominal width for a node block
    const gap = 60        // min gap between siblings
    const widthMemo = new Map<string, number>()
    const measure = (id: string): number => {
      const ks = kidsOf(id)
      if (ks.length === 0) { widthMemo.set(id, nodeWidth); return nodeWidth }
      const total = ks.map(measure).reduce((a,b)=>a + b, 0) + gap * (ks.length - 1)
      widthMemo.set(id, Math.max(nodeWidth, total))
      return widthMemo.get(id)!
    }
    roots.forEach(measure)

    // Assign x positions centered by subtree width
    const posX = new Map<string, number>()
    const place = (id: string, left: number) => {
      const w = widthMemo.get(id) || nodeWidth
      const center = left + w / 2
      posX.set(id, center)
      // place children left-to-right within this block
      const ks = kidsOf(id)
      if (ks.length === 0) return
      let cursor = left
      ks.forEach((cid) => {
        const cw = widthMemo.get(cid) || nodeWidth
        place(cid, cursor)
        cursor += cw + gap
      })
    }

    // Space multiple roots side-by-side
    let cursorRoot = 0
    const rootGap = 160
    roots.sort()
    roots.forEach((rid) => {
      place(rid, cursorRoot)
      cursorRoot += (widthMemo.get(rid) || nodeWidth) + rootGap
    })

    const levelGap = 110
    const nodes: Node[] = []
    for (const id of allIds) {
      const st = map.get(id)!
      const [ii, jj] = id.split(',').map(Number)
      const prefixX = x.slice(0, ii)
      const prefixY = y.slice(0, jj)
      const py = (depthOf.get(id) || 0) * levelGap
      const px = (posX.get(id) ?? 0) - cursorRoot / 2 // roughly center the whole forest
      // If this is the just-created child, compute an appearance delay that matches the arrow growth duration
      let appearDelay = 0
      if (justCreatedId === id) {
        const p = parents.get(id)
        if (p) {
          const ppy = (depthOf.get(p) || 0) * levelGap
          const ppx = (posX.get(p) ?? 0) - cursorRoot / 2
          const dist = Math.hypot(px - ppx, py - ppy)
          // same formula used in ReturnArrows for duration
          const duration = Math.min(1.2, Math.max(0.7, dist / 400))
          appearDelay = duration + 0.05
        } else {
          appearDelay = 0.5
        }
      }
      // Use finalized memo class for this caller (set at its call_end)
      const memoClass = nodeMemoClass.get(id)
      // If a node has a memoClass, its border color should be locked to that color and not switch later
      const lockedColor = memoClass === 'full' ? '#1d4e89' : memoClass === 'partial' ? '#00b2ca' : null
      const color = lockedColor ?? (st.state === 'active' ? '#f59e0b' : st.state === 'done' ? '#10b981' : '#3b82f6')
      nodes.push({
        id,
        type: 'custom',
        position: { x: px, y: py },
        data: { i: ii, j: jj, label: `LCS(${prefixX || '∅'},${prefixY || '∅'})${st.value!=null?`=${st.value}`:''}`, color, highlight: lastActive === id, memoClass, justCreated: justCreatedId === id, appearDelay } as CustomNodeData,
      })
    }

    return { nodes, edges, firstStep }
  }, [steps, stepIndex, x, y])

  // Auto-fit: when enabled, focus on newly created node; otherwise fit on highlighted node
  useEffect(() => {
    if (!autoFit) return
    const rf = rfRef.current
    if (!rf) return
    const created = nodes.find(n => (n.data as any)?.justCreated)
    if (created) {
      try {
        rf.setCenter?.(created.position.x, created.position.y, { zoom: 0.9, duration: 300 })
        return
      } catch {}
    }
    const active = nodes.find(n => (n.data as any)?.highlight)
    if (active) {
      try {
        rf.fitView?.({ nodes: [active], padding: 0.2, duration: 300 })
      } catch {}
    }
  }, [nodes, autoFit])

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        <span className="text-xs text-gray-700 select-none">Auto-Fit</span>
        <button
          onClick={()=>setAutoFit(v=>!v)}
          role="switch"
          aria-checked={autoFit}
          className={`w-8 h-4 rounded-full border border-black flex items-center px-0.5 transition-colors ${autoFit ? 'bg-black' : 'bg-white'}`}
          title="Auto-Fit"
        >
          <span className={`inline-block w-3 h-3 rounded-full transition-transform ${autoFit ? 'translate-x-4 bg-white' : 'translate-x-0 bg-black'}`} />
          <span className="sr-only">Auto-Fit</span>
        </button>
      </div>
      <ReactFlow
        onInit={(instance)=>{ rfRef.current = instance }}
        nodes={nodes}
        edges={edges}
        fitView
        minZoom={0.2}
        maxZoom={2}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{ type: 'straight', style: { stroke: '#cbd5e1', strokeWidth: 1 } }}
        onNodeClick={(_, node) => {
          const idx = firstStep.get(node.id)
          if (idx != null) seek(idx)
        }}
      >
        <Background gap={16} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  )
}
