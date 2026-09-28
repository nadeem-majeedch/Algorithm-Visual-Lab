import type {
  AlgorithmInput,
  AlgorithmState,
  AlgorithmStep,
} from './models'

/**
 * JSON-safe serializable capture of a full execution run.
 *
 * Steps are stored as `SerializedStep` records: identical to
 * `AlgorithmStep` except that state snapshots may be any JSON value,
 * since state shapes vary per algorithm. Serialization never mutates the
 * live run; deserialization validates before handing back a run.
 */
export interface SerializedStep {
  readonly step: number
  readonly state: unknown
  readonly operation: { readonly type: string; readonly detail?: string }
  readonly affected: readonly string[]
  readonly highlights: readonly {
    readonly kind: string
    readonly elements: readonly string[]
    readonly label?: string
  }[]
  readonly explanation: string
  readonly pseudocodeLine: number | null
  readonly comparison: {
    readonly left: string
    readonly right: string
    readonly result: string
  } | null
  readonly mutation: {
    readonly target: string
    readonly before: string
    readonly after: string
  } | null
  readonly complexity: {
    readonly time: { readonly best: string; readonly average: string; readonly worst: string }
    readonly space: string
  }
}

/** Serializable capture of an entire run, safe for JSON transport. */
export interface SerializedRun {
  readonly algorithmId: string
  readonly input: AlgorithmInput
  readonly steps: readonly SerializedStep[]
}

/** Structural validation result for deserialized runs. */
export interface RunValidationResult {
  readonly valid: boolean
  readonly errors: readonly string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Serializes a run to a plain JSON-safe structure. The input `steps`
 * (frozen by the engine) are copied, never mutated.
 */
export function serializeRun<TState extends AlgorithmState>(
  algorithmId: string,
  input: AlgorithmInput,
  steps: readonly AlgorithmStep<TState>[],
): SerializedRun {
  return {
    algorithmId,
    input: { values: [...input.values], options: input.options ? { ...input.options } : undefined },
    steps: steps.map((step) => ({
      step: step.step,
      state: step.state,
      operation: { type: step.operation.type, detail: step.operation.detail },
      affected: [...step.affected],
      highlights: step.highlights.map((highlight) => ({
        kind: highlight.kind,
        elements: [...highlight.elements],
        label: highlight.label,
      })),
      explanation: step.explanation,
      pseudocodeLine: step.pseudocodeLine,
      comparison: step.comparison ? { ...step.comparison } : null,
      mutation: step.mutation ? { ...step.mutation } : null,
      complexity: {
        time: { ...step.complexity.time },
        space: step.complexity.space,
      },
    })),
  }
}

/** Validates the shape of a deserialized run before it is trusted. */
export function validateSerializedRun(value: unknown): RunValidationResult {
  const errors: string[] = []
  if (!isRecord(value)) {
    return { valid: false, errors: ['run is not an object'] }
  }
  if (typeof value.algorithmId !== 'string' || value.algorithmId.length === 0) {
    errors.push('algorithmId must be a non-empty string')
  }
  if (!isRecord(value.input)) {
    errors.push('input must be an object')
  } else if (!Array.isArray(value.input.values)) {
    errors.push('input.values must be an array')
  }
  if (!Array.isArray(value.steps) || value.steps.length === 0) {
    errors.push('steps must be a non-empty array')
  } else {
    value.steps.forEach((step, index) => {
      if (!isRecord(step)) {
        errors.push(`steps[${index}] is not an object`)
        return
      }
      if (step.step !== index) {
        errors.push(`steps[${index}].step must be ${index}`)
      }
      if (
        !isRecord(step.operation) ||
        typeof step.operation.type !== 'string'
      ) {
        errors.push(`steps[${index}].operation.type must be a string`)
      }
      if (typeof step.explanation !== 'string') {
        errors.push(`steps[${index}].explanation must be a string`)
      }
    })
  }
  return { valid: errors.length === 0, errors }
}

/**
 * Deserializes a run, validating first. Throws when the payload is not a
 * trustworthy run shape; callers should treat run payloads as untrusted.
 */
export function deserializeRun(value: unknown): SerializedRun {
  const result = validateSerializedRun(value)
  if (!result.valid) {
    throw new Error(`Invalid serialized run: ${result.errors.join('; ')}`)
  }
  return value as SerializedRun
}

/** Restores `AlgorithmStep[]` (typed) from a validated run. */
export function stepsFromSerializedRun(run: SerializedRun): AlgorithmStep<AlgorithmState>[] {
  return run.steps.map((step) => ({
    ...step,
    operation: {
      type: step.operation.type as AlgorithmStep['operation']['type'],
      detail: step.operation.detail,
    },
    highlights: step.highlights.map((highlight) => ({
      kind: highlight.kind as AlgorithmStep['highlights'][number]['kind'],
      elements: highlight.elements,
      label: highlight.label,
    })),
    comparison: step.comparison
      ? {
          left: step.comparison.left,
          right: step.comparison.right,
          result: step.comparison.result as AlgorithmStep['comparison'] extends null
            ? never
            : 'less' | 'equal' | 'greater',
        }
      : null,
    mutation: step.mutation ? { ...step.mutation } : null,
    state: step.state as AlgorithmState,
  }))
}
