import styles from './PseudocodePanel.module.css'

export interface PseudocodePanelProps {
  /** Pseudocode lines for the selected algorithm. */
  lines: readonly string[]
}

/**
 * Reference pseudocode, rendered with stable line numbers so the future
 * playback engine can highlight the executing line.
 */
export function PseudocodePanel({ lines }: PseudocodePanelProps) {
  return (
    <section className="panel" aria-label="Pseudocode">
      <h3 className="panel-title">Pseudocode</h3>
      <ol className={styles.pseudocode}>
        {lines.map((line, index) => (
          <li key={`${index}-${line}`} className={styles.pseudocodeLine}>
            <span className={styles.lineNumber} aria-hidden="true">
              {index + 1}
            </span>
            <code className={styles.lineText}>{line}</code>
          </li>
        ))}
      </ol>
    </section>
  )
}
