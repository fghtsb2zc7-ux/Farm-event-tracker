// Weather loader used by the scheduled check and the manual refresh route (see weather.pb.js).
//
// Stores one "weather" record per year (id "2026") with
//   data.days["MM-DD"] = [mean °C, min °C, max °C, rain in]
// and one record "forecast" with the next 7 days. The app reads both.

const LAT = 42.78;
const LON = -80.87;
const TZ = "America%2FToronto";
const YEARS_BACK = 2; // keep this year and the two before it complete

const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; };

function getJSON(url) {
  const res = $http.send({ url, method: "GET", timeout: 60 });
  if (res.statusCode !== 200) throw new Error(`Open-Meteo returned ${res.statusCode}`);
  return res.json;
}

function readData(app, id) {
  try {
    const rec = app.findRecordById("weather", id);
    const raw = rec.get("data");
    return { rec, data: raw ? JSON.parse(JSON.stringify(raw)) : {} };
  } catch (_) {
    return { rec: null, data: {} };
  }
}

function writeData(app, id, rec, data) {
  if (!rec) {
    rec = new Record(app.findCollectionByNameOrId("weather"));
    rec.set("id", id);
  }
  rec.set("data", data);
  app.save(rec);
}

function iconFor(code) {
  if (code <= 1) return "sun";
  if (code === 2) return "cloud-sun";
  if (code === 3) return "cloud";
  if (code === 45 || code === 48) return "cloud-fog";
  if (code >= 51 && code <= 57) return "cloud-drizzle";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "cloud-snow";
  if (code >= 95) return "cloud-lightning";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "cloud-rain";
  return "cloud";
}

function collect(daily, into, upTo) {
  (daily.time || []).forEach((t, i) => {
    if (upTo && t > upTo) return;
    const v = [daily.temperature_2m_mean[i], daily.temperature_2m_min[i], daily.temperature_2m_max[i], daily.precipitation_sum[i]];
    if (v.some((x) => x === null || x === undefined)) return;
    into[t] = [Math.round(v[0] * 10) / 10, Math.round(v[1] * 10) / 10, Math.round(v[2] * 10) / 10, Math.round(v[3] * 100) / 100];
  });
}

/**
 * @param app  the PocketBase app
 * @param full true to re-check whole years (startup / manual), false for the daily top-up
 */
function refresh(app, full) {
  const now = new Date();
  const today = iso(now);
  const thisYear = now.getFullYear();
  const vars = "temperature_2m_mean,temperature_2m_min,temperature_2m_max,precipitation_sum";
  const days = {};

  // History: the archive lags about 5 days behind today.
  const archiveEnd = iso(addDays(now, -6));
  let archiveStart = iso(addDays(now, -40));
  if (full) {
    for (let y = thisYear - YEARS_BACK; y <= thisYear; y++) {
      const { data } = readData(app, String(y));
      const have = data.days ? Object.keys(data.days).length : 0;
      const expected = y < thisYear ? 365 : Math.max(0, Math.floor((now - new Date(y, 0, 1)) / 864e5) - 6);
      if (have < expected) { archiveStart = `${thisYear - YEARS_BACK}-01-01`; break; }
    }
  }
  const archive = getJSON(`https://archive-api.open-meteo.com/v1/archive?latitude=${LAT}&longitude=${LON}&start_date=${archiveStart}&end_date=${archiveEnd}&daily=${vars}&precipitation_unit=inch&timezone=${TZ}`);
  collect(archive.daily || {}, days);

  // Recent days and the week ahead from the forecast model.
  // If this call fails, history is still saved and the next check (30 minutes later) tries again.
  let fc = null, fcError = null;
  try {
    fc = getJSON(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=${vars},weather_code&precipitation_unit=inch&timezone=${TZ}&past_days=10&forecast_days=7`);
  } catch (err) {
    fcError = err;
  }
  const recent = {};
  if (fc) collect(fc.daily || {}, recent, today);
  Object.keys(recent).forEach((t) => { if (!days[t] || t > archiveEnd) days[t] = recent[t]; });

  const updated = new Date().toISOString();
  const byYear = {};
  Object.keys(days).forEach((t) => { (byYear[t.slice(0, 4)] = byYear[t.slice(0, 4)] || {})[t.slice(5)] = days[t]; });
  Object.keys(byYear).forEach((y) => {
    const { rec, data } = readData(app, y);
    writeData(app, y, rec, {
      days: Object.assign({}, data.days || {}, byYear[y]),
      source: "Open-Meteo (archive, recent days from the forecast model)",
      location: "Corinth, ON (42.78, -80.87)",
      units: "[mean °C, min °C, max °C, rain in]",
      updated,
    });
  });

  if (!fc) {
    console.log(`[weather] saved ${Object.keys(days).length} days of history; forecast failed and will be retried:`, fcError);
    return { days: Object.keys(days).length, from: archiveStart, forecastDays: 0, forecastError: String(fcError) };
  }
  const d = fc.daily || {};
  const forecast = (d.time || []).map((t, i) => ({
    date: t,
    hi: Math.round(d.temperature_2m_max[i] * 10) / 10,
    lo: Math.round(d.temperature_2m_min[i] * 10) / 10,
    rain: Math.round((d.precipitation_sum[i] || 0) * 100) / 100,
    icon: iconFor(d.weather_code[i] || 0),
  })).filter((x) => x.date >= today);
  const f = readData(app, "forecast");
  writeData(app, "forecast", f.rec, { days: forecast, updated, source: "Open-Meteo forecast" });

  console.log(`[weather] updated ${Object.keys(days).length} days (${archiveStart} to ${today}) and a ${forecast.length}-day forecast`);
  return { days: Object.keys(days).length, from: archiveStart, forecastDays: forecast.length };
}

/** True when the forecast record is missing or older than `hours`. */
function isStale(app, hours) {
  const { data } = readData(app, "forecast");
  if (!data.updated) return true;
  return Date.now() - new Date(data.updated).getTime() > hours * 36e5;
}

module.exports = { refresh, isStale };
