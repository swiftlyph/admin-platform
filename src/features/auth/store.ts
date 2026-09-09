import { create } from "zustand";
import { registerTokenGetter } from "@/lib/api/client";
import type { AuthUser } from "@/lib/api/types";

export type AuthStatus = "booting" | "guest" | "authed";

/** Namespaced per portal so a merchant-portal token on the same host is never picked up here. */
const TOKEN_STORAGE_KEY = "gasa_admin_auth_token";

/** The role that grants operator access. Sourced from the backend's role list. */
export const PLATFORM_ADMIN_ROLE = "platform_admin";

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Storage unavailable (e.g. private browsing) — auth still works for this load.
  }
}

export interface AuthState {
  status: AuthStatus;
  /** Persisted. The only piece of auth state that survives a reload. */
  token: string | null;
  /** NEVER persisted — roles could go stale, so it's always rehydrated from /auth/me. */
  user: AuthUser | null;
  /** A one-shot message for the login page, e.g. after a forced logout. */
  sessionNotice: string | null;
  setAuthed: (token: string, user: AuthUser) => void;
  /** Replaces the user without touching status/token — a mid-session refresh, not a login. */
  setUser: (user: AuthUser) => void;
  /** Drops back to a signed-out state, clearing the persisted token. */
  clear: () => void;
  setSessionNotice: (notice: string | null) => void;
}

const initialToken = readStoredToken();

export const useAuthStore = create<AuthState>((set) => ({
  status: initialToken ? "booting" : "guest",
  token: initialToken,
  user: null,
  sessionNotice: null,
  setAuthed: (token, user) => {
    persistToken(token);
    set({ status: "authed", token, user, sessionNotice: null });
  },
  setUser: (user) => set({ user }),
  clear: () => {
    persistToken(null);
    set({ status: "guest", token: null, user: null });
  },
  setSessionNotice: (notice) => set({ sessionNotice: notice }),
}));

// Wired once, at module load: the api client asks this store for the bearer
// token on every request rather than reading storage directly.
registerTokenGetter(() => useAuthStore.getState().token);

/**
 * The single source of truth for role-based routing, so RequirePlatformAdmin
 * and the login page can never disagree about who belongs inside /app.
 *
 * This is a UI guard, not a security boundary — it decides what to render,
 * while the backend remains responsible for authorizing every /platform/*
 * request. Roles are never persisted (see `user` above), so this always
 * reads a value freshly rehydrated from /auth/me rather than from storage.
 */
export function selectIsPlatformAdmin(state: AuthState): boolean {
  return state.user?.roles?.includes(PLATFORM_ADMIN_ROLE) ?? false;
}
