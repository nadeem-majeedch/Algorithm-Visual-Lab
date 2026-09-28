import styles from './Header.module.css'

/**
 * Fixed application header: brand identity and global context.
 * Kept intentionally minimal — navigation lives in the sidebar.
 */
export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <img
          src={`${import.meta.env.BASE_URL}favicon.svg`}
          alt=""
          aria-hidden="true"
          className={styles.logo}
        />
        <div className={styles.brandText}>
          <p className={styles.brandTitle}>Algorithm Visual Lab</p>
          <p className={styles.brandSubtitle}>Learn algorithms step by step</p>
        </div>
      </div>
      <span className={styles.phaseBadge}>UI shell · engines coming soon</span>
    </header>
  )
}
