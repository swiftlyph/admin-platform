import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "./store";

/** Authed-only route guard. "booting" is resolved by providers.tsx before
 *  this renders, so there is no third state to handle. */
export function RequireAuth({ children }: PropsWithChildren) {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === "guest") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
