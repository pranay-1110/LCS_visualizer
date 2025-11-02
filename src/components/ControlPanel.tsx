import { useAnimationController } from '../context/AnimationController'

export default function ControlPanel() {
  const { play, pause, reset, step, skipToNextFill, playing, speed, setSpeed } = useAnimationController()
  return (
    <div className="flex items-center gap-1.5 p-2.5 border-t bg-white text-sm relative">
      <button onClick={()=>step(-1)} className="px-2 py-1 border rounded transform transform-gpu transition-all duration-150 ease-out transition-colors hover:bg-gray-100 active:scale-[0.985] active:shadow-inner">Step Back</button>
      {playing ? (
        <button onClick={pause} className="px-2 py-1 border rounded transform transform-gpu transition-all duration-150 ease-out transition-colors hover:bg-gray-100 active:scale-[0.985] active:shadow-inner">Pause</button>
      ) : (
        <button onClick={play} className="px-2 py-1 border rounded transform transform-gpu transition-all duration-150 ease-out transition-colors hover:bg-gray-100 active:scale-[0.985] active:shadow-inner">Play</button>
      )}
      <button onClick={()=>step(1)} className="px-2 py-1 border rounded transform transform-gpu transition-all duration-150 ease-out transition-colors hover:bg-gray-100 active:scale-[0.985] active:shadow-inner">Step</button>
      <button onClick={skipToNextFill} className="px-2 py-1 border rounded transform transform-gpu transition-all duration-150 ease-out transition-colors hover:bg-gray-100 active:scale-[0.985] active:shadow-inner">Skip Next Fill</button>
      <button onClick={reset} className="px-2 py-1 border rounded transform transform-gpu transition-all duration-150 ease-out transition-colors hover:bg-gray-100 active:scale-[0.985] active:shadow-inner">Reset</button>
      <div className="ml-auto flex items-center gap-1.5">
        <label className="text-xs text-gray-600">Speed</label>
        <input className="h-5" type="range" min={0.25} max={4} step={0.25} value={speed} onChange={(e)=>setSpeed(Number(e.target.value))} />
      </div>
    </div>
  )
}
