// CSV exports of the farm's data, for Google Sheets, Excel and charting tools.
// Used by exports.pb.js for the nightly files and the live links.

const FILES = {
  "events.csv": "Every logged and planned event",
  "harvests.csv": "Harvests only, with the amount split into number and unit",
  "orders.csv": "Customer orders, including phone numbers",
  "notes.csv": "Notes for next season",
  "weather-daily.csv": "Daily weather for Corinth with season growing degree days",
};

const readAll = (app, name) => {
  try {
    return app.findAllRecords(name).map((r) => {
      const raw = r.getString("data");
      return { id: r.id, ...(raw ? JSON.parse(raw) : {}) };
    });
  } catch (_) {
    return [];
  }
};

function peopleNames(app) {
  const names = {};
  try { app.findAllRecords("users").forEach((u) => { names[u.id] = u.getString("name") || u.getString("email"); }); } catch (_) {}
  return names;
}

// Text that starts with = + @ is escaped so spreadsheets never run it as a formula.
function cell(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return isFinite(v) ? String(v) : "";
  let s = Array.isArray(v) ? v.join("; ") : String(v);
  if (/^[=+@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const toCSV = (header, rows) => [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";

const TYPE_NAMES = { spray: "Spray", planting: "Planting", nutrient: "Nutrient", harvest: "Harvest", garden: "Garden" };
const typeName = (t) => TYPE_NAMES[t] || t || "";
const byDate = (a, b) => String(a.date || "").localeCompare(String(b.date || "")) || String(a.time || "").localeCompare(String(b.time || ""));

function isoWeek(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - y0) / 864e5 + 1) / 7);
}

function parseAmount(s) {
  const m = String(s || "").match(/([\d.,]+)\s*([A-Za-z]+)?/);
  if (!m) return [null, ""];
  const n = parseFloat(m[1].replace(/,/g, ""));
  return [isFinite(n) ? n : null, (m[2] || "").toLowerCase()];
}

function build(app, file) {
  const who = peopleNames(app);
  const by = (id) => (id ? who[id] || "" : "");

  if (file === "events.csv") {
    const rows = readAll(app, "events").filter((e) => e.date).sort(byDate).map((e) => {
      const d = e.details || {};
      const other = Object.keys(d).filter((k) => !["Amount", "Rate"].includes(k)).map((k) => `${k}: ${d[k]}`).join("; ");
      return [e.date, Number(e.date.slice(0, 4)), typeName(e.type), e.what, e.crops || [], e.fields || [], d.Amount, d.Rate, other,
        e.desc, e.status === "planned" ? "Planned" : "Done", by(e.by), e.src === "spreadsheet" ? "Spreadsheet import" : e.src === "handwritten" ? "Handwritten notes" : "App", e.createdAt, e.id];
    });
    return toCSV(["date", "year", "type", "what", "crops", "fields", "amount", "rate", "other_details", "description", "status", "logged_by", "source", "logged_at", "id"], rows);
  }

  if (file === "harvests.csv") {
    const rows = readAll(app, "events").filter((e) => e.date && e.type === "harvest" && e.status !== "planned").sort(byDate).map((e) => {
      const d = e.details || {};
      const [n, unit] = parseAmount(d.Amount);
      return [e.date, Number(e.date.slice(0, 4)), isoWeek(e.date), (e.crops || [])[0] || "", e.crops || [], e.what, n, unit, d.Destination, e.fields || [], by(e.by), e.id];
    });
    return toCSV(["date", "year", "week", "crop", "all_crops", "what", "amount", "unit", "destination", "fields", "logged_by", "id"], rows);
  }

  if (file === "orders.csv") {
    const rows = readAll(app, "orders").sort(byDate).map((o) => {
      const total = Number(o.total) || 0, paid = Number(o.paid) || 0;
      const status = o.status === "done" ? "Picked up" : o.status === "new" ? "New (not confirmed)" : "Upcoming";
      return [o.date, o.time, o.name, o.phone, o.items, total, paid, Math.max(0, Math.round((total - paid) * 100) / 100), status, o.source, by(o.by), o.createdAt, o.editedAt, o.id];
    });
    return toCSV(["pickup_date", "pickup_time", "customer", "phone", "items", "total", "paid", "owed", "status", "source", "entered_by", "entered_at", "last_edited_at", "id"], rows);
  }

  if (file === "notes.csv") {
    const rows = readAll(app, "notes").sort((a, b) => String(a.due || "").localeCompare(String(b.due || ""))).map((n) =>
      [n.crop, n.due, n.text, n.done ? "Resolved" : "Open", by(n.by), n.createdAt, n.id]);
    return toCSV(["crop", "remind_month", "note", "status", "written_by", "written_at", "id"], rows);
  }

  if (file === "weather-daily.csv") {
    const rows = [];
    readAll(app, "weather").filter((w) => /^\d{4}$/.test(w.id)).sort((a, b) => a.id.localeCompare(b.id)).forEach((w) => {
      let season = 0;
      Object.keys(w.days || {}).sort().forEach((md) => {
        const [mean, min, max, rain] = w.days[md];
        const gdd = Math.max(0, mean - 10);
        const inSeason = md >= "04-01" && md <= "10-31";
        if (inSeason) season += gdd;
        rows.push([`${w.id}-${md}`, Number(w.id), mean, min, max, rain, Math.round(gdd * 10) / 10, inSeason ? Math.round(season) : ""]);
      });
    });
    return toCSV(["date", "year", "mean_c", "min_c", "max_c", "rain_in", "gdd_base10", "gdd_season_total_since_apr1"], rows);
  }

  throw new Error("Unknown file " + file);
}

function exportKey(app) {
  try {
    const raw = app.findRecordById("farm_config", "exports").getString("data");
    return (raw ? JSON.parse(raw) : {}).key || "";
  } catch (_) {
    return "";
  }
}

// Folder next to the database: ~/FarmLog/exports on the Mac mini.
function exportDir(app) {
  return app.dataDir().replace(/\/pb_data\/?$/, "") + "/exports";
}

/** Writes every CSV to the exports folder, plus a dated copy kept for 30 days. */
function writeAll(app) {
  const dir = exportDir(app);
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const hist = `${dir}/history/${stamp}`;
  $os.mkdirAll(hist, 0o755);
  Object.keys(FILES).forEach((f) => {
    const csv = build(app, f);
    $os.writeFile(`${dir}/${f}`, csv, 0o644);
    $os.writeFile(`${hist}/${f}`, csv, 0o644);
  });
  // Keep 30 days of dated copies.
  try {
    const cutoff = new Date(d.getTime() - 30 * 864e5).toISOString().slice(0, 10);
    $os.readDir(`${dir}/history`).forEach((entry) => {
      const name = entry.name();
      if (/^\d{4}-\d{2}-\d{2}$/.test(name) && name < cutoff) $os.removeAll(`${dir}/history/${name}`);
    });
  } catch (err) {
    console.log("[exports] couldn't tidy old copies:", err);
  }
  console.log(`[exports] wrote ${Object.keys(FILES).length} CSV files to ${dir}`);
  return { dir, files: Object.keys(FILES), date: stamp };
}

module.exports = { FILES, build, exportKey, writeAll, exportDir };
