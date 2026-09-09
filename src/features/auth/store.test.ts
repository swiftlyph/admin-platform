import { beforeEach, describe, expect, it } from "vitest";
import {
  useAuthStore,
  selectIsPlatformAdmin,
  PLATFORM_ADMIN_ROLE,
  type AuthState,
} from "./store";
import type { AuthUser } from "@/lib/api/types";

function user(roles: string[]): AuthUser {
  return { id: 1, name: "A", email: "a@gasa.test", roles, merchant: null };
}

describe("auth store", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ status: "guest", token: null, user: null, sessionNotice: null });
  });

  it("persists only the token on setAuthed, never the user", () => {
    useAuthStore.getState().setAuthed("tok", user([PLATFORM_ADMIN_ROLE]));

    expect(useAuthStore.getState().status).toBe("authed");
    expect(localStorage.getItem("gasa_admin_auth_token")).toBe("tok");
    // Roles can be revoked server-side between sessions, so the user object
    // is rehydrated from /auth/me on every boot rather than read back from
    // storage. Nothing in storage should mention it.
    expect(JSON.stringify(localStorage)).not.toContain(PLATFORM_ADMIN_ROLE);
  });

  it("clears the persisted token on clear", () => {
    useAuthStore.getState().setAuthed("tok", user([PLATFORM_ADMIN_ROLE]));
    useAuthStore.getState().clear();

    expect(useAuthStore.getState().status).toBe("guest");
    expect(useAuthStore.getState().user).toBeNull();
    expect(localStorage.getItem("gasa_admin_auth_token")).toBeNull();
  });

  it("uses a token key distinct from the merchant portal's", () => {
    useAuthStore.getState().setAuthed("tok", user([PLATFORM_ADMIN_ROLE]));

    // Both portals may share a domain in deployment; a collision here would
    // hand one app the other's bearer token.
    expect(localStorage.getItem("gasa_merchant_auth_token")).toBeNull();
  });
});

describe("selectIsPlatformAdmin", () => {
  function state(user: AuthUser | null): AuthState {
    return { ...useAuthStore.getState(), user };
  }

  it("is true only when the platform_admin role is present", () => {
    expect(selectIsPlatformAdmin(state(user([PLATFORM_ADMIN_ROLE])))).toBe(true);
    expect(selectIsPlatformAdmin(state(user(["support"])))).toBe(false);
    expect(selectIsPlatformAdmin(state(user([])))).toBe(false);
  });

  it("is false with no user (guest, or booting before /auth/me resolves)", () => {
    expect(selectIsPlatformAdmin(state(null))).toBe(false);
  });

  it("is false, not a crash, when roles is missing from the payload", () => {
    // Defensive: a partial/legacy payload without `roles` must fail closed
    // rather than throw inside a render-time route guard.
    const malformed = { id: 1, name: "A", email: "a@b.c", merchant: null } as AuthUser;
    expect(selectIsPlatformAdmin(state(malformed))).toBe(false);
  });
});
