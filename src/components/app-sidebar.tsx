import {
  LayoutDashboardIcon,
  Building2Icon,
  StoreIcon,
  ArrowLeftRightIcon,
  TicketCheckIcon,
} from "lucide-react"
import { NavMain, NavMainCollapsed } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { flattenNav, type NavItem, type NavSection } from "@/components/nav-items"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"

/**
 * One pinned destination plus two collapsible sections. Grouped rather than
 * flat (the merchant portal's nav is one flat list) because the platform
 * admin's job splits cleanly into "who is on the marketplace" and "what moved
 * through it".
 *
 * Only routes that exist today. Audit log is a real endpoint on the API
 * (`/admin/audit-logs`) but has no screen yet, and a nav item pointing at a
 * page that isn't built is a dead end, not a roadmap.
 */
const PINNED: NavItem[] = [
  { title: "Dashboard", url: "/app/dashboard", icon: <LayoutDashboardIcon /> },
]

const SECTIONS: NavSection[] = [
  {
    label: "Organizations",
    items: [
      { title: "Companies", url: "/app/companies", icon: <Building2Icon /> },
      { title: "Merchants", url: "/app/merchants", icon: <StoreIcon /> },
    ],
  },
  {
    label: "Ledger",
    items: [
      { title: "Transactions", url: "/app/transactions", icon: <ArrowLeftRightIcon /> },
      { title: "Redemptions", url: "/app/redemptions", icon: <TicketCheckIcon /> },
    ],
  },
]

const ALL_DESTINATIONS = flattenNav(PINNED, SECTIONS)

/**
 * Adapted from shadcn's sidebar-07 block: collapsible-to-icon Sidebar, no team
 * switcher or projects list.
 *
 * The collapse control sits on the wordmark row inside the rail rather than in
 * the page header — the control that hides the rail belongs to the rail, and
 * it keeps the app header free for breadcrumbs alone.
 *
 * No layout overrides on the structural slots: SidebarHeader, SidebarContent
 * and SidebarFooter each carry their own `p-2`, which is what puts the
 * wordmark, every nav icon and the footer avatar on one vertical axis.
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      // The rail's own surface: a value step below the page, a low-contrast
      // vertical wash, a hairline right edge and a hair of inward shadow —
      // see components/sidebar.css. Applied on the wrapper so it reaches the
      // inner container that actually paints `bg-sidebar`.
      className="[&_[data-slot=sidebar-inner]]:rail-surface"
      {...props}
    >
      <SidebarHeader>
        {/*
          Wordmark and collapse toggle share one row, as in the reference. No
          mark, by request — the wordmark carries it, set in the console's mono
          with wide tracking so letterforms read as engraved rather than typed.
          It hides at icon width, leaving the toggle centred on its own.
        */}
        {/* px-1 matches the footer row's inset, so the wordmark, every nav
            icon and the avatar share one left edge down the whole rail. */}
        <div className="flex h-9 items-center justify-between gap-2 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <span className="truncate font-mono text-sm font-bold uppercase tracking-[0.18em] group-data-[collapsible=icon]:hidden">
            {/* Optical centring: wide tracking adds a trailing space after the
                final letter that the eye reads as a left bias. */}
            <span className="-mr-[0.18em]">Gasa</span>
          </span>
          <SidebarTrigger className="shrink-0 text-sidebar-foreground/60 hover:text-sidebar-foreground" />
        </div>
        {/* Closes the masthead with the login plate's own fading rule, rather
            than a hard border that would read as a table edge. */}
        <div aria-hidden="true" className="rail-rule mt-1" />
      </SidebarHeader>

      <SidebarContent>
        {/* Expanded: pinned row + collapsible sections. */}
        <div className="group-data-[collapsible=icon]:hidden">
          <NavMain pinned={PINNED} sections={SECTIONS} />
        </div>
        {/* Collapsed: one flat icon column — sections mean nothing without labels. */}
        <NavMainCollapsed items={ALL_DESTINATIONS} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
