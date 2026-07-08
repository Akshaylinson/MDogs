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
  const blob = item.mediaType === "video"
    ? item.blobData
    : (item.thumbnailBlob || item.blobData);
  return blob ? URL.createObjectURL(blob) : "";
}

async function initCategoryPage() {
  const app = document.getElementById("app");
  const modalRoot = document.getElementById("modal-root");
  const categoryId = getQueryParam("id");
  const category = await getById("categories", categoryId);
  if (!category) {
    app.innerHTML = `<div style="padding:60px 20px;text-align:center;color:#aaaaaa;">Category not found.</div>`;
    return;
  }

  const state = { search: "", type: "all", favorites: false, sort: "newest", tag: "" };
  let queue = [];
  let mediaItems = [];
  const urlCache = new Map();

  function getUrl(item) {
    if (!urlCache.has(item.id)) {
      const blob = item.thumbnailBlob || item.blobData;
      const u = blob ? URL.createObjectURL(blob) : "";
      if (u) urlCache.set(item.id, u);
    }
    return urlCache.get(item.id) || "";
  }
  window.addEventListener("beforeunload", () => urlCache.forEach((u) => URL.revokeObjectURL(u)), { once: true });

  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Upload Modal ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
  function openUploadModal() {
    queue = [];
    modalRoot.innerHTML = `
      <div id="upload-backdrop" style="
        position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:200;
        display:flex;align-items:center;justify-content:center;padding:16px;">
        <div style="background:#111;border-radius:4px;width:100%;max-width:500px;box-shadow:0 8px 40px rgba(0,0,0,.22);overflow:hidden;display:flex;flex-direction:column;max-height:90vh;">

          <!-- Header -->
          <div style="background:#AAFF20;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <div style="color:#000;font-size:16px;font-weight:700;">Upload Media</div>
              <div style="color:#000000;font-size:12px;margin-top:2px;">Add files to <strong>${escapeHtml(category.name)}</strong></div>
            </div>
            <button id="upload-close" style="background:none;border:none;cursor:pointer;color:#000;line-height:1;">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Body -->
          <div style="padding:20px;display:flex;flex-direction:column;gap:16px;overflow-y:auto;flex:1;min-height:0;">

            <!-- Dropzone -->
            <div id="upload-dropzone" style="
              position:relative;border:2px dashed #333;border-radius:4px;
              padding:28px 16px;text-align:center;cursor:pointer;background:#0d0d0d;transition:border-color .2s;">
              <input id="upload-file-input" type="file" multiple
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;" />
              <svg width="36" height="36" fill="none" stroke="#888" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 10px;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <p style="font-size:13px;font-weight:600;color:#fff;">Drop files here or click to browse</p>
              <p style="font-size:11px;color:#aaaaaa;margin-top:4px;">JPG, PNG, WEBP, GIF, MP4, WEBM</p>
            </div>

            <!-- Queue list -->
            <div id="upload-queue" style="max-height:240px;overflow-y:auto;"></div>

          </div>

          <!-- Footer -->
          <div style="padding:0 20px 20px;display:flex;gap:10px;justify-content:flex-end;">
            <button id="upload-clear" style="height:40px;padding:0 18px;border:1px solid #2a2a2a;border-radius:2px;background:#111;color:#fff;font-size:14px;cursor:pointer;">Clear</button>
            <button id="upload-cancel" style="height:40px;padding:0 18px;border:1px solid #2a2a2a;border-radius:2px;background:#111;color:#fff;font-size:14px;cursor:pointer;">Cancel</button>
            <button id="upload-submit" style="height:40px;padding:0 24px;border:none;border-radius:2px;background:#AAFF20;color:#000;font-size:14px;font-weight:700;cursor:pointer;">Upload</button>
          </div>
        </div>
      </div>
    `;

    function renderModalQueue() {
      const host = document.getElementById("upload-queue");
      if (!host) return;
      host.innerHTML = queue.length
        ? queue.map((e) => `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;background:#111;border-radius:3px;padding:8px 10px;font-size:12px;">
              <div style="min-width:0;">
                <p style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(e.name)}</p>
                <p style="color:#aaaaaa;">${Math.round(e.size / 1024)} KB</p>
              </div>
              <button data-remove="${e.id}" style="background:#111;border:1px solid #3a1010;color:#e53935;font-size:11px;padding:3px 8px;border-radius:2px;cursor:pointer;flex-shrink:0;">ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¢</button>
            </div>`)
          .join("")
        : `<p style="font-size:12px;color:#bbb;text-align:center;padding:4px 0;">No files queued yet.</p>`;
    }

    renderModalQueue();

    const dropzone = document.getElementById("upload-dropzone");
    const fileInput = document.getElementById("upload-file-input");

    const addToQueue = (files) => { queue = queue.concat(createUploadQueue(files)); renderModalQueue(); };
    fileInput.addEventListener("change", () => addToQueue(fileInput.files));
    dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.style.borderColor = "#AAFF20"; dropzone.style.background = "#0d1a00"; });
    dropzone.addEventListener("dragleave", () => { dropzone.style.borderColor = "#2a2a2a"; dropzone.style.background = "#0d0d0d"; });
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.style.borderColor = "#2a2a2a";
      dropzone.style.background = "#0d0d0d";
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
      submitBtn.textContent = "UploadingÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦";
      await addMediaFiles(categoryId, queue.map((q) => q.file), (p) => {
        if (submitBtn) submitBtn.textContent = `Uploading ${p}%`;
      });
      closeModal();
      await refreshTags();
      await refresh();
    });
  }

  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Gallery renderer ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
  function renderGallery(items) {
    const gallery = document.getElementById("gallery");
    const summary = document.getElementById("catSummary");
    if (summary) summary.textContent = items.length;
    document.getElementById("mediaCount").textContent = String(items.length);
    document.getElementById("favoriteCount").textContent = String(items.filter((i) => i.isFavorite).length);

    if (!items.length) {
      gallery.innerHTML = `
        <div style="grid-column:1/-1;background:#111;border-radius:4px;padding:60px 20px;text-align:center;color:#aaaaaa;">
          <svg width="48" height="48" fill="none" stroke="#2a2a2a" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 12px;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <p style="font-size:14px;font-weight:500;">No media yet</p>
          <p style="font-size:12px;margin-top:4px;">Click <strong style="color:#AAFF20;">+ Upload</strong> to add files.</p>
        </div>`;
      return;
    }

    gallery.innerHTML = items.map((item) => {
      const isVideo = item.mediaType === "video";
      const url = isVideo ? "" : getUrl(item);
      return `
        <div class="fk-media-card" data-action="open" data-id="${item.id}" style="cursor:pointer;">
          <div class="fk-media-thumb-wrap">
            ${isVideo
              ? `<video class="fk-media-thumb" data-video-id="${item.id}" muted playsinline preload="metadata" style="pointer-events:none;background:#000;"></video>`
              : `<img src="${url}" class="fk-media-thumb" alt="${escapeHtml(item.fileName)}" loading="lazy" />`}
            ${isVideo ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;">
              <div style="width:44px;height:44px;border-radius:50%;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,.85);">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#000" style="margin-left:3px;"><polygon points="6 3 20 12 6 21 6 3"/></svg>
              </div>
            </div>` : ""}
            <div class="fk-media-overlay">
              <div style="display:flex;justify-content:flex-start;align-items:flex-start;">
                <span class="fk-chip">${isVideo ? "ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¶ Video" : "ÃƒÂ°Ã…Â¸Ã¢â‚¬â€œÃ‚Â¼ Image"}</span>
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

  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Tag helpers ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
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
    // Set video src via JS after DOM insertion ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â innerHTML doesn't trigger video load
    document.querySelectorAll("video[data-video-id]").forEach((videoEl) => {
      const item = mediaItems.find((m) => m.id === videoEl.dataset.videoId);
      if (!item?.blobData) return;
      const existing = urlCache.get("v_" + item.id);
      if (existing) { videoEl.src = existing; return; }
      const url = URL.createObjectURL(item.blobData);
      urlCache.set("v_" + item.id, url);
      videoEl.src = url;
      videoEl.load();
    });
  }

  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Page shell ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
  app.innerHTML = `
    <div style="max-width:1280px;margin:0 auto;padding:20px 20px 40px;">

      <!-- Breadcrumb -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#888;">
          <a href="./index.html" style="color:#AAFF20;text-decoration:none;font-weight:500;">Library</a>
          <span>ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âº</span>
          <span style="color:#fff;font-weight:600;" data-cat-name>${escapeHtml(category.name)}</span>
        </div>

        <!-- Filter bar -->
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:nowrap;">

          <!-- Search -->
          <div style="display:flex;align-items:center;background:#111;border:1px solid #2a2a2a;border-radius:2px;overflow:hidden;height:36px;">
            <span style="padding:0 10px;color:#888;display:flex;align-items:center;flex-shrink:0;">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </span>
            <input id="search" type="text" placeholder="SearchÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦"
              style="border:none;outline:none;font-size:13px;color:#fff;background:transparent;width:110px;padding-right:8px;" />
          </div>

          <!-- Media type toggle -->
          <div style="display:flex;border:1px solid #2a2a2a;border-radius:2px;overflow:hidden;height:36px;background:#111;">
            <button id="typeAll" title="All media" style="width:36px;display:flex;align-items:center;justify-content:center;border:none;background:#AAFF20;cursor:pointer;">
              <svg width="16" height="16" fill="none" stroke="#000" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </button>
          </div>

          <!-- Upload -->
          <button id="openUpload" title="Upload media" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:#AAFF20;border:none;border-radius:2px;cursor:pointer;flex-shrink:0;">
            <svg width="16" height="16" fill="none" stroke="#000" stroke-width="2.2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </button>

          <!-- Slideshow -->
          <button id="slideshow" title="Start slideshow" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:#AAFF20;border:none;border-radius:2px;cursor:pointer;flex-shrink:0;">
            <svg width="16" height="16" fill="#000" stroke="#000" stroke-width="1" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>

          <!-- Hamburger filter menu -->
          <div style="position:relative;">
            <button id="filterMenuBtn" title="Filters" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:#111;border:1px solid #2a2a2a;border-radius:2px;cursor:pointer;flex-shrink:0;">
              <svg width="16" height="16" fill="none" stroke="#aaa" stroke-width="2.2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>

            <!-- Dropdown -->
            <div id="filterMenu" style="
              display:none;position:absolute;top:42px;right:0;z-index:100;
              background:#111;border:1px solid #2a2a2a;border-radius:4px;
              box-shadow:0 4px 16px rgba(0,0,0,.12);min-width:180px;overflow:hidden;">

              <div style="padding:8px 12px;font-size:10px;font-weight:700;color:#aaaaaa;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid #222222;">Media Type</div>

              <button id="typeImage" style="width:100%;display:flex;align-items:center;gap:10px;padding:10px 14px;border:none;background:#111;cursor:pointer;font-size:13px;color:#fff;">
                <svg width="15" height="15" fill="none" stroke="#aaa" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Images only
              </button>
              <button id="typeVideo" style="width:100%;display:flex;align-items:center;gap:10px;padding:10px 14px;border:none;background:#111;cursor:pointer;font-size:13px;color:#fff;border-top:1px solid #111;">
                <svg width="15" height="15" fill="none" stroke="#aaa" stroke-width="2" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                Videos only
              </button>

              <div style="padding:8px 12px;font-size:10px;font-weight:700;color:#aaaaaa;text-transform:uppercase;letter-spacing:.08em;border-top:1px solid #222;border-bottom:1px solid #222222;margin-top:4px;">Filter</div>

              <div style="padding:6px 14px;border-top:1px solid #111;display:flex;align-items:center;gap:10px;">
                <svg width="14" height="14" fill="none" stroke="#aaa" stroke-width="2" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                <select id="tag" style="flex:1;border:1px solid #2a2a2a;border-radius:2px;font-size:12px;padding:5px 6px;color:#fff;outline:none;background:#111;cursor:pointer;">
                  <option value="">All tags</option>
                </select>
              </div>

              <button id="favoriteFilter" style="width:100%;display:flex;align-items:center;gap:10px;padding:10px 14px;border:none;background:#111;cursor:pointer;font-size:13px;color:#fff;border-top:1px solid #111;">
                <svg id="favIcon" width="15" height="15" fill="none" stroke="#aaa" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <span id="favFilterLabel">Favorites only</span>
              </button>

              <div style="padding:8px 14px;border-top:1px solid #222;margin-top:2px;">
                <button id="resetFilters" style="width:100%;padding:8px 0;border:1px solid #2a2a2a;border-radius:2px;background:#111;color:#fff;font-size:12px;font-weight:600;cursor:pointer;margin-bottom:6px;">ÃƒÂ¢Ã¢â‚¬Â Ã‚Âº Reset Filters</button>
                <button id="catSettingsBtn" style="width:100%;padding:8px 0;border:1px solid #2a2a2a;border-radius:2px;background:#111;color:#fff;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  Category Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats box -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);background:#111;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,.08);overflow:hidden;margin-bottom:20px;">
        <div style="padding:14px 16px;border-right:1px solid #222222;text-align:center;">
          <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap;">Total Items</div>
          <div id="catSummary" style="font-size:26px;font-weight:700;color:#fff;margin-top:4px;line-height:1;">ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â</div>
        </div>
        <div style="padding:14px 16px;border-right:1px solid #222222;text-align:center;">
          <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.07em;">Media</div>
          <div id="mediaCount" style="font-size:26px;font-weight:700;color:#AAFF20;margin-top:4px;line-height:1;">0</div>
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
    filterMenuBtn.style.background = open ? "#111" : "#0d1a00";
    filterMenuBtn.style.borderColor = open ? "#2a2a2a" : "#AAFF20";
  });
  document.addEventListener("click", () => {
    filterMenu.style.display = "none";
    filterMenuBtn.style.background = "#111";
    filterMenuBtn.style.borderColor = "#2a2a2a";
  });
  filterMenu.addEventListener("click", (e) => e.stopPropagation());

  // helper to sync dropdown visual state
  function syncFilterUI() {
    const imgBtn   = document.getElementById("typeImage");
    const vidBtn   = document.getElementById("typeVideo");
    const allBtn   = document.getElementById("typeAll");
    const favBtn   = document.getElementById("favoriteFilter");
    const favIcon  = document.getElementById("favIcon");
    const favLabel = document.getElementById("favFilterLabel");
    const tagSel   = document.getElementById("tag");
    if (allBtn) { allBtn.style.background = state.type === "all" ? "#AAFF20" : "#111"; allBtn.querySelector("svg").setAttribute("stroke", state.type === "all" ? "#000" : "#aaa"); }
    if (imgBtn) imgBtn.style.background = state.type === "image" ? "#0d1a00" : "#111";
    if (vidBtn) vidBtn.style.background = state.type === "video" ? "#0d1a00" : "#111";
    if (favBtn)   favBtn.style.background   = state.favorites ? "#1a1111" : "#111";
    if (favIcon)  { favIcon.setAttribute("fill", state.favorites ? "#e53935" : "none"); favIcon.setAttribute("stroke", state.favorites ? "#e53935" : "#aaa"); }
    if (favLabel) { favLabel.textContent = state.favorites ? "ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Favorites only" : "Favorites only"; favLabel.style.color = state.favorites ? "#e53935" : "#fff"; }
    if (tagSel)   tagSel.value = state.tag;
  }

  document.getElementById("favoriteFilter").addEventListener("click", async () => {
    state.favorites = !state.favorites;
    syncFilterUI();
    filterMenu.style.display = "none";
    filterMenuBtn.style.background = "#111";
    filterMenuBtn.style.borderColor = "#2a2a2a";
    await refresh();
    if (state.favorites && !mediaItems.length) notify("No favorites in this category yet");
  });

  document.getElementById("resetFilters").addEventListener("click", async () => {
    state.type = "all"; state.favorites = false; state.tag = ""; state.search = "";
    const searchInput = document.getElementById("search");
    if (searchInput) searchInput.value = "";
    syncFilterUI();
    filterMenu.style.display = "none";
    filterMenuBtn.style.background = "#111";
    filterMenuBtn.style.borderColor = "#2a2a2a";
    await refresh();
    notify("Filters reset");
  });

  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Category Settings modal ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
  function openCategorySettings() {
    filterMenu.style.display = "none";
    filterMenuBtn.style.background = "#111";
    filterMenuBtn.style.borderColor = "#2a2a2a";

    let previewUrl = null;
    let newThumbFile = null;
    const existingThumb = category.thumbnailBlob || null;
    if (existingThumb) { previewUrl = URL.createObjectURL(existingThumb); }

    modalRoot.innerHTML = `
      <div id="cs-backdrop" style="
        position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:200;
        display:flex;align-items:center;justify-content:center;padding:16px;">
        <div style="background:#111;border-radius:4px;width:100%;max-width:460px;
          box-shadow:0 8px 40px rgba(0,0,0,.22);overflow:hidden;display:flex;flex-direction:column;max-height:90vh;">

          <!-- Header -->
          <div style="background:#AAFF20;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
            <div>
              <div style="color:#000;font-size:16px;font-weight:700;">Category Settings</div>
              <div style="color:#000000;font-size:12px;margin-top:2px;">${escapeHtml(category.name)}</div>
            </div>
            <button id="cs-close" style="background:none;border:none;cursor:pointer;color:#fff;">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Body -->
          <div style="padding:20px;display:flex;flex-direction:column;gap:18px;overflow-y:auto;flex:1;min-height:0;">

            <!-- Rename -->
            <div>
              <label style="font-size:13px;font-weight:600;color:#fff;display:block;margin-bottom:6px;">Category Name</label>
              <input id="cs-name" type="text" value="${escapeHtml(category.name)}"
                style="width:100%;height:40px;border:1px solid #2a2a2a;border-radius:2px;padding:0 12px;font-size:14px;color:#fff;outline:none;box-sizing:border-box;"
                onfocus="this.style.borderColor='#AAFF20'" onblur="this.style.borderColor='#2a2a2a'" />
            </div>

            <!-- Thumbnail -->
            <div>
              <label style="font-size:13px;font-weight:600;color:#fff;display:block;margin-bottom:6px;">Thumbnail Image</label>
              <div id="cs-dropzone" style="
                position:relative;border:2px dashed #333;border-radius:4px;
                cursor:pointer;background:#0d0d0d;transition:border-color .2s;overflow:hidden;">
                <input id="cs-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                  style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;z-index:1;" />
                <div id="cs-preview" style="text-align:center;padding:${previewUrl ? "0" : "20px 16px"};">
                  ${previewUrl
                    ? `<img src="${previewUrl}" style="width:100%;height:140px;object-fit:cover;display:block;" />`
                    : `<svg width="32" height="32" fill="none" stroke="#888" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 8px;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                       <p style="font-size:12px;color:#aaaaaa;">Click or drag to change thumbnail</p>`}
                </div>
              </div>
            </div>

            <!-- Danger zone -->
            <div style="border:1px solid #3a1010;border-radius:4px;padding:14px 16px;">
              <div style="font-size:12px;font-weight:700;color:#e53935;margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em;">Danger Zone</div>
              <p style="font-size:12px;color:#888;margin-bottom:10px;">Permanently delete this category and all its media. This cannot be undone.</p>
              <button id="cs-delete" style="width:100%;padding:9px 0;border:1px solid #e53935;border-radius:2px;background:#111;color:#e53935;font-size:13px;font-weight:600;cursor:pointer;">Delete Category</button>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding:14px 20px;display:flex;gap:10px;justify-content:flex-end;border-top:1px solid #222;flex-shrink:0;">
            <button id="cs-cancel" style="height:40px;padding:0 20px;border:1px solid #2a2a2a;border-radius:2px;background:#111;color:#fff;font-size:14px;cursor:pointer;">Cancel</button>
            <button id="cs-save" style="height:40px;padding:0 24px;border:none;border-radius:2px;background:#AAFF20;color:#000;font-size:14px;font-weight:700;cursor:pointer;">Save Changes</button>
          </div>
        </div>
      </div>
    `;

    const closeModal = () => {
      if (previewUrl && newThumbFile) URL.revokeObjectURL(previewUrl);
      modalRoot.innerHTML = "";
    };

    document.getElementById("cs-close").addEventListener("click", closeModal);
    document.getElementById("cs-cancel").addEventListener("click", closeModal);
    document.getElementById("cs-backdrop").addEventListener("click", (e) => { if (e.target.id === "cs-backdrop") closeModal(); });

    document.getElementById("cs-file").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      newThumbFile = file;
      if (previewUrl && previewUrl !== URL.createObjectURL(existingThumb)) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(file);
      const preview = document.getElementById("cs-preview");
      const dropzone = document.getElementById("cs-dropzone");
      preview.style.padding = "0";
      preview.innerHTML = `<img src="${previewUrl}" style="width:100%;height:140px;object-fit:cover;display:block;" />`;
      dropzone.style.borderColor = "#AAFF20";
    });

    document.getElementById("cs-save").addEventListener("click", async () => {
      const newName = document.getElementById("cs-name").value.trim();
      if (!newName) { document.getElementById("cs-name").style.borderColor = "#e53935"; return; }
      const saveBtn = document.getElementById("cs-save");
      saveBtn.disabled = true; saveBtn.textContent = "SavingÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦";
      const { renameCategory } = await import("./categories.js");
      const { put: putRow } = await import("./db.js");
      if (newName !== category.name) await renameCategory(category.id, newName);
      if (newThumbFile) {
        const { compressThumbnail } = await import("./categories.js").catch(() => null) || {};
        // compress inline if import unavailable
        const blob = await new Promise((res) => {
          const img = new Image(); const u = URL.createObjectURL(newThumbFile);
          img.onload = () => { URL.revokeObjectURL(u); const MAX=240,r=Math.min(MAX/img.width,MAX/img.height,1),c=document.createElement("canvas"); c.width=Math.round(img.width*r); c.height=Math.round(img.height*r); c.getContext("2d").drawImage(img,0,0,c.width,c.height); c.toBlob((b)=>res(b),"image/jpeg",.75); };
          img.src = u;
        });
        category.thumbnailBlob = blob;
        category.updatedAt = new Date().toISOString();
        await putRow("categories", category);
      }
      category.name = newName;
      // update breadcrumb
      const breadcrumb = document.querySelector("[data-cat-name]");
      if (breadcrumb) breadcrumb.textContent = newName;
      closeModal();
      notify("Category updated");
    });

    document.getElementById("cs-delete").addEventListener("click", async () => {
      if (!confirm(`Delete "${category.name}" and all its media? This cannot be undone.`)) return;
      const { deleteCategory } = await import("./categories.js");
      await deleteCategory(category.id);
      window.location.href = "./index.html";
    });
  }

  document.getElementById("catSettingsBtn").addEventListener("click", openCategorySettings);

  // Navbar search
  const navSearch = document.getElementById("navbar-search");
  if (navSearch) navSearch.addEventListener("input", (e) => { state.search = e.target.value; refresh(); });

  document.getElementById("search").addEventListener("input", (e) => { state.search = e.target.value; refresh(); });
  document.getElementById("tag").addEventListener("change", (e) => { state.tag = e.target.value; refresh(); });

  // Type icon toggle helpers
  function setTypeActive(type) {
    state.type = type;
    syncFilterUI();
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

    // Click anywhere on card ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ open viewer
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
  if (app) app.innerHTML = `<div style="padding:60px 20px;text-align:center;color:#aaaaaa;">Failed to load: ${escapeHtml(error.message)}</div>`;
});


