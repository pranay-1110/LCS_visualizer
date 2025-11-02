import React from 'react'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useAnimationController, type AlgorithmEvent } from '../context/AnimationController'
import { useRegisterAnchor } from '../context/Anchors'

type CellState = { value: number | null }

function Cell({ i, j, value, active, activeMatch, dep, back, backMatch, memoSrc, onClick, clickable }: { i:number, j:number, value: number | string | null, active: boolean, activeMatch: boolean, dep: boolean, back: boolean, backMatch: boolean, memoSrc: boolean, onClick?: ()=>void, clickable?: boolean }) {
  const ref = useRegisterAnchor(`cell-${i}-${j}`)
  return (
    <motion.div ref={ref as any}
      key={`${i}-${j}`}
      data-cell={`${i}-${j}`}
      initial={{ scale: 0.98, opacity: 0.95 }}
      animate={{
        scale: active ? 1.03 : 1,
        backgroundColor: memoSrc ? '#dbeafe' : active ? (activeMatch ? '#dcfce7' : '#fef3c7') : backMatch ? '#86efac' : back ? '#dcfce7' : '#f8fafc',
        boxShadow: memoSrc
          ? '0 0 0 2px rgba(59,130,246,0.6)'
          : active
            ? '0 0 0 2px rgba(251,191,36,0.6)'
            : backMatch
              ? '0 0 0 2px rgba(22,163,74,0.6)'
              : back
                ? '0 0 0 2px rgba(16,185,129,0.5)'
                : 'none',
      }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className={`relative h-10 rounded border bg-white flex items-center justify-center text-sm select-none overflow-hidden ${clickable ? 'cursor-pointer' : ''}`}
      onClick={() => { if (clickable && onClick) onClick() }}
    >
      {dep && (
        <motion.div
          key={`pulse-${i}-${j}`}
          initial={{ opacity: 0.7, scale: 1.0 }}
          animate={{ opacity: [0.7, 1.0, 0.7], scale: [1.0, 1.06, 1.0] }}
          transition={{ duration: 0.9, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          className="absolute inset-0 rounded box-content border-4 border-red-600 pointer-events-none"
          style={{ boxShadow: '0 0 0 4px rgba(220,38,38,0.55), 0 0 18px rgba(220,38,38,0.45)' }}
        />
      )}
      {value}
    </motion.div>
  )
}

export default function DPGrid() {
  const { steps, stepIndex, n, m, x, y, mode, seek } = useAnimationController()

  const { grid, active, deps } = useMemo(() => {
    const grid: CellState[][] = Array.from({ length: n + 1 }, () => Array.from({ length: m + 1 }, () => ({ value: null })))
    let active: { i:number, j:number } | null = null
    let deps: Array<{ i:number, j:number }> = []
    for (let k = 0; k <= stepIndex; k++) {
      const e = steps[k] as AlgorithmEvent | undefined
      if (!e) continue
      if (e.type === 'dp_set') {
        grid[e.i][e.j].value = e.value
        // Clear deps after a value materializes so neighbour borders disappear after step 4
        deps = []
      }
      // Show value from transfers only after the transfer animation has played.
      // That is, apply transfer->cell values from prior steps, not the current step.
      if (e.type === 'transfer' && e.to.kind === 'cell') {
        if (k < stepIndex) {
          grid[e.to.i][e.to.j].value = e.value
        } else if (k === stepIndex) {
          // Current step is transfer: stop neighbour glow immediately
          deps = []
        }
      }
      if (e.type === 'dp_compute') {
        // Only mark as active for comparison when inside the letter area
        if (e.i > 0 && e.j > 0) active = { i: e.i, j: e.j }
        deps = e.deps ?? []
      }
    }
    return { grid, active, deps }
  }, [steps, stepIndex, n, m])

  const cells = useMemo(() => Array.from({ length: (n + 1) * (m + 1) }, (_, idx) => ({ i: Math.floor(idx / (m + 1)), j: idx % (m + 1) })), [n, m])
  const isActive = (i: number, j: number) => active?.i === i && active?.j === j
  const isDep = (i: number, j: number) => deps.some(d => d.i === i && d.j === j)
  const memoSrc = useMemo(() => {
    const e = steps[stepIndex]
    if (e?.type === 'memo_hit') return { i: e.i, j: e.j }
    return null
  }, [steps, stepIndex])

  const { backSeq } = useMemo(() => {
    let finished = false
    for (let k = 0; k <= stepIndex; k++) {
      const e = steps[k]
      if (e?.type === 'dp_set' && e.i === n && e.j === m) { finished = true; break }
      if (e?.type === 'call_end' && e.i === n && e.j === m) { finished = true; break }
    }
    if (!finished) return { backSeq: [] as Array<{i:number,j:number,match:boolean}> }
    const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0))
    for (let k = 0; k <= stepIndex; k++) {
      const e = steps[k]
      if (e?.type === 'dp_set') dp[e.i][e.j] = e.value
    }
    if (mode === 'memo') {
      for (let i = 0; i <= n; i++) dp[i][0] = 0
      for (let j = 0; j <= m; j++) dp[0][j] = 0
      for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
          if (x[i - 1] === y[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1
          else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
        }
      }
    }
    const seq: Array<{i:number,j:number,match:boolean}> = []
    let i = n, j = m
    while (i > 0 && j > 0) {
      if (x[i - 1] === y[j - 1]) { seq.push({ i, j, match: true }); i--; j--; }
      else if (dp[i - 1][j] >= dp[i][j - 1]) { seq.push({ i, j, match: false }); i-- }
      else { seq.push({ i, j, match: false }); j-- }
    }
    // Keep sequence from (n,m) backwards so reveal starts at the last cell
    return { backSeq: seq }
  }, [steps, stepIndex, n, m, x, y, mode])

  // Delayed, step-by-step reveal of backtrack
  const [revealCount, setRevealCount] = useState(0)
  useEffect(() => {
    setRevealCount(0)
    if (backSeq.length === 0) return
    const d = setTimeout(() => {
      let i = 0
      const interval = setInterval(() => {
        i++
        setRevealCount(i)
        if (i >= backSeq.length) clearInterval(interval)
      }, 300)
    }, 1000)
    return () => clearTimeout(d)
  }, [backSeq.length, stepIndex])

  const revealed = useMemo(() => new Set(backSeq.slice(0, revealCount).map(s => `${s.i}-${s.j}`)), [backSeq, revealCount])
  const revealedMatches = useMemo(() => new Set(backSeq.slice(0, revealCount).filter(s=>s.match).map(s => `${s.i}-${s.j}`)), [backSeq, revealCount])
  const isBack = (i: number, j: number) => revealed.has(`${i}-${j}`)
  const isBackMatch = (i: number, j: number) => revealedMatches.has(`${i}-${j}`)

  // Map each cell to the first step index where it was set (dp_set)
  const firstSetIndex = useMemo(() => {
    const map = new Map<string, number>()
    for (let k = 0; k < steps.length; k++) {
      const e = steps[k]
      if (e?.type === 'dp_set') {
        const key = `${e.i}-${e.j}`
        if (!map.has(key)) map.set(key, k)
      }
    }
    return map
  }, [steps])

  const cellSizeRem = 2.6

  // Header highlights
  const isBacktracking = backSeq.length > 0
  // Sets of rows/cols that belong to matched backtracking cells (full path)
  const matchRows = useMemo(() => {
    const s = new Set<number>()
    backSeq.filter(b=>b.match).forEach(b=>s.add(b.i))
    return s
  }, [backSeq])
  const matchCols = useMemo(() => {
    const s = new Set<number>()
    backSeq.filter(b=>b.match).forEach(b=>s.add(b.j))
    return s
  }, [backSeq])
  const backFinished = isBacktracking && revealCount >= backSeq.length

  const rowHighlight = (ri: number) => cells.some(({ i, j }) => i === ri && j > 0 && isActive(i,j))
  const colHighlight = (cj: number) => cells.some(({ i, j }) => j === cj && i > 0 && isActive(i,j))

  const headerBgForRow = (ri: number) => {
    if (backFinished && matchRows.has(ri)) return '#dcfce7' // green for final matches
    return rowHighlight(ri) ? '#fef3c7' : 'rgba(0,0,0,0)'
  }
  const headerBgForCol = (cj: number) => {
    if (backFinished && matchCols.has(cj)) return '#dcfce7'
    return colHighlight(cj) ? '#fef3c7' : 'rgba(0,0,0,0)'
  }

  // Active comparison indices for highlighting characters in DP mode
  // We display X on the top row and Y on the bottom row in Comparing Characters.
  // So the highlighted indices must map to X[i-1] (top) and Y[j-1] (bottom).
  const hiX = active && active.i > 0 && active.j > 0 ? active.i - 1 : -1
  const hiY = active && active.i > 0 && active.j > 0 ? active.j - 1 : -1
  const isMatchNow = hiX >= 0 && hiY >= 0 && x[hiX] === y[hiY]

  return (
    <div className="p-4 w-full h-full overflow-auto">
      {/* Character highlight rows (DP mode) */}
      {mode === 'dp' && (
        <div className="mb-3">
          <div className="text-xs font-medium text-gray-600 mb-1">Comparing characters</div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500 w-10 text-right">X:</div>
              <div className="flex items-center gap-1">
                {x.split('').map((ch, idx) => (
                  <div key={`x-${idx}`} className={`px-1.5 py-0.5 rounded text-base ${idx === hiX ? (isMatchNow ? 'bg-emerald-200 text-emerald-900 font-semibold' : 'bg-amber-200 text-amber-900 font-semibold') : 'text-gray-700'}`}>{ch}</div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500 w-10 text-right">Y:</div>
              <div className="flex items-center gap-1">
                {y.split('').map((ch, idx) => (
                  <div key={`y-${idx}`} className={`px-1.5 py-0.5 rounded text-base ${idx === hiY ? (isMatchNow ? 'bg-emerald-200 text-emerald-900 font-semibold' : 'bg-amber-200 text-amber-900 font-semibold') : 'text-gray-700'}`}>{ch}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: `repeat(${m + 2}, minmax(${cellSizeRem}rem, ${cellSizeRem}rem))`, gap: '6px', alignItems: 'center' }}>
        {/* top-left corner */}
        <div />
        {/* column headers */}
        {Array.from({ length: m + 1 }, (_, j) => (
          <div key={`col-header-${j}`} className="h-10 flex items-center justify-center text-xs text-gray-700">
            <motion.div animate={{ backgroundColor: headerBgForCol(j) }} className="px-2 py-0.5 rounded flex flex-col items-center leading-none">
              <div className="text-sm">{j === 0 ? '' : (mode === 'memo' ? y[j - 1] : y[j - 1])}</div>
              <div className="text-[10px] text-gray-500">{mode === 'memo' ? (j - 1) : (j === 0 ? '' : j)}</div>
            </motion.div>
          </div>
        ))}
        {/* rows with row header + cells */}
        {Array.from({ length: n + 1 }, (_, i) => (
          <React.Fragment key={`row-${i}`}>
            <div className="h-10 flex items-center justify-center text-xs text-gray-700">
              <motion.div animate={{ backgroundColor: headerBgForRow(i) }} className="px-2 py-0.5 rounded flex flex-col items-center leading-none">
                <div className="text-sm">{i === 0 ? '' : (mode === 'memo' ? x[i - 1] : x[i - 1])}</div>
                <div className="text-[10px] text-gray-500">{mode === 'memo' ? (i - 1) : (i === 0 ? '' : i)}</div>
              </motion.div>
            </div>
            {Array.from({ length: m + 1 }, (_, j) => (
              <Cell
                key={`${i}-${j}`}
                i={i}
                j={j}
                value={grid[i]?.[j]?.value ?? (mode === 'dp' && (i === 0 || j === 0) ? 0 : '')}
                active={isActive(i, j)}
                activeMatch={isActive(i, j) && i > 0 && j > 0 && x[i-1] === y[j-1]}
                dep={isDep(i, j)}
                back={isBack(i, j)}
                backMatch={isBackMatch(i, j)}
                memoSrc={memoSrc?.i === i && memoSrc?.j === j}
                clickable={firstSetIndex.has(`${i}-${j}`)}
                onClick={() => {
                  const idx = firstSetIndex.get(`${i}-${j}`)
                  if (idx != null) seek(Math.max(0, idx - 4))
                }}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
