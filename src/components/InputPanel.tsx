import { useState } from 'react'
import { useAnimationController } from '../context/AnimationController'
import { generateStepsDP, generateStepsMemo } from '../algorithms/lcs'

export default function InputPanel() {
  const { mode, loadSteps, play } = useAnimationController()
  const [x, setX] = useState('ABC')
  const [y, setY] = useState('BDC')
  const [showLegend, setShowLegend] = useState(false)

  const onVisualize = () => {
    const steps = mode === 'dp' ? generateStepsDP(x, y) : generateStepsMemo(x, y)
    loadSteps(steps)
    // Kick off playback on next tick so steps are committed
    setTimeout(() => play(), 0)
  }

  return (
    <div className="flex items-end gap-3 p-3 relative">
      <div className="flex flex-col">
        <label className="text-xs text-gray-500">X</label>
        <input value={x} maxLength={6} onChange={(e)=>setX(e.target.value.slice(0,6))} className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-gray-500">Y</label>
        <input value={y} maxLength={6} onChange={(e)=>setY(e.target.value.slice(0,6))} className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button
        onClick={onVisualize}
        disabled={!(((x?.length??0) <= 6) && ((y?.length??0) <= 6) && (((x?.length??0) + (y?.length??0)) > 0))}
        title="At least one input required; each up to 6 characters"
        className="bg-blue-600 text-white rounded px-3 py-1 shadow-sm transform transform-gpu antialiased transition-all duration-200 ease-out hover:scale-[1.01] hover:shadow active:scale-[0.985] active:shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backfaceVisibility: 'hidden', willChange: 'transform' }}
      >
        Visualize
      </button>
      {mode === 'memo' && (
        <div className="relative">
          <button
            onClick={() => setShowLegend(v=>!v)}
            onMouseEnter={() => setShowLegend(true)}
            onMouseLeave={() => setShowLegend(false)}
            title="Memoization Legend"
            className="ml-1 w-7 h-7 rounded-full bg-white text-black border border-black flex items-center justify-center shadow-sm transform transform-gpu antialiased transition-all duration-200 ease-out hover:scale-[1.01] hover:shadow active:scale-[0.985] active:shadow-inner"
            style={{ backfaceVisibility: 'hidden', willChange: 'transform' }}
            aria-label="Memoization Legend"
          >
            <span className="italic font-serif text-sm leading-none">i</span>
          </button>
          {showLegend && (
            <div className="absolute right-0 mt-2 z-30 w-64 rounded border bg-white shadow p-2 text-xs text-gray-800">
              <div className="font-medium mb-1">Memoization Legend</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 rounded" style={{ boxShadow: '0 0 0 3px rgba(0,178,202,0.35)', border: '1px solid #00b2ca' }} />
                  <span>Partial memo-hit</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 rounded" style={{ boxShadow: '0 0 0 3px rgba(29,78,137,0.35)', border: '1px solid #1d4e89' }} />
                  <span>Full memo-hit</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 rounded" style={{ boxShadow: '0 0 0 3px rgba(245,158,11,0.25)', border: '1px solid #f59e0b' }} />
                  <span>Active/participant node</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
