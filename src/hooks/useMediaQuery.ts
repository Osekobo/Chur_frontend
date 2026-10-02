/**
 * Subscribe to a CSS media query.
 *
 * The shell needs this to know whether the navigation is a rail in the page flow
 * (wide screens) or an overlay drawer (small and medium ones), because those two
 * layouts are genuinely different components rather than one thing restyled.
 *
 * State is initialised from `matchMedia` during the first render, so the first
 * paint is already the right layout and nothing has to correct itself afterwards.
 */

import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const list = window.matchMedia(query)
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches)
    setMatches(list.matches)
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}
