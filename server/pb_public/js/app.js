// Lucide icons (ISC licence), inlined so the app works offline.
const ICONS={"calendar": "<path d=\"M8 2v4\" /><path d=\"M16 2v4\" /><rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\" /><path d=\"M3 10h18\" />", "calendar-days": "<path d=\"M8 2v4\" /><path d=\"M16 2v4\" /><rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\" /><path d=\"M3 10h18\" /><path d=\"M8 14h.01\" /><path d=\"M12 14h.01\" /><path d=\"M16 14h.01\" /><path d=\"M8 18h.01\" /><path d=\"M12 18h.01\" /><path d=\"M16 18h.01\" />", "camera": "<path d=\"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z\" /><circle cx=\"12\" cy=\"13\" r=\"3\" />", "chart-column": "<path d=\"M3 3v16a2 2 0 0 0 2 2h16\" /><path d=\"M18 17V9\" /><path d=\"M13 17V5\" /><path d=\"M8 17v-3\" />", "check": "<path d=\"M20 6 9 17l-5-5\" />", "chevron-down": "<path d=\"m6 9 6 6 6-6\" />", "chevron-left": "<path d=\"m15 18-6-6 6-6\" />", "chevron-right": "<path d=\"m9 18 6-6-6-6\" />", "circle-alert": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><line x1=\"12\" x2=\"12\" y1=\"8\" y2=\"12\" /><line x1=\"12\" x2=\"12.01\" y1=\"16\" y2=\"16\" />", "cloud": "<path d=\"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z\" />", "cloud-drizzle": "<path d=\"M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242\" /><path d=\"M8 19v1\" /><path d=\"M8 14v1\" /><path d=\"M16 19v1\" /><path d=\"M16 14v1\" /><path d=\"M12 21v1\" /><path d=\"M12 16v1\" />", "cloud-fog": "<path d=\"M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242\" /><path d=\"M16 17H7\" /><path d=\"M17 21H9\" />", "cloud-lightning": "<path d=\"M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973\" /><path d=\"m13 12-3 5h4l-3 5\" />", "cloud-off": "<path d=\"m2 2 20 20\" /><path d=\"M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193\" /><path d=\"M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07\" />", "cloud-rain": "<path d=\"M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242\" /><path d=\"M16 14v6\" /><path d=\"M8 14v6\" /><path d=\"M12 16v6\" />", "cloud-snow": "<path d=\"M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242\" /><path d=\"M8 15h.01\" /><path d=\"M8 19h.01\" /><path d=\"M12 17h.01\" /><path d=\"M12 21h.01\" /><path d=\"M16 15h.01\" /><path d=\"M16 19h.01\" />", "cloud-sun": "<path d=\"M12 2v2\" /><path d=\"m4.93 4.93 1.41 1.41\" /><path d=\"M20 12h2\" /><path d=\"m19.07 4.93-1.41 1.41\" /><path d=\"M15.947 12.65a4 4 0 0 0-5.925-4.128\" /><path d=\"M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z\" />", "crop": "<path d=\"M6 2v14a2 2 0 0 0 2 2h14\" /><path d=\"M18 22V8a2 2 0 0 0-2-2H2\" />", "delete": "<path d=\"M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z\" /><path d=\"m12 9 6 6\" /><path d=\"m18 9-6 6\" />", "dot": "<circle cx=\"12.1\" cy=\"12.1\" r=\"1\" />", "ellipsis": "<circle cx=\"12\" cy=\"12\" r=\"1\" /><circle cx=\"19\" cy=\"12\" r=\"1\" /><circle cx=\"5\" cy=\"12\" r=\"1\" />", "file-spreadsheet": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\" /><path d=\"M14 2v4a2 2 0 0 0 2 2h4\" /><path d=\"M8 13h2\" /><path d=\"M14 13h2\" /><path d=\"M8 17h2\" /><path d=\"M14 17h2\" />", "flask-conical": "<path d=\"M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2\" /><path d=\"M8.5 2h7\" /><path d=\"M7 16h10\" />", "focus": "<circle cx=\"12\" cy=\"12\" r=\"3\" /><path d=\"M3 7V5a2 2 0 0 1 2-2h2\" /><path d=\"M17 3h2a2 2 0 0 1 2 2v2\" /><path d=\"M21 17v2a2 2 0 0 1-2 2h-2\" /><path d=\"M7 21H5a2 2 0 0 1-2-2v-2\" />", "history": "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\" /><path d=\"M3 3v5h5\" /><path d=\"M12 7v5l4 2\" />", "house": "<path d=\"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8\" /><path d=\"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\" />", "image": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" ry=\"2\" /><circle cx=\"9\" cy=\"9\" r=\"2\" /><path d=\"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21\" />", "import": "<path d=\"M12 3v12\" /><path d=\"m8 11 4 4 4-4\" /><path d=\"M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4\" />", "info": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><path d=\"M12 16v-4\" /><path d=\"M12 8h.01\" />", "leaf": "<path d=\"M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z\" /><path d=\"M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12\" />", "map-pin": "<path d=\"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0\" /><circle cx=\"12\" cy=\"10\" r=\"3\" />", "message-square-plus": "<path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\" /><path d=\"M12 7v6\" /><path d=\"M9 10h6\" />", "notebook-pen": "<path d=\"M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4\" /><path d=\"M2 6h4\" /><path d=\"M2 10h4\" /><path d=\"M2 14h4\" /><path d=\"M2 18h4\" /><path d=\"M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z\" />", "option": "<path d=\"M3 3h6l6 18h6\" /><path d=\"M14 3h7\" />", "pencil": "<path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\" /><path d=\"m15 5 4 4\" />", "phone": "<path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z\" />", "pill": "<path d=\"m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z\" /><path d=\"m8.5 8.5 7 7\" />", "plus": "<path d=\"M5 12h14\" /><path d=\"M12 5v14\" />", "shopping-basket": "<path d=\"m15 11-1 9\" /><path d=\"m19 11-4-7\" /><path d=\"M2 11h20\" /><path d=\"m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4\" /><path d=\"M4.5 15.5h15\" /><path d=\"m5 11 4-7\" /><path d=\"m9 11 1 9\" />", "shovel": "<path d=\"M2 22v-5l5-5 5 5-5 5z\" /><path d=\"M9.5 14.5 16 8\" /><path d=\"m17 2 5 5-.5.5a3.53 3.53 0 0 1-5 0s0 0 0 0a3.53 3.53 0 0 1 0-5L17 2\" />", "spray-can": "<path d=\"M3 3h.01\" /><path d=\"M7 5h.01\" /><path d=\"M11 7h.01\" /><path d=\"M3 7h.01\" /><path d=\"M7 9h.01\" /><path d=\"M3 11h.01\" /><rect width=\"4\" height=\"4\" x=\"15\" y=\"5\" /><path d=\"m19 9 2 2v10c0 .6-.4 1-1 1h-6c-.6 0-1-.4-1-1V11l2-2\" /><path d=\"m13 14 8-2\" /><path d=\"m13 19 8-2\" />", "sprout": "<path d=\"M7 20h10\" /><path d=\"M10 20c5.5-2.5.8-6.4 3-10\" /><path d=\"M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z\" /><path d=\"M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z\" />", "sun": "<circle cx=\"12\" cy=\"12\" r=\"4\" /><path d=\"M12 2v2\" /><path d=\"M12 20v2\" /><path d=\"m4.93 4.93 1.41 1.41\" /><path d=\"m17.66 17.66 1.41 1.41\" /><path d=\"M2 12h2\" /><path d=\"M20 12h2\" /><path d=\"m6.34 17.66-1.41 1.41\" /><path d=\"m19.07 4.93-1.41 1.41\" />", "tag": "<path d=\"M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z\" /><circle cx=\"7.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\" />", "thermometer": "<path d=\"M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z\" />", "trash-2": "<path d=\"M3 6h18\" /><path d=\"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6\" /><path d=\"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2\" /><line x1=\"10\" x2=\"10\" y1=\"11\" y2=\"17\" /><line x1=\"14\" x2=\"14\" y1=\"11\" y2=\"17\" />", "type": "<polyline points=\"4 7 4 4 20 4 20 7\" /><line x1=\"9\" x2=\"15\" y1=\"20\" y2=\"20\" /><line x1=\"12\" x2=\"12\" y1=\"4\" y2=\"20\" />", "upload": "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" /><polyline points=\"17 8 12 3 7 8\" /><line x1=\"12\" x2=\"12\" y1=\"3\" y2=\"15\" />", "user": "<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\" /><circle cx=\"12\" cy=\"7\" r=\"4\" />", "wheat": "<path d=\"M2 22 16 8\" /><path d=\"M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z\" /><path d=\"M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z\" /><path d=\"M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z\" /><path d=\"M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z\" /><path d=\"M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z\" /><path d=\"M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z\" /><path d=\"M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z\" />", "x": "<path d=\"M18 6 6 18\" /><path d=\"m6 6 12 12\" />", "download": "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" /><polyline points=\"7 10 12 15 17 10\" /><line x1=\"12\" x2=\"12\" y1=\"15\" y2=\"3\" />"};
/* ── Helpers ──────────────────────────────────────────────────────── */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ico = (n, cls = "icon") => `<svg class="${cls}" viewBox="0 0 24 24">${ICONS[n] || ""}</svg>`;
function paintIcons(root = document) { root.querySelectorAll("svg[data-i]").forEach(s => { s.innerHTML = ICONS[s.dataset.i] || ""; s.removeAttribute("data-i"); }); }
const pad = n => String(n).padStart(2, "0");
const isoOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (iso, n) => { const d = parse(iso); d.setDate(d.getDate() + n); return isoOf(d); };
const fmtShort = iso => parse(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
const fmtLong = iso => parse(iso).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const doyOf = iso => { const d = parse(iso); return Math.round((d - new Date(d.getFullYear(), 0, 1)) / 864e5) + 1; };
const dateFromDoy = (y, d) => isoOf(new Date(y, 0, d));
const nf = n => Math.round(n).toLocaleString("en-CA");
const NOW = new Date(), TODAY = isoOf(NOW), THIS_YEAR = NOW.getFullYear(), TODAY_MD = TODAY.slice(5);
const YEARS = [0, 1, 2].map(i => ({ y: THIS_YEAR - i, c: `--y${i}` }));
const byDate = (a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || ""));
let toastTimer;
function toast(msg) { $("#toastText").textContent = msg; $("#toast").classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 2600); }

/* ── Reference data ───────────────────────────────────────────────── */
// "what" names the saved pick-list behind the log form's first field. Saved items live in the shared lists.
const TYPES = {
  spray:    { name: "Spray",    icon: "spray-can",     c: "var(--t-spray)",    what: "Chemical",         extra: [["Rate", "e.g. 1.9 kg/ha"], ["Re-entry", "e.g. 24 h"]] },
  planting: { name: "Planting", icon: "sprout",        c: "var(--t-planting)", what: "Crop and variety", extra: [["Amount", "e.g. 4 beds"], ["Seed lot", "optional"]] },
  nutrient: { name: "Nutrient", icon: "flask-conical", c: "var(--t-nutrient)", what: "Fertilizer",       extra: [["Rate", "e.g. 30 lb N/ac"], ["Method", "e.g. Fertigation"]] },
  harvest:  { name: "Harvest",  icon: "wheat",         c: "var(--t-harvest)",  what: "Crop",             extra: [["Amount", "e.g. 40 bins"], ["Destination", "optional"]] },
  garden:   { name: "Garden",   icon: "shovel",        c: "var(--t-garden)",   what: "Task",             extra: [] },
};
const KINDS = { ...TYPES, order: { name: "Order pickup", icon: "shopping-basket", c: "var(--t-pickup)" } };
const DEFAULT_CROPS = ["Strawberries", "Cucumbers", "Garlic", "Garden", "Fall Produce"];

