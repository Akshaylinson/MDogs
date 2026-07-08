import { initDB, initDefaults, getAll, getSetting } from "./db.js";
import { initTheme } from "./theme.js";
import { getPageName, getQueryParam, escapeHtml } from "./helpers.js";
import { initDashboard } from "./dashboard.js";
import { initFavoritesPage } from "./favorites.js";
import { initSettingsPage } from "./settings.js";
import { fetchCategoryMedia } from "./gallery.js";
import { openViewer } from "./viewer.js";
import { openSlideshow } from "./slideshow.js";
import { addMediaFiles, createUploadQueue } from "./upload.js";
import { notify } from "./notifications.js";
import { put as putRow, getById, del as delRow } from "./db.js";
import { existingTags } from "./tags.js";

function mediaUrl(item) {
  const blob = item.thumbnailBlob || item.blobData;
  return blob ? URL.createObjectURL(blob) : "";
}

async function initCategoryPage() {
  const app = document.getElementById("app");
  const modalRoot = document.getElementById("modal-root");
  const categoryId = getQueryParam("id");
  const category = await getById("categories", categoryId);
  if (!category) {
    app.innerHTML = `<div style="padding:60px 20px;text-align:center;color:#aaa;">Category not found.</div>`;
    return;
  }

  const state = { search: "", type: "all", favorites: false, sort: "newest", tag: "" };
  let queue = [];
  let mediaItems = [];
  const urlCache = new Map();

  function getUrl(item) {
    if (!urlCache.has(item.id)) {
      const u = mediaUrl(item);
      if (u) urlCache.set(item.id, u);
    }
    return urlCache.get(item.id) || "";
  }
  window.addEventListener("beforeunload", () => urlCache.forEach((u) => URL.revokeObjectURL(u)), { once: true });

  // ── Upload Modal ─────────────────────────────────────────────────────────
  function openUploadModal() {
    queue = [];
    modalRoot.innerHTML = `
      <div id="upload-backdrop" style="
        position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:200;
        display:flex;align-items:center;justify-content:center;padding:16px;">
        <div style="background:#fff;border-radius:4px;width:100%;max-width:500px;box-shadow:0 8px 40px rgba(0,0,0,.22);overflow:hidden;display:flex;flex-direction:column;max-height:90vh;">

          <!-- Header -->
          <div style="background:#2874f0;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <div style="color:#fff;font-size:16px;font-weight:700;">Upload Media</div>
              <div style="color:#bbdefb;font-size:12px;margin-top:2px;">Add files to <strong>${escapeHtml(category.name)}</strong></div>
            </div>
            <button id="upload-close" style="background:none;border:none;cursor:pointer;color:#fff;line-height:1;">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Body -->
          <div style="padding:20px;display:flex;flex-direction:column;gap:16px;overflow-y:auto;flex:1;min-height:0;">

            <!-- Dropzone -->
            <div id="upload-dropzone" style="
              position:relative;border:2px dashed #d0d0d0;border-radius:4px;
              padding:28px 16px;text-align:center;cursor:pointer;background:#fafafa;transition:border-color .2s;">
              <input id="upload-file-input" type="file" multiple
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;" />
              <svg width="36" height="36" fill="none" stroke="#bbb" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 10px;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <p style="font-size:13px;font-weight:600;color:#555;">Drop files here or click to browse</p>
              <p style="font-size:11px;color:#aaa;margin-top:4px;">JPG, PNG, WEBP, GIF, MP4, WEBM</p>
            </div>

            <!-- Queue list -->
            <div id="upload-queue" style="max-height:240px;overflow-y:auto;"></div>

          </div>

          <!-- Footer -->
          <div style="padding:0 20px 20px;display:flex;gap:10px;justify-content:flex-end;">
            <button id="upload-clear" style="height:40px;padding:0 18px;border:1px solid #d0d0d0;border-radius:2px;background:#fff;color:#555;font-size:14px;cursor:pointer;">Clear</button>
            <button id="upload-cancel" style="height:40px;padding:0 18px;border:1px solid #d0d0d0;border-radius:2px;background:#fff;color:#555;font-size:14px;cursor:pointer;">Cancel</button>
            <button id="upload-submit" style="height:40px;padding:0 24px;border:none;border-radius:2px;background:#2874f0;color:#fff;font-size:14px;font-weight:700;cursor:pointer;">Upload</button>
          </div>
        </div>
      </div>
    `;

    function renderModalQueue() {
      const host = document.getElementById("upload-queue");
      if (!host) return;
      host.innerHTML = queue.length
        ? queue.map((e) => `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;background:#f5f5f5;border-radius:3px;padding:8px 10px;font-size:12px;">
              <div style="min-width:0;">
                <p style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(e.name)}</p>
                <p style="color:#aaa;">${Math.round(e.size / 1024)} KB</p>
              </div>
              <button data-remove="${e.id}" style="background:#fff;border:1px solid #ffcdd2;color:#e53935;font-size:11px;padding:3px 8px;border-radius:2px;cursor:pointer;flex-shrink:0;">✕</button>
            </div>`)
          .join("")
        : `<p style="font-size:12px;color:#bbb;text-align:center;padding:4px 0;">No files queued yet.</p>`;
    }

    renderModalQueue();

    const dropzone = document.getElementById("upload-dropzone");
    const fileInput = document.getElementById("upload-file-input");

    const addToQueue = (files) => { queue = queue.concat(createUploadQueue(files)); renderModalQueue(); };
    fileInput.addEventListener("change", () => addToQueue(fileInput.files));
    dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.style.borderColor = "#2874f0"; dropzone.style.background = "#e8f0fe"; });
    dropzone.addEventListener("dragleave", () => { dropzone.style.borderColor = "#d0d0d0"; dropzone.style.background = "#fafafa"; });
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.style.borderColor = "#d0d0d0";
      dropzone.style.background = "#fafafa";
      addToQueue(e.dataTransfer.files);
    });

    function closeModal() { modalRoot.innerHTML = ""; }

    document.getElementById("upload-close").addEventListener("click", closeModal);
    document.getElementById("upload-cancel").addEventListener("click", closeModal);
    document.getElementById("upload-backdrop").addEventListener("click", (e) => { if (e.target.id === "upload-backdrop") closeModal(); });

    document.getElementById("upload-clear").addEventListener("click", () => { queue = []; renderModalQueue(); });

    document.getElementById("upload-queue").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-remove]");
      if (btn) { queue = queue.filter((q) => q.id !== btn.dataset.remove); renderModalQueue(); }
    });

    document.getElementById("upload-submit").addEventListener("click", async () => {
      if (!queue.length) return;
      const submitBtn = document.getElementById("upload-submit");
      submitBtn.disabled = true;
      submitBtn.textContent = "Uploading…";
      await addMediaFiles(categoryId, queue.map((q) => q.file), (p) => {
        if (submitBtn) submitBtn.textContent = `Uploading ${p}%`;
      });
      closeModal();
      await refreshTags();
      await refresh();
    });
  }

  // ── Gallery renderer ─────────────────────────────────────────────────────
  function renderGallery(items) {
    const gallery = document.getElementById("gallery");
    const summary = document.getElementById("catSummary");
    if (summary) summary.textContent = items.length;
    document.getElementById("mediaCount").textContent = String(items.length);
    document.getElementById("favoriteCount").textContent = String(items.filter((i) => i.isFavorite).length);

    if (!items.length) {
      gallery.innerHTML = `
        <div style="grid-column:1/-1;background:#fff;border-radius:4px;padding:60px 20px;text-align:center;color:#aaa;">
          <svg width="48" height="48" fill="none" stroke="#d0d0d0" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 12px;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <p style="font-size:14px;font-weight:500;">No media yet</p>
          <p style="font-size:12px;margin-top:4px;">Click <strong style="color:#2874f0;">+ Upload</strong> to add files.</p>
        </div>`;
      return;
    }

    gallery.innerHTML = items.map((item) => {
      const url = getUrl(item);
      const isVideo = item.mediaType === "video";
      return `
        <div class="fk-media-card" data-action="open" data-id="${item.id}" style="cursor:pointer;">
          <div class="fk-media-thumb-wrap">
            ${url
              ? (isVideo
                  ? `<video src="${url}" class="fk-media-thumb" muted playsinline preload="metadata"></video>`
                  : `<img src="${url}" class="fk-media-thumb" alt="${escapeHtml(item.fileName)}" loading="lazy" />`)
              : `<div class="fk-media-thumb" style="display:flex;align-items:center;justify-content:center;">
                   <svg width="32" height="32" fill="none" stroke="#90caf9" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                 </div>`}
            <div class="fk-media-overlay">
              <div style="display:flex;justify-content:flex-start;align-items:flex-start;">
                <span class="fk-chip">${isVideo ? "▶ Video" : "🖼 Image"}</span>
              </div>
              <div style="display:flex;justify-content:center;align-items:flex-end;padding-bottom:6px;">
                <button data-action="favorite" data-id="${item.id}" title="${item.isFavorite ? "Remove from favorites" : "Add to favorites"}" style="
                  background:none;border:none;cursor:pointer;padding:4px;line-height:1;
                  filter:drop-shadow(0 1px 3px rgba(0,0,0,.6));transition:transform .15s;"
                  onmouseover="this.style.transform='scale(1.2)'"
                  onmouseout="this.style.transform='scale(1)'">
                  <svg width="32" height="32" viewBox="0 0 24 24"
                    fill="${item.isFavorite ? "#e53935" : "rgba(255,255,255,.25)"}"
                    stroke="${item.isFavorite ? "#e53935" : "#fff"}"
                    stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  // ── Tag helpers ──────────────────────────────────────────────────────────
  async function refreshTags() {
    const suggestions = await existingTags();
    const tagSelect = document.getElementById("tag");
    if (tagSelect) {
      tagSelect.innerHTML = `<option value="">All tags</option>` +
        suggestions.map((t) => `<option value="${escapeHtml(t)}" ${state.tag === t ? "selected" : ""}>${escapeHtml(t)}</option>`).join("");
    }
  }

  async function refresh() {
    mediaItems = await fetchCategoryMedia(categoryId, state);
    renderGallery(mediaItems);
  }

  // ── Page shell ───────────────────────────────────────────────────────────
  app.innerHTML = `
    <div style="max-width:1280px;margin:0 auto;padding:20px 20px 40px;">

      <!-- Breadcrumb -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#888;">
          <a href="./index.html" style="color:#2874f0;text-decoration:none;font-weight:500;">Library</a>
          <span>›</span>
          <span style="color:#212121;font-weight:600;">${escapeHtml(category.name)}</span>
        </div>

        <!-- Filter bar -->
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:nowrap;">

          <!-- Search -->
          <div style="display:flex;align-items:center;background:#fff;border:1px solid #d0d0d0;border-radius:2px;overflow:hidden;height:36px;">
            <span style="padding:0 10px;color:#888;display:flex;align-items:center;flex-shrink:0;">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </span>
            <input id="search" type="text" placeholder="Search…"
              style="border:none;outline:none;font-size:13px;color:#333;background:transparent;width:110px;padding-right:8px;" />
          </div>

          <!-- Media type toggle -->
          <div style="display:flex;border:1px solid #d0d0d0;border-radius:2px;overflow:hidden;height:36px;background:#fff;">
            <button id="typeAll" title="All media" style="width:36px;display:flex;align-items:center;justify-content:center;border:none;background:#2874f0;cursor:pointer;">
              <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </button>
          </div>

          <!-- Upload -->
          <button id="openUpload" title="Upload media" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:#ff9f00;border:none;border-radius:2px;cursor:pointer;flex-shrink:0;">
            <svg width="16" height="16" fill="none" stroke="white" stroke-width="2.2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </button>

          <!-- Slideshow -->
          <button id="slideshow" title="Start slideshow" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:#2874f0;border:none;border-radius:2px;cursor:pointer;flex-shrink:0;">
            <svg width="16" height="16" fill="white" stroke="white" stroke-width="1" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>

          <!-- Hamburger filter menu -->
          <div style="position:relative;">
            <button id="filterMenuBtn" title="Filters" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid #d0d0d0;border-radius:2px;cursor:pointer;flex-shrink:0;">
              <svg width="16" height="16" fill="none" stroke="#555" stroke-width="2.2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>

            <!-- Dropdown -->
            <div id="filterMenu" style="
              display:none;position:absolute;top:42px;right:0;z-index:100;
              background:#fff;border:1px solid #e0e0e0;border-radius:4px;
              box-shadow:0 4px 16px rgba(0,0,0,.12);min-width:180px;overflow:hidden;">

              <div style="padding:8px 12px;font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid #f0f0f0;">Media Type</div>

              <button id="typeImage" style="width:100%;display:flex;align-items:center;gap:10px;padding:10px 14px;border:none;background:#fff;cursor:pointer;font-size:13px;color:#333;">
                <svg width="15" height="15" fill="none" stroke="#555" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Images only
              </button>
              <button id="typeVideo" style="width:100%;display:flex;align-items:center;gap:10px;padding:10px 14px;border:none;background:#fff;cursor:pointer;font-size:13px;color:#333;border-top:1px solid #f5f5f5;">
                <svg width="15" height="15" fill="none" stroke="#555" stroke-width="2" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                Videos only
              </button>

              <div style="padding:8px 12px;font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.08em;border-top:1px solid #f0f0f0;border-bottom:1px solid #f0f0f0;margin-top:4px;">Filter</div>

              <div style="padding:6px 14px;border-top:1px solid #f5f5f5;display:flex;align-items:center;gap:10px;">
                <svg width="14" height="14" fill="none" stroke="#555" stroke-width="2" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                <select id="tag" style="flex:1;border:1px solid #e0e0e0;border-radius:2px;font-size:12px;padding:5px 6px;color:#333;outline:none;background:#fff;cursor:pointer;">
                  <option value="">All tags</option>
                </select>
              </div>

              <button id="favoriteFilter" style="width:100%;display:flex;align-items:center;gap:10px;padding:10px 14px;border:none;background:#fff;cursor:pointer;font-size:13px;color:#333;border-top:1px solid #f5f5f5;">
                <svg id="favIcon" width="15" height="15" fill="none" stroke="#555" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <span id="favFilterLabel">Favorites only</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats box -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);background:#fff;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,.08);overflow:hidden;margin-bottom:20px;">
        <div style="padding:14px 16px;border-right:1px solid #f0f0f0;text-align:center;">
          <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap;">Total Items</div>
          <div id="catSummary" style="font-size:26px;font-weight:700;color:#212121;margin-top:4px;line-height:1;">—</div>
        </div>
        <div style="padding:14px 16px;border-right:1px solid #f0f0f0;text-align:center;">
          <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.07em;">Media</div>
          <div id="mediaCount" style="font-size:26px;font-weight:700;color:#2874f0;margin-top:4px;line-height:1;">0</div>
        </div>
        <div style="padding:14px 16px;text-align:center;">
          <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.07em;">Favorites</div>
          <div id="favoriteCount" style="font-size:26px;font-weight:700;color:#e53935;margin-top:4px;line-height:1;">0</div>
        </div>
      </div>

      <!-- Full-width gallery -->
      <div id="gallery" class="fk-media-grid"></div>
    </div>
  `;

  // Hamburger filter menu toggle
  const filterMenuBtn = document.getElementById("filterMenuBtn");
  const filterMenu = document.getElementById("filterMenu");
  filterMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = filterMenu.style.display === "block";
    filterMenu.style.display = open ? "none" : "block";
    filterMenuBtn.style.background = open ? "#fff" : "#e8f0fe";
    filterMenuBtn.style.borderColor = open ? "#d0d0d0" : "#2874f0";
  });
  document.addEventListener("click", () => {
    filterMenu.style.display = "none";
    filterMenuBtn.style.background = "#fff";
    filterMenuBtn.style.borderColor = "#d0d0d0";
  });
  filterMenu.addEventListener("click", (e) => e.stopPropagation());

  // Navbar search
  const navSearch = document.getElementById("navbar-search");
  if (navSearch) navSearch.addEventListener("input", (e) => { state.search = e.target.value; refresh(); });

  document.getElementById("search").addEventListener("input", (e) => { state.search = e.target.value; refresh(); });
  document.getElementById("tag").addEventListener("change", (e) => { state.tag = e.target.value; refresh(); });

  // Type icon toggle helpers
  function setTypeActive(type) {
    state.type = type;
    // Grid button: blue when "all", white otherwise
    const allBtn = document.getElementById("typeAll");
    if (allBtn) {
      allBtn.style.background = type === "all" ? "#2874f0" : "#fff";
      allBtn.querySelector("svg").setAttribute("stroke", type === "all" ? "white" : "#555");
    }
    // Dropdown items: highlight active
    const imgBtn = document.getElementById("typeImage");
    const vidBtn = document.getElementById("typeVideo");
    if (imgBtn) imgBtn.style.background = type === "image" ? "#e8f0fe" : "#fff";
    if (vidBtn) vidBtn.style.background = type === "video" ? "#e8f0fe" : "#fff";
    filterMenu.style.display = "none";
    refresh();
  }
  document.getElementById("typeAll").addEventListener("click", () => setTypeActive("all"));
  document.getElementById("typeImage").addEventListener("click", () => setTypeActive("image"));
  document.getElementById("typeVideo").addEventListener("click", () => setTypeActive("video"));

  app.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    const card = e.target.closest(".fk-media-card[data-action='open']");

    if (btn?.id === "openUpload") { openUploadModal(); return; }

    if (btn?.id === "slideshow") {
      const items = await fetchCategoryMedia(categoryId, state);
      const interval = Number(await getSetting("slideshowInterval", 5));
      openSlideshow(items, interval);
      return;
    }

    if (btn?.id === "favoriteFilter") {
      state.favorites = !state.favorites;
      const favIcon = document.getElementById("favIcon");
      const favLabel = document.getElementById("favFilterLabel");
      const favBtn = document.getElementById("favoriteFilter");
      favBtn.style.background = state.favorites ? "#fce4e4" : "#fff";
      if (favIcon) { favIcon.setAttribute("fill", state.favorites ? "#e53935" : "none"); favIcon.setAttribute("stroke", state.favorites ? "#e53935" : "#555"); }
      if (favLabel) favLabel.style.color = state.favorites ? "#e53935" : "#333";
      filterMenu.style.display = "none";
      await refresh();
      return;
    }

    // Favorite button on card
    if (btn?.dataset.action === "favorite") {
      e.stopPropagation();
      const item = mediaItems.find((m) => m.id === btn.dataset.id);
      if (!item) return;
      item.isFavorite = !item.isFavorite;
      item.updatedAt = new Date().toISOString();
      await putRow("media", item);
      notify(item.isFavorite ? "Added to favorites" : "Removed from favorites");
      await refresh();
      return;
    }

    // Click anywhere on card → open viewer
    if (card && !btn) {
      const item = mediaItems.find((m) => m.id === card.dataset.id);
      if (!item) return;
      openViewer(mediaItems, mediaItems.findIndex((m) => m.id === item.id), {
        onChange: refresh,
        onDelete: refresh,
        onEditTags: async (mediaItem, rerender) => {
          const val = prompt("Comma-separated tags:", (mediaItem.tags || []).join(", "));
          if (val == null) return;
          mediaItem.tags = val.split(",").map((t) => t.trim()).filter(Boolean);
          mediaItem.updatedAt = new Date().toISOString();
          await putRow("media", mediaItem);
          rerender?.();
          await refreshTags();
          notify("Tags updated");
        },
      });
    }
  });

  await refreshTags();
  await refresh();
}

async function main() {
  await initDB();
  await initDefaults();
  await initTheme();

  const page = getPageName();
  if (page === "dashboard") await initDashboard();
  if (page === "favorites") await initFavoritesPage();
  if (page === "settings") await initSettingsPage();
  if (page === "category") await initCategoryPage();
}

main().catch((error) => {
  console.error(error);
  const app = document.getElementById("app");
  if (app) app.innerHTML = `<div style="padding:60px 20px;text-align:center;color:#aaa;">Failed to load: ${escapeHtml(error.message)}</div>`;
});
