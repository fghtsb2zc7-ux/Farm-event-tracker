// Lucide icons (ISC licence), inlined so the app works offline.
const ICONS={"calendar-days": "<path d=\"M8 2v4\" /><path d=\"M16 2v4\" /><rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\" /><path d=\"M3 10h18\" /><path d=\"M8 14h.01\" /><path d=\"M12 14h.01\" /><path d=\"M16 14h.01\" /><path d=\"M8 18h.01\" /><path d=\"M12 18h.01\" /><path d=\"M16 18h.01\" />", "check": "<path d=\"M20 6 9 17l-5-5\" />", "chevron-left": "<path d=\"m15 18-6-6 6-6\" />", "chevron-right": "<path d=\"m9 18 6-6-6-6\" />", "circle-alert": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><line x1=\"12\" x2=\"12\" y1=\"8\" y2=\"12\" /><line x1=\"12\" x2=\"12.01\" y1=\"16\" y2=\"16\" />", "circle-dollar-sign": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><path d=\"M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8\" /><path d=\"M12 18V6\" />", "download": "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" /><polyline points=\"7 10 12 15 17 10\" /><line x1=\"12\" x2=\"12\" y1=\"15\" y2=\"3\" />", "file-spreadsheet": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\" /><path d=\"M14 2v4a2 2 0 0 0 2 2h4\" /><path d=\"M8 13h2\" /><path d=\"M14 13h2\" /><path d=\"M8 17h2\" /><path d=\"M14 17h2\" />", "minus": "<path d=\"M5 12h14\" />", "package": "<path d=\"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z\" /><path d=\"M12 22V12\" /><path d=\"m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7\" /><path d=\"m7.5 4.27 9 5.15\" />", "pencil": "<path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\" /><path d=\"m15 5 4 4\" />", "plus": "<path d=\"M5 12h14\" /><path d=\"M12 5v14\" />", "receipt": "<path d=\"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z\" /><path d=\"M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8\" /><path d=\"M12 17.5v-11\" />", "search": "<circle cx=\"11\" cy=\"11\" r=\"8\" /><path d=\"m21 21-4.3-4.3\" />", "settings": "<path d=\"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z\" /><circle cx=\"12\" cy=\"12\" r=\"3\" />", "ship": "<path d=\"M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1\" /><path d=\"M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76\" /><path d=\"M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6\" /><path d=\"M12 10v4\" /><path d=\"M12 2v3\" />", "store": "<path d=\"m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7\" /><path d=\"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8\" /><path d=\"M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4\" /><path d=\"M2 7h20\" /><path d=\"M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7\" />", "trash-2": "<path d=\"M3 6h18\" /><path d=\"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6\" /><path d=\"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2\" /><line x1=\"10\" x2=\"10\" y1=\"11\" y2=\"17\" /><line x1=\"14\" x2=\"14\" y1=\"11\" y2=\"17\" />", "truck": "<path d=\"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2\" /><path d=\"M15 18H9\" /><path d=\"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14\" /><circle cx=\"17\" cy=\"18\" r=\"2\" /><circle cx=\"7\" cy=\"18\" r=\"2\" />", "user": "<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\" /><circle cx=\"12\" cy=\"7\" r=\"4\" />", "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\" /><circle cx=\"9\" cy=\"7\" r=\"4\" /><path d=\"M22 21v-2a4 4 0 0 0-3-3.87\" /><path d=\"M16 3.13a4 4 0 0 1 0 7.75\" />", "x": "<path d=\"M18 6 6 18\" /><path d=\"m6 6 12 12\" />"};

/* Rough Cut Dezigns Orders: orders, customers, products and calendar for the woodworking and 3D printing shop.
 * Data lives on the Mac mini (PocketBase) and reaches this page through js/adapter.js, which also
 * handles sign-in, live updates from teammates and working offline. */

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
const NOW = new Date(), TODAY = isoOf(NOW);
const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
const money = n => "$" + r2(n).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const uid = () => Math.random().toString(36).slice(2, 10);
function fmtTime(t) { if (!t) return ""; const [h, mi] = t.split(":").map(Number); return `${h % 12 || 12}:${pad(mi)} ${h < 12 ? "AM" : "PM"}`; }
let toastTimer;
function toast(msg) { $("#toastText").textContent = msg; $("#toast").classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 2600); }
const armed = new Map();
function armOrConfirm(btn, key, run, label = "Delete") {
  if (armed.get(key)) { armed.delete(key); run(); return; }
  armed.set(key, true); btn.classList.add("armed"); btn.lastChild.textContent = "Tap again to delete";
  setTimeout(() => { armed.delete(key); if (btn.isConnected) { btn.classList.remove("armed"); btn.lastChild.textContent = label; } }, 4000);
}

const STATUS = { new: "Ordered", making: "In progress", ready: "Ready", done: "Completed", cancelled: "Cancelled" };
const ACTIVE = ["new", "making", "ready"];

/* ── Shared state (filled live from the Mac mini) ─────────────────── */
const S = { orders: [], customers: [], catalog: [], config: { businessName: "Rough Cut Dezigns", taxRate: 0, taxName: "HST" } };
let db = null, me = null;

