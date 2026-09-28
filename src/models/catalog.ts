/**
 * Domain models for the algorithm catalog.
 *
 * Pure data descriptions shared by navigation, selectors, and the
 * workspace — no React imports allowed here.
 */

export type AlgorithmStatus = 'available' | 'coming-soon'

export interface AlgorithmDescriptor {
  /** Stable identifier, doubles as the hash-route id (e.g. 'bubble-sort'). */
  readonly id: string
  /** Human-readable name shown in navigation and headings. */
  readonly label: string
  /** One-line educational summary of what the algorithm demonstrates. */
  readonly description: string
  /** Whether the algorithm has a working visualization yet. */
  readonly status: AlgorithmStatus
}

export interface AlgorithmCategory {
  /** Stable identifier for the category (e.g. 'sorting'). */
  readonly id: string
  /** Human-readable category name shown in the sidebar. */
  readonly label: string
  /** Short intent of the category, shown as section context. */
  readonly description: string
  readonly algorithms: readonly AlgorithmDescriptor[]
}

export type ComplexityKind = 'time' | 'space'

export interface ComplexityCase {
  /** Case name, e.g. 'Best', 'Average', 'Worst', 'Auxiliary'. */
  readonly label: string
  /** Big-O notation, e.g. 'O(n log n)'. */
  readonly notation: string
}

/**
 * Educational metadata rendered by the workspace panels. Engines arrive in
 * later phases; the copy is already part of the shell.
 */
export interface AlgorithmLearningInfo {
  readonly pseudocode: readonly string[]
  readonly complexity: Readonly<
    Record<ComplexityKind, readonly ComplexityCase[]>
  >
}

/** Finds an algorithm by id across all categories. */
export function findAlgorithm(
  categories: readonly AlgorithmCategory[],
  algorithmId: string,
): { algorithm: AlgorithmDescriptor; category: AlgorithmCategory } | null {
  for (const category of categories) {
    const algorithm = category.algorithms.find((a) => a.id === algorithmId)
    if (algorithm) {
      return { algorithm, category }
    }
  }
  return null
}
