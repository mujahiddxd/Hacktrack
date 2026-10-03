/**
 * Tells page animations whether the full-screen sign-in splash is covering the page, so
 * they can wait instead of playing unseen underneath it. Marked on <html data-splash="on">.
 */

const EVENT = "ht:splash-change";

export function setSplashActive(active: boolean) {
  const root = document.documentElement;
  if (active) root.dataset.splash = "on";
  else delete root.dataset.splash;
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeSplash(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export const isSplashActive = () => document.documentElement.dataset.splash === "on";
