import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "./api";

export const meQueryKey = ["auth", "me"] as const;

/**
 * Proves the token still works as much as it fetches the user: a revoked
 * token 401s here and goes through the normal session-expiry path.
 *
 * Fetches once per session — never polls.
 */
export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: () => fetchMe(),
    staleTime: Infinity,
  });
}
