/// <reference path="../pb_data/types.d.ts" />

// The farm's Ambient Weather station (see ambient.js). Does nothing until the keys are filled in
// under farm_config → ambient in the admin dashboard.

// Current conditions and today's summary, every 5 minutes.
cronAdd("farm_station", "*/5 * * * *", () => {
  const a = require(`${__hooks}/ambient.js`);
  if (!a.configured($app)) return;
  try {
    a.refresh($app);
  } catch (err) {
    console.log("[station]", err);
  }
});

// Just after midnight, finish yesterday's summary from its full 24 hours of readings.
cronAdd("farm_station_day", "20 0 * * *", () => {
  const a = require(`${__hooks}/ambient.js`);
  if (!a.configured($app)) return;
  const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
  try {
    a.refresh($app, midnight.getTime());
  } catch (err) {
    console.log("[station] end-of-day summary failed:", err);
  }
});

// Check the connection right away (superuser only): POST /api/farm/station/refresh
routerAdd("POST", "/api/farm/station/refresh", (e) => {
  try {
    return e.json(200, require(`${__hooks}/ambient.js`).refresh(e.app));
  } catch (err) {
    return e.json(400, { error: String(err) });
  }
}, $apis.requireSuperuserAuth());
