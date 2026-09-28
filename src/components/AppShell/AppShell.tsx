import type { ReactNode } from 'react'

import { Header } from '../Header/Header'
import { StatusBar } from '../StatusBar/StatusBar'
import styles from './AppShell.module.css'

export interface AppShellProps {
  /** Sidebar slot, typically a <Sidebar> tree. */
  sidebar: ReactNode
  /** Main workspace content. */
  children: ReactNode
  /** Optional status message; a default is shown when omitted. */
  status?: string
}

/**
 * Desktop-first application shell: fixed header, sidebar, scrolling
 * workspace, and a persistent status bar. Keeps landmarks (#header,
 * #main-content) stable for assistive technology.
 */
export function AppShell({ sidebar, children, status }: AppShellProps) {
  return (
    <div className={styles.appShell}>
      <Header />
      <div className={styles.appShellBody}>
        {sidebar}
        <main id="main-content" className={styles.appShellMain}>
          {children}
        </main>
      </div>
      <StatusBar message={status} />
      {/* No popover/dialog API is used by the shell yet. */}
    </div>
  )
}
