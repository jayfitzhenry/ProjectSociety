# 🎲 Project Society — Dice System

> **One roll, one rule:** roll **2D6**, score **7 or more** to pass.
> Modifiers change how many dice you roll. They never change the target number.

---

## 📑 Contents

1. [The Basics](#-the-basics)
2. [Dice Pools: Advantage & Disadvantage](#️-dice-pools-advantage--disadvantage)
3. [Modifier Sources](#-modifier-sources)
4. [Criticals & Fumbles](#-criticals--fumbles)
5. [Combat Sequence](#️-combat-sequence)
6. [Injury Table](#-injury-table)
7. [Worked Examples](#-worked-examples)
8. [Odds at a Glance](#-odds-at-a-glance)
9. [Design Decisions](#-design-decisions)

---

## 🎯 The Basics

| Rule | Detail |
| :--- | :--- |
| **Roll** | 2D6, add them together |
| **Pass** | Total of **7 or higher** ✅ |
| **Fail** | Total of **6 or lower** ❌ |
| **Critical** | **Double 6** (a total of 12) 💥 |
| **Fumble** | **Double 1** (a total of 2) 💀 In combat, your turn ends |
| **Modifiers** | `+dice` or `-dice`. They change the dice you roll, never the total you need |

---

## ⚖️ Dice Pools: Advantage & Disadvantage

Modifiers either **add** dice (`+dice`) or **minus** dice (`-dice`). In both cases you physically roll **extra** dice and **keep two**. The sign decides **which** two you keep.

| | Advantage ⬆️ | Disadvantage ⬇️ |
| :--- | :--- | :--- |
| **Comes from** | `+dice` modifiers | `-dice` modifiers |
| **Roll** | 2D6 **plus** one extra die per net `+dice` | 2D6 **plus** one extra die per net `-dice` |
| **Keep** | The **two highest** dice | The **two lowest** dice |
| **Limit** | ♾️ **No cap** | 🧢 **Capped at net `-3`** (5D6 keep lowest) |

### Step by step

1. **Count** every `+dice` and every `-dice` that applies.
2. **Cancel** them one for one. A `+1` and a `-1` together make **net 0**.
3. **Cap** the result: if the net modifier is worse than `-3`, treat it as `-3`.
4. **Roll** 2D6 plus one extra die for each point of net modifier.
5. **Keep** the two highest (net advantage) or the two lowest (net disadvantage).
6. **Total** the two kept dice and compare against **7**.

> 🧢 **Negative dice stacking limit**
> `-dice` stack, but a roll can **never be worse than net `-3`**. **Cancel first, then cap.** Penalties beyond `-3` still matter, because they soak up `+dice` before the cap applies.
>
> *Example:* Shaken ×3 (`-3`) plus Armour (`-2`) = `-5`. The weapon adds `+2`, so the net is `-3`. The roll is at the cap, and the weapon bonus has been completely absorbed.

> ♾️ **No limit on positive dice.** Good positioning, gear and traits should always pay off. Each extra die is worth less than the last (see [Odds](#-odds-at-a-glance)), so stacking advantage limits itself.

---

## 🧩 Modifier Sources

### ⬆️ `+dice` (Advantage)

| Source | Applies to | Modifier |
| :--- | :--- | :---: |
| 🗡️ **Weapon** | Wound rolls | `+1` to `+2` *(weapon rating)* |
| 🧬 **Player trait** | Any roll the trait covers | `+1` |
| 🎯 **Aiming** | Hit rolls | `+1` |
| 🟢 **Easy test** | Non-combat tests | `+1` |
| 🧰 **Tool** (one per roll; see [Equipment](equipment.md#-tools)) | Tests the tool covers | `+1` |
| 🤝 **Help** (one helper; see [Character Creation](character_creation.md#-helping)) | Tests the helper's trait covers | `+1` |
| 💥 **Critical hit** | The **wound** roll that follows a critical **hit** roll | `+1` |

### ⬇️ `-dice` (Disadvantage)

| Source | Applies to | Modifier |
| :--- | :--- | :---: |
| 📏 **Long range** (target more than half the weapon's range away) | Hit rolls (shooting) | `-1` |
| 🧱 **Cover** (part of the target is hidden, or it's in darkness; 🟡 proposed in [Actions](actions.md#-position-cover-sight-and-melee)) | Hit rolls (shooting) | `-1` |
| 💨 **Smoke** (shooting through a [smoke canister](equipment.md#-consumables)'s cloud; separate from cover) | Hit rolls (shooting) | `-1` |
| 🛡️ **Target's armour** | Wound rolls | `-1` to `-2` *(armour rating)* |
| 🔴 **Hard test** | Non-combat tests | `-1` |
| 🩸 **Shaken** | All of that character's rolls until the end of combat | `-1` per stack, **max `-3`** *(further results deal 1 wound)* |

### 🏷️ Weapon & Armour Ratings

Gear ratings vary but **never exceed `+2` or `-2`**.

| Example gear | Rating |
| :--- | :---: |
| 🔪 Knife, pistol | `+1` |
| 🔫 Rifle, heavy blade | `+2` |
| 🧥 Leather, padded coat | `-1` |
| 🛡️ Plate, riot armour | `-2` |

> 🎯 **Modifiers are meant to decide fights.** One die moves a basic roll from **58%** to **81%** or down to **32%**. That is deliberate: players who take cover, aim and close the distance should feel the reward.

---

## 💥 Criticals & Fumbles

| | 💥 Critical | 💀 Fumble |
| :--- | :--- | :--- |
| **Trigger** | The **two kept dice are both 6s** | The **two kept dice are both 1s** |
| **With advantage** | Easier: you only need two 6s **anywhere** among your dice | Harder: **every** die must be a 1 |
| **With disadvantage** | Harder: **every** die must be a 6 | Easier: you only need two 1s **anywhere** among your dice |

### 💥 Critical effects

| Roll type | Critical effect |
| :--- | :--- |
| 🎯 **Hit roll** | `+1 dice` on the following **wound** roll |
| 🩸 **Wound roll** | **3 wounds** and a **free attack** (see [Injury Table](#-injury-table)) |
| 🧠 **Skill / test** | **Critical success.** The DM narrates the outcome, and the player has some influence over what happens |

### 💀 Fumble effects

| Situation | Fumble effect |
| :--- | :--- |
| ⚔️ **In combat** (any roll) | The roll's normal result applies, then the player's **turn ends immediately** |
| 🧠 **Out of combat** | **Just a fail.** Nothing extra happens |

---

## ⚔️ Combat Sequence

Combat uses **two rolls**. The **wound roll** is read directly on the Injury Table.

```
 ┌────────────────┐   pass (7+)   ┌──────────────────────────┐
 │ 1. TO HIT      │ ────────────▶ │ 2. TO WOUND              │
 │ 2D6 ≥ 7        │               │ 2D6 → read Injury Table  │
 └────────────────┘               └──────────────────────────┘
   + Aiming                         + Weapon (+1 / +2)
   + Trait                          + Trait
   − Long range                     + Crit on hit
   − Shaken                         − Armour (−1 / −2)
                                    − Shaken
        │ fail (2–6)
        ▼                           2–6  → 🟡 Shaken
      Miss                          7–11 → 🟠 1 wound
                                    12   → 🔴 3 wounds + free attack

 💀 Double 1 on any combat roll → apply the result, then the turn ends
```

---

## 🩸 Injury Table

Read the **wound roll** total. There is no separate injury roll.

| Wound roll | Result | Effect |
| :---: | :--- | :--- |
| **2 – 6** | 🟡 **Shaken** | The target gets `-1 dice` on all its rolls **until the end of combat**. Stacks to a maximum of **`-3 dice`**. A target already at `-3` takes **1 wound** instead |
| **7 – 11** | 🟠 **Wounded** | The target gains **1 wound** |
| **12** 💥 | 🔴 **Critical Wound** | The target gains **3 wounds**, and the attacker makes a **free attack** |

> 🗡️🛡️ Weapons and armour affect injury severity **only** through the dice they add or remove from the wound roll.

> ⚡ **Free attack rules**
> - A player may only ever get **one free attack per turn**. A 12 on the free attack still deals 3 wounds, but it does **not** grant another free attack.
> - The free attack **may target a different enemy**.
> - It is a full attack, starting from **To Hit**.

---

## 📖 Worked Examples

<details open>
<summary><b>Example 1: Basic test (no modifiers)</b></summary>

> Mara tries to pick a lock. There are no modifiers.
>
> 🎲 Rolls **2D6** → `4` `3` = **7**
>
> ✅ **Pass.** 7 is enough.

</details>

<details>
<summary><b>Example 2: Easy test (advantage)</b></summary>

> Mara climbs a wall with plenty of handholds. **Easy test: `+1 dice`.**
>
> 🎲 Rolls **3D6** → `6` `2` `1`
> Keeps the two **highest**: `6 + 2` = **8**
>
> ✅ **Pass.** Without the extra die she would have kept `2 + 1` = 3 and failed.

</details>

<details>
<summary><b>Example 3: Hard test (disadvantage)</b></summary>

> Mara tries to calm a furious crowd. **Hard test: `-1 dice`.**
>
> 🎲 Rolls **3D6** → `5` `4` `2`
> Keeps the two **lowest**: `4 + 2` = **6**
>
> ❌ **Fail.** Her `5 + 4` would have passed, but disadvantage forces her to keep the worst two dice.

</details>

<details>
<summary><b>Example 4: Modifiers cancelling out</b></summary>

> Mara has the trait **Silver Tongue** (`+1 dice` on persuasion) and attempts a **Hard** persuasion test (`-1 dice`).
>
> `+1` and `-1` cancel → **net 0**
>
> 🎲 Rolls a plain **2D6** → `5` `3` = **8**
>
> ✅ **Pass.**

</details>

<details>
<summary><b>Example 5: Full combat sequence</b></summary>

> Jonah shoots a raider in **leather armour** (`-1`) who is standing **beyond half** his rifle's range. He **aims** first.
>
> **① To Hit**
>
> | Modifier | Dice |
> | :--- | :---: |
> | 🎯 Aiming | `+1` |
> | 📏 Long range | `-1` |
> | **Net** | **0** |
>
> 🎲 **2D6** → `6` `6` = **12** 💥 **Critical hit!** The wound roll gets `+1 dice`.
>
> **② To Wound** *(read on the Injury Table)*
>
> | Modifier | Dice |
> | :--- | :---: |
> | 🔫 Rifle | `+2` |
> | 💥 Critical on hit | `+1` |
> | 🧥 Leather armour | `-1` |
> | **Net** | **+2** |
>
> 🎲 **4D6** → `5` `3` `1` `2` → keep `5 + 3` = **8**
>
> 🟠 **Wounded.** The raider gains **1 wound**.

</details>

<details>
<summary><b>Example 6: Failed wound means Shaken</b></summary>

> Later in the same fight, Jonah's pistol (`+1`) hits a raider in **riot armour** (`-2`).
>
> Net **`-1`** → 🎲 **3D6** → `6` `4` `2` → keep the two **lowest**: `4 + 2` = **6**
>
> 🟡 **Shaken.** The armour stops the bullet, but the raider now has `-1 dice` on every roll until the end of combat.

</details>

<details>
<summary><b>Example 7: Critical wound and free attack</b></summary>

> Mara charges a cornered raider with a heavy blade (`+2`). The raider is unarmoured. She hits, then rolls to wound at net **`+2`**:
>
> 🎲 **4D6** → `6` `1` `6` `4` → keep `6 + 6` = **12** 💥
>
> 🔴 **Critical wound.** The raider takes **3 wounds** and drops. Mara makes a **free attack**, and since the free attack may target someone else, she turns on a **second raider** and starts again from **To Hit**.
>
> She hits, and her wound roll is **12** again 💥. The second raider takes **3 wounds**, but there is **no second free attack**, because the limit is one per turn.

</details>

<details>
<summary><b>Example 8: Shaken stacking and the −3 cap</b></summary>

> A raider has been **Shaken three times** (`-3`, the maximum). It shoots at Mara, who is at **long range** (`-1`). It does not aim.
>
> | Modifier | Dice |
> | :--- | :---: |
> | 🩸 Shaken ×3 | `-3` |
> | 📏 Long range | `-1` |
> | **Net** | **`-4`** → 🧢 **capped to `-3`** |
>
> 🎲 **5D6** → `6` `5` `4` `3` `6` → keep `4 + 3` = **7**
>
> ✅ **Hit, but only just.** Even badly rattled, the raider still has a 9% chance to hit.
>
> If the raider had **aimed** (`+1`), the net would be `-4 + 1 = -3`, which is still at the cap. The long-range penalty absorbed the aim bonus completely.

</details>

<details>
<summary><b>Example 9: Shaken at maximum turns into wounds</b></summary>

> Jonah hits the same raider, which is already **Shaken ×3**. His wound roll lands on the Shaken band:
>
> 🎲 Wound roll → `4` `1` = **5** → 🟡 Shaken
>
> The raider is already at the `-3` maximum, so the result becomes 🟠 **1 wound** instead. A rattled target still takes damage.

</details>

<details>
<summary><b>Example 10: Fumble in combat</b></summary>

> A raider who is **Shaken ×1** (`-1`) shoots at Jonah.
>
> 🎲 **3D6** → `1` `5` `1` → keeps the two **lowest**: `1 + 1` = **2** 💀
>
> ❌ **Miss and fumble.** The shot misses and the raider's **turn ends immediately**. It cannot move or use any remaining actions this turn.

</details>

<details>
<summary><b>Example 11: Fumble out of combat</b></summary>

> After the fight, Mara tries to force a jammed door. **Hard test: `-1 dice`.**
>
> 🎲 **3D6** → `1` `1` `4` → keeps `1 + 1` = **2** 💀
>
> ❌ **Just a fail.** Out of combat there are no turns to lose, so the door simply stays shut.

</details>

<details>
<summary><b>Example 12: Critical success on a skill test</b></summary>

> Mara searches a raider camp for supplies. **Easy test: `+1 dice`.**
>
> 🎲 **3D6** → `6` `3` `6` → keeps `6 + 6` = **12** 💥
>
> ✨ **Critical success.** The DM narrates the outcome: *"Besides the supplies, you find a hand-drawn map with a route marked on it."* The player adds: *"Can the route lead back towards the settlement we were looking for?"* The DM agrees and works it in.

</details>

---

## 📊 Odds at a Glance

Exact probabilities for each **net** modifier.

### 🎯 Chance to pass (7+)

| Net dice | Dice rolled | Pass | | 💥 Critical (6‑6) | 💀 Fumble (1‑1) |
| :---: | :---: | :---: | :--- | :---: | :---: |
| **-3** 🧢 | 5D6 keep low | **9.4%** | `█░░░░░░░░░` | ~0% | 19.6% |
| **-2** | 4D6 keep low | **17.4%** | `██░░░░░░░░` | 0.1% | 13.2% |
| **-1** | 3D6 keep low | **31.9%** | `███░░░░░░░` | 0.5% | 7.4% |
| **0** | 2D6 | **58.3%** | `██████░░░░` | 2.8% | 2.8% |
| **+1** | 3D6 keep high | **80.6%** | `████████░░` | 7.4% | 0.5% |
| **+2** | 4D6 keep high | **91.0%** | `█████████░` | 13.2% | 0.1% |
| **+3** | 5D6 keep high | **95.8%** | `██████████` | 19.6% | ~0% |
| **+4** | 6D6 keep high | **98.0%** | `██████████` | 26.3% | ~0% |
| **+5** | 7D6 keep high | **99.1%** | `██████████` | 33.0% | ~0% |

> 💀 Fumbles mirror criticals. A heavily Shaken character at `-3` fumbles **1 in 5** combat rolls, so stacked penalties both lower the chance to hit and make it more likely the character loses its turn.

### 🩸 Wound roll outcomes

| Net dice | 🟡 Shaken (2–6) | 🟠 1 wound (7–11) | 🔴 3 wounds + attack (12) |
| :---: | :---: | :---: | :---: |
| **-3** 🧢 | 90.6% | 9.4% | ~0% |
| **-2** | 82.6% | 17.3% | 0.1% |
| **-1** | 68.1% | 31.5% | 0.5% |
| **0** | 41.7% | 55.6% | 2.8% |
| **+1** | 19.4% | 73.1% | 7.4% |
| **+2** | 9.0% | 77.8% | 13.2% |
| **+3** | 4.2% | 76.2% | 19.6% |
| **+4** | 2.0% | 71.7% | 26.3% |

> 💡 Above `+2`, extra dice hardly change the chance to pass. Their real value is the **critical chance**, which keeps climbing by about 6–7 points per die.

---

## ✅ Design Decisions

Rulings on the questions raised in the first review. These are **final**.

| # | Question | Ruling |
| :---: | :--- | :--- |
| **1** | Each die is a big swing (58% → 81% / 32%) | ✅ **Intended.** Situational modifiers are decisive so that players position themselves well. |
| **2** | Is injury a separate roll? | ✅ **No.** *To Hit* is one roll. *To Wound* is a second roll, and its total is read on the Injury Table. |
| **3** | Do `+dice` and `-dice` cancel? | ✅ **Yes**, one for one. |
| **4** | Do weapons and armour affect injury? | ✅ **Only through dice.** The weapon adds `+dice` and armour adds `-dice` to the wound roll. |
| **5** | Does Shaken stack? | ✅ **Yes**, up to a maximum of `-3`. |
| **6** | Should the pool be capped? | ✅ **`-dice` are capped at net `-3`. `+dice` are uncapped.** |
| **7** | What do wound criticals do? | ✅ **7–11 = 1 wound. 12 = 3 wounds + a free attack.** |
| **8** | How strong are weapons and armour? | ✅ **Ratings vary, from `+1` to `+2` for weapons and `-1` to `-2` for armour.** |
| **9** | Do modifiers add or remove dice? | ✅ **Both.** They are written as `+dice` or `-dice`, and the sign decides whether you keep the highest or lowest two. |
| **A** | Can free attacks chain? | ✅ **No.** A player may only ever get **one** free attack per turn. |
| **B** | Who can the free attack target? | ✅ **Any enemy**, including a different target. |
| **C** | What does a critical on a skill test do? | ✅ **The DM narrates the outcome**, and the player has some influence over it. |
| **D** | Fumble on double 1? | ✅ **Yes.** In combat it **ends the player's turn**. Out of combat it is just a fail. |
| **E** | What happens to Shaken beyond `-3`? | ✅ **Further Shaken results deal 1 wound.** |

### 📝 Suggestions: status

| Suggestion | Status |
| :--- | :--- |
| Cap the pool at ±2 | 🟡 **Changed.** Only `-dice` are capped, at `-3` |
| Merge wound and injury into one roll | ✅ **Adopted**, with new bands (2–6 / 7–11 / 12) |
| Give every critical a payoff | ✅ **Adopted.** Hit, wound and skill-test criticals all have effects |
| Add a fumble on double 1 | ✅ **Adopted.** It ends the turn in combat and is just a fail outside it |
| Make Shaken non-stacking | ❌ **Rejected.** Shaken stacks to `-3`, and further results deal 1 wound |
| Rate weapons and armour by a number | ✅ **Adopted**, max ±2 |
| Glossary | ✅ **Adopted** (below) |

### 📖 Glossary

- **Roll**: any 2D6 check.
- **Test**: a non-combat roll.
- **To Hit / To Wound**: the two combat rolls.
- **Advantage / Disadvantage**: a net positive or negative number of extra dice.
- **Shaken**: a stacking `-1 dice` (max `-3`) that lasts until the end of combat. Further Shaken results deal 1 wound.
- **Critical**: double 6 on the two kept dice.
- **Fumble**: double 1 on the two kept dice. In combat, the turn ends.
- **Free attack**: a full extra attack granted by a 12 on a wound roll. Maximum one per turn, and it can target any enemy.

> ✅ **No open questions.** All rules in this document are final.

---

<sub>🎲 Probabilities were calculated exactly by enumerating every possible dice combination. Last updated 2026-11-02.</sub>
