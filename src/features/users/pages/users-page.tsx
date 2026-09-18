import { useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/features/auth/store";
import { CreateUserDialog } from "../components/create-user-dialog";
import { RoleBadge } from "../components/role-badge";
import { UserRowActions } from "../components/user-row-actions";
import { useUsers } from "../use-users";
import {
  PORTAL_ROLES,
  ROLE_LABEL,
  type AdminUsersFilters,
  type PortalRole,
  type UserStatus,
} from "../types";

const ALL = "all";

/**
 * `/app/users` — every account on the platform, across all four portals.
 *
 * Filters live in the URL (?role=&status=&search=&page=) and drive the
 * server query, so a refresh or a shared link restores exactly this view.
 * Search is server-side here, unlike the merchant portal's orders list:
 * the API supports it, and a client-side filter over one page would
 * silently miss matches on every other page.
 */
export function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const roleParam = searchParams.get("role") ?? ALL;
  const statusParam = searchParams.get("status") ?? ALL;
  const searchParam = searchParams.get("search") ?? "";
  const pageParam = Number(searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const filters: AdminUsersFilters = {
    role: isPortalRole(roleParam) ? roleParam : undefined,
    status: isUserStatus(statusParam) ? statusParam : undefined,
    search: searchParam || undefined,
    page,
  };

  const { data, isPending, isError, error, refetch, isFetching } = useUsers(filters);

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === "" || value === ALL) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    setSearchParams(params);
  }

  const hasFilters = roleParam !== ALL || statusParam !== ALL || searchParam !== "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">
            Every account on the platform — admins, companies, employees and merchants.
          </p>
        </div>
        <CreateUserDialog />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="users-search" className="console-label text-muted-foreground">
            Search
          </label>
          <Input
            id="users-search"
            type="search"
            placeholder="Name or email…"
            className="w-56"
            value={searchParam}
            onChange={(e) => updateParams({ search: e.target.value, page: null })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="users-role" className="console-label text-muted-foreground">
            Role
          </label>
          <Select
            value={roleParam}
            onValueChange={(value) => updateParams({ role: value, page: null })}
          >
            <SelectTrigger id="users-role" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All roles</SelectItem>
              {PORTAL_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABEL[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="users-status" className="console-label text-muted-foreground">
            Status
          </label>
          <Select
            value={statusParam}
            onValueChange={(value) => updateParams({ status: value, page: null })}
          >
            <SelectTrigger id="users-status" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="deactivated">Deactivated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateParams({ role: null, status: null, search: null, page: null })}
          >
            Clear filters
          </Button>
        )}
      </div>

      {isPending && <UsersTableSkeleton />}

      {isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Couldn't load users."}
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isPending && !isError && data && data.data.length === 0 && (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm font-medium">No users found</p>
          <p className="text-sm text-muted-foreground">
            {hasFilters ? "Try a different filter." : "Add the first user to get started."}
          </p>
        </div>
      )}

      {!isPending && !isError && data && data.data.length > 0 && (
        <>
          <Table className={isFetching ? "opacity-60 transition-opacity" : undefined}>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((user) => {
                const isSelf = user.id === currentUserId;

                return (
                  <TableRow key={user.id} className={user.status === "deactivated" ? "opacity-60" : undefined}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {user.name}
                          {isSelf && (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              you
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {user.roles.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        user.roles.map((role) => <RoleBadge key={role} role={role} />)
                      )}
                    </TableCell>

                    <TableCell>
                      {user.merchant === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-col">
                          <span>{user.merchant.name}</span>
                          {user.merchant.role_in_merchant && (
                            <span className="text-xs text-muted-foreground">
                              {user.merchant.role_in_merchant}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge variant={user.status === "active" ? "outline" : "secondary"}>
                        {user.status === "active" ? "Active" : "Deactivated"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <UserRowActions user={user} isSelf={isSelf} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {data.meta.last_page > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={page <= 1}
                    className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      if (page > 1) updateParams({ page: String(page - 1) });
                    }}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="px-2 text-sm text-muted-foreground">
                    Page {data.meta.current_page} of {data.meta.last_page}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={page >= data.meta.last_page}
                    className={
                      page >= data.meta.last_page ? "pointer-events-none opacity-50" : undefined
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      if (page < data.meta.last_page) updateParams({ page: String(page + 1) });
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}

function isPortalRole(value: string): value is PortalRole {
  return (PORTAL_ROLES as string[]).includes(value);
}

function isUserStatus(value: string): value is UserStatus {
  return value === "active" || value === "deactivated";
}

function UsersTableSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
