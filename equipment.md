# 🛒 Project Society — Equipment & Chips

> **Gold buys dice. It never buys past ±2.**
> Gear is priced by how much its dice are worth. Beyond that, chips buy *access* (Refined gear, special rules), not bigger numbers.

Builds on the [Dice System](dice_system.md). See also [Character Creation](character_creation.md), [Actions](actions.md), [Community](community.md), [Exposure & Trust](exposure_and_trust.md) and [Progression](progression.md).

---

## 📑 Contents

1. [Chips](#-chips)
2. [Pricing Principles](#-pricing-principles)
3. [Ranges](#-ranges)
4. [Tags & Special Rules](#️-tags--special-rules)
5. [Markets](#-markets)
6. [Price Lists](#-price-lists)
7. [Earning & Spending](#-earning--spending)
8. [Design Decisions](#-design-decisions)

---

## 🪙 Chips

The currency of Allaneus is the **chip**: a small token of **Refined brass alloy**. The alloy can't be made in the Works, so chips can't be forged by hand. Every chip passed down from the Heights is a little piece of the Refinement in a lower-class pocket.

Prices are written in chips, shortened to **c** (e.g. `15c`).

---

## 📈 Pricing Principles

1. **Chips buy dice, priced by what they're worth.** One extra die raises a basic roll from **58% to 81%**. A second raises it to **91%**. Prices follow that curve.
2. **Chips never break the ±2 cap.** The best weapon is `+2` and the best armour is `-2`. Expensive gear gets **special rules** or works in the Heights; it doesn't get bigger numbers.
3. **Every chip you keep is a chip not sent home.** Better gear keeps the crew alive. Chips sent home keep the [community](community.md) alive.
4. **No micro-management.** There's no ammo, no encumbrance and no upkeep. Track chips and gear, nothing else.

### Price bands

| What it gives | Typical price | Why |
| :--- | :---: | :--- |
| `+1 dice` on **one roll** (consumable, bribe) | **3–8c** | Used once |
| `+1 dice` on a **narrow set of tests** (tool) | **10–15c** | Reusable, but only for one kind of job |
| `+1 dice` on **wound rolls** (weapon) | **5–20c** | Only after you hit |
| `+2 dice` on **wound rolls** (weapon) | **20–40c** | Doubles the critical chance compared with `+1` |
| `-1 dice` on **every incoming wound** (armour) | **15c** | Always working, so it costs more than a weapon of the same rating |
| `-2 dice` on **every incoming wound** (armour) | **45c** | Turns most hits into Shaken |
| A **special rule** | **+10–20c** | Changes *how* a weapon works, not how strong it is |
| **Refined** version of anything | **×3–4** | Same dice. You pay to blend in upstairs, for Silent and Pierce, and to open Refined locks |

> 📊 **Why armour costs more.** At net `0` a hit wounds **58%** of the time. Against `-1` armour that drops to **32%**, and against `-2` to **17%**. Armour works against every enemy, every round.

---

## 📏 Ranges

| Range | Distance | Long range (`-1 dice` To Hit) |
| :--- | :---: | :---: |
| **Melee** | Base contact (1") | — |
| **Short** | 12" | Beyond 6" |
| **Medium** | 24" | Beyond 12" |
| **Long** | 48" | Beyond 24" |

Thrown weapons use **Short** range. Long range follows the [dice system](dice_system.md#-modifier-sources): a target more than half the weapon's range away gives `-1 dice` To Hit.

---

## 🏷️ Tags & Special Rules

### Tags

| Tag | Effect |
| :--- | :--- |
| 🫥 **Concealable** | Can be hidden on your person. A search can still find it. |
| 📢 **Conspicuous** | `-1 dice` on tests to sneak, blend into a crowd or pass as respectable while you carry or wear it openly. Using it on a job in the Terraces or Heights is **+1 Exposure** ([see Exposure](exposure_and_trust.md#-gaining-exposure)). |
| ✨ **Refined** | Upper-class tech. Draws no attention in the Terraces or Heights. Refined locks and doors **can only be opened with Refined tools** or Livery. **Illegal** for Works folk: being caught with it is **+2 Exposure**. |
| 🔂 **Consumable** | Used up after one use. |

### Special rules

Special rules change *how* gear works. They never change its rating.

| Rule | Effect |
| :--- | :--- |
| 🔥 **Fire** | **No To Hit roll.** Draw a straight line from the attacker up to the weapon's range. **Every model it touches is hit**, friend or foe. Each makes a To Wound roll at **an extra `-1 dice`**. Aiming and Marksman don't help. |
| 💣 **Blast** | Make one To Hit roll against a model or a point within range. On a hit, that target **and every model within 2"** of it are hit. Roll To Wound for each one separately. On a miss, nothing happens. |
| ⚡ **Shock** | Non-lethal. A **Wounded** result (7–11) gives the target **2 Shaken** instead of a wound. A Shock weapon never wounds: any Shaken that would take the target **past `-3`** Knocks it Out instead. A **Critical Wound** (12) also Knocks Out. A Knocked Out target is out of the combat but not Dying, and comes round afterwards with no wounds taken. Ideal for kidnappings. |
| 🪡 **Pierce** | The target's armour counts as **one point lower** (`-2` becomes `-1`, `-1` becomes `0`). |
| 🤫 **Silent** | Attacks with it raise no alarm and add **no Exposure** for noise. |
| 🥷 **Ambush** | Can only attack a target that **hasn't noticed you**: you're Hidden, or it's distracted or asleep. Once it knows you're there, use another weapon. |
| 🦯 **Reach** | Melee attacks can target models up to **2"** away. |
| 🏋️ **Unwieldy** | You can't **Move** and **Attack** with it in the same turn. You *can* use your Move to [Aim](actions.md#-combat-actions). |
| 🩹 **Mending** *(armour)* | At the end of each combat, the wearer removes **1 wound**. |
| 🧯 **Fireproof** *(armour)* | Fire attacks against the wearer are at **an extra `-1 dice`**. |

> 🩸 **Shaken overflow.** When a result gives more than one Shaken (Shock, the **Haymaker** talent), add them **one at a time**. Each Shaken that would go past `-3` becomes **1 wound** instead, or a **Knock Out** for Shock. *Example:* a target at `-2` takes a Haymaker's 2 Shaken. It goes to `-3`, and the second Shaken becomes 1 wound.

> 🔥 **Fire, worked through.** A boiler lance (`+1`, Fire) is aimed down a corridor at two raiders. One wears a padded coat (`-1`). No To Hit roll: both are hit. The unarmoured raider rolls To Wound at `+1 -1` = **net 0** (58% to wound). The coated raider rolls at `+1 -1 -1` = **net `-1`** (32%). Fire is reliable and wide, but it isn't deadly against armour.

---

## 🏪 Markets

Better goods are harder to find. Markets unlock as the crew [levels up](progression.md#-level-table).

| Market | Unlocked at | Where | What's there |
| :--- | :---: | :--- | :--- |
| 🔩 **Works** | Level 1 | Any Works street | Everyday weapons, armour, tools, consumables, firebottles |
| 🧨 **Specialist** | Level 3 | Gang armourers, Margin dealers | Special-rule weapons, hidden armour, cutting gear, combat medicine, gas, drugs |
| ✨ **Refined** | Level 6 | Fences in the Sunk | Stolen Refinement: Silent and Pierce weapons, Refined armour and tools, grafts |

Earlier access is possible: a [Workshop III](community.md#-projects) opens the Specialist market, and a [Sunk Dealer contact](progression.md#-contacts) opens the Refined market.

---

## 🧾 Price Lists

### 🗡️ Weapons

The modifier applies to **To Wound** rolls.

| Weapon | Mod | Range | Rules | Price | Market |
| :--- | :---: | :--- | :--- | :---: | :---: |
| Unarmed / improvised | `+0` | Melee | — | free | — |
| Knife | `+1` | Melee, thrown | Concealable | 5c | 🔩 |
| Firebottle | `+1` | Thrown | Blast, Consumable | 8c | 🔩 |
| Cosh, wrench, club | `+1` | Melee | — | 5c | 🔩 |
| Pike hook | `+1` | Melee | Reach | 10c | 🔩 |
| Hose pistol *(tank-fed)* | `+1` | Short | Conspicuous | 10c | 🔩 |
| Pistol | `+1` | Short | Concealable | 15c | 🔩 |
| Carbine | `+1` | Medium | Conspicuous | 20c | 🔩 |
| Sledgehammer | `+2` | Melee | Unwieldy, Conspicuous | 20c | 🔩 |
| Heavy blade | `+2` | Melee | Conspicuous | 25c | 🔩 |
| Scattergun | `+2` | Short | Conspicuous | 35c | 🔩 |
| Rifle | `+2` | Long | Unwieldy, Conspicuous | 40c | 🔩 |
| Shock baton | `+1` | Melee | Shock | 20c | 🧨 |
| Garrotte | `+1` | Melee | Ambush, Silent, Concealable | 15c | 🧨 |
| Crossbow | `+1` | Medium | Silent, Unwieldy, Conspicuous | 30c | 🧨 |
| Rivet gun | `+1` | Short | Pierce, Conspicuous | 30c | 🧨 |
| Boiler lance | `+1` | Short | Fire, Unwieldy, Conspicuous | 35c | 🧨 |
| Pressure bomb | `+2` | Thrown | Blast, Consumable | 15c | 🧨 |
| ✨ Refined needle | `+1` | Melee | Pierce, Silent, Concealable, Refined | 40c | ✨ |
| ✨ Shock glove | `+1` | Melee | Shock, Silent, Concealable, Refined | 70c | ✨ |
| ✨ Refined sidearm | `+2` | Medium | Silent, Concealable, Refined | 120c | ✨ |
| ✨ Glass rifle | `+2` | Long | Silent, Unwieldy, Refined | 150c | ✨ |

### 🛡️ Armour

The modifier applies to **To Wound** rolls made **against** the wearer. Wear one piece only.

| Armour | Mod | Rules | Price | Market |
| :--- | :---: | :--- | :---: | :---: |
| Padded coat, leather, padded apron | `-1` | — | 15c | 🔩 |
| Plate, riot armour | `-2` | Conspicuous | 45c | 🔩 |
| Fire-cloth coat | `-1` | Fireproof | 25c | 🧨 |
| Hidden vest *(worn under clothes)* | `-1` | Concealable | 25c | 🧨 |
| ✨ Silk-weave suit *(also counts as a good suit of clothes)* | `-1` | Refined | 70c | ✨ |
| ✨ Mending coat *(looks like fine clothing)* | `-1` | Mending, Refined | 60c | ✨ |
| ✨ Grown mail *(looks like fine clothing)* | `-2` | Refined | 160c | ✨ |

### 🧰 Tools

A tool gives `+1 dice` on tests it covers, **on top of** a trait. Only **one tool** counts per roll.

| Tool | Helps with | Rules | Price | Market |
| :--- | :--- | :--- | :---: | :---: |
| Lockpicks | Works locks | Concealable | 10c | 🔩 |
| Tool roll | Building, repairing, taking things apart | — | 10c | 🔩 |
| Mechanic's kit | Engines, boilers, pressure lines, vehicles | Conspicuous | 10c | 🔩 |
| Medic's satchel | Treating wounds, survival rolls | — | 10c | 🔩 |
| Climbing rig | Climbing, rappelling | Conspicuous | 10c | 🔩 |
| Spyglass | Spotting and watching from far away | Concealable | 10c | 🔩 |
| Forger's kit | Forging documents and seals | Concealable | 15c | 🔩 |
| Good suit of clothes | Passing as respectable in the Terraces | — | 15c | 🔩 |
| Pry bar | Forcing doors, crates, grates and shutters | Conspicuous | 10c | 🔩 |
| Shutter lantern | Searching a place, and working in the dark | — | 10c | 🔩 |
| Listening horn | Eavesdropping through doors and walls, cracking combination locks | Concealable | 10c | 🔩 |
| Route book | Finding your way and driving through the Works and the Sunk | Concealable | 10c | 🔩 |
| Disguise kit | Passing as a particular kind of Works person: a porter, a guard, a lamplighter | — | 15c | 🔩 |
| Gas mask | Immune to choke gas | Conspicuous | 10c | 🧨 |
| Grapple gun | Climbing; reach a ledge up to 12" away | Conspicuous | 25c | 🧨 |
| Cutting torch | Cutting bars, chains, grates and Works safes | Conspicuous | 20c | 🧨 |
| ✨ Whisper key | Any lock, **including Refined locks** | Concealable, Refined | 60c | ✨ |
| ✨ Quiet-cloth cloak | Sneaking and hiding | Refined | 50c | ✨ |
| ✨ Seal blanks | Forging house seals and Refined papers | Concealable, Refined | 40c | ✨ |

### 🔂 Consumables

| Item | Effect | Price | Market |
| :--- | :--- | :---: | :---: |
| Field dressing | `+1 dice` on one Medic test | 3c | 🔩 |
| Boiler-black *(stimulant)* | Remove **1 Shaken** | 8c | 🔩 |
| Smoke canister | Ranged To Hit rolls that pass through a 3" cloud are at `-1 dice` until the end of the round | 5c | 🔩 |
| Strike-oil | `+1 dice` on one sabotage or fire-starting test | 5c | 🔩 |
| Numbing tincture | Take it before a fight: ignore the **first Shaken** result you suffer in that combat | 6c | 🔩 |
| Stitch-glue | Remove **1 wound**. No test needed, and it works in combat | 15c | 🧨 |
| Choke gas | Thrown (Short), Blast. Every model hit gains **1 Shaken** unless it has a gas mask. No To Wound roll | 10c | 🧨 |
| Sleeping draught | Slipped into food or drink, it puts one person to sleep for about an hour. No test if they don't suspect anything | 10c | 🧨 |
| ✨ Mending salve | Remove **2 wounds**. No test needed, and it works in combat | 40c | ✨ |
| ✨ Quickening draught | A **Dying** character automatically passes their survival roll. Can be given in combat as an Action | 80c | ✨ |
| ✨ Forget-me draught | A witness who drinks it before the end of the job forgets the last hour: **-1 Exposure** | 30c | ✨ |

### 🧬 Refined grafts

Grafts are Refinement grown into the body. They're **permanent**, **illegal**, and a character can have **at most 2**. If a search or a doctor finds one, it's **+2 Exposure**.

| Graft | Effect | Price |
| :--- | :--- | :---: |
| ✨ Grown sinew | **+1 maximum wound** (to the cap of 8) | 150c |
| ✨ Still hand | Counts as lockpicks that can't be found or taken | 100c |
| ✨ Clear eye | Counts as a spyglass that can't be found or taken, and works in the dark | 100c |
| ✨ Iron lung | Immune to choke gas and smoke. Hold your breath for up to an hour | 100c |
| ✨ Second skin | Counts as `-1` armour that can't be found or taken. If you also wear armour, use the better rating | 120c |

### 🪙 Services

| Service | Effect | Price |
| :--- | :--- | :---: |
| 💸 **Bribe** (Works) | `+1 dice` on one social test with the person you pay | 5c |
| 💸 **Bribe** (Terraces) | As above | 15c |
| 💸 **Bribe** (Heights) | As above. A failed roll means they report you: **+1 Exposure** | 40c |
| 🗞️ **Informant** | One useful answer to one question | 10c |
| 🩺 **Street doctor** | Remove **2 wounds** during downtime | 10c |
| 🧹 **Cleaner** (the Sunk) | **-1 Exposure**, once per downtime | 20c |
| 🏷️ **Fence** | Sells your goods for you | takes half |
| 🖋️ **Hired forger** | One set of **Papers** for the next job, as the [favour](exposure_and_trust.md#-favours) | 20c |
| 💪 **Hired muscle** | A [gang tough](actions.md#-enemies) joins the crew for one job. The DM runs them. They don't earn Marks, and they won't die for you | 15c |

> 💸 **One bribe per test.** Paying twice doesn't give `+2 dice`, just a richer guard.

---

## 🏦 Earning & Spending

### 💼 Job pay

The handler pays the **crew**, not each character.

| Job | Examples | Pay (whole crew) | Marks |
| :--- | :--- | :---: | :---: |
| 🟢 **Simple** | Deliver a package, watch a building, escort a cargo through friendly streets | 30c | 1 |
| 🟡 **Standard** | Break in, steal a ledger, sabotage a pump, plant evidence | 60c | 2 |
| 🔴 **Dangerous** | Kidnapping, a job in the Heights, crossing a rival house's crew | 120c | 3 |

The pay can be changed by [Exposure](exposure_and_trust.md) (a clean job pays a **10c bonus**, a Hot crew loses 10c) and by failing the objective (**half pay**).

### 🏠 After every job

Pay goes through the [Homecoming](community.md#-homecoming) sequence. In short:

1. **Pay the Need**: the community's minimum. Skipping it means a Hardship test.
2. **Deal with trouble**: Hardship, raids and the water.
3. **Fill the Pot**: anything extra the crew chooses to send home. Build a tier when it's full.
4. **Split the rest** between the characters, however the crew agrees.

> 🧮 **Pacing check.** A crew of four on a Standard job at Community 3: 60c pay, 10c Need, 20c into the Pot, 30c split = **~7c each**. A `+2` rifle takes about six jobs to afford. That's slow on purpose, because the alternative is sending less home.

### 🧥 Handler loans

The Liveried can lend gear for a single job as a [favour](exposure_and_trust.md#-favours). It's free, but it must be returned. Losing or damaging it costs **Trust**.

### 🔄 Selling

Sell gear for **half** its price (**three quarters** with a [Workshop](community.md#-projects) or a [Fence contact](progression.md#-contacts)). Stolen Refined goods can only be sold through a fence in the Sunk.

---

## ✅ Design Decisions

| # | Question | Ruling |
| :---: | :--- | :--- |
| **1** | Currency? | ✅ **Chips**, a Refined brass alloy. Written **c**. |
| **2** | Ranges? | ✅ **Short 12" · Medium 24" · Long 48".** Long range is beyond half. |
| **3** | Can Refined gear exceed ±2? | ✅ **No.** It gets special rules instead. |
| **4** | Special rules | 🟡 **Proposed:** Fire, Blast, Shock, Pierce, Silent, Reach, Unwieldy, Mending, Fireproof. |
| **5** | Markets | 🟡 **Proposed:** Works (L1), Specialist (L3), Refined (L6). |
| **6** | Grafts | 🟡 **Proposed:** max 2, permanent, illegal. |
| **7** | Second gear list | 🟡 **Proposed:** 22 new items and services (Firebottle to Hired muscle), plus the **Ambush** rule. All within the ±2 cap and the price bands. |
| **8** | Shaken overflow | 🟡 **Proposed:** several Shaken are added one at a time, and each one past `-3` becomes 1 wound. Shock Knocks Out instead, so it never wounds. |

🟡 = proposed, not yet final.

---

<sub>🛒 Prices are balanced against the exact probabilities in the [Dice System](dice_system.md#-odds-at-a-glance). Last updated 2026-11-02.</sub>
