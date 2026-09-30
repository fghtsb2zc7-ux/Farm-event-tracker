// Turns an app's look settings (chosen in the App Hub) into CSS that overrides the app's design tokens.
// Used on the server for each app's /api/hub/theme.css, and sent to the browser as-is for the live preview,
// so it must stay self-contained (no outside variables or helpers).
//
//   look:   { colors: { brand, accent, logoText, background, surface, text }, fonts: { body, heading },
//             radius, logo }            (every setting is optional; missing ones keep the app's own design)
//   labels: { types: { spray: { color } } }   farm event type colors
//   base:   address prefix for the logo image ("" when this CSS is served from …/api/hub/theme.css)
function themeCss(look, labels, base) {
  look = look || {}; labels = labels || {}; base = base || "";
  var c = look.colors || {}, f = look.fonts || {};
  // Google Fonts offered in the App Hub, with the weights each one has and a fallback.
  var FONTS = {
    "Instrument Sans": ["400;500;600;700", "sans-serif"], "Inter": ["300;400;500;600;700", "sans-serif"],
    "DM Sans": ["300;400;500;600;700", "sans-serif"], "Nunito": ["300;400;500;600;700", "sans-serif"],
    "Work Sans": ["300;400;500;600;700", "sans-serif"], "Poppins": ["300;400;500;600;700", "sans-serif"],
    "Josefin Sans": ["300;400;500;600;700", "sans-serif"], "Questrial": ["400", "sans-serif"],
    "Oswald": ["300;400;500;600;700", "sans-serif"], "Lora": ["400;500;600;700", "serif"],
    "Merriweather": ["300;400;700", "serif"], "Playfair Display": ["400;500;600;700", "serif"],
    "Source Serif 4": ["300;400;500;600;700", "serif"], "Kaushan Script": ["400", "cursive"],
    "Caveat": ["400;500;600;700", "cursive"],
  };
  var hex = function (v) { return /^#[0-9a-f]{6}$/i.test(v || "") ? String(v).toLowerCase() : ""; };
  var rgb = function (h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); };
  var toHex = function (a) {
    return "#" + a.map(function (x) { var s = Math.max(0, Math.min(255, Math.round(x))).toString(16); return s.length < 2 ? "0" + s : s; }).join("");
  };
  var mix = function (a, b, t) { var A = rgb(a), B = rgb(b); return toHex(A.map(function (x, i) { return x + (B[i] - x) * t; })); };
  var lum = function (h) {
    var v = rgb(h).map(function (x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  };
  // Text on a colored button: whichever of near-black or white reads better.
  var on = function (h) { return lum(h) > 0.179 ? "#1b1b1b" : "#ffffff"; };
  // Dark mode keeps the app's dark backgrounds; strong colors are lightened so they stay readable on them.
  var forDark = function (h) { return lum(h) < 0.2 ? mix(h, "#ffffff", 0.4) : h; };

  var light = [], dark = [];
  var brand = hex(c.brand), accent = hex(c.accent), logoText = hex(c.logoText);
  var bg = hex(c.background), surface = hex(c.surface), ink = hex(c.text);
  if (brand) {
    var bd = forDark(brand);
    light.push("--brand-green:" + brand, "--on-brand:" + on(brand));
    dark.push("--brand-green:" + bd, "--on-brand:" + on(bd));
  }
  if (accent) {
    var ad = forDark(accent);
    light.push("--accent:" + accent, "--accent-ink:" + on(accent), "--accent-soft:" + mix(accent, "#ffffff", 0.88));
    dark.push("--accent:" + ad, "--accent-ink:" + on(ad), "--accent-soft:" + mix(ad, "#000000", 0.8));
  }
  if (logoText) { light.push("--brand-grey:" + logoText); dark.push("--brand-grey:" + mix(logoText, "#ffffff", 0.85)); }
  if (bg) light.push("--bg:" + bg, "--surface-2:" + mix(bg, ink || "#000000", 0.05), "--line:" + mix(bg, ink || "#000000", 0.12));
  if (surface) light.push("--surface:" + surface);
  if (ink) light.push("--ink:" + ink, "--ink-2:" + mix(ink, bg || "#ffffff", 0.22), "--muted:" + mix(ink, bg || "#ffffff", 0.42));
  var types = labels.types || {};
  Object.keys(types).forEach(function (k) {
    var col = hex((types[k] || {}).color);
    if (col && /^[a-z]+$/.test(k)) { light.push("--t-" + k + ":" + col); dark.push("--t-" + k + ":" + forDark(col)); }
  });

  var imports = [], fam = function (n) { return '"' + n + '", ' + FONTS[n][1]; };
  if (FONTS[f.body]) { imports.push(f.body); light.push("--font:" + fam(f.body)); }
  if (FONTS[f.heading]) { imports.push(f.heading); light.push("--font-brand:" + fam(f.heading), "--font-script:" + fam(f.heading), "--font-thin:" + fam(f.heading)); }
  var r = Number(look.radius);
  if (look.radius !== undefined && look.radius !== null && look.radius !== "" && r >= 0 && r <= 28) {
    light.push("--radius:" + Math.round(r) + "px", "--radius-sm:" + Math.round(r * 0.66) + "px");
  }

  var css = "";
  var uniq = imports.filter(function (n, i) { return imports.indexOf(n) === i; });
  if (uniq.length) {
    css += '@import url("https://fonts.googleapis.com/css2?' + uniq.map(function (n) {
      var w = FONTS[n][0];
      return "family=" + n.replace(/ /g, "+") + (w === "400" ? "" : ":wght@" + w);
    }).join("&") + '&display=swap");\n';
  }
  if (light.length) css += ":root{" + light.join(";") + "}\n";
  if (dark.length) {
    css += '@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){' + dark.join(";") + "}}\n";
    css += ':root[data-theme="dark"]{' + dark.join(";") + "}\n";
  }
  // A logo picked in the control panel but not saved yet (live preview only).
  var draft = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+\/=]+$/.test(look.logoPreview || "") ? look.logoPreview : "";
  if (draft || Number(look.logo) > 0) {
    // The uploaded logo takes the place of the text logo, keeping its size and position.
    css += '.wordmark{background:url("' + (draft || base + "logo?v=" + Number(look.logo)) + '") center/contain no-repeat;min-height:44px;min-width:120px}' +
      ".wordmark>*{visibility:hidden}\n";
  }
  if (FONTS[f.body]) css += "body{font-family:var(--font)}\n";
  return css;
}

module.exports = { themeCss: themeCss };
