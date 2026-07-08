import { downloadBlob } from "./helpers.js";
import { put as putRow, del as delRow } from "./db.js";
import { notify } from "./notifications.js";

const SVG = {
  prev:     `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>`,
  next:     `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>`,
  zoomIn:   `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
  zoomOut:  `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
  download: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  tags:     `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  trash:    `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
  close:    `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  fav:      `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  favFill:  `<svg width="18" height="18" fill="#e53935" stroke="#e53935" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
};

// ── button factories ──────────────────────────────────────────────────────────

function navBtn(action, svg, title) {
  return `<button data-action="${action}" title="${title}" style="
    width:44px;height:44px;display:flex;align-items:center;justify-content:center;
    background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.22);
    border-radius:2px;cursor:pointer;color:#fff;flex-shrink:0;transition:background .15s;"
    onmouseover="this.style.background='rgba(255,255,255,.26)'"
    onmouseout="this.style.background='rgba(255,255,255,.13)'"
  >${svg}</button>`;
}

function toolBtn(action, svg, title, danger = false) {
  const bg   = danger ? "rgba(229,57,53,.15)"  : "rgba(255,255,255,.10)";
  const hbg  = danger ? "#e53935"              : "rgba(255,255,255,.22)";
  const bdr  = danger ? "rgba(229,57,53,.4)"   : "rgba(255,255,255,.18)";
  return `<button data-action="${action}" title="${title}" style="
    width:40px;height:40px;display:flex;align-items:center;justify-content:center;
    background:${bg};border:1px solid ${bdr};
    border-radius:2px;cursor:pointer;color:#fff;flex-shrink:0;transition:background .15s;"
    onmouseover="this.style.background='${hbg}'"
    onmouseout="this.style.background='${bg}'"
  >${svg}</button>`;
}

// ── main export ───────────────────────────────────────────────────────────────

export function openViewer(items, startIndex = 0, options = {}) {
  const root = document.getElementById("modal-root");
  if (!root || !items.length) return;

  let index = startIndex;
  let zoom  = 1;
  let panX  = 0;
  let panY  = 0;
  const drag = { active: false, startX: 0, startY: 0 };
  let currentUrl = "";

  // ── backdrop ────────────────────────────────────────────────────────────────
  const backdrop = document.createElement("div");
  backdrop.style.cssText = `
    position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.88);
    display:flex;align-items:center;justify-content:center;
    font-family:'Inter',sans-serif;
  `;

  // ── shell ────────────────────────────────────────────────────────────────────
  backdrop.innerHTML = `
    <div id="vw-shell" style="
      width:100%;max-width:1100px;height:100%;max-height:100vh;
      display:flex;flex-direction:column;background:#111;overflow:hidden;">

      <!-- ── Top bar: brand + file info only ── -->
      <div style="
        background:#2874f0;
        display:flex;align-items:center;
        padding:0 16px;height:52px;flex-shrink:0;gap:12px;">
        <div style="display:flex;flex-direction:column;line-height:1.1;flex-shrink:0;">
          <span style="color:#fff;font-size:15px;font-weight:700;letter-spacing:-.3px;">MeraDogs</span>
          <span style="color:#ffe500;font-size:9px;font-style:italic;">Media Viewer ✦</span>
        </div>
        <div style="width:1px;height:28px;background:rgba(255,255,255,.25);flex-shrink:0;"></div>
        <div style="min-width:0;flex:1;">
          <div id="vw-filename" style="color:#fff;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>
          <div id="vw-counter" style="color:#bbdefb;font-size:11px;margin-top:1px;"></div>
        </div>
      </div>

      <!-- ── Media stage ── -->
      <div id="vw-stage" style="
        flex:1;display:flex;align-items:center;justify-content:center;
        background:#000;overflow:hidden;position:relative;min-height:0;">
      </div>

      <!-- ── Bottom bar: tags row ── -->
      <div style="
        background:#1a1a2e;border-top:1px solid rgba(255,255,255,.08);
        padding:6px 14px;display:flex;align-items:center;gap:8px;flex-shrink:0;min-height:32px;">
        <svg width="12" height="12" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0;">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          <line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
        <div id="vw-tags" style="display:flex;flex-wrap:wrap;gap:5px;flex:1;min-width:0;"></div>
      </div>

      <!-- ── Bottom bar: controls ── -->
      <div style="
        background:#1a1a2e;border-top:1px solid rgba(255,255,255,.06);
        padding:10px 14px;display:flex;align-items:center;justify-content:center;
        gap:6px;flex-shrink:0;flex-wrap:wrap;">

        <!-- Prev / Next -->
        ${navBtn("prev", SVG.prev, "Previous (←)")}
        ${navBtn("next", SVG.next, "Next (→)")}

        <div style="width:1px;height:28px;background:rgba(255,255,255,.18);margin:0 2px;"></div>

        <!-- Zoom (images only) -->
        <div id="vw-zoom-btns" style="display:flex;gap:6px;">
          ${toolBtn("zoom-in",  SVG.zoomIn,  "Zoom in")}
          ${toolBtn("zoom-out", SVG.zoomOut, "Zoom out")}
        </div>

        <div style="width:1px;height:28px;background:rgba(255,255,255,.18);margin:0 2px;"></div>

        <!-- Favorite -->
        <button data-action="favorite" id="vw-fav-btn" title="Toggle favorite (F)" style="
          width:44px;height:44px;display:flex;align-items:center;justify-content:center;
          background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.18);
          border-radius:2px;cursor:pointer;color:#fff;flex-shrink:0;transition:background .15s;"
          onmouseover="this.style.background='rgba(255,255,255,.22)'"
          onmouseout="this.style.background='rgba(255,255,255,.10)'"
        >${SVG.fav}</button>

        <!-- Download -->
        ${toolBtn("download", SVG.download, "Download")}

        <!-- Tags -->
        ${toolBtn("tags", SVG.tags, "Edit tags")}

        <!-- Delete -->
        ${toolBtn("delete", SVG.trash, "Delete", true)}

        <div style="width:1px;height:28px;background:rgba(255,255,255,.18);margin:0 2px;"></div>

        <!-- Close -->
        <button data-action="close" title="Close (Esc)" style="
          width:44px;height:44px;display:flex;align-items:center;justify-content:center;
          background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.22);
          border-radius:2px;cursor:pointer;color:#fff;flex-shrink:0;transition:background .15s;"
          onmouseover="this.style.background='#e53935';this.style.borderColor='#e53935'"
          onmouseout="this.style.background='rgba(255,255,255,.10)';this.style.borderColor='rgba(255,255,255,.22)'"
        >${SVG.close}</button>
      </div>
    </div>
  `;

  root.replaceChildren(backdrop);

  // ── render current item ───────────────────────────────────────────────────
  const render = () => {
    const item = items[index];
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    currentUrl = URL.createObjectURL(item.blobData || item.thumbnailBlob);

    document.getElementById("vw-filename").textContent = item.fileName;
    document.getElementById("vw-counter").textContent  = `${index + 1} / ${items.length}`;

    // favorite button state
    const favBtn = document.getElementById("vw-fav-btn");
    if (favBtn) {
      favBtn.innerHTML = item.isFavorite ? SVG.favFill : SVG.fav;
      favBtn.style.background = item.isFavorite ? "rgba(229,57,53,.25)" : "rgba(255,255,255,.10)";
      favBtn.style.borderColor = item.isFavorite ? "#e53935" : "rgba(255,255,255,.18)";
    }

    // tags
    const tagsEl = document.getElementById("vw-tags");
    if (tagsEl) {
      tagsEl.innerHTML = (item.tags || []).length
        ? item.tags.map((t) => `
            <span style="background:rgba(40,116,240,.35);color:#bbdefb;font-size:11px;
              padding:2px 8px;border-radius:2px;border:1px solid rgba(40,116,240,.5);">${t}</span>
          `).join("")
        : `<span style="font-size:11px;color:rgba(255,255,255,.3);">No tags</span>`;
    }

    // media
    const stage = document.getElementById("vw-stage");
    const zoomBtns = document.getElementById("vw-zoom-btns");
    if (stage) {
      const isVideo = item.mediaType === "video";
      stage.style.cursor = isVideo ? "default" : "grab";
      if (zoomBtns) zoomBtns.style.display = isVideo ? "none" : "flex";
      stage.innerHTML = isVideo
        ? `<video src="${currentUrl}" controls playsinline autoplay
             style="max-width:100%;max-height:100%;object-fit:contain;"></video>`
        : `<img src="${currentUrl}" alt="${item.fileName}"
             style="max-width:100%;max-height:100%;object-fit:contain;user-select:none;
               transform:scale(${zoom}) translate(${panX}px,${panY}px);
               transition:transform 150ms ease;cursor:${zoom > 1 ? "grab" : "default"};"
             draggable="false" />`;
    }
  };

  // ── actions ───────────────────────────────────────────────────────────────
  const close = () => {
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    backdrop.remove();
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup",   onPointerUp);
  };

  const go = (dir) => {
    index = (index + dir + items.length) % items.length;
    zoom = 1; panX = 0; panY = 0;
    render();
  };

  const toggleFavorite = async () => {
    const item = items[index];
    item.isFavorite = !item.isFavorite;
    item.updatedAt  = new Date().toISOString();
    await putRow("media", item);
    render();
    await options.onChange?.();
    notify(item.isFavorite ? "Added to favorites" : "Removed from favorites");
  };

  const removeCurrent = async () => {
    const item = items[index];
    if (!confirm(`Delete "${item.fileName}"?`)) return;
    await delRow("media", item.id);
    items.splice(index, 1);
    if (!items.length) { close(); await options.onChange?.(); options.onDelete?.(); return; }
    index = Math.min(index, items.length - 1);
    zoom = 1; panX = 0; panY = 0;
    render();
    await options.onChange?.();
    options.onDelete?.();
  };

  // ── keyboard ──────────────────────────────────────────────────────────────
  const onKey = (e) => {
    if (e.key === "Escape")                  close();
    if (e.key === "ArrowLeft")               go(-1);
    if (e.key === "ArrowRight")              go(1);
    if (e.key.toLowerCase() === "f")         toggleFavorite();
    if (e.key === "Delete")                  removeCurrent();
  };

  // ── drag-to-pan ───────────────────────────────────────────────────────────
  const onPointerMove = (e) => {
    if (!drag.active) return;
    panX = e.clientX - drag.startX;
    panY = e.clientY - drag.startY;
    render();
  };
  const onPointerUp = () => { drag.active = false; };

  // ── click delegation ──────────────────────────────────────────────────────
  backdrop.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) { if (e.target === backdrop) close(); return; }
    const action = btn.dataset.action;
    if (action === "close")    close();
    if (action === "prev")     go(-1);
    if (action === "next")     go(1);
    if (action === "zoom-in")  { zoom = Math.min(4, zoom + 0.25); render(); }
    if (action === "zoom-out") { zoom = Math.max(0.5, zoom - 0.25); render(); }
    if (action === "favorite") await toggleFavorite();
    if (action === "download") downloadBlob(items[index].blobData, items[index].fileName);
    if (action === "tags")     { await options.onEditTags?.(items[index], () => render()); await options.onChange?.(); }
    if (action === "delete")   await removeCurrent();
  });

  backdrop.addEventListener("pointerdown", (e) => {
    if (items[index].mediaType !== "image") return;
    if (e.target.closest("button") || e.target.closest("video")) return;
    drag.active  = true;
    drag.startX  = e.clientX - panX;
    drag.startY  = e.clientY - panY;
  });

  window.addEventListener("keydown",      onKey);
  window.addEventListener("pointermove",  onPointerMove);
  window.addEventListener("pointerup",    onPointerUp);

  render();
}
