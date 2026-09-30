/// <reference path="../pb_data/types.d.ts" />

// App Hub control panel routes. The work is done in hub/lib/hub_side.js.
// Every route needs the owner's (admin) login, except /api/hub/agent/runner/…, which the Claude agent on this
// Mac calls with the hub key.

onBootstrap((e) => {
  e.next();
  require(`${__hooks}/../../hub/lib/hub_side.js`).hubKey();  // create the key the first time
});


routerAdd("GET", "/api/hub/status", (e) => e.json(200, require(`${__hooks}/../../hub/lib/hub_side.js`).status()), $apis.requireSuperuserAuth());
routerAdd("POST", "/api/hub/apps/{app}/restart", (e) => e.json(200, require(`${__hooks}/../../hub/lib/hub_side.js`).restart(e.request.pathValue("app"))), $apis.requireSuperuserAuth());
routerAdd("POST", "/api/hub/apps/{app}/pause", (e) => e.json(200, require(`${__hooks}/../../hub/lib/hub_side.js`).setPaused(e.request.pathValue("app"), true)), $apis.requireSuperuserAuth());
routerAdd("POST", "/api/hub/apps/{app}/resume", (e) => e.json(200, require(`${__hooks}/../../hub/lib/hub_side.js`).setPaused(e.request.pathValue("app"), false)), $apis.requireSuperuserAuth());

routerAdd("GET", "/api/hub/apps/{app}/look", (e) => e.json(200, require(`${__hooks}/../../hub/lib/hub_side.js`).getLook(e.request.pathValue("app"))), $apis.requireSuperuserAuth());
routerAdd("PUT", "/api/hub/apps/{app}/look", (e) => e.json(200, { look: require(`${__hooks}/../../hub/lib/hub_side.js`).putLook(e.request.pathValue("app"), e.requestInfo().body || {}, "You") }), $apis.requireSuperuserAuth());
routerAdd("GET", "/api/hub/apps/{app}/lists", (e) => e.json(200, { lists: require(`${__hooks}/../../hub/lib/hub_side.js`).getLists(e.request.pathValue("app")) }), $apis.requireSuperuserAuth());
routerAdd("PUT", "/api/hub/apps/{app}/lists/{list}", (e) => e.json(200, { list: require(`${__hooks}/../../hub/lib/hub_side.js`).putList(e.request.pathValue("app"), e.request.pathValue("list"), e.requestInfo().body || {}, "You") }), $apis.requireSuperuserAuth());

routerAdd("GET", "/api/hub/changes", (e) => e.json(200, { changes: require(`${__hooks}/../../hub/lib/hub_side.js`).changes() }), $apis.requireSuperuserAuth());
routerAdd("POST", "/api/hub/changes/{id}/undo", (e) => e.json(200, require(`${__hooks}/../../hub/lib/hub_side.js`).undo(e.request.pathValue("id"))), $apis.requireSuperuserAuth());

// Claude chat, from the control panel
routerAdd("GET", "/api/hub/agent", (e) => {
  const h = require(`${__hooks}/../../hub/lib/hub_side.js`);
  return e.json(200, { agent: h.agentState(), messages: h.messages(80) });
}, $apis.requireSuperuserAuth());
routerAdd("POST", "/api/hub/agent", (e) => {
  const h = require(`${__hooks}/../../hub/lib/hub_side.js`);
  const text = String((e.requestInfo().body || {}).text || "").trim();
  if (!text) throw new BadRequestError("Type a message first.");
  return e.json(200, { id: h.addMessage("you", text, "panel", "new") });
}, $apis.requireSuperuserAuth());

// Claude chat, from the agent on this Mac (hub key)
routerAdd("GET", "/api/hub/agent/runner/next", (e) => {
  const h = require(`${__hooks}/../../hub/lib/hub_side.js`);
  if (!h.runnerKeyOk(e)) return e.json(403, { message: "Wrong key." });
  return e.json(200, { message: h.nextForRunner() });
});
routerAdd("POST", "/api/hub/agent/runner/post", (e) => {
  const h = require(`${__hooks}/../../hub/lib/hub_side.js`);
  if (!h.runnerKeyOk(e)) return e.json(403, { message: "Wrong key." });
  return e.json(200, h.postFromRunner(e.requestInfo().body || {}));
});

// The hub's home-screen icon and manifest.
routerAdd("GET", "/api/hub/icon/{size}", (e) => require(`${__hooks}/../../hub/lib/app_side.js`).iconRoute(e, "hub"));
routerAdd("GET", "/api/hub/manifest", (e) => require(`${__hooks}/../../hub/lib/app_side.js`).manifestRoute(e, "hub"));