/* ── Shared state (filled live from the database) ─────────────────── */
const S = { events: [], orders: [], notes: [], lists: { crops: [...DEFAULT_CROPS], fields: [], saved: {} }, weather: {}, forecast: null };
let db = null, userNs = null, me = null, sampleFn = null, commentsNs = null, canWrite = null;

function setStatus(kind, html) {
  $("#statusDot").className = "status-dot" + (kind === "live" ? " live" : "");
  $("#betaBar").classList.toggle("warn", kind === "offline" || kind === "readonly");
  $("#statusText").innerHTML = html;
}
function applyWriteState() { document.body.classList.toggle("readonly", canWrite === false); if (canWrite === false) setStatus("readonly", "<b>View only.</b> You can look around, but your access doesn't allow changes. Ask the farm owner for edit access."); }

async function guard(fn, okMsg) {
  if (!db) { toast("Sign in to save changes."); return false; }
  try { await fn(); if (okMsg) toast(okMsg); return true; }
  catch (e) {
    console.warn(e);
    if (e?.code === "invalid_argument" && canWrite !== true) { canWrite = false; applyWriteState(); toast("Your access doesn't allow changes."); }
    
    else toast("Couldn't save. Check your connection and try again.");
    return false;
  }
}
const saveLists = () => guard(() => db.doc("lists/main").set({ crops: S.lists.crops, fields: S.lists.fields, saved: S.lists.saved }));

/* People: store ids only; resolve names when rendering */
const NAMES = {};
async function resolveNames(ids) {
  if (!userNs) return;
  const need = [...new Set(ids)].filter(id => id && !(id in NAMES));
  if (!need.length) return;
  need.forEach(id => NAMES[id] = "…");
  const ps = await userNs.profiles(need);
  need.forEach(id => NAMES[id] = ps[id]?.isMe ? "You" : (ps[id]?.name || "Someone"));
  renderAll();
}
const whoLabel = e => e.by ? (NAMES[e.by] || "…") : e.src === "handwritten" ? "From notes" : e.src === "spreadsheet" ? "Imported" : "";

/* ── Log form ─────────────────────────────────────────────────────── */
let selType = "spray";
const savedFor = t => S.lists.saved[t] || [];
function renderTypes() {
  $("#typePicker").innerHTML = Object.entries(TYPES).map(([k, t]) =>
    `<button type="button" class="type-opt" style="--c:${t.c}" data-k="${k}" aria-pressed="${k === selType}">${ico(t.icon)}${t.name}</button>`).join("");
  const t = TYPES[selType], ex = $("#extra");
  $("#whatLabel").textContent = t.what;
  $("#f-title").placeholder = "Choose from your list or type a new one";
  ex.hidden = !t.extra.length;
  ex.innerHTML = `<div class="extra-title">${t.name} details</div>` + t.extra.map(([l, ph], i) =>
    `<div class="field"><label for="x-${i}">${l}</label><input id="x-${i}" data-x="${esc(l)}" placeholder="${esc(ph)}" autocomplete="off"></div>`).join("");
}
$("#typePicker").addEventListener("click", e => { const b = e.target.closest("[data-k]"); if (b && b.dataset.k !== selType) { selType = b.dataset.k; $("#f-title").value = ""; renderTypes(); } });

let comboIdx = -1;
const whatIn = $("#f-title"), whatList = $("#whatList");
const comboItems = () => { const q = whatIn.value.trim().toLowerCase(); return savedFor(selType).filter(o => o.name.toLowerCase().includes(q)); };
const comboMeta = o => TYPES[selType].extra.map(([l]) => o[l]).filter(Boolean).join(" · ");
function renderCombo() {
  const t = TYPES[selType], q = whatIn.value.trim(), items = comboItems();
  const exact = savedFor(selType).some(o => o.name.toLowerCase() === q.toLowerCase());
  const n = items.length + (q && !exact ? 1 : 0);
  if (comboIdx >= n) comboIdx = n - 1;
  whatList.innerHTML = (items.length ? items.map((o, i) => `<div class="opt${i === comboIdx ? " active" : ""}" role="option" aria-selected="${i === comboIdx}">
      <button type="button" class="opt-pick" data-pick="${esc(o.name)}"><b>${esc(o.name)}</b>${comboMeta(o) ? `<small>${esc(comboMeta(o))}</small>` : ""}</button>
      <button type="button" class="opt-del" data-del="${esc(o.name)}" aria-label="Remove ${esc(o.name)} from the list">${ico("x", "icon sm")}</button></div>`).join("")
    : `<div class="opt-empty">${q ? `No saved ${t.what.toLowerCase()} matches.` : `Your ${t.what.toLowerCase()} list is empty. Type a name, then save it to the list.`}</div>`)
    + (q && !exact ? `<button type="button" class="opt-add${comboIdx === items.length ? " active" : ""}" data-add="1">${ico("plus", "icon sm")}Save "${esc(q)}" to the list</button>` : "");
}
function openCombo() { whatList.hidden = false; whatIn.setAttribute("aria-expanded", "true"); renderCombo(); }
function closeCombo() { whatList.hidden = true; whatIn.setAttribute("aria-expanded", "false"); comboIdx = -1; }
function pickWhat(name) {
  const o = savedFor(selType).find(x => x.name === name); whatIn.value = name;
  document.querySelectorAll("#extra [data-x]").forEach(i => { if (o && o[i.dataset.x]) i.value = o[i.dataset.x]; });
  closeCombo();
}
async function addWhat() {
  const t = TYPES[selType], name = whatIn.value.trim(); if (!name) return;
  const o = { name }; document.querySelectorAll("#extra [data-x]").forEach(i => { if (i.value.trim()) o[i.dataset.x] = i.value.trim(); });
  S.lists.saved = { ...S.lists.saved, [selType]: [...savedFor(selType), o] };
  closeCombo();
  if (await saveLists()) toast(`Saved to your ${t.what.toLowerCase()} list`);
}
whatIn.addEventListener("focus", openCombo);
whatIn.addEventListener("input", () => { comboIdx = -1; openCombo(); });
whatIn.addEventListener("keydown", e => {
  if (e.key === "Escape") return closeCombo();
  if (whatList.hidden && e.key === "ArrowDown") return openCombo();
  const items = comboItems(), n = whatList.querySelectorAll(".opt, .opt-add").length;
  if (!n) return;
  if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); comboIdx = (comboIdx + (e.key === "ArrowDown" ? 1 : -1) + n) % n; renderCombo(); }
  if (e.key === "Enter" && comboIdx >= 0) { e.preventDefault(); comboIdx < items.length ? pickWhat(items[comboIdx].name) : addWhat(); }
});
$("#whatToggle").addEventListener("click", () => { if (whatList.hidden) { whatIn.focus(); openCombo(); } else closeCombo(); });
whatList.addEventListener("mousedown", e => e.preventDefault());
whatList.addEventListener("click", async e => {
  const pick = e.target.closest("[data-pick]"), del = e.target.closest("[data-del]"), add = e.target.closest("[data-add]");
  if (pick) pickWhat(pick.dataset.pick);
  else if (add) addWhat();
  else if (del) {
    S.lists.saved = { ...S.lists.saved, [selType]: savedFor(selType).filter(o => o.name !== del.dataset.del) };
    renderCombo();
    if (await saveLists()) toast(`Removed ${del.dataset.del}`);
  }
});
document.addEventListener("click", e => { if (!e.target.closest("#whatCombo")) closeCombo(); });

/* Editable chip lists (fields and crops) */
const CHIPS = {
  fields: { key: "fields", sel: new Set(), el: "#fieldPicker", noun: "field", editing: false },
  crops:  { key: "crops",  sel: new Set(), el: "#cropPicker",  noun: "crop",  editing: false },
};
function renderChips(k) {
  const c = CHIPS[k], box = $(c.el), list = S.lists[c.key] || [];
  const typed = $("#add-" + k)?.value || "", hadFocus = document.activeElement?.id === "add-" + k;
  box.classList.toggle("editing", c.editing);
  document.querySelector(`[data-edit="${k}"]`).innerHTML = c.editing ? `${ico("check", "icon sm")}Done` : `${ico("pencil", "icon sm")}Edit list`;
  box.innerHTML = list.map(v => c.editing
      ? `<button type="button" class="chip" data-rm="${esc(v)}" aria-label="Remove ${esc(v)}">${esc(v)}<span class="x">${ico("x", "icon sm")}</span></button>`
      : `<button type="button" class="chip" data-v="${esc(v)}" aria-pressed="${c.sel.has(v)}">${esc(v)}</button>`).join("")
    + (c.editing ? `<span class="chip-add"><input id="add-${k}" placeholder="New ${c.noun}" autocomplete="off" aria-label="New ${c.noun}"><button type="button" data-addchip="1">Add</button></span>`
      : (!list.length ? `<span class="meta">No ${c.noun}s yet. Tap "Edit list" to add some.</span>` : ""));
  if (c.editing) { const inp = $("#add-" + k); inp.value = typed; if (hadFocus) inp.focus(); }
}
async function addChip(k) {
  const c = CHIPS[k], inp = $("#add-" + k), v = inp.value.trim();
  if (!v || (S.lists[c.key] || []).includes(v)) { inp.focus(); return; }
  S.lists[c.key] = [...(S.lists[c.key] || []), v]; c.sel.add(v); inp.value = "";
  renderChips(k); $("#add-" + k).focus();
  if (await saveLists()) toast(`Added ${v}`);
}
Object.keys(CHIPS).forEach(k => {
  const c = CHIPS[k], box = $(c.el);
  box.addEventListener("click", async e => {
    const v = e.target.closest("[data-v]"), rm = e.target.closest("[data-rm]"), add = e.target.closest("[data-addchip]");
    if (v) { c.sel.has(v.dataset.v) ? c.sel.delete(v.dataset.v) : c.sel.add(v.dataset.v); renderChips(k); }
    else if (rm) { S.lists[c.key] = (S.lists[c.key] || []).filter(x => x !== rm.dataset.rm); c.sel.delete(rm.dataset.rm); renderChips(k); saveLists(); }
    else if (add) addChip(k);
  });
  box.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.id === "add-" + k) { e.preventDefault(); addChip(k); } });
  document.querySelector(`[data-edit="${k}"]`).addEventListener("click", () => { c.editing = !c.editing; renderChips(k); if (c.editing) $("#add-" + k).focus(); });
});

$("#f-date").value = TODAY;
$("#logForm").addEventListener("submit", async e => {
  e.preventDefault();
  const date = $("#f-date").value || TODAY, what = whatIn.value.trim(), details = {};
  document.querySelectorAll("#extra [data-x]").forEach(i => { if (i.value.trim()) details[i.dataset.x] = i.value.trim(); });
  const doc = { date, type: selType, what: what || TYPES[selType].name, details, fields: [...CHIPS.fields.sel], crops: [...CHIPS.crops.sel],
    desc: $("#f-desc").value.trim(), status: date > TODAY ? "planned" : "done", by: me?.id || null, createdAt: new Date().toISOString(), src: "app" };
  $("#logSubmit").disabled = true;
  const ok = await guard(() => db.collection("events").add(doc), date > TODAY ? `Planned for ${fmtShort(date)}` : "Event logged");
  $("#logSubmit").disabled = false;
  if (!ok) return;
  whatIn.value = ""; $("#f-desc").value = ""; $("#f-date").value = TODAY;
  document.querySelectorAll("#extra input").forEach(i => i.value = "");
  CHIPS.fields.sel.clear(); renderChips("fields");
  document.body.classList.remove("sheet-open");
});
$("#openSheet").addEventListener("click", () => document.body.classList.add("sheet-open"));
const closeSheet = () => document.body.classList.remove("sheet-open");
$("#closeSheet").addEventListener("click", closeSheet);
$("#scrim").addEventListener("click", closeSheet);

