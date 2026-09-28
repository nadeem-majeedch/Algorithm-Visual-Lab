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
 * State snapshot for Insertion Sort.
 *
 * Unlike Bubble Sort (sorted suffix), Insertion Sort grows a sorted
 * PREFIX: `sortedTo` is the exclusive end of the sorted region, i.e. the
 * number of leading elements guaranteed sorted. `keyIndex` marks the
 * element currently being inserted, or null between iterations.
 *
 * Type alias (not interface) to satisfy the engine's AlgorithmState
 * record contract and to stay JSON-serializable.
 */
export type InsertionState = {
  readonly values: readonly number[]
  /** Exclusive end of the sorted prefix: values[0..sortedTo) sorted. */
  readonly sortedTo: number
  /** Index of the key being inserted, or null between iterations. */
  readonly keyIndex: number | null
}

export const INSERTION_SORT_PSEUDOCODE: readonly PseudocodeLine[] = [
  { number: 1, text: 'for i from 1 to n - 1' },
  { number: 2, text: '  key = a[i]' },
  { number: 3, text: '  j = i - 1' },
  { number: 4, text: '  while j >= 0 and a[j] > key' },
  { number: 5, text: '    a[j + 1] = a[j]' },
  { number: 6, text: '    j = j - 1' },
  { number: 7, text: '  a[j + 1] = key' },
]

export const INSERTION_SORT_COMPLEXITY: ComplexityInfo = {
  time: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
  space: 'O(1)',
}

type InsertionDraft = Omit<AlgorithmStep<InsertionState>, 'step' | 'complexity'>

/**
 * Insertion Sort — builds a sorted prefix one element at a time.
 *
 * Pure and framework-free: no React, no DOM, no timers, no randomness.
 * Every key selection, comparison, shift, and insertion is an explicit
 * deterministic step. Elements are SHIFTED (not swapped) right to open
 * the key's slot — this is what preserves stability: an element never
 * jumps over an equal element. The working array is a local copy; the
 * caller's input is never mutated.
 */
