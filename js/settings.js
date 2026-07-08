import { getAll, clearStore, setSetting, getSettingsMap, put as putRow } from "./db.js";
import { notify } from "./notifications.js";
import { setTheme } from "./theme.js";
import { formatBytes } from "./helpers.js";

export async function initSettingsPage() {
  const app = document.getElementById("app");
  const settings = await getSettingsMap();
  const categories = await getAll("categories");
  const media = await getAll("media");
  const favoriteCount = media.filter((i) => i.isFavorite).length;
  const storageBytes = media.reduce((s, i) => s + (i.fileSize || 0), 0);
  const totalImages = media.filter((i) => i.mediaType === "image").length;
  const totalVideos = media.filter((i) => i.mediaType === "video").length;

  app.innerHTML = `
    <div style="max-width:1280px;margin:0 auto;padding:24px 20px 40px;">

      <!-- Stats row -->
      <div style="display:flex;flex-wrap:wrap;gap:32px;padding:8px 0 24px;border-bottom:1px solid #222;margin-bottom:24px;">
        <div>
          <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.06em;">Categories</div>
          <div style="font-size:28px;font-weight:700;color:#fff;margin-top:2px;">${categories.length}</div>
        </div>
        <div>
          <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.06em;">Media</div>
          <div style="font-size:28px;font-weight:700;color:#fff;margin-top:2px;">${media.length}</div>
        </div>
        <div>
          <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.06em;">Images</div>
          <div style="font-size:28px;font-weight:700;color:#fff;margin-top:2px;">${totalImages}</div>
        </div>
        <div>
          <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.06em;">Videos</div>
          <div style="font-size:28px;font-weight:700;color:#fff;margin-top:2px;">${totalVideos}</div>
        </div>
        <div>
          <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.06em;">Favorites</div>
          <div style="font-size:28px;font-weight:700;color:#e53935;margin-top:2px;">${favoriteCount}</div>
        </div>
        <div>
          <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.06em;">Storage Used</div>
          <div style="font-size:28px;font-weight:700;color:#fff;margin-top:2px;">${formatBytes(storageBytes)}</div>
        </div>
      </div>

      <!-- Page title -->
      <div style="margin-bottom:20px;">
        <div style="font-size:20px;font-weight:700;color:#fff;">Settings</div>
        <div style="font-size:13px;color:#aaa;margin-top:2px;">Manage appearance, slideshow, backup, and storage preferences</div>
      </div>

      <!-- Settings grid -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">

        <!-- Appearance -->
        <div class="fk-card" style="overflow:hidden;">
          <div style="background:#AAFF20;padding:14px 18px;display:flex;align-items:center;gap:10px;">
            <svg width="18" height="18" fill="none" stroke="black" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span style="color:#000;font-size:14px;font-weight:700;">Appearance</span>
          </div>
          <div style="padding:18px;display:flex;flex-direction:column;gap:16px;">
            <div>
              <label class="fk-label">Theme</label>
              <select id="theme" class="fk-select">
                <option value="system" ${settings.theme === "system" ? "selected" : ""}>System default</option>
                <option value="light"  ${settings.theme === "light"  ? "selected" : ""}>Light</option>
                <option value="dark"   ${settings.theme === "dark"   ? "selected" : ""}>Dark</option>
              </select>
            </div>
            <hr class="fk-divider" />
            <div>
              <label class="fk-label">Gallery view</label>
              <div style="display:flex;gap:8px;">
                <button data-view="grid" style="flex:1;height:40px;border-radius:2px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;
                  ${settings.galleryView !== "list" ? "background:#AAFF20;color:#000;border:none;" : "background:#1a1a1a;color:#ccc;border:1px solid #333;"}">
                  <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                  Grid
                </button>
                <button data-view="list" style="flex:1;height:40px;border-radius:2px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;
                  ${settings.galleryView === "list" ? "background:#AAFF20;color:#000;border:none;" : "background:#1a1a1a;color:#ccc;border:1px solid #333;"}">
                  <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                  List
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Slideshow -->
        <div class="fk-card" style="overflow:hidden;">
          <div style="background:#AAFF20;padding:14px 18px;display:flex;align-items:center;gap:10px;">
            <svg width="18" height="18" fill="black" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21"/></svg>
            <span style="color:#000;font-size:14px;font-weight:700;">Slideshow</span>
          </div>
          <div style="padding:18px;display:flex;flex-direction:column;gap:16px;">
            <div>
              <label class="fk-label">Slide interval</label>
              <select id="slideshowInterval" class="fk-select">
                ${[3, 5, 10, 30].map((v) => `<option value="${v}" ${Number(settings.slideshowInterval) === v ? "selected" : ""}>${v} seconds</option>`).join("")}
              </select>
            </div>
            <hr class="fk-divider" />
            <div style="background:#0d1a00;border-radius:3px;padding:12px 14px;display:flex;gap:10px;align-items:flex-start;">
              <svg width="16" height="16" fill="none" stroke="#AAFF20" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0;margin-top:1px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p style="font-size:12px;color:#AAFF20;line-height:1.5;">Use <strong>Space</strong> to pause, <strong>Ã¢â€ Â Ã¢â€ â€™</strong> to navigate, and <strong>Esc</strong> to close the slideshow.</p>
            </div>
          </div>
        </div>

        <!-- Backup -->
        <div class="fk-card" style="overflow:hidden;">
          <div style="background:#AAFF20;padding:14px 18px;display:flex;align-items:center;gap:10px;">
            <svg width="18" height="18" fill="none" stroke="black" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span style="color:#000;font-size:14px;font-weight:700;">Backup &amp; Restore</span>
          </div>
          <div style="padding:18px;display:flex;flex-direction:column;gap:12px;">
            <p style="font-size:13px;color:#aaa;line-height:1.6;">Export your categories, tags, and settings as a JSON file. Media blobs are not included Ã¢â‚¬â€ only metadata.</p>
            <button id="export" class="fk-btn fk-btn-primary" style="width:100%;justify-content:center;">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Export JSON
            </button>
            <hr class="fk-divider" />
            <p style="font-size:13px;color:#aaa;line-height:1.6;">Restore from a previously exported JSON file. This will overwrite all current data.</p>
            <label class="fk-btn fk-btn-ghost" style="width:100%;justify-content:center;cursor:pointer;">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Import JSON
              <input id="import" type="file" accept="application/json" style="display:none;" />
            </label>
          </div>
        </div>

        <!-- Danger zone -->
        <div class="fk-card" style="overflow:hidden;">
          <div style="background:#e53935;padding:14px 18px;display:flex;align-items:center;gap:10px;">
            <svg width="18" height="18" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span style="color:#000;font-size:14px;font-weight:700;">Danger Zone</span>
          </div>
          <div style="padding:18px;display:flex;flex-direction:column;gap:12px;">
            <div style="background:#1a1111;border:1px solid #3a1010;border-radius:3px;padding:12px 14px;">
              <p style="font-size:13px;color:#ff6b6b;font-weight:600;margin-bottom:4px;">Clear all data</p>
              <p style="font-size:12px;color:#ffb3b3;line-height:1.5;">This permanently deletes all categories, media, tags, and settings stored in IndexedDB. This action cannot be undone.</p>
            </div>
            <button id="clear" class="fk-btn fk-btn-danger" style="width:100%;justify-content:center;">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              Clear All Data
            </button>
          </div>
        </div>

      </div>
    </div>
  `;

  // Ã¢â€â‚¬Ã¢â€â‚¬ Event handlers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  app.addEventListener("change", async (e) => {
    const { id, value } = e.target;
    if (id === "theme") { await setTheme(value); notify("Theme updated"); return; }
    if (id === "slideshowInterval") { await setSetting("slideshowInterval", Number(value)); notify("Slideshow interval saved"); return; }
    if (id === "import") {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        await clearStore("categories");
        await clearStore("media");
        await clearStore("tags");
        await clearStore("settings");
        for (const row of data.categories || []) await putRow("categories", row);
        for (const row of data.media     || []) await putRow("media", row);
        for (const row of data.tags      || []) await putRow("tags", row);
        for (const row of data.settings  || []) await putRow("settings", row);
        notify("Import complete");
        location.reload();
      } catch {
        notify("Import failed Ã¢â‚¬â€ invalid JSON");
      }
    }
  });

  app.addEventListener("click", async (e) => {
    const btn = e.target.closest("button, label");
    if (!btn) return;

    // Gallery view toggle
    if (btn.dataset.view) {
      await setSetting("galleryView", btn.dataset.view);
      notify("Gallery view saved");
      app.querySelectorAll("[data-view]").forEach((b) => {
        const active = b.dataset.view === btn.dataset.view;
        b.style.background = active ? "#AAFF20" : "#1a1a1a";
        b.style.color = active ? "#000" : "#ccc";
        b.style.border = active ? "none" : "1px solid #333";
      });
      return;
    }

    if (btn.id === "export") {
      const snap = await getSettingsMap();
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        categories: await getAll("categories"),
        media: (await getAll("media")).map(({ blobData, thumbnailBlob, ...rest }) => rest),
        tags: await getAll("tags"),
        settings: Object.entries(snap).map(([key, value]) => ({ key, value })),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "meradogs-backup.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      notify("Export ready Ã¢â‚¬â€ check your downloads");
      return;
    }

    if (btn.id === "clear") {
      if (!confirm("Delete ALL categories, media, tags, and settings? This cannot be undone.")) return;
      await clearStore("categories");
      await clearStore("media");
      await clearStore("tags");
      await clearStore("settings");
      notify("All data cleared");
      location.reload();
    }
  });
}