function setStatus(kind, html) {
  $("#statusDot").className = "status-dot" + (kind === "live" ? " live" : "");
  $("#betaBar").classList.toggle("warn", kind === "offline");
  $("#statusText").innerHTML = html;
}
let syncInfo = { pending: 0, online: navigator.onLine }, loaded = false;
function showSync() {
  if (!loaded) return;
  if (!syncInfo.online) setStatus("offline", syncInfo.pending ? `<b>Offline.</b> ${syncInfo.pending} change${syncInfo.pending === 1 ? "" : "s"} saved on this device will be sent when you're back online.` : "<b>Offline.</b> You can keep working. Changes will be sent when you're back online.");
  else if (syncInfo.pending) setStatus("offline", `<b>Sending ${syncInfo.pending} saved change${syncInfo.pending === 1 ? "" : "s"}…</b>`);
  else setStatus("live", "All changes saved.");
}
addEventListener("farm-sync", e => { syncInfo = e.detail; showSync(); });
addEventListener("online", () => { syncInfo.online = true; showSync(); });
addEventListener("offline", () => { syncInfo.online = false; showSync(); });
addEventListener("farm-queued", () => toast("Saved on this device. It will send when you're back online."));

async function guard(fn, okMsg) {
  if (!db) { toast("Sign in to save changes."); return false; }
  try { await fn(); if (okMsg) toast(okMsg); return true; }
  catch (e) { console.warn(e); toast("Couldn't save. Check your connection and try again."); return false; }
}

const catalogSorted = () => [...S.catalog].sort((a, b) => (a.sort ?? 99) - (b.sort ?? 99) || String(a.name).localeCompare(String(b.name)));
const owes = o => Math.max(0, r2((Number(o.total) || 0) - (Number(o.paid) || 0)));
const byWhen = (a, b) => (a.date || "9999") .localeCompare(b.date || "9999") || (a.time || "").localeCompare(b.time || "");
function calc(d) {
  const subtotal = r2(d.items.reduce((t, i) => t + (Number(i.qty) || 0) * (Number(i.price) || 0), 0));
  const shipping = d.fulfilment === "ship" ? r2(d.shipping) : 0;
  const rate = Number(S.config.taxRate) || 0;
  const tax = r2((subtotal + shipping) * rate / 100);
  return { subtotal, shipping, tax, taxRate: rate, total: r2(subtotal + shipping + tax) };
}
const itemsSummary = o => (o.items || []).map(i => `${i.qty}× ${i.cat} · ${i.opt}`).join(", ");

/* ── Orders list ──────────────────────────────────────────────────── */
let oFilter = "active", oQuery = "";
function statusPill(o) { return `<span class="pill status-${o.status || "new"}">${STATUS[o.status] || "Ordered"}</span>`; }
function fulPill(o) { return o.fulfilment === "ship" ? `<span class="pill ful">${ico("truck", "icon sm")}Ship</span>` : `<span class="pill ful">${ico("store", "icon sm")}Pickup</span>`; }
function payPill(o) { return !o.total ? "" : owes(o) <= 0 ? `<span class="pill ok">${ico("check", "icon sm")}Paid ${money(o.total)}</span>` : `<span class="pill warn">Owes ${money(owes(o))}${o.paid > 0 ? ` of ${money(o.total)}` : ""}</span>`; }
function nextStep(o) {
  if (o.status === "new") return ["making", "Start"];
  if (o.status === "making") return ["ready", "Mark ready"];
  if (o.status === "ready") return ["done", o.fulfilment === "ship" ? "Mark shipped" : "Mark picked up"];
  return null;
}
function orderCard(o) {
  const c = o.customer || {}, step = nextStep(o);
  const [mon, day] = o.date ? fmtShort(o.date).split(" ") : ["", "–"];
  return `<div class="order${o.status === "done" || o.status === "cancelled" ? " done" : ""}">
    <div class="date-col"><b>${day}</b><span>${mon}</span></div>
    <div class="row-main">
      <span class="row-title">${esc(c.name || "No name")}</span>
      <span class="meta">${[o.time ? fmtTime(o.time) : "", c.phone].filter(Boolean).map(esc).join(" · ")}</span>
      <p class="o-lines">${esc(itemsSummary(o)) || "<i>No items</i>"}</p>
      <div class="row-tags">${statusPill(o)}${fulPill(o)}${payPill(o)}</div>
      <div class="o-actions">
        <button class="btn sm outline" type="button" data-edit="${o.id}">${ico("pencil", "icon sm")}Open</button>
        ${step ? `<button class="btn sm outline" type="button" data-step-to="${step[0]}" data-o="${o.id}">${ico("check", "icon sm")}${step[1]}</button>` : ""}
        ${owes(o) > 0 && o.status !== "cancelled" ? `<button class="btn sm outline" type="button" data-paid="${o.id}">${ico("circle-dollar-sign", "icon sm")}Mark paid</button>` : ""}
      </div>
    </div>
    <div class="money" style="text-align:right; flex:none"><b>${money(o.total)}</b></div></div>`;
}
function renderStats() {
  const active = S.orders.filter(o => ACTIVE.includes(o.status));
  const week = active.filter(o => o.date && o.date <= addDays(TODAY, 7));
  const month = TODAY.slice(0, 7);
  const sales = S.orders.filter(o => o.status !== "cancelled" && (o.date || "").startsWith(month)).reduce((t, o) => t + (Number(o.total) || 0), 0);
  $("#stats").innerHTML = `<div class="stat"><b>${week.length}</b><span>Due in the next 7 days</span></div>
    <div class="stat"><b>${active.filter(o => o.status === "making").length}</b><span>In progress</span></div>
    <div class="stat"><b>${money(S.orders.filter(o => o.status !== "cancelled").reduce((t, o) => t + owes(o), 0))}</b><span>Still owed</span></div>
    <div class="stat"><b>${money(sales)}</b><span>Orders due this month</span></div>`;
}
function renderOrders() {
  renderStats();
  const q = oQuery.trim().toLowerCase();
  let list = S.orders.filter(o =>
    oFilter === "active" ? ACTIVE.includes(o.status) :
    oFilter === "unpaid" ? o.status !== "cancelled" && owes(o) > 0 :
    oFilter === "done" ? o.status === "done" : true);
  if (q) list = list.filter(o => [(o.customer || {}).name, (o.customer || {}).phone, (o.customer || {}).email, itemsSummary(o), o.notes, ...(o.items || []).map(i => i.note)].join(" ").toLowerCase().includes(q));
  list.sort(byWhen);
  if (oFilter === "done" || oFilter === "all") list.reverse();
  let h = "", last = null;
  list.forEach(o => {
    const key = o.date || "none";
    if (key !== last) {
      const late = o.date && o.date < TODAY && ACTIVE.includes(o.status);
      const label = !o.date ? "No date" : o.date === TODAY ? "Today" : o.date === addDays(TODAY, 1) ? "Tomorrow" : fmtLong(o.date);
      h += `<div class="day-head${late ? " late" : ""}">${late ? "Overdue · " : ""}${label}</div>`; last = key;
    }
    h += orderCard(o);
  });
  $("#oList").innerHTML = h || `<p class="empty">${S.orders.length ? "No orders match." : "No orders yet. Tap New order to add the first one."}</p>`;
}
$("#oFilter").addEventListener("click", e => { const b = e.target.closest("[data-f]"); if (!b) return; oFilter = b.dataset.f; $("#oFilter").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); renderOrders(); });
$("#oSearch").addEventListener("input", e => { oQuery = e.target.value; renderOrders(); });
document.addEventListener("click", e => {
  const ed = e.target.closest("[data-edit]"); if (ed) { openEditor(S.orders.find(o => o.id === ed.dataset.edit)); return; }
  const st = e.target.closest("[data-step-to]");
  if (st) { const o = S.orders.find(x => x.id === st.dataset.o); if (o) guard(() => db.doc("orders/" + o.id).update({ status: st.dataset.stepTo, editedAt: new Date().toISOString() }), `${(o.customer || {}).name || "Order"}: ${STATUS[st.dataset.stepTo]}`); return; }
  const pd = e.target.closest("[data-paid]");
  if (pd) { const o = S.orders.find(x => x.id === pd.dataset.paid); if (o) guard(() => db.doc("orders/" + o.id).update({ paid: r2(o.total), editedAt: new Date().toISOString() }), `${(o.customer || {}).name || "Order"} marked paid`); }
});

