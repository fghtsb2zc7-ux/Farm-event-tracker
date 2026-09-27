// Readings from the farm's own Ambient Weather station (WS-2902) via the Ambient Weather Network API.
// Used by ambient.pb.js.
//
// Stores, in the "weather" collection:
//   "station"      current conditions (updated every 5 minutes)
//   "station2026"  daily summaries for that year: days["MM-DD"] = [mean °C, min °C, max °C, rain in]
// The app prefers these over Open-Meteo for any day the station covers.

const API = "https://api.ambientweather.net/v1";

const pad = (n) => String(n).padStart(2, "0");
const localDate = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const fToC = (f) => (typeof f === "number" ? Math.round(((f - 32) * 5 / 9) * 10) / 10 : null);
const mphToKmh = (m) => (typeof m === "number" ? Math.round(m * 1.609344 * 10) / 10 : null);
const inHgToKpa = (p) => (typeof p === "number" ? Math.round(p * 3.386389 * 10) / 10 : null);
const num = (v) => (typeof v === "number" && isFinite(v) ? v : null);

function readData(app, id) {
  try {
    const rec = app.findRecordById(id === "ambient" ? "farm_config" : "weather", id);
    const raw = rec.getString("data");
    return { rec, data: raw ? JSON.parse(raw) : {} };
  } catch (_) {
    return { rec: null, data: {} };
  }
}

function writeWeather(app, id, rec, data) {
  if (!rec) {
    rec = new Record(app.findCollectionByNameOrId("weather"));
    rec.set("id", id);
  }
  rec.set("data", data);
  app.save(rec);
}

function settings(app) {
  const s = readData(app, "ambient").data;
  return { apiKey: (s.apiKey || "").trim(), applicationKey: (s.applicationKey || "").trim(), macAddress: (s.macAddress || "").trim(), apiBase: (s.apiBase || API).trim() };
}
const configured = (app) => { const s = settings(app); return !!(s.apiKey && s.applicationKey); };

function get(s, path, params) {
  const q = Object.assign({ apiKey: s.apiKey, applicationKey: s.applicationKey }, params || {});
  const qs = Object.keys(q).map((k) => `${k}=${encodeURIComponent(q[k])}`).join("&");
  const res = $http.send({ url: `${s.apiBase}${path}?${qs}`, method: "GET", timeout: 30 });
  if (res.statusCode === 429) throw new Error("Ambient Weather is rate-limiting requests; will retry next time");
  if (res.statusCode === 401 || res.statusCode === 403) throw new Error("Ambient Weather didn't accept the API keys. Check them in farm_config → ambient.");
  if (res.statusCode !== 200) throw new Error(`Ambient Weather returned ${res.statusCode}`);
  return res.json;
}

/** Current conditions in metric (rain stays in inches, like the rest of the app). */
function current(d, info) {
  const soil = {};
  Object.keys(d).forEach((k) => {
    let m;
    if ((m = k.match(/^soilhum(\d+)$/))) soil[`moisture${m[1]}`] = num(d[k]);
    if ((m = k.match(/^soiltemp(\d+)f?$/))) soil[`temp${m[1]}`] = fToC(d[k]);
  });
  return {
    at: new Date(num(d.dateutc) || Date.now()).toISOString(),
    name: info?.name || "Farm station",
    tempC: fToC(d.tempf), feelsLikeC: fToC(d.feelsLike), dewPointC: fToC(d.dewPoint),
    humidity: num(d.humidity),
    windKmh: mphToKmh(d.windspeedmph), gustKmh: mphToKmh(d.windgustmph), maxGustTodayKmh: mphToKmh(d.maxdailygust), windDir: num(d.winddir),
    rainHourIn: num(d.hourlyrainin), rainTodayIn: num(d.dailyrainin), rainEventIn: num(d.eventrainin), rainWeekIn: num(d.weeklyrainin), rainMonthIn: num(d.monthlyrainin),
    solarWm2: num(d.solarradiation), uv: num(d.uv), pressureKpa: inHgToKpa(d.baromrelin),
    soil: Object.keys(soil).length ? soil : undefined,
  };
}

/** Daily [mean, min, max, rain] from 5-minute readings, grouped by local date. */
function summarise(readings) {
  const by = {};
  readings.forEach((r) => {
    const t = num(r.dateutc); const f = num(r.tempf);
    if (t === null) return;
    const day = localDate(t);
    const a = (by[day] = by[day] || { sum: 0, n: 0, min: Infinity, max: -Infinity, rain: 0 });
    if (f !== null) { const c = (f - 32) * 5 / 9; a.sum += c; a.n++; a.min = Math.min(a.min, c); a.max = Math.max(a.max, c); }
    if (num(r.dailyrainin) !== null) a.rain = Math.max(a.rain, r.dailyrainin);
  });
  const out = {};
  Object.keys(by).forEach((day) => {
    const a = by[day];
    if (!a.n) return;
    out[day] = { v: [Math.round(a.sum / a.n * 10) / 10, Math.round(a.min * 10) / 10, Math.round(a.max * 10) / 10, Math.round(a.rain * 100) / 100], n: a.n };
  });
  return out;
}

function saveDays(app, daily) {
  const byYear = {};
  Object.keys(daily).forEach((day) => { (byYear[day.slice(0, 4)] = byYear[day.slice(0, 4)] || {})[day.slice(5)] = daily[day]; });
  Object.keys(byYear).forEach((y) => {
    const id = `station${y}`;
    const { rec, data } = readData(app, id);
    const days = Object.assign({}, data.days || {});
    const counts = Object.assign({}, data.counts || {});
    Object.keys(byYear[y]).forEach((md) => {
      // Keep whichever summary was built from more readings, so a partial window never replaces a full day.
      if (!(counts[md] > byYear[y][md].n)) { days[md] = byYear[y][md].v; counts[md] = byYear[y][md].n; }
    });
    writeWeather(app, id, rec, { days, counts, units: "[mean °C, min °C, max °C, rain in]", source: "Farm Ambient Weather station", updated: new Date().toISOString() });
  });
}

/**
 * Fetches the latest conditions and the last 24 hours of readings.
 * With `endDate` (ms), fetches the 24 hours before it instead (used to finish yesterday).
 */
function refresh(app, endDate) {
  const s = settings(app);
  if (!s.apiKey || !s.applicationKey) return { skipped: "Add the Ambient Weather keys in farm_config → ambient." };
  const devices = get(s, "/devices");
  if (!Array.isArray(devices) || !devices.length) throw new Error("No station found on this Ambient Weather account. Is the WS-2902 uploading to ambientweather.net?");
  const dev = (s.macAddress && devices.find((d) => (d.macAddress || "").toLowerCase() === s.macAddress.toLowerCase())) || devices[0];

  if (dev.lastData) {
    const { rec } = readData(app, "station");
    writeWeather(app, "station", rec, current(dev.lastData, dev.info));
  }

  sleep(1100); // Ambient allows 1 request per second per key
  const params = { limit: 288 };
  if (endDate) params.endDate = endDate;
  const readings = get(s, `/devices/${encodeURIComponent(dev.macAddress)}`, params);
  const daily = summarise(Array.isArray(readings) ? readings : []);
  saveDays(app, daily);
  return { station: dev.info?.name || dev.macAddress, readings: Array.isArray(readings) ? readings.length : 0, days: Object.keys(daily) };
}

module.exports = { refresh, configured, current, summarise };
