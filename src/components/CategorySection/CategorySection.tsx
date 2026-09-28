import type { AlgorithmCategory } from '../../models/catalog'
import styles from './CategorySection.module.css'

export interface CategorySectionProps {
  category: AlgorithmCategory
  activeAlgorithmId: string
  onSelectAlgorithm: (algorithmId: string) => void
}

/**
 * One sidebar section: category heading plus the algorithms it contains.
 * The active algorithm is marked with aria-current for assistive tech.
 */
export function CategorySection({ category, activeAlgorithmId, onSelectAlgorithm }: CategorySectionProps) {
  return (
    <section className={styles.categorySection} aria-labelledby={`${category.id}-heading`}>
      <h3 id={`${category.id}-heading`} className={styles.categoryHeading}>{category.label}</h3>
      <p className={styles.categoryDescription}>{category.description}</p>
      <ul className={styles.algorithmList}>
        {category.algorithms.map((algorithm) => {
          const isActive = algorithm.id === activeAlgorithmId
          const className = isActive
            ? `${styles.algorithmLink} ${styles.algorithmLinkActive}`
            : styles.algorithmLink
          return (
            <li key={algorithm.id}>
              <button
                type="button"
                className={className}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onSelectAlgorithm(algorithm.id)}
              >
                {algorithm.label}
                <span className={styles.comingSoon}>Soon</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
