import { deepFreeze } from './freeze'
import type {
  AlgorithmInput,
  AlgorithmMetadata,
  AlgorithmState,
  AlgorithmStep,
  ComplexityInfo,
} from './models'

/**
 * What an algorithm yields while running: a complete step description
 * without engine-assigned fields. The engine numbers steps, freezes
 * snapshots, and defaults complexity to the definition's metadata.
 */
export type StepDraft<TState extends AlgorithmState = AlgorithmState> = Omit<
  AlgorithmStep<TState>,
  'step' | 'complexity'
> & {
  readonly complexity?: ComplexityInfo
}

/**
 * A deterministic, framework-independent algorithm.
 *
 * `createState` and `run` must be pure: the same input always produces
 * the same steps, and neither function may mutate anything outside its
 * local scope. State snapshots are yielded fresh per step and are frozen
 * by the engine on arrival.
 */
export interface AlgorithmDefinition<
  TInput extends AlgorithmInput = AlgorithmInput,
  TState extends AlgorithmState = AlgorithmState,
> {
  readonly metadata: AlgorithmMetadata
  /** Builds the initial state from the input. Must be pure. */
  readonly createState: (input: TInput) => TState
  /** Deterministically yields every step after initialization. */
  readonly run: (input: TInput) => Generator<StepDraft<TState>, void, void>
}

/** Vocabulary alias: an Algorithm is its executable definition. */
export type Algorithm<
  TInput extends AlgorithmInput = AlgorithmInput,
  TState extends AlgorithmState = AlgorithmState,
> = AlgorithmDefinition<TInput, TState>

function freezeStep<TState extends AlgorithmState>(
  step: AlgorithmStep<TState>,
): AlgorithmStep<TState> {
  return deepFreeze(step)
}

/**
 * Executes a definition deterministically and returns the full step list.
 *
 * Guarantees:
 * - step 0 is always an INITIALIZE step carrying the initial state,
 * - step numbers are consecutive from zero,
 * - the final step is always COMPLETE (appended when the run omits it),
 * - every state snapshot is deep-frozen and safe for history/replay.
 */
export function executeDefinition<
  TInput extends AlgorithmInput,
  TState extends AlgorithmState,
>(
  definition: AlgorithmDefinition<TInput, TState>,
  input: TInput,
): AlgorithmStep<TState>[] {
  const { metadata } = definition
  const complexity: ComplexityInfo = metadata.complexity
  const initialState = deepFreeze(definition.createState(input))

  const steps: AlgorithmStep<TState>[] = [
    freezeStep({
      step: 0,
      state: initialState,
      operation: { type: 'INITIALIZE', detail: `prepare ${metadata.label}` },
      affected: [],
      highlights: [],
      explanation: `Initialize ${metadata.label} with the provided input.`,
      pseudocodeLine: null,
      comparison: null,
      mutation: null,
      complexity,
    }),
  ]

  let nextStepNumber = 1
  for (const draft of definition.run(input)) {
    steps.push(
      freezeStep({
        ...draft,
        step: nextStepNumber,
        state: deepFreeze(draft.state),
        complexity: draft.complexity ?? complexity,
      }),
    )
    nextStepNumber += 1
  }

  const lastStep = steps[steps.length - 1]
  if (!lastStep || lastStep.operation.type !== 'COMPLETE') {
    const finalState = lastStep ? lastStep.state : initialState
    steps.push(
      freezeStep({
        step: nextStepNumber,
        state: finalState,
        operation: { type: 'COMPLETE' },
        affected: [],
        highlights: [],
        explanation: `${metadata.label} finished.`,
        pseudocodeLine: null,
        comparison: null,
        mutation: null,
        complexity,
      }),
    )
  }

  return steps
}
