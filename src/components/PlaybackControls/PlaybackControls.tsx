import { PLAYBACK_SPEEDS } from '../../engine/controller'
import type { PlaybackSpeed } from '../../engine/controller'
import styles from './PlaybackControls.module.css'

export interface PlaybackControlsProps {
  /** Whether playback is currently running. */
  isPlaying: boolean
  /** Current presentation speed from PLAYBACK_SPEEDS. */
  speed: PlaybackSpeed
  /** Current zero-based step, or null before a run is loaded. */
  currentStep: number | null
  /** Total steps, or null before a run is loaded. */
  totalSteps: number | null
  onTogglePlay: () => void
  onPrevious: () => void
  onNext: () => void
  onRestart: () => void
  onSpeedChange: (speed: PlaybackSpeed) => void
}

const SPEED_LABELS: Readonly<Record<PlaybackSpeed, string>> = {
  0.25: '0.25x',
  0.5: '0.5x',
  1: '1x',
  1.5: '1.5x',
  2: '2x',
  4: '4x',
}

/**
 * Playback transport: Restart, Previous, Play/Pause, Next, and a speed
 * selector limited to the engine's supported presentation speeds.
 * Speed only scales tick delay — correctness never depends on it.
 */
export function PlaybackControls({
  isPlaying,
  speed,
  currentStep,
  totalSteps,
  onTogglePlay,
  onPrevious,
  onNext,
  onRestart,
  onSpeedChange,
}: PlaybackControlsProps) {
  const hasEngine = currentStep !== null && totalSteps !== null
  const atEnd =
    hasEngine && currentStep !== null && totalSteps !== null && currentStep >= totalSteps - 1
  return (
    <section className={styles.playbackControls} aria-label="Playback controls">
      <div className={styles.transportGroup}>
        <button
          type="button"
          className={styles.transportButton}
          onClick={onRestart}
          disabled={!hasEngine}
          aria-label="Restart"
        >
          ⟲ Restart
        </button>
        <button
          type="button"
          className={styles.transportButton}
          onClick={onPrevious}
          disabled={!hasEngine || currentStep === 0}
          aria-label="Previous step"
        >
          ◀ Prev
        </button>
        <button
          type="button"
          className={`${styles.transportButton} ${styles.playButton}`}
          onClick={onTogglePlay}
          disabled={!hasEngine || (atEnd && !isPlaying)}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '❚❚ Pause' : '▶ Play'}
        </button>
        <button
          type="button"
          className={styles.transportButton}
          onClick={onNext}
          disabled={!hasEngine || atEnd}
          aria-label="Next step"
        >
          Next ▶
        </button>
      </div>
      <div className={styles.speedGroup}>
        <label className={styles.speedLabel} htmlFor="playback-speed">
          Speed
        </label>
        <select
          id="playback-speed"
          className={styles.speedSelect}
          value={speed}
          onChange={(event) => {
            onSpeedChange(Number(event.target.value) as PlaybackSpeed)
          }}
          disabled={!hasEngine}
        >
          {PLAYBACK_SPEEDS.map((option) => (
            <option key={option} value={option}>
              {SPEED_LABELS[option]}
            </option>
          ))}
        </select>
        <span className={styles.stepCounter} aria-live="off">
          {hasEngine && currentStep !== null && totalSteps !== null
            ? `Step ${currentStep + 1} / ${totalSteps}`
            : 'Step — / —'}
        </span>
      </div>
    </section>
  )
}