/* ── Order editor (the cart) ──────────────────────────────────────── */
let draft = null, returnView = "orders";
let pick = { cat: null, opt: null };
function blankDraft() { return { id: null, customerId: null, customer: { name: "", phone: "", email: "", address: "" }, fulfilment: "pickup", date: addDays(TODAY, 7), time: "", items: [], shipping: 0, paid: 0, status: "new", notes: "" }; }
function openEditor(order, preset) {
  returnView = curView === "order" ? returnView : curView;
  draft = order ? JSON.parse(JSON.stringify({ ...blankDraft(), ...order, customer: { ...blankDraft().customer, ...(order.customer || {}) } })) : { ...blankDraft(), ...(preset || {}) };
  pick = { cat: null, opt: null };
  $("#edTitle").textContent = order ? `Order for ${draft.customer.name || "customer"}` : "New order";
  $("#c-name").value = draft.customer.name; $("#c-phone").value = draft.customer.phone || ""; $("#c-email").value = draft.customer.email || ""; $("#c-address").value = draft.customer.address || "";
  $("#o-date").value = draft.date || ""; $("#o-time").value = draft.time || ""; $("#o-status").value = draft.status || "new"; $("#o-notes").value = draft.notes || "";
  $("#o-shipping").value = draft.shipping ? draft.shipping : ""; $("#o-paid").value = draft.paid ? draft.paid : "";
  $("#edDelete").hidden = !order;
  renderFulfilment(); renderLinked(); renderPicker(); renderCart();
  show("order");
}
function renderFulfilment() {
  const ship = draft.fulfilment === "ship";
  $("#fulSeg").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.ful === draft.fulfilment));
  $("#dateLabel").textContent = ship ? "Ship date" : "Pickup date";
  $("#addrField").hidden = !ship; $("#shipCostField").hidden = !ship;
}
$("#fulSeg").addEventListener("click", e => { const b = e.target.closest("[data-ful]"); if (!b) return; draft.fulfilment = b.dataset.ful; renderFulfilment(); renderCart(); });

