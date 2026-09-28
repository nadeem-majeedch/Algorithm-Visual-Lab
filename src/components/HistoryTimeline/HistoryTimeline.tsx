import styles from './HistoryTimeline.module.css'

export interface HistoryTimelineProps {
  /** Total steps of the loaded run, or null before a run is loaded. */
  totalSteps: number | null
  /** Current zero-based step, or null before a run is loaded. */
  currentStep: number | null
  /** Seeks the engine to the clicked step. */
  onSeek: (step: number) => void
}

/**
 * History timeline: one tick per executed step. Click any tick to seek
 * the deterministic run to that point — every state is immutable and
 * restorable, so seeking is lossless.
 */
export function HistoryTimeline({
  totalSteps,
  currentStep,
  onSeek,
}: HistoryTimelineProps) {
  const hasRun = totalSteps !== null && currentStep !== null
  return (
    <section className={styles.historyTimeline} aria-label="Step history">
      <h3 className={styles.historyTimelineTitle}>History</h3>
      {hasRun ? (
        <ol className={styles.timelineTrack} aria-label="Seek to step">
          {Array.from({ length: totalSteps }, (_, index) => {
            let tickClass = styles.timelineTick
            if (currentStep !== null) {
              if (index === currentStep) {
                tickClass = `${styles.timelineTick} ${styles.timelineTickCurrent}`
              } else if (index < currentStep) {
                tickClass = `${styles.timelineTick} ${styles.timelineTickPast}`
              }
            }
            return (
              <li key={index}>
                <button
                  type="button"
                  className={tickClass}
                  onClick={() => onSeek(index)}
                  aria-label={`Go to step ${index + 1} of ${totalSteps}`}
                  aria-current={index === currentStep ? 'true' : undefined}
                />
              </li>
          )
          })}
        </ol>
      ) : (
        <p className={styles.timelineNote}>
          Every executed step is recorded here — click any tick to jump
          back to it.
        </p>
      )}
    </section>
  )
}
