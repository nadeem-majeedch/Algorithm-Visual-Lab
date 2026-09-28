import { useCallback, useEffect, useState } from 'react'

/**
 * Normalizes a raw location hash into a route id.
 *
 * - '#/bubble-sort' -> 'bubble-sort'
 * - '#/about/'      -> 'about'
 * - '' / '#'        -> ''
 *
 * Hash routing keeps deep links working on GitHub Pages, which cannot
 * rewrite sub-paths back to index.html.
 */
export function normalizeRoute(rawHash: string): string {
  return rawHash
    .replace(/^#\/?/, '')
    .replace(/\/+$/, '')
}

function readHashRoute(): string {
  return normalizeRoute(window.location.hash)
}

/**
 * Minimal hash-based router: returns the current route and a navigate
 * callback. The route is the algorithm id, or '' for the welcome view.
 */
export function useHashRoute(): [string, (route: string) => void] {
  const [route, setRoute] = useState<string>(readHashRoute)

  useEffect(() => {
    const onHashChange = () => {
      setRoute(readHashRoute())
    }
    window.addEventListener('hashchange', onHashChange)
    return () => {
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [])

  const navigate = useCallback((next: string) => {
    window.location.hash = next === '' ? '#/' : `#/${next}`
  }, [])

  return [route, navigate]
}
