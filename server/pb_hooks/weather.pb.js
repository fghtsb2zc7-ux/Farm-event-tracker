/// <reference path="../pb_data/types.d.ts" />

// Weather for Corinth, ON from Open-Meteo (free, no account or key).
// Every 30 minutes the server checks the stored weather and refreshes it when it's
// more than 6 hours old, so it catches up on its own after a restart or power cut.
cronAdd("farm_weather", "*/30 * * * *", () => {
  const w = require(`${__hooks}/weather.js`);
  if (!w.isStale($app, 6)) return;
  try {
    w.refresh($app, true);
  } catch (err) {
    console.log("[weather] refresh failed:", err);
  }
});

// Lets a superuser refresh on demand: POST /api/farm/weather/refresh
routerAdd("POST", "/api/farm/weather/refresh", (e) => {
  return e.json(200, require(`${__hooks}/weather.js`).refresh(e.app, true));
}, $apis.requireSuperuserAuth());
