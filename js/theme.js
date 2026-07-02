import { getSetting, setSetting } from "./db.js";

export function systemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export async function applyTheme(theme) {
  const resolved = theme === "system" ? systemTheme() : theme;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export async function initTheme() {
  const saved = await getSetting("theme", "system");
  await applyTheme(saved);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener?.("change", async () => {
    const current = await getSetting("theme", "system");
    if (current === "system") applyTheme("system");
  });
}

export async function setTheme(theme) {
  await setSetting("theme", theme);
  await applyTheme(theme);
}
