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
 * State snapshot for Linear Search.
 *
 * - `currentIndex`: the index holding the probe, or null when finished
 * - `eliminatedTo`: every index below this has been ruled out
 * - `foundIndex`: the match position, or null while searching
 */
export type LinearSearchState = {
  readonly values: readonly number[]
  readonly target: number
  readonly currentIndex: number | null
  readonly probe: number | null
  readonly eliminatedTo: number
  readonly foundIndex: number | null
  readonly compareCount: number
}

export const LINEAR_SEARCH_PSEUDOCODE: readonly PseudocodeLine[] = [
  { number: 1, text: 'for i from 0 to n - 1' },
  { number: 2, text: '  if a[i] == target' },
  { number: 3, text: '    return i' },
  { number: 4, text: 'return -1' },
]

export const LINEAR_SEARCH_COMPLEXITY: ComplexityInfo = {
  time: { best: 'O(1)', average: 'O(n)', worst: 'O(n)' },
  space: 'O(1)',
}

type LinearDraft = Omit<AlgorithmStep<LinearSearchState>, 'step' | 'complexity'>

/** Reads the search target from the input options (default: last value). */
export function searchTargetOf(input: AlgorithmInput): number {
  const option = input.options?.['target']
  if (typeof option === 'number') {
    return option
  }
  return input.values[input.values.length - 1] ?? 0
}

/**
 * Linear Search — scans every element in order until the target appears.
 *
 * Pure and framework-free. Each index produces two explicit steps: the
 * comparison (match or non-match) and the elimination marker. Works on
 * unsorted data; the caller's input is never mutated.
 */
export const linearSearchAlgorithm: AlgorithmDefinition<AlgorithmInput, LinearSearchState> = {
  metadata: {
    id: 'linear-search',
    label: 'Linear Search',
    category: 'Searching',
    description:
      'Scans every element in order until the target is found, then reports its index.',
    complexity: LINEAR_SEARCH_COMPLEXITY,
    pseudocode: LINEAR_SEARCH_PSEUDOCODE,
    stable: true,
    inPlace: true,
    tags: ['search', 'unsorted-input'],
  },
  createState: (input: AlgorithmInput): LinearSearchState => ({
    values: [...input.values],
    target: searchTargetOf(input),
    currentIndex: input.values.length > 0 ? 0 : null,
    probe: null,
    eliminatedTo: 0,
    foundIndex: null,
    compareCount: 0,
  }),
  run: function* (input: AlgorithmInput): Generator<LinearDraft, void, void> {
    const work = [...input.values]
    const target = searchTargetOf(input)
    const n = work.length
    let compareCount = 0

    const snap = (
      currentIndex: number | null,
      probe: number | null,
      eliminatedTo: number,
      foundIndex: number | null,
    ): LinearSearchState => ({
      values: [...work],
      target,
      currentIndex,
      probe,
      eliminatedTo,
      foundIndex,
      compareCount,
    })

    yield {
      state: snap(n > 0 ? 0 : null, null, 0, null),
      operation: { type: 'INITIALIZE', detail: `target = ${target}` } satisfies Operation,
      affected: [],
      highlights: [],
      explanation: `Searching for ${target} from left to right. Linear search makes no assumptions about order.`,
      pseudocodeLine: 1,
      comparison: null,
      mutation: null,
    }

    for (let index = 0; index < n; index += 1) {
      const candidate = work[index] ?? 0
      compareCount += 1
      const isMatch = candidate === target

      yield {
        state: snap(index, index, index, isMatch ? index : null),
        operation: {
          type: 'COMPARE',
          detail: `a[${index}] vs target (${isMatch ? 'match' : 'non-match'})`,
        } satisfies Operation,
        affected: [String(index)],
        highlights: [
          isMatch
            ? { kind: 'result', elements: [String(index)], label: 'match' }
            : { kind: 'compare', elements: [String(index)], label: 'probing' },
        ],
        explanation: isMatch
          ? `Match! a[${index}] = ${candidate} equals the target ${target}.`
          : `Compare a[${index}] = ${candidate} with the target ${target}: not equal, keep scanning.`,
        pseudocodeLine: 2,
        comparison: {
          left: `a[${index}] = ${candidate}`,
          right: `target = ${target}`,
          result: candidate === target ? 'equal' : candidate < target ? 'less' : 'greater',
        },
        mutation: null,
      }

      if (isMatch) {
        yield {
          state: snap(index, null, index + 1, index),
          operation: { type: 'SELECT', detail: `found at index ${index}` } satisfies Operation,
          affected: [String(index)],
          highlights: [{ kind: 'result', elements: [String(index)], label: `found: a[${index}]` }],
          explanation: `Termination: target ${target} found at index ${index} after ${compareCount} comparison${compareCount === 1 ? '' : 's'}.`,
          pseudocodeLine: 3,
          comparison: null,
          mutation: null,
        }
        return
      }

      yield {
        state: snap(index < n - 1 ? index + 1 : null, null, index + 1, null),
        operation: {
          type: 'UPDATE',
          detail: `a[${index}] eliminated`,
        } satisfies Operation,
        affected: [String(index)],
        highlights: [{ kind: 'visited', elements: [String(index)], label: 'eliminated' }],
        explanation: `a[${index}] is not the target — mark it eliminated. ${n - 1 - index} element${n - 1 - index === 1 ? '' : 's'} remain.`,
        pseudocodeLine: 1,
        comparison: null,
        mutation: null,
      }
    }

    yield {
      state: snap(null, null, n, null),
      operation: { type: 'COMPLETE' } satisfies Operation,
      affected: work.map((_, index) => String(index)),
      highlights: [
        { kind: 'visited', elements: work.map((_, index) => String(index)), label: 'no match' },
      ],
      explanation: `Termination: the whole array was scanned (${compareCount} comparisons) and the target ${target} is not present.`,
      pseudocodeLine: 4,
      comparison: null,
      mutation: null,
    }
  },
}

/** Executes linear search deterministically; returns the full step list. */
export function executeLinearSearch(
  values: readonly number[],
  target: number,
): AlgorithmStep<LinearSearchState>[] {
  return executeDefinition(linearSearchAlgorithm, { values, options: { target } })
}
