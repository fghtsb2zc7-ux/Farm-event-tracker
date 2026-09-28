# Rough Cut Dezigns Orders: setup on the Mac mini

A second app on the same Mac mini as the Farm Log, for the woodworking and 3D printing business.
It has orders (a cart of products with prices), saved customers, a calendar of pickup/ship dates,
and a Products screen where categories, options and prices are edited.

|                 | Farm Log                | Rough Cut Dezigns Orders       |
|-----------------|-------------------------|--------------------------------|
| Address         | `https://kierans-mini.<tailnet>.ts.net` | the same, with `:8443` on the end |
| On the Mac      | `http://127.0.0.1:8090` | `http://127.0.0.1:8091`        |
| Data folder     | `~/FarmLog`             | `~/ShopLog`                    |
| App files       | `server/`               | `shop/`                        |

The two apps have separate databases, logins and admin accounts. Nothing is shared between them.

## One-time setup (about 5 minutes)

From your laptop, sign in to the Mac mini: `ssh kieranfehr@kierans-mini`. Then run:

```bash
cd ~/Farm-event-tracker
git pull
bash scripts/mac/setup.sh shop          # downloads PocketBase, asks for an admin email + password, starts the service
bash scripts/mac/share-online.sh shop   # puts it online at https://<mac>.ts.net:8443
```

`share-online.sh shop` finishes by printing the exact address in bold, for example
`https://kierans-mini.tail1234.ts.net:8443`. Use the whole thing: `https://`, the full name including the
`tail….ts.net` part, and `:8443`.

The admin account only opens the admin dashboard (`/_/`). To sign in to the app itself, make a login:

```bash
bash scripts/mac/add-user.sh shop       # asks for the admin login, then the new person's name, email and password
```

Run it again with the same email to reset someone's password.

If nightly auto-updates are already on for the Farm Log, `setup.sh shop` adds the shop to them automatically.

## Using it

- **Products**: set a price for each option (they start at $0). Add, rename or delete categories and options at any time.
  Past orders keep the names and prices they were sold at.
- **New order**: type the customer's name (saved customers pop up), choose pickup or ship and a date, then tap a
  category and an option to add it to the order. Quantities and prices can be changed per order.
- **Tax**: set in Products → Shop settings (starts at 0%). It applies to items and shipping.
- **Google Sheets**: Products → Google Sheets links, copied from the `.ts.net:8443` address.
  A copy of the CSV files is also saved each night in `~/ShopLog/exports`.
- **Backups**: nightly at 3:15, kept for 14 days, in `~/ShopLog/pb_data/backups`.

## If Safari says it "can't find the server"

- Check the address is the full one printed by `bash scripts/mac/share-online.sh shop`. Safari can't find
  `<mac>.ts.net`-style shortcuts or an address missing the `tail….ts.net` part.
- Try the Farm Log address on the same phone. If the farm opens but `…:8443` doesn't, re-run
  `bash scripts/mac/share-online.sh shop`: it turns sharing on and checks the address answers from the internet.
- The first time, the security certificate can take a minute or two. Wait, then try again.
- On the Mac mini itself, `http://127.0.0.1:8091` always works (that's how you reached the admin dashboard).

## Useful commands

```bash
bash scripts/mac/update.sh                  # update and restart both apps
bash scripts/mac/share-online.sh shop       # show the address and check it's online
bash scripts/mac/add-user.sh shop           # add a login, or reset a password
tail -f ~/ShopLog/logs/shop.log             # the shop's log
sudo launchctl kickstart -k system/ca.roughcutdezigns.orders   # restart the shop
tailscale funnel --https=8443 off           # take the shop offline (the farm stays online)
```
