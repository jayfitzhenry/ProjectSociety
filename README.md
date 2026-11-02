# 🎲 Project Society

GitHub Page: https://jayfitzhenry.github.io/ProjectSociety/ 

A tabletop RPG where every chip is a choice. Roll **2D6**, score **7 or more** to pass.

The rules live in this repo as one markdown file per subsystem. The repo also contains an interactive companion app that runs on GitHub Pages.

## 📜 Rules

| Document | What it covers |
| :--- | :--- |
| [Dice System](dice_system.md) | How every roll works |
| [Character Creation](character_creation.md) | Backgrounds, traits, wounds |
| [Actions](actions.md) | Turns, combat actions, healing, dying, downtime |
| [Equipment & Chips](equipment.md) | Gear, prices, special rules, job pay |
| [Community](community.md) | The home district and sending chips home |
| [Exposure & Trust](exposure_and_trust.md) | Staying deniable, and the handler |
| [Progression](progression.md) | Levels, talents, contacts |

## 🧰 The app

| Section | What it does |
| :--- | :--- |
| 📜 **Rules** | Renders the `.md` files above live, with search, contents, cross-links and a player view that hides GM-only sections |
| 🎲 **Dice** | Build a pool from modifier sources (cancel, then cap at −3), see exact odds, roll |
| ⚔️ **Combat** | Weapon vs armour: To Hit and To Wound odds, special rules (Fire, Pierce, Shock…), full attack rolls |
| 🧰 **Characters** | The six-step creation wizard, then an in-play sheet: wounds, Shaken, scars, chips, market, advances, quick rolls, print |
| 🏠 **Crew** | Community and projects, the Pot, Exposure, Trust, job tracking, Homecoming, Hardship, raids, downtime, log |

Everything is saved in the browser (`localStorage`). Use **Crew › Save data** to export or import a JSON backup.

### Run it locally

The app fetches the `.md` files, so it needs a web server (opening `index.html` from disk won't work):

```sh
python3 -m http.server
# then open http://localhost:8000
```

### Host it on GitHub Pages

1. Push to GitHub.
2. **Settings › Pages › Build and deployment**: Source **Deploy from a branch**, branch **main**, folder **/ (root)**.
3. The site appears at `https://<user>.github.io/ProjectSociety/`.

There is no build step. `.nojekyll` makes Pages serve the files exactly as they are.

### Where things are

| Path | Contents |
| :--- | :--- |
| `index.html`, `css/style.css` | Page shell and styles |
| `js/app.js` | Router and home page |
| `js/dice.js` | Dice engine and exact probabilities |
| `js/data.js` | Game numbers: traits, backgrounds, gear, projects, bands. **Update this when a rule's numbers change** |
| `js/rules.js`, `js/dice-view.js`, `js/combat.js`, `js/characters.js`, `js/crew.js` | One file per section |
| `vendor/marked.min.js` | Markdown renderer ([marked](https://github.com/markedjs/marked), MIT) |

Rules text updates itself because it's read straight from the `.md` files. Numbers used by the tools (prices, bands, tiers) are in `js/data.js`.
