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
  SidebarTrigger,
} from "@/components/ui/sidebar"

/**
 * Grouped rather than flat: the admin's job splits into "who is on the
 * marketplace" and "what moved through it".
 *
 * Only routes that exist today — a nav item pointing at an unbuilt page is a
 * dead end, not a roadmap.
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
 * shadcn's sidebar-07 block, collapsible to icons. The collapse control sits
 * on the wordmark row: the control that hides the rail belongs to the rail.
 *
 * No layout overrides on the structural slots — their own `p-2` is what puts
 * the wordmark, nav icons and footer avatar on one vertical axis.
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      // Applied on the wrapper so it reaches the inner container that
      // actually paints `bg-sidebar` — see components/sidebar.css.
      className="[&_[data-slot=sidebar-inner]]:rail-surface"
      {...props}
    >
      <SidebarHeader>
        {/* px-1 matches the footer row's inset, so the wordmark, every nav
            icon and the avatar share one left edge down the whole rail. */}
        <div className="flex h-9 items-center justify-between gap-2 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <span className="truncate font-mono text-sm font-bold uppercase tracking-[0.18em] group-data-[collapsible=icon]:hidden">
            {/* Optical centring: wide tracking adds a trailing space. */}
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
      {/* No SidebarRail: its hover bar lands exactly where the active row's
          curves meet the page, and the wordmark row already has the toggle. */}
    </Sidebar>
  )
}
