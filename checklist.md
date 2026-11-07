# ✅ Project Society — System Checklist

> **What a complete tabletop RPG system should cover**, and how Project Society measures up.
> Use the checklist for every future review. The review and remediation sections record the latest pass.

This is a working document for the designer. It isn't one of the rulebooks, so the app doesn't show it.

---

## 📑 Contents

1. [How to Use This](#-how-to-use-this)
2. [The Checklist](#-the-checklist)
3. [Review: 2026-11-02](#-review-2026-11-02)
4. [Remediation](#-remediation)
5. [Left for the Author](#-left-for-the-author)

---

## 🧭 How to Use This

1. Work through each section of [the checklist](#-the-checklist) against the current rules and app.
2. Mark every item ✅ **covered**, ⚠️ **partial or inconsistent**, or ❌ **missing**.
3. Every ⚠️ and ❌ becomes a numbered remediation with a clear instruction.
4. New rules from a remediation go in as 🟡 **proposed** in that document's Design Decisions table, so the designer can rule on them.
5. When a rule's numbers change, update `js/data.js` in the same change.

---

## 📋 The Checklist

### 🎲 A. Core resolution

| # | A complete system… |
| :---: | :--- |
| A1 | States one core mechanic up front, in a sentence |
| A2 | Lists every common modifier source in one place |
| A3 | Explains how modifiers stack, cancel and cap |
| A4 | Defines criticals and fumbles, in and out of combat |
| A5 | Publishes the odds, so designers and players can judge modifiers |
| A6 | Says **who rolls** when two sides oppose each other |
| A7 | Says when a failed roll can be retried |
| A8 | Tells the GM when to call for a roll and how to set difficulty |

### 🧰 B. Characters

| # | A complete system… |
| :---: | :--- |
| B1 | Has a step-by-step creation procedure with a time target |
| B2 | Offers archetypes (backgrounds) with **balanced** starting packages |
| B3 | Defines competence (traits or skills) with guidance for edge cases |
| B4 | Gives each character a personal motivation the GM can use |
| B5 | Shows the character sheet |
| B6 | Includes a worked example of a full character |

### ⚔️ C. Combat

| # | A complete system… |
| :---: | :--- |
| C1 | Defines turn order, initiative and surprise |
| C2 | Lists the actions available in a turn |
| C3 | Covers movement, range, line of sight and cover |
| C4 | Defines the damage model and status effects |
| C5 | Resolves **interactions** between effects (stacking, overflow, immunities) |
| C6 | Covers manoeuvres that aren't damage: grapple, trip, disarm |
| C7 | Provides enemy stat blocks, morale, and a way to build new enemies |
| C8 | Handles area effects |
| C9 | Covers **visibility**: darkness, smoke, fog |
| C10 | Covers **chases and vehicles** |

### 🩸 D. Injury, healing and death

| # | A complete system… |
| :---: | :--- |
| D1 | Defines wounds, dying and death |
| D2 | Provides healing at more than one speed (in combat, after, between sessions) |
| D3 | Says how replacement characters join |
| D4 | Covers **hazards** outside combat: falls, fire, steam, drowning, gas, poison |
| D5 | Says what happens when an untrained character tries a Medic action |

### 🛒 E. Equipment and economy

| # | A complete system… |
| :---: | :--- |
| E1 | Names the currency |
| E2 | Has a price list built on stated pricing principles |
| E3 | Defines every tag and special rule used on gear |
| E4 | Controls access to better gear |
| E5 | Balances income against spending, with a pacing check |
| E6 | Explains selling and second-hand value |

### 📈 F. Advancement

| # | A complete system… |
| :---: | :--- |
| F1 | Says how experience is earned |
| F2 | Has a level table with rewards |
| F3 | Offers meaningful choices at each level, with limits |
| F4 | Settles **group-level edge cases** (ties, absent players, new joiners) |
| F5 | Has an endgame, or a cap with a story payoff |

### 🏠 G. Campaign layer

| # | A complete system… |
| :---: | :--- |
| G1 | Defines the campaign loop (what happens between sessions) |
| G2 | Tracks the patron or faction relationship |
| G3 | Tracks heat or notoriety |
| G4 | Gives the players a home base to protect and grow |
| G5 | Has failure states that turn the campaign rather than end it |
| G6 | Settles **edge cases** where two tracks meet |
| G7 | Points to a long-term goal |

### 🎬 H. GM and table support

| # | A complete system… |
| :---: | :--- |
| H1 | Explains in one page what the game is about and what players do |
| H2 | Gives players enough **setting** to read the rules (a glossary of world terms) |
| H3 | Teaches the GM to **build and run a session** (a job) |
| H4 | Helps the GM build opposition |
| H5 | Keeps GM-only material separate from player material |
| H6 | Covers **session zero and safety tools** |
| H7 | Has a **one-page quick reference** |
| H8 | Has a **game-wide glossary** of rules terms |

### 📄 I. Document quality

| # | A complete system… |
| :---: | :--- |
| I1 | Splits rules into documents with contents and working cross-links |
| I2 | Records design decisions and their status |
| I3 | Has worked examples whose arithmetic is correct |
| I4 | Has no contradictions between documents |
| I5 | Dates each document |

### 🧰 J. Companion app

| # | A complete system… |
| :---: | :--- |
| J1 | Shows every rules document |
| J2 | Uses numbers that match the rules documents |
| J3 | Helps count the dice for **every roll** in the rules |
| J4 | Applies rule effects automatically wherever the app already tracks the state |
| J5 | Handles campaign state correctly through edge cases |
| J6 | Supports every payment source the rules allow |
| J7 | Saves, exports and imports data |
| J8 | Explains clearly how to run it, and fails clearly when it can't |
| J9 | Works on phones and prints cleanly |

---

## 🔎 Review: 2026-11-02

| # | Status | Finding |
| :---: | :---: | :--- |
| A1 | ✅ | "Roll 2D6, score 7 or more" heads the dice system |
| A2 | ⚠️ | Tools, Help and Smoke are missing from the dice system's modifier list → **R1** |
| A3 | ✅ | Cancel, then cap at −3 |
| A4 | ✅ | Both, with effects by roll type |
| A5 | ✅ | Exact odds tables, verified by the app's engine |
| A6 | ❌ | Never stated. It's unclear whether a guard rolls to spot a sneaking character → **R2** |
| A7 | ✅ | [Out of Combat](actions.md#-out-of-combat): retry only if something changes |
| A8 | ⚠️ | The trait rules cover modifiers, but there's no GM guidance on difficulty or what a failed roll should cost → **R12** |
| B1 | ✅ | Six steps, about ten minutes |
| B2 | ⚠️ | Kits are "worth about 30 chips", but they actually range from 25c (Line Fitter, Cutpurse) to 40c (Clinic Hand, Deserter) → **R11** |
| B3 | ✅ | Covers / Doesn't cover columns, plus the overlap note |
| B4 | ✅ | Ties to home, used by Hardship events |
| B5 | ✅ | |
| B6 | ✅ | Dace. The arithmetic checks out |
| C1 | ✅ | Alternating activations, and ambushers go first |
| C2 | ✅ | |
| C3 | ✅ | |
| C4 | ✅ | |
| C5 | ⚠️ | Unclear what happens when an effect gives **2 Shaken** (Shock, Haymaker) to a target already at −2 or −3, or when a Shock weapon rolls Shaken against a target at −3 (a wound from a non-lethal weapon?) → **R3** |
| C6 | ⚠️ | Brawler "covers grappling", but no rule says what a grapple does → **R4** |
| C7 | ✅ | Six profiles, nerve, and "making your own" |
| C8 | ✅ | Fire, Blast, choke gas |
| C9 | ❌ | Open question in Actions → **R5** |
| C10 | ❌ | Open question in Actions → **R6** |
| D1 | ✅ | |
| D2 | ✅ | Four speeds |
| D3 | ✅ | Crew level − 1 (full level with Hall II) |
| D4 | ❌ | No rules for falls, fire, steam, drowning or poison, in a steam-and-boiler setting → **R7** |
| D5 | ⚠️ | Treat Wounds says it's −1 without Medic. Patch Up and Stabilise don't say → **R8** |
| E1–E6 | ✅ | Prices follow the stated bands. All 60 items match `js/data.js` |
| F1–F3 | ✅ | |
| F4 | ⚠️ | "The level most of the crew is at" has no rule for ties. The app silently picks the higher → **R9** |
| F5 | ✅ | Level 10: "A name on the street" |
| G1–G5 | ✅ | |
| G6 | ⚠️ | Two edge cases: does a **failed** job that stayed quiet still count as clean? Does **Burned** (10) count as Hot (7+) for raids? The app assumes yes to both, but the rules don't say → **R10** |
| G7 | ⚠️ | Cistern III is a first step. The rest is a story question → [Left for the Author](#-left-for-the-author) |
| H1 | ❌ | Only the README's one line → **R12** |
| H2 | ❌ | Allaneus, the Works, the Sunk, the Terraces, the Heights, Antioch and the Liveried are used everywhere and never explained. The World Bible is referenced but not in the repo → **R12**, plus [Left for the Author](#-left-for-the-author) |
| H3 | ❌ | Job pay and enemies exist, but there's nothing on how to build or run a job → **R12** |
| H4 | ✅ | [Enemies](actions.md#-enemies): making your own |
| H5 | ✅ | "GM only" sections, hidden by the app's player view |
| H6 | ❌ | The game includes kidnapping, sickness, debt and death, and has no safety guidance → **R12** |
| H7 | ⚠️ | The dice system's odds tables are close, but there's no one-page summary of the whole game → **R12** |
| H8 | ⚠️ | The glossary covers dice terms only → **R12** |
| I1 | ✅ | Every cross-link resolves, both on GitHub and in the app (checked by script) |
| I2 | ✅ | |
| I3 | ✅ | Every worked example was re-added: Dace, the three jobs on Cistern Row, the loud job, healing |
| I4 | ⚠️ | See C5, D5 and G6 |
| I5 | ✅ | |
| J1 | ✅ | Seven docs. The new doc must be added → **R13** |
| J2 | ✅ | Prices, modifiers and markets match for all 60 items |
| J3 | ⚠️ | No tool for the **survival roll** (Medic, satchel, Stabilised, Clinic III, Hard to Kill) → **R14** |
| J4 | ⚠️ | **Mending** armour isn't applied at the end of combat. The attack calculator ignores Shaken overflow and Haymaker → **R15**, **R16** |
| J5 | ⚠️ | Bug: the free starting tier disappears as soon as anything is logged (for example, moving Exposure) before the tier is picked → **R17** |
| J6 | ⚠️ | The rules say the Need can be paid from characters' chips. The app only offers the pay and the Pot → **R18** |
| J7–J9 | ✅ | |

### 🧰 Section J against the new app: 2026-11-07

The UX pass replaced the dice roller with a dice counter (players roll real dice) and rebuilt the app's screens, so section J was checked again.

| # | Result | Notes |
| :---: | :--- | :--- |
| J1 | ✅ | Eleven docs, in four groups: Start here (Quick Start, Dice Modifiers, Getting Started), Core rules, The campaign, and World (World History, a placeholder) |
| J2 | ✅ | Numbers still come from `js/data.js`. The To Wound diagram in the Dice System no longer lists a trait, which matches Character Creation and the counter |
| J3 | ✅ | Reworded: the app counts dice for tests, To Hit, To Wound and survival rolls, and the crew sheet says what to roll for Hardship and Raids |
| J4 | ⚠️ | Shaken past `-3` still becomes a wound on the sheet. But the old **End of combat** button went with the combat screen, so **Mending** armour no longer removes a wound by itself → **R19** |
| J5 | ✅ | The free starting tier still uses `startChosen` |
| J6 | ✅ | **Characters chip in…** is still on the Need step |
| J7 | ✅ | Backup and import are under Settings |
| J8–J9 | ✅ | |

---

## 🔧 Remediation

Each instruction is written so it can be done on its own. New rules are 🟡 **proposed**.

### 📜 Rules

| # | Where | Instruction | Status |
| :---: | :--- | :--- | :---: |
| **R1** | [Dice System](dice_system.md#-modifier-sources) | Add **Tool** (`+1`, one per roll), **Help** (`+1`, one helper) and **Smoke** (`-1`, separate from cover) to the modifier tables, each linking to its source rule. | ✅ Done |
| **R2** | [Actions: Out of Combat](actions.md#-out-of-combat) | Add **Who rolls**: only the crew rolls tests. Opposition sets the difficulty (Hard for an alert or skilled opponent, Easy for a careless one). In combat, both sides roll their own attacks. | ✅ Done |
| **R3** | [Equipment: Shock](equipment.md#special-rules), [Progression: Haymaker](progression.md#-trait-talents) | Add the **Shaken overflow** rule: when a result gives several Shaken, add them one at a time, and each one past `-3` becomes 1 wound. A **Shock** weapon Knocks Out instead of wounding, for any Shaken past `-3`. | ✅ Done |
| **R4** | [Actions: Combat Actions](actions.md#-combat-actions) | Add a **Stunt** action (grapple, trip, disarm) with three simple effects. Don't duplicate Shove or Menace. | ✅ Done |
| **R5** | [Actions: Position](actions.md#-position-cover-sight-and-melee) | Add **Darkness**. It counts as cover against ranged attacks, makes tests that rely on sight Hard, and makes sneaking Easy. A lantern removes the penalty for whoever carries it, but lights them up. Close the open question. | ✅ Done |
| **R6** | Actions (new section) | Add **Chases and Vehicles**: "three before three" chase tests, attacks to or from a moving vehicle count as cover, vehicles are `-2` to wound and stop on a 12, crashes and ramming. Close the open question. | ✅ Done |
| **R7** | Actions (new section) | Add **Hazards**: falls, fire, steam and crushing use a wound roll at `+0` / `+1` / `+2`. Breathless rounds give Shaken. Poison is a single hazard roll that a Medic test can stop. Shaken from a hazard lasts until the end of the scene. | ✅ Done |
| **R8** | [Actions: Combat Actions](actions.md#-combat-actions) | State that **Patch Up**, **Stabilise**, **Treat Wounds** and **survival rolls** are all `-1 dice` without the Medic trait. | ✅ Done |
| **R9** | [Progression: Marks](progression.md#-marks) | Add: if the crew is split evenly, the **crew level is the higher** level. | ✅ Done |
| **R10** | [Exposure & Trust](exposure_and_trust.md#-clean-jobs) | State that a **failed** job can still be clean (+10c, +1 Trust), but it earns only 1 Mark. State that **Burned** counts as Hot for raids. | ✅ Done |
| **R11** | [Character Creation: Backgrounds](character_creation.md#-backgrounds) | Correct "about 30 chips" to the true range (**25–40c**) and add a 🟡 decision on whether to even the kits out. The numbers stay as they are until that's decided. | ✅ Done |
| **R12** | New: [Getting Started](getting_started.md) | Write one document with: the game on one page, the world in brief (terms as the rules use them), session zero and safety tools, first-session setup, **running a job** (structure, difficulty, failure costs, opposition by job type, wrap-up), a one-page quick reference, and a game-wide glossary. | ✅ Done |

### 🧰 App

| # | Where | Instruction | Status |
| :---: | :--- | :--- | :---: |
| **R13** | `js/data.js`, `js/app.js`, `README.md` | Add **Getting Started** to `RULE_DOCS` (first in the list), the README tables and the home page text. | ✅ Done |
| **R14** | `js/dice-view.js`, `js/dice.js`, `js/characters.js` | Add a **🫀 Survival** mode to the dice roller (Medic / no Medic, satchel, dressing, Stabilised, Clinic III, Hard to Kill), with Survives / Dies results. Make `#/dice/survival` open it, and link to it from the Dying banner on the character sheet. Merge cover, darkness and a moving vehicle into one To Hit source, because they don't stack. | ✅ Done |
| **R15** | `js/characters.js` | Make **End of combat** also remove 1 wound for a character carrying Mending armour, and say so. | ✅ Done |
| **R16** | `js/combat.js` | Apply **Shaken overflow** (R3) in the outcome odds and rolls: Shock past −3 Knocks Out, and overflow past −3 becomes wounds. Add a **Haymaker** toggle for melee weapons. Relabel cover as "cover, darkness or a moving vehicle". | ✅ Done |
| **R17** | `js/store.js`, `js/crew.js` | Track the free starting tier with a `startChosen` flag instead of "the log is empty". Migrate old saves so their behaviour doesn't change. | ✅ Done |
| **R18** | `js/crew.js` | Add **Characters chip in** to the Need step: record chips paid from characters' own pockets, which they then subtract on their sheets. | ✅ Done |
| **R19** | `js/characters.js` | Add an **After the fight** action to the character sheet: clear Shaken, and remove 1 wound for a character wearing Mending armour, and say so. | ⬜ To do |

---

## 📝 Left for the Author

These need the designer's own ideas, not a remediation:

- **The World Bible.** The rules refer to *Project Society — World Bible* for the setting and the handler's secret. It isn't in this repo. [Getting Started](getting_started.md#-the-world-in-brief) explains only the terms the rules use.
- **A way out of the contract** (Community decision 5). Cistern III is the first step. The rest is a story question.
- **Every 🟡 proposed rule**, including the new ones from R2–R12, waits for a ruling in its document's Design Decisions table.

---

<sub>✅ Last reviewed 2026-11-02. Section J checked again 2026-11-07.</sub>
