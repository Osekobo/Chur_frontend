/**
 * The navigation, rendered from NAV in the same order and grouping as mm.html.
 *
 * Each group is a collapsible disclosure rather than a permanently open list:
 * with nine groups and ~29 links the rail is taller than a laptop viewport, and
 * the groups below the fold are the ones nobody uses every day. The group holding
 * the current route is always open, so a deep link like /in/Tithes still shows
 * itself as selected on load.
 *
 * The component serves two layouts (see {@link Shell}). From `lg` up it is a rail
 * in the page flow that can be collapsed; below that it is an overlay drawer that
 * slides in over the content. It stays mounted either way, so the groups the user
 * opened are still open when it comes back, and the drawer keeps its own scroll
 * position while the content scrolls behind it.
 */

import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import { NAV } from '@/lib/constants'
import { Icon } from '@/components/Icon'
import { can } from '@/lib/permissions'
import { useAuth } from '@/auth/AuthContext'

/** Collapsed/expanded state per group label, so it survives navigation. */
type OpenGroups = Record<string, boolean>

export function Sidebar({ shown = true, onHide }: { shown?: boolean; onHide?: () => void }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState<OpenGroups>({})

  const groups = NAV.map((group) => ({
    ...group,
    // The group itself may be out of reach; an item may narrow that further (the
    // Administration group opens up for an administrator, the audit trail in it is
    // his alone). A group with nothing left in it is dropped rather than left as a
    // heading with no links under it.
    items:
      group.needs !== undefined && !can(user, group.needs)
        ? []
        : group.items.filter((item) => item.needs === undefined || can(user, item.needs)),
  })).filter((group) => group.items.length > 0)

  /** The group that owns the current path, or null when nothing matches. */
  const activeGroup = (() => {
    const path = `/${location.pathname.replace(/^\/+/, '')}`
    return (
      groups.find((group) =>
        group.items.some((item) => `/${item.k}` === path || path.startsWith(`/${item.k}/`)),
      )?.label ?? null
    )
  })()

  // Open the active group on mount and whenever the route moves to another one,
  // without collapsing a group the user opened by hand on a route inside it.
  useEffect(() => {
    if (activeGroup === null) return
    setOpen((previous) => (previous[activeGroup] ? previous : { ...previous, [activeGroup]: true }))
  }, [activeGroup])

  const isOpen = (label: string) => open[label] === true

  function toggle(label: string) {
    setOpen((previous) => ({ ...previous, [label]: !previous[label] }))
  }

  return (
    <aside
      id="sidebar"
      className={[
        'w-[250px] max-w-[80vw] shrink-0 overflow-y-auto bg-sidebar py-3.5 text-sidebar-ink',
        // Drawer: overlays the content and slides in from the left.
        'fixed inset-y-0 left-0 z-40 shadow-2xl transition-transform duration-200 ease-out',
        shown ? 'translate-x-0' : '-translate-x-full',
        // Rail: back in the page flow from `lg` up, where there is room for it.
        'lg:static lg:z-auto lg:max-w-none lg:translate-x-0 lg:shadow-none lg:transition-none',
        // A collapsed rail on a wide screen takes no space at all.
        shown ? '' : 'lg:hidden',
      ].join(' ')}
      style={{ paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))' }}
    >
      <h1 className="flex items-center gap-2.5 border-b border-sidebar-hi px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent2/15 text-[#7fc4f0]">
          <Icon name="church" className="text-[17px]" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="text-[15px] font-bold text-white">Church Finance</span>
          <span className="text-[11px] text-[#9fb7c9]">Management System</span>
        </span>
        {onHide ? (
          <button
            type="button"
            onClick={onHide}
            className="ghost shrink-0 !border-sidebar-hi px-1.5 py-1.5 !text-[#9fc4de]"
            title="Hide navigation"
            aria-label="Hide navigation"
            aria-controls="sidebar"
            aria-expanded
          >
            <Icon name="hideNavigation" className="text-[12px]" />
          </button>
        ) : null}
      </h1>

      <nav>
        {groups.map((group) => {
          const expanded = isOpen(group.label)
          const panelId = `nav-${group.label.replace(/\W+/g, '-').toLowerCase()}`
          return (
            <div key={group.label} className="mt-1">
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => toggle(group.label)}
                className="gh flex w-full items-center gap-2 px-4 py-2 text-left text-xs uppercase tracking-[0.3px] text-[#9fb7c9] hover:bg-sidebar-hi hover:text-white"
              >
                <Icon name={group.icon} className="text-[12px] opacity-80" />
                <span className="flex-1">{group.label}</span>
                <Icon
                  name={expanded ? 'chevronUp' : 'chevronDown'}
                  className="text-[10px] opacity-70"
                />
              </button>

              {expanded ? (
                <div id={panelId}>
                  {group.items.map((item) => (
                    <NavLink
                      key={item.k}
                      to={item.k}
                      className={({ isActive }) =>
                        [
                          'block border-l-[3px] border-l-transparent py-1.5 pl-[26px] pr-4 text-[14px] text-sidebar-ink hover:bg-sidebar-hi',
                          isActive
                            ? 'border-l-accent2 bg-sidebar-hi font-bold text-white'
                            : '',
                        ].join(' ')
                      }
                    >
                      {item.l}
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </nav>

      <div className="mt-6 border-t border-sidebar-hi px-4 pt-3 text-[12px] text-[#9fb7c9]">
        {user ? (
          <>
            <div className="font-bold text-white">{user.full_name}</div>
            <div style={{ wordBreak: 'break-all' }}>{user.email}</div>
            {/* Every role says what it is - the secretary working the collections is
                not an anomaly worth leaving unmarked. */}
            <div className="mt-0.5 text-[#7fc4f0]">{user.role_label}</div>
            <button
              type="button"
              onClick={() => void logout()}
              className="ghost mt-2.5 !border-[#4a7fa5] !text-[#9fc4de]"
            >
              Sign out
            </button>
          </>
        ) : null}
      </div>
    </aside>
  )
}