# Farm Log: Design Notes

Living record of design decisions. Update it whenever a mockup round settles something.

**Direction (from you):** clean and minimalist, with clear and simple iconography, titles and descriptions.

**Brand (from the Fehr Grown Farms logo, `design/reference/fehr-grown-farms-logo.jpg`):** charcoal `#424244` and lime green `#8EC444`. The header uses a text wordmark ("fehr grown" over a green "FARMS") in Questrial, which is close to the logo's geometric typeface. Primary buttons are lime green with dark text (`#1D2A0E`, 7.3:1 contrast). Green text and icons use a deeper `#4D7F1E`, because lime on white is too faint for text (2.1:1).

**Current mockup:** `design/mockups/dashboard.html`. Open it in any browser. It has four screens (Dashboard, Calendar, History, Notes), uses example data and saves nothing.

## Principles

1. **Phone first.** Family and crew log from the field. Every screen has to work one-handed at about 400 px wide. On phones, the big green **Log** button in the bottom bar opens the log form as a sheet.
2. **Every unit has an icon, a title and a one-line description.** Nobody should have to guess what a card is for.
3. **Pick, don't type.** Anything entered more than once (chemicals, fields, crops, clients) comes from a saved list that can be edited in place. Typing is only for new entries and notes.
4. **One icon per event type,** shown everywhere that type appears: in the form, the lists and the calendar.
5. **Colour carries meaning, never decoration.** Green is for actions. Event types and years each get their own colour. Amber pills warn (for example, rain the day before a spray).
6. **Quiet surfaces.** White cards with a hairline border on a pale green-grey background. No shadows, except on the phone log sheet.

## Tokens

The tokens sit at the top of the mockup's `<style>` block. They will move to `frontend/src/styles/tokens.css` in Phase 1.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#f5f7f4` | `#101412` | Page background |
| `--surface` | `#ffffff` | `#181e1a` | Cards |
| `--ink` | `#17201a` | `#edf2ee` | Main text |
| `--muted` | `#76827a` | `#87938b` | Descriptions, dates |
| `--line` | `#e1e6e0` | `#2a332d` | Borders, dividers |
| `--accent` | `#2d6a4f` | `#5fb38a` | Buttons, active states |

**Event types** (changeable in Settings): Spray: blue. Planting: green-teal. Nutrient: amber. Harvest: orange. Garden: green. Order pickups (not an event type) use pink with a basket icon.

**Type:** Instrument Sans (Google Fonts, open source) at 400, 500 and 600. Numbers use tabular figures so columns line up.

**Icons:** [Lucide](https://lucide.dev) (ISC licence). They're 1.75 px line icons, sized 18 px in text and 20 px in the type picker.

**Shape:** 12 px card radius, 8 px control radius, 16 px gap between units.

**Units:** temperature in °C, rain in inches, growing degree days at base 10 °C.

## Dashboard units (round 1)

| Unit | Desktop position | Phone order |
|---|---|---|
| Log an event | Top left | Opens from the bottom-bar Log button |
| Next 14 days + forecast | Top right | 1 |
| This season vs past years (harvest volume, monthly temperature, season heat (GDD), key-date timeline) | Middle, full width | 4 |
| Order pickups (this week) | Lower left | 2 |
| This week in past years | Lower right | 3 |
| Notes for next time | Bottom left | 5 |
| Recently logged (with who logged it) | Bottom right | 6 |

**Screens:** Dashboard, Calendar, Orders, History, Notes. On phones the bottom bar holds Home, Calendar, Log, Orders and More, and More opens History and Notes.

## Open design questions

- Should the phone home screen show "This week in past years" above or below the upcoming list?
- Brand colours and logo from the Fehr Grown Farm Instagram (@fehrgrownfarm). Instagram can't be reached from Claude's environment, so this needs a logo file and colours saved to `design/reference/` or pasted into chat.
- Should orders record which crops they include, so they count toward harvest numbers?

## Changelog

- **Beta 1 (2026-09-24):** live beta published from `app-beta/farm-log.html`, in brand colours, with all example data removed. Adds an Import screen for spreadsheets and handwritten notes.

- **Round 1e (2026-09-24):** the header now reads **Fehr Grown Farm**. The season heat (GDD) chart is back as a panel inside "This season vs past years", with the chosen crop's events marked on each year's line and a GDD and rain table. Dashboard order unchanged.

- **Round 1d (2026-09-24):** removed Pickup as an event type. Added an **Orders** screen (name, phone, what they ordered, pickup date and time, total, paid so far) with Upcoming, Unpaid and Picked up filters. Orders can be marked paid, marked picked up, or confirmed if they came from the order form. The dashboard gets an "Order pickups" unit, and the calendar shows pickups. Replaced the heat chart with **This season vs past years**: harvest volume by year, monthly average temperature, and a season timeline with labelled key dates and a days-earlier/later table.

- **Round 1c (2026-09-23):** the log form's first field is now a dropdown of saved items for the chosen type (chemicals for Spray, fertilizers for Nutrient, clients for Pickup, and so on). Type to filter, pick one to fill in its saved rate and re-entry time, save a new one, or remove one with ×. Fields and Crops are tap-to-select lists with an "Edit list" button for adding and removing entries. You can pick several fields.

- **Round 1b (2026-09-23):** the Calendar, History and Notes buttons now open working screens. Calendar is a month grid (icons only on phones) and shows the selected day's events below it. History lists every event, filterable by year, type and crop, with imported records marked. Notes has an add-note form with a reminder month, and lets you mark notes resolved.

- **Round 1 (2026-09-23):** first dashboard mockup with all six units, light and dark themes, a phone layout and working log form interactions.
