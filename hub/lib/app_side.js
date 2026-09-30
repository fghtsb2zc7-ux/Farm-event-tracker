// The App Hub's side of each app: what an app serves so the control panel can restyle it and edit its lists.
// Each app's pb_hooks/hub.pb.js sends its requests here with the app's id ("farm", "shop").
//
// Settings live outside the apps, in ~/AppHub/apps/<app>/ (written by the hub):
//   look.json    colors, fonts, corner roundness, name, logo and icon versions
//   labels.json  renamed or recolored built-in choices (farm event types, shop order statuses)
//   logo-<v>.png, icon-<v>-<size>.png
// Lists stored in an app's own database (crops, products…) are read and changed through that app, so
// everyone using it sees the change live. Those requests need the hub's key (~/AppHub/hub.key).

const { themeCss } = require(`${__hooks}/../../hub/lib/theme.js`);

// ~/AppHub. Apps keep their data in ~/<Something>/pb_data, so home is two folders up from it.
function hubDir(app) {
  const env = $os.getenv("HUB_DIR");
  if (env) return env;
  return $filepath.join($filepath.dir($filepath.dir(app.dataDir())), "AppHub");
}
const appDir = (app, id) => $filepath.join(hubDir(app), "apps", id);

function readJSON(path, fallback) {
  try { return JSON.parse(toString($os.readFile(path))); } catch (_) { return fallback; }
}
function writeJSON(path, value) {
  $os.mkdirAll($filepath.dir(path), 0o755);
  $os.writeFile(path, JSON.stringify(value, null, 2), 0o644);
}
const lookOf = (app, id) => ({
  look: readJSON($filepath.join(appDir(app, id), "look.json"), {}),
  labels: readJSON($filepath.join(appDir(app, id), "labels.json"), {}),
});

// ---- Public: the look (needed before anyone signs in) ----

function themeRoute(e, id) {
  const l = lookOf(e.app, id);
  e.response.header().set("Content-Type", "text/css; charset=utf-8");
  e.response.header().set("Cache-Control", "no-cache");
  return e.string(200, "/* Set in the App Hub control panel. */\n" + themeCss(l.look, l.labels, ""));
}

function lookJsRoute(e, id) {
  const l = lookOf(e.app, id);
  const pub = { look: l.look, labels: l.labels };
  e.response.header().set("Content-Type", "text/javascript; charset=utf-8");
  e.response.header().set("Cache-Control", "no-cache");
  return e.string(200, `// Set in the App Hub control panel.
window.HUB_LOOK = ${JSON.stringify(pub).replace(/</g, "\\u003c")};
window.HUB_THEME_CSS = ${themeCss.toString()};
(function () {
  var L = window.HUB_LOOK.look || {};
  var base = (document.currentScript && document.currentScript.src || "").replace(/look\\.js.*$/, "");
  if (L.name) document.title = L.name;
  var m = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (m && L.shortName) m.content = L.shortName;
  // Live preview: the control panel shows this app in a frame and sends it unsaved settings. Styling only.
  if (window.parent === window) return;
  window.addEventListener("message", function (ev) {
    var d = ev.data || {};
    if (d.type !== "hub-preview") return;
    try { if (new URL(ev.origin).hostname !== location.hostname) return; } catch (_) { return; }
    var s = document.getElementById("hub-preview");
    if (!s) { s = document.createElement("style"); s.id = "hub-preview"; document.head.appendChild(s); }
    s.textContent = window.HUB_THEME_CSS(d.look, d.labels, base);
    var t = document.getElementById("hub-theme"); if (t) t.disabled = true;
  });
})();
`);
}

function sendFile(e, path, type) {
  let bytes;
  try { bytes = $os.readFile(path); } catch (_) { return e.string(404, "Not found\n"); }
  e.response.header().set("Cache-Control", "no-cache");
  return e.blob(200, type, bytes);
}

function logoRoute(e, id) {
  const v = Number(lookOf(e.app, id).look.logo) || 0;
  if (!v) return e.string(404, "No logo set\n");
  return sendFile(e, $filepath.join(appDir(e.app, id), `logo-${v}.png`), "image/png");
}

