import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { RequireAuth } from "./require-auth";
import { selectIsPlatformAdmin, useAuthStore } from "./store";

/**
 * Wraps RequireAuth (guest -> /login) with the operator role check: an
 * authed user who isn't a platform admin is sent to /no-access rather than
 * shown marketplace-wide data.
 *
 * The merchant portal's equivalent gate (RequireActiveMerchant) asks "is
 * this tenant suspended". That question has no meaning here — the platform
 * admin operates the marketplace rather than belonging to it — so the
 * question this gate asks is "does this account hold the operator role".
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
