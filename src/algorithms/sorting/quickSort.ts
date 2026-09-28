import { executeDefinition } from '../../engine'
import type { AlgorithmDefinition } from '../../engine'
import type {
  AlgorithmInput,
  AlgorithmStep,
  ComparisonResult,
  ComplexityInfo,
  PseudocodeLine,
} from '../../engine'

/** State snapshot for Quick Sort (Hoare-visible partition progress). */
export type QuickState = {
  readonly values: readonly number[]
  readonly activeRanges: readonly {
    readonly lo: number
    readonly hi: number
    readonly phase: 'partitioning' | 'sorted'
  }[]
  readonly pivotIndex: number | null
  readonly scanning: {
    readonly lo: number
    readonly hi: number
    readonly pivotValue: number
    readonly nextSwap: number
    readonly scan: number
  } | null
  readonly compareCount: number
  readonly swapCount: number
}

export const QUICK_SORT_PSEUDOCODE: readonly PseudocodeLine[] = [
  { number: 1, text: 'quickSort(a, lo, hi)' },
  { number: 2, text: '  if lo >= hi: return' },
  { number: 3, text: '  pivot = a[(lo + hi) / 2]; move pivot to end' },
  { number: 4, text: '  for j from lo to hi - 1' },
  { number: 5, text: '    if a[j] < pivot: swap a[i], a[j]; i += 1' },
  { number: 6, text: '  place pivot at a[i] (final position)' },
  { number: 7, text: '  quickSort(a, lo, i - 1); quickSort(a, i + 1, hi)' },
]

export const QUICK_SORT_COMPLEXITY: ComplexityInfo = {
  time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)' },
  space: 'O(log n)',
}

type QuickDraft = Omit<AlgorithmStep<QuickState>, 'step' | 'complexity'>

/**
 * Quick Sort with a deterministic MIDDLE-element pivot, so runs are
 * reproducible for tests. Pure and framework-free. Every partition phase
 * is explicit: pivot selection, per-element scans and comparisons,
 * boundary swaps, pivot placement, and subrange discovery. Work happens
 * on a local copy; the caller's input is never mutated.
 */
