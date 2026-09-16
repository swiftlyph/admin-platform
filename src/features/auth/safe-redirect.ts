/** Where a signed-in admin lands when there's no valid path to return to. */
export const DEFAULT_AUTHED_PATH = "/app";

/**
 * Narrows an post-login redirect target to an in-app path.
 *
 * `from` is attacker-influenceable: RequireAuth copies it out of the URL the
 * browser was sent to, so a crafted link can put anything there. Passing it
 * straight to navigate() is an open redirect — and react-router 6 has a known
 * one via backslashes (CVE-2025-68470), so the check below rejects those too
 * rather than relying on the router to normalize them.
 *
 * Accepts only a single-slash-prefixed path. Rejects protocol-relative
 * (`//evil.com`), backslash (`/\evil.com`), and absolute URLs.
 */
export function toSafeRedirectPath(from: unknown): string {
  if (typeof from !== "string" || from === "") {
    return DEFAULT_AUTHED_PATH;
  }

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(from);
  const startsWithSlash = from.startsWith("/");
  const isProtocolRelative = from.startsWith("//") || from.startsWith("/\\");

  if (hasScheme || !startsWithSlash || isProtocolRelative || from.includes("\\")) {
    return DEFAULT_AUTHED_PATH;
  }

  return from;
}