// Customer: pick a saved one while typing, or leave it as a new customer
function renderLinked() {
  const c = draft.customerId && S.customers.find(x => x.id === draft.customerId);
  $("#custLinked").hidden = !c;
  if (c) {
    const n = S.orders.filter(o => o.customerId === c.id).length;
    $("#custLinked").innerHTML = `${ico("check", "icon sm")}<span>Saved customer <b>${esc(c.name)}</b> · ${n} order${n === 1 ? "" : "s"}. Changes to their details here update their record.</span><button class="link-btn" type="button" id="unlinkCust">New customer instead</button>`;
  }
}
function renderMatches() {
  const q = $("#c-name").value.trim().toLowerCase(), box = $("#custMatches");
  const hits = q.length < 1 ? [] : S.customers.filter(c => c.id !== draft.customerId && [c.name, c.phone, c.email].join(" ").toLowerCase().includes(q)).slice(0, 6);
  box.hidden = !hits.length;
  box.innerHTML = hits.map(c => `<div class="opt"><button type="button" class="opt-pick" data-cust="${c.id}"><b>${esc(c.name)}</b><small>${esc([c.phone, c.email].filter(Boolean).join(" · ") || "No contact details")}</small></button></div>`).join("");
}
$("#c-name").addEventListener("input", renderMatches);
$("#c-name").addEventListener("focus", renderMatches);
$("#custMatches").addEventListener("mousedown", e => e.preventDefault());
$("#custMatches").addEventListener("click", e => {
  const b = e.target.closest("[data-cust]"); if (!b) return;
  const c = S.customers.find(x => x.id === b.dataset.cust); if (!c) return;
  draft.customerId = c.id;
  $("#c-name").value = c.name || ""; $("#c-phone").value = c.phone || ""; $("#c-email").value = c.email || "";
  if (c.address) $("#c-address").value = c.address;
  $("#custMatches").hidden = true; renderLinked();
});
document.addEventListener("click", e => {
  if (e.target.closest("#unlinkCust")) { draft.customerId = null; renderLinked(); $("#c-name").focus(); }
  if (!e.target.closest("#c-name") && !e.target.closest("#custMatches")) $("#custMatches").hidden = true;
});

// Item picker
function renderPicker() {
  const cats = catalogSorted();
  $("#pickCats").innerHTML = cats.map(c => `<button type="button" class="chip" data-pcat="${c.id}" aria-pressed="${c.id === pick.cat}">${esc(c.name)}</button>`).join("")
    || `<span class="meta">No product categories yet. Add them on the Products screen.</span>`;
  const cat = cats.find(c => c.id === pick.cat);
  $("#pickOptsField").hidden = !cat;
  $("#pickOpts").innerHTML = cat ? ((cat.options || []).map(o => `<button type="button" class="chip" data-popt="${o.id}" aria-pressed="${o.id === pick.opt}">${esc(o.name)}<span class="price">${o.price ? money(o.price) : "no price"}</span></button>`).join("") || `<span class="meta">This category has no options yet. Add them on the Products screen.</span>`) : "";
  $("#pickMore").hidden = !(cat && pick.opt);
}
$("#pickCats").addEventListener("click", e => { const b = e.target.closest("[data-pcat]"); if (!b) return; pick = { cat: b.dataset.pcat, opt: null }; renderPicker(); });
$("#pickOpts").addEventListener("click", e => {
  const b = e.target.closest("[data-popt]"); if (!b) return;
  pick.opt = b.dataset.popt;
  const o = (S.catalog.find(c => c.id === pick.cat)?.options || []).find(x => x.id === pick.opt);
  $("#pickQty").value = 1; $("#pickPrice").value = o?.price ? r2(o.price) : ""; $("#pickNote").value = "";
  renderPicker(); $("#pickNote").focus();
});
$("#pickMore").addEventListener("click", e => { const b = e.target.closest("[data-step]"); if (!b) return; $("#pickQty").value = Math.max(1, (parseInt($("#pickQty").value) || 1) + Number(b.dataset.step)); });
$("#pickAdd").addEventListener("click", () => {
  const cat = S.catalog.find(c => c.id === pick.cat), o = (cat?.options || []).find(x => x.id === pick.opt);
  if (!cat || !o) return;
  draft.items.push({ id: uid(), catId: cat.id, cat: cat.name, optId: o.id, opt: o.name, qty: Math.max(1, parseInt($("#pickQty").value) || 1), price: r2($("#pickPrice").value), note: $("#pickNote").value.trim() });
  pick.opt = null; renderPicker(); renderCart();
  toast(`Added ${cat.name} · ${o.name}`);
});

