import { getAll, setSetting } from "./db.js";
import { createCategory, deleteCategory, renameCategory } from "./categories.js";
import { formatBytes, formatShortDate, escapeHtml } from "./helpers.js";

function cardStats(categories, media) {
  return categories.map((category) => {
    const items = media.filter((item) => item.categoryId === category.id);
    return {
      ...category,
      imageCount: items.filter((item) => item.mediaType === "image").length,
      videoCount: items.filter((item) => item.mediaType === "video").length,
      favoriteCount: items.filter((item) => item.isFavorite).length,
      cover: items.find((item) => item.id === category.coverMediaId) || items[0] || null,
    };
  });
}

const GRID_ICON = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`;
const LIST_ICON = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;

// ── Modal ────────────────────────────────────────────────────────────────────

function openAddCategoryModal(onCreated) {
  const modalRoot = document.getElementById("modal-root");
  let previewUrl = null;
  let selectedFile = null;

  modalRoot.innerHTML = `
    <div id="cat-backdrop" style="
      position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:200;
      display:flex;align-items:center;justify-content:center;padding:16px;">
      <div style="
        background:#fff;border-radius:4px;width:100%;max-width:460px;
        box-shadow:0 8px 40px rgba(0,0,0,.22);overflow:hidden;">

        <!-- Modal header -->
        <div style="background:#2874f0;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;">
          <span style="color:#fff;font-size:16px;font-weight:700;">Add New Category</span>
          <button id="cat-close" style="background:none;border:none;cursor:pointer;color:#fff;line-height:1;">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Modal body -->
        <div style="padding:24px 20px;display:flex;flex-direction:column;gap:20px;">

          <!-- Category name -->
          <div>
            <label style="font-size:13px;font-weight:600;color:#212121;display:block;margin-bottom:6px;">
              Category Name <span style="color:#e53935;">*</span>
            </label>
            <input id="cat-name" type="text" placeholder="e.g. Golden Retrievers"
              style="width:100%;height:40px;border:1px solid #d0d0d0;border-radius:2px;padding:0 12px;font-size:14px;color:#212121;outline:none;box-sizing:border-box;"
              onfocus="this.style.borderColor='#2874f0'" onblur="this.style.borderColor='#d0d0d0'" />
          </div>

          <!-- Thumbnail upload -->
          <div>
            <label style="font-size:13px;font-weight:600;color:#212121;display:block;margin-bottom:6px;">
              Thumbnail Image <span style="font-weight:400;color:#888;">(optional)</span>
            </label>

            <div id="cat-dropzone" style="
              border:2px dashed #d0d0d0;border-radius:4px;padding:20px;text-align:center;
              cursor:pointer;transition:border-color .2s;position:relative;background:#fafafa;">
              <input id="cat-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;" />

              <div id="cat-preview-wrap">
                <svg width="36" height="36" fill="none" stroke="#bbb" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 8px;">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <p style="font-size:13px;color:#888;">Click or drag an image here</p>
                <p style="font-size:11px;color:#bbb;margin-top:4px;">JPG, PNG, WEBP, GIF</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal footer -->
        <div style="padding:0 20px 20px;display:flex;gap:10px;justify-content:flex-end;">
          <button id="cat-cancel" style="
            height:40px;padding:0 20px;border:1px solid #d0d0d0;border-radius:2px;
            background:#fff;color:#555;font-size:14px;font-weight:500;cursor:pointer;">
            Cancel
          </button>
          <button id="cat-submit" style="
            height:40px;padding:0 24px;border:none;border-radius:2px;
            background:#2874f0;color:#fff;font-size:14px;font-weight:700;cursor:pointer;">
            Create Category
          </button>
        </div>
      </div>
    </div>
  `;

  const nameInput = document.getElementById("cat-name");
  const fileInput = document.getElementById("cat-file");
  const dropzone = document.getElementById("cat-dropzone");
  const previewWrap = document.getElementById("cat-preview-wrap");

  nameInput.focus();

  function showPreview(file) {
    selectedFile = file;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    previewWrap.innerHTML = `
      <img src="${previewUrl}" style="width:100%;height:120px;object-fit:cover;border-radius:3px;" />
      <p style="font-size:11px;color:#888;margin-top:6px;">${escapeHtml(file.name)}</p>
    `;
    dropzone.style.borderColor = "#2874f0";
    dropzone.style.padding = "10px";
  }

  fileInput.addEventListener("change", () => { if (fileInput.files[0]) showPreview(fileInput.files[0]); });

  dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.style.borderColor = "#2874f0"; });
  dropzone.addEventListener("dragleave", () => { dropzone.style.borderColor = "#d0d0d0"; });
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) showPreview(file);
  });

  function close() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    modalRoot.innerHTML = "";
  }

  document.getElementById("cat-close").addEventListener("click", close);
  document.getElementById("cat-cancel").addEventListener("click", close);
  document.getElementById("cat-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "cat-backdrop") close();
  });

  document.getElementById("cat-submit").addEventListener("click", async () => {
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.style.borderColor = "#e53935";
      nameInput.focus();
      return;
    }
    const submitBtn = document.getElementById("cat-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating…";
    const thumbnailBlob = selectedFile || null;
    await createCategory(name, thumbnailBlob);
    close();
    onCreated();
  });

  // Enter key submits
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("cat-submit").click();
  });
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function initDashboard() {
  const app = document.getElementById("app");
  const categories = await getAll("categories");
  const media = await getAll("media");
  const settings = Object.fromEntries((await getAll("settings")).map((r) => [r.key, r.value]));
  const state = { search: "", sort: "newest", view: settings.galleryView || "grid" };

  const cards = cardStats(categories, media);
  const favoriteCount = media.filter((i) => i.isFavorite).length;
  const storageBytes = media.reduce((s, i) => s + (i.fileSize || 0), 0);
  const totalImages = media.filter((i) => i.mediaType === "image").length;
  const totalVideos = media.filter((i) => i.mediaType === "video").length;

  const coverUrls = new Map();
  for (const cat of cards) {
    const blob = cat.thumbnailBlob || cat.cover?.thumbnailBlob || cat.cover?.blobData;
    if (blob) coverUrls.set(cat.id, URL.createObjectURL(blob));
  }
  window.addEventListener("beforeunload", () => coverUrls.forEach((u) => URL.revokeObjectURL(u)), { once: true });

  const openModal = () => openAddCategoryModal(() => location.reload());

  const render = () => {
    const filtered = [...cards]
      .filter((c) => c.name.toLowerCase().includes(state.search.toLowerCase()))
      .sort((a, b) => {
        if (state.sort === "az") return a.name.localeCompare(b.name);
        if (state.sort === "za") return b.name.localeCompare(a.name);
        if (state.sort === "oldest") return a.createdAt.localeCompare(b.createdAt);
        return b.createdAt.localeCompare(a.createdAt);
      });

    app.innerHTML = `
      <div style="max-width:1280px;margin:0 auto;padding:24px 20px 40px;">

        <!-- Stats row — 3-col grid on mobile, auto on desktop -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0;padding:0 0 16px;border-bottom:1px solid #e0e0e0;margin-bottom:20px;">
          ${[
            ["Categories", cards.length, "#212121"],
            ["Images",     totalImages,  "#212121"],
            ["Videos",     totalVideos,  "#212121"],
            ["Favorites",  favoriteCount,"#e53935"],
            ["Storage",    formatBytes(storageBytes), "#212121"],
          ].map(([label, val, color]) => `
            <div style="padding:14px 10px;">
              <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${label}</div>
              <div style="font-size:22px;font-weight:700;color:${color};margin-top:2px;line-height:1.1;">${val}</div>
            </div>
          `).join("")}
        </div>

        <!-- Category Library header -->
        <div style="margin-bottom:12px;">
          <div style="font-size:18px;font-weight:700;color:#212121;">Category Library</div>
          <div style="font-size:12px;color:#888;margin-top:2px;">Create, search, and manage your media collections</div>
        </div>

        <!-- Toolbar: full-width on mobile -->
        <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
          <!-- Search stretches to fill available space -->
          <div style="flex:1;min-width:120px;display:flex;align-items:center;background:#fff;border:1px solid #d0d0d0;border-radius:2px;overflow:hidden;height:38px;">
            <span style="padding:0 10px;color:#aaa;display:flex;align-items:center;flex-shrink:0;">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </span>
            <input id="catSearch" value="${escapeHtml(state.search)}" type="text" placeholder="Search…"
              style="border:none;outline:none;font-size:13px;color:#333;background:transparent;width:100%;padding-right:8px;" />
          </div>
          <!-- Sort -->
          <select id="catSort" style="height:38px;border:1px solid #d0d0d0;border-radius:2px;font-size:13px;padding:0 8px;background:#fff;color:#333;outline:none;cursor:pointer;flex-shrink:0;">
            <option value="newest" ${state.sort === "newest" ? "selected" : ""}>Newest</option>
            <option value="oldest" ${state.sort === "oldest" ? "selected" : ""}>Oldest</option>
            <option value="az" ${state.sort === "az" ? "selected" : ""}>A–Z</option>
            <option value="za" ${state.sort === "za" ? "selected" : ""}>Z–A</option>
          </select>
          <!-- View toggle -->
          <button id="toggleView" title="Toggle view"
            style="height:38px;width:38px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border:1px solid #d0d0d0;border-radius:2px;background:#fff;cursor:pointer;color:#555;">
            ${state.view === "grid" ? LIST_ICON : GRID_ICON}
          </button>
          <!-- Add -->
          <button id="addCategory"
            style="height:38px;padding:0 14px;background:#2874f0;color:#fff;border:none;border-radius:2px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;">
            + Add
          </button>
        </div>

        <!-- Grid / List -->
        <div style="${state.view === "grid"
          ? "display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;"
          : "display:flex;flex-direction:column;gap:10px;"}">
          ${filtered.length ? filtered.map((cat) => state.view === "grid" ? `
            <div style="background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
              <a href="./category.html?id=${cat.id}" style="display:block;position:relative;">
                <div style="width:100%;aspect-ratio:1/1;overflow:hidden;background:linear-gradient(135deg,#e3f2fd,#bbdefb);display:flex;align-items:center;justify-content:center;">
                  ${coverUrls.has(cat.id)
                    ? `<img src="${coverUrls.get(cat.id)}" alt="${escapeHtml(cat.name)}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />`
                    : `<svg width="36" height="36" fill="none" stroke="#90caf9" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`}
                </div>
                ${cat.favoriteCount > 0 ? `<span style="position:absolute;top:6px;left:6px;background:#388e3c;color:#fff;font-size:10px;padding:2px 6px;border-radius:2px;">${cat.favoriteCount} fav</span>` : ""}
              </a>
              <div style="padding:10px;">
                <a href="./category.html?id=${cat.id}" style="font-size:13px;font-weight:600;color:#212121;text-decoration:none;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(cat.name)}</a>
                <div style="font-size:11px;color:#388e3c;font-weight:600;margin-top:3px;">${cat.imageCount + cat.videoCount} items</div>
                <div style="font-size:10px;color:#aaa;margin-top:1px;">${formatShortDate(cat.createdAt)}</div>
                <div style="display:flex;gap:5px;margin-top:8px;">
                  <a href="./category.html?id=${cat.id}" style="flex:1;text-align:center;background:#2874f0;color:#fff;font-size:11px;font-weight:600;padding:6px 0;border-radius:2px;text-decoration:none;">Open</a>
                  <button data-action="rename" data-id="${cat.id}" style="flex:1;background:#fff;border:1px solid #d0d0d0;color:#555;font-size:11px;padding:6px 0;border-radius:2px;cursor:pointer;">Rename</button>
                  <button data-action="delete" data-id="${cat.id}" style="background:#fff;border:1px solid #ffcdd2;color:#e53935;font-size:11px;padding:6px 8px;border-radius:2px;cursor:pointer;">✕</button>
                </div>
              </div>
            </div>
          ` : `
            <!-- List row: thumbnail + info stacked cleanly -->
            <div style="background:#fff;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
              <div style="display:flex;align-items:center;gap:12px;padding:12px;">
                <!-- Thumb -->
                <a href="./category.html?id=${cat.id}" style="flex-shrink:0;">
                  <div style="width:52px;height:52px;border-radius:3px;overflow:hidden;background:linear-gradient(135deg,#e3f2fd,#bbdefb);display:flex;align-items:center;justify-content:center;">
                    ${coverUrls.has(cat.id)
                      ? `<img src="${coverUrls.get(cat.id)}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />`
                      : `<svg width="22" height="22" fill="none" stroke="#90caf9" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`}
                  </div>
                </a>
                <!-- Info -->
                <div style="flex:1;min-width:0;">
                  <a href="./category.html?id=${cat.id}" style="font-size:14px;font-weight:600;color:#212121;text-decoration:none;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(cat.name)}</a>
                  <div style="font-size:11px;color:#888;margin-top:2px;">${cat.imageCount} img · ${cat.videoCount} vid · ${cat.favoriteCount} fav</div>
                  <div style="font-size:10px;color:#bbb;margin-top:1px;">${formatShortDate(cat.createdAt)}</div>
                </div>
                <!-- Actions -->
                <div style="display:flex;gap:6px;flex-shrink:0;">
                  <a href="./category.html?id=${cat.id}" style="background:#2874f0;color:#fff;font-size:12px;font-weight:600;padding:6px 12px;border-radius:2px;text-decoration:none;white-space:nowrap;">Open</a>
                  <button data-action="rename" data-id="${cat.id}" style="background:#fff;border:1px solid #d0d0d0;color:#555;font-size:12px;padding:6px 10px;border-radius:2px;cursor:pointer;">✎</button>
                  <button data-action="delete" data-id="${cat.id}" style="background:#fff;border:1px solid #ffcdd2;color:#e53935;font-size:12px;padding:6px 8px;border-radius:2px;cursor:pointer;">✕</button>
                </div>
              </div>
            </div>
          `).join("") : `
            <div style="grid-column:1/-1;background:#fff;border-radius:4px;padding:48px 20px;text-align:center;">
              <svg width="40" height="40" fill="none" stroke="#d0d0d0" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 10px;"><path d="M3 7h18M3 12h18M3 17h18"/></svg>
              <p style="font-size:14px;font-weight:500;color:#bbb;">No categories yet</p>
              <p style="font-size:12px;margin-top:4px;color:#ccc;">Tap <strong style="color:#2874f0;">+ Add</strong> to get started.</p>
            </div>
          `}
        </div>
      </div>
    `;
  };

  render();

  // Navbar search + add button
  const navSearch = document.getElementById("navbar-search");
  if (navSearch) {
    navSearch.value = state.search;
    navSearch.addEventListener("input", (e) => { state.search = e.target.value; render(); });
  }
  document.getElementById("navbar-add")?.addEventListener("click", openModal);

  app.addEventListener("input", (e) => {
    if (e.target.id === "catSearch") { state.search = e.target.value; render(); }
  });

  app.addEventListener("change", (e) => {
    if (e.target.id === "catSort") { state.sort = e.target.value; render(); }
  });

  app.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    if (btn.id === "addCategory") { openModal(); return; }

    if (btn.id === "toggleView") {
      state.view = state.view === "grid" ? "list" : "grid";
      await setSetting("galleryView", state.view);
      render();
      return;
    }

    if (btn.dataset.action === "rename") {
      const cat = categories.find((c) => c.id === btn.dataset.id);
      const name = prompt("Rename category:", cat?.name || "");
      if (name && cat) { await renameCategory(cat.id, name); location.reload(); }
      return;
    }

    if (btn.dataset.action === "delete") {
      if (confirm("Delete this category and all its media?")) {
        await deleteCategory(btn.dataset.id);
        location.reload();
      }
    }
  });
}