/* ── Shared list pieces ───────────────────────────────────────────── */
const typeDot = (k, cls = "icon sm") => { const t = KINDS[k] || TYPES.garden; return `<span class="type-dot" style="--c:${t.c}" title="${t.name}">${ico(t.icon, cls)}</span>`; };
const tags = crops => (crops || []).map(c => `<span class="tag">${esc(c)}</span>`).join("");
const detailLine = e => [...Object.values(e.details || {}), ...(e.fields || [])].filter(Boolean).join(" · ");
const evTitle = e => e.what || (TYPES[e.type]?.name ?? "Event");

/* ── Weather (from the shared weather documents when present) ─────── */
const MONTHS = [[4, "Apr"], [5, "May"], [6, "Jun"], [7, "Jul"], [8, "Aug"], [9, "Sep"], [10, "Oct"]];
function wxDay(y, md) { return S.weather[y]?.days?.[md] || null; } // [mean, min, max, rain in]
function hasWeather(y) { return !!S.weather[y]?.days && Object.keys(S.weather[y].days).length > 0; }
function gddSeries(y) { // Apr 1 … Oct 31, cumulative; null past the last day with data
  const out = []; let g = 0, any = false;
  for (let d = doyOf(`${y}-04-01`); d <= doyOf(`${y}-10-31`); d++) {
    const iso = dateFromDoy(y, d), w = wxDay(y, iso.slice(5));
    if (!w) { out.push(null); continue; }
    any = true; g += Math.max(0, w[0] - 10); out.push(g);
  }
  // trim trailing nulls
  while (out.length && out[out.length - 1] == null) out.pop();
  return any ? out : null;
}
function monthlyMeans(y) { return MONTHS.map(([m]) => { let t = 0, n = 0; for (let d = 1; d <= 31; d++) { const w = wxDay(y, `${pad(m)}-${pad(d)}`); if (w) { t += w[0]; n++; } } return n ? t / n : null; }); }
function weekWeather(y) { let t = 0, n = 0, r = 0; for (let k = -3; k <= 3; k++) { const md = addDays(`${y}-${TODAY_MD}`, k).slice(5), w = wxDay(y, md); if (w) { t += w[0]; r += w[3] || 0; n++; } } return n ? { avg: t / n, rain: r } : null; }

/* ── Dashboard units ──────────────────────────────────────────────── */
function renderForecast() {
  const f = (S.forecast?.days || []).filter(d => d.date >= TODAY);
  if (!f?.length) { $("#forecast").innerHTML = `<div class="empty-box">${ico("cloud-off", "icon sm")}<span>The forecast isn't connected yet. It will appear here once weather for Corinth is set up.</span></div>`; return; }
  $("#forecast").innerHTML = `<div class="forecast">` + f.slice(0, 7).map((d, n) =>
    `<div class="fc${n === 0 ? " today" : ""}${d.rain >= 0.1 ? " wet" : ""}"><span class="d">${n === 0 ? "Today" : parse(d.date).toLocaleDateString("en-CA", { weekday: "short" })}</span>${ico(d.icon || "cloud")}<span class="hi">${Math.round(d.hi)}°</span><span class="lo">${Math.round(d.lo)}°</span><span class="${d.rain > 0 ? "rain" : "lo"}">${d.rain > 0 ? d.rain.toFixed(2) + " in" : "–"}</span></div>`).join("") + `</div>`;
}
const rainOn = iso => (S.forecast?.days || []).find(d => d.date === iso)?.rain || 0;
function renderUpcoming() {
  const start = addDays(TODAY, -7), end = addDays(TODAY, 14);
  const list = S.events.filter(e => e.status === "planned" && e.date >= start && e.date <= end).sort(byDate);
  $("#upcoming").innerHTML = list.length ? list.map(e => {
    const [mon, day] = fmtShort(e.date).split(" ");
    const late = e.date < TODAY ? `<span class="pill late">${ico("circle-alert", "icon sm")}Overdue</span>` : "";
    const wet = e.type === "spray" && (rainOn(e.date) >= 0.1 || rainOn(addDays(e.date, 1)) >= 0.1) ? `<span class="pill warn">${ico("cloud-rain", "icon sm")}Rain forecast</span>` : "";
    return `<div class="row"><div class="date-col"><b>${day}</b><span>${mon}</span></div>${typeDot(e.type)}
      <div class="row-main"><span class="row-title">${esc(evTitle(e))}</span><div class="row-tags">${tags(e.crops)}${late}${wet}</div>${detailLine(e) ? `<span class="meta">${esc(detailLine(e))}</span>` : ""}</div>
      <button class="check write-only" type="button" aria-pressed="false" aria-label="Mark done" data-done="${e.id}">${ico("check", "icon sm")}</button></div>`;
  }).join("") : `<p class="empty">Nothing planned for the next two weeks. Log an event with a future date to plan it.</p>`;
}
$("#upcoming").addEventListener("click", e => { const b = e.target.closest("[data-done]"); if (b) guard(() => db.doc("events/" + b.dataset.done).update({ status: "done", doneAt: new Date().toISOString(), doneBy: me?.id || null }), "Marked done"); });

function renderPast() {
  const [from, to] = [addDays(TODAY, -3), addDays(TODAY, 3)];
  $("#pastSub").textContent = `${fmtShort(from)} to ${fmtShort(to)} in earlier seasons, with that week's weather.`;
  $("#past").innerHTML = YEARS.slice(1).map(Y => {
    const lo = addDays(`${Y.y}-${TODAY_MD}`, -3), hi = addDays(`${Y.y}-${TODAY_MD}`, 3);
    const evs = S.events.filter(e => e.date >= lo && e.date <= hi).sort(byDate);
    const w = weekWeather(Y.y);
    return `<div class="year"><div class="year-head"><h3>${Y.y}</h3><span class="meta">${evs.length} event${evs.length === 1 ? "" : "s"}</span></div>
      ${w ? `<div class="wx-strip"><span>${ico("thermometer", "icon sm")}${w.avg.toFixed(1)} °C avg</span><span>${ico("cloud-rain", "icon sm")}${w.rain.toFixed(2)} in rain</span></div>` : ""}
      ${evs.length ? evs.slice(0, 6).map(e => `<div class="mini">${typeDot(e.type)}<span>${esc(evTitle(e))}${e.crops?.length ? ` <span class="meta">· ${esc(e.crops.join(", "))}</span>` : ""}</span></div>`).join("") : `<p class="meta">Nothing logged for this week in ${Y.y} yet. Importing old records fills this in.</p>`}</div>`;
  }).join("");
}

function renderRecent() {
  const list = [...S.events].filter(e => e.status !== "planned").sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 6);
  resolveNames(list.map(e => e.by));
  $("#recent").innerHTML = list.length ? list.map(e => `<div class="row">${typeDot(e.type)}<div class="row-main"><span class="row-title">${esc(evTitle(e))}</span><div class="row-tags">${tags(e.crops)}</div></div>
     <div style="text-align:right; flex:none"><div class="meta">${fmtShort(e.date)}</div><div class="meta" style="display:flex;gap:4px;align-items:center;justify-content:flex-end">${ico("user", "icon sm")}${esc(whoLabel(e))}</div></div></div>`).join("")
    : `<p class="empty">No entries yet. Use "Log an event" to add the first one.</p>`;
}

/* Notes */
const NOW_MONTH = TODAY.slice(0, 7);
const monthName = ym => { const [y, m] = ym.split("-").map(Number); return new Date(y, m - 1, 1).toLocaleDateString("en-CA", { month: "short", year: "numeric" }); };
const noteHtml = (n, withAction) => {
  const due = !n.done && n.due && n.due <= NOW_MONTH;
  const pill = n.done ? `<span class="pill ok">${ico("check", "icon sm")}Resolved</span>`
    : due ? `<span class="pill warn">${ico("calendar-days", "icon sm")}Due now</span>` : n.due ? `<span class="pill" style="color:var(--muted)">${monthName(n.due)}</span>` : "";
  const act = withAction ? `<button class="btn ghost write-only" type="button" data-n="${n.id}">${ico(n.done ? "history" : "check", "icon sm")}${n.done ? "Reopen" : "Mark resolved"}</button>` : "";
  return `<div class="note"><div class="row-tags"><span class="tag">${esc(n.crop || "General")}</span>${pill}</div><p>${esc(n.text)}</p>${act}</div>`;
};
let noteFilter = "open";
function renderNotes() {
  const byDue = (a, b) => (a.due || "9999").localeCompare(b.due || "9999");
  const open = S.notes.filter(n => !n.done).sort(byDue);
  $("#notes").innerHTML = open.length ? open.slice(0, 3).map(n => noteHtml(n, false)).join("") : `<p class="empty">No notes yet. Add lessons and changes for next season under Notes.</p>`;
  const list = S.notes.filter(n => noteFilter === "done" ? n.done : !n.done).sort(byDue);
  $("#nList").innerHTML = list.length ? list.map(n => noteHtml(n, true)).join("") : `<p class="empty">No ${noteFilter === "done" ? "resolved" : "open"} notes.</p>`;
}
$("#n-due").value = `${THIS_YEAR + 1}-03`;
$("#noteForm").addEventListener("submit", async e => {
  e.preventDefault();
  const text = $("#n-text").value.trim();
  if (!text) { $("#n-text").focus(); toast("Write the note first"); return; }
  if (await guard(() => db.collection("notes").add({ crop: $("#n-crop").value, due: $("#n-due").value || "", text, done: false, by: me?.id || null, createdAt: new Date().toISOString() }), "Note saved")) {
    $("#n-text").value = ""; noteFilter = "open";
    $("#nFilter").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x.dataset.f === "open"));
  }
});
$("#nList").addEventListener("click", e => { const b = e.target.closest("[data-n]"); if (!b) return; const n = S.notes.find(x => x.id === b.dataset.n); if (n) guard(() => db.doc("notes/" + n.id).update({ done: !n.done }), n.done ? "Note reopened" : "Note resolved"); });
$("#nFilter").addEventListener("click", e => { const b = e.target.closest("[data-f]"); if (!b) return; noteFilter = b.dataset.f; $("#nFilter").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); renderNotes(); });