// Cart
function renderCart() {
  $("#cart").innerHTML = draft.items.length ? draft.items.map(i => `<div class="cart-line" data-line="${i.id}">
      <div><b>${esc(i.cat)} · ${esc(i.opt)}</b>${i.note ? `<div class="note">${esc(i.note)}</div>` : ""}</div>
      <div class="stepper"><button type="button" data-q="-1" aria-label="One fewer">${ico("minus", "icon sm")}</button><input type="number" min="1" value="${i.qty}" data-field="qty" aria-label="Quantity"><button type="button" data-q="1" aria-label="One more">${ico("plus", "icon sm")}</button></div>
      <input class="price-in" type="number" min="0" step="0.01" value="${i.price || ""}" placeholder="0.00" data-field="price" aria-label="Price each">
      <div style="display:flex; align-items:center; gap:4px"><span class="line-total money">${money(i.qty * i.price)}</span><button type="button" class="x-btn" data-remove aria-label="Remove">${ico("x", "icon sm")}</button></div>
    </div>`).join("") : `<p class="empty">No items yet. Add them above.</p>`;
  renderTotals();
}
function renderTotals() {
  draft.shipping = r2($("#o-shipping").value); draft.paid = r2($("#o-paid").value);
  const t = calc(draft), bal = Math.max(0, r2(t.total - draft.paid));
  $("#totals").innerHTML = `<div><span>Items</span><span class="money">${money(t.subtotal)}</span></div>
    ${draft.fulfilment === "ship" ? `<div><span>Shipping</span><span class="money">${money(t.shipping)}</span></div>` : ""}
    ${t.taxRate ? `<div><span>${esc(S.config.taxName || "Tax")} ${t.taxRate}%</span><span class="money">${money(t.tax)}</span></div>` : ""}
    <div class="grand"><span>Total</span><span class="money">${money(t.total)}</span></div>
    ${draft.paid ? `<div><span>Paid</span><span class="money">${money(draft.paid)}</span></div>` : ""}
    <div class="${bal > 0 ? "owe" : ""}"><span>${bal > 0 ? "Balance owing" : "Nothing owing"}</span><span class="money">${money(bal)}</span></div>`;
}
$("#cart").addEventListener("click", e => {
  const line = e.target.closest("[data-line]"); if (!line) return;
  const i = draft.items.find(x => x.id === line.dataset.line);
  if (e.target.closest("[data-remove]")) { draft.items = draft.items.filter(x => x !== i); renderCart(); return; }
  const q = e.target.closest("[data-q]"); if (q) { i.qty = Math.max(1, i.qty + Number(q.dataset.q)); renderCart(); }
});
$("#cart").addEventListener("change", e => {
  const line = e.target.closest("[data-line]"), f = e.target.dataset.field; if (!line || !f) return;
  const i = draft.items.find(x => x.id === line.dataset.line);
  if (f === "qty") i.qty = Math.max(1, parseInt(e.target.value) || 1); else i.price = r2(e.target.value);
  renderCart();
});
["#o-shipping", "#o-paid"].forEach(k => $(k).addEventListener("input", renderTotals));

async function saveDraft() {
  const name = $("#c-name").value.trim();
  if (!name) { $("#c-name").focus(); toast("Add the customer's name"); return; }
  if (!draft.items.length) { toast("Add at least one item"); return; }
  if (!$("#o-date").value) { $("#o-date").focus(); toast(`Add the ${draft.fulfilment === "ship" ? "ship" : "pickup"} date`); return; }
  const customer = { name, phone: $("#c-phone").value.trim(), email: $("#c-email").value.trim(), address: $("#c-address").value.trim() };
  const now = new Date().toISOString();
  $("#edSave").disabled = true;
  try {
    // Save the customer: update the linked record, or create a new one.
    let customerId = draft.customerId;
    if (customerId) {
      const cur = S.customers.find(c => c.id === customerId) || {};
      if (["name", "phone", "email", "address"].some(k => (customer[k] || "") !== (cur[k] || "") && (k !== "address" || customer.address))) {
        const upd = { name: customer.name, phone: customer.phone, email: customer.email };
        if (customer.address) upd.address = customer.address;
        if (!(await guard(() => db.doc("customers/" + customerId).update(upd)))) return;
      }
    } else {
      let ref; if (!(await guard(async () => { ref = await db.collection("customers").add({ ...customer, notes: "", createdAt: now, by: me?.id || null }); }))) return;
      customerId = ref.id;
    }
    const t = calc(draft);
    const order = { customerId, customer, fulfilment: draft.fulfilment, date: $("#o-date").value, time: $("#o-time").value || "",
      items: draft.items, ...t, paid: r2($("#o-paid").value), status: $("#o-status").value, notes: $("#o-notes").value.trim() };
    const ok = draft.id
      ? await guard(() => db.doc("orders/" + draft.id).set({ ...stripId(S.orders.find(o => o.id === draft.id)), ...order, editedAt: now, editedBy: me?.id || null }), "Order updated")
      : await guard(() => db.collection("orders").add({ ...order, createdAt: now, by: me?.id || null }), "Order saved");
    if (ok) { draft = null; show(["calendar", "customers"].includes(returnView) ? returnView : "orders"); }
  } finally { $("#edSave").disabled = false; }
}
const stripId = o => { if (!o) return {}; const { id, ...rest } = o; return rest; };
$("#edSave").addEventListener("click", saveDraft);
$("#edCancel").addEventListener("click", () => { draft = null; show(returnView); });
$("#edBack").addEventListener("click", () => { draft = null; show(returnView); });
$("#edDelete").addEventListener("click", e => {
  const b = e.currentTarget, id = draft?.id; if (!id) return;
  armOrConfirm(b, "o" + id, async () => { if (await guard(() => db.doc("orders/" + id).delete(), "Order deleted")) { draft = null; show(returnView); } });
});
document.addEventListener("click", e => { if (e.target.closest("[data-new-order]")) openEditor(null); });

