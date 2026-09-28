import { executeDefinition } from '../../engine'
import type { AlgorithmDefinition } from '../../engine'
import type {
  AlgorithmInput,
  AlgorithmStep,
  ComparisonResult,
  ComplexityInfo,
  PseudocodeLine,
} from '../../engine'

/**
 * State snapshot for Heap Sort.
 *
 * - `heapSize`: the heap boundary — indices [0, heapSize) are the live
 *   max-heap; indices [heapSize, n) are extracted (final, sorted)
 * - `parent`/`child`/`largest`: current sift-down positions, or null
 * - `phase`: building the heap, extracting the max, or done
 */
export type HeapState = {
  readonly values: readonly number[]
  readonly heapSize: number
  readonly phase: 'building' | 'extracting' | 'done'
  readonly parent: number | null
  readonly child: number | null
  readonly largest: number | null
  readonly compareCount: number
  readonly swapCount: number
}

export const HEAP_SORT_PSEUDOCODE: readonly PseudocodeLine[] = [
  { number: 1, text: 'buildMaxHeap(a): for i from n/2 - 1 down to 0: siftDown(i, n)' },
  { number: 2, text: 'for end from n - 1 down to 1' },
  { number: 3, text: '  swap a[0], a[end]' },
  { number: 4, text: '  siftDown(a, 0, end)' },
  { number: 5, text: 'siftDown(i, size): largest = i' },
  { number: 6, text: '  if left < size and a[left] > a[largest]: largest = left' },
  { number: 7, text: '  if right < size and a[right] > a[largest]: largest = right' },
  { number: 8, text: '  if largest != i: swap a[i], a[largest]; siftDown(largest, size)' },
]

export const HEAP_SORT_COMPLEXITY: ComplexityInfo = {
  time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
  space: 'O(1)',
}

type HeapDraft = Omit<AlgorithmStep<HeapState>, 'step' | 'complexity'>

/** Array index of the left/right child in a 0-based binary heap. */
export function leftChild(index: number): number {
  return 2 * index + 1
}

export function rightChild(index: number): number {
  return 2 * index + 2
}

/** Index of the parent in a 0-based binary heap (-1 for the root). */
export function parentOf(index: number): number {
  return Math.floor((index - 1) / 2)
}

/**
 * Heap Sort — builds a max-heap, then repeatedly extracts the root.
 *
 * Pure and framework-free. Every sift-down operation is explicit:
 * parent/child comparisons, largest-child selection, and swaps. The
 * boundary between the live heap and the extracted suffix moves one
 * element at a time. Both array and tree views render from this same
 * state, so they stay synchronized by construction. Work happens on a
 * local copy; the caller's input is never mutated.
 */
