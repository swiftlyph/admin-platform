import { api } from "@/lib/api/client";
import type {
  AdminUser,
  AdminUserDetail,
  AdminUsersFilters,
  AdminUsersPage,
  PortalRole,
} from "./types";

/**
 * Parsers stay additive-tolerant: extra keys the API adds later pass
 * through untouched, and fields that would crash a render if missing
 * (arrays, nullable merchant) are normalized defensively so a partial
 * payload degrades instead of throwing.
 */

function normalizeUser(raw: Partial<AdminUser> | null | undefined): AdminUser {
  return {
    id: raw?.id ?? 0,
    name: raw?.name ?? "",
    email: raw?.email ?? "",
    roles: Array.isArray(raw?.roles) ? raw.roles : [],
    status: raw?.status ?? "active",
    merchant: raw?.merchant ?? null,
    created_at: raw?.created_at ?? null,
  };
}

function normalizeDetail(raw: Partial<AdminUserDetail> | null | undefined): AdminUserDetail {
  return {
    id: raw?.id ?? 0,
    name: raw?.name ?? "",
    email: raw?.email ?? "",
    roles: Array.isArray(raw?.roles) ? raw.roles : [],
    status: raw?.status ?? "active",
    merchants: Array.isArray(raw?.merchants) ? raw.merchants : [],
    history: Array.isArray(raw?.history) ? raw.history : [],
    created_at: raw?.created_at ?? null,
    updated_at: raw?.updated_at ?? null,
    deactivated_at: raw?.deactivated_at ?? null,
    invite: raw?.invite,
  };
}

function buildQuery(filters: AdminUsersFilters): string {
  const params = new URLSearchParams();
  if (filters.role) params.set("role", filters.role);
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.perPage) params.set("per_page", String(filters.perPage));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchUsers(filters: AdminUsersFilters = {}): Promise<AdminUsersPage> {
  const raw = await api.get<Partial<AdminUsersPage>>(`/admin/users${buildQuery(filters)}`);

  return {
    data: Array.isArray(raw.data) ? raw.data.map(normalizeUser) : [],
    links: {
      first: raw.links?.first ?? null,
      last: raw.links?.last ?? null,
      prev: raw.links?.prev ?? null,
      next: raw.links?.next ?? null,
    },
    meta: {
      current_page: raw.meta?.current_page ?? 1,
      from: raw.meta?.from ?? null,
      last_page: raw.meta?.last_page ?? 1,
      path: raw.meta?.path ?? "",
      per_page: raw.meta?.per_page ?? 0,
      to: raw.meta?.to ?? null,
      total: raw.meta?.total ?? 0,
    },
  };
}

export function fetchUser(id: number | string): Promise<AdminUserDetail> {
  return api.get<Partial<AdminUserDetail>>(`/admin/users/${id}`).then(normalizeDetail);
}

export interface CreateUserPayload {
  name: string;
  email: string;
  role: PortalRole;
}

export function createUser(payload: CreateUserPayload): Promise<AdminUserDetail> {
  return api.post<Partial<AdminUserDetail>>("/admin/users", payload).then(normalizeDetail);
}

export function changeUserRole(id: number, role: PortalRole): Promise<AdminUserDetail> {
  return api
    .patch<Partial<AdminUserDetail>>(`/admin/users/${id}/role`, { role })
    .then(normalizeDetail);
}

export function deactivateUser(id: number): Promise<void> {
  return api.delete<void>(`/admin/users/${id}`);
}

export function restoreUser(id: number): Promise<AdminUserDetail> {
  return api.post<Partial<AdminUserDetail>>(`/admin/users/${id}/restore`).then(normalizeDetail);
}

export function resendInvite(id: number): Promise<{ message: string; code: string }> {
  return api.post<{ message: string; code: string }>(`/admin/users/${id}/resend-invite`);
}
