import { executeDefinition } from '../../engine'
import type { AlgorithmDefinition } from '../../engine'
import type {
  AlgorithmInput,
  AlgorithmStep,
  ComparisonResult,
  ComplexityInfo,
  Highlight,
  Operation,
  PseudocodeLine,
} from '../../engine'

/**
 * State snapshot for Selection Sort.
 *
 * - `sortedFrom`: first index of the guaranteed-sorted suffix
 *   (`values.length` when nothing is finalized, `0` when fully sorted)
 * - `currentIndex`: position being filled this pass, or null
 * - `minIndex`: current minimum candidate of this pass, or null
 */
export type SelectionState = {
  readonly values: readonly number[]
  readonly sortedFrom: number
  readonly currentIndex: number | null
  readonly minIndex: number | null
}

export const SELECTION_SORT_PSEUDOCODE: readonly PseudocodeLine[] = [
  { number: 1, text: 'for i from 0 to n - 2' },
  { number: 2, text: '  min = i' },
  { number: 3, text: '  for j from i + 1 to n - 1' },
  { number: 4, text: '    if a[j] < a[min]' },
  { number: 5, text: '      min = j' },
  { number: 6, text: '  swap a[i], a[min]' },
]

export const SELECTION_SORT_COMPLEXITY: ComplexityInfo = {
  time: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)' },
  space: 'O(1)',
}

type SelectionDraft = Omit<AlgorithmStep<SelectionState>, 'step' | 'complexity'>

/**
 * Selection Sort — scans the unsorted region for its minimum and swaps
 * it into the boundary position.
 *
 * Pure and framework-free: no React, no DOM, no timers, no randomness.
 * Every position mark, comparison, minimum update, and swap is an
 * explicit deterministic step. Unlike Bubble Sort there is no early
 * exit: each pass always scans the full remaining region, so even a
 * sorted input costs O(n²) comparisons. The working array is a local
 * copy; the caller's input is never mutated.
 */
