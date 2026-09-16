import type { ReactNode } from "react"

/**
 * Nav shape and contents, kept apart from the components that render it: a
 * file exporting both components and values cannot hot-reload reliably, and
 * this is the one file that changes when nav becomes role-filtered.
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
