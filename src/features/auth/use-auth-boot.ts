import { useEffect } from "react";
import { fetchMe } from "./api";
import { useAuthStore } from "./store";

/**
 * Confirms a stored token against /auth/me before treating the user as
 * authed.
 *
 * Deliberately does NOT suppress the global 401 handler: a token the server
 * no longer honors IS an expired session. The .catch() only covers non-401
 * failures (e.g. network), where that handler never fires.
 */
export function useAuthBoot(): void {
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status !== "booting") return;

    let cancelled = false;
    const token = useAuthStore.getState().token;

    fetchMe()
      .then((user) => {
        if (cancelled || !token) return;
        useAuthStore.getState().setAuthed(token, user);
      })
      .catch(() => {
        if (cancelled) return;
        useAuthStore.getState().clear();
      });

    return () => {
      cancelled = true;
    };
  }, [status]);
}
