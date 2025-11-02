import { useMemo } from 'react'
import { useAnimationController } from '../context/AnimationController'

export default function CompareLetters() {
  const { steps, stepIndex, x, y, mode } = useAnimationController()

  const { i, j } = useMemo(() => {
    // find latest call context up to current step (memo mode)
    for (let k = stepIndex; k >= 0; k--) {
      const e = steps[k]
      if (e?.type === 'call_start') return { i: e.i, j: e.j }
      if (e?.type === 'memo_hit') return { i: e.i, j: e.j }
    }
    return { i: 0, j: 0 }
  }, [steps, stepIndex])

  if (mode !== 'memo') return null

  const hiX = i > 0 && j > 0 ? i - 1 : -1
  const hiY = i > 0 && j > 0 ? j - 1 : -1
  const isMatch = hiX >= 0 && hiY >= 0 && x[hiX] === y[hiY]

  const item = (ch: string, idx: number, active: boolean) => (
    <div
      key={idx}
      className={`px-1.5 py-0.5 rounded text-base ${active
        ? (isMatch ? 'bg-emerald-200 text-emerald-900 font-semibold' : 'bg-amber-200 text-amber-900 font-semibold')
        : 'text-gray-700'}`}
    >
      {ch}
    </div>
  )

  return (
    <div className="mb-3">
      <div className="text-xs font-medium text-gray-600 mb-1">Comparing characters</div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          {x.split('').map((ch, idx) => item(ch, idx, idx === hiX))}
        </div>
        <div className="flex items-center gap-1">
          {y.split('').map((ch, idx) => item(ch, idx, idx === hiY))}
        </div>
      </div>
    </div>
  )
}
