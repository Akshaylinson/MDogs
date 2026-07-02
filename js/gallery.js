import { formatShortDate, downloadBlob, escapeHtml } from "./helpers.js";
import { getAll, put as putRow, del as delRow } from "./db.js";
import { notify } from "./notifications.js";

function mediaUrl(item) {
  if (!item) return "";
  const blob = item.thumbnailBlob || item.blobData;
  return blob ? URL.createObjectURL(blob) : "";
}

export async function fetchCategoryMedia(categoryId, filters = {}) {
  let items = (await getAll("media")).filter((item) => item.categoryId === categoryId);
  if (filters.search) {
    const term = filters.search.toLowerCase();
    items = items.filter((item) => item.fileName.toLowerCase().includes(term) || (item.tags || []).some((tag) => tag.toLowerCase().includes(term)));
  }
  if (filters.type === "image") items = items.filter((item) => item.mediaType === "image");
  if (filters.type === "video") items = items.filter((item) => item.mediaType === "video");
  if (filters.favorites) items = items.filter((item) => item.isFavorite);
  if (filters.tag) items = items.filter((item) => (item.tags || []).includes(filters.tag));
  if (filters.sort === "newest") items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (filters.sort === "oldest") items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return items;
}

export function renderMediaGrid(container, items, options = {}) {
  container.innerHTML = "";
  container.className = "media-grid";

  const releaseUrls = new Set();
  items.forEach((item) => {
    const url = mediaUrl(item);
    if (url) releaseUrls.add(url);
    const card = document.createElement("article");
    card.className = "media-card";
    card.innerHTML = `
      <div class="media-frame">
        ${item.mediaType === "video"
          ? `<video src="${url}" muted playsinline preload="metadata"></video>`
          : `<img src="${url}" alt="${escapeHtml(item.fileName)}" loading="lazy" />`}
        <div class="media-overlay">
          <div class="flex items-start justify-between gap-2">
            <span class="media-chip">${item.mediaType}</span>
            <button data-action="favorite" data-id="${item.id}" class="media-chip">${item.isFavorite ? "Fav" : "Save"}</button>
          </div>
          <div class="flex items-end justify-between gap-2">
            <div class="max-w-[70%]">
              <p class="truncate text-sm font-medium text-white">${escapeHtml(item.fileName)}</p>
              <p class="meta-mono text-white/80">${formatShortDate(item.createdAt)}</p>
            </div>
            <button data-action="open" data-id="${item.id}" class="media-chip">Preview</button>
          </div>
        </div>
      </div>
      <div class="media-card-body">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="truncate text-sm font-semibold">${escapeHtml(item.fileName)}</h3>
            <p class="mt-1 text-xs text-muted">${formatShortDate(item.createdAt)}</p>
          </div>
          <button data-action="delete" data-id="${item.id}" class="danger-button px-3 text-xs">Delete</button>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          ${(item.tags || []).slice(0, 4).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
        <div class="mt-3 flex gap-2 text-xs">
          <button data-action="download" data-id="${item.id}" class="ghost-button px-3 py-2">Download</button>
          <button data-action="edit-tags" data-id="${item.id}" class="ghost-button px-3 py-2">Edit Tags</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  container.onclick = async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const item = items.find((entry) => entry.id === button.dataset.id);
    if (!item) return;
    const action = button.dataset.action;
    if (action === "download") downloadBlob(item.blobData, item.fileName);
    if (action === "favorite") {
      item.isFavorite = !item.isFavorite;
      item.updatedAt = new Date().toISOString();
      await putRow("media", item);
      notify(item.isFavorite ? "Added to favorites" : "Removed from favorites");
      options.onChange?.();
    }
    if (action === "delete") {
      if (confirm(`Delete ${item.fileName}?`)) {
        await delRow("media", item.id);
        notify("Media deleted");
        options.onDelete?.();
      }
    }
    if (action === "edit-tags") options.onEditTags?.(item);
    if (action === "open") options.onOpen?.(item, items);
  };

  return () => {
    releaseUrls.forEach((url) => URL.revokeObjectURL(url));
  };
}
