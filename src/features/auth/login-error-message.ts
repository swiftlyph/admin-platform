import { ApiError } from "@/lib/api/client";
import type { ApiFieldErrors } from "@/lib/api/types";

/** Matches the backend's throttle window, so the UI never invites a retry
 *  the server will reject. */
export const RETRY_COOLDOWN_SECONDS = 60;

const GENERIC_MESSAGE = "Something went wrong. Please try again.";

/**
 * `fieldErrors` and `alert` are mutually exclusive: a 422 marks up the
 * inputs, everything else is a form-level message.
 */
export interface LoginErrorPresentation {
  fieldErrors: ApiFieldErrors;
  alert: string | null;
  cooldown: number;
}

/**
 * Maps a rejected login to what the user sees, so each backend failure mode
 * has its copy in one readable table rather than inside a mutation callback.
 *
 * Total by design: an unrecognized ApiError falls back to the server message,
 * and a non-ApiError still produces something safe.
 */
export function toLoginErrorPresentation(error: unknown): LoginErrorPresentation {
  const base: LoginErrorPresentation = {
    fieldErrors: {},
    alert: null,
    cooldown: 0,
  };

  if (!(error instanceof ApiError)) {
    return { ...base, alert: GENERIC_MESSAGE };
  }

  // Validation: mark up the fields themselves rather than showing a banner.
  if (error.status === 422) {
    return { ...base, fieldErrors: error.errors ?? {} };
  }

  if (error.status === 401 && error.code === "invalid_credentials") {
    // Deliberately doesn't say which of the two was wrong — that difference
    // is only useful to someone guessing at accounts.
    return { ...base, alert: "Email or password is incorrect" };
  }

  if (error.status === 429) {
    return {
      ...base,
      alert: "Too many attempts, try again in a minute",
      cooldown: RETRY_COOLDOWN_SECONDS,
    };
  }

  if (error.status === 403 && error.code === "portal_forbidden") {
    return {
      ...base,
      alert:
        "This account can't access the admin platform. Merchants and companies sign in through their own portal.",
    };
  }

  return { ...base, alert: error.message };
}
