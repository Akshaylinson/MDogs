import { downloadBlob } from "./helpers.js";

const SVG = {
  prev:     `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>`,
  next:     `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>`,
  play:     `<svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21"/></svg>`,
  pause:    `<svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
  download: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  close:    `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  fav:      `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  favFill:  `<svg width="20" height="20" fill="#e53935" stroke="#e53935" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
};

function btn(action, svg, title, danger = false) {
  return `<button data-action="${action}" title="${title}" style="
    width:42px;height:42px;display:flex;align-items:center;justify-content:center;
    background:#1a1a1a;border:1px solid #333;
    border-radius:50%;cursor:pointer;color:#fff;flex-shrink:0;transition:background .15s;
    ${danger ? "border-color:rgba(229,57,53,.6);" : ""}"
    onmouseover="this.style.background='${danger ? "#e53935" : "#AAFF20"}';this.style.borderColor='${danger ? "#e53935" : "#AAFF20"}';this.style.color='${danger ? "#fff" : "#000"}'"
    onmouseout="this.style.background='#1a1a1a';this.style.borderColor='${danger ? "rgba(229,57,53,.6)" : "#333"}';this.style.color='#fff'"
  >${svg}</button>`;
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
  let hideTimer = null;
  let uiVisible = false;

  // ── backdrop ──────────────────────────────────────────────────────────────
  const backdrop = document.createElement("div");
  backdrop.style.cssText = `
    position:fixed;inset:0;z-index:300;background:#000;
    display:flex;flex-direction:column;
    font-family:'Inter',sans-serif;cursor:pointer;
  `;

  backdrop.innerHTML = `
    <!-- Media stage: fills entire screen -->
    <div id="ss-stage" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;"></div>

    <!-- Progress bar: always visible at top -->
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:rgba(255,255,255,.1);z-index:2;">
      <div id="ss-progress" style="height:100%;background:#AAFF20;width:0%;"></div>
    </div>

    <!-- Overlay UI: hidden by default, shown on tap -->
    <div id="ss-ui" style="
      position:absolute;inset:0;z-index:3;
      display:flex;flex-direction:column;justify-content:flex-end;
      pointer-events:none;opacity:0;transition:opacity .25s ease;">

      <!-- Gradient scrim at bottom -->
      <div style="background:linear-gradient(to top,rgba(0,0,0,.85) 0%,rgba(0,0,0,.4) 60%,transparent 100%);padding:20px 20px 28px;">

        <!-- Counter -->
        <div id="ss-counter" style="text-align:center;color:rgba(255,255,255,.7);font-size:13px;font-weight:600;letter-spacing:.05em;margin-bottom:14px;pointer-events:none;"></div>

        <!-- Buttons row -->
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:14px;pointer-events:auto;flex-wrap:wrap;">
          ${btn("prev",     SVG.prev,     "Previous")}
          ${btn("toggle",   SVG.pause,    "Play / Pause")}
          ${btn("next",     SVG.next,     "Next")}
          <div style="width:1px;height:28px;background:rgba(255,255,255,.2);flex-shrink:0;"></div>
          <button data-action="favorite" id="ss-fav-btn" title="Favorite" style="
            width:42px;height:42px;display:flex;align-items:center;justify-content:center;
            background:#1a1a1a;border:1px solid #333;
            border-radius:50%;cursor:pointer;color:#fff;flex-shrink:0;transition:background .15s;"
            onmouseover="this.style.background='#AAFF20';this.style.borderColor='#AAFF20';this.style.color='#000'"
            onmouseout="this.style.background='#1a1a1a';this.style.borderColor='#333';this.style.color='#fff'"
          >${SVG.fav}</button>
          ${btn("download", SVG.download, "Download")}
          ${btn("close",    SVG.close,    "Close", true)}
        </div>

        <!-- Tags row -->
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;min-height:22px;pointer-events:none;">
          <svg width="12" height="12" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0;"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          <div id="ss-tags" style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;"></div>
        </div>

      </div>
    </div>
  `;

  root.appendChild(backdrop);

  const $ = (id) => document.getElementById(id);

  // ── show / hide UI ────────────────────────────────────────────────────────
  function showUI() {
    const ui = $("ss-ui");
    ui.style.opacity = "1";
    ui.style.pointerEvents = "auto";
    uiVisible = true;
    clearTimeout(hideTimer);
    if (playing) {
      hideTimer = setTimeout(hideUI, 3000);
    }
  }

  function hideUI() {
    const ui = $("ss-ui");
    ui.style.opacity = "0";
    ui.style.pointerEvents = "none";
    uiVisible = false;
  }

  // ── render ────────────────────────────────────────────────────────────────
  function renderMedia() {
    const item = items[index];
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    const blob = item.blobData || item.thumbnailBlob;
    currentUrl = blob ? URL.createObjectURL(blob) : null;

    $("ss-counter").textContent = `${index + 1} / ${items.length}`;

    // tags
    const tagsEl = $("ss-tags");
    tagsEl.innerHTML = (item.tags || []).length
      ? item.tags.map((t) => `<span style="background:#1a2e00;color:#AAFF20;font-size:11px;padding:3px 10px;border-radius:20px;border:1px solid rgba(170,255,32,.3);">${t}</span>`).join("")
      : `<span style="font-size:11px;color:rgba(255,255,255,.3);">No tags</span>`;

    // favorite button
    const favBtn = $("ss-fav-btn");
    if (favBtn) {
      favBtn.innerHTML = item.isFavorite ? SVG.favFill : SVG.fav;
      favBtn.style.borderColor = item.isFavorite ? "#e53935" : "#333";
      favBtn.style.background = item.isFavorite ? "rgba(229,57,53,.2)" : "#1a1a1a";
    }

    // toggle button icon
    const toggleBtn = backdrop.querySelector('[data-action="toggle"]');
    if (toggleBtn) toggleBtn.innerHTML = playing ? SVG.pause : SVG.play;

    // media
    const stage = $("ss-stage");
    if (item.mediaType === "video" && currentUrl) {
      stage.innerHTML = `<video id="ss-video" src="${currentUrl}" style="width:100%;height:100%;object-fit:contain;pointer-events:none;" autoplay playsinline></video>`;
      const videoEl = document.getElementById("ss-video");
      // progress bar tracks actual video playback
      videoEl.addEventListener("timeupdate", () => {
        if (!playing || !videoEl.duration) return;
        const bar = $("ss-progress");
        if (bar) bar.style.width = ((videoEl.currentTime / videoEl.duration) * 100) + "%";
      });
      // advance to next slide when video finishes
      videoEl.addEventListener("ended", () => {
        if (!playing) return;
        index = (index + 1) % items.length;
        renderMedia();
      }, { once: true });
    } else {
      stage.innerHTML = currentUrl
        ? `<img src="${currentUrl}" alt="${item.fileName}" style="width:100%;height:100%;object-fit:contain;user-select:none;" draggable="false" />`
        : `<div style="color:rgba(255,255,255,.3);font-size:14px;">No preview</div>`;
    }
  }

  // ── progress bar ──────────────────────────────────────────────────────────
  function startProgress() {
    cancelAnimationFrame(progressTimer);
    const bar = $("ss-progress");
    if (!bar) return;
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
    const item = items[index];
    if (item.mediaType === "video") {
      // video self-advances via the 'ended' listener in renderMedia
      // just animate progress via timeupdate — no interval needed
      return;
    }
    startProgress();
    timer = setInterval(() => {
      index = (index + 1) % items.length;
      renderMedia();
      startTimer();
    }, intervalSeconds * 1000);
  }

  function goTo(i) {
    stopTimer();
    stopProgress();
    const videoEl = document.getElementById("ss-video");
    if (videoEl) videoEl.pause();
    index = (i + items.length) % items.length;
    renderMedia();
    if (playing) startTimer();
    showUI();
  }

  function togglePlay() {
    playing = !playing;
    const toggleBtn = backdrop.querySelector('[data-action="toggle"]');
    if (toggleBtn) toggleBtn.innerHTML = playing ? SVG.pause : SVG.play;
    const videoEl = document.getElementById("ss-video");
    if (playing) {
      if (videoEl) videoEl.play();
      startTimer();
      hideTimer = setTimeout(hideUI, 3000);
    } else {
      if (videoEl) videoEl.pause();
      stopTimer();
      stopProgress();
      clearTimeout(hideTimer);
    }
  }

  function close() {
    stopTimer();
    stopProgress();
    clearTimeout(hideTimer);
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    backdrop.remove();
    window.removeEventListener("keydown", onKey);
  }

  async function toggleFav() {
    const item = items[index];
    item.isFavorite = !item.isFavorite;
    item.updatedAt = new Date().toISOString();
    const { put } = await import("./db.js");
    await put("media", item);
    renderMedia();
  }

  // ── keyboard ──────────────────────────────────────────────────────────────
  function onKey(e) {
    if (e.key === "Escape")                 close();
    if (e.key === "ArrowLeft")              goTo(index - 1);
    if (e.key === "ArrowRight")             goTo(index + 1);
    if (e.key === " ")                      { e.preventDefault(); togglePlay(); }
    if (e.key.toLowerCase() === "f")        toggleFav();
  }

  // ── click delegation ──────────────────────────────────────────────────────
  backdrop.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");

    if (!btn) {
      // tap on stage (image or video) — toggle UI and pause
      if (!uiVisible) {
        if (playing) togglePlay();
        showUI();
      } else {
        hideUI();
      }
      return;
    }

    const action = btn.dataset.action;
    if (action === "close")    close();
    if (action === "prev")     goTo(index - 1);
    if (action === "next")     goTo(index + 1);
    if (action === "toggle")   togglePlay();
    if (action === "download") downloadBlob(items[index].blobData, items[index].fileName);
    if (action === "favorite") { await toggleFav(); showUI(); }
  });

  window.addEventListener("keydown", onKey);
  renderMedia();
  startTimer();
}
