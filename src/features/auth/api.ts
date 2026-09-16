import { api, type RequestOptions } from "@/lib/api/client";
import type { AuthUser } from "@/lib/api/types";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

/**
 * `portal: "admin"` is what makes the backend reject a merchant or
 * company account here with 403 "portal_forbidden" — same mechanism the
 * merchant portal uses with `portal: "merchant"`.
 *
 * The value must be one of the keys in the API's `config/portals.php`
 * (`admin` | `company` | `employee` | `merchant`), which LoginRequest
 * validates with Rule::in. It is NOT the role name: the `admin` portal
 * maps to the `platform_admin` role. Sending the role name instead was a
 * real bug — it 422'd every login attempt, and went unnoticed because
 * the offline mock was written from this file's own assumption rather
 * than from the API.
 *
 * A wrong password is an expected, in-band 401 — never treated as a session expiring.
 */
export function login(credentials: LoginCredentials): Promise<LoginResponse> {
  return api.post<LoginResponse>(
    "/auth/login",
    { ...credentials, portal: "admin" },
    { suppressUnauthorized: true },
  );
}

export function fetchMe(options?: RequestOptions): Promise<AuthUser> {
  return api.get<AuthUser>("/auth/me", options);
}

/** Revokes only the current token. Callers clear local state regardless of the outcome. */
export function logout(): Promise<void> {
  return api.post<void>("/auth/logout", undefined, { suppressUnauthorized: true });
}
