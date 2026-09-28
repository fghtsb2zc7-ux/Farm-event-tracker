# Rough Cut Dezigns Orders: setup on the Mac mini

A second app on the same Mac mini as the Farm Log, for the woodworking and 3D printing business.
It has orders (a cart of products with prices), saved customers, a calendar of pickup/ship dates,
and a Products screen where categories, options and prices are edited.

|                 | Farm Log                | Rough Cut Dezigns Orders       |
|-----------------|-------------------------|--------------------------------|
| Address         | `https://<mac>.ts.net`  | `https://<mac>.ts.net:8443`    |
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

Then open `http://127.0.0.1:8091/_/` on the Mac (or `https://<mac>.ts.net:8443/_/` from anywhere), sign in with
the admin account you just made, and under **users** add a login for yourself (and anyone who helps).
Those logins are what you use in the app itself.

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

## Useful commands

```bash
bash scripts/mac/update.sh                  # update and restart both apps
tail -f ~/ShopLog/logs/shop.log             # the shop's log
sudo launchctl kickstart -k system/ca.roughcutdezigns.orders   # restart the shop
tailscale funnel --https=8443 off           # take the shop offline (the farm stays online)
```
