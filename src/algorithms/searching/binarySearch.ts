import { executeDefinition } from '../../engine'
import type { AlgorithmDefinition } from '../../engine'
import type {
  AlgorithmInput,
  AlgorithmStep,
  ComplexityInfo,
  Operation,
  PseudocodeLine,
} from '../../engine'

/**
 * State snapshot for Binary Search.
 *
 * - `low`/`high`: inclusive bounds of the remaining search interval
 * - `mid`: current probe position, or null between probes
 * - `eliminatedFrom`/`eliminatedTo`: the union of ruled-out regions
 * - `foundIndex`: match position, or null while searching
 */
export type BinarySearchState = {
  readonly values: readonly number[]
  readonly target: number
  readonly low: number
  readonly high: number
  readonly mid: number | null
  readonly probe: number | null
  readonly eliminatedFrom: number
  readonly eliminatedTo: number
  readonly foundIndex: number | null
  readonly compareCount: number
}

export const BINARY_SEARCH_PSEUDOCODE: readonly PseudocodeLine[] = [
  { number: 1, text: 'lo = 0, hi = n - 1' },
  { number: 2, text: 'while lo <= hi' },
  { number: 3, text: '  mid = lo + (hi - lo) / 2' },
  { number: 4, text: '  if a[mid] == target: return mid' },
  { number: 5, text: '  if a[mid] < target: lo = mid + 1' },
  { number: 6, text: '  else: hi = mid - 1' },
  { number: 7, text: 'return -1' },
]

export const BINARY_SEARCH_COMPLEXITY: ComplexityInfo = {
  time: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)' },
  space: 'O(1)',
}

type BinaryDraft = Omit<AlgorithmStep<BinarySearchState>, 'step' | 'complexity'>

/** Reads the search target from the input options (default: last value). */
export function searchTargetOfBinary(input: AlgorithmInput): number {
  const option = input.options?.['target']
  if (typeof option === 'number') {
    return option
  }
  return input.values[input.values.length - 1] ?? 0
}

/** True when `values` is non-decreasing — binary search's precondition. */
export function isSortedAscending(values: readonly number[]): boolean {
  for (let index = 1; index < values.length; index += 1) {
    if ((values[index] ?? 0) < (values[index - 1] ?? 0)) {
      return false
    }
  }
  return true
}

/**
 * Binary Search — halves a sorted interval each step.
 *
 * Pure and framework-free. Each probe produces explicit steps: interval
 * readout, comparison, match/elimination of half the interval. The
 * precondition (sorted input) is exposed as `isSortedAscending` so the
 * UI can warn BEFORE running — binary search on unsorted data silently
 * returns wrong answers. The caller's input is never mutated.
 */