/* ── Calendar ─────────────────────────────────────────────────────── */
let calY = NOW.getFullYear(), calM = NOW.getMonth(), calSel = TODAY;
function renderCalendar() {
  $("#calLabel").textContent = new Date(calY, calM, 1).toLocaleDateString("en-CA", { month: "long", year: "numeric" });
  const first = new Date(calY, calM, 1), start = new Date(calY, calM, 1 - first.getDay());
  const items = S.orders.filter(o => o.date && o.status !== "cancelled");
  let h = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => `<div class="dow">${d}</div>`).join("");
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    if (i === 35 && d.getMonth() !== calM) break;
    const key = isoOf(d), evs = items.filter(o => o.date === key).sort(byWhen);
    h += `<button type="button" class="day${d.getMonth() !== calM ? " out" : ""}${key === TODAY ? " today" : ""}" data-d="${key}" aria-pressed="${key === calSel}" aria-label="${fmtLong(key)}, ${evs.length} orders">
      <span class="num">${d.getDate()}</span><span class="evs">${evs.slice(0, 3).map(o => `<span class="cal-ev" style="--c:${o.fulfilment === "ship" ? "var(--t-spray)" : "var(--t-pickup)"}">${ico(o.fulfilment === "ship" ? "truck" : "store")}<span>${esc((o.customer || {}).name || "Order")}</span></span>`).join("")}</span>${evs.length > 3 ? `<span class="cal-more">+${evs.length - 3} more</span>` : ""}</button>`;
  }
  $("#cal").innerHTML = h;
  const sel = items.filter(o => o.date === calSel).sort(byWhen);
  $("#calDay").innerHTML = `<div class="day-list"><h3>${fmtLong(calSel)}</h3>${sel.length ? sel.map(orderCard).join("") : `<p class="empty">No pickups or shipments.</p>`}</div>`;
}
$("#cal").addEventListener("click", e => { const b = e.target.closest("[data-d]"); if (b) { calSel = b.dataset.d; renderCalendar(); } });
$("#calPrev").addEventListener("click", () => { calM--; if (calM < 0) { calM = 11; calY--; } renderCalendar(); });
$("#calNext").addEventListener("click", () => { calM++; if (calM > 11) { calM = 0; calY++; } renderCalendar(); });

/* ── Customers ────────────────────────────────────────────────────── */
let cQuery = "", cEditing = null; // id, or "new"
function custForm(c) {
  return `<div class="cust-form" data-cform="${c.id || "new"}">
    <div class="field"><label>Name</label><input data-cf="name" value="${esc(c.name)}"></div>
    <div class="field"><label>Phone</label><input data-cf="phone" type="tel" value="${esc(c.phone)}"></div>
    <div class="field"><label>Email</label><input data-cf="email" type="email" value="${esc(c.email)}"></div>
    <div class="field"><label>Address</label><input data-cf="address" value="${esc(c.address)}"></div>
    <div class="field full"><label>Notes</label><textarea data-cf="notes" rows="2">${esc(c.notes)}</textarea></div>
    <div class="ed-actions full"><button class="btn primary sm" type="button" data-csave>Save</button><button class="btn outline sm" type="button" data-ccancel>Cancel</button>
      <span class="spacer"></span>${c.id ? `<button class="del-btn" type="button" data-cdel="${c.id}">${ico("trash-2", "icon sm")}Delete</button>` : ""}</div></div>`;
}
function renderCustomers() {
  const q = cQuery.trim().toLowerCase();
  const list = S.customers.filter(c => !q || [c.name, c.phone, c.email].join(" ").toLowerCase().includes(q)).sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  $("#cList").innerHTML = (cEditing === "new" ? `<div class="cust">${custForm({})}</div>` : "") + (list.map(c => {
    const mine = S.orders.filter(o => o.customerId === c.id && o.status !== "cancelled");
    const spent = mine.reduce((t, o) => t + (Number(o.total) || 0), 0), owing = mine.reduce((t, o) => t + owes(o), 0);
    return `<div class="cust"><div class="cust-top"><div class="row-main">
        <span class="row-title">${esc(c.name)}</span>
        <span class="meta">${[c.phone, c.email].filter(Boolean).map(esc).join(" · ") || "No contact details"}</span>
        <span class="meta">${mine.length} order${mine.length === 1 ? "" : "s"} · ${money(spent)} total${owing > 0 ? ` · <span style="color:var(--warn)">owes ${money(owing)}</span>` : ""}</span></div>
      <div class="o-actions" style="margin:0">
        <button class="btn sm primary" type="button" data-cnew="${c.id}">${ico("plus", "icon sm")}New order</button>
        ${mine.length ? `<button class="btn sm outline" type="button" data-corders="${esc(c.name)}">Orders</button>` : ""}
        <button class="btn sm outline" type="button" data-cedit="${c.id}">${ico("pencil", "icon sm")}Edit</button></div></div>
      ${cEditing === c.id ? custForm(c) : ""}</div>`;
  }).join("") || (cEditing === "new" ? "" : `<p class="empty">${S.customers.length ? "No customers match." : "No customers yet. They're added automatically when you save an order."}</p>`));
}
$("#cSearch").addEventListener("input", e => { cQuery = e.target.value; renderCustomers(); });
$("#addCust").addEventListener("click", () => { cEditing = "new"; renderCustomers(); $("#cList [data-cf=name]")?.focus(); });
$("#cList").addEventListener("click", async e => {
  const t = e.target;
  if (t.closest("[data-cnew]")) { const c = S.customers.find(x => x.id === t.closest("[data-cnew]").dataset.cnew); openEditor(null, { customerId: c.id, customer: { name: c.name || "", phone: c.phone || "", email: c.email || "", address: c.address || "" } }); return; }
  if (t.closest("[data-corders]")) { oQuery = t.closest("[data-corders]").dataset.corders; $("#oSearch").value = oQuery; oFilter = "all"; $("#oFilter").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x.dataset.f === "all")); show("orders"); return; }
  if (t.closest("[data-cedit]")) { cEditing = t.closest("[data-cedit]").dataset.cedit; renderCustomers(); return; }
  if (t.closest("[data-ccancel]")) { cEditing = null; renderCustomers(); return; }
  if (t.closest("[data-cdel]")) { const b = t.closest("[data-cdel]"), id = b.dataset.cdel; armOrConfirm(b, "c" + id, async () => { if (await guard(() => db.doc("customers/" + id).delete(), "Customer deleted. Their past orders are kept.")) { cEditing = null; renderCustomers(); } }); return; }
  if (t.closest("[data-csave]")) {
    const f = t.closest("[data-cform]"), v = {};
    f.querySelectorAll("[data-cf]").forEach(i => v[i.dataset.cf] = i.value.trim());
    if (!v.name) { toast("Add a name"); return; }
    const id = f.dataset.cform;
    const ok = id === "new" ? await guard(() => db.collection("customers").add({ ...v, createdAt: new Date().toISOString(), by: me?.id || null }), "Customer added")
      : await guard(() => db.doc("customers/" + id).update(v), "Customer updated");
    if (ok) { cEditing = null; renderCustomers(); }
  }
});

