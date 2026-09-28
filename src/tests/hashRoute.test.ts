import { describe, expect, it } from 'vitest'

import { normalizeRoute } from '../hooks/useHashRoute'

describe('normalizeRoute', () => {
  it('strips the leading hash and slash', () => {
    expect(normalizeRoute('#/bubble-sort')).toBe('bubble-sort')
  })

  it('handles a bare hash without a slash', () => {
    expect(normalizeRoute('#bubble-sort')).toBe('bubble-sort')
  })

  it('normalizes empty and root hashes to the empty route', () => {
    expect(normalizeRoute('')).toBe('')
    expect(normalizeRoute('#')).toBe('')
    expect(normalizeRoute('#/')).toBe('')
  })

  it('strips trailing slashes', () => {
    expect(normalizeRoute('#/about/')).toBe('about')
  })
})
