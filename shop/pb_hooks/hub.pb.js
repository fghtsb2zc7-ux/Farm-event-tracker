/// <reference path="../pb_data/types.d.ts" />

// The App Hub control panel's link to Rough Cut Dezigns Orders: the colors, fonts, logo and icons set there, and the lists
// it can edit. The work is done in hub/lib/app_side.js, shared by every app.

routerAdd("GET", "/api/hub/theme.css", (e) => require(`${__hooks}/../../hub/lib/app_side.js`).themeRoute(e, "shop"));
routerAdd("GET", "/api/hub/look.js", (e) => require(`${__hooks}/../../hub/lib/app_side.js`).lookJsRoute(e, "shop"));
routerAdd("GET", "/api/hub/logo", (e) => require(`${__hooks}/../../hub/lib/app_side.js`).logoRoute(e, "shop"));
routerAdd("GET", "/api/hub/icon/{size}", (e) => require(`${__hooks}/../../hub/lib/app_side.js`).iconRoute(e, "shop"));
routerAdd("GET", "/api/hub/manifest", (e) => require(`${__hooks}/../../hub/lib/app_side.js`).manifestRoute(e, "shop"));
routerAdd("GET", "/api/hub/lists", (e) => require(`${__hooks}/../../hub/lib/app_side.js`).listsRoute(e, "shop"));
routerAdd("PUT", "/api/hub/lists/{list}", (e) => require(`${__hooks}/../../hub/lib/app_side.js`).listsRoute(e, "shop"));
