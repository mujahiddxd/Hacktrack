/**
 * Light / Dark / System theme.
 *
 * - The user's choice ("light" | "dark" | "system") is saved in localStorage under THEME_STORAGE_KEY.
 * - The resolved theme ("light" | "dark") is applied as <html data-theme> plus the theme-color meta.
 * - THEME_INIT_SCRIPT runs inline in <head> before first paint (see app/layout.tsx), so reloads never
 *   flash the wrong theme. React then reads the same storage, so server and client markup agree.
 */

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "hacktrack-theme";
const CHANGE_EVENT = "ht:theme-change";

/** Browser UI colour (address bar, PWA chrome) per resolved theme; matches --ht-canvas. */
export const THEME_COLORS: Record<ResolvedTheme, string> = { light: "#FEFDF8", dark: "#141418" };

/**
 * Inline, dependency-free version of readPreference + resolve + apply. Kept as a string so it can run
 * during HTML parsing. Any change here must stay in sync with the functions below.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});if(p!=="light"&&p!=="dark")p="system";var t=p==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):p;var d=document.documentElement;d.setAttribute("data-theme",t);d.style.colorScheme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="dark"?${JSON.stringify(
  THEME_COLORS.dark
)}:${JSON.stringify(THEME_COLORS.light)});}catch(e){}})();`;

export function readPreference(): ThemePreference {
  try {
    const p = localStorage.getItem(THEME_STORAGE_KEY);
    return p === "light" || p === "dark" ? p : "system";
  } catch {
    return "system";
  }
}

const systemQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === "system") return systemQuery().matches ? "dark" : "light";
  return pref;
}

/** Puts the resolved theme on <html>; changing CSS variables never restarts running animations. */
export function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
}

export function setPreference(pref: ThemePreference) {
  try {
    if (pref === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // Storage unavailable (private mode): the choice still applies for this page view.
  }
  applyTheme(resolveTheme(pref));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** For useSyncExternalStore: fires on our own changes, other tabs (storage event) and OS changes. */
export function subscribeTheme(cb: () => void) {
  const mq = systemQuery();
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY) {
      applyTheme(resolveTheme(readPreference()));
      cb();
    }
  };
  const onSystem = () => {
    if (readPreference() === "system") applyTheme(resolveTheme("system"));
    cb();
  };
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener("storage", onStorage);
  mq.addEventListener("change", onSystem);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener("storage", onStorage);
    mq.removeEventListener("change", onSystem);
  };
}
