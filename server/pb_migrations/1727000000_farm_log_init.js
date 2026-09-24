/// <reference path="../pb_data/types.d.ts" />

// Farm Log database: one collection per kind of record. Each record keeps its
// content in a single JSON "data" field, the same shape the app (and the beta)
// uses, so records move between versions without conversion.
migrate((app) => {
  const signedIn = "@request.auth.id != ''";

  const docCollection = (name, rules) => new Collection({
    type: "base",
    name,
    ...rules,
    fields: [
      // Accept ids brought over from the beta (mixed case, up to 40 characters).
      { name: "id", type: "text", system: true, primaryKey: true, required: true, min: 1, max: 40,
        pattern: "^[A-Za-z0-9]+$", autogeneratePattern: "[a-z0-9]{15}" },
      { name: "data", type: "json", maxSize: 2000000 },
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
  });

  // Everyone on the team (signed in) can read and write farm records.
  const teamRules = { listRule: signedIn, viewRule: signedIn, createRule: signedIn, updateRule: signedIn, deleteRule: signedIn };
  ["events", "orders", "notes", "lists"].forEach((name) => app.save(docCollection(name, teamRules)));

  // Weather is written only by the server's daily job; the team reads it.
  app.save(docCollection("weather", { listRule: signedIn, viewRule: signedIn, createRule: null, updateRule: null, deleteRule: null }));

  // Teammates can see each other's names. Only the owner adds people (from the dashboard).
  const users = app.findCollectionByNameOrId("users");
  users.listRule = signedIn;
  users.viewRule = signedIn;
  users.createRule = null;
  app.save(users);

  const settings = app.settings();
  settings.meta.appName = "Fehr Grown Farm Log";
  settings.backups.cron = "0 3 * * *"; // nightly backup at 3 am
  settings.backups.cronMaxKeep = 14;   // keep two weeks
  app.save(settings);
}, (app) => {
  ["events", "orders", "notes", "lists", "weather"].forEach((name) => {
    try { app.delete(app.findCollectionByNameOrId(name)); } catch (_) {}
  });
});
