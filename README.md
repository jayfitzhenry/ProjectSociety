# 🎲 Project Society

A tabletop RPG where every chip is a choice. Roll **2D6**, score **7 or more** to pass.

The rules live in this repo as one markdown file per subsystem. The repo also contains a companion web app, hosted on **Azure Static Web Apps**, where DMs run campaigns and players keep their characters.

## 📜 Rules

| Document | What it covers |
| :--- | :--- |
| [Getting Started](getting_started.md) | The game on one page, the world in brief, session zero, running a job, quick reference |
| [Dice System](dice_system.md) | How every roll works |
| [Character Creation](character_creation.md) | Backgrounds, traits, wounds |
| [Actions](actions.md) | Turns, combat actions, healing, dying, downtime |
| [Equipment & Chips](equipment.md) | Gear, prices, special rules, job pay |
| [Community](community.md) | The home district and sending chips home |
| [Exposure & Trust](exposure_and_trust.md) | Staying deniable, and the handler |
| [Progression](progression.md) | Levels, talents, contacts |

Design reviews are tracked in [checklist.md](checklist.md) (not shown in the app).

## 🧰 The app

Sign in with a Microsoft or GitHub account. Rules, Dice and Combat also work without signing in.

| Section | What it does |
| :--- | :--- |
| 📜 **Rules** | Renders the `.md` files above live, with search, contents and cross-links. Players always see the player view; DMs can show GM-only sections |
| 🎲 **Dice** | Build a pool from modifier sources, see exact odds, roll |
| ⚔️ **Combat** | Weapon vs armour: To Hit and To Wound odds, special rules, full attack rolls |
| 🧰 **Characters** | The creation wizard and in-play sheet, saved to your account. Attach a character to a campaign |
| 🏠 **Campaigns** | Create a campaign (you're its DM) or join one with a code |

Inside a campaign:

| Tab | Players | DM |
| :--- | :--- | :--- |
| 📣 **Feed** | Snippets the DM shared with everyone or with you, newest first, with New markers | Everything shared, who sees it, change audience, unshare, share something new |
| 🏠 **Crew** | The shared crew sheet (read-only), and **Send chips home** to the Pot from your own character | Runs the crew sheet: jobs, Homecoming, Exposure, Trust, projects. Marks, pay and recovery reach players' characters |
| 📝 **Notes** | Your private notes | Your private notes |
| 📖 **Stories** | | Session notes, scenes and handouts in markdown. Share a selection or a new block with chosen players |
| 👥 **Members** | Who's in, Leave | Join code, remove players, read-only character sheets, rename, delete |

The feed checks for new snippets every 20 seconds while a campaign is open, and whenever you come back to the app.

**Backups:** Home › Backup exports everything in your account as JSON and imports a backup. Importing only adds. A save from the old, pre-sign-in app imports too: its characters come into your account and its crew sheet becomes a campaign you run.

**Data from before sign-in** lived only in the browser that made it. Open `legacy-export.html` on the site you used then (for example `https://jayfitzhenry.github.io/ProjectSociety/legacy-export.html`) in that browser to download it, then import the file. Leave the old GitHub Pages site switched on until every player has done this.

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

### Where things are

| Path | Contents |
| :--- | :--- |
| `index.html`, `css/style.css` | Page shell and styles |
| `js/app.js` | Router, sign-in check, save status |
| `js/store.js` | App state and syncing: views change `state` and call `save()`; the store sends only what changed, with ETags |
| `js/api.js`, `js/auth.js` | API calls; sign-in page and account menu |
| `js/home.js`, `js/campaign.js`, `js/feed.js`, `js/stories.js`, `js/notes.js` | Home, campaign tabs, snippet feed, DM stories, notes |
| `js/rules.js`, `js/dice-view.js`, `js/combat.js`, `js/characters.js`, `js/crew.js` | One file per game section |
| `js/data.js` | Game numbers: traits, backgrounds, gear, projects, bands. **Update this when a rule's numbers change** |
| `js/dice.js` | Dice engine and exact probabilities |
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
