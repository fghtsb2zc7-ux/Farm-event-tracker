/// <reference path="../pb_data/types.d.ts" />

// Rough Cut Dezigns Orders is shared at <this address>/shop/. Tailscale Funnel sends those requests straight to
// the shop, so they only reach the Farm Log when that /shop rule is missing on the Mac mini. Say so plainly
// instead of showing the farm.
const shopNotShared = (e) => e.html(503, `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Shop not shared yet</title>
<body style="font-family: system-ui, sans-serif; max-width: 34rem; margin: 3rem auto; padding: 0 16px; line-height: 1.5; color: #2a2a2c; background: #f6f6f4">
<h1 style="font-weight: 500">The shop isn't shared yet</h1>
<p>This address reached the Farm Log, which means the Mac mini isn't sharing Rough Cut Dezigns Orders at <b>/shop/</b>.</p>
<p>On the Mac mini, run:</p>
<pre style="background: #fff; padding: 12px; border-radius: 8px; white-space: pre-wrap">cd ~/Farm-event-tracker && git pull
bash scripts/mac/share-online.sh shop</pre>
<p>Then reload this page.</p>
</body>`);
routerAdd("GET", "/shop", shopNotShared);
routerAdd("GET", "/shop/{path...}", shopNotShared);

// The same for the App Hub control panel at /hub/.
const hubNotShared = (e) => e.html(503, `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Control panel not shared yet</title>
<body style="font-family: system-ui, sans-serif; max-width: 34rem; margin: 3rem auto; padding: 0 16px; line-height: 1.5; color: #2a2a2c; background: #f6f6f4">
<h1 style="font-weight: 500">The control panel isn't shared yet</h1>
<p>This address reached the Farm Log, which means the Mac mini isn't sharing the App Hub at <b>/hub/</b>.</p>
<p>On the Mac mini, run:</p>
<pre style="background: #fff; padding: 12px; border-radius: 8px; white-space: pre-wrap">cd ~/Farm-event-tracker && git pull
bash scripts/mac/share-online.sh hub</pre>
<p>Then reload this page.</p>
</body>`);
routerAdd("GET", "/hub", hubNotShared);
routerAdd("GET", "/hub/{path...}", hubNotShared);
