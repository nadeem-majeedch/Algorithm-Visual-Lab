import type { AlgorithmLearningInfo } from '../../models/catalog'
import styles from './ComplexityPanel.module.css'

export interface ComplexityPanelProps {
  /** Educational metadata for the selected algorithm. */
  learningInfo: AlgorithmLearningInfo
}

/**
 * Time and space complexity chips for the selected algorithm.
 * Notation comes straight from the catalog metadata.
 */
export function ComplexityPanel({ learningInfo }: ComplexityPanelProps) {
  return (
    <section className="panel" aria-label="Complexity">
      <h3 className="panel-title">Complexity</h3>
      <div className={styles.complexityGroups}>
        <div className={styles.complexityGroup}>
          <h4 className={styles.complexityKind}>Time</h4>
          <ul className={styles.complexityRows}>
            {learningInfo.complexity.time.map((entry) => (
              <li
                key={`${entry.label}-${entry.notation}`}
                className={styles.complexityRow}
              >
                <span className={styles.complexityCase}>{entry.label}</span>
                <span className={styles.complexityNotation}>
                  {entry.notation}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.complexityGroup}>
          <h4 className={styles.complexityKind}>Space</h4>
          <ul className={styles.complexityRows}>
            {learningInfo.complexity.space.map((entry) => (
              <li
                key={`${entry.label}-${entry.notation}`}
                className={styles.complexityRow}
              >
                <span className={styles.complexityCase}>{entry.label}</span>
                <span className={styles.complexityNotation}>
                  {entry.notation}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