/* ── Orders ───────────────────────────────────────────────────────── */
let oFilter = "upcoming";
function fmtTime(t) { if (!t) return ["", ""]; const [h, mi] = t.split(":").map(Number); return [`${h % 12 || 12}:${pad(mi)}`, h < 12 ? "AM" : "PM"]; }
const money = n => "$" + (+n || 0).toLocaleString("en-CA", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
const owes = o => Math.max(0, (+o.total || 0) - (+o.paid || 0));
const dayLabel = d => d === TODAY ? "Today" : d === addDays(TODAY, 1) ? "Tomorrow" : parse(d).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
const payPill = o => !(+o.total) ? "" : owes(o) <= 0 ? `<span class="pill ok">${ico("check", "icon sm")}Paid ${money(o.total)}</span>`
  : `<span class="pill warn">Owes ${money(owes(o))}${+o.paid > 0 ? ` of ${money(o.total)}` : ""}</span>`;
function orderRow(o) {
  const [tm, ap] = fmtTime(o.time), done = o.status === "done";
  return `<div class="order${done ? " done" : ""}"><div class="date-col"><b style="font-size:15px">${tm || "–"}</b><span>${ap}</span></div>
    <div class="row-main"><span class="row-title">${esc(o.name)}</span>
      ${o.phone ? `<span class="meta" style="display:flex;gap:4px;align-items:center">${ico("phone", "icon sm")}${esc(o.phone)}</span>` : ""}
      <p class="o-items">${esc(o.items)}</p>
      <div class="row-tags">${payPill(o)}${o.status === "new" ? `<span class="pill new">New from ${esc(o.source || "order form")}</span>` : ""}${done ? `<span class="pill" style="color:var(--muted)">Picked up</span>` : ""}</div>
      <div class="o-actions write-only">
        ${o.status === "new" ? `<button class="btn sm primary" type="button" data-o="${o.id}" data-act="confirm">Confirm order</button>` : ""}
        ${owes(o) > 0 ? `<button class="btn sm outline" type="button" data-o="${o.id}" data-act="paid">Mark paid</button>` : ""}
        <button class="btn sm outline" type="button" data-o="${o.id}" data-act="pickup">${done ? "Undo pickup" : `${ico("check", "icon sm")}Picked up`}</button>
        <button class="del-btn" type="button" data-o="${o.id}" data-act="delete">${ico("trash-2", "icon sm")}Delete</button>
      </div></div></div>`;
}
function renderOrders() {
  const open = S.orders.filter(o => o.status !== "done");
  const week = open.filter(o => o.date >= TODAY && o.date <= addDays(TODAY, 6));
  $("#oStats").innerHTML = `<div class="stat"><b>${open.filter(o => o.date === TODAY).length}</b><span>Pickups today</span></div>
    <div class="stat"><b>${week.length}</b><span>Next 7 days</span></div>
    <div class="stat"><b>${money(S.orders.reduce((t, o) => t + owes(o), 0))}</b><span>Still owed</span></div>`;
  const list = (oFilter === "upcoming" ? open : oFilter === "unpaid" ? S.orders.filter(o => owes(o) > 0) : S.orders.filter(o => o.status === "done")).sort(byDate);
  if (oFilter === "done") list.reverse();
  let h = "", last = "";
  list.forEach(o => { if (o.date !== last) { h += `<div class="day-head">${dayLabel(o.date)}</div>`; last = o.date; } h += orderRow(o); });
  $("#oList").innerHTML = h || `<p class="empty">${oFilter === "upcoming" ? "No upcoming orders. Add one with New order." : "No orders here."}</p>`;
  $("#ordersDash").innerHTML = week.sort(byDate).slice(0, 5).map(o => {
    const [mon, day] = fmtShort(o.date).split(" ");
    return `<div class="row"><div class="date-col"><b>${day}</b><span>${mon}</span></div>
      <div class="row-main"><span class="row-title">${esc(o.name)}</span><span class="meta">${fmtTime(o.time).join(" ")}${o.time ? " · " : ""}${esc(o.items)}</span>
      <div class="row-tags">${payPill(o)}${o.status === "new" ? `<span class="pill new">New</span>` : ""}</div></div></div>`;
  }).join("") || `<p class="empty">No pickups in the next 7 days.</p>`;
  $("#customers").innerHTML = [...new Set(S.orders.map(o => o.name))].map(n => `<option value="${esc(n)}"></option>`).join("");
}
const armed = new Map();
function armOrConfirm(btn, key, run) { // two taps to delete
  if (armed.get(key)) { armed.delete(key); run(); return; }
  armed.set(key, true); btn.classList.add("armed"); btn.lastChild.textContent = "Tap again to delete";
  setTimeout(() => { armed.delete(key); if (btn.isConnected) { btn.classList.remove("armed"); btn.lastChild.textContent = "Delete"; } }, 4000);
}
$("#oList").addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const o = S.orders.find(x => x.id === b.dataset.o); if (!o) return;
  const ref = db?.doc("orders/" + o.id), act = b.dataset.act;
  if (act === "confirm") guard(() => ref.update({ status: "" }), `Confirmed ${o.name}'s order`);
  if (act === "paid") guard(() => ref.update({ paid: +o.total || 0 }), `${o.name} marked paid`);
  if (act === "pickup") guard(() => ref.update({ status: o.status === "done" ? "" : "done" }), o.status === "done" ? "Pickup undone" : `${o.name} picked up`);
  if (act === "delete") armOrConfirm(b, "o" + o.id, () => guard(() => ref.delete(), "Order deleted"));
});
$("#oFilter").addEventListener("click", e => { const b = e.target.closest("[data-f]"); if (!b) return; oFilter = b.dataset.f; $("#oFilter").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); renderOrders(); });
$("#o-date").value = addDays(TODAY, 1);
$("#o-name").addEventListener("change", () => { const c = S.orders.find(o => o.name === $("#o-name").value.trim()); if (c && !$("#o-phone").value) $("#o-phone").value = c.phone || ""; });
$("#orderForm").addEventListener("submit", async e => {
  e.preventDefault();
  const name = $("#o-name").value.trim(), items = $("#o-items").value.trim();
  if (!name) { $("#o-name").focus(); toast("Add the customer's name"); return; }
  if (!items) { $("#o-items").focus(); toast("Add what they ordered"); return; }
  const doc = { name, phone: $("#o-phone").value.trim(), items, date: $("#o-date").value || TODAY, time: $("#o-time").value || "",
    total: +$("#o-total").value || 0, paid: +$("#o-paid").value || 0, status: "", source: "manual", by: me?.id || null, createdAt: new Date().toISOString() };
  if (await guard(() => db.collection("orders").add(doc), "Order saved")) {
    ["#o-name", "#o-phone", "#o-items", "#o-total", "#o-paid"].forEach(k => $(k).value = "");
    oFilter = "upcoming"; $("#oFilter").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x.dataset.f === "upcoming"));
  }
});

/* ── This season vs past years ────────────────────────────────────── */
let cmpCrop = null;
const cropsForCompare = () => S.lists.crops.length ? S.lists.crops : DEFAULT_CROPS;
function renderCmpCrops() {
  const list = cropsForCompare(); if (!list.includes(cmpCrop)) cmpCrop = list[0];
  $("#cmpCrop").innerHTML = list.map(c => `<button type="button" data-c="${esc(c)}" aria-pressed="${c === cmpCrop}">${esc(c)}</button>`).join("");
}
$("#cmpCrop").addEventListener("click", e => { const b = e.target.closest("[data-c]"); if (!b) return; cmpCrop = b.dataset.c; renderCmpCrops(); drawCompare(); });
$("#legend").innerHTML = YEARS.map(Y => `<span style="--c:var(${Y.c})"><i></i>${Y.y}</span>`).join("");
const emptyBox = (msg, icon = "info") => `<div class="empty-box">${ico(icon, "icon sm")}<span>${msg}</span></div>`;
const cropEvents = (crop, y) => S.events.filter(e => e.date.startsWith(y + "-") && (e.crops || []).includes(crop)).sort(byDate);
function keyDates(crop, y) {
  const evs = cropEvents(crop, y), k = [];
  const plant = evs.filter(e => e.type === "planting"), harv = evs.filter(e => e.type === "harvest");
  if (plant.length) k.push(["First planting", plant[0]]);
  if (harv.length) k.push(["First harvest", harv[0]]);
  if (harv.length > 1) k.push(["Last harvest", harv[harv.length - 1]]);
  return k;
}

function drawHarvest() {
  const units = {}, rows = [];
  S.events.filter(e => e.type === "harvest" && e.status !== "planned" && (e.crops || []).includes(cmpCrop)).forEach(e => {
    const m = String(e.details?.Amount ?? "").match(/([\d.,]+)\s*([A-Za-z]+)?/); if (!m) return;
    const n = parseFloat(m[1].replace(/,/g, "")); if (!isFinite(n)) return;
    const u = (m[2] || "units").toLowerCase(); units[u] = (units[u] || 0) + 1; rows.push({ y: +e.date.slice(0, 4), md: e.date.slice(5), n, u });
  });
  const unit = Object.entries(units).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!unit) { $("#hvNote").textContent = ""; $("#hv").innerHTML = emptyBox(`No ${esc(cmpCrop)} harvests with an amount yet. Log a Harvest with an amount like "40 bins" and tag the crop.`); return; }
  const tot = {}; YEARS.forEach(Y => { const r = rows.filter(x => x.y === Y.y && x.u === unit); if (r.length) tot[Y.y] = [r.filter(x => x.md <= TODAY_MD).reduce((t, x) => t + x.n, 0), r.reduce((t, x) => t + x.n, 0)]; });
  const max = Math.max(1, ...Object.values(tot).map(([a, b]) => Math.max(a, b)));
  $("#hv").innerHTML = YEARS.map(Y => {
    const v = tot[Y.y]; if (!v) return `<div class="hv-row"><span class="hv-y">${Y.y}</span><span class="meta">Nothing logged</span><span></span></div>`;
    const [to, full] = v, more = Y.y !== THIS_YEAR && full > to;
    return `<div class="hv-row" style="--c:var(${Y.c})"><span class="hv-y">${Y.y}</span>
      <div class="hv-track">${more ? `<div class="hv-full" style="width:${full / max * 100}%"></div>` : ""}<div class="hv-bar" style="width:${to / max * 100}%"></div></div>
      <span class="hv-v"><b>${nf(to)}</b> ${more ? `<span class="meta">of ${nf(full)}</span>` : `<span class="meta">${esc(unit)}</span>`}</span></div>`;
  }).join("");
  const a = tot[THIS_YEAR]?.[0], b = tot[THIS_YEAR - 1]?.[0];
  const cmp = a != null && b ? ` This year is ${Math.abs(Math.round((a - b) / b * 100))}% ${a >= b ? "ahead of" : "behind"} ${THIS_YEAR - 1}.` : "";
  $("#hvNote").textContent = `${unit[0].toUpperCase() + unit.slice(1)} harvested by ${fmtShort(TODAY)} each year (light bar: whole season).${cmp}`;
}