/* ── Products (categories, options, prices) and settings ─────────── */
function renderProducts() {
  if (document.activeElement && $("#catList").contains(document.activeElement)) return; // don't disturb typing
  $("#catList").innerHTML = catalogSorted().map(c => `<div class="cat" data-cat="${c.id}">
      <div class="cat-head"><input value="${esc(c.name)}" data-cname aria-label="Category name"><button class="del-btn" type="button" data-cat-del>${ico("trash-2", "icon sm")}Delete</button></div>
      ${(c.options || []).map(o => `<div class="opt-row" data-opt="${o.id}"><input value="${esc(o.name)}" data-oname aria-label="Option name">
        <span class="money-in">$<input type="number" min="0" step="0.01" value="${o.price || ""}" placeholder="0.00" data-oprice aria-label="Price"></span>
        <button class="x-btn" type="button" data-odel aria-label="Delete ${esc(o.name)}">${ico("x", "icon sm")}</button></div>`).join("")}
      <div class="opt-row new"><input placeholder="New option, e.g. Extra large" data-newopt aria-label="New option name">
        <span class="money-in">$<input type="number" min="0" step="0.01" placeholder="0.00" data-newprice aria-label="New option price"></span>
        <button class="btn sm outline" type="button" data-oadd>Add</button></div>
    </div>`).join("") || `<p class="empty">No categories yet. Add one below.</p>`;
}
const catById = id => S.catalog.find(c => c.id === id);
const saveCat = c => guard(() => db.doc("catalog/" + c.id).set(stripId(c)));
$("#catList").addEventListener("change", e => {
  const box = e.target.closest("[data-cat]"); if (!box) return;
  const c = JSON.parse(JSON.stringify(catById(box.dataset.cat)));
  if (e.target.matches("[data-cname]")) { if (!e.target.value.trim()) { e.target.value = c.name; return; } c.name = e.target.value.trim(); }
  const row = e.target.closest("[data-opt]");
  if (row) {
    const o = c.options.find(x => x.id === row.dataset.opt);
    if (e.target.matches("[data-oname]")) { if (!e.target.value.trim()) { e.target.value = o.name; return; } o.name = e.target.value.trim(); }
    if (e.target.matches("[data-oprice]")) o.price = r2(e.target.value);
  }
  if (e.target.matches("[data-cname],[data-oname],[data-oprice]")) saveCat(c).then(ok => ok && toast("Saved"));
});
$("#catList").addEventListener("click", e => {
  const box = e.target.closest("[data-cat]"); if (!box) return;
  const c = JSON.parse(JSON.stringify(catById(box.dataset.cat)));
  if (e.target.closest("[data-cat-del]")) { const b = e.target.closest("[data-cat-del]"); armOrConfirm(b, "cat" + c.id, () => guard(() => db.doc("catalog/" + c.id).delete(), `Deleted ${c.name}. Past orders keep their items.`)); return; }
  if (e.target.closest("[data-odel]")) { const id = e.target.closest("[data-opt]").dataset.opt; c.options = c.options.filter(o => o.id !== id); document.activeElement?.blur(); saveCat(c).then(ok => ok && toast("Option deleted")); return; }
  if (e.target.closest("[data-oadd]")) {
    const name = box.querySelector("[data-newopt]").value.trim(); if (!name) { box.querySelector("[data-newopt]").focus(); return; }
    c.options = [...(c.options || []), { id: "o" + uid(), name, price: r2(box.querySelector("[data-newprice]").value) }];
    document.activeElement?.blur(); saveCat(c).then(ok => ok && toast(`Added ${name}`));
  }
});
$("#catList").addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches("[data-newopt],[data-newprice]")) { e.preventDefault(); e.target.closest("[data-cat]").querySelector("[data-oadd]").click(); } });
$("#catList").addEventListener("focusout", () => setTimeout(() => { if (!$("#catList").contains(document.activeElement)) renderProducts(); }, 50));
$("#addCat").addEventListener("click", () => {
  const name = $("#newCat").value.trim(); if (!name) { $("#newCat").focus(); return; }
  const sort = Math.max(0, ...S.catalog.map(c => c.sort || 0)) + 1;
  guard(() => db.collection("catalog").add({ name, sort, options: [] }), `Added ${name}`).then(ok => { if (ok) $("#newCat").value = ""; });
});
$("#newCat").addEventListener("keydown", e => { if (e.key === "Enter") $("#addCat").click(); });
function renderSettings() {
  const c = S.config;
  if (document.activeElement?.id?.startsWith("s-")) return;
  $("#s-name").value = c.businessName || ""; $("#s-taxname").value = c.taxName || ""; $("#s-taxrate").value = c.taxRate || 0;
}
["#s-name", "#s-taxname", "#s-taxrate"].forEach(k => $(k).addEventListener("change", () => {
  const v = { businessName: $("#s-name").value.trim() || "Rough Cut Dezigns", taxName: $("#s-taxname").value.trim() || "Tax", taxRate: Math.max(0, r2($("#s-taxrate").value)) };
  guard(() => db.doc("config/main").set(v), "Settings saved");
}));
$("#exportBtn").addEventListener("click", () => {
  const out = { app: "Rough Cut Dezigns", exportedAt: new Date().toISOString(), orders: S.orders, customers: S.customers, catalog: S.catalog, config: [{ id: "main", ...S.config }] };
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: "application/json" })); a.download = `rough-cut-orders-${TODAY}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
});
let sheetInfo = null;
async function renderSheetLinks() {
  if (!window.pb) return;
  try { sheetInfo ||= await pb.send("/api/shop/csv-links", {}); } catch { return; }
  if (!sheetInfo?.key) return;
  const url = f => `${location.origin}/api/shop/csv/${f}?key=${encodeURIComponent(sheetInfo.key)}`;
  $("#sheetLinks").innerHTML = (/^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname) ? `<div class="empty-box" style="margin-bottom:8px">${ico("circle-alert", "icon sm")}<span>These links use this Mac's local address, which Google can't reach. Open Orders at its .ts.net address and copy the links from there.</span></div>` : "")
    + sheetInfo.files.map((f, i) => `<div class="sheet-row"><div><b>${esc(f.name)}</b><div class="meta">${esc(f.description)}</div></div>
      <input readonly id="sheet-${i}" value="${esc(`=IMPORTDATA("${url(f.name)}")`)}" aria-label="Google Sheets formula for ${esc(f.name)}">
      <button class="btn sm outline" type="button" data-copy="sheet-${i}">Copy</button></div>`).join("");
  $("#sheetsUnit").hidden = false;
}
$("#sheetLinks").addEventListener("click", async e => {
  const b = e.target.closest("[data-copy]"); if (!b) return; const inp = $("#" + b.dataset.copy);
  try { await navigator.clipboard.writeText(inp.value); toast("Copied. Paste it into cell A1 of a Google Sheet."); } catch { inp.select(); toast("Selected. Copy it, then paste into a Google Sheet."); }
});

/* ── Navigation and rendering ─────────────────────────────────────── */
const VIEWS = ["orders", "order", "calendar", "customers", "products"];
let curView = "orders";
function show(v) {
  if (!VIEWS.includes(v)) v = "orders";
  if (v === "order" && !draft) v = "orders";
  curView = v;
  VIEWS.forEach(x => $("#v-" + x).hidden = x !== v);
  document.querySelectorAll("[data-view]").forEach(a => a.dataset.view === (v === "order" ? "orders" : v) && !a.classList.contains("wordmark") ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
  renderView(); scrollTo(0, 0);
}
document.addEventListener("click", e => { const a = e.target.closest("[data-view]"); if (!a) return; e.preventDefault(); if (draft && curView === "order") draft = null; show(a.dataset.view); });
function renderView() {
  if (curView === "orders") renderOrders();
  if (curView === "order" && draft) { renderPicker(); renderLinked(); renderTotals(); }
  if (curView === "calendar") renderCalendar();
  if (curView === "customers") renderCustomers();
  if (curView === "products") { renderProducts(); renderSettings(); renderSheetLinks(); }
}
let rq = 0;
function renderAll() {
  cancelAnimationFrame(rq);
  rq = requestAnimationFrame(() => {
    const n = S.config.businessName || "Rough Cut Dezigns";
    document.title = n + " Orders";
    renderView();
  });
}
$("#todayLabel").textContent = NOW.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
paintIcons();
show(location.hash.slice(1) === "order" ? "orders" : location.hash.slice(1));
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(err => console.warn("service worker", err));

/* ── Connect ──────────────────────────────────────────────────────── */
(async () => {
  const C = window.claude; if (!C?.use) return;
  const [dbNs, userNs] = await Promise.all([C.use("db"), C.use("user")]);
  if (!dbNs) return; // not signed in: the sign-in screen is showing
  db = dbNs;
  if (userNs) { me = await userNs.me(); if (me?.avatarUrl) $("#avatar").innerHTML = `<img alt="" src="${esc(me.avatarUrl)}">`; }
  const first = new Set(["orders", "customers", "catalog"]);
  ["orders", "customers", "catalog"].forEach(name => db.collection(name).onSnapshot(snap => {
    S[name] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    first.delete(name); if (!first.size && !loaded) { loaded = true; showSync(); }
    renderAll();
  }));
  db.doc("config/main").onSnapshot(snap => { if (snap.exists) S.config = { ...S.config, ...snap.data() }; renderAll(); });
})();
