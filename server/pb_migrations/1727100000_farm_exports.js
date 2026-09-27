/// <reference path="../pb_data/types.d.ts" />

// Settings only the owner can see or change (from the admin dashboard): the secret key in the
// Google Sheets / CSV links. Change "key" on the "exports" record to make old links stop working.
migrate((app) => {
  const col = new Collection({
    type: "base",
    name: "farm_config",
    listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
    fields: [
      { name: "id", type: "text", system: true, primaryKey: true, required: true, min: 1, max: 40,
        pattern: "^[A-Za-z0-9]+$", autogeneratePattern: "[a-z0-9]{15}" },
      { name: "data", type: "json", maxSize: 100000 },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
  });
  app.save(col);

  const rec = new Record(col);
  rec.set("id", "exports");
  rec.set("data", { key: $security.randomString(32) });
  app.save(rec);
}, (app) => {
  try { app.delete(app.findCollectionByNameOrId("farm_config")); } catch (_) {}
});
