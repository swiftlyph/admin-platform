import { Badge } from "@/components/ui/badge";
import { ROLE_LABEL, type PortalRole } from "../types";

/**
 * A portal role, shown as a label rather than the raw snake_case value.
 *
 * `platform_admin` is the only one given weight: it is the role that can
 * reach this console at all, so an operator scanning the list needs to
 * see at a glance who else holds it.
 */
export function RoleBadge({ role }: { role: string }) {
  const known = role in ROLE_LABEL;
  const label = known ? ROLE_LABEL[role as PortalRole] : role;

  return (
    <Badge variant={role === "platform_admin" ? "default" : "secondary"}>{label}</Badge>
  );
}
