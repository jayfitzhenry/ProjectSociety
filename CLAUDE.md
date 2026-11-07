# Project Society: conventions

A tabletop RPG (rules as markdown) plus a companion web app on Azure Static Web Apps (Free) with a managed Functions API and Cosmos DB.

## Rules and numbers

- Rules text lives in the root `.md` files, one per subsystem. The app renders them live (`js/rules.js`). Never hard-code rules text in JS.
- Game numbers (prices, bands, tiers, traits, the dice counter's modifiers) live in `js/data.js`. When a rule's numbers change in a `.md`, change `js/data.js` in the same commit. A new rules page or glossary term goes in `RULE_DOCS` / `GLOSSARY` there too.
- The app doesn't roll dice: players roll real dice. It only counts them (`js/dice.js`).
- Don't change rules text or `js/data.js` unless the task needs it, and say so when you do.
- Open questions for the author (rule conflicts, design decisions) go in `docs/questions/`, one file per batch, each question with options and an **Answer:** line. When the author has answered, apply the answers and mark each question ✅ done in that file's status table.

## Front end

- No build step. Vanilla JS ES modules in `js/`, plain CSS in `css/style.css`, `vendor/` for the few third-party files (marked, DOMPurify). No frameworks, bundlers, TypeScript or CSS frameworks.
- Match the existing style: one module per section, views render HTML strings with `esc()` for every user value, event delegation via `el.onclick`/`el.oninput`.
- UX rules (see `docs/update-plan.md`): any information within two taps, at most five bottom-nav destinations, 44px tap targets, WCAG 2.2 AA, no emoji as icons, one accent colour only for interactive or active states, no pop-ups the user didn't ask for. Tappable terms use `data-term` (opens the bottom sheet in `js/peek.js`).
- User-written markdown (campaign material, notes) goes through `js/md.js` (marked + DOMPurify). Only the trusted rules `.md` files use `marked` directly.
- Talk to the API only through `js/api.js`. `js/store.js` owns syncing: views mutate `state` and call `save()`, which diffs and sends changes.
- The front end hides things for convenience only. It is never the permission check.
- Mobile first: players use phones at the table.
- After UI changes, run the accessibility check: `cd test/browser && npm install && npm test` (axe-core over a walk of the app). Add new screens to the walk in `test/browser/a11y.mjs`.

## API (`api/`)

- Azure Functions v4 programming model, Node 22, ESM, HTTP triggers only. Handlers in `api/src/handlers`, routes in `api/src/routes.js`, registration in `api/src/functions/index.js`.
- Identity comes only from the `x-ms-client-principal` header (`api/src/lib/auth.js`). Never trust a user id, owner id or role sent by the browser.
- **Every permission check happens in the API** (`api/src/lib/access.js`). DM vs player is per campaign, from membership docs in Cosmos, not Static Web Apps roles.
- All Cosmos access goes through `api/src/lib/repo.js` (`read`, `create`, `replace`, `remove`, `list`). Tests swap it for `api/test/fake-repo.js`.
- Writes that several people can make use ETags (`If-Match`); a mismatch is HTTP 412 and the UI says "someone else changed this, reload".
- Tests: `cd api && npm test` (`node --test`). Every permission rule has at least one allowed and one refused case. No real database in tests. The deploy workflow blocks on them.

## Cosmos DB (database `society`, 1000 RU/s shared, free tier)

| Container | Partition key | Holds |
| :--- | :--- | :--- |
| `users` | `/id` | user doc, including a copy of their campaign list |
| `characters` | `/ownerId` | characters |
| `notes` | `/ownerId` | private notes |
| `campaigns` | `/campaignId` | `type`: `campaign`, `membership`, `crew`, `story` (a material segment; each section is for the DM, all players or chosen players), `npc` (stats and DM notes for the DM only; players see name, role and description once it's marked known), `snippet` (old, no longer read; deleted with the campaign); plus `joincode` docs in partition `code:<CODE>` |

- Normal page loads must be single-partition reads or point reads. No cross-partition queries.
- Don't add containers without asking: the free tier's throughput is shared.
- Don't change `infra/main.bicep` without saying why.

## Secrets

- Never commit secrets or put them in front-end code. `api/local.settings.json` is git-ignored; copy `api/local.settings.example.json` (the key in it is the public emulator key).
