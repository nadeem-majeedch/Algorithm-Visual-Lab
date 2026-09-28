import {
  executeDefinition,
} from '../../engine'
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
 * State snapshot for comparison-sort visualizations.
 *
 * Declared as a type alias (not an interface) so it stays assignable to
 * the engine's `AlgorithmState` record contract and serializes cleanly.
 *
 * - `values`: array contents after this step's operation
 * - `sortedFrom`: first index of the guaranteed-sorted suffix
 *   (`values.length` when nothing is finalized yet, `0` when fully sorted)
 */
export type SortingState = {
  readonly values: readonly number[]
  readonly sortedFrom: number
}

export const BUBBLE_SORT_PSEUDOCODE: readonly PseudocodeLine[] = [
  { number: 1, text: 'for i from 0 to n - 2' },
  { number: 2, text: '  swapped = false' },
  { number: 3, text: '  for j from 0 to n - 2 - i' },
  { number: 4, text: '    if a[j] > a[j + 1]' },
  { number: 5, text: '      swap a[j], a[j + 1]' },
  { number: 6, text: '      swapped = true' },
  { number: 7, text: '  if not swapped: break' },
]

export const BUBBLE_SORT_COMPLEXITY: ComplexityInfo = {
  time: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
  space: 'O(1)',
}

/**
 * Bubble Sort — the reference implementation of the engine contract.
 *
 * Pure and framework-free: no React, no DOM, no timers, no randomness.
 * Every comparison and every swap is an explicit step, so the full trace
 * is deterministic and replayable. The working array is a local copy;
 * the caller's input is never mutated.
 */
export const bubbleSortAlgorithm: AlgorithmDefinition<AlgorithmInput, SortingState> = {
  metadata: {
    id: 'bubble-sort',
    label: 'Bubble Sort',
    category: 'Sorting',
    description:
      'Repeatedly compares adjacent elements and swaps them when out of order, bubbling the largest remaining value to the end of each pass.',
    complexity: BUBBLE_SORT_COMPLEXITY,
    pseudocode: BUBBLE_SORT_PSEUDOCODE,
    stable: true,
    inPlace: true,
    tags: ['comparison-sort', 'stable', 'in-place'],
  },
  createState: (input: AlgorithmInput): SortingState => ({
    values: [...input.values],
    sortedFrom: input.values.length,
  }),
  run: function* (input: AlgorithmInput): Generator<
    Omit<AlgorithmStep<SortingState>, 'step' | 'complexity'>,
    void,
    void
  > {
    const work = [...input.values]
    const n = work.length

    const compare = (j: number): AlgorithmStep<SortingState>['comparison'] => {
      const left = work[j] ?? 0
      const right = work[j + 1] ?? 0
      const result: ComparisonResult =
        left < right ? 'less' : left > right ? 'greater' : 'equal'
      return {
        left: `a[${j}] = ${left}`,
        right: `a[${j + 1}] = ${right}`,
        result,
      }
    }

    const compareHighlights = (j: number): readonly Highlight[] => [
      { kind: 'compare', elements: [String(j), String(j + 1)] },
    ]

    const compareStep = (j: number) =>
      ({
        state: { values: [...work], sortedFrom: n },
        operation: {
          type: 'COMPARE',
          detail: `a[${j}] vs a[${j + 1}]`,
        } satisfies Operation,
        affected: [String(j), String(j + 1)],
        highlights: compareHighlights(j),
        explanation: `Compare a[${j}] = ${work[j]} with a[${j + 1}] = ${work[j + 1]}.`,
        pseudocodeLine: 4,
        comparison: compare(j),
        mutation: null,
      }) satisfies Omit<AlgorithmStep<SortingState>, 'step' | 'complexity'>

    const swapStep = (j: number) => {
      const left = work[j] ?? 0
      const right = work[j + 1] ?? 0
      return {
        state: { values: [...work], sortedFrom: n },
        operation: {
          type: 'SWAP',
          detail: `a[${j}] <-> a[${j + 1}]`,
        } satisfies Operation,
        affected: [String(j), String(j + 1)],
        highlights: [{ kind: 'swap', elements: [String(j), String(j + 1)] }],
        explanation: `Swap ${left} and ${right} because they are out of order.`,
        pseudocodeLine: 5,
        comparison: null,
        mutation: {
          target: `a[${j}], a[${j + 1}]`,
          before: `${left}, ${right}`,
          after: `${right}, ${left}`,
        },
      } satisfies Omit<AlgorithmStep<SortingState>, 'step' | 'complexity'>
    }

    const passEndStep = (firstSorted: number) =>
      ({
        state: { values: [...work], sortedFrom: firstSorted },
        operation: {
          type: 'UPDATE',
          detail: `a[${firstSorted}] is in its final position`,
        } satisfies Operation,
        affected: [String(firstSorted)],
        highlights: [{ kind: 'sorted', elements: [String(firstSorted)] }],
        explanation: `Pass complete: a[${firstSorted}] = ${work[firstSorted]} is in its final position.`,
        pseudocodeLine: 1,
        comparison: null,
        mutation: null,
      }) satisfies Omit<AlgorithmStep<SortingState>, 'step' | 'complexity'>

    for (let i = 0; i <= n - 2; i += 1) {
      let swapped = false
      for (let j = 0; j <= n - 2 - i; j += 1) {
        yield compareStep(j)
        const left = work[j] ?? 0
        const right = work[j + 1] ?? 0
        if (left > right) {
          work[j] = right
          work[j + 1] = left
          swapped = true
          yield swapStep(j)
        }
      }
      yield passEndStep(n - 1 - i)
      if (!swapped) {
        break
      }
    }

    yield {
      state: { values: [...work], sortedFrom: 0 },
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
    } satisfies Omit<AlgorithmStep<SortingState>, 'step' | 'complexity'>
  },
}

/**
 * Convenience wrapper: executes bubble sort deterministically and returns
 * the complete, engine-numbered step list.
 */
export function executeBubbleSort(
  values: readonly number[],
): AlgorithmStep<SortingState>[] {
  return executeDefinition(bubbleSortAlgorithm, { values })
}
