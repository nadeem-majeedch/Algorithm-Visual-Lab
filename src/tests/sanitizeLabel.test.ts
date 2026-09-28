import { describe, expect, it } from 'vitest'

import { slugify, truncateLabel } from '../utils/format'

describe('slugify', () => {
  it('converts labels to URL-safe slugs', () => {
    expect(slugify('Binary Search Tree')).toBe('binary-search-tree')
  })

  it('collapses repeated separators', () => {
    expect(slugify('  A*   Pathfinding ')).toBe('a-pathfinding')
  })
})

describe('truncateLabel', () => {
  it('returns short labels unchanged', () => {
    expect(truncateLabel('Quick Sort', 20)).toBe('Quick Sort')
  })

  it('truncates long labels with an ellipsis within the limit', () => {
    expect(truncateLabel('Breadth-First Search', 10)).toBe('Breadth-F…')
    expect(truncateLabel('Breadth-First Search', 10)).toHaveLength(10)
  })

  it('returns an empty string for non-positive lengths', () => {
    expect(truncateLabel('Quick Sort', 0)).toBe('')
  })
})
