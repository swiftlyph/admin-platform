import type { ReactNode } from "react"

/**
 * The nav's shape and its contents, kept apart from the components that
 * render it.
 *
 * Two reasons this is its own module rather than living in nav-main.tsx or
 * app-sidebar.tsx:
 *
 * - a file that exports both components and plain values can't be
 *   hot-reloaded reliably (react-refresh/only-export-components), and
 * - the set of destinations is configuration, not presentation. When nav
 *   eventually comes from the API — filtered by what a role may see — this
 *   is the one file that changes.
 */

export interface NavItem {
  title: string
  url: string
  icon?: ReactNode
}

export interface NavSection {
  label: string
  items: NavItem[]
}

/** Every destination, depth-flattened — what the collapsed icon rail shows. */
export function flattenNav(pinned: NavItem[], sections: NavSection[]): NavItem[] {
  return [...pinned, ...sections.flatMap((section) => section.items)]
}
