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
import type { NavItem, NavSection } from "./nav-items"

/** One pinned destination, then collapsible sections. */
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

/** Collapsed rail: sections mean nothing without labels, so every
 *  destination flattens into one icon column. Swapped by CSS, not JS. */
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

/* Left padding only: the row must reach the rail's right edge so
   `--rail-overhang` can carry the active pill past it. */
const GROUP_FULL_BLEED = "pl-2 pr-0"

/* Content inset within each row; the pill's shape comes from `rail-row`. */
const ROW_FULL_BLEED = "px-3 text-[0.8125rem] tracking-[0.005em]"

/* The active row takes the page's own background — see `rail-active`.
   Shared by top-level and sub-rows so "you are here" reads the same. */
const ACTIVE_BAND =
  "rail-row data-active:rail-active data-active:text-foreground data-active:hover:text-foreground"

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
    // Open by default: with no section holding the route, one open and one
    // shut is an arbitrary asymmetry.
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={section.label}
            aria-label={`${section.label} section`}
            className={`${ROW_FULL_BLEED} rail-heading h-7 mt-4 mb-0.5 text-sidebar-foreground/40 hover:bg-transparent hover:text-sidebar-foreground/65`}
          >
            <span className="flex-1 truncate text-left">{section.label}</span>
            <ChevronRightIcon className="ml-auto size-3.5 shrink-0 opacity-60 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
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
        // Same height and active weight as top-level rows, so depth never
        // changes the "you are here" character.
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
