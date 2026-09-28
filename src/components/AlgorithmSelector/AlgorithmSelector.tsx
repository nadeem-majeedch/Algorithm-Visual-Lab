import { algorithmCategories } from '../../features/catalog/algorithmCatalog'
import styles from './AlgorithmSelector.module.css'

export interface AlgorithmSelectorProps {
  /** Currently selected algorithm id ('' when none). */
  selectedAlgorithmId: string
  /** Selects an algorithm by id. */
  onSelectAlgorithm: (algorithmId: string) => void
}

/**
 * Global algorithm picker, grouped by category. Mirrors the sidebar so
 * users on small screens (where the sidebar wraps away) keep one-tap
 * access to every algorithm.
 */
export function AlgorithmSelector({
  selectedAlgorithmId,
  onSelectAlgorithm,
}: AlgorithmSelectorProps) {
  return (
    <div className={styles.selectorGroup}>
      <label className={styles.selectorLabel} htmlFor="algorithm-selector">
        Algorithm
      </label>
      <select
        id="algorithm-selector"
        className={styles.selector}
        value={selectedAlgorithmId}
        onChange={(event) => {
          if (event.target.value !== '') {
            onSelectAlgorithm(event.target.value)
          }
        }}
      >
        <option value="">Choose an algorithm…</option>
        {algorithmCategories.map((category) => (
          <optgroup key={category.id} label={category.label}>
            {category.algorithms.map((algorithm) => (
              <option key={algorithm.id} value={algorithm.id}>
                {algorithm.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
