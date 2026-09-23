# Farm Event Tracker: Development Plan

Status: **Approved direction, Phase 0 (design) in progress.** Decisions from review are in section 0. This plan sets the stack, the data model, and the build order, and it builds in a way to iterate on the design before the app is built.

---

## 0. Decisions from review (2026-09-23)

| Question | Answer | What it changes |
|---|---|---|
| Location | Corinth, Ontario (Bayham, Elgin County) | Default weather point about 42.78° N, 80.87° W. Adjustable in Settings. |
| Users | Family and crew, mostly on phones | **Mobile-first** layout. Each person gets a login and every event records who logged it. Installable to the home screen (PWA). Public access through **Tailscale Funnel** so crew don't need to install anything. |
| Past records | Mostly handwritten notes, some spreadsheets | **Import moves to Phase 1.** A CSV template for spreadsheets, plus a workflow for handwritten notes: photograph pages, have Claude transcribe them into the CSV template, review, import. |
| Google Calendar | One-way push is a good start | Phase 3 stays as written. |
| Units | Temperature in °C, rain in inches | Open-Meteo is called with `temperature_unit=celsius&precipitation_unit=inch`. Growing degree days use base 10 °C. |
| Style | Clean and minimalist, clear and simple icons, titles and descriptions | Lucide icon set (open source). One icon per event type. Plain-language titles with a one-line description on every unit. Details in `DESIGN.md`. |

---

## 1. Goals and constraints

| Requirement | How the plan meets it |
|---|---|
| Free to run | Everything is self-hosted on your Mac mini. The weather API needs no key and costs nothing. The Google Calendar API is free at this volume. Remote access uses Tailscale's free tier. |
| Easy to maintain | One backend binary plus one static frontend. The database is a single SQLite file. No Docker, no cloud database, no servers to patch. |
| Easy to use | A dashboard with a few focused "units". Adding an event takes one form. Types and tags are managed in the UI. |
| Works on PC and Mac with internet | It's a web app, so any browser on any device works. |
| Iterate on design with Claude and on your own | All colours, fonts and spacing live in one tokens file. Claude can mock up screens as artifacts with fake data before any code is written. |
| Open source preferred | Every part of the stack is open source (MIT, Apache or BSD licensed). |

---

## 2. Recommended stack

```
 Browser (PC / Mac / phone)
        │  HTTPS over Tailscale (private) or a Cloudflare Tunnel (public URL)
        ▼
 ┌─────────────────────── Mac mini ───────────────────────┐
 │  PocketBase (one Go binary, run by launchd)            │
 │   ├─ serves the built React frontend (static files)    │
 │   ├─ REST API + admin UI + auth                        │
 │   ├─ SQLite database  (pb_data/)                       │
 │   ├─ scheduled jobs: fetch weather daily, sync GCal    │
 │   └─ built-in backups → iCloud/Google Drive folder     │
 └────────────────────────────────────────────────────────┘
        │                         │
        ▼                         ▼
  Open-Meteo API            Google Calendar API
  (forecast + archive,      (push events to a dedicated
   free, no key)             "Farm" calendar)
```

