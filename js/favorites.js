import { getAll, put as putRow, del as delRow } from "./db.js";
import { openViewer } from "./viewer.js";
import { openSlideshow } from "./slideshow.js";
import { getSetting } from "./db.js";
import { escapeHtml, formatShortDate, downloadBlob } from "./helpers.js";
import { notify } from "./notifications.js";

function mediaUrl(item) {
  const blob = item.thumbnailBlob || item.blobData;
  return blob ? URL.createObjectURL(blob) : "";
}

export async function initFavoritesPage() {
  const app = document.getElementById("app");
  const allMedia = await getAll("media");
  const categories = await getAll("categories");
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  let favorites = allMedia.filter((i) => i.isFavorite);
  let filtered = [...favorites];
  let state = { search: "", type: "all" };

  const urlCache = new Map();
  function getUrl(item) {
    if (!urlCache.has(item.id)) {
      const u = mediaUrl(item);
      if (u) urlCache.set(item.id, u);
    }
    return urlCache.get(item.id) || "";
  }
  window.addEventListener("beforeunload", () => urlCache.forEach((u) => URL.revokeObjectURL(u)), { once: true });

  const totalImages = favorites.filter((i) => i.mediaType === "image").length;
  const totalVideos = favorites.filter((i) => i.mediaType === "video").length;

  // ── Page shell ─────────────────────────────────────────────────────────
  app.innerHTML = `
    <div style="max-width:1280px;margin:0 auto;padding:24px 20px 40px;">

      <!-- Stats row -->
      <div style="display:flex;flex-wrap:wrap;gap:32px;padding:8px 0 24px;border-bottom:1px solid #e0e0e0;margin-bottom:24px;">
        <div>
          <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.06em;">Favorites</div>
          <div style="font-size:28px;font-weight:700;color:#e53935;margin-top:2px;">${favorites.length}</div>
        </div>
        <div>
          <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.06em;">Images</div>
          <div style="font-size:28px;font-weight:700;color:#212121;margin-top:2px;">${totalImages}</div>
        </div>
        <div>
          <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.06em;">Videos</div>
          <div style="font-size:28px;font-weight:700;color:#212121;margin-top:2px;">${totalVideos}</div>
        </div>
        <div>
          <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.06em;">Categories</div>
          <div style="font-size:28px;font-weight:700;color:#212121;margin-top:2px;">${categories.length}</div>
        </div>
      </div>

      <!-- Section header + filter bar -->
      <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;">
        <div>
          <div style="font-size:20px;font-weight:700;color:#212121;">Saved Favorites</div>
          <div style="font-size:13px;color:#888;margin-top:2px;">All your saved media across every category</div>
        </div>

        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <!-- Search -->
          <div style="display:flex;align-items:center;background:#fff;border:1px solid #d0d0d0;border-radius:2px;overflow:hidden;height:36px;">
            <span style="padding:0 10px;color:#aaa;display:flex;align-items:center;">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </span>
            <input id="favSearch" type="text" placeholder="Search…"
              style="border:none;outline:none;font-size:13px;color:#333;background:transparent;width:140px;padding-right:8px;" />
          </div>

          <!-- Type toggle group -->
          <div style="display:flex;border:1px solid #d0d0d0;border-radius:2px;overflow:hidden;height:36px;background:#fff;">
            <button id="typeAll" title="All media" style="width:36px;display:flex;align-items:center;justify-content:center;border:none;background:#2874f0;cursor:pointer;">
              <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </button>
            <button id="typeImage" title="Images only" style="width:36px;display:flex;align-items:center;justify-content:center;border:none;border-left:1px solid #d0d0d0;background:#fff;cursor:pointer;">
              <svg width="16" height="16" fill="none" stroke="#555" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </button>
            <button id="typeVideo" title="Videos only" style="width:36px;display:flex;align-items:center;justify-content:center;border:none;border-left:1px solid #d0d0d0;background:#fff;cursor:pointer;">
              <svg width="16" height="16" fill="none" stroke="#555" stroke-width="2" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
            </button>
          </div>

          <!-- Slideshow -->
          <button id="slideshow" title="Start slideshow" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:#2874f0;border:none;border-radius:2px;cursor:pointer;">
            <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21"/></svg>
          </button>
        </div>
      </div>

      <!-- Grid -->
      <div id="fav-grid" class="fk-media-grid"></div>
    </div>
  `;

  // ── Render grid ───────────────────────────────────────────────────────────
  function renderGrid() {
    const grid = document.getElementById("fav-grid");
    if (!grid) return;

    if (!filtered.length) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;background:#fff;border-radius:4px;padding:60px 20px;text-align:center;color:#aaa;">
          <svg width="48" height="48" fill="none" stroke="#ffcdd2" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 12px;">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <p style="font-size:14px;font-weight:500;color:#bbb;">No favorites yet</p>
          <p style="font-size:12px;margin-top:4px;">Open a category and save media using the ♡ button.</p>
        </div>`;
      return;
    }

    grid.innerHTML = filtered.map((item) => {
      const url = getUrl(item);
      const isVideo = item.mediaType === "video";
      const catName = catMap[item.categoryId] || "Unknown";
      return `
        <div class="fk-media-card" data-id="${item.id}">
          <div class="fk-media-thumb-wrap">
            ${url
              ? (isVideo
                  ? `<video src="${url}" class="fk-media-thumb" muted playsinline preload="metadata"></video>`
                  : `<img src="${url}" class="fk-media-thumb" alt="${escapeHtml(item.fileName)}" loading="lazy" />`)
              : `<div class="fk-media-thumb" style="display:flex;align-items:center;justify-content:center;">
                   <svg width="32" height="32" fill="none" stroke="#f48fb1" stroke-width="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                 </div>`}
            <div class="fk-media-overlay">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <span class="fk-chip">${isVideo ? "▶ Video" : "🖼 Image"}</span>
                <button data-action="unfav" data-id="${item.id}" class="fk-chip fk-chip-fav" title="Remove from favorites">♥</button>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:flex-end;">
                <p style="font-size:11px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:70%;">${escapeHtml(item.fileName)}</p>
                <button data-action="open" data-id="${item.id}" class="fk-chip">Preview</button>
              </div>
            </div>
          </div>
          <div style="padding:8px 10px;">
            <p style="font-size:12px;font-weight:600;color:#212121;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(item.fileName)}</p>
            <a href="./category.html?id=${item.categoryId}" style="font-size:11px;color:#2874f0;text-decoration:none;display:block;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(catName)}</a>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:5px;">
              ${(item.tags || []).slice(0, 3).map((t) => `<span style="background:#fce4ec;color:#c62828;font-size:10px;padding:2px 6px;border-radius:2px;">${escapeHtml(t)}</span>`).join("")}
            </div>
            <div style="display:flex;gap:5px;margin-top:8px;">
              <button data-action="open" data-id="${item.id}" style="flex:1;height:28px;background:#2874f0;color:#fff;border:none;font-size:11px;border-radius:2px;cursor:pointer;font-weight:600;">Open</button>
              <button data-action="download" data-id="${item.id}" style="height:28px;padding:0 8px;background:#fff;border:1px solid #d0d0d0;color:#555;font-size:11px;border-radius:2px;cursor:pointer;" title="Download">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </button>
              <button data-action="unfav" data-id="${item.id}" style="height:28px;padding:0 8px;background:#fff;border:1px solid #ffcdd2;color:#e53935;font-size:11px;border-radius:2px;cursor:pointer;" title="Remove favorite">
                <svg width="13" height="13" fill="#e53935" stroke="#e53935" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  // ── Filter helpers ────────────────────────────────────────────────────────
  function applyFilter() {
    filtered = favorites.filter((item) => {
      const matchSearch = !state.search ||
        item.fileName.toLowerCase().includes(state.search) ||
        (item.tags || []).some((t) => t.toLowerCase().includes(state.search));
      const matchType = state.type === "all" || item.mediaType === state.type;
      return matchSearch && matchType;
    });
    renderGrid();
  }

  function setTypeActive(type) {
    state.type = type;
    const map = { all: "typeAll", image: "typeImage", video: "typeVideo" };
    Object.entries(map).forEach(([t, id]) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const active = t === type;
      btn.style.background = active ? "#2874f0" : "#fff";
      btn.querySelector("svg").setAttribute("stroke", active ? "white" : "#555");
    });
    applyFilter();
  }

  // ── Wire controls ─────────────────────────────────────────────────────────
  document.getElementById("favSearch").addEventListener("input", (e) => {
    state.search = e.target.value.toLowerCase();
    applyFilter();
  });

  // Navbar search
  const navSearch = document.getElementById("navbar-search");
  if (navSearch) navSearch.addEventListener("input", (e) => {
    state.search = e.target.value.toLowerCase();
    document.getElementById("favSearch").value = e.target.value;
    applyFilter();
  });

  document.getElementById("typeAll").addEventListener("click", () => setTypeActive("all"));
  document.getElementById("typeImage").addEventListener("click", () => setTypeActive("image"));
  document.getElementById("typeVideo").addEventListener("click", () => setTypeActive("video"));

  document.getElementById("slideshow").addEventListener("click", async () => {
    if (!filtered.length) return;
    const interval = Number(await getSetting("slideshowInterval", 5));
    openSlideshow(filtered, interval);
  });

  // ── Delegated card clicks ─────────────────────────────────────────────────
  app.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const item = filtered.find((m) => m.id === btn.dataset.id);
    if (!item) return;
    const action = btn.dataset.action;

    if (action === "open") {
      openViewer(filtered, filtered.findIndex((m) => m.id === item.id), {
        onChange: initFavoritesPage,
        onDelete: initFavoritesPage,
      });
      return;
    }

    if (action === "unfav") {
      item.isFavorite = false;
      item.updatedAt = new Date().toISOString();
      await putRow("media", item);
      notify("Removed from favorites");
      favorites = favorites.filter((m) => m.id !== item.id);
      filtered = filtered.filter((m) => m.id !== item.id);
      renderGrid();
      return;
    }

    if (action === "download") {
      downloadBlob(item.blobData, item.fileName);
    }
  });

  renderGrid();
}
