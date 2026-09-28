import { algorithmCategories } from '../../features/catalog/algorithmCatalog'
import { CategorySection } from '../CategorySection/CategorySection'
import styles from './Sidebar.module.css'

export interface SidebarProps {
  /** Currently selected algorithm id ('' when none). */
  activeAlgorithmId: string
  /** Selects an algorithm by id (also drives routing). */
  onSelectAlgorithm: (algorithmId: string) => void
}

/**
 * Navigation sidebar: one CategorySection per algorithm family,
 * driven entirely by the catalog data model.
 */
export function Sidebar({
  activeAlgorithmId,
  onSelectAlgorithm,
}: SidebarProps) {
  return (
    <nav className={styles.sidebar} aria-label="Algorithm categories">
      <h2 className={styles.sidebarTitle}>Categories</h2>
      {algorithmCategories.map((category) => (
        <CategorySection
          key={category.id}
          category={category}
          activeAlgorithmId={activeAlgorithmId}
          onSelectAlgorithm={onSelectAlgorithm}
        />
      ))}
    </nav>
  )
}
