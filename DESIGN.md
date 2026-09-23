# Farm Log: Design Notes

Living record of design decisions. Update it whenever a mockup round settles something.

**Direction (from you):** clean and minimalist, with clear and simple iconography, titles and descriptions.

**Current mockup:** `design/mockups/dashboard.html`. Open it in any browser. It uses example data and saves nothing.

## Principles

1. **Phone first.** Family and crew log from the field. Every screen has to work one-handed at about 400 px wide. On phones, the big green **Log** button in the bottom bar opens the log form as a sheet.
2. **Every unit has an icon, a title and a one-line description.** Nobody should have to guess what a card is for.
3. **One icon per event type,** shown everywhere that type appears: in the form, the lists and the calendar.
4. **Colour carries meaning, never decoration.** Green is for actions. Event types and years each get their own colour. Amber pills warn (for example, rain the day before a spray).
5. **Quiet surfaces.** White cards with a hairline border on a pale green-grey background. No shadows, except on the phone log sheet.

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

**Event types** (changeable in Settings): Spray: blue. Planting: green-teal. Nutrient: amber. Harvest: orange. Pickup: pink. Garden: green.

**Type:** Instrument Sans (Google Fonts, open source) at 400, 500 and 600. Numbers use tabular figures so columns line up.

**Icons:** [Lucide](https://lucide.dev) (ISC licence). They're 1.75 px line icons, sized 18 px in text and 20 px in the type picker.

**Shape:** 12 px card radius, 8 px control radius, 16 px gap between units.

**Units:** temperature in °C, rain in inches, growing degree days at base 10 °C.

## Dashboard units (round 1)

| Unit | Desktop position | Phone order |
|---|---|---|
| Log an event | Top left | Opens from the bottom-bar Log button |
| Next 14 days + forecast | Top right | 1 |
| Season heat by year (GDD chart + table) | Middle, wide | 3 |
| Notes for next time | Middle right | 4 |
| This week in past years | Bottom left | 2 |
| Recently logged (with who logged it) | Bottom right | 5 |

## Open design questions

- Should the phone home screen show "This week in past years" above or below the upcoming list?
- Is the growing degree day chart useful to you, or would a simpler "warmer or cooler than last year" summary be better?
- What should the farm's name in the header be?
- Farm logo or initials, instead of the sprout icon?

## Changelog

- **Round 1 (2026-09-23):** first dashboard mockup with all six units, light and dark themes, a phone layout and working log form interactions.
