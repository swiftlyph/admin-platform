/**
 * Shapes verified against the API source, not guessed:
 * App\Domains\Platform\Http\Resources\{AdminUserListResource,
 * AdminUserDetailResource} and IndexAdminUsersRequest.
 */

/** The four global portal roles. Mirrors the API's PortalRole. */
export type PortalRole = "platform_admin" | "company_admin" | "employee" | "merchant";

export const PORTAL_ROLES: PortalRole[] = [
  "platform_admin",
  "company_admin",
  "employee",
  "merchant",
];

export const ROLE_LABEL: Record<PortalRole, string> = {
  platform_admin: "Platform admin",
  company_admin: "Company admin",
  employee: "Employee",
  merchant: "Merchant",
};

/** Derived server-side from `deleted_at` — never stored. */
export type UserStatus = "active" | "deactivated";

export type RoleInMerchant = "owner" | "manager" | "staff";

export interface UserMerchant {
  id: number;
  name: string;
  status: "pending" | "active" | "suspended";
  role_in_merchant: RoleInMerchant | null;
}

/** One row of GET /admin/users. */
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  roles: string[];
  status: UserStatus;
  merchant: UserMerchant | null;
  created_at: string | null;
}

/** An audit_logs entry, as embedded in a user's history. */
export interface UserHistoryEntry {
  id: number;
  actor: { id: number; name: string; email: string };
  action: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  context: Record<string, unknown> | null;
  created_at: string;
}

/** GET /admin/users/{user}, and the 201 body of POST /admin/users. */
export interface AdminUserDetail {
  id: number;
  name: string;
  email: string;
  roles: string[];
  status: UserStatus;
  merchants: (UserMerchant & { is_owner: boolean })[];
  history: UserHistoryEntry[];
  created_at: string | null;
  updated_at: string | null;
  deactivated_at: string | null;
  /** Present in local/development only — never in production. */
  invite?: { token: string; expires_at: string; url: string };
}

export interface PageLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

/** Laravel's LengthAwarePaginator meta. */
export interface PageMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface AdminUsersPage {
  data: AdminUser[];
  links: PageLinks;
  meta: PageMeta;
}

export interface AdminUsersFilters {
  role?: PortalRole;
  status?: UserStatus;
  search?: string;
  page?: number;
  /** 1-100, defaults server-side to 25. */
  perPage?: number;
}
