/// <reference path="../pb_data/types.d.ts" />

// CSV exports (see exports.js).
//  - Every night at 2:30 the CSVs are written to ~/FarmLog/exports (with dated copies in exports/history).
//  - Live links for Google Sheets: /api/farm/csv/<file>?key=<secret>. Google Sheets reads them with
//    =IMPORTDATA("…") and refreshes about once an hour. The key lives in the admin dashboard under
//    farm_config → exports; change it to switch off every old link.

cronAdd("farm_exports", "30 2 * * *", () => {
  try {
    require(`${__hooks}/exports.js`).writeAll($app);
  } catch (err) {
    console.log("[exports] nightly export failed:", err);
  }
});

// Live CSV for Google Sheets / Excel. The secret key in the link is the only thing protecting it.
routerAdd("GET", "/api/farm/csv/{file}", (e) => {
  const x = require(`${__hooks}/exports.js`);
  const file = e.request.pathValue("file");
  const key = x.exportKey(e.app);
  if (!key || e.request.url.query().get("key") !== key) {
    return e.string(403, "This link isn't valid any more. Get the current link from the Farm Log (Import → Google Sheets links).\n");
  }
  if (!x.FILES[file]) return e.string(404, "No such file.\n");
  e.response.header().set("Content-Type", "text/csv; charset=utf-8");
  e.response.header().set("Cache-Control", "no-store");
  return e.string(200, x.build(e.app, file));
});

// The links, for signed-in team members (shown in the app).
routerAdd("GET", "/api/farm/csv-links", (e) => {
  const x = require(`${__hooks}/exports.js`);
  return e.json(200, {
    key: x.exportKey(e.app),
    files: Object.keys(x.FILES).map((name) => ({ name, description: x.FILES[name] })),
  });
}, $apis.requireAuth());

// Write the files right now (superuser only): POST /api/farm/exports/run
routerAdd("POST", "/api/farm/exports/run", (e) => {
  return e.json(200, require(`${__hooks}/exports.js`).writeAll(e.app));
}, $apis.requireSuperuserAuth());
