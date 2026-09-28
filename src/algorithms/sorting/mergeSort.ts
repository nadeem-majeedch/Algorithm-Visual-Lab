import { executeDefinition } from '../../engine'
import type { AlgorithmDefinition } from '../../engine'
import type {
  AlgorithmInput,
  AlgorithmStep,
  ComparisonResult,
  ComplexityInfo,
  Operation,
  PseudocodeLine,
} from '../../engine'

/** One entry of the recursive call stack, outermost-first. */
export interface MergeRange {
  readonly lo: number
  readonly mid: number | null
  readonly hi: number
  /** Phase of this range: dividing, conquering (sorted), or merging. */
  readonly phase: 'dividing' | 'conquered' | 'merging'
}

/** Persistent temporary buffer used during merges (shown under the array). */
export interface MergeBuffer {
  /** Start index in the main array this buffer segment maps to. */
  readonly targetStart: number
  readonly values: readonly (number | null)[]
}

/**
 * State snapshot for Merge Sort.
 *
 * - `activeRanges`: the real recursion state — one entry per call frame
 *   currently on the stack, in outermost-first order
 * - `buffer`: the temporary merge workspace, `null` between merges
 * - `focus`: range the current step operates on (deepest active frame)
 * - `merging`: merge progress inside the focused range, or null
 */
export type MergeState = {
  readonly values: readonly number[]
  readonly activeRanges: readonly MergeRange[]
  readonly buffer: MergeBuffer | null
  readonly focus: { readonly lo: number; readonly hi: number } | null
  readonly dividing: { readonly lo: number; readonly mid: number; readonly hi: number } | null
  readonly merging: {
    readonly lo: number
    readonly mid: number
    readonly hi: number
    /** Left read pointer. */
    readonly i: number
    /** Right read pointer. */
    readonly j: number
    /** Write pointer into the buffer/array. */
    readonly k: number
  } | null
  readonly compareCount: number
  readonly writeCount: number
}

export const MERGE_SORT_PSEUDOCODE: readonly PseudocodeLine[] = [
  { number: 1, text: 'mergeSort(a, lo, hi)' },
  { number: 2, text: '  if lo >= hi: return' },
  { number: 3, text: '  mid = (lo + hi) / 2' },
  { number: 4, text: '  mergeSort(a, lo, mid)' },
  { number: 5, text: '  mergeSort(a, mid + 1, hi)' },
  { number: 6, text: '  merge(a, lo, mid, hi)' },
]

export const MERGE_SORT_COMPLEXITY: ComplexityInfo = {
  time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
  space: 'O(n)',
}

type MergeDraft = Omit<AlgorithmStep<MergeState>, 'step' | 'complexity'>

const EMPTY_BUFFER: MergeBuffer | null = null

function rangeFrame(lo: number, hi: number, phase: MergeRange['phase'], mid: number | null): MergeRange {
  return { lo, mid, hi, phase }
}

/**
 * Merge Sort — true recursive divide and conquer.
 *
 * Pure and framework-free: no React, no DOM, no timers, no randomness.
 * Recursion is NOT faked visually: `activeRanges` mirrors the actual
 * call stack (a frame is pushed on call, re-phase-marked when its halves
 * are sorted, popped after its merge completes), and merges read through
 * a real temporary buffer before writes land back in the array. The
 * working array is a local copy; the caller's input is never mutated.
 */
