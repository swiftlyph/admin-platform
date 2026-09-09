import { Navigate } from "react-router-dom";
import { ShieldAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore, selectIsPlatformAdmin } from "../store";
import { useLogout } from "../use-logout";

/**
 * `/no-access` — an authed account that isn't a platform admin. The
 * counterpart to the merchant portal's /suspended, but the cause is
 * different: nothing is wrong with the account, it simply isn't an
 * operator account, so the copy points at the right portal rather than
 * implying a problem to resolve.
 *
 * Self-guards both other directions (guest -> /login, platform admin ->
 * /app) so this page can't be linked into by someone who doesn't belong on
 * it, mirroring how SuspendedPage guards itself.
 */
export function NoAccessPage() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const isPlatformAdmin = useAuthStore(selectIsPlatformAdmin);
  const logout = useLogout();

  if (status === "guest") {
    return <Navigate to="/login" replace />;
  }

  if (isPlatformAdmin) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="flex min-h-svh items-start justify-center bg-background px-6 pt-[12vh]">
      <main className="w-full max-w-[21rem]">
        <span
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-md border border-border"
        >
          <ShieldAlertIcon className="size-5 text-muted-foreground" />
        </span>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          Access restricted
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {user?.name ? `${user.name}, this` : "This"} account doesn&apos;t carry
          platform administrator access. If you manage a storefront or a
          company, sign in through that portal instead.
        </p>

        <Button
          variant="outline"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="mt-7 h-10 w-full"
        >
          {logout.isPending ? "Signing out…" : "Sign out"}
        </Button>
      </main>
    </div>
  );
}
