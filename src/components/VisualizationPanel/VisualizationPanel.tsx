import type { AlgorithmDescriptor } from '../../models/catalog'
import styles from './VisualizationPanel.module.css'

export interface VisualizationPanelProps {
  /** Selected algorithm; the stage shows a welcome state when null. */
  algorithm: AlgorithmDescriptor | null
}

/**
 * Main visualization stage. Until the playback engine lands, the panel
 * renders an honest empty state describing what will appear here.
 */
export function VisualizationPanel({ algorithm }: VisualizationPanelProps) {
  return (
    <section className={styles.visualizationPanel} aria-label="Visualization">
      <div className={styles.panelHead}>
        <h3 className={styles.panelHeadTitle}>
          {algorithm ? algorithm.label : 'Visualization'}
        </h3>
        <span className={styles.panelHeadMeta}>
          {algorithm
            ? algorithm.status === 'coming-soon'
              ? 'Coming soon'
              : 'Interactive preview'
            : 'No algorithm selected'}
        </span>
      </div>
      <div className={styles.stage} data-testid="visualization-stage">
        <div className={styles.stageContent}>
          <span className={styles.stageIcon} aria-hidden="true">
            {algorithm ? '📊' : '🧪'}
          </span>
          <p className={styles.stageTitle}>
            {algorithm
              ? `${algorithm.label} visualization`
              : 'Welcome to Algorithm Visual Lab'}
          </p>
          <p className={styles.stageNote}>
            {algorithm
              ? algorithm.description
              : 'Pick an algorithm from the sidebar or the selector to preview its future visualization space.'}
          </p>
        </div>
      </div>
    </section>
  )
}
