import { registerOnUnauthorized } from "@/lib/api/client";
import { useAuthStore } from "./store";

type Navigate = (path: string) => void;
type ClearQueryCache = () => void;

let navigate: Navigate = () => {};
let clearQueryCache: ClearQueryCache = () => {};

/** Wired once from providers.tsx, where the router and query client live. */
export function setSessionNavigator(fn: Navigate): void {
  navigate = fn;
}

export function setQueryClientClear(fn: ClearQueryCache): void {
  clearQueryCache = fn;
}

export const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please sign in again.";

// Any un-suppressed 401, anywhere, means the token is no longer valid.
registerOnUnauthorized(() => {
  const { status, clear, setSessionNotice } = useAuthStore.getState();
  // Idempotent: two in-flight 401s must not clear and navigate twice.
  if (status === "guest") return;

  clear();
  clearQueryCache();
  setSessionNotice(SESSION_EXPIRED_MESSAGE);
  navigate("/login");
});
