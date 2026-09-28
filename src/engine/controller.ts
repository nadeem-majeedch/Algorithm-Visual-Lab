import { ExecutionEngine } from './engine'
import type { EngineSnapshot } from './engine'
import type { AlgorithmDefinition } from './definition'
import type {
  AlgorithmInput,
  AlgorithmState,
  AlgorithmStep,
  ExecutionStatus,
} from './models'

/** Shape of a run's history entry for external consumers. */
export type HistoryEntry<TState extends AlgorithmState> = AlgorithmStep<TState>

/**
 * Supported presentation playback speeds. Correctness never depends on
 * these values - they only scale the delay between rendered ticks.
 */
export const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 1.5, 2, 4] as const

export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number]

/** Validates that a value is one of the supported playback speeds. */
export function isPlaybackSpeed(value: unknown): value is PlaybackSpeed {
  return (
    typeof value === 'number' &&
    (PLAYBACK_SPEEDS as readonly number[]).includes(value)
  )
}

/** Default delay between playback ticks at 1x, in milliseconds. */
export const BASE_TICK_MS = 600

/**
 * Scales the base tick delay for a playback speed. Higher speed means a
 * shorter delay; the result is presentation-only.
 */
export function tickDelayMs(speed: PlaybackSpeed, baseMs = BASE_TICK_MS): number {
  return Math.max(1, Math.round(baseMs / speed))
}

/**
 * Everything a playback timer is allowed to know about the controller.
 *
 * Timers live entirely outside the controller: a host (React effect,
 * Playwright harness, test) calls `tick()` on its own schedule. The
 * controller therefore never imports setInterval/setTimeout, and stepping
 * through a run is provably identical whether the host ticks at 1x, 4x,
 * or manually.
 */
export interface ControllerHost {
  /** Called by the host's timer each presentation tick while playing. */
  tick(): ControllerSnapshot<AlgorithmState>
  /** True while playback is running. */
  isPlaying(): boolean
  /** Delay in milliseconds the host should wait between ticks. */
  tickDelayMs(): number
}

/** Serializable, JSON-safe capture of controller position and settings. */
export interface SerializedControllerState {
  readonly algorithmId: string
  readonly input: AlgorithmInput
  readonly currentStep: number
  readonly totalSteps: number
  readonly speed: PlaybackSpeed
  readonly isPlaying: boolean
}

/** Subscription handle returned by subscribe(). */
export interface ControllerSubscription {
  unsubscribe(): void
}

export type ControllerListener = () => void

/**
 * Presentation-level controller over a deterministic ExecutionEngine.
 *
 * Separation of concerns:
 * - algorithm execution: `AlgorithmDefinition` + `ExecutionEngine`
 * - playback timing: the host's timer, driving `tick()` from outside
 * - UI state: framework-free observable snapshot consumed by React later
 *
 * The controller owns play/pause intent and speed, but owns no timer: a
 * paused controller ignores ticks, and `reset()` never fires timers.
 */
export class ExecutionController<
  TState extends AlgorithmState = AlgorithmState,
