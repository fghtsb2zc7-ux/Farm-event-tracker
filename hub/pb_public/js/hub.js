/* App Hub control panel. Talks to the hub's own server (hub/pb_hooks/hub.pb.js), which does the work:
 * app status and restarts, looks, lists (through each app), change history, and the Claude chat.
 * Icons are from Lucide (ISC licence). */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* ── Icons ─────────────────────────────────────────────────────── */
  const ICONS = {
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    palette: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z"/>',
    list: '<path d="M3 6h.01M3 12h.01M3 18h.01M8 6h13M8 12h13M8 18h13"/>',
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    restart: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    open: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    grip: '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11"/>',
    phone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    ok: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  };
  const ico = (name, cls = "icon") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  const drawIcons = (root = document) => $$("i[data-ico]", root).forEach((i) => {
    i.outerHTML = i.classList.contains("inline") ? `<span class="inline">${ico(i.dataset.ico)}</span>` : ico(i.dataset.ico);
  });

  /* ── Server ────────────────────────────────────────────────────── */
  // The hub is served at the root of its own port or at …/hub/, so every address is relative to this page.
  const BASE = new URL("./", location.href).href.replace(/\/$/, "");
  // Its own sign-in key: under /hub it shares the browser storage of the Farm Log's address.
  const Store = new PocketBase(BASE).authStore.constructor;
  const pb = new PocketBase(BASE, new Store("apphub_auth"));
  pb.autoCancellation(false);
  const errMsg = (err) => err?.response?.message || err?.message || "Something went wrong.";
  async function api(path, opts = {}) {
    try {
      return await pb.send("/api/hub/" + path, opts);
    } catch (err) {
      if (err?.status === 401) { pb.authStore.clear(); showLogin("You were signed out. Sign in again."); }
      throw err;
    }
  }
  const json = (method, body) => ({ method, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });

  /* ── Small helpers ─────────────────────────────────────────────── */
  let toastTimer;
  function toast(msg, opts = {}) {
    const t = $("#toast"), b = $("#toastAction");
    $("#toastText").textContent = msg;
    t.classList.toggle("bad", !!opts.bad);
    b.hidden = !opts.action;
    if (opts.action) { b.textContent = opts.action; b.onclick = () => { t.classList.remove("show"); opts.run(); }; }
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), opts.action ? 7000 : 3200);
  }
  const fail = (err) => toast(errMsg(err), { bad: true });

  // A button that needs a second tap to do something disruptive.
  const armed = new WeakMap();
  function confirmTap(btn, label, run) {
    if (armed.get(btn)) { armed.delete(btn); btn.classList.remove("danger"); run(); return; }
    const old = btn.innerHTML;
    armed.set(btn, true); btn.classList.add("danger"); btn.textContent = label;
    setTimeout(() => { if (armed.get(btn)) { armed.delete(btn); btn.classList.remove("danger"); btn.innerHTML = old; } }, 4000);
  }

  function ago(sec) {
    if (!sec) return "never";
    const d = Math.max(0, Date.now() / 1000 - sec);
    if (d < 90) return "just now";
    if (d < 3600) return `${Math.round(d / 60)} min ago`;
    if (d < 86400) return `${Math.round(d / 3600)} h ago`;
    if (d < 172800) return "yesterday";
    return new Date(sec * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  function when(stamp) {  // "2026-09-30 10:02:00" (Mac's local time) or PocketBase's UTC "…Z"
    const d = /Z$/.test(stamp) ? new Date(stamp.replace(" ", "T")) : new Date(stamp.replace(" ", "T"));
    if (isNaN(d)) return stamp;
    const today = new Date().toDateString() === d.toDateString();
    const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return today ? time : `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${time}`;
  }

  /* ── Sign in ───────────────────────────────────────────────────── */
  function showLogin(msg) {
    document.body.classList.add("signed-out");
    $("#shell").hidden = true;
    $("#login").hidden = false;
    $("#loginMsg").textContent = msg || "";
    setTimeout(() => $("#l-email").focus(), 50);
  }
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("#loginForm button");
    btn.disabled = true; $("#loginMsg").textContent = "Signing in…";
    try {
      await pb.collection("_superusers").authWithPassword($("#l-email").value.trim(), $("#l-pass").value);
      $("#l-pass").value = "";
      showShell();
    } catch (err) {
      $("#loginMsg").textContent = err?.status === 400 ? "That email and password don't match the hub's admin login." : errMsg(err);
    } finally { btn.disabled = false; }
  });
  $("#signOut").addEventListener("click", () => { pb.authStore.clear(); showLogin("Signed out."); });

  /* ── Tabs ──────────────────────────────────────────────────────── */
  let tab = "apps";
  const TABS = ["apps", "look", "lists", "ask", "history"];
  function go(name) {
    if (!TABS.includes(name)) name = "apps";
    if (tab === "look" && name !== "look" && L.dirty && !confirm("Leave without saving your look changes?")) return;
    tab = name;
    $$("#tabs button").forEach((b) => (b.dataset.tab === name ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current")));
    TABS.forEach((t) => { $("#view-" + t).hidden = t !== name; });
    if (location.hash !== "#" + name) history.replaceState(null, "", "#" + name);
    ({ apps: loadStatus, look: openLook, lists: openLists, ask: openAsk, history: loadChanges })[name]();
    window.scrollTo(0, 0);
  }
  $("#tabs").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) go(b.dataset.tab); });

  function showShell() {
    document.body.classList.remove("signed-out");
    $("#login").hidden = true;
    $("#shell").hidden = false;
    go(location.hash.slice(1) || "apps");
    if (tab !== "apps") loadStatus();
  }

  /* ── Apps ──────────────────────────────────────────────────────── */
  let status = null;
  const editableApps = () => (status?.apps || []).filter((a) => !a.isHub);
  function appUrl(a) {
    const hub = (status?.apps || []).find((x) => x.isHub);
    // Opened on the Mac mini at 127.0.0.1:8092: each app has its own port. Online, each has its own path.
    if (hub && location.port === String(hub.port)) return `${location.protocol}//${location.hostname}:${a.port}/`;
    return location.origin + (a.path === "/" ? "/" : a.path.replace(/\/?$/, "/"));
  }

  async function loadStatus() {
    try { status = await api("status"); } catch (err) { if (err?.status !== 401) fail(err); return; }
    const problems = status.apps.some((a) => !a.paused && (!a.up || a.problems.length)) || status.general.length;
    const tabBtn = $('#tabs [data-tab="apps"]');
    $(".badge", tabBtn)?.remove();
    if (problems) tabBtn.insertAdjacentHTML("beforeend", '<span class="badge" aria-label="Needs attention"></span>');
    if (tab === "apps") renderApps();
  }

  function renderApps() {
    const apps = status.apps;
    const issues = [];
    apps.forEach((a) => {
      if (a.paused) return;
      if (!a.up && !a.problems.some((p) => p.kind === "down")) issues.push(`${a.name} isn't answering.`);
      a.problems.forEach((p) => issues.push(`${a.name}: ${p.text}`));
    });
    status.general.forEach((p) => issues.push(p.text));
    const sum = $("#summary");
    if (!issues.length) {
      sum.className = "summary ok";
      sum.innerHTML = `${ico("ok")}<div>Everything's running<small>${status.watchdog
        ? "The watchdog checks every app each minute and texts you if something goes wrong."
        : "The watchdog isn't turned on yet, so problems won't be fixed or texted to you. See docs/APP-HUB-SETUP.md."}</small></div>`;
    } else {
      sum.className = "summary warn";
      sum.innerHTML = `${ico("alert")}<div>${issues.length === 1 ? "1 thing needs attention" : `${issues.length} things need attention`}<small>${issues.map(esc).join("<br>")}</small></div>`;
    }

    $("#appGrid").innerHTML = apps.map((a) => {
      const pill = a.paused ? '<span class="pill off">Alerts paused</span>'
        : !a.up ? '<span class="pill bad">Not answering</span>'
        : a.problems.length ? '<span class="pill warn">Needs attention</span>'
        : '<span class="pill ok">Running</span>';
      return `<article class="card" data-app="${a.id}">
        <div class="app-top"><h3>${esc(a.name)}</h3>${pill}</div>
        <dl class="facts">
          <div><dt>Address</dt><dd>${esc(a.path === "/" ? "/" : a.path + "/")}</dd></div>
          <div><dt>Last backup</dt><dd>${a.lastBackup ? ago(a.lastBackup) : "none yet"}</dd></div>
        </dl>
        ${a.problems.map((p) => `<div class="problem">${ico("alert", "icon sm")}<span>${esc(p.text)} <span class="meta">Since ${ago(p.since)}.</span></span></div>`).join("")}
        <div class="app-btns">
          ${a.isHub ? "" : `<a class="btn outline sm" href="${esc(appUrl(a))}" target="_blank" rel="noopener">${ico("open", "icon sm")}Open</a>`}
          ${a.isHub ? "" : `<button class="btn outline sm" type="button" data-restart>${ico("restart", "icon sm")}Restart</button>`}
          <button class="btn ghost sm" type="button" data-pause="${a.paused ? "resume" : "pause"}">${ico(a.paused ? "play" : "pause", "icon sm")}${a.paused ? "Resume alerts" : "Pause alerts"}</button>
        </div>
      </article>`;
    }).join("");

    $("#events").innerHTML = status.events.length
      ? status.events.slice().reverse().map((ev) => `<li><time>${esc(when(ev.at))}</time><span>${esc(ev.text)}</span></li>`).join("")
      : '<li class="empty">Nothing yet. Problems the watchdog finds and fixes will show here.</li>';
  }

  $("#appGrid").addEventListener("click", (e) => {
    const card = e.target.closest("[data-app]"); if (!card) return;
    const a = status.apps.find((x) => x.id === card.dataset.app);
    const rb = e.target.closest("[data-restart]");
    if (rb) {
      confirmTap(rb, "Tap again to restart", async () => {
        rb.disabled = true; rb.textContent = "Restarting…";
        try {
          const r = await api(`apps/${a.id}/restart`, { method: "POST" });
          toast(r.up ? `${a.name} restarted and is running.` : `${a.name} restarted but isn't answering yet.`, { bad: !r.up });
        } catch (err) { fail(err); }
        loadStatus();
      });
      return;
    }
    const pb2 = e.target.closest("[data-pause]");
    if (pb2) {
      api(`apps/${a.id}/${pb2.dataset.pause}`, { method: "POST" })
        .then((r) => { toast(r.paused ? `Alerts paused for ${a.name}. The watchdog leaves it alone until you resume.` : `Watching ${a.name} again.`); loadStatus(); })
        .catch(fail);
    }
  });
  setInterval(() => { if (!document.hidden && pb.authStore.isValid && !$("#shell").hidden) loadStatus(); }, 30000);

  function fillAppPicker(sel, current) {
    const apps = editableApps();
    sel.innerHTML = apps.map((a) => `<option value="${a.id}"${a.id === current ? " selected" : ""}>${esc(a.name)}</option>`).join("");
    return sel.value;
  }

  /* ── Look ──────────────────────────────────────────────────────── */
  const COLOR_META = [
    ["brand", "Main color", "Buttons and highlights"],
    ["accent", "Accent", "Links and selected items"],
    ["logoText", "Logo text", "The app's name at the top"],
    ["background", "Background", "Behind everything"],
    ["surface", "Cards", "Boxes and panels"],
    ["text", "Text", "Main writing"],
  ];
  const PRESETS = [
    { name: "Barn red", colors: { brand: "#9b2c2c", accent: "#7f1d1d", logoText: "#3b1d1d", background: "#faf6f2", surface: "#ffffff", text: "#2b2222" } },
    { name: "Lake blue", colors: { brand: "#1d5fbf", accent: "#1e4f99", logoText: "#1b2a41", background: "#f4f7fb", surface: "#ffffff", text: "#1c2430" } },
    { name: "Field green", colors: { brand: "#3f7d20", accent: "#2f6417", logoText: "#26331d", background: "#f5f7f1", surface: "#ffffff", text: "#22281e" } },
    { name: "Harvest gold", colors: { brand: "#b7791f", accent: "#8a5a12", logoText: "#3d2e14", background: "#fbf7ef", surface: "#ffffff", text: "#2c2517" } },
    { name: "Plum", colors: { brand: "#6b2fa0", accent: "#56237f", logoText: "#2e1c3b", background: "#f8f5fb", surface: "#ffffff", text: "#241d2b" } },
    { name: "Charcoal", colors: { brand: "#2f3136", accent: "#3f4f63", logoText: "#1d1f22", background: "#f5f5f4", surface: "#ffffff", text: "#1f2023" } },
  ];
  const L = { app: null, saved: null, defaults: null, fonts: [], draft: null, images: {}, dirty: false, frameReady: false };

  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const lum = (h) => { const v = rgb(h).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

  function draftFrom(saved, defaults) {
    return {
      colors: { ...defaults.colors, ...(saved.colors || {}) },
      fonts: { ...defaults.fonts, ...(saved.fonts || {}) },
      radius: saved.radius ?? defaults.radius ?? 12,
      name: saved.name || defaults.name || "",
      shortName: saved.shortName || defaults.shortName || "",
      logo: saved.logo || 0, icon: saved.icon || 0,
    };
  }
  // Only what differs from the app's own design is saved, so untouched settings keep the app's careful dark mode.
  function lookToSave() {
    const d = L.draft, def = L.defaults, out = {};
    const colors = {}; Object.keys(d.colors).forEach((k) => { if (d.colors[k] !== (def.colors || {})[k]) colors[k] = d.colors[k]; });
    const fonts = {}; Object.keys(d.fonts).forEach((k) => { if (d.fonts[k] !== (def.fonts || {})[k]) fonts[k] = d.fonts[k]; });
    if (Object.keys(colors).length) out.colors = colors;
    if (Object.keys(fonts).length) out.fonts = fonts;
    if (Number(d.radius) !== Number(def.radius ?? 12)) out.radius = Number(d.radius);
    if (d.name && d.name !== def.name) out.name = d.name;
    if (d.shortName && d.shortName !== def.shortName) out.shortName = d.shortName;
    return out;
  }
  function previewLook() {
    const look = lookToSave();
    look.logo = L.images.logo === null ? 0 : L.draft.logo;
    if (L.images.logo) look.logoPreview = L.images.logo;
    return look;
  }

  async function openLook() {
    if (!status) await loadStatus();
    const id = fillAppPicker($("#lookApp"), L.app);
    if (!id) { $(".look-layout").innerHTML = '<p class="empty">No apps are set up yet.</p>'; return; }
    if (id !== L.app || !L.saved) await loadLook(id);
  }
  $("#lookApp").addEventListener("change", (e) => {
    if (L.dirty && !confirm("Switch apps without saving your changes?")) { e.target.value = L.app; return; }
    loadLook(e.target.value);
  });

  async function loadLook(id) {
    let r;
    try { r = await api(`apps/${id}/look`); } catch (err) { fail(err); return; }
    L.app = id; L.saved = r.look || {}; L.defaults = r.defaults; L.fonts = r.fonts;
    L.draft = draftFrom(L.saved, L.defaults); L.images = {};
    loadFontPreviews();
    renderLook();
    setDirty(false);
    const a = status.apps.find((x) => x.id === id);
    L.frameReady = false;
    $("#previewFrame").src = appUrl(a);
  }

  let fontsLoaded = false;
  function loadFontPreviews() {
    if (fontsLoaded || !L.fonts.length) return;
    fontsLoaded = true;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?" + L.fonts.map((f) => "family=" + f.replace(/ /g, "+")).join("&") + "&display=swap";
    document.head.appendChild(link);
  }

  function renderLook() {
    const d = L.draft;
    $("#lk-name").value = d.name; $("#lk-short").value = d.shortName;
    $("#presets").innerHTML = [{ name: "Original", colors: L.defaults.colors }, ...PRESETS].map((p, i) =>
      `<button class="preset" type="button" data-preset="${i}"><span class="dots">${["brand", "accent", "background"].map((k) => `<i style="background:${esc(p.colors[k])}"></i>`).join("")}</span>${esc(p.name)}</button>`).join("");
    $("#colors").innerHTML = COLOR_META.map(([k, label, help]) => `<label class="color">
        <input type="color" data-color="${k}" value="${esc(d.colors[k] || "#ffffff")}" aria-label="${esc(label)}">
        <span><b>${esc(label)}</b><span>${esc(help)}</span></span><code data-hex="${k}">${esc(d.colors[k] || "")}</code></label>`).join("");
    renderFonts();
    $("#lk-radius").value = d.radius; $("#radiusVal").textContent = `${d.radius}px`;
    renderPics();
    checkContrast();
  }

  function renderFonts() {
    const pick = (el, key, label, sample) => {
      const cur = L.draft.fonts[key];
      el.innerHTML = `<details><summary><b>${label}:</b> <span style="font-family:'${esc(cur)}'">${esc(cur)}</span></summary>
        <div class="font-list" role="radiogroup" aria-label="${label}">${L.fonts.map((f) =>
          `<button type="button" class="font-opt" role="radio" aria-checked="${f === cur}" data-font="${key}" data-name="${esc(f)}"><span class="aa" style="font-family:'${esc(f)}'">${sample}</span><small>${esc(f)}</small></button>`).join("")}</div></details>`;
    };
    pick($("#fontBody"), "body", "Main text", "Aa 123");
    pick($("#fontHeading"), "heading", "Headings and logo", "Heading");
  }

  function appFileUrl(path) {
    const a = status.apps.find((x) => x.id === L.app);
    return appUrl(a) + path;
  }
  function renderPics() {
    const logo = L.images.logo !== undefined ? L.images.logo : (L.draft.logo ? appFileUrl(`api/hub/logo?v=${L.draft.logo}`) : null);
    $("#logoPic").innerHTML = logo ? `<img src="${esc(logo)}" alt="Logo">` : "Text logo";
    $("#logoRemove").hidden = !logo;
    const icon = L.images.icon !== undefined ? (L.images.icon && L.images.icon[192]) : appFileUrl(`api/hub/icon/192?v=${L.draft.icon}`);
    $("#iconPic").innerHTML = icon ? `<img src="${esc(icon)}" alt="Icon">` : `<img src="${esc(appFileUrl("api/hub/icon/192?v=0"))}" alt="Icon">`;
    $("#iconRemove").hidden = !(L.images.icon || (L.images.icon === undefined && L.draft.icon));
  }

  function checkContrast() {
    const c = L.draft.colors, w = $("#contrastWarn");
    const low = [];
    if (c.text && c.background && contrast(c.text, c.background) < 4.5) low.push("the background");
    if (c.text && c.surface && contrast(c.text, c.surface) < 4.5) low.push("the cards");
    w.hidden = !low.length;
    w.textContent = low.length ? `The text color may be hard to read on ${low.join(" and ")}. Try a darker text or lighter background.` : "";
  }

  function setDirty(on) {
    L.dirty = on;
    $("#lookSave").hidden = !on;
  }
  let previewTimer;
  function changed() {
    setDirty(true);
    checkContrast();
    clearTimeout(previewTimer);
    previewTimer = setTimeout(sendPreview, 60);
  }
  function sendPreview() {
    const f = $("#previewFrame");
    if (f.contentWindow) f.contentWindow.postMessage({ type: "hub-preview", look: previewLook(), labels: {} }, "*");
  }
  $("#previewFrame").addEventListener("load", () => { L.frameReady = true; sendPreview(); });

  $("#view-look").addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.color) { L.draft.colors[t.dataset.color] = t.value; $(`[data-hex="${t.dataset.color}"]`).textContent = t.value; changed(); }
    else if (t.id === "lk-name") { L.draft.name = t.value; changed(); }
    else if (t.id === "lk-short") { L.draft.shortName = t.value; changed(); }
    else if (t.id === "lk-radius") { L.draft.radius = Number(t.value); $("#radiusVal").textContent = `${t.value}px`; changed(); }
  });
  $("#view-look").addEventListener("click", (e) => {
    const p = e.target.closest("[data-preset]");
    if (p) {
      const set = Number(p.dataset.preset) === 0 ? L.defaults.colors : PRESETS[Number(p.dataset.preset) - 1].colors;
      L.draft.colors = { ...set };
      renderLook(); changed(); return;
    }
    const f = e.target.closest("[data-font]");
    if (f) {
      L.draft.fonts[f.dataset.font] = f.dataset.name;
      const open = $$("details", $("#view-look")).map((d) => d.open);
      renderFonts();
      $$("details", $("#view-look")).forEach((d, i) => { d.open = open[i]; });
      changed();
    }
  });
  $("#resetColors").addEventListener("click", () => { L.draft.colors = { ...L.defaults.colors }; renderLook(); changed(); });

  // Pictures are turned into PNGs here, in the browser: the logo at a sensible size, the icon square in four sizes.
  function readImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("That file isn't a picture this browser can open. Try a PNG or JPEG."));
      img.src = URL.createObjectURL(file);
    });
  }
  function toPng(img, w, h, crop, fill) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const x = c.getContext("2d");
    if (fill) { x.fillStyle = fill; x.fillRect(0, 0, w, h); }
    x.imageSmoothingQuality = "high";
    if (crop) {  // center square
      const s = Math.min(img.naturalWidth, img.naturalHeight);
      x.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, w, h);
    } else x.drawImage(img, 0, 0, w, h);
    return c.toDataURL("image/png");
  }
  $("#logoFile").addEventListener("change", async (e) => {
    const file = e.target.files[0]; e.target.value = "";
    if (!file) return;
    try {
      const img = await readImage(file);
      const scale = Math.min(1, 800 / img.naturalWidth, 300 / img.naturalHeight);
      L.images.logo = toPng(img, Math.round(img.naturalWidth * scale), Math.round(img.naturalHeight * scale));
      renderPics(); changed();
    } catch (err) { fail(err); }
  });
  $("#iconFile").addEventListener("change", async (e) => {
    const file = e.target.files[0]; e.target.value = "";
    if (!file) return;
    try {
      const img = await readImage(file);
      const bg = L.draft.colors.background || "#ffffff";  // phones show see-through parts of icons as black
      L.images.icon = Object.fromEntries([32, 180, 192, 512].map((s) => [s, toPng(img, s, s, true, bg)]));
      renderPics(); changed();
    } catch (err) { fail(err); }
  });
  $("#logoRemove").addEventListener("click", () => { L.images.logo = null; renderPics(); changed(); });
  $("#iconRemove").addEventListener("click", () => { L.images.icon = null; renderPics(); changed(); });

  $("#lookDiscard").addEventListener("click", () => { L.draft = draftFrom(L.saved, L.defaults); L.images = {}; renderLook(); setDirty(false); sendPreview(); });
  $("#lookSaveBtn").addEventListener("click", async () => {
    const btn = $("#lookSaveBtn");
    btn.disabled = true; btn.textContent = "Saving…";
    try {
      const body = { look: lookToSave() };
      if (L.images.logo !== undefined || L.images.icon !== undefined) body.images = { logo: L.images.logo, icon: L.images.icon };
      const r = await api(`apps/${L.app}/look`, json("PUT", body));
      L.saved = r.look; L.draft = draftFrom(L.saved, L.defaults); L.images = {};
      setDirty(false); renderLook();
      $("#previewFrame").src = $("#previewFrame").src;  // reload with the saved look
      const name = status.apps.find((x) => x.id === L.app).name;
      toast(`Saved. ${name} shows the new look the next time it's opened.`, { action: "Undo", run: undoLatest });
    } catch (err) { fail(err); }
    btn.disabled = false; btn.textContent = "Save";
  });
  window.addEventListener("beforeunload", (e) => { if (L.dirty) { e.preventDefault(); e.returnValue = ""; } });

  /* ── Lists ─────────────────────────────────────────────────────── */
  const LS = { app: null, lists: [] };

  async function openLists() {
    if (!status) await loadStatus();
    const id = fillAppPicker($("#listApp"), LS.app);
    if (!id) { $("#lists").innerHTML = '<p class="empty">No apps are set up yet.</p>'; return; }
    loadLists(id);
  }
  $("#listApp").addEventListener("change", (e) => {
    if ($$(".list-card.dirty").length && !confirm("Switch apps without saving your list changes?")) { e.target.value = LS.app; return; }
    loadLists(e.target.value);
  });

  async function loadLists(id) {
    LS.app = id;
    $("#lists").innerHTML = '<p class="empty">Loading…</p>';
    try { LS.lists = (await api(`apps/${id}/lists`)).lists; } catch (err) { $("#lists").innerHTML = `<p class="empty">${esc(errMsg(err))}</p>`; return; }
    $("#lists").innerHTML = LS.lists.map((l) => `<article class="card list-card" data-list="${esc(l.id)}"></article>`).join("") || '<p class="empty">This app has no lists to edit.</p>';
    LS.lists.forEach(renderList);
  }

  const handle = () => `<span class="handle" aria-hidden="true">${ico("grip", "icon sm")}</span>`;
  const xBtn = (label) => `<button class="x-btn" type="button" data-remove aria-label="Remove ${esc(label)}">${ico("x", "icon sm")}</button>`;
  const stringRow = (v) => `<div class="row" data-row>${handle()}<input class="grow" value="${esc(v)}" aria-label="Name">${xBtn(v)}</div>`;
  const objectRow = (l, o) => `<div class="row" data-row>${handle()}<div class="cols">${l.columns.map((c) =>
    `<input data-k="${esc(c.key)}" value="${esc(o[c.key] || "")}" placeholder="${esc(c.label)}" aria-label="${esc(c.label)}">`).join("")}</div>${xBtn(o.name || "row")}</div>`;
  const optionRow = (o) => `<div class="row" data-opt="${esc(o.id || "")}">${handle()}<input class="grow" data-oname value="${esc(o.name)}" placeholder="Option" aria-label="Option name">
    <span class="money"><input type="number" min="0" step="0.01" data-price value="${o.price ? esc(o.price) : ""}" placeholder="0.00" aria-label="Price"></span>${xBtn(o.name)}</div>`;
  const groupBox = (g) => `<div class="group" data-group="${esc(g.id || "")}">
    <div class="group-head">${handle()}<input class="grow" data-gname value="${esc(g.name)}" placeholder="Category name" aria-label="Category name">${xBtn(g.name)}</div>
    <div class="rows" data-options>${(g.options || []).map(optionRow).join("")}</div>
    <div class="add-row" style="padding-left:34px"><button class="btn ghost sm" type="button" data-add-option>${ico("plus", "icon sm")}Add option</button></div></div>`;

  function renderList(l) {
    const card = $(`.list-card[data-list="${CSS.escape(l.id)}"]`);
    let body = "";
    if (l.kind === "strings") {
      body = `<div class="rows" data-rows>${l.items.map(stringRow).join("")}</div>
        <div class="add-row"><input data-new placeholder="Add to ${esc(l.title.toLowerCase())}…" aria-label="New entry"><button class="btn outline sm" type="button" data-add>${ico("plus", "icon sm")}Add</button></div>`;
    } else if (l.kind === "objects") {
      body = `<div class="rows" data-rows>${l.items.map((o) => objectRow(l, o)).join("")}</div>
        <div class="add-row"><button class="btn outline sm" type="button" data-add>${ico("plus", "icon sm")}Add</button></div>`;
    } else if (l.kind === "labels") {
      body = `<div class="rows">${l.items.map((o) => `<div class="label-row" data-key="${esc(o.key)}"><span class="was">${esc(o.default)}</span>
        <input data-lname value="${esc(o.name)}" placeholder="${esc(o.default)}" aria-label="New name for ${esc(o.default)}">
        ${l.colors ? `<span class="swatch"><input type="color" data-lcolor value="${esc(o.color || o.defaultColor)}" data-default="${esc(o.defaultColor)}" aria-label="Color for ${esc(o.default)}"></span>` : "<span></span>"}</div>`).join("")}</div>`;
    } else if (l.kind === "groups") {
      body = `<div data-groups>${l.items.map(groupBox).join("")}</div>
        <div class="add-row"><input data-new placeholder="New category, e.g. Cutting boards" aria-label="New category"><button class="btn outline sm" type="button" data-add>${ico("plus", "icon sm")}Add category</button></div>`;
    } else if (l.kind === "form") {
      body = l.fields.map((f) => `<div class="field"><label>${esc(f.label)}<input data-f="${esc(f.key)}" type="${f.type === "number" ? "number" : "text"}" ${f.type === "number" ? 'step="0.01" min="0"' : ""}
        value="${esc(l.value[f.key] ?? "")}" placeholder="${esc(f.placeholder || "")}"></label></div>`).join("");
    }
    card.innerHTML = `<div class="card-head"><h2>${esc(l.title)}</h2></div><p class="hint">${esc(l.help || "")}</p>${body}
      <div class="list-foot" hidden><span class="meta">Not saved yet</span><button class="btn ghost sm" type="button" data-discard>Discard</button><button class="btn primary sm" type="button" data-save>Save changes</button></div>`;
    card.classList.remove("dirty");
    card._orig = JSON.stringify(collect(card, l));
    const sortOpts = { handle: ".handle", animation: 150, onEnd: () => markList(card) };
    $$("[data-rows]", card).forEach((el) => Sortable.create(el, sortOpts));
    const groups = $("[data-groups]", card);
    if (groups) {
      Sortable.create(groups, { ...sortOpts, handle: ".group-head .handle" });
      $$("[data-options]", card).forEach((el) => Sortable.create(el, sortOpts));
    }
  }

  // Reads a list back out of the page, in the order shown.
  function collect(card, l) {
    if (l.kind === "strings") return { items: $$("[data-row] input", card).map((i) => i.value.trim()).filter(Boolean) };
    if (l.kind === "objects") {
      return { items: $$("[data-row]", card).map((r) => Object.fromEntries($$("[data-k]", r).map((i) => [i.dataset.k, i.value.trim()])))
        .filter((o) => o.name) };
    }
    if (l.kind === "labels") {
      return { items: $$("[data-key]", card).map((r) => {
        const c = $("[data-lcolor]", r);
        return { key: r.dataset.key, name: $("[data-lname]", r).value.trim(), color: c && c.value !== c.dataset.default ? c.value : "" };
      }) };
    }
    if (l.kind === "groups") {
      return { items: $$("[data-group]", card).map((g) => ({
        id: g.dataset.group || undefined, name: $("[data-gname]", g).value.trim(),
        options: $$("[data-opt]", g).map((o) => ({ id: o.dataset.opt || undefined, name: $("[data-oname]", o).value.trim(), price: Number($("[data-price]", o).value) || 0 }))
          .filter((o) => o.name),
      })).filter((g) => g.name) };
    }
    if (l.kind === "form") return { value: Object.fromEntries($$("[data-f]", card).map((i) => [i.dataset.f, i.type === "number" ? Number(i.value) || 0 : i.value.trim()])) };
    return {};
  }
  const listOf = (card) => LS.lists.find((x) => x.id === card.dataset.list);
  function markList(card) {
    const dirty = JSON.stringify(collect(card, listOf(card))) !== card._orig;
    card.classList.toggle("dirty", dirty);
    $(".list-foot", card).hidden = !dirty;
  }

  $("#lists").addEventListener("input", (e) => { const c = e.target.closest(".list-card"); if (c && !e.target.matches("[data-new]")) markList(c); });
  $("#lists").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.matches("[data-new]")) { e.preventDefault(); $("[data-add]", e.target.closest(".list-card")).click(); }
  });
  $("#lists").addEventListener("click", async (e) => {
    const card = e.target.closest(".list-card"); if (!card) return;
    const l = listOf(card);
    if (e.target.closest("[data-remove]")) {
      (e.target.closest("[data-group]") && e.target.closest(".group-head") ? e.target.closest("[data-group]") : e.target.closest(".row")).remove();
      markList(card); return;
    }
    if (e.target.closest("[data-add-option]")) {
      const rows = $("[data-options]", e.target.closest("[data-group]"));
      rows.insertAdjacentHTML("beforeend", optionRow({ name: "", price: 0 }));
      rows.lastElementChild.querySelector("input").focus();
      return;
    }
    if (e.target.closest("[data-add]")) {
      const inp = $("[data-new]", card);
      if (l.kind === "objects") {
        $("[data-rows]", card).insertAdjacentHTML("beforeend", objectRow(l, {}));
        $("[data-rows]", card).lastElementChild.querySelector("input").focus();
        return;
      }
      const v = inp.value.trim(); if (!v) { inp.focus(); return; }
      if (l.kind === "strings") $("[data-rows]", card).insertAdjacentHTML("beforeend", stringRow(v));
      if (l.kind === "groups") {
        $("[data-groups]", card).insertAdjacentHTML("beforeend", groupBox({ name: v, options: [] }));
        $$("[data-options]", card).slice(-1).forEach((el) => Sortable.create(el, { handle: ".handle", animation: 150, onEnd: () => markList(card) }));
      }
      inp.value = ""; inp.focus(); markList(card); return;
    }
    if (e.target.closest("[data-discard]")) { renderList(l); return; }
    const save = e.target.closest("[data-save]");
    if (save) {
      save.disabled = true; save.textContent = "Saving…";
      try {
        const r = await api(`apps/${LS.app}/lists/${encodeURIComponent(l.id)}`, json("PUT", collect(card, l)));
        Object.assign(l, r.list);
        renderList(l);
        toast(`Saved. Everyone using the app sees the new ${l.title.toLowerCase()} now.`, { action: "Undo", run: undoLatest });
      } catch (err) { fail(err); save.disabled = false; save.textContent = "Save changes"; }
    }
  });

  /* ── History ───────────────────────────────────────────────────── */
  async function loadChanges() {
    let r;
    try { r = await api("changes"); } catch (err) { fail(err); return; }
    $("#changes").innerHTML = r.changes.length ? r.changes.map((c) => `<li class="${c.undone ? "undone" : ""}" data-change="${c.id}">
        <div class="what"><b>${esc(c.title)}</b><span class="meta">${esc(when(c.created))} · ${esc(c.who)}</span></div>
        ${c.undone ? '<span class="meta">Undone</span>' : `<button class="btn outline sm" type="button" data-undo>${ico("undo", "icon sm")}Undo</button>`}</li>`).join("")
      : '<li class="empty">No changes yet. Everything you change in Look and Lists shows here, and can be undone.</li>';
  }
  async function undo(id) {
    try { await api(`changes/${id}/undo`, { method: "POST" }); toast("Undone."); } catch (err) { fail(err); return; }
    if (tab === "history") loadChanges();
    if (tab === "lists") loadLists(LS.app);
    if (tab === "look") loadLook(L.app);
  }
  async function undoLatest() {
    try {
      const r = await api("changes");
      const c = r.changes.find((x) => !x.undone);
      if (c) undo(c.id);
    } catch (err) { fail(err); }
  }
  $("#changes").addEventListener("click", (e) => {
    const b = e.target.closest("[data-undo]"); if (!b) return;
    confirmTap(b, "Tap again to undo", () => undo(b.closest("[data-change]").dataset.change));
  });

  /* ── Ask Claude ────────────────────────────────────────────────── */
  const AS = { messages: [], agent: {}, timer: null, sending: false };
  const SUGGEST = ["Is everything running OK?", "Why did an app go down recently?", "How do I add a teammate to the Farm Log?", "Add a “Pickup date” to shop orders"];

  function openAsk() { loadAgent(); $("#msg").focus({ preventScroll: true }); }
  async function loadAgent() {
    clearTimeout(AS.timer);
    try {
      const r = await api("agent");
      const changedCount = r.messages.length !== AS.messages.length || JSON.stringify(r.messages.slice(-1)) !== JSON.stringify(AS.messages.slice(-1));
      AS.messages = r.messages; AS.agent = r.agent;
      renderAgent(changedCount);
    } catch (err) { if (err?.status !== 401) fail(err); }
    if (tab === "ask") AS.timer = setTimeout(loadAgent, document.hidden ? 15000 : 3000);
  }

  // Claude writes a little Markdown: paragraphs, lists, **bold**, `code` and links.
  function md(text) {
    const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/(https?:\/\/[^\s<)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    return String(text).trim().split(/\n{2,}/).map((block) => {
      const lines = block.split("\n");
      if (lines.every((x) => /^\s*([-*•]|\d+\.)\s+/.test(x))) return `<ul>${lines.map((x) => `<li>${inline(x.replace(/^\s*([-*•]|\d+\.)\s+/, ""))}</li>`).join("")}</ul>`;
      return `<p>${lines.map(inline).join("<br>")}</p>`;
    }).join("");
  }

  function renderAgent(scroll) {
    const a = AS.agent, bar = $("#agentBar");
    if (!a.installed) {
      bar.className = "agent-bar";
      bar.innerHTML = `<span class="dot"></span><span>Claude isn't set up on the Mac mini yet. Messages will wait until it is. See <b>docs/CLAUDE-AGENT-SETUP.md</b>.</span>`;
    } else {
      bar.className = "agent-bar" + (a.busy ? " busy" : a.online ? " online" : "");
      bar.innerHTML = `<span class="dot"></span><span>${a.busy ? "Claude is working…" : a.online ? "Claude is ready on the Mac mini" : "Claude isn't responding. The Mac mini may be off, or the agent stopped."}</span>
        ${a.dailyLimit ? `<span class="meta">${a.runsToday} of ${a.dailyLimit} today</span>` : ""}`;
    }
    const chat = $("#chat");
    const last = AS.messages[AS.messages.length - 1];
    let html = AS.messages.map((m) => {
      if (m.role === "note") return `<div class="note">${esc(m.text)}</div>`;
      const texted = m.source === "imessage" ? `<span class="by">${ico("phone", "icon sm")}${m.role === "you" ? "You texted" : "Sent by text"} · ${esc(when(m.created))}</span>` : `<span class="by">${esc(when(m.created))}</span>`;
      return `<div class="bubble ${m.role === "you" ? "you" : "claude"}">${m.role === "you" ? `<p>${esc(m.text).replace(/\n/g, "<br>")}</p>` : md(m.text)}${texted}</div>`;
    }).join("");
    const waiting = AS.messages.some((m) => m.role === "you" && m.status !== "done");
    if (waiting) html += `<div class="typing" aria-label="Claude is working"><i></i><i></i><i></i></div>` +
      (a.installed && !a.online ? '<div class="note">Claude will answer when the agent on the Mac mini is running again.</div>' : "");
    if (!AS.messages.length) html = `<div class="suggest">${SUGGEST.map((s) => `<button type="button" data-say="${esc(s)}">${esc(s)}</button>`).join("")}</div>`;
    chat.innerHTML = html;
    $("#approve").hidden = !(a.waitingForYes && !waiting && last && last.role === "claude");
    if (scroll) requestAnimationFrame(() => window.scrollTo(0, document.body.scrollHeight));
  }

  async function say(text) {
    text = text.trim();
    if (!text || AS.sending) return;
    AS.sending = true;
    try {
      await api("agent", json("POST", { text }));
      $("#msg").value = ""; sizeMsg();
      await loadAgent();
    } catch (err) { fail(err); }
    AS.sending = false;
  }
  $("#composer").addEventListener("submit", (e) => { e.preventDefault(); say($("#msg").value); });
  $("#msg").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !matchMedia("(pointer: coarse)").matches) { e.preventDefault(); say($("#msg").value); } });
  const sizeMsg = () => { const m = $("#msg"); m.style.height = "auto"; m.style.height = Math.min(m.scrollHeight, 180) + "px"; };
  $("#msg").addEventListener("input", sizeMsg);
  $("#view-ask").addEventListener("click", (e) => { const b = e.target.closest("[data-say]"); if (b) say(b.dataset.say); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && tab === "ask") loadAgent(); });

  /* ── Start ─────────────────────────────────────────────────────── */
  drawIcons();
  (async () => {
    if (pb.authStore.isValid && pb.authStore.isSuperuser) {
      try { await pb.collection("_superusers").authRefresh(); showShell(); return; } catch (err) { if (err?.status !== 0) pb.authStore.clear(); else { showShell(); return; } }
    }
    showLogin();
  })();
})();
