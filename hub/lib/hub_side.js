// The App Hub control panel's server: app status, restarts, looks, lists, change history and the Claude chat.
// Routes are in pb_hooks/hub.pb.js. Everything here is for the owner only (the hub's admin login),
// except the /api/hub/agent/runner/… routes, which the Claude agent on this Mac calls with the hub key.

const side = require(`${__hooks}/../../hub/lib/app_side.js`);
const REPO = $filepath.clean(`${__hooks}/../..`);

const hubDir = () => side.hubDir($app);
const homeDir = () => $filepath.dir(hubDir());
const readText = (path) => { try { return toString($os.readFile(path)); } catch (_) { return ""; } };
const exists = (path) => { try { $os.stat(path); return true; } catch (_) { return false; } };
const nowSec = () => Math.floor(Date.now() / 1000);

// ---- The hub key: lets the hub (and the agent) reach the apps' hub-only routes ----
function hubKey() {
  const path = $filepath.join(hubDir(), "hub.key");
  let key = readText(path).trim();
  if (key.length < 20) {
    key = $security.randomString(40);
    $os.mkdirAll(hubDir(), 0o755);
    $os.writeFile(path, key + "\n", 0o600);
  }
  return key;
}

// ---- The apps on this Mac, from scripts/mac/apps.sh (the one list every script uses) ----
function registry() {
  const src = readText(`${REPO}/scripts/mac/apps.sh`);
  const re = /(\w+)\)\s*APP=\w+;\s*APP_NAME="([^"]+)";\s*LABEL="([^"]+)";\s*PORT=(\d+);\s*FUNNEL_PATH=(\S+)\s*\n\s*HOME_DIR="\$HOME\/([^"]+)";\s*SRC_DIR=(\w+);\s*LOG_NAME=([\w.-]+)/g;
  const out = [];
  let m;
  while ((m = re.exec(src))) {
    out.push({ id: m[1], name: m[2], label: m[3], port: Number(m[4]), path: m[5], homeDir: $filepath.join(homeDir(), m[6]), src: m[7], log: m[8] });
  }
  return out;
}
function appById(id) {
  const a = registry().filter((x) => x.id === id)[0];
  if (!a) throw new NotFoundError("No app called " + id);
  return a;
}

function healthy(port) {
  try { return $http.send({ url: `http://127.0.0.1:${port}/api/health`, timeout: 3 }).statusCode === 200; } catch (_) { return false; }
}

// What the watchdog currently knows is wrong (files in ~/AppHub/state, see scripts/mac/watchdog.sh).
const PROBLEMS = {
  down: "Not answering. The watchdog is restarting it.",
  public: "Running, but phones can't reach it over the internet.",
  backup: "No backup in over 2 days.",
};
function problemsFor(id) {
  const out = [];
  Object.keys(PROBLEMS).forEach((k) => {
    const since = Number(readText($filepath.join(hubDir(), "state", `${id}-${k}.since`)).trim());
    if (since) out.push({ kind: k, text: PROBLEMS[k], since });
  });
  return out;
}

function lastBackup(a) {
  let newest = 0;
  try {
    $os.readDir($filepath.join(a.homeDir, "pb_data", "backups")).forEach((d) => {
      if (!/\.zip$/.test(d.name())) return;
      const t = d.info().modTime().unix();
      if (t > newest) newest = t;
    });
  } catch (_) {}
  return newest;
}

// Watchdog and nightly update history, newest last.
function events(limit) {
  const lines = [];
  [["watchdog", $filepath.join(hubDir(), "logs", "watchdog.log")], ["update", $filepath.join(homeDir(), "FarmLog", "logs", "update.log")]].forEach(([src, path]) => {
    readText(path).split("\n").forEach((l) => {
      const m = l.match(/^(\d{4}-\d\d-\d\d \d\d:\d\d:\d\d)\s+(.*)$/);
      if (m && !/^Up to date/.test(m[2])) lines.push({ at: m[1], text: m[2].replace(/^Text: /, "Texted you: "), src });
    });
  });
  lines.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  return lines.slice(-limit);
}

