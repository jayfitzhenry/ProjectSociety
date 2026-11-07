# Claude Code prompt: Project Society web app

Paste everything below the line into Claude Code, run against the `ProjectSociety` repo. Do this after following `docs/azure-setup.md`, so `infra/`, `.github/workflows/deploy.yml` and `docs/` are already in the repo.

---

You're turning Project Society, a tabletop RPG companion app, into a multi-user web app hosted on Azure. Read this whole brief, then read the repo, then **produce a plan and stop for my approval before writing any code.**

## What exists today

- A static, no-build web app at the repo root: `index.html`, `css/style.css`, ES modules in `js/`, rules as markdown files at the root (`getting_started.md`, `dice_system.md`, etc.) rendered live by `js/rules.js`.
- Sections: Rules, Dice, Combat, Characters (creation wizard + in-play sheet), Crew (community projects, the Pot, Exposure, Trust, jobs, Homecoming, log).
- All state lives in `localStorage` under `project-society:v1`, managed by `js/store.js`. Shape: `{ version, characters[], crew, settings, history }`. `js/store.js` has a `migrate()` for old saves; keep that pattern.
- Game numbers live in `js/data.js`. Rules text is the source of truth for rules; don't hard-code rules text into JS.
- `js/rules.js` hides "GM only" sections client-side with a player-view toggle.

## What I want

1. **Cloud saves**: characters and crew data stored in a database, not the browser.
2. **Login required**: nobody uses the app without signing in.
3. **DM experience**: a DM creates a campaign, invites players, writes stories (session notes, scenes, handouts) and shares snippets from them with all players or chosen players.
4. **Player experience**: a player manages their characters, keeps private notes, and sees their campaign's shared community (the current Crew section) and the snippets the DM has shared with them.

## Fixed decisions (don't change these without asking)

- **Hosting**: Azure Static Web Apps, Free plan. Infra is already defined in `infra/main.bicep`; deployment is `.github/workflows/deploy.yml`. Read `docs/azure-setup.md`.
- **Front end stays no-build vanilla JS** with ES modules. No React, no bundler, no TypeScript compile step for the front end. Match the existing code style.
- **API**: managed Azure Functions in `api/`, Node 20, Functions v4 programming model, plain JavaScript (ESM or CommonJS, pick one and be consistent). HTTP triggers only. Set `"platform": { "apiRuntime": "node:20" }` in `staticwebapp.config.json`.
- **Database**: Cosmos DB for NoSQL via `@azure/cosmos`, settings from `COSMOS_ENDPOINT`, `COSMOS_KEY`, `COSMOS_DATABASE`. Containers already exist:
  - `users` (pk `/id`)
  - `characters` (pk `/ownerId`)
  - `notes` (pk `/ownerId`)
  - `campaigns` (pk `/campaignId`): holds the campaign doc, membership docs, the campaign's crew state, stories and snippets, distinguished by a `type` field.
  Design queries so normal page loads are single-partition reads. Don't add containers without asking; the free tier's 1000 RU/s is shared across all of them.
- **Auth**: Static Web Apps built-in auth with the preconfigured `github` and `aad` providers. Read the user from the `x-ms-client-principal` header in the API. Do not trust any user id sent from the browser.
- **DM vs player is per campaign**, stored as membership docs in Cosmos (`role: 'dm' | 'player'`). Don't use Static Web Apps roles or invitations for this. One person can be DM of one campaign and a player in another.
- **Every permission check happens in the API.** The front end hides things for convenience only.
- **Snippet delivery is polling** (e.g. every 20 seconds while a campaign view is open, and on focus). No SignalR or Web PubSub for now.
- **Concurrency**: crew state is edited by several people. Use Cosmos ETags for optimistic concurrency and show a clear "someone else changed this, reload" message on conflict.

## Data model to start from (refine in your plan)

