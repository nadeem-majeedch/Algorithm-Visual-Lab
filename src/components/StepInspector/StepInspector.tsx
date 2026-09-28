import type { AlgorithmStep, AlgorithmState } from '../../engine'
import styles from './StepInspector.module.css'

export interface StepInspectorProps {
  /** Current step record; null before a run is loaded. */
  step: AlgorithmStep<AlgorithmState> | null
  /** Zero-based cursor position. */
  currentStep: number
  /** Total number of steps in the run. */
  totalSteps: number
}

function formatIndexes(indexes: readonly string[]): string {
  return indexes.length > 0 ? indexes.join(', ') : '—'
}

/**
 * Live narration of the current engine step: position, operation,
 * compared elements, explanation, pseudocode line, and complexity.
 * Pure presentation over the immutable step record.
 */
export function StepInspector({
  step,
  currentStep,
  totalSteps,
}: StepInspectorProps) {
  if (!step) {
    return (
      <section className={styles.stepInspector} aria-label="Step inspector">
        <h3 className={styles.stepInspectorTitle}>Step inspector</h3>
        <p className={styles.stepInspectorNote}>
          Load an algorithm to inspect its steps.
        </p>
      </section>
    )
  }

  return (
    <section className={styles.stepInspector} aria-label="Step inspector">
      <h3 className={styles.stepInspectorTitle}>Step inspector</h3>
      <div className={styles.stepRow}>
        <span className={styles.stepIndex}>
          Step {currentStep + 1} / {totalSteps}
        </span>
        <span className={styles.stepText}>
          {step.operation.type}
          {step.operation.detail ? ` — ${step.operation.detail}` : ''}
        </span>
      </div>
      <div className={styles.stepRow}>
        <span className={styles.stepIndex}>Compared</span>
        <span className={styles.stepText}>
          {step.comparison
            ? `${step.comparison.left} vs ${step.comparison.right} (${step.comparison.result})`
            : '—'}
        </span>
      </div>
      <div className={styles.stepRow}>
        <span className={styles.stepIndex}>Affected</span>
        <span className={styles.stepText}>
          {formatIndexes(step.affected)}
        </span>
      </div>
      <div className={styles.stepRow}>
        <span className={styles.stepIndex}>Pseudocode</span>
        <span className={styles.stepText}>
          {step.pseudocodeLine !== null ? `line ${step.pseudocodeLine}` : '—'}
        </span>
      </div>
      <div className={styles.stepRow}>
        <span className={styles.stepIndex}>Complexity</span>
        <span className={styles.stepText}>
          time {step.complexity.time.worst} · space {step.complexity.space}
        </span>
      </div>
      <p className={styles.stepInspectorNote}>{step.explanation}</p>
    </section>
  )
}
