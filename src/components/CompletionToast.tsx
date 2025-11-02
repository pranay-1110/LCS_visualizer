import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnimationController } from '../context/AnimationController'

export default function CompletionToast() {
  const { steps, stepIndex, mode } = useAnimationController()

  // Derive input strings and sizes from the first init step
  const { X, Y, n, m } = useMemo(() => {
    const init = steps.find(s => s.type === 'init') as any | undefined
    const X = init?.x ?? ''
    const Y = init?.y ?? ''
    return { X, Y, n: X.length, m: Y.length }
  }, [steps])

  // Find finished and memo-hit events so we show the toast when done
  const { finished, memoHits } = useMemo(() => {
    let lcsDone = false
    let memoHits = 0
    for (let k = 0; k <= stepIndex; k++) {
      const e = steps[k]
      if (!e) continue
      if (e.type === 'memo_hit') memoHits++
      // finished when final cell/state is produced
      if ((e.type === 'dp_set' && e.i === n && e.j === m) || (e.type === 'call_end' && e.i === n && e.j === m)) lcsDone = true
    }
    return { finished: lcsDone, memoHits }
    // only recompute when step stream or index changes
  }, [steps, stepIndex, n, m])

  const [visible, setVisible] = useState(false)

  // Build DP table from dp_set steps and reconstruct final sequence (DP mode)
  const finalSequence = useMemo(() => {
    if (!finished || mode !== 'dp') return ''
    const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0))
    for (const e of steps) {
      if (e && e.type === 'dp_set') {
        dp[e.i][e.j] = e.value
      }
    }
    let i = n, j = m
    const out: string[] = []
    while (i > 0 && j > 0) {
      if (X[i - 1] === Y[j - 1]) {
        out.push(X[i - 1])
        i--; j--
      } else {
        if (dp[i - 1]?.[j] >= dp[i]?.[j - 1]) i--
        else j--
      }
    }
    return out.reverse().join('')
  }, [finished, mode, steps, X, Y, n, m])

  // Counters: naive vs memoized (exact for small inputs)
  const { naiveCalls, avoided } = useMemo(() => {
    // If no input available, return zeroes
    if (!X || !Y) return { naiveCalls: 0, avoided: 0 }

    // Safety: avoid extremely large recursion in the UI
    const MAX_WORK = 2000000 // absolute hard cap for number of simulated calls
    const MAX_LEN_APPROX = 20 // cap to switch to approximation

    // Helper: naive recursion that counts calls only (no value computation)
    function naiveCount(i: number, j: number, counter: { calls: number }): void {
      counter.calls++
      if (i === 0 || j === 0) return
      if (X[i - 1] === Y[j - 1]) {
        naiveCount(i - 1, j - 1, counter)
      } else {
        naiveCount(i - 1, j, counter)
        naiveCount(i, j - 1, counter)
      }
    }

    // Helper: memoized recursion that counts actual computed calls only
    function memoCount(i: number, j: number, memo: number[][], counter: { calls: number }): void {
      counter.calls++
      if (i === 0 || j === 0) return
      if (memo[i][j] !== -1) return
      if (X[i - 1] === Y[j - 1]) {
        memo[i][j] = 0
        memoCount(i - 1, j - 1, memo, counter)
      } else {
        memo[i][j] = 0
        memoCount(i - 1, j, memo, counter)
        memoCount(i, j - 1, memo, counter)
      }
    }

    // Quick approximation function for binomial coefficient (used if we bail out)
    function binomialApprox(a: number, b: number) {
      b = Math.min(b, a - b)
      if (b <= 0) return 1
      let num = 1
      let den = 1
      for (let k = 1; k <= b; k++) {
        num *= (a - b + k)
        den *= k
        // guard against overflow (we only need an approximation)
        if (num > Number.MAX_SAFE_INTEGER / 10) break
      }
      return Math.round(num / den)
    }

    // If strings are too long, use approximations to avoid locking the main thread
    if (n > MAX_LEN_APPROX || m > MAX_LEN_APPROX) {
      const approxNaive = binomialApprox(n + m, Math.min(n, m))
      const approxMemo = (n + 1) * (m + 1)
      const approxAvoided = Math.max(0, approxNaive - approxMemo)
      return { naiveCalls: approxNaive, avoided: approxAvoided }
    }

    // Run exact naive count (with a guard)
    const naiveCounter = { calls: 0 }
    naiveCount(n, m, naiveCounter)
    if (naiveCounter.calls > MAX_WORK) {
      // fallback to approximation if unexpectedly large
      const approxNaive = binomialApprox(n + m, Math.min(n, m))
      const approxMemo = (n + 1) * (m + 1)
      const approxAvoided = Math.max(0, approxNaive - approxMemo)
      return { naiveCalls: approxNaive, avoided: approxAvoided }
    }

    // Run exact memoized count (counts only actual computed calls)
    const memo = Array.from({ length: n + 1 }, () => Array(m + 1).fill(-1))
    const memoCounter = { calls: 0 }
    memoCount(n, m, memo, memoCounter)

    const avoided = Math.max(0, naiveCounter.calls - memoCounter.calls)
    return { naiveCalls: naiveCounter.calls, avoided }
  }, [X, Y, n, m])

  const efficiency = naiveCalls > 0 ? Math.round((avoided / naiveCalls) * 100) : 0

  useEffect(() => {
    if (!finished) return
    let showTimer: ReturnType<typeof setTimeout> | null = null
    let hideTimer: ReturnType<typeof setTimeout> | null = null
    const show = () => {
      setVisible(true)
      if (mode === 'dp') {
        hideTimer = setTimeout(() => setVisible(false), 3000)
      } else {
        // Memoization mode auto-dismiss in 6s
        hideTimer = setTimeout(() => setVisible(false), 6000)
      }
    }
    // Apply delay for both modes so final animations can finish
    const delay = mode === 'dp' ? 1800 : 1800
    showTimer = setTimeout(show, delay)
    return () => {
      if (showTimer) clearTimeout(showTimer)
      if (hideTimer) clearTimeout(hideTimer)
    }
  }, [finished, mode])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border shadow-lg rounded-md px-6 py-4 text-base z-[3000] min-w-[360px] max-w-[560px] cursor-pointer"
          onClick={() => setVisible(false)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="font-semibold text-gray-800 text-lg">Simulation Complete</div>
          </div>

          {mode === 'dp' ? (
            <div className="mt-2 text-sm text-gray-700">
              <div>Final LCS sequence: <span className="font-semibold">{finalSequence || '—'}</span></div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-gray-700">
              <div>Memo-hit events emitted: <span className="font-semibold">{memoHits}</span></div>
              <div className="mt-1">Extra recursive calls avoided: <span className="font-semibold">{avoided}</span></div>
              <div className="mt-1 text-gray-600">Efficiency: <span className="font-semibold">{efficiency}%</span></div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
