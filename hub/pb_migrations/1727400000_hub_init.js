/// <reference path="../pb_data/types.d.ts" />

// App Hub control panel database. Only the owner (the hub's admin login) can read or change anything.
//   changes         every change made in the control panel, so each one can be undone
//   agent_messages  the conversation with the Claude agent (typed here or texted)
migrate((app) => {
  const ownerOnly = { listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null };
  const stamps = [
    { name: "created", type: "autodate", onCreate: true },
    { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
  ];
  app.save(new Collection({
    type: "base", name: "changes", ...ownerOnly,
    fields: [
      { name: "app", type: "text", required: true, max: 40 },
      { name: "area", type: "text", max: 20 },      // look | list
      { name: "target", type: "text", max: 80 },    // which list
      { name: "title", type: "text", max: 200 },
      { name: "before", type: "json", maxSize: 5000000 },
      { name: "after", type: "json", maxSize: 5000000 },
      { name: "who", type: "text", max: 80 },
      { name: "undone", type: "bool" },
      ...stamps,
    ],
    indexes: ["CREATE INDEX idx_changes_created ON changes (created)"],
  }));
  app.save(new Collection({
    type: "base", name: "agent_messages", ...ownerOnly,
    fields: [
      { name: "role", type: "text", required: true, max: 10 },    // you | claude | note
      { name: "text", type: "text", max: 20000 },
      { name: "source", type: "text", max: 20 },                  // panel | imessage | watchdog
      { name: "status", type: "text", max: 10 },                  // new | working | done
      ...stamps,
    ],
    indexes: ["CREATE INDEX idx_agent_messages_created ON agent_messages (created)"],
  }));

  // Stay signed in to the control panel for two weeks on your own devices.
  const owners = app.findCollectionByNameOrId("_superusers");
  owners.authToken.duration = 14 * 24 * 60 * 60;
  app.save(owners);

  const settings = app.settings();
  settings.meta.appName = "App Hub";
  settings.backups.cron = "30 3 * * *";
  settings.backups.cronMaxKeep = 14;
  settings.rateLimits.enabled = true;  // slows down anyone guessing the password
  app.save(settings);
}, (app) => {
  ["changes", "agent_messages"].forEach((n) => { try { app.delete(app.findCollectionByNameOrId(n)); } catch (_) {} });
});
