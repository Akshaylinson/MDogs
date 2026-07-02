function root() {
  return document.getElementById("toast-root");
}

export function notify(message, type = "info") {
  const host = root();
  if (!host) return;
  const el = document.createElement("div");
  el.className = `toast-card fade-in text-sm max-w-sm ${type === "error" ? "border-red-200 dark:border-red-900" : ""}`;
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(-8px)";
    el.style.transition = "all 180ms ease";
    setTimeout(() => el.remove(), 220);
  }, 2600);
}
