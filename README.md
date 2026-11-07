# 🎲 Project Society

A tabletop RPG where every chip is a choice. Roll **2D6**, score **7 or more** to pass.

The rules live in this repo as one markdown file per subsystem. The repo also contains a companion web app, hosted on **Azure Static Web Apps**, where DMs run campaigns and players keep their characters.

## 📜 Rules

| Document | What it covers |
| :--- | :--- |
| [Quick Start](quick_start.md) | Everything a new player needs for their first session, on one page |
| [Dice Modifiers](dice_modifiers.md) | Every bonus and penalty in one place, and how to turn them into dice |
| [Getting Started](getting_started.md) | The game on one page, the world in brief, session zero, running a job, quick reference |
| [Dice System](dice_system.md) | How every roll works |
| [Character Creation](character_creation.md) | Backgrounds, traits, wounds |
| [Actions](actions.md) | Turns, combat actions, healing, dying, downtime |
| [Equipment & Chips](equipment.md) | Gear, prices, special rules, job pay |
| [Community](community.md) | The home district and sending chips home |
| [Exposure & Trust](exposure_and_trust.md) | Staying deniable, and the handler |
| [Progression](progression.md) | Levels, talents, contacts |
| [Lore](lore.md) | The world of Allaneus, player facing: the layers, Refinement, the houses, Antioch, history (sections waiting to be written) |

Design reviews are tracked in [checklist.md](checklist.md) (not shown in the app).

## 🧰 The app

Players use it on their phones at the table, so it's built around finding things fast: any piece of information is at most two taps from opening the app. Dice are rolled for real; the app helps count them. Sign in with a Microsoft or GitHub account. Rules, Lore, the Market price list and Search also work without signing in.

The bottom bar has five destinations. Search is the magnifier in the top bar, and Settings (theme, your name, characters, backup, sign out) is the gear beside it.

| Destination | What it does |
| :--- | :--- |
| **Sheet** | Opens on your character: wounds, Shaken, chips and level as big numbers, with your traits, weapons, armour and active rules underneath. Everything else is one tap away in sections: count your dice, traits and advances, gear (with a link to the Market), saved rules, background and ties, notes |
| **Market** | Everything for sale (weapons, armour, tools, consumables, grafts, services) with prices, checked against your character: what you own, how it compares with your gear, your chips, and which markets your crew has opened. **Buy** takes the chips and adds the item to your gear; **Pay** covers a service |
| **Rules** | The `.md` files, rendered live and grouped like a wiki (Start here, Core rules, The campaign, Lore) as tiles, with an A to Z topic index on its own page. Underlined terms open their rule in a sheet from the bottom of the screen. **Save** next to a section keeps it on your character |
| **Campaign** | Opens the campaign you used last. Material, Crew, Notes and People |
| **Lore** | The world of Allaneus ([lore.md](lore.md)), player facing, rendered like a rules page so its terms, sections and search all work. More world pages go in the same group |
| **Search** (top bar) | One box for your sheet, your saved rules, game terms and every rules page, with results grouped by type |

**Saved rules** belong to a character: a title, short text, source and an active switch. Save them from the rules, from a term, or write your own. Active ones show at the top of the sheet.

**Count your dice** on the sheet works out the dice for a test, To Hit, To Wound or a survival roll from your traits, gear, talents and Shaken, and shows how each modifier adds up. The full list is in [Dice Modifiers](dice_modifiers.md).

Inside a campaign:

| Tab | Players | DM |
| :--- | :--- | :--- |
| **Material** | The segments the DM has shared, with only the sections meant for you (a section just for you says so). New and Updated markers | Write material in segments. Each section is **DM only**, **Players** (everyone) or **Chosen** players; one switch shares the segment. Preview it as players see it. Archive or delete |
| **Crew** | The crew sheet (read-only), and **Send chips home** to the Pot from your own character | Runs the crew sheet: jobs, Homecoming, Exposure, Trust, projects. Hardship and Raid rolls happen with real dice: the sheet says what to roll and you enter the result. Marks, pay and recovery reach players' characters |
| **Notes** | Your private notes | Your private notes |
| **People** | Who's in, your characters here, leave | Join code, remove players, read-only character sheets, rename, delete |

A player only ever receives the sections meant for them: the API removes the rest, and never says who else a chosen-players section went to. New and Updated markers and the unread dot are worked out per player, so a secret for one player doesn't show up as a change for anyone else.

The app checks for new material and crew sheet changes every 20 seconds while a campaign is open, and whenever you come back to it.

**Backups:** Settings › Backup exports everything in your account as JSON and imports a backup. Importing only adds, and imported material starts unshared. Sections for chosen players come back as DM only, because those players belonged to the old campaign. A save from the old, pre-sign-in app imports too: its characters come into your account and its crew sheet becomes a campaign you run.

**Data from before sign-in** lived only in the browser that made it. Open `legacy-export.html` on the site you used then (for example `https://jayfitzhenry.github.io/ProjectSociety/legacy-export.html`) in that browser to download it, then import the file. Leave the old GitHub Pages site switched on until every player has done this.