function drawTemps() {
  const wrap = $("#tchart"), have = YEARS.filter(Y => hasWeather(Y.y));
  if (!have.length) { $("#tNote").textContent = ""; wrap.innerHTML = emptyBox("No weather data yet. Temperatures for Corinth appear here once weather is connected.", "cloud-off"); return; }
  const means = Object.fromEntries(have.map(Y => [Y.y, monthlyMeans(Y.y)]));
  const W = Math.max(280, wrap.clientWidth), H = 210, m = { l: 34, r: 44, t: 12, b: 24 }, lo = -5, hi = 30, n = MONTHS.length;
  const x = i => m.l + i / (n - 1) * (W - m.l - m.r), y = v => H - m.b - (v - lo) / (hi - lo) * (H - m.t - m.b);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Monthly average temperature, April to October">`;
  for (let v = lo; v <= hi; v += 5) s += `<line class="grid-line" x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/><text class="axis-text" x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end">${v}°</text>`;
  MONTHS.forEach(([, l], i) => s += `<text class="axis-text" x="${x(i)}" y="${H - 6}" text-anchor="middle">${l}</text>`);
  [...have].reverse().forEach(Y => {
    const pts = means[Y.y].map((v, i) => v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`).filter(Boolean).join(" ");
    s += `<polyline points="${pts}" fill="none" stroke="var(${Y.c})" stroke-width="${Y.y === THIS_YEAR ? 2.5 : 2}" stroke-linejoin="round" stroke-linecap="round"/>`;
    means[Y.y].forEach((v, i) => { if (v != null) s += `<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="var(${Y.c})" stroke="var(--surface)" stroke-width="2"/>`; });
  });
  const ends = have.map(Y => { const i = means[Y.y].findLastIndex(v => v != null); return i < 0 ? null : { Y, lx: x(i), ly: y(means[Y.y][i]) }; }).filter(Boolean).sort((a, b) => a.ly - b.ly);
  for (let i = 1; i < ends.length; i++) if (ends[i].lx === ends[i - 1].lx && ends[i].ly - ends[i - 1].ly < 15) ends[i].ly = ends[i - 1].ly + 15;
  ends.forEach(e => s += `<text class="end-label" x="${e.lx + 7}" y="${e.ly + 4}">${e.Y.y}</text>`);
  s += `<line class="xhair" id="txh" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" visibility="hidden"/><rect id="thit" x="${m.l - 10}" y="0" width="${W - m.l - m.r + 20}" height="${H}" fill="transparent"/></svg><div class="tip" id="ttip" hidden></div>`;
  wrap.innerHTML = s;
  const tip = $("#ttip"), xh = $("#txh");
  const move = ev => {
    const rect = wrap.getBoundingClientRect(), px = (ev.clientX - rect.left) * W / rect.width;
    const i = Math.max(0, Math.min(n - 1, Math.round((px - m.l) / (W - m.l - m.r) * (n - 1))));
    xh.setAttribute("x1", x(i)); xh.setAttribute("x2", x(i)); xh.setAttribute("visibility", "visible");
    tip.innerHTML = `<b>${MONTHS[i][1]} average</b>` + have.map(Y => `<div class="tr" style="--c:var(${Y.c})"><i></i><span>${Y.y}</span><span>${means[Y.y][i] == null ? "–" : means[Y.y][i].toFixed(1) + " °C"}</span></div>`).join("");
    tip.hidden = false; tip.style.top = "0px";
    const tx = x(i) * rect.width / W; tip.style.left = (tx > rect.width / 2 ? tx - tip.offsetWidth - 12 : tx + 12) + "px";
  };
  $("#thit").addEventListener("pointermove", move); $("#thit").addEventListener("pointerdown", move);
  $("#thit").addEventListener("pointerleave", () => { tip.hidden = true; xh.setAttribute("visibility", "hidden"); });
  const mi = NOW.getMonth() + 1, idx = MONTHS.findIndex(([mm]) => mm === mi);
  const a = idx >= 0 ? means[THIS_YEAR]?.[idx] : null, b = idx >= 0 ? means[THIS_YEAR - 1]?.[idx] : null;
  $("#tNote").textContent = a != null && b != null ? `${MONTHS[idx][1]} so far averages ${a.toFixed(1)} °C, ${Math.abs(a - b).toFixed(1)}° ${a >= b ? "warmer" : "cooler"} than ${THIS_YEAR - 1}.` : "Monthly averages from daily weather for Corinth.";
}

function drawHeat() {
  const wrap = $("#chart"), series = Object.fromEntries(YEARS.map(Y => [Y.y, gddSeries(Y.y)])), have = YEARS.filter(Y => series[Y.y]);
  if (!have.length) { wrap.innerHTML = emptyBox("No weather data yet. Season heat for Corinth appears here once weather is connected.", "cloud-off"); $("#wxTable").innerHTML = ""; return; }
  const START = doyOf(`${THIS_YEAR}-04-01`), END = START + 213;
  const W = Math.max(300, wrap.clientWidth), narrow = W < 520, H = narrow ? 220 : 260, m = { l: 44, r: narrow ? 44 : 58, t: 10, b: 26 };
  const maxG = Math.max(250, Math.ceil(Math.max(...have.map(Y => series[Y.y][series[Y.y].length - 1] || 0)) / 250) * 250);
  const x = i => m.l + i / (END - START) * (W - m.l - m.r), y = g => H - m.b - g / maxG * (H - m.t - m.b);
  const mdIdx = (yy, iso) => doyOf(iso) - doyOf(`${yy}-04-01`);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Growing degree days since April 1 by year">`;
  for (let g = 0; g <= maxG; g += (narrow ? 500 : 250)) s += `<line class="grid-line" x1="${m.l}" x2="${W - m.r}" y1="${y(g)}" y2="${y(g)}"/><text class="axis-text" x="${m.l - 8}" y="${y(g) + 4}" text-anchor="end">${g.toLocaleString()}</text>`;
  MONTHS.forEach(([mm, l]) => { const i = mdIdx(THIS_YEAR, `${THIS_YEAR}-${pad(mm)}-01`); s += `<text class="axis-text" x="${x(i)}" y="${H - 6}" text-anchor="start">${l}</text><line class="grid-line" x1="${x(i)}" x2="${x(i)}" y1="${H - m.b}" y2="${H - m.b + 4}"/>`; });
  const ti = mdIdx(THIS_YEAR, TODAY);
  if (ti >= 0 && ti <= END - START) s += `<line class="grid-line" x1="${x(ti)}" x2="${x(ti)}" y1="${m.t}" y2="${H - m.b}" stroke-dasharray="2 4"/><text class="axis-text" x="${x(ti) - 4}" y="${m.t + 10}" text-anchor="end">Today</text>`;
  [...have].reverse().forEach(Y => {
    const pts = series[Y.y].map((g, i) => g == null ? null : `${x(i).toFixed(1)},${y(g).toFixed(1)}`).filter(Boolean).join(" ");
    s += `<polyline points="${pts}" fill="none" stroke="var(${Y.c})" stroke-width="${Y.y === THIS_YEAR ? 2.5 : 2}" stroke-linejoin="round" stroke-linecap="round"/>`;
  });
  const ends = have.map(Y => { const a = series[Y.y]; return { Y, ly: y(a[a.length - 1]), lx: x(a.length - 1) }; }).sort((a, b) => a.ly - b.ly);
  for (let i = 1; i < ends.length; i++) if (ends[i].ly - ends[i - 1].ly < 16) ends[i].ly = ends[i - 1].ly + 16;
  ends.forEach(e => s += `<text class="end-label" x="${e.lx + 6}" y="${e.ly + 4}">${e.Y.y}</text>`);
  const marks = [];
  have.forEach(Y => keyDates(cmpCrop, Y.y).forEach(([label, e]) => { const i = mdIdx(Y.y, e.date), g = series[Y.y][i]; if (g != null) { marks.push({ Y, i, label, date: e.date }); s += `<circle cx="${x(i)}" cy="${y(g)}" r="5" fill="var(--surface)" stroke="var(${Y.c})" stroke-width="2.5"/>`; } }));
  s += `<line class="xhair" id="xh" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" visibility="hidden"/><rect id="hit" x="${m.l}" y="0" width="${W - m.l - m.r}" height="${H}" fill="transparent"/></svg><div class="tip" id="tip" hidden></div>`;
  wrap.innerHTML = s;
  const hit = $("#hit"), tip = $("#tip"), xh = $("#xh");
  const move = ev => {
    const rect = wrap.getBoundingClientRect(), px = (ev.clientX - rect.left) * W / rect.width;
    const i = Math.round((px - m.l) / (W - m.l - m.r) * (END - START)); if (i < 0 || i > END - START) return;
    xh.setAttribute("x1", x(i)); xh.setAttribute("x2", x(i)); xh.setAttribute("visibility", "visible");
    const near = marks.filter(k => Math.abs(k.i - i) <= 2).map(k => `${k.Y.y}: ${k.label} (${fmtShort(k.date)})`);
    tip.innerHTML = `<b>${fmtShort(dateFromDoy(THIS_YEAR, START + i))}</b>` + have.map(Y => `<div class="tr" style="--c:var(${Y.c})"><i></i><span>${Y.y}</span><span>${series[Y.y][i] != null ? nf(series[Y.y][i]) : "–"}</span></div>`).join("") + (near.length ? `<div class="ev">${near.map(esc).join("<br>")}</div>` : "");
    tip.hidden = false; tip.style.top = "0px";
    const tx = x(i) * rect.width / W; tip.style.left = (tx > rect.width / 2 ? tx - tip.offsetWidth - 12 : tx + 12) + "px";
  };
  hit.addEventListener("pointermove", move); hit.addEventListener("pointerdown", move);
  hit.addEventListener("pointerleave", () => { tip.hidden = true; xh.setAttribute("visibility", "hidden"); });
  $("#wxTable").innerHTML = `<thead><tr><th>Season</th><th>GDD to ${fmtShort(TODAY)}</th><th>Rain since Apr 1</th></tr></thead><tbody>` + have.map(Y => {
    const a = series[Y.y], i = Math.min(a.length - 1, Math.max(0, ti)); let r = 0;
    for (let d = doyOf(`${Y.y}-04-01`); d <= doyOf(`${Y.y}-${TODAY_MD}`); d++) r += wxDay(Y.y, dateFromDoy(Y.y, d).slice(5))?.[3] || 0;
    return `<tr><td style="--c:var(${Y.c})"><i></i>${Y.y}</td><td>${a[i] != null ? nf(a[i]) : "–"}</td><td>${r.toFixed(1)} in</td></tr>`;
  }).join("") + `</tbody>`;
}

function drawTimeline() {
  const wrap = $("#tl"), any = YEARS.some(Y => cropEvents(cmpCrop, Y.y).length);
  if (!any) { wrap.innerHTML = emptyBox(`No ${esc(cmpCrop)} events yet. Tag events with the crop and they'll line up here by year.`); $("#tlLegend").innerHTML = ""; $("#keyTable").innerHTML = ""; return; }
  const W = Math.max(300, wrap.clientWidth), narrow = W < 520, m = { l: 44, r: 12, t: 20, b: 6 }, rowH = 52;
  const S0 = 60, S1 = 335, H = m.t + rowH * YEARS.length + m.b, x = d => m.l + (Math.max(S0, Math.min(S1, d)) - S0) / (S1 - S0) * (W - m.l - m.r);
  const TLM = [[3, "Mar"], ...MONTHS, [11, "Nov"]];
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(cmpCrop)} events by year">`;
  TLM.forEach(([mm, l]) => { const d = doyOf(`${THIS_YEAR}-${pad(mm)}-01`); s += `<line class="grid-line" x1="${x(d)}" x2="${x(d)}" y1="${m.t - 4}" y2="${H - m.b}"/><text class="axis-text" x="${x(d) + 4}" y="12">${narrow ? l[0] : l}</text>`; });
  s += `<line x1="${x(doyOf(TODAY))}" x2="${x(doyOf(TODAY))}" y1="${m.t - 4}" y2="${H - m.b}" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="3 3"/>`;
  YEARS.forEach((Y, r) => {
    const cy = m.t + rowH * r + rowH / 2 + 8, evs = cropEvents(cmpCrop, Y.y), keys = new Set(keyDates(cmpCrop, Y.y).map(k => k[1].id));
    s += `<text class="end-label" x="0" y="${cy + 4}">${Y.y}</text><line x1="${m.l}" x2="${W - m.r}" y1="${cy}" y2="${cy}" stroke="var(--line)" stroke-width="2"/>`;
    if (evs.length > 1) s += `<line x1="${x(doyOf(evs[0].date))}" x2="${x(doyOf(evs[evs.length - 1].date))}" y1="${cy}" y2="${cy}" stroke="var(${Y.c})" stroke-width="2.5" stroke-linecap="round"/>`;
    let lastLabel = -99;
    evs.forEach(e => {
      const cx = x(doyOf(e.date)), c = (KINDS[e.type] || TYPES.garden).c, key = keys.has(e.id), planned = e.status === "planned";
      s += `<g class="tl-mk" tabindex="0" data-tip="${esc(`${fmtLong(e.date)}: ${evTitle(e)}${planned ? " (planned)" : ""}`)}"><circle cx="${cx}" cy="${cy}" r="13" fill="transparent"/>
        <circle class="dot" cx="${cx}" cy="${cy}" r="${key ? 7 : 4.5}" fill="${planned ? "var(--surface)" : c}" stroke="${planned ? c : "var(--surface)"}" stroke-width="2"/></g>`;
      if (key && cx - lastLabel > (narrow ? 50 : 46)) { s += `<text class="tl-label" x="${cx}" y="${cy - 13}" text-anchor="middle">${fmtShort(e.date)}</text>`; lastLabel = cx; }
    });
  });
  s += `</svg><div class="tip" id="tlTip" hidden></div>`;
  wrap.innerHTML = s;
  const tip = $("#tlTip");
  const showTip = e => {
    const g = e.target.closest && e.target.closest(".tl-mk"); if (!g) { tip.hidden = true; return; }
    tip.textContent = g.dataset.tip; tip.hidden = false;
    const rect = wrap.getBoundingClientRect(), b = g.querySelector(".dot").getBoundingClientRect();
    tip.style.left = Math.max(0, Math.min(rect.width - tip.offsetWidth, b.left - rect.left + b.width / 2 - tip.offsetWidth / 2)) + "px";
    tip.style.top = (b.top - rect.top - tip.offsetHeight - 8) + "px";
  };
  wrap.onpointerover = showTip; wrap.onpointerdown = showTip; wrap.onfocusin = showTip;
  wrap.onpointerleave = () => tip.hidden = true; wrap.onfocusout = () => tip.hidden = true;
  const used = [...new Set(YEARS.flatMap(Y => cropEvents(cmpCrop, Y.y).map(e => e.type)))];
  $("#tlLegend").innerHTML = used.map(t => `<span style="--c:${(KINDS[t] || TYPES.garden).c}"><i class="dot"></i>${(KINDS[t] || TYPES.garden).name}</span>`).join("")
    + `<span style="--c:var(--muted)"><i class="dot big"></i>Key date</span><span><i class="dot hollow"></i>Planned</span>`;
  const labels = ["First planting", "First harvest", "Last harvest"];
  const KD = Object.fromEntries(YEARS.map(Y => [Y.y, Object.fromEntries(keyDates(cmpCrop, Y.y).map(([l, e]) => [l, e]))]));
  const rows = labels.filter(l => YEARS.some(Y => KD[Y.y][l]));
  $("#keyTable").innerHTML = rows.length ? `<thead><tr><th>Key date</th>${YEARS.map(Y => `<th>${Y.y}</th>`).join("")}<th>This year vs ${THIS_YEAR - 1}</th></tr></thead><tbody>` + rows.map(l => {
    const a = KD[THIS_YEAR][l], b = KD[THIS_YEAR - 1][l];
    const diff = a && b && a.status !== "planned" ? doyOf(a.date) - doyOf(b.date) : null;
    const dtxt = diff == null ? "–" : diff === 0 ? "Same day" : `${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"} ${diff < 0 ? "earlier" : "later"}`;
    return `<tr><td>${l}</td>${YEARS.map(Y => { const e = KD[Y.y][l]; return `<td>${e ? fmtShort(e.date) + (e.status === "planned" ? " (planned)" : "") : "–"}</td>`; }).join("")}<td>${dtxt}</td></tr>`;
  }).join("") + `</tbody>` : "";
}
function drawCompare() { renderCmpCrops(); drawHarvest(); drawTemps(); drawHeat(); drawTimeline(); }

/* ── Calendar ─────────────────────────────────────────────────────── */
let calY = NOW.getFullYear(), calM = NOW.getMonth(), calSel = TODAY;
$("#calLegend").innerHTML = Object.values(KINDS).map(t => `<span style="--c:${t.c}">${ico(t.icon)}${t.name}</span>`).join("");
const calItems = () => [...S.events.map(e => ({ ...e, title: evTitle(e), planned: e.status === "planned" })),
  ...S.orders.map(o => ({ id: "o" + o.id, date: o.date, type: "order", title: `${o.name}${o.time ? ", " + fmtTime(o.time).join(" ") : ""}: ${o.items}`, crops: [], planned: o.status !== "done" }))];
const evRow = e => `<div class="row">${typeDot(e.type)}<div class="row-main"><span class="row-title">${esc(e.title || evTitle(e))}</span>
  <div class="row-tags">${tags(e.crops)}${e.planned ? `<span class="pill ok">Planned</span>` : ""}${e.src && e.src !== "app" ? `<span class="src">${e.src === "handwritten" ? "From handwritten notes" : "Imported"}</span>` : ""}</div>
  ${detailLine(e) ? `<span class="meta">${esc(detailLine(e))}</span>` : ""}${e.desc ? `<span class="meta">${esc(e.desc)}</span>` : ""}</div>
  <div style="text-align:right; flex:none"><div class="meta">${fmtShort(e.date)}</div>${whoLabel(e) && e.type !== "order" ? `<div class="meta" style="display:flex;gap:4px;align-items:center;justify-content:flex-end">${ico("user", "icon sm")}${esc(whoLabel(e))}</div>` : ""}
  ${e.type !== "order" ? `<button class="del-btn write-only" type="button" data-del-ev="${e.id}">${ico("trash-2", "icon sm")}Delete</button>` : ""}</div></div>`;
function renderCalendar() {
  $("#calLabel").textContent = new Date(calY, calM, 1).toLocaleDateString("en-CA", { month: "long", year: "numeric" });
  const first = new Date(calY, calM, 1), start = new Date(calY, calM, 1 - first.getDay()), items = calItems();
  let h = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => `<div class="dow">${d}</div>`).join("");
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    if (i === 35 && d.getMonth() !== calM) break;
    const key = isoOf(d), evs = items.filter(e => e.date === key);
    h += `<button type="button" class="day${d.getMonth() !== calM ? " out" : ""}${key === TODAY ? " today" : ""}" data-d="${key}" aria-pressed="${key === calSel}" aria-label="${fmtLong(key)}, ${evs.length} events">
      <span class="num">${d.getDate()}</span><span class="evs">${evs.slice(0, 3).map(e => `<span class="cal-ev" style="--c:${(KINDS[e.type] || TYPES.garden).c}">${ico((KINDS[e.type] || TYPES.garden).icon)}<span>${esc(e.title)}</span></span>`).join("")}</span>${evs.length > 3 ? `<span class="cal-more">+${evs.length - 3} more</span>` : ""}</button>`;
  }
  $("#cal").innerHTML = h;
  const sel = items.filter(e => e.date === calSel);
  $("#calDay").innerHTML = `<div class="day-list"><h3>${fmtLong(calSel)}</h3>${sel.length ? `<div class="row-list">${sel.map(evRow).join("")}</div>` : `<p class="empty">Nothing logged or planned.</p>`}</div>`;
}
$("#cal").addEventListener("click", e => { const b = e.target.closest("[data-d]"); if (b) { calSel = b.dataset.d; renderCalendar(); } });
$("#calPrev").addEventListener("click", () => { calM--; if (calM < 0) { calM = 11; calY--; } renderCalendar(); });
$("#calNext").addEventListener("click", () => { calM++; if (calM > 11) { calM = 0; calY++; } renderCalendar(); });
document.addEventListener("click", e => { const b = e.target.closest("[data-del-ev]"); if (b) armOrConfirm(b, "e" + b.dataset.delEv, () => guard(() => db.doc("events/" + b.dataset.delEv).delete(), "Event deleted")); });

