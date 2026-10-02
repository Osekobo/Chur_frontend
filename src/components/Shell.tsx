/**
 * The navigation rail/drawer and the scrolling content area that wraps every
 * screen. The layout has two forms:
 *
 * - **Wide screens (`lg` and up):** the navigation sits in the page flow beside
 *   the content. It can be collapsed to give a wide table or report the whole
 *   window, and brought back with the tab pinned to the left edge. That choice is
 *   remembered per browser: someone who lives in the trial balance opens the app
 *   straight into the full-width view.
 * - **Small and medium screens:** 250px of permanent rail leaves a table about
 *   100px wide, so the navigation becomes an overlay drawer instead, closed by
 *   default and opened from the bar at the top of the screen. Choosing a link
 *   closes it again, so a request never leaves the menu covering the result.
 *
 * The two forms are driven by one boolean — is the navigation showing — because
 * the two buttons in the interface mean exactly the same thing in both layouts.
 * Collapsing is `display: none` rather than unmounting, so {@link Sidebar} keeps
 * the groups the user opened and the content keeps its scroll position.
 */

import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { Sidebar } from './Sidebar'
import { Icon } from './Icon'
import { useMediaQuery } from '@/hooks/useMediaQuery'

/** Matches the `lg` breakpoint Tailwind uses, so CSS and JS agree on the mode. */
const WIDE = '(min-width: 1024px)'

const STORAGE_KEY = 'church-finance.nav'

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'collapsed'
  } catch {
    // A browser that refuses storage (private mode) just gets the default.
    return false
  }
}

export function Shell() {
  const isWide = useMediaQuery(WIDE)
  const location = useLocation()

  /** The rail's state on wide screens; remembered between visits. */
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsed)
  /** The drawer's state below `lg`; always starts closed, whatever the rail does. */
  const [drawerOpen, setDrawerOpen] = useState(false)

  const shown = isWide ? !collapsed : drawerOpen

  const show = () => (isWide ? setCollapsed(false) : setDrawerOpen(true))
  const hide = () => (isWide ? setCollapsed(true) : setDrawerOpen(false))

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? 'collapsed' : 'open')
    } catch {
      // Preference is a convenience; failing to store it is not worth reporting.
    }
  }, [collapsed])

  // Choosing a destination is the end of the drawer's job: close it, or the menu
  // sits on top of the screen the link just opened.
  useEffect(() => {
    if (!isWide) setDrawerOpen(false)
  }, [isWide, location.pathname])

  // Escape closes the drawer, as a drawer should.
  useEffect(() => {
    if (isWide || !drawerOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isWide, drawerOpen])

  return (
    <div className="flex h-screen h-[100dvh]">
      <Sidebar shown={shown} onHide={hide} />

      {drawerOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/45 lg:hidden"
          aria-hidden="true"
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}

      <main
        id="content"
        // Only the sides and the bottom are set here: `padding-top` belongs to
        // index.css, which adds the safe-area inset and steps it up on wide
        // screens. A `py-*` utility here would win over that and lose the inset.
        className={[
          'h-full min-w-0 flex-1 overflow-x-auto overflow-y-auto px-3 pb-3 sm:px-4 lg:px-5',
          // A collapsed rail on a wide screen leaves a tab pinned to the left
          // edge, so the content starts to its right rather than under it.
          isWide && !shown ? 'lg:pl-11' : '',
        ].join(' ')}
      >
        {/* The bar is the small-screen answer to "where is the menu?". It is
            hidden from `lg` up, where the rail is always in view. */}
        <div className="sticky top-0 z-20 -mx-3 mb-3 flex items-center gap-2 border-b border-line bg-bg px-3 pb-2 pt-[calc(8px+env(safe-area-inset-top,0px))] sm:-mx-4 sm:px-4 lg:hidden">
          <button
            type="button"
            onClick={show}
            className="ghost shrink-0 !border-line px-2 py-1.5"
            title="Show navigation"
            aria-label="Show navigation"
            aria-controls="sidebar"
            aria-expanded={false}
          >
            <Icon name="menu" className="text-[14px]" />
          </button>
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-accent2/15 text-accent2">
              <Icon name="church" className="text-[13px]" />
            </span>
            <span className="truncate text-[13px] font-bold">Church Finance</span>
          </span>
        </div>

        <Outlet />
      </main>

      {/* Collapsed rail on a wide screen: a tab on the left edge to bring the
          navigation back. The content reserves room for it (see `lg:pl-11`). */}
      {!shown ? (
        <button
          type="button"
          onClick={show}
          className="ghost fixed left-0 top-1/2 z-30 hidden -translate-y-1/2 rounded-l-none !border-line px-1.5 py-3 lg:block"
          title="Show navigation"
          aria-label="Show navigation"
          aria-controls="sidebar"
          aria-expanded={false}
        >
          <Icon name="menu" className="text-[14px]" />
        </button>
      ) : null}
    </div>
  )
}
