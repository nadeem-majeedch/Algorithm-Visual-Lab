import { expect } from 'vitest'
import type { AlgorithmState, AlgorithmStep } from '../../engine'

export interface RunResult<S extends AlgorithmState> {
  readonly steps: readonly AlgorithmStep<S>[]
  readonly finalValues: readonly number[]
}

/** Executes a registered sorting algorithm and extracts the final array. */
export function runSortingAlgorithm<S extends AlgorithmState>(
  steps: readonly AlgorithmStep<S>[],
): RunResult<S> {
  const last = steps[steps.length - 1]
  if (!last) {
    throw new Error('Algorithm produced no steps')
  }
  const raw = (last.state as { values?: unknown }).values
  if (!Array.isArray(raw)) {
    throw new Error('Final state has no values array')
  }
  return { steps, finalValues: raw.map((value) => Number(value)) }
}

/** Standard correctness expectations shared by every sorting algorithm. */
export function expectSorted(
  finalValues: readonly number[],
  input: readonly number[],
): void {
  expect(finalValues).toHaveLength(input.length)
  const expected = [...input].sort((a, b) => a - b)
  expect(finalValues).toEqual(expected)
}

/** Asserts step numbering is consecutive from zero. */
export function expectConsecutiveSteps(
  steps: readonly AlgorithmStep<AlgorithmState>[],
): void {
  steps.forEach((step, index) => {
    expect(step.step).toBe(index)
  })
}

/** Asserts the run is bracketed by INITIALIZE and COMPLETE. */
export function expectEnvelope(
  steps: readonly AlgorithmStep<AlgorithmState>[],
): void {
  expect(steps[0]?.operation.type).toBe('INITIALIZE')
  expect(steps[steps.length - 1]?.operation.type).toBe('COMPLETE')
}

/** Asserts two runs over the same input are identical (determinism). */
export function expectDeterministic(
  a: readonly AlgorithmStep<AlgorithmState>[],
  b: readonly AlgorithmStep<AlgorithmState>[],
): void {
  expect(a.length).toBe(b.length)
  expect(JSON.stringify(a)).toBe(JSON.stringify(b))
}
