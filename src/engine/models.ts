/**
 * Core execution models for the deterministic algorithm engine.
 *
 * These types are intentionally framework-free: no React, no DOM, no
 * timers. The UI layer renders these records; it never participates in
 * producing them. See docs/architecture.md for the execution model.
 */

/** Every primitive operation a visualizer can render for a single step. */
export const OPERATION_TYPES = [
  'INITIALIZE',
  'COMPARE',
  'SWAP',
  'INSERT',
  'REMOVE',
  'SELECT',
  'VISIT',
  'DISCOVER',
  'RELAX',
  'PARTITION',
  'MERGE',
  'PUSH',
  'POP',
  'ENQUEUE',
  'DEQUEUE',
  'ROTATE',
  'OVERWRITE',
  'UPDATE',
  'COMPLETE',
] as const

export type OperationType = (typeof OPERATION_TYPES)[number]

/** Visual emphasis kinds a step can request from a renderer. */
export type HighlightKind =
  | 'compare'
  | 'swap'
  | 'focus'
  | 'boundary'
  | 'sorted'
  | 'visited'
  | 'selected'
  | 'target'
  | 'result'

/** A single atomic operation performed by a step. */
export interface Operation {
  readonly type: OperationType
  /** Short machine-friendly detail, e.g. 'a[2] vs a[3]'. */
  readonly detail?: string
}

/** Visual emphasis attached to a step. */
export interface Highlight {
  readonly kind: HighlightKind
  /** Element ids: array indices ('0', '3') or node ids ('A', 'node-7'). */
  readonly elements: readonly string[]
  /** Optional caption rendered next to the highlight. */
  readonly label?: string
}

/** Outcome of a comparison performed inside a step. */
export type ComparisonResult = 'less' | 'equal' | 'greater'

/** Description of a comparison performed by a step (optional). */
export interface StepComparison {
  readonly left: string
  readonly right: string
  readonly result: ComparisonResult
}

/** Readable description of a value change performed by a step (optional). */
export interface StepMutation {
  readonly target: string
  readonly before: string
  readonly after: string
}

/** One numbered pseudocode line from an algorithm's reference listing. */
export interface PseudocodeLine {
  /** 1-based line number. */
  readonly number: number
  readonly text: string
}

/** Complexity summary attached to algorithms and steps. */
export interface ComplexityInfo {
  readonly time: Readonly<{
    best: string
    average: string
    worst: string
  }>
  readonly space: string
}

/**
 * High-level execution status derived from the engine cursor. Playback
 * concerns ('playing' / 'paused') belong to the UI layer, not the engine.
 */
export type ExecutionStatus = 'idle' | 'ready' | 'active' | 'complete'

/** Derives the execution status from a cursor position. */
export function deriveStatus(
  currentStep: number,
  totalSteps: number,
): ExecutionStatus {
  if (totalSteps <= 0) {
    return 'idle'
  }
  if (currentStep <= 0) {
    return 'ready'
  }
  if (currentStep >= totalSteps - 1) {
    return 'complete'
  }
  return 'active'
}

/** Generic algorithm input: primary values plus named options. */
export interface AlgorithmInput {
  readonly values: readonly number[]
  readonly options?: Readonly<Record<string, string | number | boolean>>
  /** Graph payloads for graph algorithms (BFS, DFS, and later ones). */
  readonly graph?: import('../models/graph').Graph
}

/**
 * State snapshot contract.
 *
 * Snapshots are retained for the whole run (history + replay), so they
 * must be deeply immutable. Declare concrete state shapes as *type
 * aliases* (not interfaces) so they stay assignable to
 * `Readonly<Record<string, unknown>>`. The engine deep-freezes every
 * snapshot as a runtime guard — see docs/architecture.md.
 */
export type AlgorithmState =
  | readonly unknown[]
  | Readonly<Record<string, unknown>>

/** One deterministic, self-describing step of an algorithm run. */
export interface AlgorithmStep<TState extends AlgorithmState = AlgorithmState> {
  /** Zero-based position in the run; step 0 is always INITIALIZE. */
  readonly step: number
  /** Deeply frozen state snapshot, safe for history and replay. */
  readonly state: TState
  readonly operation: Operation
  /** Element ids directly affected by this step. */
  readonly affected: readonly string[]
  readonly highlights: readonly Highlight[]
  /** Human-readable explanation of what happened and why. */
  readonly explanation: string
  /** 1-based pseudocode line this step corresponds to, if any. */
  readonly pseudocodeLine: number | null
  readonly comparison: StepComparison | null
  readonly mutation: StepMutation | null
  /** Complexity of the algorithm (defaults to the definition's). */
  readonly complexity: ComplexityInfo
}

/** Static, educational metadata describing an algorithm. */
export interface AlgorithmMetadata {
  readonly id: string
  readonly label: string
  readonly category: string
  readonly description: string
  readonly complexity: ComplexityInfo
  readonly pseudocode: readonly PseudocodeLine[]
  /** Whether equal elements keep their relative order. */
  readonly stable: boolean
  /** Whether the algorithm sorts within the original container. */
  readonly inPlace: boolean
  readonly tags?: readonly string[]
}
