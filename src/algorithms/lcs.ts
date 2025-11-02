import type { AlgorithmEvent, InitEvent } from '../context/AnimationController'

const CODE = {
  BASE: 1, // if i==0 or j==0
  MEMO_HIT: 2,
  MATCH_IF: 3,
  MATCH_SET: 4,
  ELSE: 5,
  ELSE_SET: 6,
  RETURN: 7,
}

function id(...parts: (string|number)[]) { return parts.join(':') }

export function generateStepsDP(x: string, y: string): AlgorithmEvent[] {
  const steps: AlgorithmEvent[] = []
  const init: InitEvent = { type: 'init', id: 'init', x, y }
  steps.push(init)

  const n = x.length, m = y.length
  const dp: number[][] = Array.from({length: n+1},()=>Array(m+1).fill(0))

  // Prefill base row/col without emitting per-cell steps
  for (let i = 0; i <= n; i++) dp[i][0] = 0
  for (let j = 0; j <= m; j++) dp[0][j] = 0

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (x[i-1] === y[j-1]) {
        // 1) Grid comparison highlight (no neighbour glow yet)
        steps.push({ type: 'dp_compute', id: id('compute0', i, j), i, j, deps: [] })
        // 2) Now glow the contributing neighbour(s)
        steps.push({ type: 'dp_compute', id: id('computeDeps', i, j), i, j, deps: [{ i: i-1, j: j-1 }] })
        // 3) animate contribution from diagonal (value + 1)
        steps.push({ type: 'transfer', id: id('fromDiag', i, j), from: { kind: 'cell', i: i-1, j: j-1 }, to: { kind: 'cell', i, j }, value: (dp[i-1][j-1] + 1) })
        // 4) set cell value
        dp[i][j] = dp[i-1][j-1] + 1
        steps.push({ type: 'dp_set', id: id('set', i, j), i, j, value: dp[i][j] })
        // 5) code (branch + return) after value materializes
        steps.push({ type: 'code', id: id('ifmatch', i, j), codeLine: CODE.MATCH_IF })
        steps.push({ type: 'code', id: id('ret', i, j), codeLine: CODE.RETURN })
      } else {
        // 1) Grid comparison highlight (no neighbour glow yet)
        steps.push({ type: 'dp_compute', id: id('compute0', i, j), i, j, deps: [] })
        // 2) Highlight ALL neighbours to be checked (left and up)
        steps.push({ type: 'dp_compute', id: id('computeDepsAll', i, j), i, j, deps: [{ i: i-1, j }, { i, j: j-1 }] })
        // Decide max neighbour
        const left = dp[i-1][j]
        const up = dp[i][j-1]
        const useLeft = left >= up
        // 3) Narrow highlight to only the MAX neighbour
        steps.push({ type: 'dp_compute', id: id('computeDepsMax', i, j), i, j, deps: [ useLeft ? { i: i-1, j } : { i, j: j-1 } ] })
        // 4) Animate contribution from the max neighbour
        steps.push({ type: 'transfer', id: id('fromNeighbor', i, j), from: { kind: 'cell', i: useLeft ? i-1 : i, j: useLeft ? j : j-1 }, to: { kind: 'cell', i, j }, value: useLeft ? left : up })
        // 5) Set cell value
        dp[i][j] = Math.max(left, up)
        steps.push({ type: 'dp_set', id: id('set', i, j), i, j, value: dp[i][j] })
        // 6) Code (branch + return) after value materializes
        steps.push({ type: 'code', id: id('else', i, j), codeLine: CODE.ELSE })
        steps.push({ type: 'code', id: id('ret', i, j), codeLine: CODE.RETURN })
      }
    }
  }
  return steps
}

