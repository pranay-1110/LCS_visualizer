import { useAnimationController } from '../context/AnimationController'
import { useMemo } from 'react'

const lines = [
  'function LCS(X, Y, i, j):',
  '    if memo[i][j] != -1: return memo[i][j]', // memo-first
  '    if i == 0 or j == 0: return 0',
  '    if X[i-1] == Y[j-1]:',
  '        memo[i][j] = 1 + LCS(X, Y, i-1, j-1)',
  '    else:',
  '        memo[i][j] = max(LCS(X, Y, i-1, j), LCS(X, Y, i, j-1))',
  '    return memo[i][j]'
]

export default function CodePanel() {
  const { steps, stepIndex, x, y } = useAnimationController()

  // Most recent call context for compare-highlighting
  const ctx = useMemo(() => {
    for (let k = stepIndex; k >= 0; k--) {
      const e = steps[k]
      if (e?.type === 'call_start') return { type: 'call_start' as const, i: e.i, j: e.j }
      if (e?.type === 'memo_hit') return { type: 'memo_hit' as const, i: e.i, j: e.j }
    }
    return { type: 'none' as const, i: 0, j: 0 }
  }, [steps, stepIndex])

  // Most recent explicit code line emitted by the engine
  const lastCode = useMemo(() => {
    for (let k = stepIndex; k >= 0; k--) {
      const e = steps[k]
      if (e?.type === 'code') return e.codeLine as number
    }
    return -1
  }, [steps, stepIndex])

  const isNodeCreateStep = useMemo(() => steps[stepIndex]?.type === 'call_start', [steps, stepIndex])
  // Determine the decision context (i,j) to highlight the if/else line.
  // Prefer explicit code events; otherwise, use the PARENT of a call_start, else fallback to current ctx.
  const decision = useMemo(() => {
    // If there was an explicit code event, don't override; we'll use lastCode.
    // But still compute parent for call_start to infer branch when no code event emitted this step.
    if (isNodeCreateStep) {
      const e = steps[stepIndex] as any
      const parentStr: string | undefined = e?.parent
      if (parentStr) {
        const [pi, pj] = parentStr.split(',').map((s: string) => Number(s))
        return { i: pi, j: pj }
      }
    }
    return { i: ctx.i, j: ctx.j }
  }, [isNodeCreateStep, steps, stepIndex, ctx.i, ctx.j])
  const isMatch = decision.i > 0 && decision.j > 0 && x[decision.i - 1] === y[decision.j - 1]
  // Choose which line to highlight as primary when no explicit code line is available this step
  const inferredPrimary = useMemo(() => {
    if (isMatch) return 3 // 'if X[i-1] == Y[j-1]:'
    if (ctx.type !== 'none') return 5 // 'else:' when comparing different characters
    return -1
  }, [isMatch, ctx.type])

  const primary = (lastCode !== -1 ? lastCode : inferredPrimary)
  // If a node is created on this step, emphasize the corresponding recursive call line
  const spawnLine = isNodeCreateStep ? (isMatch ? 4 : 6) : -1

  // For spawned child, compute which call text to highlight inside the line
  const spawnChild = useMemo(() => {
    const e = steps[stepIndex] as any
    if (!e || e.type !== 'call_start') return null
    const ci = e.i as number, cj = e.j as number
    // Try to recover parent from event or fallback to last context
    const parentStr: string | undefined = e.parent
    const pi = parentStr ? Number(parentStr.split(',')[0]) : ctx.i
    const pj = parentStr ? Number(parentStr.split(',')[1]) : ctx.j
    if (pi - 1 === ci && pj - 1 === cj) return { kind: 'match' as const }
    if (pi - 1 === ci && pj === cj) return { kind: 'else_left' as const }
    if (pi === ci && pj - 1 === cj) return { kind: 'else_right' as const }
    return null
  }, [steps, stepIndex, ctx.i, ctx.j])

  return (
    <div className="h-full overflow-auto p-3 font-mono text-sm bg-white border-r">
      {lines.map((l, idx) => (
        <div key={idx} className={
          'px-2 py-1 rounded ' + (
            idx === primary
              ? (primary === 3
                  ? (isMatch ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900')
                  : 'bg-amber-100 text-amber-900')
              : idx === spawnLine
                ? 'bg-sky-100 text-sky-900 font-semibold'
                : ''
          )
        }>
          <span className="text-gray-400 select-none mr-2">{idx+1}</span>
          {(() => {
            // Inject inner-span highlight for spawned recursive call
            if (idx === 4 && spawnChild?.kind === 'match') {
              const before = '        memo[i][j] = 1 + '
              const call = 'LCS(X, Y, i-1, j-1)'
              return <>
                {before}<span className="px-1 rounded bg-sky-300/50 text-sky-900 font-bold">{call}</span>
              </>
            }
            if (idx === 6 && (spawnChild?.kind === 'else_left' || spawnChild?.kind === 'else_right')) {
              const before = '        memo[i][j] = max('
              const left = 'LCS(X, Y, i-1, j)'
              const mid = ', '
              const right = 'LCS(X, Y, i, j-1)'
              return <>
                {before}
                {spawnChild.kind === 'else_left'
                  ? <><span className="px-1 rounded bg-sky-300/50 text-sky-900 font-bold">{left}</span>{mid}{right})</>
                  : <>{left}{mid}<span className="px-1 rounded bg-sky-300/50 text-sky-900 font-bold">{right}</span>)</>
                }
              </>
            }
            return l
          })()}
        </div>
      ))}
    </div>
  )
}
