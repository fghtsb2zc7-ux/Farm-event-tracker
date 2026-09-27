/// <reference path="../pb_data/types.d.ts" />

// Settings for the farm's Ambient Weather station (WS-2902). The owner fills these in from the
// admin dashboard: Collections → farm_config → ambient. Leave macAddress blank to use the first
// station on the account.
migrate((app) => {
  const col = app.findCollectionByNameOrId("farm_config");
  const rec = new Record(col);
  rec.set("id", "ambient");
  rec.set("data", { apiKey: "", applicationKey: "", macAddress: "" });
  app.save(rec);
}, (app) => {
  try { app.delete(app.findRecordById("farm_config", "ambient")); } catch (_) {}
});
