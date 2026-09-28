// CSV exports for Rough Cut Dezigns Orders: nightly files and live Google Sheets links (see exports.pb.js).

const FILES = {
  "orders.csv": "One row per order: customer, dates, status and totals",
  "order-items.csv": "One row per item sold: category, option, quantity and price",
  "customers.csv": "Saved customers with their order count, total spent and balance owing",
};

const readAll = (app, name) => {
  try {
    return app.findAllRecords(name).map((r) => { const raw = r.getString("data"); return { id: r.id, ...(raw ? JSON.parse(raw) : {}) }; });
  } catch (_) { return []; }
};
function cell(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return isFinite(v) ? String(Math.round(v * 100) / 100) : "";
  let s = String(v);
  if (/^[=+@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const toCSV = (header, rows) => [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
const STATUS = { new: "Ordered", making: "In progress", ready: "Ready", done: "Completed", cancelled: "Cancelled" };
const byDate = (a, b) => String(a.date || "").localeCompare(String(b.date || "")) || String(a.time || "").localeCompare(String(b.time || ""));
const owed = (o) => Math.max(0, (Number(o.total) || 0) - (Number(o.paid) || 0));

function build(app, file) {
  const orders = readAll(app, "orders").sort(byDate);
  if (file === "orders.csv") {
    return toCSV(["order_id", "date", "time", "pickup_or_ship", "status", "customer", "phone", "email", "address", "items", "subtotal", "shipping", "tax", "total", "paid", "owed", "notes", "entered_at"],
      orders.map((o) => {
        const c = o.customer || {};
        const items = (o.items || []).map((i) => `${i.qty}× ${i.cat} · ${i.opt}${i.note ? ` (${i.note})` : ""}`).join("; ");
        return [o.id, o.date, o.time, o.fulfilment === "ship" ? "Ship" : "Pickup", STATUS[o.status] || o.status, c.name, c.phone, c.email, c.address, items,
          o.subtotal, o.shipping, o.tax, o.total, o.paid, owed(o), o.notes, o.createdAt];
      }));
  }
  if (file === "order-items.csv") {
    const rows = [];
    orders.forEach((o) => (o.items || []).forEach((i) => rows.push([o.id, o.date, (o.customer || {}).name, STATUS[o.status] || o.status, i.cat, i.opt, i.qty, i.price, (Number(i.qty) || 0) * (Number(i.price) || 0), i.note])));
    return toCSV(["order_id", "date", "customer", "status", "category", "option", "quantity", "unit_price", "line_total", "note"], rows);
  }
  if (file === "customers.csv") {
    return toCSV(["customer", "phone", "email", "address", "orders", "total_spent", "owed", "notes", "id"],
      readAll(app, "customers").sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))).map((c) => {
        const mine = orders.filter((o) => o.customerId === c.id && o.status !== "cancelled");
        return [c.name, c.phone, c.email, c.address, mine.length, mine.reduce((t, o) => t + (Number(o.total) || 0), 0), mine.reduce((t, o) => t + owed(o), 0), c.notes, c.id];
      }));
  }
  throw new Error("Unknown file " + file);
}

function exportKey(app) {
  try { const raw = app.findRecordById("shop_admin", "exports").getString("data"); return (raw ? JSON.parse(raw) : {}).key || ""; } catch (_) { return ""; }
}
const exportDir = (app) => app.dataDir().replace(/\/pb_data\/?$/, "") + "/exports";

function writeAll(app) {
  const dir = exportDir(app);
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const hist = `${dir}/history/${stamp}`;
  $os.mkdirAll(hist, 0o755);
  Object.keys(FILES).forEach((f) => { const csv = build(app, f); $os.writeFile(`${dir}/${f}`, csv, 0o644); $os.writeFile(`${hist}/${f}`, csv, 0o644); });
  try {
    const cutoff = new Date(d.getTime() - 30 * 864e5).toISOString().slice(0, 10);
    $os.readDir(`${dir}/history`).forEach((e) => { if (/^\d{4}-\d{2}-\d{2}$/.test(e.name()) && e.name() < cutoff) $os.removeAll(`${dir}/history/${e.name()}`); });
  } catch (_) {}
  return { dir, files: Object.keys(FILES), date: stamp };
}

module.exports = { FILES, build, exportKey, writeAll };
