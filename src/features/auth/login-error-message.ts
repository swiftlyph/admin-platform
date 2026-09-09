import { ApiError } from "@/lib/api/client";
import type { ApiFieldErrors } from "@/lib/api/types";

/** Mirrors the backend's login throttle window (429 "too_many_attempts" after
 *  the 6th attempt within a rolling minute) — matched here, not invented, so
 *  the UI doesn't invite a retry the server will just reject again. */
export const RETRY_COOLDOWN_SECONDS = 60;

const GENERIC_MESSAGE = "Something went wrong. Please try again.";

/**
 * What the login form should show for a failed attempt.
 *
 * `fieldErrors` and `alert` are mutually exclusive by construction: a 422
 * marks up the offending inputs, everything else is a form-level message.
 * `cooldown` is only ever set by the throttle branch.
 */
export interface LoginErrorPresentation {
  fieldErrors: ApiFieldErrors;
  alert: string | null;
  cooldown: number;
}

/**
 * Maps a rejected login into what the user sees. Extracted from the page so
 * the copy for each backend failure mode lives in one readable table rather
 * than inside a mutation callback — and so it can be reasoned about (and
 * tested) without rendering a form.
 *
 * Deliberately total: an unrecognized ApiError falls through to the server's
 * own message, and a non-ApiError (a thrown string, a bug) still produces
 * something safe rather than leaking an internal error to the login screen.
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
