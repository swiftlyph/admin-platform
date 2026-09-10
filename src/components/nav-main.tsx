import { Link, useMatch } from "react-router-dom"
import { ChevronRightIcon } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import type { NavItem, NavSection } from "@/components/nav-items"

/**
 * The nav body: one pinned top-level destination, then collapsible sections.
 *
 * Sections open and close rather than sitting permanently expanded, so the
 * rail shows its shape (what kinds of things exist here) before its contents.
 * A section holding the current route starts open — the rail must never hide
 * where you already are.
 */
export function NavMain({
  pinned,
  sections,
}: {
  pinned: NavItem[]
  sections: NavSection[]
}) {
  return (
    <SidebarGroup className={GROUP_FULL_BLEED}>
      <SidebarMenu>
        {pinned.map((item) => (
          <NavLeafItem key={item.title} item={item} />
        ))}

        {sections.map((section) => (
          <NavSectionItem key={section.label} section={section} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

/**
 * Collapsed (icon-width) rail: sections have no meaning without their labels,
 * and SidebarMenuSub hides itself there, so every destination is flattened
 * into one icon column. Swapped by CSS rather than JS, so no resize listener
 * or state is involved.
 *
 * Keeps the primitive's own `p-2` — at icon width the rail is a column of
 * square targets, and a full-bleed row would leave the icons no margin.
 */
export function NavMainCollapsed({ items }: { items: NavItem[] }) {
  return (
    <SidebarGroup className="hidden group-data-[collapsible=icon]:block">
      <SidebarMenu>
        {items.map((item) => (
          <NavLeafItem key={item.title} item={item} collapsed />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

/**
 * SidebarGroup ships `p-2`, which insets every row 8px from both rail edges.
 * That inset is what made the active chip read as a floating pill. Dropping
 * the group's horizontal padding lets a row span the full rail width, and the
 * rows below carry `px-3` of their own so the *text* sits where it always did
 * — only the chip's edges move.
 */
const GROUP_FULL_BLEED = "px-0"

/**
 * A full-bleed row: square on the left edge so the fill meets the rail, and
 * `px-3` of content inset so labels keep their old position.
 */
const ROW_FULL_BLEED = "rounded-none px-3 text-[0.8125rem] tracking-[0.005em]"

/**
 * The active row is a SOLID band with inverted text, running the full width
 * of the rail. `sidebar-primary` is near-ink in light and near-white in dark,
 * so the inversion follows the theme with no brand hue introduced.
 *
 * Shared by top-level rows and sub-rows so "you are here" looks identical at
 * both depths.
 */
const ACTIVE_BAND =
  "rail-row data-active:rail-active data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary data-active:hover:text-sidebar-primary-foreground"

/** Matches a route and any of its children (/app/merchants/12 keeps Merchants lit). */
function useIsActive(url: string): boolean {
  return Boolean(useMatch({ path: url, end: false }))
}

/** A top-level destination with no children — rendered as a plain row. */
function NavLeafItem({ item, collapsed }: { item: NavItem; collapsed?: boolean }) {
  const isActive = useIsActive(item.url)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={item.title}
        isActive={isActive}
        className={collapsed ? ACTIVE_BAND : `${ROW_FULL_BLEED} ${ACTIVE_BAND}`}
      >
        <Link to={item.url}>
          {item.icon}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function NavSectionItem({ section }: { section: NavSection }) {
  return (
    // Open by default. When no section holds the current route, leaving one
    // open and one shut is an arbitrary asymmetry the user has to interpret;
    // showing everything is the honest resting state for a five-item rail.
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          {/*
            The section header is a control, not a destination — no `asChild`
            Link, and it never takes the active band. It carries the section's
            name in the console's mono micro-label, which separates a heading
            from a row by *kind* of type rather than by size alone.
          */}
          <SidebarMenuButton
            tooltip={section.label}
            aria-label={`${section.label} section`}
            className={`${ROW_FULL_BLEED} rail-heading h-7 mt-3 text-sidebar-foreground/40 hover:bg-transparent hover:text-sidebar-foreground/65`}
          >
            <span className="flex-1 truncate text-left">{section.label}</span>
            <ChevronRightIcon className="ml-auto size-3.5 shrink-0 opacity-60 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {/*
            No indent rule. The stock sub-list hangs its children off a left
            border at `mx-3.5`, which cannot coexist with a full-bleed active
            band — the band would start to the right of the rail edge. Depth is
            carried by the icon column instead: sub-rows keep the same `px-3`
            inset, and the section heading above them is what marks the level.
          */}
          <SidebarMenuSub className="mx-0 gap-0.5 border-none px-0">
            {section.items.map((item) => (
              <NavSubItem key={item.title} item={item} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function NavSubItem({ item }: { item: NavItem }) {
  const isActive = useIsActive(item.url)

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        asChild
        isActive={isActive}
        // h-8 against the top level's h-9: a half-step down in scale says
        // "child of the heading above" without an indent rule to say it.
        // Sub-rows sit at the same weight as top-level ones when active, so
        // "you are here" never changes character with depth.
        className={`h-9 translate-x-0 font-normal data-active:font-medium ${ROW_FULL_BLEED} ${ACTIVE_BAND}`}
      >
        <Link to={item.url}>
          {item.icon}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}