export const selectionSortAlgorithm: AlgorithmDefinition<AlgorithmInput, SelectionState> = {
  metadata: {
    id: 'selection-sort',
    label: 'Selection Sort',
    category: 'Sorting',
    description:
      'Scans the unsorted region for the smallest element and swaps it into the boundary of the sorted suffix.',
    complexity: SELECTION_SORT_COMPLEXITY,
    pseudocode: SELECTION_SORT_PSEUDOCODE,
    stable: false,
    inPlace: true,
    tags: ['comparison-sort', 'in-place'],
  },
  createState: (input: AlgorithmInput): SelectionState => ({
    values: [...input.values],
    sortedFrom: input.values.length,
    currentIndex: null,
    minIndex: null,
  }),
  run: function* (input: AlgorithmInput): Generator<SelectionDraft, void, void> {
    const work = [...input.values]
    const n = work.length

    const regionHighlights = (sortedFrom: number): readonly Highlight[] =>
      Array.from({ length: n - sortedFrom }, (_, offset) => ({
        kind: 'sorted' as const,
        elements: [String(sortedFrom + offset)],
      }))

    for (let i = 0; i <= n - 2; i += 1) {
      let min = i

      // SELECT: open the pass at position i with a[i] as the minimum.
      yield {
        state: {
          values: [...work],
          sortedFrom: i,
          currentIndex: i,
          minIndex: min,
        },
        operation: {
          type: 'SELECT',
          detail: `pass i = ${i}: min = a[${i}] = ${work[i]}`,
        } satisfies Operation,
        affected: [String(i)],
        highlights: [
          { kind: 'selected', elements: [String(i)], label: 'position' },
          { kind: 'selected', elements: [String(min)], label: 'min' },
        ],
        explanation: `Pass ${i + 1}: assume a[${i}] = ${work[i]} is the minimum of the unsorted region a[${i}..${n - 1}].`,
        pseudocodeLine: 2,
        comparison: null,
        mutation: null,
      }

      for (let j = i + 1; j <= n - 1; j += 1) {
        const candidate = work[j] ?? 0
        const currentMin = work[min] ?? 0
        const result: ComparisonResult =
          candidate < currentMin
            ? 'less'
            : candidate > currentMin
              ? 'greater'
              : 'equal'

        // COMPARE candidate against the running minimum.
        yield {
          state: {
            values: [...work],
            sortedFrom: i,
            currentIndex: i,
            minIndex: min,
          },
          operation: {
            type: 'COMPARE',
            detail: `a[${j}] vs a[${min}]`,
          } satisfies Operation,
          affected: [String(j), String(min)],
          highlights: [
            { kind: 'compare', elements: [String(j)], label: 'candidate' },
            { kind: 'selected', elements: [String(min)], label: 'min' },
          ],
          explanation: `Compare a[${j}] = ${candidate} with the current minimum a[${min}] = ${currentMin}.`,
          pseudocodeLine: 4,
          comparison: {
            left: `a[${j}] = ${candidate}`,
            right: `a[${min}] = ${currentMin}`,
            result,
          },
          mutation: null,
        }

        if (candidate < currentMin) {
          min = j

          // UPDATE: a new minimum is found.
          yield {
            state: {
              values: [...work],
              sortedFrom: i,
              currentIndex: i,
              minIndex: min,
            },
            operation: {
              type: 'UPDATE',
              detail: `min = ${j}`,
            } satisfies Operation,
            affected: [String(j)],
            highlights: [
              { kind: 'selected', elements: [String(j)], label: 'new min' },
            ],
            explanation: `${candidate} < ${currentMin}: update the minimum to a[${j}] = ${candidate}.`,
            pseudocodeLine: 5,
            comparison: null,
            mutation: null,
          }
        }
      }

      if (min !== i) {
        const boundary = work[i] ?? 0
        const minimum = work[min] ?? 0
        work[i] = minimum
        work[min] = boundary

        // SWAP the minimum into the boundary position.
        yield {
          state: {
            values: [...work],
            sortedFrom: i,
            currentIndex: i,
            minIndex: min,
          },
          operation: {
            type: 'SWAP',
            detail: `a[${i}] <-> a[${min}]`,
          } satisfies Operation,
          affected: [String(i), String(min)],
          highlights: [
            { kind: 'swap', elements: [String(i), String(min)] },
          ],
          explanation: `Swap a[${i}] = ${boundary} with the minimum a[${min}] = ${minimum}. Selection sort is not stable: this swap can reorder equal elements.`,
          pseudocodeLine: 6,
          comparison: null,
          mutation: {
            target: `a[${i}], a[${min}]`,
            before: `${boundary}, ${minimum}`,
            after: `${minimum}, ${boundary}`,
          },
        }
      }

      // UPDATE: the boundary element is final; the suffix grows.
      yield {
        state: {
          values: [...work],
          sortedFrom: i + 1,
          currentIndex: null,
          minIndex: null,
        },
        operation: {
          type: 'UPDATE',
          detail: `a[${i}] is final`,
        } satisfies Operation,
        affected: [String(i)],
        highlights: regionHighlights(i + 1),
        explanation: `a[${i}] = ${work[i]} is in its final position. Sorted suffix: a[${i + 1}..${n - 1}].`,
        pseudocodeLine: 1,
        comparison: null,
        mutation: null,
      }
    }

    yield {
      state: {
        values: [...work],
        sortedFrom: 0,
        currentIndex: null,
        minIndex: null,
      },
      operation: { type: 'COMPLETE' } satisfies Operation,
      affected: work.map((_, index) => String(index)),
      highlights: [
        {
          kind: 'result',
          elements: work.map((_, index) => String(index)),
          label: 'sorted',
        },
      ],
      explanation: 'Array sorted.',
      pseudocodeLine: null,
      comparison: null,
      mutation: null,
    } satisfies SelectionDraft
  },
}

/**
 * Convenience wrapper: executes selection sort deterministically and
 * returns the complete, engine-numbered step list.
 */
export function executeSelectionSort(
  values: readonly number[],
): AlgorithmStep<SelectionState>[] {
  return executeDefinition(selectionSortAlgorithm, { values })
}
