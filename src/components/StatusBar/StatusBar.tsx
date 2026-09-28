import styles from './StatusBar.module.css'

export interface StatusBarProps {
  /** Current status message; a default is shown when omitted. */
  message?: string
}

const DEFAULT_MESSAGE =
  'No algorithm selected — choose one from the sidebar to preview its workspace.'

/**
 * Persistent status bar. Conveys the current playback/selection state;
 * uses role="status" so screen readers announce changes politely.
 */
export function StatusBar({ message }: StatusBarProps) {
  const resolved = message ?? DEFAULT_MESSAGE
  return (
    <footer className={styles.statusBar} role="status">
      <span className={styles.statusDot} aria-hidden="true" />
      <span className={styles.statusMessage}>{resolved}</span>
    </footer>
  )
}