**Accessibility:** built to WCAG 2.2 AA and checked with axe-core (see [Tests](#tests)). Dark by default with a light theme in Settings, contrast of at least 4.5:1 for text, 44px tap targets, visible keyboard focus that never hides behind the bars, labelled controls, and no pop-ups the user didn't ask for. The bottom sheet closes with a tap outside, a swipe down or Escape.

## ☁️ How it's built

| Part | What |
| :--- | :--- |
| Front end | Static files at the repo root: `index.html`, `css/`, `js/` (vanilla ES modules), `vendor/`. No build step |
| API | Azure Functions (Node 22, v4 model) in `api/`, served at `/api/*` by Static Web Apps |
| Database | Cosmos DB for NoSQL, database `society`: `users`, `characters`, `notes`, `campaigns` |
| Sign-in | Static Web Apps built-in auth (Microsoft, GitHub). The API reads the user from the platform header only |
| Infra | [`infra/main.bicep`](infra/main.bicep); first-time setup in [`docs/azure-setup.md`](docs/azure-setup.md) |

Every permission check happens in the API. The front end hides things for convenience only. Conventions for working on the code are in [CLAUDE.md](CLAUDE.md).

### Deployment

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

1. **Test**: `npm ci && npm test` in `api/`. If any test fails, nothing deploys.
2. **Deploy**: uploads the site and the `api/` folder to Static Web Apps.

Watch it in the repo's **Actions** tab. The Cosmos connection settings are app settings on the Static Web App (set by the Bicep template), never in the repo.

### Run it locally

You need Node 22, Docker, and two command-line tools:

```sh
npm install -g @azure/static-web-apps-cli azure-functions-core-tools@4
```

1. Start the Cosmos DB emulator:
   ```sh
   docker run -p 8081:8081 -p 1234:1234 mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview --protocol http
   ```
2. Configure the API and create the containers:
   ```sh
   cd api
   cp local.settings.example.json local.settings.json   # the key in it is the emulator's public key
   npm install
   npm run init-local-db
   cd ..
   ```
3. Run the site and API together:
   ```sh
   swa start . --api-location api
   ```
4. Open http://localhost:4280. The sign-in buttons open the CLI's fake login page: type any user name to be that user. Use two browser profiles to play DM and player at once.

`local.settings.json` is git-ignored. Never commit real keys.

### Tests

```sh
cd api && npm test
```

The tests use an in-memory stand-in for Cosmos (`api/test/fake-repo.js`), so they need no database. Every access rule has at least one allowed and one refused case.

**Accessibility check** (local only, needs Chrome or Chromium; set `CHROME` if it isn't at `/usr/bin/chromium`):

```sh
cd test/browser && npm install && npm test
```

It starts a local server (the site plus the real API handlers on the in-memory fake), walks the app on a phone-sized screen as a visitor, a DM and two players, and runs [axe-core](https://github.com/dequelabs/axe-core) against WCAG 2.2 A and AA on every screen, in both themes. It exits 1 if anything fails. `npm run serve` starts the same server on its own, for trying the app by hand: open `http://localhost:8787/login?as=alice`. It isn't part of the deploy.

### Where things are

| Path | Contents |
| :--- | :--- |
| `index.html`, `css/style.css`, `js/theme.js` | Page shell, styles (design tokens at the top), theme applied before first paint |
| `js/app.js` | Router, bottom navigation, sign-in check, save status |
| `js/store.js` | App state and syncing: views change `state` and call `save()`; the store sends only what changed, with ETags |
| `js/api.js`, `js/auth.js`, `js/account.js` | API calls; sign-in; the Settings page |
| `js/characters.js` | The character sheet, the dice counter, saved rules, creation |
| `js/market.js` | The Market: the price list, checked against a character, and buying |
| `js/rules.js`, `js/peek.js`, `js/search.js` | The rules wiki; the bottom sheet for terms and saving rules; search |
| `js/campaign.js`, `js/material.js`, `js/crew.js`, `js/notes.js`, `js/poll.js` | Campaign list and tabs, material segments, crew sheet, notes, polling |
| `js/data.js` | Game numbers: traits, backgrounds, gear, projects, bands, the rules pages and their groups, the glossary, and the dice counter's modifiers. **Update this when a rule's numbers change** |
| `js/dice.js` | Counting dice: net modifier, cap, how many to roll and which to keep |
| `js/md.js` | Safe markdown for user-written text (marked + DOMPurify) |
| `vendor/` | [marked](https://github.com/markedjs/marked) (MIT), [DOMPurify](https://github.com/cure53/DOMPurify) (Apache-2.0 / MPL-2.0) |
| `api/src/handlers/` | API endpoints; routes listed in `api/src/routes.js` |
| `api/src/lib/` | Auth header, permission checks (`access.js`), Cosmos access (`repo.js`), validation |
| `staticwebapp.config.json` | API runtime, `/api/*` requires sign-in, security headers |

Rules text updates itself because it's read straight from the `.md` files.

## 🔒 GM-only rules: today and later

Today the player view hides GM-only sections in the browser. That's cosmetic: the `.md` files are public, so anyone can read them directly.

To make them truly private later:

1. Move each GM-only section out of the public `.md` into `api/gm/<doc>.md`, keyed by the section's anchor, leaving a marker like `<!-- gm: the-handlers-secret -->` in its place.
2. Add `GET /api/rules/gm`, which returns those sections only to users who are DM of at least one campaign.
3. In `js/rules.js`, DMs fetch them and put them back at the markers. Players never receive them.

The API folder is deployed separately from the site, so files under `api/` are never served as static files.