> {
  private engine: ExecutionEngine<TState> | null = null
  private algorithmId = ''
  private input: AlgorithmInput = { values: [] }
  private speed: PlaybackSpeed = 1
  private playing = false
  private readonly listeners = new Set<ControllerListener>()

  /** Registers a change listener; returns an unsubscribe handle. */
  subscribe(listener: ControllerListener): ControllerSubscription {
    this.listeners.add(listener)
    return {
      unsubscribe: () => {
        this.listeners.delete(listener)
      },
    }
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener()
    }
  }

  /**
   * Loads a definition deterministically and rewinds to step 0. Replaces
   * any previously loaded run and pauses playback.
   */
  loadAlgorithm<TInput extends AlgorithmInput>(
    definition: AlgorithmDefinition<TInput, TState>,
    input: TInput,
  ): ControllerSnapshot<TState> {
    this.engine = ExecutionEngine.fromDefinition(definition, input)
    this.algorithmId = definition.metadata.id
    this.input = input
    this.playing = false
    return this.getSnapshot()
  }

  /** Marks playback as running; the host's timer drives ticks. */
  start(): ControllerSnapshot<TState> {
    this.assertLoaded()
    this.playing = true
    this.emit()
    return this.getSnapshot()
  }

  /** Marks playback as paused. Position is preserved exactly. */
  pause(): ControllerSnapshot<TState> {
    this.assertLoaded()
    this.playing = false
    this.emit()
    return this.getSnapshot()
  }

  /** Rewinds to step 0 and pauses. */
  reset(): ControllerSnapshot<TState> {
    this.assertLoaded()
    this.playing = false
    this.engine?.reset()
    this.emit()
    return this.getSnapshot()
  }

  /** Steps one forward and pauses manual-style playback. */
  next(): ControllerSnapshot<TState> {
    this.assertLoaded()
    this.engine?.next()
    this.emit()
    return this.getSnapshot()
  }

  /** Steps one backward and pauses. */
  previous(): ControllerSnapshot<TState> {
    this.assertLoaded()
    this.engine?.previous()
    this.emit()
    return this.getSnapshot()
  }

  /** Jumps to a step; RangeError propagates for out-of-range targets. */
  jumpTo(step: number): ControllerSnapshot<TState> {
    this.assertLoaded()
    this.engine?.jumpTo(step)
    this.emit()
    return this.getSnapshot()
  }

  /** Sets the presentation speed; validates against PLAYBACK_SPEEDS. */
  setSpeed(speed: PlaybackSpeed): ControllerSnapshot<TState> {
    if (!isPlaybackSpeed(speed)) {
      throw new RangeError(
        `Unsupported playback speed: ${String(speed)}. Supported: ${PLAYBACK_SPEEDS.join('x, ')}x.`,
      )
    }
    this.speed = speed
    this.emit()
    return this.getSnapshot()
  }

  /** Restores a serialized position and settings deterministically. */
  restore(serialized: SerializedControllerState): ControllerSnapshot<TState> {
    this.assertLoaded()
    if (serialized.algorithmId !== this.algorithmId) {
      throw new Error(
        `Cannot restore state for '${serialized.algorithmId}' while '${this.algorithmId}' is loaded.`,
      )
    }
    if (serialized.totalSteps !== this.getTotalSteps()) {
      throw new Error(
        'Serialized state does not match the loaded run length.',
      )
    }
    this.setSpeed(serialized.speed)
    this.playing = serialized.isPlaying
    this.engine?.jumpTo(serialized.currentStep)
    this.emit()
    return this.getSnapshot()
  }

  getCurrentStep(): number {
    return this.engine?.currentStep ?? 0
  }

  getTotalSteps(): number {
    return this.engine?.totalSteps ?? 0
  }

  getStatus(): ExecutionStatus {
    return this.engine?.status ?? 'idle'
  }

  /** True while the host's timer should keep ticking. */
  isPlaying(): boolean {
    return this.playing
  }

  /** Current presentation speed. */
  getSpeed(): PlaybackSpeed {
    return this.speed
  }

  /** Presentation delay for the current speed. */
  tickDelayMs(): number {
    return tickDelayMs(this.speed)
  }

  /** Current engine snapshot: position, step, completion flags. */
  getState(): EngineSnapshot<TState> | null {
    return this.engine?.getSnapshot() ?? null
  }

  /** Full history timeline: every immutable step of the run. */
  getHistory(): readonly AlgorithmStep<TState>[] {
    return this.engine ? this.engine.getHistory() : []
  }

  /** Single presentation tick: advances once if playing. */
  tick(): ControllerSnapshot<TState> {
    this.assertLoaded()
    if (this.playing) {
      this.engine?.next()
      if (this.engine?.isComplete) {
        this.playing = false
      }
      this.emit()
    }
    return this.getSnapshot()
  }

  /** Builds the external snapshot view from internal state. */
  getSnapshot(): ControllerSnapshot<TState> {
    const engine = this.engine?.getSnapshot() ?? null
    return {
      algorithmId: this.algorithmId,
      currentStep: this.getCurrentStep(),
      totalSteps: this.getTotalSteps(),
      isComplete: engine?.isComplete ?? false,
      isPlaying: this.playing,
      speed: this.speed,
      status: this.getStatus(),
      engine,
    }
  }

  /** Serializable capture of position and settings. */
  serialize(): SerializedControllerState {
    this.assertLoaded()
    return {
      algorithmId: this.algorithmId,
      input: this.input,
      currentStep: this.getCurrentStep(),
      totalSteps: this.getTotalSteps(),
      speed: this.speed,
      isPlaying: this.playing,
    }
  }

  private assertLoaded(): void {
    if (!this.engine) {
      throw new Error(
        'No algorithm loaded. Call loadAlgorithm(definition, input) first.',
      )
    }
  }
}

/** Convenience view combining controller position, step, and settings. */
export interface ControllerSnapshot<TState extends AlgorithmState> {
  readonly algorithmId: string
  readonly currentStep: number
  readonly totalSteps: number
  readonly isComplete: boolean
  readonly isPlaying: boolean
  readonly speed: PlaybackSpeed
  readonly status: ExecutionStatus
  readonly engine: EngineSnapshot<TState> | null
}
