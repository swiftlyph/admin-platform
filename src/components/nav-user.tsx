import { LogOutIcon } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/features/auth/store"
import { useMe } from "@/features/auth/use-me"
import { useLogout } from "@/features/auth/use-logout"

/**
 * Footer identity + sign out, laid out as a flex row rather than
 * SidebarMenuButton + SidebarMenuAction: that pairing positions the action
 * absolutely with size-specific offsets, which put it on a different
 * baseline and inset than every nav row.
 */
export function NavUser() {
  const storeUser = useAuthStore((s) => s.user)
  const { data: user } = useMe()
  const logout = useLogout()

  const displayUser = user ?? storeUser
  const name = displayUser?.name ?? "…"
  const email = displayUser?.email

  return (
    <>
      {/* The same fading rule that closes the masthead — one device, used at
          both ends of the rail. */}
      <div aria-hidden="true" className="rail-rule mb-2 group-data-[collapsible=icon]:hidden" />

      <div className="flex items-center gap-2 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <Avatar className="size-8 shrink-0 rounded-lg">
          <AvatarFallback className="rounded-lg bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/*
          Name over email, not name over role. The role line read "PLATFORM
          ADMIN" directly beneath a user literally named "Platform Admin" —
          the same words twice. The email is the line that actually differs
          between two operators, which is what a footer identity is for.
        */}
        <div className="grid min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
          <span className="truncate text-[0.8125rem] font-medium leading-snug">{name}</span>
          {email && (
            <span className="truncate text-[0.6875rem] leading-snug text-sidebar-foreground/45">
              {email}
            </span>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Sign out"
          title="Sign out"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="shrink-0 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden"
        >
          <LogOutIcon />
        </Button>
      </div>
    </>
  )
}
