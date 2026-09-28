import type { AlgorithmState, AlgorithmStep } from '../../engine'

/** Presentation view of a sorting step, erased from algorithm types. */
export interface SortViewModel {
  readonly values: readonly number[]
  /** First index of a sorted suffix (bubble/selection), else null. */
  readonly sortedFrom: number | null
  /** Exclusive end of a sorted prefix (insertion), else null. */
  readonly sortedTo: number | null
  /** Index of the key element (insertion), else null. */
  readonly keyIndex: number | null
  /** Temporary merge buffer (merge sort), else null. */
  readonly buffer: {
    readonly targetStart: number
    readonly values: readonly (number | null)[]
  } | null
}

/**
 * Adapts an engine step's state record into the visualizer view model.
 *
 * Runtime checks instead of casts on trust: state shapes vary per
 * algorithm, and the visualizer only renders the fields it knows.
 */
export function extractSortViewModel(
  step: AlgorithmStep<AlgorithmState> | null,
): SortViewModel | null {
  if (!step) {
    return null
  }
  const state = step.state as Record<string, unknown>
  if (!Array.isArray(state.values)) {
    return null
  }
  const values = state.values.map((value) => Number(value))
  const sortedFrom =
    typeof state.sortedFrom === 'number' ? state.sortedFrom : null
  const sortedTo = typeof state.sortedTo === 'number' ? state.sortedTo : null
  const keyIndex = typeof state.keyIndex === 'number' ? state.keyIndex : null

  let buffer: SortViewModel['buffer'] = null
  const rawBuffer = state.buffer
  if (
    rawBuffer !== null &&
    typeof rawBuffer === 'object' &&
    Array.isArray((rawBuffer as { values?: unknown }).values)
  ) {
    const typed = rawBuffer as { targetStart: unknown; values: unknown[] }
    buffer = {
      targetStart: Number(typed.targetStart),
      values: typed.values.map((value) =>
        value === null ? null : Number(value),
      ),
    }
  }

  return { values, sortedFrom, sortedTo, keyIndex, buffer }
}
