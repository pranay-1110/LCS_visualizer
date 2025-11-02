import { useAnimationController } from '../context/AnimationController'
import { useRef } from 'react'

export default function ModeToggle() {
  const { mode, setMode } = useAnimationController()
  const memoClicksRef = useRef(0)
  const timerRef = useRef<number | null>(null)

  const handleMemoClick = () => {
    setMode('memo')
    // Rapid-click detector: 7 clicks within ~1.5s
    memoClicksRef.current += 1
    if (timerRef.current == null) {
      timerRef.current = window.setTimeout(() => {
        memoClicksRef.current = 0
        timerRef.current = null
      }, 1500)
    }
    if (memoClicksRef.current >= 7) {
      memoClicksRef.current = 0
      if (timerRef.current != null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      // Fire a custom event for the app to show an in-app video overlay
      window.dispatchEvent(new CustomEvent('lcs:play-video'))
    }
  }
  return (
    <div className="flex gap-2 p-3">
      <button
        onClick={()=>setMode('dp')}
        className={`px-3 py-1 border rounded transform transform-gpu antialiased transition-all duration-200 ease-out ${mode==='dp' ? 'bg-gray-900 text-white' : ''} hover:scale-[1.01] hover:shadow-sm active:scale-[0.985] active:shadow-inner`}
        style={{ backfaceVisibility: 'hidden' }}
      >
        LCS Table
      </button>
      <button
        onClick={handleMemoClick}
        className={`px-3 py-1 border rounded transform transform-gpu antialiased transition-all duration-200 ease-out ${mode==='memo' ? 'bg-gray-900 text-white' : ''} hover:scale-[1.01] hover:shadow-sm active:scale-[0.985] active:shadow-inner`}
        style={{ backfaceVisibility: 'hidden' }}
      >
        Memoization
      </button>
    </div>
  )
}