function status() {
  const apps = registry().map((a) => {
    const isHub = a.src === "hub";
    const plist = exists(`/Library/LaunchDaemons/${a.label}.plist`);
    const up = isHub || healthy(a.port);
    return {
      id: a.id, name: a.name, port: a.port, path: a.path, isHub,
      installed: plist || up, up,
      paused: exists($filepath.join(hubDir(), "state", `${a.id}.paused`)),
      problems: problemsFor(a.id),
      lastBackup: lastBackup(a),
    };
  }).filter((a) => a.installed);
  const general = [];
  [["tailscale", "Tailscale isn't running on the Mac mini, so phones can't reach any app."],
    ["disk", "The Mac mini is almost out of storage."],
    ["internet", "The Mac mini's internet connection is down."]].forEach(([k, text]) => {
    const since = Number(readText($filepath.join(hubDir(), "state", `${k}.since`)).trim());
    if (since) general.push({ kind: k, text, since });
  });
  return {
    apps, general, events: events(40),
    watchdog: exists($filepath.join(homeDir(), "Library", "LaunchAgents", "ca.fehrgrownfarms.apphub.watchdog.plist")),
    now: nowSec(),
  };
}

function logEvent(text) {
  const d = new Date();
  const p = (n) => (n < 10 ? "0" : "") + n;
  const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  const path = $filepath.join(hubDir(), "logs", "watchdog.log");
  $os.mkdirAll($filepath.dir(path), 0o755);
  $os.writeFile(path, readText(path) + `${stamp}  ${text}\n`, 0o644);
}

function restart(id) {
  const a = appById(id);
  if (a.src === "hub") throw new BadRequestError("The control panel can't restart itself.");
  const custom = $os.getenv("HUB_RESTART_CMD");  // for testing
  const cmd = custom ? $os.cmd(custom, a.label) : $os.cmd("sudo", "-n", "/bin/launchctl", "kickstart", "-k", "system/" + a.label);
  try {
    cmd.combinedOutput();
  } catch (err) {
    throw new BadRequestError(`Couldn't restart ${a.name}. On the Mac mini, run: bash scripts/mac/enable-watchdog.sh (it gives permission to restart apps).`);
  }
  logEvent(`Restarted ${a.name} (from the control panel).`);
  for (let i = 0; i < 30; i++) {
    if (healthy(a.port)) return { up: true };
    sleep(1000);
  }
  return { up: false };
}

function setPaused(id, paused) {
  const a = appById(id);
  const path = $filepath.join(hubDir(), "state", `${a.id}.paused`);
  $os.mkdirAll($filepath.dir(path), 0o755);
  if (paused) $os.writeFile(path, String(nowSec()), 0o644); else { try { $os.remove(path); } catch (_) {} }
  logEvent(`${paused ? "Paused" : "Resumed"} watching ${a.name} (from the control panel).`);
  return { paused };
}

// ---- Looks ----

// Each app's own design, so the color pickers start where the app is today.
const DEFAULT_LOOKS = {
  farm: { colors: { brand: "#8ec444", accent: "#4d7f1e", logoText: "#424244", background: "#f6f6f4", surface: "#ffffff", text: "#2a2a2c" },
    fonts: { body: "Instrument Sans", heading: "Questrial" }, radius: 12, name: "Fehr Grown Farm Log", shortName: "Farm Log" },
  shop: { colors: { brand: "#a64a20", accent: "#8f3f1b", logoText: "#1f1d1b", background: "#f7f3ec", surface: "#ffffff", text: "#1f1d1b" },
    fonts: { body: "Instrument Sans", heading: "Kaushan Script" }, radius: 12, name: "Rough Cut Dezigns Orders", shortName: "Orders" },
};
const FONT_NAMES = ["Instrument Sans", "Inter", "DM Sans", "Nunito", "Work Sans", "Poppins", "Josefin Sans", "Questrial", "Oswald",
  "Lora", "Merriweather", "Playfair Display", "Source Serif 4", "Kaushan Script", "Caveat"];
const COLOR_KEYS = ["brand", "accent", "logoText", "background", "surface", "text"];

const lookPath = (id) => $filepath.join(hubDir(), "apps", id, "look.json");