export const insertionSortAlgorithm: AlgorithmDefinition<AlgorithmInput, InsertionState> = {
  metadata: {
    id: 'insertion-sort',
    label: 'Insertion Sort',
    category: 'Sorting',
    description:
      'Builds a sorted prefix by taking each element (the key) and shifting larger elements right until the key drops into place.',
    complexity: INSERTION_SORT_COMPLEXITY,
    pseudocode: INSERTION_SORT_PSEUDOCODE,
    stable: true,
    inPlace: true,
    tags: ['comparison-sort', 'stable', 'in-place', 'online'],
  },
  createState: (input: AlgorithmInput): InsertionState => ({
    values: [...input.values],
    sortedTo: Math.min(1, input.values.length),
    keyIndex: null,
  }),
  run: function* (input: AlgorithmInput): Generator<InsertionDraft, void, void> {
    const work = [...input.values]
    const n = work.length

    const compare = (j: number, key: number): InsertionDraft['comparison'] => {
      const left = work[j] ?? 0
      const result: ComparisonResult =
        left < key ? 'less' : left > key ? 'greater' : 'equal'
      return {
        left: `a[${j}] = ${left}`,
        right: `key = ${key}`,
        result,
      }
    }

    const regionHighlights = (sortedTo: number): readonly Highlight[] =>
      Array.from({ length: sortedTo }, (_, index) => ({
        kind: 'sorted' as const,
        elements: [String(index)],
      }))

    for (let i = 1; i <= n - 1; i += 1) {
      const key = work[i] ?? 0

      // SELECT: lift the key out of the unsorted region.
      yield {
        state: { values: [...work], sortedTo: i, keyIndex: i },
        operation: {
          type: 'SELECT',
          detail: `key = a[${i}] = ${key}`,
        } satisfies Operation,
        affected: [String(i)],
        highlights: [
          { kind: 'selected', elements: [String(i)], label: 'key' },
          ...regionHighlights(i),
        ],
        explanation: `Select a[${i}] = ${key} as the key. The prefix a[0..${i - 1}] is already sorted; the key will be inserted into it.`,
        pseudocodeLine: 2,
        comparison: null,
        mutation: null,
      }

      let j = i - 1
      let shiftCount = 0

      // COMPARE/SHIFT loop: walk left while elements exceed the key.
      while (j >= 0 && (work[j] ?? 0) > key) {
        const left = work[j] ?? 0

        yield {
          state: { values: [...work], sortedTo: i, keyIndex: i },
          operation: {
            type: 'COMPARE',
            detail: `a[${j}] vs key`,
          } satisfies Operation,
          affected: [String(j), String(i)],
          highlights: [
            { kind: 'compare', elements: [String(j)] },
            { kind: 'selected', elements: [String(i)], label: 'key' },
          ],
          explanation: `Compare a[${j}] = ${left} with the key ${key}: ${left} > ${key}, so a[${j}] must move one slot right.`,
          pseudocodeLine: 4,
          comparison: compare(j, key),
          mutation: null,
        }

        work[j + 1] = left
        shiftCount += 1

        yield {
          state: { values: [...work], sortedTo: i, keyIndex: i },
          operation: {
            type: 'UPDATE',
            detail: `shift a[${j}] -> a[${j + 1}]`,
          } satisfies Operation,
          affected: [String(j + 1), String(j)],
          highlights: [
            { kind: 'swap', elements: [String(j + 1)], label: 'shifted' },
            { kind: 'selected', elements: [String(i)], label: 'key' },
          ],
          explanation: `Shift ${left} from a[${j}] to a[${j + 1}] to open a slot for the key. Shifting (instead of swapping) preserves stability.`,
          pseudocodeLine: 5,
          comparison: null,
          mutation: {
            target: `a[${j + 1}]`,
            before: String(work[j + 2] ?? '—'),
            after: String(left),
          },
        }

        j -= 1
      }

      // Boundary compare when the while-condition stopped the walk.
      if (j >= 0) {
        const left = work[j] ?? 0
        yield {
          state: { values: [...work], sortedTo: i, keyIndex: i },
          operation: {
            type: 'COMPARE',
            detail: `a[${j}] vs key`,
          } satisfies Operation,
          affected: [String(j), String(i)],
          highlights: [
            { kind: 'compare', elements: [String(j)] },
            { kind: 'selected', elements: [String(i)], label: 'key' },
          ],
          explanation: `Compare a[${j}] = ${left} with the key ${key}: ${left} <= ${key}, so the key belongs at a[${j + 1}].`,
          pseudocodeLine: 4,
          comparison: compare(j, key),
          mutation: null,
        }
      }

      // INSERT: drop the key into its slot.
      work[j + 1] = key
      yield {
        state: { values: [...work], sortedTo: i + 1, keyIndex: j + 1 },
        operation: {
          type: 'INSERT',
          detail: `a[${j + 1}] = key = ${key}`,
        } satisfies Operation,
        affected: [String(j + 1)],
        highlights: [
          { kind: 'selected', elements: [String(j + 1)], label: 'inserted' },
          ...regionHighlights(i + 1),
        ],
        explanation:
          shiftCount > 0
            ? `Insert the key ${key} at a[${j + 1}] after ${shiftCount} shift${shiftCount === 1 ? '' : 's'}. The sorted prefix grows to ${i + 1} element${i + 1 === 1 ? '' : 's'}.`
            : `Insert the key ${key} at a[${j + 1}] with no shifts needed. The sorted prefix grows to ${i + 1} element${i + 1 === 1 ? '' : 's'}.`,
        pseudocodeLine: 7,
        comparison: null,
        mutation: {
          target: `a[${j + 1}]`,
          before: 'key slot',
          after: String(key),
        },
      }

      // Sorted-region expansion marker.
      yield {
        state: { values: [...work], sortedTo: i + 1, keyIndex: null },
        operation: {
          type: 'UPDATE',
          detail: `sorted prefix: a[0..${i}]`,
        } satisfies Operation,
        affected: Array.from({ length: i + 1 }, (_, index) => String(index)),
        highlights: regionHighlights(i + 1),
        explanation: `Sorted region expanded: a[0..${i}] is sorted. ${n - 1 - i === 0 ? 'No elements remain.' : `${n - 1 - i} element${n - 1 - i === 1 ? '' : 's'} remain unsorted.`}`,
        pseudocodeLine: 1,
        comparison: null,
        mutation: null,
      }
    }

    yield {
      state: {
        values: [...work],
        sortedTo: n,
        keyIndex: null,
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
    } satisfies InsertionDraft
  },
}

/**
 * Convenience wrapper: executes insertion sort deterministically and
 * returns the complete, engine-numbered step list.
 */
export function executeInsertionSort(
  values: readonly number[],
): AlgorithmStep<InsertionState>[] {
  return executeDefinition(insertionSortAlgorithm, { values })
}
