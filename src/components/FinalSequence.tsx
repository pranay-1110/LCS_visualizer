import { useAnimationController } from '../context/AnimationController'
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FinalSequence() {
  const { steps, stepIndex, x, y, n, m, mode } = useAnimationController()
  const [seq, setSeq] = useState<string | null>(null)
  const [show, setShow] = useState(false)

  const finished = useMemo(() => {
    // consider finished if we saw dp_set(n,m) or call_end(n,m)
    for (let k = 0; k <= stepIndex; k++) {
      const e = steps[k]
      if (e?.type === 'dp_set' && e.i === n && e.j === m) return true
      if (e?.type === 'call_end' && e.i === n && e.j === m) return true
    }
    return false
  }, [steps, stepIndex, n, m])

  useEffect(() => {
    if (!finished) { setShow(false); setSeq(null); return }
    // reconstruct dp table from events then backtrack
    const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0))
    for (let k = 0; k <= stepIndex; k++) {
      const e = steps[k]
      if (e?.type === 'dp_set') dp[e.i][e.j] = e.value
    }
    // For memo mode, if dp isn't fully filled, fall back to computing dp from x,y using classic DP
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
    // backtrack sequence
    let i = n, j = m
    const chars: string[] = []
    while (i > 0 && j > 0) {
      if (x[i - 1] === y[j - 1]) { chars.push(x[i - 1]); i--; j--; }
      else if (dp[i - 1][j] >= dp[i][j - 1]) i--
      else j--
    }
    setSeq(chars.reverse().join(''))
    setShow(true)
  }, [finished, n, m, x, y, mode, steps, stepIndex])

  if (!show || seq == null) return null

  const letters = seq.split('')

  return (
    <div>
      <div className="font-medium mb-1">Final LCS sequence</div>
      <div className="flex gap-1">
        <AnimatePresence>
          {letters.map((ch, idx) => (
            <motion.div
              key={`${ch}-${idx}`}
              initial={{ opacity: 0, y: -6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm shadow-sm"
            >
              {ch}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