export const binarySearchAlgorithm: AlgorithmDefinition<AlgorithmInput, BinarySearchState> = {
  metadata: {
    id: 'binary-search',
    label: 'Binary Search',
    category: 'Searching',
    description:
      'Halves a sorted range each step by comparing against the middle element.',
    complexity: BINARY_SEARCH_COMPLEXITY,
    pseudocode: BINARY_SEARCH_PSEUDOCODE,
    stable: true,
    inPlace: true,
    tags: ['search', 'sorted-input-required'],
  },
  createState: (input: AlgorithmInput): BinarySearchState => ({
    values: [...input.values],
    target: searchTargetOfBinary(input),
    low: 0,
    high: input.values.length - 1,
    mid: null,
    probe: null,
    eliminatedFrom: 0,
    eliminatedTo: -1,
    foundIndex: null,
    compareCount: 0,
  }),
  run: function* (input: AlgorithmInput): Generator<BinaryDraft, void, void> {
    const work = [...input.values]
    const target = searchTargetOfBinary(input)
    const n = work.length
    let low = 0
    let high = n - 1
    let eliminatedFrom = 0
    let eliminatedTo = -1
    let compareCount = 0

    const snap = (
      mid: number | null,
      probe: number | null,
      foundIndex: number | null,
    ): BinarySearchState => ({
      values: [...work],
      target,
      low,
      high,
      mid,
      probe,
      eliminatedFrom,
      eliminatedTo,
      foundIndex,
      compareCount,
    })

    yield {
      state: snap(null, null, null),
      operation: { type: 'INITIALIZE', detail: `target = ${target}` } satisfies Operation,
      affected: [],
      highlights: [],
      explanation: `Searching for ${target} in a sorted array. The interval [${low}, ${high}] is the full range; every step eliminates half of it.`,
      pseudocodeLine: 1,
      comparison: null,
      mutation: null,
    }

    while (low <= high) {
      const mid = low + Math.floor((high - low) / 2)
      const candidate = work[mid] ?? 0
      compareCount += 1

      yield {
        state: snap(mid, mid, null),
        operation: { type: 'SELECT', detail: `mid = ${mid}` } satisfies Operation,
        affected: [String(mid)],
        highlights: [{ kind: 'selected', elements: [String(mid)], label: 'mid' }],
        explanation: `Midpoint of [${low}, ${high}] is ${mid}: a[${mid}] = ${candidate}.`,
        pseudocodeLine: 3,
        comparison: null,
        mutation: null,
      }

      const isEqual = candidate === target
      const isLess = candidate < target
      compareCount += 0

      yield {
        state: snap(mid, mid, isEqual ? mid : null),
        operation: {
          type: 'COMPARE',
          detail: `a[${mid}] vs target (${isEqual ? 'equal' : isLess ? 'less' : 'greater'})`,
        } satisfies Operation,
        affected: [String(mid)],
        highlights: [
          isEqual
            ? { kind: 'result', elements: [String(mid)], label: 'match' }
            : { kind: 'compare', elements: [String(mid)] },
        ],
        explanation: isEqual
          ? `Match! a[${mid}] = ${candidate} equals the target ${target}.`
          : isLess
            ? `a[${mid}] = ${candidate} < ${target}: the target must be to the RIGHT. The left half is eliminated.`
            : `a[${mid}] = ${candidate} > ${target}: the target must be to the LEFT. The right half is eliminated.`,
        pseudocodeLine: 4,
        comparison: {
          left: `a[${mid}] = ${candidate}`,
          right: `target = ${target}`,
          result: isEqual ? 'equal' : isLess ? 'less' : 'greater',
        },
        mutation: null,
      }

      if (isEqual) {
        eliminatedFrom = isEqual ? Math.min(eliminatedFrom, low) : eliminatedFrom
        yield {
          state: snap(mid, null, mid),
          operation: { type: 'SELECT', detail: `found at index ${mid}` } satisfies Operation,
          affected: [String(mid)],
          highlights: [{ kind: 'result', elements: [String(mid)], label: `found: a[${mid}]` }],
          explanation: `Termination: target ${target} found at index ${mid} after ${compareCount} comparison${compareCount === 1 ? '' : 's'}.`,
          pseudocodeLine: 4,
          comparison: null,
          mutation: null,
        }
        return
      }

      if (isLess) {
        eliminatedTo = mid
        low = mid + 1
        yield {
          state: snap(null, null, null),
          operation: {
            type: 'UPDATE',
            detail: `interval becomes [${low}, ${high}]`,
          } satisfies Operation,
          affected: Array.from(
            { length: mid - eliminatedFrom + 1 },
            (_, offset) => String(eliminatedFrom + offset),
          ),
          highlights: Array.from(
            { length: mid - eliminatedFrom + 1 },
            (_, offset) => ({
              kind: 'visited' as const,
              elements: [String(eliminatedFrom + offset)],
              label: 'eliminated',
            }),
          ),
          explanation: `Discard a[${eliminatedFrom}..${mid}]: everything there is ≤ ${candidate} < ${target}. Remaining interval: [${low}, ${high}].`,
          pseudocodeLine: 5,
          comparison: null,
          mutation: null,
        }
      } else {
        eliminatedFrom = mid + 1
        high = mid - 1
        yield {
          state: snap(null, null, null),
          operation: {
            type: 'UPDATE',
            detail: `interval becomes [${low}, ${high}]`,
          } satisfies Operation,
          affected: Array.from(
            { length: n - eliminatedFrom },
            (_, offset) => String(eliminatedFrom + offset),
          ),
          highlights: Array.from(
            { length: n - eliminatedFrom },
            (_, offset) => ({
              kind: 'visited' as const,
              elements: [String(eliminatedFrom + offset)],
              label: 'eliminated',
            }),
          ),
          explanation: `Discard a[${mid + 1}..${n - 1}]: everything there is ≥ ${candidate} > ${target}. Remaining interval: [${low}, ${high}].`,
          pseudocodeLine: 6,
          comparison: null,
          mutation: null,
        }
      }
    }

    yield {
      state: snap(null, null, null),
      operation: { type: 'COMPLETE' } satisfies Operation,
      affected: [],
      highlights: [],
      explanation: `Termination: the interval is empty (low ${low} > high ${high}) after ${compareCount} comparisons. Target ${target} is not present.`,
      pseudocodeLine: 7,
      comparison: null,
      mutation: null,
    }
  },
}

/** Executes binary search deterministically; returns the full step list. */
export function executeBinarySearch(
  values: readonly number[],
  target: number,
): AlgorithmStep<BinarySearchState>[] {
  return executeDefinition(binarySearchAlgorithm, { values, options: { target } })
}