export function generateStepsMemo(x: string, y: string): AlgorithmEvent[] {
  const steps: AlgorithmEvent[] = []
  const init: InitEvent = { type: 'init', id: 'init', x, y }
  steps.push(init)
  const n = x.length, m = y.length
  const memo: number[][] = Array.from({length: n+1},()=>Array(m+1).fill(-1))

  type Frame = { i:number, j:number, parent?: string, stage: 'enter'|'after_match'|'after_else_first'|'after_else_second'|'done', left?: number, up?: number }

  const key = (i:number,j:number) => `${i},${j}`
  const stack: Frame[] = [{ i:n, j:m, stage: 'enter' }]
  const parents: Record<string,string|undefined> = {}

  while (stack.length) {
    const f = stack.pop()!
    const idNode = key(f.i,f.j)
    if (f.stage === 'enter') {
      steps.push({ type: 'code', id: id('code', idNode), codeLine: 0 })
      // 1) Prefer memo hit first so repeated base subproblems are treated as memo hits
      if (memo[f.i][f.j] !== -1) {
        const val = memo[f.i][f.j]
        steps.push({ type: 'code', id: id('memohit', idNode), codeLine: CODE.MEMO_HIT })
        steps.push({ type: 'memo_hit', id: id('memo', idNode), i: f.i, j: f.j, value: val })
        // Transfer from the memoized cell to the caller node (parent), if available; otherwise to this node
        const p = parents[idNode]
        const toNode = p ? { i: Number(p.split(',')[0]), j: Number(p.split(',')[1]) } : { i: f.i, j: f.j }
        steps.push({ type: 'transfer', id: id('fromCell', idNode), from: { kind:'cell', i:f.i, j:f.j }, to: { kind:'node', i: toNode.i, j: toNode.j }, value: val })
        continue
      }
      // 2) Handle base case as a real compute only when not memoized yet
      if (f.i === 0 || f.j === 0) {
        steps.push({ type: 'code', id: id('base', idNode), codeLine: CODE.BASE })
        steps.push({ type: 'call_start', id: id('call', idNode), i: f.i, j: f.j, parent: parents[idNode] })
        steps.push({ type: 'call_end', id: id('end', idNode), i: f.i, j: f.j, value: 0 })
        steps.push({ type: 'transfer', id: id('toCell', idNode), from: { kind:'node', i:f.i, j:f.j }, to: { kind:'cell', i:f.i, j:f.j }, value: 0 })
        memo[f.i][f.j] = 0
        continue
      }
      // 3) Proceed with actual recursive computation
      steps.push({ type: 'call_start', id: id('call', idNode), i: f.i, j: f.j, parent: parents[idNode] })
      if (x[f.i-1] === y[f.j-1]) {
        steps.push({ type: 'code', id: id('ifmatch', idNode), codeLine: CODE.MATCH_IF })
        // push continuation then child
        stack.push({ ...f, stage: 'after_match' })
        const child = { i:f.i-1, j:f.j-1, stage:'enter' as const }
        parents[key(child.i,child.j)] = idNode
        stack.push(child)
      } else {
        steps.push({ type: 'code', id: id('else', idNode), codeLine: CODE.ELSE })
        stack.push({ ...f, stage: 'after_else_second' })
        const left = { i:f.i-1, j:f.j, stage:'enter' as const }
        const up = { i:f.i, j:f.j-1, stage:'enter' as const }
        parents[key(left.i,left.j)] = idNode
        parents[key(up.i,up.j)] = idNode
        // evaluate both branches; push second then first to evaluate first next
        stack.push(up)
        stack.push(left)
      }
    } else if (f.stage === 'after_match') {
      const val = (memo[f.i-1]?.[f.j-1] ?? 0) + 1
      memo[f.i][f.j] = val
      steps.push({ type: 'call_end', id: id('end', idNode), i: f.i, j: f.j, value: val })
      steps.push({ type: 'transfer', id: id('toCell', idNode), from: { kind:'node', i:f.i, j:f.j }, to: { kind:'cell', i:f.i, j:f.j }, value: val })
    } else if (f.stage === 'after_else_second') {
      const left = memo[f.i-1]?.[f.j] ?? 0
      const up = memo[f.i]?.[f.j-1] ?? 0
      const val = Math.max(left, up)
      memo[f.i][f.j] = val
      steps.push({ type: 'call_end', id: id('end', idNode), i: f.i, j: f.j, value: val })
      steps.push({ type: 'transfer', id: id('toCell', idNode), from: { kind:'node', i:f.i, j:f.j }, to: { kind:'cell', i:f.i, j:f.j }, value: val })
    }
  }

  return steps
}
