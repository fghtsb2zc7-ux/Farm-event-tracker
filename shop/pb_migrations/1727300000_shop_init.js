/// <reference path="../pb_data/types.d.ts" />

// Shop Orders database. Like the Farm Log, each record keeps its content in one JSON "data" field.
//   customers  saved clients (name, phone, email, address)
//   orders     orders with their line items, pickup/ship date, totals and payments
//   catalog    product categories, each with its options and prices (edited in the app)
//   config     shop settings the team can see (name, tax)
//   shop_admin owner-only settings (the key in the Google Sheets links)
migrate((app) => {
  const signedIn = "@request.auth.id != ''";
  const docCollection = (name, rules) => new Collection({
    type: "base",
    name,
    ...rules,
    fields: [
      { name: "id", type: "text", system: true, primaryKey: true, required: true, min: 1, max: 40,
        pattern: "^[A-Za-z0-9]+$", autogeneratePattern: "[a-z0-9]{15}" },
      { name: "data", type: "json", maxSize: 2000000 },
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
  });
  const team = { listRule: signedIn, viewRule: signedIn, createRule: signedIn, updateRule: signedIn, deleteRule: signedIn };
  ["customers", "orders", "catalog", "config"].forEach((n) => app.save(docCollection(n, team)));
  app.save(docCollection("shop_admin", { listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null }));

  const put = (col, id, data) => {
    const r = new Record(app.findCollectionByNameOrId(col));
    r.set("id", id);
    r.set("data", data);
    app.save(r);
  };
  const opts = (names) => names.map((n, i) => ({ id: `o${i + 1}`, name: n, price: 0 }));
  // Starting categories. Prices start at $0: set them on the Products screen.
  put("catalog", "ornaments", { name: "Ornaments", sort: 1, options: opts(["Basic", "Medium", "Fancy"]) });
  put("catalog", "signs", { name: "Signs", sort: 2, options: opts(["Small", "Medium", "Large"]) });
  put("catalog", "prints3d", { name: "3D prints", sort: 3, options: opts(["XS", "S", "M", "L", "XL"]) });
  put("config", "main", { businessName: "Rough Cut Dezigns", taxRate: 0, taxName: "HST" });
  put("shop_admin", "exports", { key: $security.randomString(32) });

  const users = app.findCollectionByNameOrId("users");
  users.listRule = signedIn;
  users.viewRule = signedIn;
  users.createRule = null;
  app.save(users);

  const settings = app.settings();
  settings.meta.appName = "Rough Cut Dezigns Orders";
  settings.backups.cron = "15 3 * * *";
  settings.backups.cronMaxKeep = 14;
  app.save(settings);
}, (app) => {
  ["customers", "orders", "catalog", "config", "shop_admin"].forEach((n) => {
    try { app.delete(app.findCollectionByNameOrId(n)); } catch (_) {}
  });
});
