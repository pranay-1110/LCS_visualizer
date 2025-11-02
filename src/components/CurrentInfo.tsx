import { useAnimationController } from '../context/AnimationController'
import { useMemo } from 'react'

export default function CurrentInfo() {
  const { steps, stepIndex, n, m } = useAnimationController()

  const { lcs, finished } = useMemo(() => {
    let lcs: number | null = null
    for (let k = 0; k <= stepIndex; k++) {
      const e = steps[k]
      if (e?.type === 'dp_set' && e.i === n && e.j === m) lcs = e.value
      if (e?.type === 'call_end' && e.i === n && e.j === m) lcs = e.value
    }
    const finished = lcs != null
    return { lcs, finished }
  }, [steps, stepIndex, n, m])

  return (
    <div className="space-y-3">
      <div className="font-medium mb-1">Status</div>
      <div className="text-sm text-gray-700">Grid size: ({n} x {m})</div>
      <div className="text-sm">Current LCS length: <span className="font-semibold">{lcs ?? '-'}</span></div>
      {finished && (
        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1 inline-block">Completed</div>
      )}
    </div>
  )
}
