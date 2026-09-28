import type { ReactNode } from 'react'
import styles from './AlgorithmWorkspace.module.css'

export interface AlgorithmWorkspaceProps {
  /** Algorithm heading and category context. */
  title: string
  categoryLabel: string
  /** Primary visualization slot. */
  visualization: ReactNode
  /** Inspector side column (complexity, pseudocode). */
  inspector: ReactNode
  /** Secondary info row (history, pseudocode). */
  timeline: ReactNode
  /** Playback controls footer. */
  controls: ReactNode
}

/**
 * Main workspace layout: title header, visualization + inspector row,
 * secondary info row, and playback footer.
 */
export function AlgorithmWorkspace({
  title,
  categoryLabel,
  visualization,
  inspector,
  timeline,
  controls,
}: AlgorithmWorkspaceProps) {
  return (
    <div className={styles.workspace}>
      <header className={styles.workspaceHeader}>
        <div className={styles.workspaceTitleGroup}>
          <h1 className={styles.workspaceTitle}>{title}</h1>
          <p className={styles.workspaceCategory}>{categoryLabel}</p>
        </div>
      </header>
      <div className={styles.workspaceBody}>
        <div className={styles.workspaceRow}>
          {visualization}
          {inspector}
        </div>
        <div className={styles.workspaceRowSecondary}>{timeline}</div>
      </div>
      <footer>{controls}</footer>
    </div>
  )
}
