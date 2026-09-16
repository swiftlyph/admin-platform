import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useAuthStore } from "@/features/auth/store";
import { useAuthBoot } from "@/features/auth/use-auth-boot";
import { setQueryClientClear, setSessionNavigator } from "@/features/auth/session";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// session.ts needs these but must not depend on the router or query client.
setQueryClientClear(() => queryClient.clear());
setSessionNavigator((path) => router.navigate(path));

/** Holds the whole router behind the boot check, so a refresh on an authed
 *  session never flashes /login first. */
function AuthGate() {
  useAuthBoot();
  const status = useAuthStore((s) => s.status);

  if (status === "booting") {
    return <FullScreenLoader />;
  }

  return <RouterProvider router={router} />;
}

export function Providers() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthGate />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
