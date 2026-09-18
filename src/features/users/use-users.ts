import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import {
  changeUserRole,
  createUser,
  deactivateUser,
  fetchUsers,
  resendInvite,
  restoreUser,
  type CreateUserPayload,
} from "./api";
import type { AdminUsersFilters, PortalRole } from "./types";

export const usersQueryKey = (filters: AdminUsersFilters) =>
  ["admin", "users", filters] as const;

/** The users list, filtered and server-paginated. */
export function useUsers(filters: AdminUsersFilters) {
  return useQuery({
    queryKey: usersQueryKey(filters),
    queryFn: () => fetchUsers(filters),
    placeholderData: (previous) => previous,
  });
}

/**
 * Every mutation below invalidates the whole `admin/users` key rather
 * than patching a cached page: a role change can move a row between
 * filtered views, and a deactivation changes which list it belongs to,
 * so a surgical update would leave stale rows visible.
 */
function useInvalidateUsers() {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
}

/**
 * Surfaces the API's own message. The backend names each refusal
 * precisely (`last_platform_admin`, `user_owns_merchant`,
 * `cannot_modify_self`), and those messages are written to be shown —
 * inventing frontend copy for them would drift from the rules the server
 * actually enforces.
 */
function toastApiError(error: unknown, fallback: string): void {
  toast.error(error instanceof ApiError ? error.message : fallback);
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: (user) => {
      void invalidate();
      toast.success(`${user.name} invited.`);
    },
    onError: (error) => toastApiError(error, "Could not create the user."),
  });
}

export function useChangeUserRole() {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: PortalRole }) => changeUserRole(id, role),
    onSuccess: (user) => {
      void invalidate();
      toast.success(`${user.name}'s role updated.`);
    },
    onError: (error) => toastApiError(error, "Could not change the role."),
  });
}

export function useDeactivateUser() {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: (id: number) => deactivateUser(id),
    onSuccess: () => {
      void invalidate();
      toast.success("User deactivated.");
    },
    onError: (error) => toastApiError(error, "Could not deactivate the user."),
  });
}

export function useRestoreUser() {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: (id: number) => restoreUser(id),
    onSuccess: (user) => {
      void invalidate();
      toast.success(`${user.name} reactivated.`);
    },
    onError: (error) => toastApiError(error, "Could not restore the user."),
  });
}

export function useResendInvite() {
  return useMutation({
    mutationFn: (id: number) => resendInvite(id),
    onSuccess: () => toast.success("Invite resent. The previous link no longer works."),
    onError: (error) => toastApiError(error, "Could not resend the invite."),
  });
}
