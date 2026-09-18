import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useChangeUserRole,
  useDeactivateUser,
  useResendInvite,
  useRestoreUser,
} from "../use-users";
import { PORTAL_ROLES, ROLE_LABEL, type AdminUser, type PortalRole } from "../types";

/**
 * Per-row actions: change role, resend invite, deactivate or restore.
 *
 * Nothing here pre-empts the server's rules. The API refuses a
 * self-change, the last platform admin, and a merchant owner — each with
 * its own message — and those refusals surface as toasts. Hiding the
 * controls instead would mean duplicating those rules in the frontend,
 * where they would drift.
 *
 * `isSelf` is the one exception: the acting admin's own row is visibly
 * marked, because that refusal is predictable and the alternative is
 * inviting a click that always fails.
 */
export function UserRowActions({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  const [confirmingDeactivate, setConfirmingDeactivate] = useState(false);

  const changeRole = useChangeUserRole();
  const deactivate = useDeactivateUser();
  const restore = useRestoreUser();
  const resendInvite = useResendInvite();

  const currentRole = (user.roles[0] ?? "merchant") as PortalRole;
  const isDeactivated = user.status === "deactivated";
  const busy =
    changeRole.isPending ||
    deactivate.isPending ||
    restore.isPending ||
    resendInvite.isPending;

  return (
    <div className="flex items-center justify-end gap-2">
      <Select
        value={currentRole}
        disabled={isSelf || isDeactivated || busy}
        onValueChange={(role) => changeRole.mutate({ id: user.id, role: role as PortalRole })}
      >
        <SelectTrigger size="sm" className="w-[9.5rem]" aria-label={`Role for ${user.name}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PORTAL_ROLES.map((role) => (
            <SelectItem key={role} value={role}>
              {ROLE_LABEL[role]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!isDeactivated && (
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => resendInvite.mutate(user.id)}
        >
          Resend invite
        </Button>
      )}

      {isDeactivated ? (
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => restore.mutate(user.id)}
        >
          Restore
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          disabled={isSelf || busy}
          className="text-destructive hover:text-destructive"
          onClick={() => setConfirmingDeactivate(true)}
        >
          Deactivate
        </Button>
      )}

      <AlertDialog open={confirmingDeactivate} onOpenChange={setConfirmingDeactivate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {user.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They are signed out immediately and cannot sign in again. Their record and
              history are kept, and the account can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deactivate.mutate(user.id)}>
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