export const quickSortAlgorithm: AlgorithmDefinition<AlgorithmInput, QuickState> = {
  metadata: {
    id: 'quick-sort',
    label: 'Quick Sort',
    category: 'Sorting',
    description:
      'Partitions around a pivot so smaller elements end up left and larger right, then sorts each side recursively.',
    complexity: QUICK_SORT_COMPLEXITY,
    pseudocode: QUICK_SORT_PSEUDOCODE,
    stable: false,
    inPlace: true,
    tags: ['divide-and-conquer', 'in-place'],
  },
  createState: (input: AlgorithmInput): QuickState => ({
    values: [...input.values],
    activeRanges:
      input.values.length > 1
        ? [{ lo: 0, hi: input.values.length - 1, phase: 'partitioning' }]
        : [],
    pivotIndex: null,
    scanning: null,
    compareCount: 0,
    swapCount: 0,
  }),
  run: function* (input: AlgorithmInput): Generator<QuickDraft, void, void> {
    const work = [...input.values]
    const n = work.length
    let compareCount = 0
    let swapCount = 0

    const snap = (
      ranges: QuickState['activeRanges'],
      pivotIndex: number | null,
      scanning: QuickState['scanning'],
    ): QuickState => ({
      values: [...work],
      activeRanges: [...ranges],
      pivotIndex,
      scanning,
      compareCount,
      swapCount,
    })

    function* quickSort(lo: number, hi: number, stack: QuickState['activeRanges']): Generator<QuickDraft> {
      if (lo > hi) {
        return
      }
      if (lo === hi) {
        yield {
          state: snap(
            [...stack.slice(0, -1), { lo, hi, phase: 'sorted' }],
            null,
            null,
          ),
          operation: { type: 'UPDATE', detail: `a[${lo}] is a single element` },
          affected: [String(lo)],
          highlights: [{ kind: 'sorted', elements: [String(lo)] }],
          explanation: `Base case: a[${lo}] is a single element, already sorted.`,
          pseudocodeLine: 2,
          comparison: null,
          mutation: null,
        }
        return
      }

      // Pivot selection: deterministic middle element, moved to the end.
      const mid = lo + Math.floor((hi - lo) / 2)
      const pivot = work[mid] ?? 0
      if (mid !== hi) {
        const endValue = work[hi] ?? 0
        work[mid] = endValue
        work[hi] = pivot
        swapCount += 1
        yield {
          state: snap(stack, mid, null),
          operation: { type: 'SELECT', detail: `pivot = a[${mid}] = ${pivot}, moved to a[${hi}]` },
          affected: [String(mid), String(hi)],
          highlights: [{ kind: 'selected', elements: [String(hi)], label: 'pivot' }],
          explanation: `Choose the middle element as pivot (${pivot}) and move it to the end to partition around it.`,
          pseudocodeLine: 3,
          comparison: null,
          mutation: { target: `a[${mid}], a[${hi}]`, before: `${endValue}, ${pivot}`, after: `${pivot}, ${endValue}` },
        }
      } else {
        yield {
          state: snap(stack, mid, null),
          operation: { type: 'SELECT', detail: `pivot = a[${mid}] = ${pivot}` },
          affected: [String(hi)],
          highlights: [{ kind: 'selected', elements: [String(hi)], label: 'pivot' }],
          explanation: `Choose the middle element as pivot: a[${mid}] = ${pivot}.`,
          pseudocodeLine: 3,
          comparison: null,
          mutation: null,
        }
      }

      // Lomuto partition: scan, compare, swap smaller elements forward.
      let nextSwap = lo
      for (let scan = lo; scan <= hi - 1; scan += 1) {
        const candidate = work[scan] ?? 0
        compareCount += 1
        const result: ComparisonResult = candidate < pivot ? 'less' : 'greater'
        if (candidate < pivot) {
          if (nextSwap !== scan) {
            const swapValue = work[nextSwap] ?? 0
            work[nextSwap] = candidate
            work[scan] = swapValue
            swapCount += 1
            yield {
              state: snap(stack, hi, { lo, hi, pivotValue: pivot, nextSwap, scan }),
              operation: { type: 'COMPARE', detail: `a[${scan}] vs pivot (${candidate} < ${pivot}) then swap` },
              affected: [String(scan), String(nextSwap)],
              highlights: [
                { kind: 'compare', elements: [String(scan)] },
                { kind: 'swap', elements: [String(nextSwap), String(scan)] },
              ],
              explanation: `${candidate} < pivot ${pivot}: swap it into the "smaller" region at a[${nextSwap}].`,
              pseudocodeLine: 5,
              comparison: { left: `a[${scan}] = ${candidate}`, right: `pivot = ${pivot}`, result },
              mutation: { target: `a[${nextSwap}], a[${scan}]`, before: `${swapValue}, ${candidate}`, after: `${candidate}, ${swapValue}` },
            }
          } else {
            yield {
              state: snap(stack, hi, { lo, hi, pivotValue: pivot, nextSwap, scan }),
              operation: { type: 'COMPARE', detail: `a[${scan}] vs pivot (${candidate} < ${pivot})` },
              affected: [String(scan)],
              highlights: [{ kind: 'compare', elements: [String(scan)] }],
              explanation: `${candidate} < pivot ${pivot}: already inside the smaller region, no swap needed.`,
              pseudocodeLine: 5,
              comparison: { left: `a[${scan}] = ${candidate}`, right: `pivot = ${pivot}`, result },
              mutation: null,
            }
          }
          nextSwap += 1
        } else {
          yield {
            state: snap(stack, hi, { lo, hi, pivotValue: pivot, nextSwap, scan }),
            operation: { type: 'COMPARE', detail: `a[${scan}] vs pivot (${candidate} >= ${pivot})` },
            affected: [String(scan)],
            highlights: [{ kind: 'compare', elements: [String(scan)] }],
            explanation: `${candidate} >= pivot ${pivot}: it stays on the larger side.`,
            pseudocodeLine: 4,
            comparison: { left: `a[${scan}] = ${candidate}`, right: `pivot = ${pivot}`, result: 'greater' },
            mutation: null,
          }
        }
      }

      // Pivot placement: swap the pivot into its final position.
      const boundaryValue = work[nextSwap] ?? 0
      work[nextSwap] = pivot
      work[hi] = boundaryValue
      swapCount += 1
      yield {
        state: snap(stack, nextSwap, null),
        operation: { type: 'UPDATE', detail: `pivot ${pivot} placed at a[${nextSwap}]` },
        affected: [String(nextSwap), String(hi)],
        highlights: [{ kind: 'sorted', elements: [String(nextSwap)] }],
        explanation: `Place the pivot ${pivot} at a[${nextSwap}]: everything left is smaller, everything right is larger. Its position is now final.`,
        pseudocodeLine: 6,
        comparison: null,
        mutation: { target: `a[${nextSwap}], a[${hi}]`, before: `${boundaryValue}, ${pivot}`, after: `${pivot}, ${boundaryValue}` },
      }

      // Recursive subranges.
      const leftStack = [...stack.slice(0, -1), { lo, hi, phase: 'partitioning' as const }, { lo, hi: nextSwap - 1, phase: 'partitioning' as const }]
      yield {
        state: snap(leftStack, null, null),
        operation: { type: 'DISCOVER', detail: `recurse left a[${lo}..${nextSwap - 1}]` },
        affected: [String(lo), String(nextSwap - 1)],
        highlights: [],
        explanation: `Recurse into the left subrange a[${lo}..${nextSwap - 1}].`,
        pseudocodeLine: 7,
        comparison: null,
        mutation: null,
      }
      yield* quickSort(lo, nextSwap - 1, leftStack)

      const rightStack = [...stack.slice(0, -1), { lo, hi, phase: 'partitioning' as const }, { lo: nextSwap + 1, hi, phase: 'partitioning' as const }]
      yield {
        state: snap(rightStack, null, null),
        operation: { type: 'DISCOVER', detail: `recurse right a[${nextSwap + 1}..${hi}]` },
        affected: [String(nextSwap + 1), String(hi)],
        highlights: [],
        explanation: `Recurse into the right subrange a[${nextSwap + 1}..${hi}].`,
        pseudocodeLine: 7,
        comparison: null,
        mutation: null,
      }
      yield* quickSort(nextSwap + 1, hi, rightStack)

      yield {
        state: snap([...stack.slice(0, -1), { lo, hi, phase: 'sorted' }], null, null),
        operation: { type: 'UPDATE', detail: `a[${lo}..${hi}] sorted` },
        affected: Array.from({ length: hi - lo + 1 }, (_, offset) => String(lo + offset)),
        highlights: Array.from({ length: hi - lo + 1 }, (_, offset) => ({ kind: 'sorted' as const, elements: [String(lo + offset)] })),
        explanation: `Range complete: a[${lo}..${hi}] is sorted.`,
        pseudocodeLine: 1,
        comparison: null,
        mutation: null,
      }
    }

    yield* quickSort(0, n - 1, n > 1 ? [{ lo: 0, hi: n - 1, phase: 'partitioning' }] : [])

    yield {
      state: snap([], null, null),
      operation: { type: 'COMPLETE' },
      affected: work.map((_, index) => String(index)),
      highlights: [{ kind: 'result', elements: work.map((_, index) => String(index)), label: 'sorted' }],
      explanation: `Array sorted after ${compareCount} comparisons and ${swapCount} swaps.`,
      pseudocodeLine: null,
      comparison: null,
      mutation: null,
    } satisfies QuickDraft
  },
}

/** Executes quick sort deterministically; returns the full step list. */
export function executeQuickSort(values: readonly number[]): AlgorithmStep<QuickState>[] {
  return executeDefinition(quickSortAlgorithm, { values })
}
