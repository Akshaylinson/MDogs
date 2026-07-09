const SESSION_KEY = "mda_auth";
const CORRECT_PW  = "Gu7vRG9m3FjDi9S2025";

export function requireAuth() {
  return new Promise((resolve) => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") { resolve(); return; }

    // Hide page content until authenticated
    document.body.style.visibility = "hidden";

    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:9999;
      background:#000;
      display:flex;align-items:center;justify-content:center;
      font-family:'Inter',sans-serif;
      visibility:visible;
    `;

    overlay.innerHTML = `
      <div style="
        background:#111;border:1px solid #222;border-radius:4px;
        width:100%;max-width:360px;margin:16px;overflow:hidden;
        box-shadow:0 20px 60px rgba(0,0,0,.8);">

        <!-- Header -->
        <div style="background:#AAFF20;padding:18px 20px;">
          <div style="font-size:17px;font-weight:700;color:#000;letter-spacing:-.3px;">MeraDogs</div>
          <div style="font-size:11px;color:#000;opacity:.6;margin-top:2px;font-style:italic;">Media Archive ✦</div>
        </div>

        <!-- Body -->
        <div style="padding:24px 20px;display:flex;flex-direction:column;gap:16px;">
          <div>
            <div style="font-size:14px;font-weight:600;color:#fff;margin-bottom:4px;">Enter Password</div>
            <div style="font-size:12px;color:#666;">This archive is private. Enter the password to continue.</div>
          </div>

          <div style="position:relative;">
            <input id="auth-input" type="password" placeholder="Password"
              autocomplete="current-password" spellcheck="false"
              style="
                width:100%;height:44px;background:#1a1a1a;border:1px solid #333;
                border-radius:2px;padding:0 44px 0 14px;font-size:14px;
                color:#fff;outline:none;box-sizing:border-box;transition:border-color .15s;" />
            <button id="auth-toggle" type="button" style="
              position:absolute;right:0;top:0;width:44px;height:44px;
              background:none;border:none;cursor:pointer;color:#555;
              display:flex;align-items:center;justify-content:center;">
              <svg id="eye-icon" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>

          <div id="auth-error" style="
            display:none;background:rgba(229,57,53,.12);border:1px solid rgba(229,57,53,.3);
            border-radius:2px;padding:10px 12px;font-size:12px;color:#ef5350;"></div>

          <button id="auth-submit" style="
            height:44px;background:#AAFF20;border:none;border-radius:2px;
            font-size:14px;font-weight:700;color:#000;cursor:pointer;
            transition:background .15s;">
            Unlock
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.visibility = "visible";

    const input   = overlay.querySelector("#auth-input");
    const submit  = overlay.querySelector("#auth-submit");
    const errorEl = overlay.querySelector("#auth-error");
    const toggle  = overlay.querySelector("#auth-toggle");
    let attempts  = 0;

    input.focus();

    // Show/hide password toggle
    toggle.addEventListener("click", () => {
      const isText = input.type === "text";
      input.type = isText ? "password" : "text";
      toggle.querySelector("#eye-icon").innerHTML = isText
        ? `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`
        : `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;
    });

    // Input focus style
    input.addEventListener("focus", () => { input.style.borderColor = "#AAFF20"; });
    input.addEventListener("blur",  () => { input.style.borderColor = "#333"; });

    function showError(msg) {
      errorEl.textContent = msg;
      errorEl.style.display = "block";
      input.style.borderColor = "#e53935";
      input.value = "";
      input.focus();
    }

    function attempt() {
      const val = input.value;
      if (!val) { showError("Please enter the password."); return; }

      if (val === CORRECT_PW) {
        sessionStorage.setItem(SESSION_KEY, "1");
        overlay.remove();
        resolve();
      } else {
        attempts++;
        const remaining = 5 - attempts;
        if (remaining <= 0) {
          showError("Too many failed attempts. Please refresh the page.");
          submit.disabled = true;
          input.disabled  = true;
        } else {
          showError(`Incorrect password. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`);
        }
      }
    }

    submit.addEventListener("click", attempt);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") attempt(); });
  });
}
