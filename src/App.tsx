import ModeToggle from './components/ModeToggle'
import { useEffect, useState } from 'react'
import InputPanel from './components/InputPanel'
import CodePanel from './components/CodePanel'
import DPGrid from './components/DPGrid'
import RecursionTree from './components/RecursionTree'
import ControlPanel from './components/ControlPanel'
import { useAnimationController } from './context/AnimationController'
import CurrentInfo from './components/CurrentInfo'
import TeleportAnimator from './components/TeleportAnimator'
import DependencyArrows from './components/DependencyArrows'
import FinalSequence from './components/FinalSequence'
import CompareLetters from './components/CompareLetters'
import ReturnArrows from './components/ReturnArrows'
import CompletionToast from './components/CompletionToast'
import { Analytics } from '@vercel/analytics/react'
import { Link } from "react-router-dom";

function App() {
  const { mode } = useAnimationController()
  const [showVideo, setShowVideo] = useState(false)

  useEffect(() => {
    const onPlay = () => setShowVideo(true)
    window.addEventListener('lcs:play-video' as any, onPlay)
    return () => window.removeEventListener('lcs:play-video' as any, onPlay)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 shadow-sm">
        <div className="w-full flex flex-wrap items-center justify-between px-4">
          <div className="flex items-center">
            
            <a 
        href="http://lcsvisualizer.vercel.app" 
        className="px-4 py-3 text-2xl font-semibold hover:no-underline cursor-pointer"
      >
        Longest Common Subsequence Visualizer
      </a>
      <Link
        to="/learn"
        className={`ml-4 text-sm px-4 py-1.5 border rounded transform transform-gpu antialiased transition-all duration-200 ease-out hover:scale-[1.01] hover:shadow-sm active:scale-[0.985] active:shadow-inner`}
        style={{ backfaceVisibility: 'hidden' }}
      >
        Learn
      </Link>
            <ModeToggle />
          </div>
          <InputPanel />
        </div>
      </header>

      {/* Main 3-panel layout */}
      <main className={`relative flex-1 grid ${mode === 'dp' ? 'grid-cols-[420px_1fr_320px]' : 'grid-cols-[420px_1fr]'} gap-0 min-h-0`}>
        {/* Left: Code panel with Status below */}
        <div className="bg-white/80 backdrop-blur border-r flex flex-col min-h-0">
          <CodePanel />
          <div className="border-t p-3">
            <CurrentInfo />
          </div>
          <div className="border-t p-3">
            <FinalSequence />
          </div>
        </div>

        {/* Center: Visualization area */}
        <div className="h-full overflow-hidden bg-slate-50">
          {mode === 'dp' ? (
            <div className="h-full">
              <div className="px-3 pt-2 text-s font-semibold text-gray-600">DP Grid</div>
              <DPGrid />
            </div>
          ) : (
            // Memo mode: enlarge tree canvas and embed status with DP panel
            <div className="grid h-full" style={{ gridTemplateColumns: '1.35fr 0.65fr' }}>
              <div className="min-h-0">
                <RecursionTree />
              </div>
              <div className="border-l bg-white min-h-0 flex flex-col">
                {/* Grid on top */}
                <div className="p-3 border-b">
                  <div className="pb-1 text-xs font-semibold text-gray-600">DP Grid</div>
                  <DPGrid />
                </div>
                {/* Compare letters below grid */}
                <div className="p-3 border-b">
                  <CompareLetters />
                </div>
                {/* Pro-Tip below Comparing Characters (Memoization mode) */}
                <div className="p-3">
                  <div className="text-xs text-gray-600 italic">
                    Pro-Tip: Click a node to see how its value is calculated
                  </div>
                </div>
                {/* Final sequence moved to the Code section */}
              </div>
            </div>
          )}
        </div>

        {/* Right: Info/secondary visualization */}
        {mode === 'dp' && (
          <div className="h-full border-l bg-white p-4 text-sm text-gray-800 space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Legend</div>
              <div className="flex items-center gap-6 text-sm">
                <div><span className="font-semibold">X</span>: Left column string</div>
                <div><span className="font-semibold">Y</span>: Top row string</div>
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Complexity</div>
              <ul className="list-disc pl-5 space-y-1">
                <li><span className="font-medium">Time</span>: O(MxN)</li>
                <li><span className="font-medium">Space</span>: O(MxN) for full table</li>
                <li><span className="font-medium">Space (optimized)</span>: O(min(N, M)) for length-only computation</li>
              </ul>
              <div className="mt-2 text-xs text-gray-600">
                Top-down with memoization computes at most one value per subproblem, so it remains O(n·m) in time and O(n·m) in space for the memo table.
              </div>
            </div>
            <div className="pt-4 mt-8 border-t">
              <div className="text-xs text-gray-600 italic">
                Pro-Tip: Click a cell to see how its value is calculated
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global overlays */}
      <TeleportAnimator />
      <DependencyArrows />
      <ReturnArrows />
      <CompletionToast />

      {showVideo && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          {/* Hidden iframe to play audio */}
          <iframe
            className="absolute w-0 h-0 opacity-0 pointer-events-none"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
            title="LCS Audio"
            allow="autoplay; encrypted-media"
          />
          {/* Minimal audio panel */}
          <div className="relative bg-white text-black rounded shadow-lg border p-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <div className="text-sm">Playing audio… Sorry ^_^</div>
            <button
              onClick={() => setShowVideo(false)}
              className="ml-2 px-2 py-1 border rounded text-sm hover:bg-gray-100"
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {/* Footer controls */}
<footer className="mt-auto w-full border-t bg-white">
  <div className="px-0 py-0">
    <ControlPanel />
  </div>
</footer>
 
      <Analytics />
    </div>
  )
}

export default App
