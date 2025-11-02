import { useAnimationController } from '../context/AnimationController'

export default function ControlPanel() {
  const { play, pause, reset, step, skipToNextFill, playing, speed, setSpeed } = useAnimationController()
  return (
    <div className="flex items-center gap-1.5 p-2.5 border-t bg-white text-sm relative">
      <button onClick={()=>step(-1)} className="px-2 py-1 border rounded transform transform-gpu transition-all duration-150 ease-out transition-colors bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 active:scale-[0.985] active:shadow-inner shadow-[inset_0_0_0_0_rgba(0,0,0,0)]">Step Back</button>
      {playing ? (
        <button onClick={pause} className="px-2 py-1 border rounded transform transform-gpu transition-all duration-150 ease-out transition-colors bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 active:scale-[0.985] active:shadow-inner">Pause</button>
      ) : (
        <button onClick={play} className="px-2 py-1 border rounded transform transform-gpu transition-all duration-150 ease-out transition-colors bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 active:scale-[0.985] active:shadow-inner">Play</button>
      )}
      <button onClick={()=>step(1)} className="px-2 py-1 border rounded transform transform-gpu transition-all duration-150 ease-out transition-colors bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100 active:scale-[0.985] active:shadow-inner">Step</button>
      <button onClick={skipToNextFill} className="px-2 py-1 border rounded transform transform-gpu transition-all duration-150 ease-out transition-colors bg-violet-50 border-violet-200 text-violet-800 hover:bg-violet-100 active:scale-[0.985] active:shadow-inner">Skip Next Fill</button>
      <div className="flex gap-90">
      <button onClick={reset} className="px-2 py-1 border rounded transform transform-gpu transition-all duration-150 ease-out transition-colors bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100 active:scale-[0.985] active:shadow-inner">Reset</button>
      <div className="text-xs text-gray-600 italic">
        Made with <span className="text-red-600">❤️</span> by Pranay ^_^
      </div>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <label className="text-xs text-gray-600">Speed</label>
        <input className="h-5" type="range" min={0.25} max={4} step={0.25} value={speed} onChange={(e)=>setSpeed(Number(e.target.value))} />
      </div>
    </div>
  )
}