/* ── History ──────────────────────────────────────────────────────── */
let hYear = "All";
$("#hType").innerHTML = `<option value="">All types</option>` + Object.entries(TYPES).map(([k, t]) => `<option value="${k}">${t.name}</option>`).join("");
function renderFilterMenus() {
  const cur = $("#hCrop").value, curN = $("#n-crop").value;
  $("#hCrop").innerHTML = `<option value="">All crops</option>` + S.lists.crops.map(c => `<option${c === cur ? " selected" : ""}>${esc(c)}</option>`).join("");
  $("#n-crop").innerHTML = [...S.lists.crops, "General"].map(c => `<option${c === curN ? " selected" : ""}>${esc(c)}</option>`).join("");
  const years = ["All", ...[...new Set(S.events.map(e => e.date.slice(0, 4)))].sort().reverse()];
  if (!years.includes(hYear)) hYear = "All";
  $("#hYear").innerHTML = years.map(y => `<button type="button" data-y="${y}" aria-pressed="${y === hYear}">${y}</button>`).join("");
}
function renderHistory() {
  const t = $("#hType").value, c = $("#hCrop").value;
  const list = S.events.filter(e => e.status !== "planned" && (hYear === "All" || e.date.startsWith(hYear)) && (!t || e.type === t) && (!c || (e.crops || []).includes(c))).sort(byDate).reverse();
  resolveNames(list.slice(0, 200).map(e => e.by));
  $("#hCount").textContent = `${list.length} event${list.length === 1 ? "" : "s"}`;
  const groups = {};
  list.forEach(e => (groups[e.date.slice(0, 7)] ||= []).push(e));
  $("#hList").innerHTML = list.length ? Object.entries(groups).map(([ym, evs]) => `<div class="month-group"><h3>${parse(ym + "-01").toLocaleDateString("en-CA", { month: "long", year: "numeric" })}</h3><div class="row-list">${evs.map(e => evRow({ ...e, title: evTitle(e) })).join("")}</div></div>`).join("")
    : `<p class="empty">${S.events.length ? "No events match these filters." : "No events yet. Log one from the dashboard or import old records."}</p>`;
}
$("#hYear").addEventListener("click", e => { const b = e.target.closest("[data-y]"); if (!b) return; hYear = b.dataset.y; $("#hYear").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); renderHistory(); });
$("#hType").addEventListener("change", renderHistory);
$("#hCrop").addEventListener("change", renderHistory);

/* ── Import: shared helpers ───────────────────────────────────────── */
const MONTH_NAMES = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
function parseAnyDate(v, fallbackYear) {
  if (v == null || v === "") return null;
  if (v instanceof Date && !isNaN(v)) return isoOf(new Date(v.getTime() + 12 * 36e5)); // noon-shift absorbs UTC/local midnight differences
  if (typeof v === "number" && v > 20000 && v < 80000) { const d = new Date(Math.round((v - 25569) * 864e5)); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; }
  const s = String(v).trim().toLowerCase().replace(/(\d)(st|nd|rd|th)\b/g, "$1").replace(/,/g, " ").replace(/\s+/g, " ");
  let m;
  if ((m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/))) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})(?:[-/.](\d{2,4}))?$/))) { let y = m[3] ? +m[3] : fallbackYear; if (y < 100) y += 2000; if (+m[1] > 12) return `${y}-${pad(+m[2])}-${pad(+m[1])}`; return `${y}-${pad(+m[1])}-${pad(+m[2])}`; }
  if ((m = s.match(/^([a-z]{3,})\.? (\d{1,2})(?: (\d{4}))?$/))) { const mi = MONTH_NAMES.indexOf(m[1].slice(0, 3)); if (mi >= 0) return `${m[3] || fallbackYear}-${pad(mi + 1)}-${pad(+m[2])}`; }
  if ((m = s.match(/^(\d{1,2}) ([a-z]{3,})\.?(?: (\d{4}))?$/))) { const mi = MONTH_NAMES.indexOf(m[2].slice(0, 3)); if (mi >= 0) return `${m[3] || fallbackYear}-${pad(mi + 1)}-${pad(+m[1])}`; }
  const t = Date.parse(String(v)); return isNaN(t) ? null : isoOf(new Date(t));
}
function matchType(v, dflt) {
  const s = String(v || "").toLowerCase();
  if (!s) return dflt;
  if (TYPES[s]) return s;
  if (/spray|fungicid|herbicid|insecticid|pesticid/.test(s)) return "spray";
  if (/plant|seed|sow|transplant/.test(s)) return "planting";
  if (/fert|nutri|nitrogen|potash|compost|manure|lime|feed/.test(s)) return "nutrient";
  if (/harvest|pick|yield/.test(s)) return "harvest";
  if (/garden|weed|mulch|till|prune|clean|garden/.test(s)) return "garden";
  return dflt;
}
const splitList = v => String(v || "").split(/[;,/]| and /i).map(x => x.trim()).filter(Boolean);
function matchCrops(v) { const known = S.lists.crops; return splitList(v).map(c => known.find(k => k.toLowerCase() === c.toLowerCase()) || c); }
async function importRows(rows, meta, progressEl) {
  const importId = "imp-" + Date.now().toString(36), createdAt = new Date().toISOString();
  const newCrops = new Set(), newFields = new Set();
  let done = 0;
  for (const r of rows) {
    r.crops.forEach(c => { if (!S.lists.crops.includes(c)) newCrops.add(c); });
    r.fields.forEach(f => { if (!S.lists.fields.includes(f)) newFields.add(f); });
    const doc = { date: r.date, type: r.type, what: r.what || TYPES[r.type].name, details: r.details || {}, fields: r.fields, crops: r.crops, desc: r.desc || "",
      status: r.date > TODAY ? "planned" : "done", by: me?.id || null, createdAt, src: meta.src, importId, importName: meta.name };
    const ok = await guard(() => db.collection("events").add(doc));
    if (!ok) { progressEl.textContent = `Stopped after ${done} of ${rows.length}. Nothing else was imported.`; break; }
    done++; if (done % 5 === 0 || done === rows.length) progressEl.textContent = `Imported ${done} of ${rows.length}…`;
  }
  if (newCrops.size || newFields.size) { S.lists.crops = [...S.lists.crops, ...newCrops]; S.lists.fields = [...S.lists.fields, ...newFields]; await saveLists(); }
  if (done === rows.length) { progressEl.textContent = `Imported ${done} event${done === 1 ? "" : "s"}.`; toast(`Imported ${done} events`); }
  return done;
}

