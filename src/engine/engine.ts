import { executeDefinition } from './definition'
import type { AlgorithmDefinition } from './definition'
import { deriveStatus } from './models'
import type {
  AlgorithmInput,
  AlgorithmState,
  AlgorithmStep,
  ExecutionStatus,
} from './models'

/** Immutable view of the engine position and the current step. */
export interface EngineSnapshot<
  TState extends AlgorithmState = AlgorithmState,
> {
  readonly currentStep: number
  readonly totalSteps: number
  readonly isComplete: boolean
  readonly status: ExecutionStatus
  /** Current step record, or null for an empty run. */
  readonly step: AlgorithmStep<TState> | null
}

function validateSteps<TState extends AlgorithmState>(
  steps: readonly AlgorithmStep<TState>[],
): void {
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index]
    if (!step || step.step !== index) {
      throw new Error(
        `ExecutionEngine requires steps numbered consecutively from 0 (found step ${String(step?.step)} at index ${String(index)}).`,
      )
    }
  }
}

/**
 * Deterministic step machine over a fixed, precomputed step list.
 *
 * The engine owns no timers and performs no I/O: navigation only moves a
 * cursor over immutable steps. Determinism makes navigation provably
 * reproducible — `reset()` followed by k `next()` calls always produces
 * the same run, and `jumpTo(k)` equals stepping forward k times. The
 * playback layer wraps this class and owns any timers.
 */
export class ExecutionEngine<
  TState extends AlgorithmState = AlgorithmState,
> {
  private readonly steps: readonly AlgorithmStep<TState>[]
  private cursor: number

  constructor(steps: readonly AlgorithmStep<TState>[], cursor = 0) {
    validateSteps(steps)
    this.steps = steps
    this.cursor = steps.length > 0 ? Math.min(Math.max(cursor, 0), steps.length - 1) : 0
  }

  /** Builds an engine by executing a definition deterministically. */
  static fromDefinition<TInput extends AlgorithmInput, TState extends AlgorithmState>(
    definition: AlgorithmDefinition<TInput, TState>,
    input: TInput,
  ): ExecutionEngine<TState> {
    return new ExecutionEngine(executeDefinition(definition, input))
  }

  get totalSteps(): number {
    return this.steps.length
  }

  get currentStep(): number {
    return this.cursor
  }

  get isComplete(): boolean {
    return this.steps.length > 0 && this.cursor === this.steps.length - 1
  }

  get canNext(): boolean {
    return this.cursor < this.steps.length - 1
  }

  get canPrevious(): boolean {
    return this.cursor > 0
  }

  get status(): ExecutionStatus {
    return deriveStatus(this.cursor, this.steps.length)
  }

  get step(): AlgorithmStep<TState> | null {
    return this.steps[this.cursor] ?? null
  }

  /** Full immutable history timeline of the run. */
  getHistory(): readonly AlgorithmStep<TState>[] {
    return this.steps
  }

  /** Current position and step as a single immutable view. */
  getSnapshot(): EngineSnapshot<TState> {
    return {
      currentStep: this.cursor,
      totalSteps: this.steps.length,
      isComplete: this.isComplete,
      status: this.status,
      step: this.step,
    }
  }

  /** Moves one step forward when possible; no-op at the end. */
  next(): EngineSnapshot<TState> {
    if (this.canNext) {
      this.cursor += 1
    }
    return this.getSnapshot()
  }

  /** Moves one step backward when possible; no-op at the start. */
  previous(): EngineSnapshot<TState> {
    if (this.canPrevious) {
      this.cursor -= 1
    }
    return this.getSnapshot()
  }

  /** Jumps to a step; throws RangeError outside [0, totalSteps - 1]. */
  jumpTo(step: number): EngineSnapshot<TState> {
    if (!Number.isInteger(step) || step < 0 || step >= this.steps.length) {
      throw new RangeError(
        `jumpTo target out of range: ${String(step)} (total steps: ${String(this.steps.length)}).`,
      )
    }
    this.cursor = step
    return this.getSnapshot()
  }

  /** Rewinds to the initial step. */
  reset(): EngineSnapshot<TState> {
    this.cursor = 0
    return this.getSnapshot()
  }

  /** Contract alias for reset: re-arms the engine at step 0. */
  initialize(): EngineSnapshot<TState> {
    return this.reset()
  }

  /** Fast-forwards to the final step without timers. */
  replayToEnd(): EngineSnapshot<TState> {
    while (this.canNext) {
      this.cursor += 1
    }
    return this.getSnapshot()
  }
}
