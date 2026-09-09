export type Theme = "gasa" | "gasadark";

/**
 * Namespaced per portal ("gasa-admin-theme" vs the merchant portal's
 * "gasa-theme"). Different localhost ports are already separate origins, so
 * this isn't about dev — it's for a deploy where both portals sit on one
 * domain under different paths and would otherwise share (and clobber) a
 * single key. Keep in sync with the no-flash boot script in index.html.
 */
const STORAGE_KEY = "gasa-admin-theme";

export function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "gasa" || value === "gasadark" ? value : null;
  } catch {
    return null;
  }
}

export function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "gasadark"
    : "gasa";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "gasadark");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage unavailable (e.g. private browsing) — theme still applies for this load.
  }
}