/* Spreadsheet import */
let XLSXP = null, wb = null, xlsName = "", xlsRows = [], xlsHead = [];
function loadXLSX() {
  return XLSXP ||= new Promise((res, rej) => { const s = document.createElement("script"); s.src = "/vendor/xlsx.full.min.js"; s.onload = () => res(window.XLSX); s.onerror = () => { XLSXP = null; rej(new Error("load")); }; document.head.append(s); });
}
// [key, label, exact header match, looser match]; exact matches are assigned first
const MAP_FIELDS = [["date", "Date", /^(date|day)$/i, /date|day|when/i], ["type", "Type", /^(type|activity|event type|category)$/i, /type|category|kind/i],
  ["what", "What", /^(what|product|chemical|item|task|title)$/i, /what|product|chemical|item|task|variety/i],
  ["crops", "Crops", /^crops?$/i, /crop/i], ["fields", "Fields", /^(fields?|block|location)$/i, /field|block|location|bed/i],
  ["desc", "Description / notes", /^(notes?|description|comments?)$/i, /note|desc|comment|detail|remark/i],
  ["amount", "Amount", /^(amount|qty|quantity|yield)$/i, /amount|qty|quantity|yield|volume|bins|lbs?\b|weight/i], ["rate", "Rate", /^rate$/i, /rate|dose/i]];
$("#xlsType").innerHTML = Object.entries(TYPES).map(([k, t]) => `<option value="${k}">${t.name}</option>`).join("");
$("#xlsType").value = "garden";
$("#xlsYear").value = THIS_YEAR;
$("#hwYear").value = THIS_YEAR;
async function openSpreadsheet(file) {
  if (!file) return;
  $("#xlsProgress").textContent = "Reading…";
  let XLSX;
  try { XLSX = await loadXLSX(); } catch { $("#xlsProgress").textContent = "Couldn't load the spreadsheet reader. Check your connection and try again."; return; }
  try {
    wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    xlsName = file.name;
    $("#xlsSheet").innerHTML = wb.SheetNames.map(n => `<option>${esc(n)}</option>`).join("");
    $("#xlsStep").hidden = false; $("#xlsProgress").textContent = "";
    loadSheet();
  } catch (e) { console.warn(e); $("#xlsProgress").textContent = "Couldn't read that file. Save it as .xlsx or .csv and try again."; }
}
function loadSheet() {
  const ws = wb.Sheets[$("#xlsSheet").value];
  const all = window.XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "" });
  const hi = Math.max(0, all.findIndex(r => r.filter(v => String(v).trim() !== "").length >= 2));
  xlsHead = (all[hi] || []).map((h, i) => String(h).trim() || `Column ${i + 1}`);
  xlsRows = all.slice(hi + 1).filter(r => r.some(v => String(v).trim() !== ""));
  const used = new Set(), pick = {};
  [2, 3].forEach(pass => MAP_FIELDS.forEach(f => { if (f[0] in pick) return; const g = xlsHead.findIndex((h, i) => !used.has(i) && f[pass].test(h)); if (g >= 0) { pick[f[0]] = g; used.add(g); } }));
  $("#xlsMap").innerHTML = MAP_FIELDS.map(([k, label]) => {
    const g = pick[k] ?? -1;
    return `<div class="field"><label for="map-${k}">${label}${k === "date" ? " (needed)" : ""}</label><select id="map-${k}" data-map="${k}"><option value="">Not in this sheet</option>${xlsHead.map((h, i) => `<option value="${i}"${i === g ? " selected" : ""}>${esc(h)}</option>`).join("")}</select></div>`;
  }).join("");
  previewSheet();
}
function sheetEvents() {
  const col = k => { const v = $(`#map-${k}`)?.value; return v === "" || v == null ? -1 : +v; };
  const C = Object.fromEntries(MAP_FIELDS.map(([k]) => [k, col(k)])), y = +$("#xlsYear").value || THIS_YEAR, dflt = $("#xlsType").value;
  return xlsRows.map(r => {
    const get = k => C[k] >= 0 ? r[C[k]] : "";
    const details = {}; if (String(get("amount")).trim()) details.Amount = String(get("amount")).trim(); if (String(get("rate")).trim()) details.Rate = String(get("rate")).trim();
    return { date: parseAnyDate(get("date"), y), type: matchType(get("type"), dflt), what: String(get("what")).trim(), crops: matchCrops(get("crops")), fields: splitList(get("fields")), desc: String(get("desc")).trim(), details, raw: get("date") };
  });
}
function previewSheet() {
  const evs = sheetEvents(), ok = evs.filter(e => e.date);
  $("#xlsPreview").innerHTML = `<thead><tr><th>Date</th><th>Type</th><th>What</th><th>Crops</th></tr></thead><tbody>` + evs.slice(0, 8).map(e =>
    `<tr><td>${e.date ? fmtShort(e.date) + " " + e.date.slice(0, 4) : `<span class="bad">No date (${esc(e.raw || "blank")})</span>`}</td><td>${TYPES[e.type].name}</td><td>${esc(e.what)}</td><td>${esc(e.crops.join(", "))}</td></tr>`).join("") + `</tbody>`;
  $("#xlsSummary").textContent = `${evs.length} rows found. ${ok.length} ready to import${evs.length - ok.length ? `, ${evs.length - ok.length} skipped because the date couldn't be read` : ""}. Showing the first ${Math.min(8, evs.length)}.`;
  $("#xlsImport").innerHTML = `${ico("upload")}Import ${ok.length} event${ok.length === 1 ? "" : "s"}`;
  $("#xlsImport").disabled = !ok.length;
}
$("#xlsFile").addEventListener("change", e => openSpreadsheet(e.target.files[0]));
$("#xlsSheet").addEventListener("change", loadSheet);
$("#xlsMap").addEventListener("change", previewSheet);
$("#xlsType").addEventListener("change", previewSheet);
$("#xlsYear").addEventListener("change", previewSheet);
$("#xlsImport").addEventListener("click", async () => {
  const ok = sheetEvents().filter(e => e.date); if (!ok.length) return;
  $("#xlsImport").disabled = true;
  await importRows(ok, { src: "spreadsheet", name: xlsName }, $("#xlsProgress"));
  $("#xlsImport").disabled = false;
});
["xlsDrop", "hwDrop"].forEach(id => {
  const el = $("#" + id);
  el.addEventListener("dragover", e => { e.preventDefault(); el.classList.add("over"); });
  el.addEventListener("dragleave", () => el.classList.remove("over"));
  el.addEventListener("drop", e => { e.preventDefault(); el.classList.remove("over"); if (id === "xlsDrop") openSpreadsheet(e.dataTransfer.files[0]); else setPhotos([...e.dataTransfer.files]); });
});