| Layer | Choice | Why |
|---|---|---|
| Backend and database | **[PocketBase](https://pocketbase.io)** (MIT) | One file to run. You get a database, REST API, login, file uploads (for photos of fields or labels), a web admin panel and scheduled jobs out of the box. Backing up means copying one folder. |
| Frontend | **React + Vite + TypeScript** | This is the same technology Claude uses for design mockups, so a mockup can move into the real app with little rework. |
| Styling | **Tailwind CSS** + **shadcn/ui** components (MIT) | Clean dashboard look by default. All theme values sit in one tokens file (`src/styles/tokens.css`). |
| Calendar view | **FullCalendar** core (MIT) | Month, week and list views, drag-to-reschedule, colour per event type. |
| Charts | **Recharts** (MIT) | Simple weather and timeline charts that match the design system. |
| Weather | **[Open-Meteo](https://open-meteo.com)** (AGPL server, free API) | No API key. Historical daily data back to 1940, so you can backfill weather for past seasons you enter now. Also gives forecasts, soil temperature and evapotranspiration. |
| Google Calendar | Google Calendar API via OAuth (your own free Google Cloud project) | The app is the source of truth and pushes to a dedicated "Farm" calendar, so events show on your phone. |
| Remote access | **Tailscale Funnel** (free personal plan) | Gives the Mac mini a stable public HTTPS address (`https://farm-mini.<your-tailnet>.ts.net`). Crew open it in their phone browser and log in; nothing to install. No router ports opened. PocketBase logins protect the data. |
| Icons | **Lucide** (ISC) | Clean line icons, one per event type. |
| Offline logging | PWA with a local queue | Phones in the field with weak signal save the event locally and send it when back in range (Phase 5). |
| Hosting | **launchd** service on the Mac mini | Starts at boot and restarts on crash. No Docker Desktop overhead. |

### Alternatives considered

- **Google Sheets + Apps Script.** Nothing to host, but the dashboard, weather comparison and design flexibility are weak, and it gets clumsy as history grows.
- **Next.js + Postgres in Docker.** More moving parts to maintain on the Mac mini for no benefit at single-farm scale.
- **Notion or Airtable.** Not free at useful tiers, not open source, and limited custom analytics.
- **Supabase or Firebase free tier.** Works, but adds a cloud dependency with usage limits and you'd lose control of the data. PocketBase gives you the same features locally.

---

## 3. Data model (first version)

All collections live in PocketBase. Fields marked * are required.

**event_types** (fully customisable in the UI)
- name* (e.g. Spray, Planting, Garden, Nutrient, Client Pickup, Harvest)
- color*, icon
- `extra_fields` (JSON): optional type-specific fields. For example, Spray gets *product, rate, area, REI/PHI days* and Planting gets *variety, rows, seed lot*. Defining these as data means new types need no code changes.

**tags** (crops and groupings)
- name* (Strawberries, Cucumbers, Garlic, Garden, Fall Produce…), color, group (e.g. "Crop", "Field", "Client")

**users** (PocketBase built-in)
- name, email, role: owner / family / crew. Crew can add and edit their own events; owners manage types, tags and settings.

**events**
- title*, event_type* → event_types, start_date*, end_date, all_day
- description, tags → tags (many), location/field
- status: planned / done / skipped
- `extra` (JSON): values for the type's extra fields
- attachments (photos, labels)
- logged_by → users (set automatically)
- source: app / import-spreadsheet / import-handwritten
- gcal_event_id, gcal_synced_at
- weather_snapshot (JSON): conditions copied onto the event when it's marked done, so the record survives even if the weather cache is rebuilt

**notes** (the "next year I should…" feature)
- body*, kind: observation / change-for-next-year / issue
- optional links → event, tags, season (year)
- `review_on` date. For example, "remind me in Feb 2027 while planning". These notes surface on the dashboard at that date.
- resolved (bool)

**weather_daily** (cache, filled by a scheduled job)
- date*, t_max, t_min, precip_mm, rain_hours, wind_max, et0, soil_temp_0_7cm, gdd_base10 (computed), source (archive/forecast)

**settings**
- farm name, latitude/longitude, units (°F/in or °C/mm), GDD base temperature, Google Calendar ID

---

## 4. Dashboard "units"

The dashboard is a grid of cards. Each unit is a self-contained component, so units can be rearranged or restyled independently while iterating.

1. **Quick add.** Date, type, title, tags and description in one compact form. Picking a type reveals its extra fields.
2. **Upcoming.** The next 14 days of planned events, with the 7-day forecast alongside (rain days flagged for spray planning).
3. **This week last year(s).** Everything that happened in the same calendar week in prior years, with that week's weather. This is the core "learn from history" view.
4. **Historical weather.** A chart of temperature, rain and cumulative GDD for any season, with event markers overlaid. You can compare two years side by side.
5. **Event history.** A filterable table and timeline by year, type and crop tag, plus a year-over-year strip showing first planting, first spray and first harvest per crop across years.
6. **Notes to review.** "Change for next year" notes that are due, grouped by crop.
7. **Calendar.** A full-page FullCalendar view, colour-coded by type and filterable by tag.

Analytics worth adding once there's data: days from planting to first harvest per crop per year; GDD at planting and at harvest; spray count and product totals per season; rainfall between planting and harvest.

---

## 5. Design iteration workflow

This is the part you asked to spend time on. It has three loops, from fastest to most real.

**Loop A: Claude mockups (no code, minutes per round)**
- Claude builds each dashboard unit, or the whole dashboard, as an interactive artifact with realistic fake farm data.
- You react ("warmer greens", "less dense", "move weather to the top"). Claude revises. Repeat until you like it.
- The decisions get written into `DESIGN.md` (palette, type scale, card style, spacing) and `src/styles/tokens.css`.

**Loop B: the live style guide in the app (you, on your own)**
- The app ships a `/styleguide` page that renders every unit and component with sample data.
- To restyle, edit `tokens.css` (colours, radius, fonts, spacing). The dev server hot-reloads instantly.
- Or ask Claude Code: "make the cards flatter and use a serif for headings". The change lands in the tokens and the style guide shows it immediately.

**Loop C: real use**
- Use the app for a few weeks, then log friction as GitHub issues. Claude sessions can pick those up directly.

**Style direction (from review):** clean and minimalist, with clear and simple iconography, titles and descriptions. The first mockup is `design/mockups/dashboard.html`; decisions are recorded in `DESIGN.md`.

---

## 6. Google Calendar integration

- **Phase 1: one-way push (recommended start).** Creating or editing an event in the app creates or updates it on a dedicated "Farm" Google Calendar. The event is colour-coded by type, with tags and description in the event body. Deletes propagate too. This is simple and reliable, and your phone calendar shows the farm schedule.
- **Phase 2 (optional): pull back.** Periodically import changes made in Google Calendar, for example a client pickup rescheduled from your phone. This needs conflict rules, so it waits until the push flow is proven.
- **Setup (one time, free):** create a Google Cloud project, enable the Calendar API, create an OAuth client, and authorise once in the app's Settings page. The refresh token is stored on the Mac mini.

---

## 7. Build phases

| Phase | Scope | Result |
|---|---|---|
| **0. Design** | Loop A mockups, then lock `DESIGN.md` and tokens | You've approved how it looks before it's built |
| **1. Core MVP** | Repo scaffold, PocketBase schema, logins for family and crew, mobile-first event logging, custom types and tags, calendar view, notes, style guide page, **CSV import** (spreadsheets and transcribed handwritten notes) | Everyone can log from their phone; past records loaded |
| **2. Weather** | Set farm location; daily job for forecast and archive; one-click backfill of past years; historical weather unit with event overlay | Weather context on every event |
| **3. Google Calendar** | OAuth setup page, one-way push, sync status on each event | Events on your phone |
| **4. History and analytics** | "This week last year", year-over-year strip, crop timing and GDD stats, notes-to-review | The planning payoff |
| **5. Hardening** | Offline logging queue, CSV export, automatic backups, launchd service, Tailscale setup guide, update script | Runs unattended on the Mac mini |

Each phase is a separate PR, so you can review and try each one before the next starts.

---

## 8. Running it on the Mac mini

- **Install:** download the PocketBase binary and clone this repo. `./scripts/build.sh` builds the frontend into PocketBase's `pb_public/`. A `launchd` plist starts it at boot.
- **Update:** `./scripts/update.sh` pulls the latest code, rebuilds and restarts. Database migrations run automatically, because PocketBase migrations are committed to the repo.
- **Backup:** PocketBase's scheduled backup writes nightly zips to a folder synced by iCloud or Google Drive. Time Machine covers the rest.
- **Access:** install Tailscale on the Mac mini and turn on Funnel for the app's port. Everyone uses `https://farm-mini.<your-tailnet>.ts.net` from any phone or computer and logs in. Add it to the phone home screen for an app-like icon.
- **Mac settings:** turn on "Prevent automatic sleeping" and "Start up automatically after a power failure" in Energy settings.

---

## 9. Repo layout (planned)

```
Farm-event-tracker/
├─ PLAN.md               ← this file
├─ DESIGN.md             ← design decisions (after Phase 0)
├─ design/reference/     ← your inspiration screenshots
├─ backend/
│  ├─ pb_migrations/     ← schema as code
│  └─ pb_hooks/          ← weather + GCal jobs (JS hooks)
├─ frontend/
│  ├─ src/units/         ← one folder per dashboard unit
│  ├─ src/components/
│  └─ src/styles/tokens.css
└─ scripts/              ← build, update, launchd plist, backup
```

---

## 10. Importing past records

**Spreadsheets:** save as CSV with these columns (extra columns are ignored, missing ones left blank):

```
date, end_date, type, title, crops, field, description, product, rate, notes
2025-10-08, , Planting, Garlic planted, Garlic, North field, Music, 4 beds, , Planted a week late
```

`crops` takes several tags separated by `;`. Unknown types or tags are created during import after you confirm them.

**Handwritten notes:** photograph the pages, then send them to Claude with "transcribe these into the Farm Event Tracker CSV template". Check the CSV, then import it. Imported events are marked `import-handwritten` so they're easy to find and fix later.
