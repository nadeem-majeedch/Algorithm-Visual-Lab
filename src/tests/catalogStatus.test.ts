import { describe, expect, it } from 'vitest'

import { algorithmCategories } from '../features/catalog/algorithmCatalog'

const IMPLEMENTED = new Set([
  'bubble-sort',
  'selection-sort',
  'insertion-sort',
  'merge-sort',
  'quick-sort',
  'heap-sort',
  'linear-search',
  'binary-search',
])

describe('algorithmCategories status', () => {
  it('marks exactly the implemented algorithms as available', () => {
    for (const category of algorithmCategories) {
      for (const algorithm of category.algorithms) {
        if (IMPLEMENTED.has(algorithm.id)) {
          expect(algorithm.status, `${algorithm.id} should be available`).toBe(
            'available',
          )
        } else {
          expect(
            algorithm.status,
            `${algorithm.id} should be coming-soon`,
          ).toBe('coming-soon')
        }
      }
    }
  })

  it('contains exactly the twenty required algorithms with unique ids', () => {
    const ids = algorithmCategories.flatMap((category) =>
      category.algorithms.map((algorithm) => algorithm.id),
    )
    expect(ids).toHaveLength(20)
    expect(new Set(ids).size).toBe(20)
  })
})
