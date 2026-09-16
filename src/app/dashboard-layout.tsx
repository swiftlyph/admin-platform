import { Link, Outlet, useMatches } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

interface RouteHandle {
  title?: string;
  /** Set on a detail route to show a two-level trail. */
  parentTitle?: string;
  parentPath?: string;
}

/**
 * Authenticated app shell: the collapsible nav rail plus a header, wrapping
 * an <Outlet /> for the nested /app routes. The wrapper lives here once
 * rather than being repeated per route.
 */
export function DashboardLayout() {
  const matches = useMatches();
  const handle =
    matches
      .slice()
      .reverse()
      .find((m) => (m.handle as RouteHandle | undefined)?.title)?.handle as
      | RouteHandle
      | undefined;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          {/*
            No SidebarTrigger here: the collapse control lives on the rail's own
            wordmark row (see AppSidebar), so the page header carries the
            breadcrumb alone rather than two competing chrome elements.
          */}
          <div className="flex flex-1 items-center gap-2 px-4">
            <Breadcrumb>
              <BreadcrumbList>
                {handle?.parentTitle && (
                  <>
                    <BreadcrumbItem className="hidden md:block">
                      {handle.parentPath ? (
                        <BreadcrumbLink asChild>
                          <Link to={handle.parentPath}>{handle.parentTitle}</Link>
                        </BreadcrumbLink>
                      ) : (
                        handle.parentTitle
                      )}
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                  </>
                )}
                <BreadcrumbItem>
                  <BreadcrumbPage>{handle?.title ?? "Gasa Admin"}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="px-4">
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
