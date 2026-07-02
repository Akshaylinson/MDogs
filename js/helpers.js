export function uid(prefix = "id") {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function formatDate(input) {
  if (!input) return "—";
  const date = new Date(input);
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatShortDate(input) {
  if (!input) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(input));
}

export function formatBytes(bytes = 0) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function debounce(fn, wait = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function safeText(value) {
  return String(value ?? "");
}

export function toArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}

export function fileExt(name = "") {
  return String(name).split(".").pop().toLowerCase();
}

export function isImageFile(file) {
  return /^image\/(jpeg|jpg|png|webp|gif)$/i.test(file.type);
}

export function isVideoFile(file) {
  return /^video\/(mp4|webm)$/i.test(file.type);
}

export async function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function getPageName() {
  const path = location.pathname.split("/").pop().toLowerCase();
  if (path.includes("category")) return "category";
  if (path.includes("favorites")) return "favorites";
  if (path.includes("settings")) return "settings";
  return "dashboard";
}

export function getQueryParam(name) {
  return new URLSearchParams(location.search).get(name);
}

export async function confirmAction(message, title = "Confirm") {
  return window.confirm(`${title}\n\n${message}`);
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
