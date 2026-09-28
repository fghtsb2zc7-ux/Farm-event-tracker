# Rough Cut Dezigns Orders

Order tracking for the woodworking and 3D printing business. It runs as a second PocketBase app beside the
Farm Log (`server/`) and reuses its building blocks: `pb_public/css/app.css` and `js/adapter.js` are copies of the
Farm Log's, with `css/shop.css` adding the Rough Cut Dezigns colours and shop screens.

- `pb_migrations/`: collections `customers`, `orders`, `catalog`, `config` (team) and `shop_admin` (owner only).
  Every record keeps its content in one JSON `data` field.
- `pb_hooks/`: CSV exports (`/api/shop/csv/<file>?key=…`) and the nightly copy in `~/ShopLog/exports`.
- `pb_public/`: the app. Icons are inlined at the top of `js/app.js` (Lucide, ISC licence); fonts are bundled in
  `fonts/` (SIL Open Font License). Bump `VERSION` in `sw.js` when releasing.

Setup and day-to-day use: [docs/SHOP-SETUP.md](../docs/SHOP-SETUP.md).
