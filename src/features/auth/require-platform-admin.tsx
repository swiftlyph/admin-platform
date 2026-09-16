import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { RequireAuth } from "./require-auth";
import { selectIsPlatformAdmin, useAuthStore } from "./store";

/**
 * RequireAuth (guest -> /login) plus the operator role check: an authed
 * non-admin goes to /no-access rather than seeing marketplace-wide data.
 *
 * Both this and /no-access read selectIsPlatformAdmin, so they can never
 * disagree about which side of the boundary a user belongs on.
 */
export function RequirePlatformAdmin({ children }: PropsWithChildren) {
  return (
    <RequireAuth>
      <PlatformAdminGate>{children}</PlatformAdminGate>
    </RequireAuth>
  );
}

function PlatformAdminGate({ children }: PropsWithChildren) {
  const isPlatformAdmin = useAuthStore(selectIsPlatformAdmin);

  if (!isPlatformAdmin) {
    return <Navigate to="/no-access" replace />;
  }

  return <>{children}</>;
}
