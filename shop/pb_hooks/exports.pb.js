/// <reference path="../pb_data/types.d.ts" />

// Nightly CSV files in ~/ShopLog/exports, and live links for Google Sheets:
//   /api/shop/csv/<file>?key=<secret>   (key: admin dashboard → shop_admin → exports)

cronAdd("shop_exports", "40 2 * * *", () => {
  try { require(`${__hooks}/exports.js`).writeAll($app); } catch (err) { console.log("[exports] nightly export failed:", err); }
});

routerAdd("GET", "/api/shop/csv/{file}", (e) => {
  const x = require(`${__hooks}/exports.js`);
  const file = e.request.pathValue("file");
  const key = x.exportKey(e.app);
  if (!key || e.request.url.query().get("key") !== key) return e.string(403, "This link isn't valid any more. Get the current link from the Orders app (Products → Google Sheets links).\n");
  if (!x.FILES[file]) return e.string(404, "No such file.\n");
  e.response.header().set("Content-Type", "text/csv; charset=utf-8");
  e.response.header().set("Cache-Control", "no-store");
  return e.string(200, x.build(e.app, file));
});

routerAdd("GET", "/api/shop/csv-links", (e) => {
  const x = require(`${__hooks}/exports.js`);
  return e.json(200, { key: x.exportKey(e.app), files: Object.keys(x.FILES).map((name) => ({ name, description: x.FILES[name] })) });
}, $apis.requireAuth());

routerAdd("POST", "/api/shop/exports/run", (e) => e.json(200, require(`${__hooks}/exports.js`).writeAll(e.app)), $apis.requireSuperuserAuth());