export const mergeSortAlgorithm: AlgorithmDefinition<AlgorithmInput, MergeState> = {
  metadata: {
    id: 'merge-sort',
    label: 'Merge Sort',
    category: 'Sorting',
    description:
      'Divides the array down to single elements, then merges sorted halves back together through a temporary buffer.',
    complexity: MERGE_SORT_COMPLEXITY,
    pseudocode: MERGE_SORT_PSEUDOCODE,
    stable: true,
    inPlace: false,
    tags: ['divide-and-conquer', 'stable', 'recursive'],
  },
  createState: (input: AlgorithmInput): MergeState => ({
    values: [...input.values],
    activeRanges:
      input.values.length > 1
        ? [rangeFrame(0, input.values.length - 1, 'dividing', null)]
        : [],
    buffer: EMPTY_BUFFER,
    focus: input.values.length > 1 ? { lo: 0, hi: input.values.length - 1 } : null,
    dividing: null,
    merging: null,
    compareCount: 0,
    writeCount: 0,
  }),
  run: function* (input: AlgorithmInput): Generator<MergeDraft, void, void> {
    const work = [...input.values]
    const n = work.length
    let compareCount = 0
    let writeCount = 0

    /** Snapshots the live recursion state for a step. */
    const snapshot = (
      activeRanges: readonly MergeRange[],
      extra: Partial<
        Pick<MergeState, 'buffer' | 'focus' | 'dividing' | 'merging'>
      > = {},
    ): MergeState => ({
      values: [...work],
      activeRanges: [...activeRanges],
      buffer: extra.buffer ?? EMPTY_BUFFER,
      focus: extra.focus ?? null,
      dividing: extra.dividing ?? null,
      merging: extra.merging ?? null,
      compareCount,
      writeCount,
    })

    function* mergeSort(lo: number, hi: number, stack: readonly MergeRange[]): Generator<MergeDraft> {
      if (lo >= hi) {
        return
      }
      const mid = lo + Math.floor((hi - lo) / 2)

      // DIVIDE: split the focused range at mid.
      yield {
        state: snapshot(stack, {
          focus: { lo, hi },
          dividing: { lo, mid, hi },
        }),
        operation: {
          type: 'PARTITION',
          detail: `divide a[${lo}..${hi}] at mid = ${mid}`,
        } satisfies Operation,
        affected: [String(lo), String(mid), String(hi)],
        highlights: [
          { kind: 'boundary', elements: [String(mid)], label: 'mid' },
        ],
        explanation: `DIVIDE: split a[${lo}..${hi}] into a[${lo}..${mid}] and a[${mid + 1}..${hi}]. Each half will be sorted independently before merging.`,
        pseudocodeLine: 3,
        comparison: null,
        mutation: null,
      }

      // CONQUER left: push frame, recurse.
      const leftStack = [
        ...stack.slice(0, -1),
        rangeFrame(lo, hi, 'dividing', mid),
        rangeFrame(lo, mid, 'dividing', null),
      ]
      yield {
        state: snapshot(leftStack, { focus: { lo, hi: mid } }),
        operation: {
          type: 'DISCOVER',
          detail: `recurse left a[${lo}..${mid}]`,
        } satisfies Operation,
        affected: [String(lo), String(mid)],
        highlights: [],
        explanation: `CONQUER left: recurse into a[${lo}..${mid}] until it is a single element (the base case).`,
        pseudocodeLine: 4,
        comparison: null,
        mutation: null,
      }
      yield* mergeSort(lo, mid, leftStack)

      // Left half is sorted; mark its frame.
      const leftDoneStack = [
        ...stack.slice(0, -1),
        rangeFrame(lo, hi, 'dividing', mid),
        rangeFrame(lo, mid, 'conquered', mid),
      ]
      yield {
        state: snapshot(leftDoneStack, { focus: { lo, hi: mid } }),
        operation: {
          type: 'UPDATE',
          detail: `a[${lo}..${mid}] sorted`,
        } satisfies Operation,
        affected: Array.from({ length: mid - lo + 1 }, (_, offset) => String(lo + offset)),
        highlights: Array.from({ length: mid - lo + 1 }, (_, offset) => ({
          kind: 'sorted' as const,
          elements: [String(lo + offset)],
        })),
        explanation: `Left half conquered: a[${lo}..${mid}] is fully sorted and will stay sorted until merged.`,
        pseudocodeLine: 4,
        comparison: null,
        mutation: null,
      }

      // CONQUER right.
      const rightStack = [
        ...stack.slice(0, -1),
        rangeFrame(lo, hi, 'dividing', mid),
        rangeFrame(mid + 1, hi, 'dividing', null),
      ]
      yield {
        state: snapshot(rightStack, { focus: { lo: mid + 1, hi } }),
        operation: {
          type: 'DISCOVER',
          detail: `recurse right a[${mid + 1}..${hi}]`,
        } satisfies Operation,
        affected: [String(mid + 1), String(hi)],
        highlights: [],
        explanation: `CONQUER right: recurse into a[${mid + 1}..${hi}].`,
        pseudocodeLine: 5,
        comparison: null,
        mutation: null,
      }
      yield* mergeSort(mid + 1, hi, rightStack)

      const rightDoneStack = [
        ...stack.slice(0, -1),
        rangeFrame(lo, hi, 'merging', mid),
        rangeFrame(mid + 1, hi, 'conquered', mid),
      ]
      yield {
        state: snapshot(rightDoneStack, { focus: { lo: mid + 1, hi } }),
        operation: {
          type: 'UPDATE',
          detail: `a[${mid + 1}..${hi}] sorted`,
        } satisfies Operation,
        affected: Array.from({ length: hi - mid }, (_, offset) => String(mid + 1 + offset)),
        highlights: Array.from({ length: hi - mid }, (_, offset) => ({
          kind: 'sorted' as const,
          elements: [String(mid + 1 + offset)],
        })),
        explanation: `Right half conquered: a[${mid + 1}..${hi}] is fully sorted. Both halves are ready to merge.`,
        pseudocodeLine: 5,
        comparison: null,
        mutation: null,
      }

      // MERGE: copy halves into the buffer, then write back in order.
      const bufferValues: (number | null)[] = []
      for (let index = lo; index <= hi; index += 1) {
        bufferValues.push(work[index] ?? null)
      }
      const buffer: MergeBuffer = { targetStart: lo, values: bufferValues }

      yield {
        state: snapshot(
          [...stack.slice(0, -1), rangeFrame(lo, hi, 'merging', mid)],
          { buffer, focus: { lo, hi } },
        ),
        operation: {
          type: 'MERGE',
          detail: `merge a[${lo}..${mid}] + a[${mid + 1}..${hi}]`,
        } satisfies Operation,
        affected: Array.from({ length: hi - lo + 1 }, (_, offset) => String(lo + offset)),
        highlights: [],
        explanation: `MERGE: copy both sorted halves into a temporary buffer, then interleave them back in order. This buffer is why merge sort needs O(n) auxiliary space.`,
        pseudocodeLine: 6,
        comparison: null,
        mutation: null,
      }

      let i = lo
      let j = mid + 1
      let k = lo

      while (i <= mid && j <= hi) {
        const leftValue = work[i] ?? 0
        const rightValue = work[j] ?? 0
        compareCount += 1
        const result: ComparisonResult =
          leftValue <= rightValue ? 'less' : 'greater'

        yield {
          state: snapshot(
            [...stack.slice(0, -1), rangeFrame(lo, hi, 'merging', mid)],
            {
              buffer: { targetStart: lo, values: [...bufferValues] },
              focus: { lo, hi },
              merging: { lo, mid, hi, i, j, k },
            },
          ),
          operation: {
            type: 'COMPARE',
            detail: `buffer[${i - lo}] vs buffer[${j - lo}]`,
          } satisfies Operation,
          affected: [String(i), String(j)],
          highlights: [
            { kind: 'compare', elements: [String(i)], label: 'left' },
            { kind: 'compare', elements: [String(j)], label: 'right' },
          ],
          explanation: `Compare left ${leftValue} with right ${rightValue}: ${leftValue} <= ${rightValue}, so the left element merges first. Taking from the left on ties keeps the sort stable.`,
          pseudocodeLine: 6,
          comparison: {
            left: `left[${i - lo}] = ${leftValue}`,
            right: `right[${j - lo}] = ${rightValue}`,
            result,
          },
          mutation: null,
        }

        const winner = leftValue <= rightValue ? leftValue : rightValue
        const winnerSource = leftValue <= rightValue ? 'left' : 'right'
        if (winnerSource === 'left') {
          i += 1
        } else {
          j += 1
        }
        bufferValues[k - lo] = winner
        k += 1

        yield {
          state: snapshot(
            [...stack.slice(0, -1), rangeFrame(lo, hi, 'merging', mid)],
            {
              buffer: { targetStart: lo, values: [...bufferValues] },
              focus: { lo, hi },
              merging: { lo, mid, hi, i, j, k },
            },
          ),
          operation: {
            type: 'UPDATE',
            detail: `buffer[${k - 1 - lo}] = ${winner}`,
          } satisfies Operation,
          affected: [String(k - 1)],
          highlights: [
            { kind: 'swap', elements: [String(k - 1)], label: 'merged' },
          ],
          explanation: `${winner} wins the comparison and lands in buffer position ${k - 1 - lo}.`,
          pseudocodeLine: 6,
          comparison: null,
          mutation: {
            target: `buffer[${k - 1 - lo}]`,
            before: 'empty',
            after: String(winner),
          },
        }
      }

      // Drain leftovers from the left half.
      while (i <= mid) {
        const value = work[i] ?? 0
        bufferValues[k - lo] = value
        k += 1
        i += 1
        writeCount += 1
        yield {
          state: snapshot(
            [...stack.slice(0, -1), rangeFrame(lo, hi, 'merging', mid)],
            {
              buffer: { targetStart: lo, values: [...bufferValues] },
              focus: { lo, hi },
              merging: { lo, mid, hi, i, j, k },
            },
          ),
          operation: {
            type: 'UPDATE',
            detail: `drain left ${value}`,
          } satisfies Operation,
          affected: [String(k - 1)],
          highlights: [
            { kind: 'swap', elements: [String(k - 1)], label: 'merged' },
          ],
          explanation: `Right half is exhausted; drain the remaining left elements straight into the buffer.`,
          pseudocodeLine: 6,
          comparison: null,
          mutation: {
            target: `buffer[${k - 1 - lo}]`,
            before: 'empty',
            after: String(value),
          },
        }
      }

      // Drain leftovers from the right half.
      while (j <= hi) {
        const value = work[j] ?? 0
        bufferValues[k - lo] = value
        k += 1
        j += 1
        writeCount += 1
        yield {
          state: snapshot(
            [...stack.slice(0, -1), rangeFrame(lo, hi, 'merging', mid)],
            {
              buffer: { targetStart: lo, values: [...bufferValues] },
              focus: { lo, hi },
              merging: { lo, mid, hi, i, j, k },
            },
          ),
          operation: {
            type: 'UPDATE',
            detail: `drain right ${value}`,
          } satisfies Operation,
          affected: [String(k - 1)],
          highlights: [
            { kind: 'swap', elements: [String(k - 1)], label: 'merged' },
          ],
          explanation: `Left half is exhausted; drain the remaining right elements into the buffer.`,
          pseudocodeLine: 6,
          comparison: null,
          mutation: {
            target: `buffer[${k - 1 - lo}]`,
            before: 'empty',
            after: String(value),
          },
        }
      }

      // Write the merged buffer back into the array.
      for (let offset = 0; offset < bufferValues.length; offset += 1) {
        const value = bufferValues[offset]
        if (value === null || value === undefined) {
          continue
        }
        work[lo + offset] = value
        writeCount += 1
        yield {
          state: snapshot(
            [...stack.slice(0, -1), rangeFrame(lo, hi, 'merging', mid)],
            {
              buffer: { targetStart: lo, values: [...bufferValues] },
              focus: { lo, hi },
              merging: { lo, mid, hi, i, j, k },
            },
          ),
          operation: {
            type: 'OVERWRITE',
            detail: `a[${lo + offset}] = ${value}`,
          } satisfies Operation,
          affected: [String(lo + offset)],
          highlights: [
            { kind: 'swap', elements: [String(lo + offset)], label: 'write' },
          ],
          explanation: `Write the merged value ${value} back into the array at a[${lo + offset}].`,
          pseudocodeLine: 6,
          comparison: null,
          mutation: {
            target: `a[${lo + offset}]`,
            before: 'pre-merge value',
            after: String(value),
          },
        }
      }

      // Completed merged range: pop the frame.
      yield {
        state: snapshot(stack.slice(0, -1), {
          focus: { lo, hi },
        }),
        operation: {
          type: 'UPDATE',
          detail: `a[${lo}..${hi}] merged`,
        } satisfies Operation,
        affected: Array.from({ length: hi - lo + 1 }, (_, offset) => String(lo + offset)),
        highlights: Array.from({ length: hi - lo + 1 }, (_, offset) => ({
          kind: 'sorted' as const,
          elements: [String(lo + offset)],
        })),
        explanation: `Range complete: a[${lo}..${hi}] is now one sorted run. The recursion unwinds by one frame.`,
        pseudocodeLine: 6,
        comparison: null,
        mutation: null,
      }
    }

    yield* mergeSort(0, n - 1, [rangeFrame(0, n - 1, 'dividing', null)])

    yield {
      state: snapshot([], { focus: null }),
      operation: { type: 'COMPLETE' } satisfies Operation,
      affected: work.map((_, index) => String(index)),
      highlights: [
        {
          kind: 'result',
          elements: work.map((_, index) => String(index)),
          label: 'sorted',
        },
      ],
      explanation: `Array sorted after ${compareCount} comparisons and ${writeCount} buffer writes.`,
      pseudocodeLine: null,
      comparison: null,
      mutation: null,
    } satisfies MergeDraft
  },
}

/**
 * Convenience wrapper: executes merge sort deterministically and returns
 * the complete, engine-numbered step list.
 */
export function executeMergeSort(
  values: readonly number[],
): AlgorithmStep<MergeState>[] {
  return executeDefinition(mergeSortAlgorithm, { values })
}
