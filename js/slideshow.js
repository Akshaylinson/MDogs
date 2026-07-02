import { downloadBlob } from "./helpers.js";

const SVG = {
  prev:     `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>`,
  next:     `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>`,
  play:     `<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21"/></svg>`,
  pause:    `<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
  download: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  close:    `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  fav:      `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  favFill:  `<svg width="18" height="18" fill="#e53935" stroke="#e53935" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
};

// icon button helper
function iconBtn(action, svgContent, title, extraStyle = "") {
  return `<button data-action="${action}" title="${title}" style="
    width:40px;height:40px;display:flex;align-items:center;justify-content:center;
    background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);
    border-radius:2px;cursor:pointer;color:#fff;flex-shrink:0;
    transition:background .15s;${extraStyle}"
    onmouseover="this.style.background='rgba(255,255,255,.25)'"
    onmouseout="this.style.background='rgba(255,255,255,.12)'"
  >${svgContent}</button>`;
}

export function openSlideshow(items, intervalSeconds = 5) {
  if (!items.length) return;

  const root = document.getElementById("modal-root");
  let index = 0;
  let playing = true;
  let timer = null;
  let currentUrl = null;
  let progressTimer = null;
  let progressStart = null;

  // ── backdrop ─────────────────────────────────────────────────────────────
  const backdrop = document.createElement("div");
  backdrop.style.cssText = `
    position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.92);
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    font-family:'Inter',sans-serif;
  `;

  // ── shell ─────────────────────────────────────────────────────────────────
  backdrop.innerHTML = `
    <div id="ss-shell" style="
      width:100%;max-width:1100px;height:100%;max-height:100vh;
      display:flex;flex-direction:column;padding:0;">

      <!-- Header bar -->
      <div style="
        background:#2874f0;
        display:flex;align-items:center;justify-content:space-between;
        padding:0 20px;height:56px;flex-shrink:0;gap:12px;">

        <!-- Brand + title -->
        <div style="display:flex;align-items:center;gap:14px;min-width:0;">
          <div style="display:flex;flex-direction:column;line-height:1.1;flex-shrink:0;">
            <span style="color:#fff;font-size:15px;font-weight:700;letter-spacing:-.3px;">MeraDogs</span>
            <span style="color:#ffe500;font-size:9px;font-style:italic;">Slideshow ✦</span>
          </div>
          <div style="width:1px;height:28px;background:rgba(255,255,255,.25);flex-shrink:0;"></div>
          <div style="min-width:0;">
            <div id="ss-filename" style="color:#fff;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:320px;"></div>
            <div id="ss-counter" style="color:#bbdefb;font-size:11px;margin-top:1px;"></div>
          </div>
        </div>

        <!-- Controls -->
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
          ${iconBtn("prev", SVG.prev, "Previous (←)")}
          <button data-action="toggle" id="ss-toggle" title="Play / Pause (Space)" style="
            width:40px;height:40px;display:flex;align-items:center;justify-content:center;
            background:#fff;border:none;border-radius:2px;cursor:pointer;color:#2874f0;flex-shrink:0;">
            ${SVG.pause}
          </button>
          ${iconBtn("next", SVG.next, "Next (→)")}
          <div style="width:1px;height:28px;background:rgba(255,255,255,.25);margin:0 2px;"></div>
          ${iconBtn("favorite", SVG.fav, "Toggle favorite (F)", "")}
          ${iconBtn("download", SVG.download, "Download")}
          <div style="width:1px;height:28px;background:rgba(255,255,255,.25);margin:0 2px;"></div>
          <button data-action="close" title="Close (Esc)" style="
            width:40px;height:40px;display:flex;align-items:center;justify-content:center;
            background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.3);
            border-radius:2px;cursor:pointer;color:#fff;"
            onmouseover="this.style.background='#e53935';this.style.borderColor='#e53935'"
            onmouseout="this.style.background='rgba(255,255,255,.12)';this.style.borderColor='rgba(255,255,255,.3)'"
          >${SVG.close}</button>
        </div>
      </div>

      <!-- Progress bar -->
      <div style="height:3px;background:rgba(255,255,255,.12);flex-shrink:0;">
        <div id="ss-progress" style="height:100%;background:#ffe500;width:0%;transition:none;"></div>
      </div>

      <!-- Media stage -->
      <div id="ss-stage" style="
        flex:1;display:flex;align-items:center;justify-content:center;
        background:#000;overflow:hidden;position:relative;cursor:pointer;">
      </div>

      <!-- Footer: tags -->
      <div style="
        background:rgba(255,255,255,.06);border-top:1px solid rgba(255,255,255,.1);
        padding:10px 20px;display:flex;align-items:center;gap:8px;flex-shrink:0;min-height:40px;">
        <svg width="13" height="13" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0;"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
        <div id="ss-tags" style="display:flex;flex-wrap:wrap;gap:6px;"></div>
      </div>
    </div>
  `;

  root.appendChild(backdrop);

  // ── helpers ───────────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);

  function renderMedia() {
    const item = items[index];
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    const blob = item.blobData || item.thumbnailBlob;
    currentUrl = blob ? URL.createObjectURL(blob) : null;

    $("ss-filename").textContent = item.fileName;
    $("ss-counter").textContent = `${index + 1} / ${items.length}`;

    // tags
    const tagsEl = $("ss-tags");
    tagsEl.innerHTML = (item.tags || []).length
      ? item.tags.map((t) => `<span style="background:rgba(255,255,255,.12);color:rgba(255,255,255,.8);font-size:11px;padding:2px 8px;border-radius:2px;">${t}</span>`).join("")
      : `<span style="font-size:11px;color:rgba(255,255,255,.35);">No tags</span>`;

    // favorite icon
    const favBtn = backdrop.querySelector('[data-action="favorite"]');
    if (favBtn) favBtn.innerHTML = item.isFavorite ? SVG.favFill : SVG.fav;

    // media
    const stage = $("ss-stage");
    stage.innerHTML = currentUrl
      ? (item.mediaType === "video"
          ? `<video src="${currentUrl}" style="max-width:100%;max-height:100%;object-fit:contain;" controls autoplay></video>`
          : `<img src="${currentUrl}" alt="${item.fileName}" style="max-width:100%;max-height:100%;object-fit:contain;user-select:none;" draggable="false" />`)
      : `<div style="color:rgba(255,255,255,.3);font-size:14px;">No preview available</div>`;
  }

  // ── progress bar animation ────────────────────────────────────────────────
  function startProgress() {
    cancelAnimationFrame(progressTimer);
    const bar = $("ss-progress");
    if (!bar) return;
    bar.style.transition = "none";
    bar.style.width = "0%";
    progressStart = performance.now();
    const total = intervalSeconds * 1000;

    function tick(now) {
      if (!playing) return;
      const pct = Math.min(((now - progressStart) / total) * 100, 100);
      bar.style.width = pct + "%";
      if (pct < 100) progressTimer = requestAnimationFrame(tick);
    }
    progressTimer = requestAnimationFrame(tick);
  }

  function stopProgress() {
    cancelAnimationFrame(progressTimer);
    const bar = $("ss-progress");
    if (bar) bar.style.width = "0%";
  }

  // ── timer ─────────────────────────────────────────────────────────────────
  function stopTimer() { clearInterval(timer); }

  function startTimer() {
    stopTimer();
    if (!playing) return;
    startProgress();
    timer = setInterval(() => {
      index = (index + 1) % items.length;
      renderMedia();
      startProgress();
    }, intervalSeconds * 1000);
  }

  function goTo(i) {
    index = (i + items.length) % items.length;
    renderMedia();
    startTimer();
  }

  function togglePlay() {
    playing = !playing;
    const toggleBtn = $("ss-toggle");
    if (toggleBtn) toggleBtn.innerHTML = playing ? SVG.pause : SVG.play;
    if (playing) { startTimer(); } else { stopTimer(); stopProgress(); }
  }

  function close() {
    stopTimer();
    stopProgress();
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    backdrop.remove();
    window.removeEventListener("keydown", onKey);
  }

  // ── keyboard ──────────────────────────────────────────────────────────────
  function onKey(e) {
    if (e.key === "Escape")      close();
    if (e.key === "ArrowLeft")   goTo(index - 1);
    if (e.key === "ArrowRight")  goTo(index + 1);
    if (e.key === " ")           { e.preventDefault(); togglePlay(); }
    if (e.key.toLowerCase() === "f") toggleFav();
  }

  async function toggleFav() {
    const item = items[index];
    item.isFavorite = !item.isFavorite;
    item.updatedAt = new Date().toISOString();
    const { put } = await import("./db.js");
    await put("media", item);
    renderMedia();
  }

  // ── click delegation ──────────────────────────────────────────────────────
  backdrop.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "close")    close();
    if (action === "prev")     goTo(index - 1);
    if (action === "next")     goTo(index + 1);
    if (action === "toggle")   togglePlay();
    if (action === "download") downloadBlob(items[index].blobData, items[index].fileName);
    if (action === "favorite") toggleFav();
  });

  // click stage to advance
  $("ss-stage").addEventListener("click", (e) => {
    if (e.target.closest("button, video, a")) return;
    goTo(index + 1);
  });

  window.addEventListener("keydown", onKey);
  renderMedia();
  startTimer();
}