// The app's own icons (in pb_public/icons) unless one was uploaded in the control panel.
const DEFAULT_ICONS = { 32: "favicon-32.png", 180: "apple-touch-icon.png", 192: "icon-192.png", 512: "icon-512.png" };
function iconRoute(e, id) {
  const size = Number(e.request.pathValue("size"));
  if (!DEFAULT_ICONS[size]) return e.string(404, "Not found\n");
  const v = Number(lookOf(e.app, id).look.icon) || 0;
  if (v) {
    const custom = $filepath.join(appDir(e.app, id), `icon-${v}-${size}.png`);
    try { $os.stat(custom); return sendFile(e, custom, "image/png"); } catch (_) {}
  }
  return sendFile(e, `${__hooks}/../pb_public/icons/${DEFAULT_ICONS[size]}`, "image/png");
}

// The home-screen manifest, with the name, icon and background color chosen in the control panel.
// It's served from …/api/hub/manifest, so relative addresses in it are adjusted to still point at the app.
function manifestRoute(e, id) {
  const m = readJSON(`${__hooks}/../pb_public/manifest.webmanifest`, {});
  const l = lookOf(e.app, id).look;
  const fix = (u) => (u && !/^(\/|https?:)/.test(u) ? "../../" + u : u);
  m.start_url = fix(m.start_url); m.scope = fix(m.scope);
  if (l.name) m.name = l.name;
  if (l.shortName) m.short_name = l.shortName;
  const bg = ((l.colors || {}).background || "");
  if (/^#[0-9a-f]{6}$/i.test(bg)) { m.background_color = bg; m.theme_color = bg; }
  if (Number(l.icon) > 0) {
    m.icons = [
      { src: "icon/192", sizes: "192x192", type: "image/png" },
      { src: "icon/512", sizes: "512x512", type: "image/png" },
    ];
  } else {
    m.icons = (m.icons || []).map((i) => ({ ...i, src: fix(i.src) }));
  }
  e.response.header().set("Content-Type", "application/manifest+json");
  e.response.header().set("Cache-Control", "no-cache");
  return e.string(200, JSON.stringify(m, null, 2));
}

// ---- Hub only: lists ----

function keyOk(e) {
  let key = "";
  try { key = toString($os.readFile($filepath.join(hubDir(e.app), "hub.key"))).trim(); } catch (_) {}
  const given = e.request.header.get("X-Hub-Key") || "";
  return key.length >= 20 && $security.equal(given, key);
}

const cleanText = (v, max) => String(v === undefined || v === null ? "" : v).replace(/\s+/g, " ").trim().slice(0, max || 120);
function cleanStrings(items) {
  const out = [];
  (Array.isArray(items) ? items : []).forEach((s) => {
    const t = cleanText(s);
    if (t && !out.some((x) => x.toLowerCase() === t.toLowerCase())) out.push(t);
  });
  return out;
}

function getDoc(app, col, id) {
  try { const r = app.findRecordById(col, id); return { rec: r, data: JSON.parse(r.getString("data") || "{}") }; } catch (_) { return { rec: null, data: null }; }
}
function saveDoc(app, col, id, data) {
  let r;
  try { r = app.findRecordById(col, id); } catch (_) { r = new Record(app.findCollectionByNameOrId(col)); r.set("id", id); }
  r.set("data", data);
  app.save(r);
}

// Built-in choices that are part of each app's code; their names (and farm colors) can be changed.
const FARM_TYPES = {
  spray: { name: "Spray", color: "#2a78d6", what: "Chemicals", extra: ["Rate", "Re-entry"] },
  planting: { name: "Planting", color: "#1baf7a", what: "Crops and varieties", extra: ["Amount", "Seed lot"] },
  nutrient: { name: "Nutrient", color: "#c98500", what: "Fertilizers", extra: ["Rate", "Method"] },
  harvest: { name: "Harvest", color: "#eb6834", what: "Crops", extra: ["Amount", "Destination"] },
  garden: { name: "Garden", color: "#008300", what: "Tasks", extra: [] },
};
const FARM_CROPS = ["Strawberries", "Cucumbers", "Garlic", "Garden", "Fall Produce"];
const SHOP_STATUSES = { new: "Ordered", making: "In progress", ready: "Ready", done: "Completed", cancelled: "Cancelled" };

// Every list the control panel can edit for an app. Kinds the control panel knows how to show:
//   strings   a simple list (add, rename, reorder, remove)
//   objects   a list whose entries have a few details each (columns)
//   labels    fixed built-in choices that can be renamed (and recolored when "colors" is true)
//   groups    categories, each with its own options and prices
//   form      a few single settings
function listsGet(app, id) {
  const labels = lookOf(app, id).labels;
  if (id === "farm") {
    const d = getDoc(app, "lists", "main").data || {};
    const names = labels.types || {};
    const lists = [
      { id: "crops", title: "Crops", help: "Offered when logging events and notes. Renaming a crop here doesn't change past entries.", kind: "strings",
        items: Array.isArray(d.crops) ? d.crops : FARM_CROPS },
      { id: "fields", title: "Fields", help: "Offered when logging events.", kind: "strings", items: d.fields || [] },
      { id: "types", title: "Event types", help: "The five kinds of event. Rename them or change their colors.", kind: "labels", colors: true,
        items: Object.keys(FARM_TYPES).map((k) => ({ key: k, default: FARM_TYPES[k].name, defaultColor: FARM_TYPES[k].color,
          name: (names[k] || {}).name || "", color: (names[k] || {}).color || "" })) },
    ];
    Object.keys(FARM_TYPES).forEach((k) => {
      const t = FARM_TYPES[k];
      lists.push({ id: "saved." + k, title: `${(names[k] || {}).name || t.name}: saved ${t.what.toLowerCase()}`,
        help: "Offered in the first box of the log form for this type, with the details filled in.", kind: "objects",
        columns: [{ key: "name", label: "Name" }].concat(t.extra.map((x) => ({ key: x, label: x }))),
        items: ((d.saved || {})[k] || []).map((o) => o) });
    });
    return lists;
  }
  if (id === "shop") {
    const cats = app.findAllRecords("catalog").map((r) => ({ id: r.id, ...JSON.parse(r.getString("data") || "{}") }))
      .sort((a, b) => (a.sort === undefined ? 99 : a.sort) - (b.sort === undefined ? 99 : b.sort) || String(a.name).localeCompare(String(b.name)));
    const cfg = getDoc(app, "config", "main").data || {};
    const st = labels.statuses || {};
    return [
      { id: "catalog", title: "Products and prices", help: "Categories and the options offered in each. Past orders keep the items and prices they were made with.",
        kind: "groups", items: cats.map((c) => ({ id: c.id, name: c.name || "", options: (c.options || []).map((o) => ({ id: o.id, name: o.name || "", price: Number(o.price) || 0 })) })) },
      { id: "statuses", title: "Order stages", help: "The stages an order moves through.", kind: "labels", colors: false,
        items: Object.keys(SHOP_STATUSES).map((k) => ({ key: k, default: SHOP_STATUSES[k], name: st[k] || "" })) },
      { id: "business", title: "Shop details", help: "Shown on orders and receipts.", kind: "form",
        fields: [{ key: "businessName", label: "Business name" }, { key: "taxName", label: "Tax name", placeholder: "HST" },
          { key: "taxRate", label: "Tax rate (%)", type: "number" }],
        value: { businessName: cfg.businessName || "", taxName: cfg.taxName || "", taxRate: Number(cfg.taxRate) || 0 } },
    ];
  }
  return [];
}

function saveLabels(app, id, key, value) {
  const path = $filepath.join(appDir(app, id), "labels.json");
  const labels = readJSON(path, {});
  labels[key] = value;
  writeJSON(path, labels);
}

// Replaces one list with the given items (or value, for a form). Returns the list as saved.
function listsPut(app, id, listId, body) {
  const items = body.items;
  const hexOk = (v) => /^#[0-9a-f]{6}$/i.test(v || "");
  if (id === "farm") {
    if (listId === "crops" || listId === "fields" || listId.indexOf("saved.") === 0) {
      const d = getDoc(app, "lists", "main").data || { crops: FARM_CROPS, fields: [], saved: {} };
      if (listId === "crops" || listId === "fields") d[listId] = cleanStrings(items);
      else {
        const k = listId.slice(6), t = FARM_TYPES[k];
        if (!t) throw new BadRequestError("Unknown list.");
        const seen = {};
        d.saved = d.saved || {};
        d.saved[k] = (Array.isArray(items) ? items : []).map((o) => {
          const out = { name: cleanText(o && o.name) };
          t.extra.forEach((x) => { const v = cleanText(o && o[x]); if (v) out[x] = v; });
          return out;
        }).filter((o) => o.name && !seen[o.name.toLowerCase()] && (seen[o.name.toLowerCase()] = true));
      }
      saveDoc(app, "lists", "main", d);
    } else if (listId === "types") {
      const out = {};
      (Array.isArray(items) ? items : []).forEach((o) => {
        if (!o || !FARM_TYPES[o.key]) return;
        const v = {};
        const n = cleanText(o.name, 40); if (n && n !== FARM_TYPES[o.key].name) v.name = n;
        if (hexOk(o.color) && o.color.toLowerCase() !== FARM_TYPES[o.key].color) v.color = o.color.toLowerCase();
        if (v.name || v.color) out[o.key] = v;
      });
      saveLabels(app, id, "types", out);
    } else throw new BadRequestError("Unknown list.");
  } else if (id === "shop") {
    if (listId === "catalog") {
      const col = app.findCollectionByNameOrId("catalog");
      const keep = {};
      (Array.isArray(items) ? items : []).forEach((c, i) => {
        const name = cleanText(c && c.name); if (!name) return;
        const options = (Array.isArray(c.options) ? c.options : []).map((o) => ({
          id: /^[A-Za-z0-9]{1,40}$/.test((o && o.id) || "") ? o.id : "o" + $security.randomStringWithAlphabet(10, "abcdefghijklmnopqrstuvwxyz0123456789"),
          name: cleanText(o && o.name), price: Math.max(0, Math.round((Number(o && o.price) || 0) * 100) / 100),
        })).filter((o) => o.name);
        let r = null;
        const cid = /^[A-Za-z0-9]{1,40}$/.test(c.id || "") ? c.id : "";
        if (cid) { try { r = app.findRecordById("catalog", cid); } catch (_) {} }
        const data = r ? JSON.parse(r.getString("data") || "{}") : {};
        if (!r) { r = new Record(col); if (cid) r.set("id", cid); }
        data.name = name; data.sort = i + 1; data.options = options;
        r.set("data", data);
        app.save(r);
        keep[r.id] = true;
      });
      app.findAllRecords("catalog").forEach((r) => { if (!keep[r.id]) app.delete(r); });
    } else if (listId === "statuses") {
      const out = {};
      (Array.isArray(items) ? items : []).forEach((o) => {
        if (!o || !SHOP_STATUSES[o.key]) return;
        const n = cleanText(o.name, 40);
        if (n && n !== SHOP_STATUSES[o.key]) out[o.key] = n;
      });
      saveLabels(app, id, "statuses", out);
    } else if (listId === "business") {
      const v = body.value || {};
      const d = getDoc(app, "config", "main").data || {};
      d.businessName = cleanText(v.businessName) || d.businessName || "Rough Cut Dezigns";
      d.taxName = cleanText(v.taxName, 20);
      d.taxRate = Math.max(0, Math.min(100, Number(v.taxRate) || 0));
      saveDoc(app, "config", "main", d);
    } else throw new BadRequestError("Unknown list.");
  } else throw new BadRequestError("Unknown app.");
  return listsGet(app, id).filter((l) => l.id === listId)[0];
}

function listsRoute(e, id) {
  if (!keyOk(e)) return e.json(403, { message: "Only the App Hub can do this." });
  if (e.request.method === "GET") return e.json(200, { lists: listsGet(e.app, id) });
  const body = e.requestInfo().body || {};
  return e.json(200, { list: listsPut(e.app, id, e.request.pathValue("list"), body) });
}

module.exports = { themeRoute, lookJsRoute, logoRoute, iconRoute, manifestRoute, listsRoute, hubDir, readJSON, writeJSON };