export const heapSortAlgorithm: AlgorithmDefinition<AlgorithmInput, HeapState> = {
  metadata: {
    id: 'heap-sort',
    label: 'Heap Sort',
    category: 'Sorting',
    description:
      'Builds a max-heap from the array, then repeatedly swaps the root (maximum) to the end and repairs the heap.',
    complexity: HEAP_SORT_COMPLEXITY,
    pseudocode: HEAP_SORT_PSEUDOCODE,
    stable: false,
    inPlace: true,
    tags: ['heap', 'in-place', 'selection-sort-family'],
  },
  createState: (input: AlgorithmInput): HeapState => ({
    values: [...input.values],
    heapSize: input.values.length,
    phase: 'building',
    parent: null,
    child: null,
    largest: null,
    compareCount: 0,
    swapCount: 0,
  }),
  run: function* (input: AlgorithmInput): Generator<HeapDraft, void, void> {
    const work = [...input.values]
    const n = work.length
    let heapSize = n
    let compareCount = 0
    let swapCount = 0

    const snap = (
      phase: HeapState['phase'],
      parent: number | null,
      child: number | null,
      largest: number | null,
    ): HeapState => ({
      values: [...work],
      heapSize,
      phase,
      parent,
      child,
      largest,
      compareCount,
      swapCount,
    })

    const extractedHighlights = (): { kind: 'sorted'; elements: string[] }[] => {
      const out: { kind: 'sorted'; elements: string[] }[] = []
      for (let index = heapSize; index < n; index += 1) {
        out.push({ kind: 'sorted', elements: [String(index)] })
      }
      return out
    }

    /** Yields one explicit sift-down pass at `start` with the given boundary. */
    function* siftDown(start: number, size: number, phase: HeapState['phase']): Generator<HeapDraft> {
      let current = start
      for (;;) {
        const left = leftChild(current)
        const right = rightChild(current)
        let largest = current

        if (left < size) {
          compareCount += 1
          const parentValue = work[current] ?? 0
          const leftValue = work[left] ?? 0
          const result: ComparisonResult = leftValue > parentValue ? 'greater' : 'less'
          if (leftValue > (work[largest] ?? 0)) {
            largest = left
          }
          yield {
            state: snap(phase, current, left, largest),
            operation: { type: 'COMPARE', detail: `parent a[${current}] vs left child a[${left}]` },
            affected: [String(current), String(left)],
            highlights: [
              { kind: 'compare', elements: [String(current), String(left)], label: 'parent/child' },
              ...(largest === left
                ? [{ kind: 'selected' as const, elements: [String(left)], label: 'larger' }]
                : []),
            ],
            explanation: `Compare parent a[${current}] = ${parentValue} with left child a[${left}] = ${leftValue} (children of i live at 2i+1 and 2i+2).`,
            pseudocodeLine: 6,
            comparison: { left: `a[${current}] = ${parentValue}`, right: `a[${left}] = ${leftValue}`, result },
            mutation: null,
          }
        }

        if (right < size) {
          compareCount += 1
          const largestValue = work[largest] ?? 0
          const rightValue = work[right] ?? 0
          const result: ComparisonResult = rightValue > largestValue ? 'greater' : 'less'
          if (rightValue > largestValue) {
            largest = right
          }
          yield {
            state: snap(phase, current, right, largest),
            operation: { type: 'COMPARE', detail: `largest a[${largest}] vs right child a[${right}]` },
            affected: [String(largest), String(right)],
            highlights: [
              { kind: 'compare', elements: [String(largest), String(right)] },
              ...(largest === right
                ? [{ kind: 'selected' as const, elements: [String(right)], label: 'largest child' }]
                : [{ kind: 'selected' as const, elements: [String(largest)], label: 'largest child' }]),
            ],
            explanation: `Largest-child selection: a[${largest}] = ${largestValue} vs a[${right}] = ${rightValue} — the largest of parent and both children must lead the subtree.`,
            pseudocodeLine: 7,
            comparison: { left: `a[${largest}] = ${largestValue}`, right: `a[${right}] = ${rightValue}`, result },
            mutation: null,
          }
        }

        if (largest === current) {
          yield {
            state: snap(phase, null, null, current),
            operation: { type: 'UPDATE', detail: `heap property holds at a[${current}]` },
            affected: [String(current)],
            highlights: [{ kind: 'selected', elements: [String(current)], label: 'heap ok' }],
            explanation: `a[${current}] already satisfies the max-heap property against its children — no repair needed.`,
            pseudocodeLine: 8,
            comparison: null,
            mutation: null,
          }
          return
        }

        const parentValue = work[current] ?? 0
        const childValue = work[largest] ?? 0
        work[current] = childValue
        work[largest] = parentValue
        swapCount += 1
        yield {
          state: snap(phase, current, largest, largest),
          operation: { type: 'SWAP', detail: `a[${current}] <-> a[${largest}]` },
          affected: [String(current), String(largest)],
          highlights: [
            { kind: 'swap', elements: [String(current), String(largest)], label: 'heapify' },
          ],
          explanation: `Heapify swap: the larger child ${childValue} moves up to a[${current}], and ${parentValue} sifts down to a[${largest}].`,
          pseudocodeLine: 8,
          comparison: null,
          mutation: { target: `a[${current}], a[${largest}]`, before: `${parentValue}, ${childValue}`, after: `${childValue}, ${parentValue}` },
        }
        current = largest
      }
    }

    // Phase 1 — build the max heap.
    yield {
      state: snap('building', null, null, null),
      operation: { type: 'INITIALIZE', detail: 'build max-heap' },
      affected: [],
      highlights: [],
      explanation: 'Phase 1 — heap construction: sift down from the last parent (n/2 - 1) to the root so every parent leads its children.',
      pseudocodeLine: 1,
      comparison: null,
      mutation: null,
    }
    for (let start = Math.floor(n / 2) - 1; start >= 0; start -= 1) {
      yield* siftDown(start, heapSize, 'building')
    }
    yield {
      state: snap('extracting', null, null, null),
      operation: { type: 'UPDATE', detail: 'max-heap built' },
      affected: work.map((_, index) => String(index)),
      highlights: [],
      explanation: 'Heap construction complete: the largest element is at the root a[0].',
      pseudocodeLine: 1,
      comparison: null,
      mutation: null,
    }

    // Phase 2 — extract the maximum one element at a time.
    for (let end = n - 1; end >= 1; end -= 1) {
      const rootValue = work[0] ?? 0
      const endValue = work[end] ?? 0
      work[0] = endValue
      work[end] = rootValue
      swapCount += 1
      heapSize = end
      yield {
        state: snap('extracting', 0, end, null),
        operation: { type: 'SWAP', detail: `extract max ${rootValue}` },
        affected: [String(0), String(end)],
        highlights: [
          { kind: 'swap', elements: [String(0), String(end)], label: 'extract' },
          { kind: 'sorted', elements: [String(end)] },
          ...extractedHighlights(),
        ],
        explanation: `Extraction: swap the root (max) ${rootValue} with the last heap element a[${end}], shrinking the heap boundary to ${end}. The extracted suffix grows.`,
        pseudocodeLine: 3,
        comparison: null,
        mutation: { target: `a[0], a[${end}]`, before: `${rootValue}, ${endValue}`, after: `${endValue}, ${rootValue}` },
      }
      if (heapSize > 1) {
        yield* siftDown(0, heapSize, 'extracting')
      }
    }

    yield {
      state: snap('done', null, null, null),
      operation: { type: 'COMPLETE' },
      affected: work.map((_, index) => String(index)),
      highlights: [{ kind: 'result', elements: work.map((_, index) => String(index)), label: 'sorted' }],
      explanation: `Array sorted after ${compareCount} comparisons and ${swapCount} swaps.`,
      pseudocodeLine: null,
      comparison: null,
      mutation: null,
    } satisfies HeapDraft
  },
}

/** Executes heap sort deterministically; returns the full step list. */
export function executeHeapSort(values: readonly number[]): AlgorithmStep<HeapState>[] {
  return executeDefinition(heapSortAlgorithm, { values })
}