- `user`: `{ id, provider, displayName, createdAt }`, created on first sign-in.
- `character`: today's character object plus `{ id, ownerId, campaignId|null, updatedAt }`.
- `note`: `{ id, ownerId, campaignId|null, characterId|null, title, body (markdown), updatedAt }`. Private to the owner.
- `campaign`: `{ id, campaignId (same value), type: 'campaign', name, joinCode, createdBy }`.
- `membership`: `{ type: 'membership', campaignId, userId, role, characterId|null }`.
- `crew`: `{ type: 'crew', campaignId, ...today's crew object }`, one per campaign.
- `story`: `{ type: 'story', campaignId, title, body (markdown), status: 'draft'|'archived' }`. DM only.
- `snippet`: `{ type: 'snippet', campaignId, storyId, title, body (markdown), audience: 'all' | [userIds], sharedAt }`. Players only ever receive snippets whose audience includes them.

## Access rules

- Characters and notes: owner only. Exception: the DM of a campaign can **read** characters attached to that campaign.
- Campaign, crew, snippets: members only. Stories: DM only.
- Joining: a player enters the campaign's join code. The DM can regenerate the code and remove members.
- Removing a member detaches their character from the campaign; it doesn't delete it.

## UX

- Sign-in page with "Sign in with Microsoft" and "Sign in with GitHub". Sign out in the header with the display name.
- After sign-in, a home screen listing the user's campaigns (with their role in each) and characters, plus "Create campaign" and "Join campaign".
- Keep Rules, Dice and Combat as they are.
- Characters: same wizard and sheet, now saved to the API. Optionally attach a character to a campaign.
- Campaign view, player: the shared Crew section, a feed of snippets shared with them (newest first, unread marker), their own notes.
- Campaign view, DM: everything a player sees plus Stories (markdown editor with preview using the existing `vendor/marked.min.js`), a "Share snippet" action that takes selected text or a new block and picks the audience, the member list, the join code, and read-only access to members' character sheets.
- The rules player-view toggle: players see player view only; the DM can toggle. Note in your plan that this is cosmetic, because the `.md` files are public static files. Propose (don't build yet) how GM-only rules could be moved behind the API later.
- Mobile-friendly. Players will use phones at the table.

## Migration

On first sign-in, if `localStorage` has `project-society:v1` data, offer to import it: characters go to the user's account; the crew goes into a new campaign where the user is DM. Keep the existing JSON export/import, now exporting from the cloud.

## How to work

1. **Plan first.** Read the repo, then give me: the file structure you'll add, the API endpoint list (method, path, who may call it), the final data model, how the store layer changes, and anything in this brief you think is wrong or missing. Also ask me these, with your recommendation for each:
   - Which crew fields players can change and which are DM-only (Exposure and Trust feel like DM territory, but confirm).
   - Whether Rules, Dice and Combat should stay usable without signing in.
   - Whether a player can have more than one character in a campaign.
   Stop and wait for my answers.
2. **Build in phases**, committing after each, each one deployable:
   1. `staticwebapp.config.json`, login/logout, `/api/me`, route protection, home screen. In `.github/workflows/deploy.yml`, change `api_location: ""` to `api_location: "api"` in the same commit that adds `api/`.
   2. Characters and notes in the cloud, store layer swapped from `localStorage` to the API (keep `localStorage` only as a short-lived cache if useful), migration/import.
   3. Campaigns, memberships, join codes, shared crew with ETag handling.
   4. Stories and snippets, polling feed, DM views.
   5. Polish: empty states, error messages, mobile layout, README update.
3. **Tests**: API tests with `node --test` (`npm test` in `api/`), covering every permission rule above with at least one allowed and one refused case. Mock Cosmos; don't hit a real database in tests. The deploy workflow runs these and blocks deployment if they fail.
4. **Local dev**: make `swa start . --api-location api` work with the Cosmos emulator. Add `api/local.settings.example.json`; `local.settings.json` stays git-ignored.
5. Create a `CLAUDE.md` recording the conventions above (no build step, where numbers live, permission checks in the API, partition keys) so future sessions follow them.
6. Update `README.md`: the app is now on Azure, how to run locally, how deployment works. Remove the GitHub Pages instructions.

## Don't

- Don't add a front-end framework, bundler or CSS framework.
- Don't put secrets in the repo or in front-end code.
- Don't change rules text or numbers in `js/data.js` unless a task needs it, and tell me if it does.
- Don't change infra in `infra/main.bicep` without saying why.