/* Handwritten import (Claude reads the photos) */
let photos = [], hwRows = [], hwCtl = null, imgLimits = null;
function setPhotos(files) {
  const max = imgLimits?.maxCount || 5, ok = files.filter(f => /^image\//.test(f.type)).slice(0, max);
  if (files.length > max) toast(`Up to ${max} photos at a time`);
  photos = ok; $("#hwThumbs").innerHTML = ""; ok.forEach(f => { const img = document.createElement("img"); img.src = URL.createObjectURL(f); img.alt = f.name; $("#hwThumbs").append(img); });
  $("#hwRead").disabled = !photos.length;
}
$("#hwFiles").addEventListener("change", e => setPhotos([...e.target.files]));
$("#hwRead").addEventListener("click", async () => {
  if (hwCtl) { hwCtl.abort(); return; }
  const year = +$("#hwYear").value || THIS_YEAR;
  const prompt = `These photos are handwritten farm records from Fehr Grown Farms in Corinth, Ontario. Transcribe every dated farm activity.
Reply with only a JSON array. Each item: {"date":"YYYY-MM-DD","type":"spray|planting|nutrient|harvest|garden","what":"short title, e.g. the product, crop or task","crops":["crop names"],"fields":["field names"],"amount":"amount with unit, or empty","rate":"application rate, or empty","description":"anything else written for that entry, including notes about next year","unsure":true or false}
Rules: when no year is written, use ${year}. Match crops to this list when they fit: ${S.lists.crops.join(", ") || "none yet"}. Match fields to this list when they fit: ${S.lists.fields.join(", ") || "none yet"}. Set "unsure" to true when handwriting or the date is hard to read. Never invent entries. If nothing is readable, reply [].`;
  hwCtl = new AbortController();
  $("#hwRead").innerHTML = `${ico("x")}Stop`; $("#hwProgress").textContent = "Claude is reading the pages. This can take up to a minute…";
  try {
    const out = await sampleFn.json(prompt, { images: photos, signal: hwCtl.signal });
    const arr = Array.isArray(out) ? out : [];
    hwRows = arr.map(r => ({ include: true, date: parseAnyDate(r.date, year) || "", type: matchType(r.type, "garden"), what: String(r.what || ""), crops: matchCrops((r.crops || []).join(";")), fields: splitList((r.fields || []).join(";")),
      desc: String(r.description || ""), details: Object.fromEntries([["Amount", r.amount], ["Rate", r.rate]].filter(([, v]) => v && String(v).trim())), unsure: !!r.unsure }));
    $("#hwProgress").textContent = hwRows.length ? `Found ${hwRows.length} entries. Check them, fix anything that's wrong, untick what you don't want, then import. Rows Claude wasn't sure about are outlined.` : "Claude couldn't find any dated entries in these photos.";
    renderHw();
  } catch (e) {
    const msg = { cancelled: "Stopped.", not_granted: "Reading photos needs your permission to use Claude. Reload the page to be asked again.", rate_limited: "Too many requests right now. Try again in a few minutes.",
      image_rejected: "One of the photos couldn't be read. Try a clearer JPEG or PNG.", invalid_json: "Claude's answer couldn't be read. Try again, or try fewer pages at once.", refused: "Claude couldn't transcribe these photos." }[e?.code];
    $("#hwProgress").textContent = msg || "Something went wrong reading the photos. Try again.";
    if (e?.code === "not_granted" || e?.code === "images_unavailable" || e?.code === "sampling_disabled") { $("#hwArea").hidden = true; $("#hwUnavailable").hidden = false; }
  } finally { hwCtl = null; $("#hwRead").innerHTML = `${ico("camera")}Read with Claude`; }
});
function renderHw() {
  $("#hwList").innerHTML = hwRows.map((r, i) => `<div class="hw-row${r.unsure ? " unsure" : ""}">
    <input type="checkbox" data-hw="${i}" data-k="include" ${r.include ? "checked" : ""} aria-label="Include this row">
    <input type="date" data-hw="${i}" data-k="date" value="${r.date}" aria-label="Date">
    <select data-hw="${i}" data-k="type" aria-label="Type">${Object.entries(TYPES).map(([k, t]) => `<option value="${k}"${k === r.type ? " selected" : ""}>${t.name}</option>`).join("")}</select>
    <input class="hw-what" data-hw="${i}" data-k="what" value="${esc(r.what)}" placeholder="What" aria-label="What">
    <input class="hw-crops" data-hw="${i}" data-k="crops" value="${esc(r.crops.join(", "))}" placeholder="Crops" aria-label="Crops">
    <input class="hw-desc" data-hw="${i}" data-k="desc" value="${esc([Object.values(r.details).join(" · "), r.desc].filter(Boolean).join(" — "))}" placeholder="Notes" aria-label="Notes"></div>`).join("");
  const n = hwRows.filter(r => r.include && r.date).length;
  $("#hwImport").hidden = !hwRows.length; $("#hwImport").innerHTML = `${ico("upload")}Import ${n} event${n === 1 ? "" : "s"}`; $("#hwImport").disabled = !n;
}
$("#hwList").addEventListener("change", e => {
  const el = e.target.closest("[data-hw]"); if (!el) return;
  const r = hwRows[+el.dataset.hw], k = el.dataset.k;
  if (k === "include") r.include = el.checked; else if (k === "crops") r.crops = matchCrops(el.value); else if (k === "desc") { r.desc = el.value; r.details = {}; } else r[k] = el.value;
  const n = hwRows.filter(r => r.include && r.date).length; $("#hwImport").innerHTML = `${ico("upload")}Import ${n} event${n === 1 ? "" : "s"}`; $("#hwImport").disabled = !n;
});
$("#hwImport").addEventListener("click", async () => {
  const rows = hwRows.filter(r => r.include && r.date); if (!rows.length) return;
  $("#hwImport").disabled = true;
  const n = await importRows(rows, { src: "handwritten", name: photos.map(p => p.name).join(", ") || "Handwritten notes" }, $("#hwProgress"));
  if (n === rows.length) { hwRows = []; renderHw(); setPhotos([]); $("#hwFiles").value = ""; }
  $("#hwImport").disabled = false;
});

/* Past imports */
function renderImports() {
  const g = {};
  S.events.forEach(e => { if (!e.importId) return; (g[e.importId] ||= { id: e.importId, name: e.importName, src: e.src, at: e.createdAt, n: 0 }).n++; });
  const list = Object.values(g).sort((a, b) => (b.at || "").localeCompare(a.at || ""));
  $("#impList").innerHTML = list.length ? list.map(i => `<div class="imp-row">${ico(i.src === "handwritten" ? "camera" : "file-spreadsheet", "icon")}<div class="row-main"><span class="row-title">${esc(i.name || "Import")}</span><span class="meta">${i.n} event${i.n === 1 ? "" : "s"} · ${i.at ? fmtLong(i.at.slice(0, 10)) : ""}</span></div>
    <button class="del-btn" type="button" data-rm-imp="${esc(i.id)}">${ico("trash-2", "icon sm")}Remove import</button></div>`).join("") : `<p class="empty">Nothing imported yet.</p>`;
}
$("#impList").addEventListener("click", e => {
  const b = e.target.closest("[data-rm-imp]"); if (!b) return;
  armOrConfirm(b, "i" + b.dataset.rmImp, async () => {
    const ids = S.events.filter(x => x.importId === b.dataset.rmImp).map(x => x.id); let n = 0;
    for (const id of ids) { if (!(await guard(() => db.doc("events/" + id).delete()))) break; n++; }
    toast(`Removed ${n} imported event${n === 1 ? "" : "s"}`);
  });
});

/* Sync status (from the server connector) */
let syncInfo = { pending: 0, online: navigator.onLine };
function showSync() {
  if (canWrite === false) return;
  if (!syncInfo.online) setStatus("offline", syncInfo.pending ? `<b>Offline.</b> ${syncInfo.pending} change${syncInfo.pending === 1 ? "" : "s"} saved on this device will be sent when you're back online.` : "<b>Offline.</b> You can keep logging. Changes will be sent when you're back online.");
  else if (syncInfo.pending) setStatus("offline", `<b>Sending ${syncInfo.pending} saved change${syncInfo.pending === 1 ? "" : "s"}…</b>`);
  else setStatus("live", "All changes saved. Everything here is shared with the team.");
}
addEventListener("farm-sync", (e) => { syncInfo = e.detail; showSync(); });
addEventListener("online", () => { syncInfo.online = true; showSync(); });
addEventListener("offline", () => { syncInfo.online = false; showSync(); });
addEventListener("farm-queued", () => toast("Saved on this phone. It will send when you're back online."));

/* Backup: download everything, or load a Farm Log file (e.g. from the beta) */
const BACKUP_COLS = ["events", "orders", "notes", "lists"];
$("#exportBtn").addEventListener("click", () => {
  const out = { app: "Fehr Grown Farm Log", exportedAt: new Date().toISOString(),
    events: S.events, orders: S.orders, notes: S.notes, lists: [{ id: "main", ...S.lists }] };
  const blob = new Blob([JSON.stringify(out, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = `farm-log-${TODAY}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
});
$("#restoreFile").addEventListener("change", async (e) => {
  const f = e.target.files[0]; if (!f) return;
  const el = $("#restoreProgress");
  let data;
  try { data = JSON.parse(await f.text()); } catch { el.textContent = "That file isn't a Farm Log file."; return; }
  const items = BACKUP_COLS.flatMap(c => (Array.isArray(data[c]) ? data[c] : []).filter(x => x && x.id).map(x => [c, x]));
  if (!items.length) { el.textContent = "Nothing to load in that file."; return; }
  let n = 0;
  for (const [c, x] of items) {
    const { id, ...body } = x;
    if (!(await guard(() => db.doc(`${c}/${id}`).set(body)))) { el.textContent = `Stopped after ${n} of ${items.length}.`; return; }
    n++; if (n % 10 === 0 || n === items.length) el.textContent = `Loaded ${n} of ${items.length}…`;
  }
  el.textContent = `Loaded ${n} records. Anything already here with the same id was replaced, so loading the same file twice is safe.`;
  e.target.value = "";
});

/* ── Navigation ───────────────────────────────────────────────────── */
const VIEWS = ["dashboard", "calendar", "orders", "history", "notes", "import"];
let curView = "dashboard";
function show(v) {
  if (!VIEWS.includes(v)) v = "dashboard";
  curView = v;
  VIEWS.forEach(x => $("#v-" + x).hidden = x !== v);
  document.querySelectorAll("[data-view]").forEach(a => a.dataset.view === v && !a.classList.contains("wordmark") ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
  ["history", "notes", "import"].includes(v) ? $("#moreBtn").setAttribute("aria-current", "page") : $("#moreBtn").removeAttribute("aria-current");
  setMore(false);
  renderView();
  scrollTo(0, 0);
}
const setMore = on => { $("#moreMenu").hidden = !on; $("#moreBtn").setAttribute("aria-expanded", on); };
$("#moreBtn").addEventListener("click", e => { e.stopPropagation(); setMore($("#moreMenu").hidden); });
document.addEventListener("click", e => {
  if (!e.target.closest("#moreMenu")) setMore(false);
  const a = e.target.closest("[data-view]"); if (!a) return; e.preventDefault(); show(a.dataset.view);
});
$("#feedbackBtn").addEventListener("click", async () => {
  if (!commentsNs) return;
  const target = curView === "dashboard" ? $("#v-dashboard") : $("#v-" + curView).querySelector(".unit") || $("#v-" + curView);
  try { await commentsNs.openComposer({ element: target }); } catch (e) { console.warn(e); }
});

/* ── Render ───────────────────────────────────────────────────────── */
function renderView() {
  if (curView === "dashboard") { renderForecast(); renderUpcoming(); renderOrders(); renderPast(); renderNotes(); renderRecent(); drawCompare(); }
  if (curView === "calendar") renderCalendar();
  if (curView === "orders") renderOrders();
  if (curView === "history") renderHistory();
  if (curView === "notes") renderNotes();
  if (curView === "import") renderImports();
}
let rq = 0;
function renderAll() { cancelAnimationFrame(rq); rq = requestAnimationFrame(() => { renderFilterMenus(); renderView(); }); }
$("#todayLabel").textContent = `Farm log · Corinth, ON · ${NOW.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}`;
paintIcons(); renderTypes(); renderChips("fields"); renderChips("crops"); renderFilterMenus();
show(location.hash.slice(1));
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(err => console.warn("service worker", err));
let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (curView === "dashboard") drawCompare(); }, 150); });

/* ── Connect to the shared database ───────────────────────────────── */
(async () => {
  const C = window.claude;
  if (!C?.use) return;
  const [dbNs, u, smp, cm] = await Promise.all([C.use("db"), C.use("user"), C.use("sample"), C.use("comments")]);
  userNs = u; sampleFn = smp; commentsNs = cm;
  $("#feedbackBtn").hidden = !commentsNs;
  if (userNs) {
    me = await userNs.me();
    if (me?.avatarUrl) $("#avatar").innerHTML = `<img alt="" src="${esc(me.avatarUrl)}">`;
    $("#avatar").title = me?.name || "You";
    canWrite = await userNs.can("data.write");
    applyWriteState();
  }
  if (sampleFn) { imgLimits = (await sampleFn.limits().catch(() => null))?.images || null; }
  if (!sampleFn || !imgLimits) { $("#hwArea").hidden = true; $("#hwUnavailable").hidden = false; }
  else $("#hwLimit").textContent = `JPEG or PNG, up to ${imgLimits.maxCount} pages at a time`;
  if (!dbNs) return; // not signed in: the sign-in screen is showing
  db = dbNs;
  const onErr = e => { console.warn(e); if (e?.code === "revoked") setStatus("offline", "<b>Access changed.</b> Reload the page."); };
  const firstLoad = new Set(["events", "orders", "notes"]);
  const live = () => { if (canWrite !== false && !firstLoad.size) showSync(); };
  ["events", "orders", "notes"].forEach(name => db.collection(name).onSnapshot(snap => {
    S[name] = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => name !== "events" || typeof x.date === "string");
    firstLoad.delete(name); live(); renderAll();
  }, onErr));
  db.doc("lists/main").onSnapshot(snap => {
    const d = snap.exists ? snap.data() : null;
    S.lists = { crops: d?.crops ?? [...DEFAULT_CROPS], fields: d?.fields ?? [], saved: d?.saved ?? {} };
    renderChips("fields"); renderChips("crops"); if (!whatList.hidden) renderCombo(); renderAll();
  }, onErr);
  db.collection("weather").onSnapshot(snap => {
    S.weather = {}; S.forecast = null;
    snap.docs.forEach(d => { if (d.id === "forecast") S.forecast = d.data(); else S.weather[d.id] = d.data(); });
    renderAll();
  }, onErr);
})();