function getLook(id) {
  const a = appById(id);
  return { look: side.readJSON(lookPath(a.id), {}), defaults: DEFAULT_LOOKS[a.id] || { colors: {}, fonts: {}, radius: 12, name: a.name }, fonts: FONT_NAMES };
}

function cleanLook(l, old) {
  l = l || {};
  const out = {}, colors = {}, fonts = {};
  COLOR_KEYS.forEach((k) => { const v = (l.colors || {})[k]; if (/^#[0-9a-f]{6}$/i.test(v || "")) colors[k] = v.toLowerCase(); });
  ["body", "heading"].forEach((k) => { const v = (l.fonts || {})[k]; if (FONT_NAMES.indexOf(v) >= 0) fonts[k] = v; });
  if (Object.keys(colors).length) out.colors = colors;
  if (Object.keys(fonts).length) out.fonts = fonts;
  const r = Number(l.radius);
  if (l.radius !== undefined && l.radius !== null && l.radius !== "" && r >= 0 && r <= 28) out.radius = Math.round(r);
  ["name", "shortName"].forEach((k) => { const v = String(l[k] || "").replace(/\s+/g, " ").trim().slice(0, k === "name" ? 60 : 20); if (v) out[k] = v; });
  out.logo = Number(old.logo) || 0;
  out.icon = Number(old.icon) || 0;
  return out;
}

// Decodes a data: URL from the control panel (it turns every picture into a PNG first).
function pngBytes(dataUrl) {
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || "");
  if (!m) throw new BadRequestError("That picture couldn't be read. Try a PNG or JPEG file.");
  const s = m[1].replace(/=+$/, ""), A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  if (s.length > 2800000) throw new BadRequestError("That picture is too large.");
  const out = [];
  let buf = 0, bits = 0;
  for (let i = 0; i < s.length; i++) {
    buf = (buf << 6) | A.indexOf(s[i]); bits += 6;
    if (bits >= 8) { bits -= 8; out.push((buf >> bits) & 255); }
  }
  if (out[0] !== 137 || out[1] !== 80 || out[2] !== 78 || out[3] !== 71) throw new BadRequestError("That picture couldn't be read.");
  return out;
}

function putLook(id, body, who) {
  const a = appById(id);
  const before = side.readJSON(lookPath(a.id), {});
  const look = cleanLook(body.look, before);
  const dir = $filepath.join(hubDir(), "apps", a.id);
  $os.mkdirAll(dir, 0o755);
  const v = Date.now();
  const img = body.images || {};
  if (img.logo === null) look.logo = 0;
  else if (img.logo) { $os.writeFile($filepath.join(dir, `logo-${v}.png`), pngBytes(img.logo), 0o644); look.logo = v; }
  if (img.icon === null) look.icon = 0;
  else if (img.icon) {
    [32, 180, 192, 512].forEach((size) => $os.writeFile($filepath.join(dir, `icon-${v}-${size}.png`), pngBytes(img.icon[size]), 0o644));
    look.icon = v;
  }
  side.writeJSON(lookPath(a.id), look);
  recordChange(a, "look", "look", `${a.name}: look`, before, look, who);
  return look;
}

// ---- Lists (kept in each app's own database; the hub goes through the app) ----

function callApp(a, method, path, body) {
  let res;
  try {
    res = $http.send({ url: `http://127.0.0.1:${a.port}${path}`, method, timeout: 15,
      headers: { "X-Hub-Key": hubKey(), "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : "" });
  } catch (_) {
    throw new BadRequestError(`${a.name} isn't answering, so its lists can't be changed right now.`);
  }
  if (res.statusCode === 404) throw new BadRequestError(`${a.name} needs updating before its lists can be edited here. It updates itself overnight.`);
  if (res.statusCode !== 200) throw new BadRequestError((res.json && res.json.message) || `${a.name} said no (${res.statusCode}).`);
  return res.json;
}

const getLists = (id) => callApp(appById(id), "GET", "/api/hub/lists").lists;

function putList(id, listId, body, who, titlePrefix) {
  const a = appById(id);
  const before = getLists(id).filter((l) => l.id === listId)[0];
  if (!before) throw new NotFoundError("No such list.");
  const saved = callApp(a, "PUT", "/api/hub/lists/" + encodeURIComponent(listId), { items: body.items, value: body.value }).list;
  const pick = (l) => (l.kind === "form" ? { value: l.value } : { items: l.items });
  recordChange(a, "list", listId, `${titlePrefix || ""}${a.name}: ${before.title}`, pick(before), pick(saved), who);
  return saved;
}

// ---- Change history, so every change can be undone ----

function recordChange(a, area, target, title, before, after, who) {
  if (JSON.stringify(before) === JSON.stringify(after)) return;
  const r = new Record($app.findCollectionByNameOrId("changes"));
  r.set("app", a.id); r.set("area", area); r.set("target", target); r.set("title", title);
  r.set("before", before); r.set("after", after); r.set("who", who || "You");
  $app.save(r);
}

function changes() {
  return $app.findRecordsByFilter("changes", "", "-created", 60, 0).map((r) => ({
    id: r.id, app: r.getString("app"), area: r.getString("area"), title: r.getString("title"),
    who: r.getString("who"), undone: r.getBool("undone"), created: r.getString("created"),
  }));
}

function undo(changeId) {
  const r = $app.findRecordById("changes", changeId);
  if (r.getBool("undone")) throw new BadRequestError("That change was already undone.");
  const a = appById(r.getString("app"));
  const before = JSON.parse(r.getString("before") || "{}");
  if (r.getString("area") === "look") {
    const cur = side.readJSON(lookPath(a.id), {});
    side.writeJSON(lookPath(a.id), before);  // pictures are kept by version, so older ones come back too
    recordChange(a, "look", "look", `Undid: ${r.getString("title")}`, cur, before, "You");
  } else {
    putList(a.id, r.getString("target"), before, "You", "Undid: ");
  }
  r.set("undone", true);
  $app.save(r);
  return { ok: true };
}

// ---- Claude chat ----
// The agent (scripts/mac/agent.py) runs on this Mac. It picks up messages typed here, replies here, and
// copies text-message conversations here so everything is in one place.

const agentDir = () => $filepath.join(hubDir(), "agent");

function agentState() {
  const s = side.readJSON($filepath.join(agentDir(), "status.json"), null);
  if (!s) return { installed: false };
  return { installed: true, online: nowSec() - (Number(s.updated) || 0) < 90, busy: !!s.busy, waitingForYes: !!s.waitingForYes,
    runsToday: Number(s.runsToday) || 0, dailyLimit: Number(s.dailyLimit) || 0, note: s.note || "" };
}

function messages(limit) {
  // Map to plain objects before reversing: reversing PocketBase's own list in place scrambles it.
  return $app.findRecordsByFilter("agent_messages", "", "-created,-id", limit, 0).map((r) => ({
    id: r.id, role: r.getString("role"), text: r.getString("text"), source: r.getString("source"),
    status: r.getString("status"), created: r.getString("created"),
  })).reverse();
}

function addMessage(role, text, source, status) {
  const r = new Record($app.findCollectionByNameOrId("agent_messages"));
  r.set("role", role); r.set("text", String(text || "").slice(0, 20000)); r.set("source", source); r.set("status", status || "done");
  $app.save(r);
  return r.id;
}

function runnerKeyOk(e) {
  return $security.equal(e.request.header.get("X-Hub-Key") || "", hubKey());
}

// The agent asks for the next message typed in the control panel.
function nextForRunner() {
  const rs = $app.findRecordsByFilter("agent_messages", "status = 'new' && role = 'you'", "created", 1, 0);
  if (!rs.length) return null;
  const r = rs[0];
  r.set("status", "working");
  $app.save(r);
  return { id: r.id, text: r.getString("text") };
}

function postFromRunner(body) {
  if (body.doneId) {
    try { const r = $app.findRecordById("agent_messages", body.doneId); r.set("status", "done"); $app.save(r); } catch (_) {}
  }
  if (body.text) return { id: addMessage(body.role === "you" ? "you" : body.role === "note" ? "note" : "claude", body.text, body.source || "panel", "done") };
  return { ok: true };
}

module.exports = { hubKey, status, restart, setPaused, getLook, putLook, getLists, putList, changes, undo,
  agentState, messages, addMessage, runnerKeyOk, nextForRunner, postFromRunner };
