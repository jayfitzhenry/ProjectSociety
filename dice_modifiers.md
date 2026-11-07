# 🧮 Project Society — Dice Modifiers

> **Every bonus and penalty in one place, and how to turn them into dice.**
> Count the `+dice` and `-dice`, cancel them, cap at `-3`, then roll.

This page collects modifiers from every rulebook so you can find them at the table. It adds no new rules. If it ever disagrees with the rulebook it links to, the rulebook wins.

---

## 📑 Contents

1. [Working Out Your Dice](#-working-out-your-dice)
2. [Bonuses](#️-bonuses)
3. [Penalties](#️-penalties)
4. [Limits](#-limits)
5. [Examples](#-examples)

---

## 🧮 Working Out Your Dice

1. **List** every bonus (`+dice`) and every penalty (`-dice`) that applies to this roll.
2. **Add** the bonuses together, and the penalties together.
3. **Cancel** them one for one. Three bonuses and one penalty make **net `+2`**.
4. **Cap** penalties: a net worse than `-3` counts as `-3`. Cancel first, then cap.
5. **Roll** 2D6, plus one extra die for each point of net modifier.
6. **Keep two.** Net bonus: keep the **two highest**. Net penalty: keep the **two lowest**.
7. **Add** the two kept dice. **7 or more passes.**

| Net modifier | Roll | Keep |
| :---: | :---: | :--- |
| `+3` | 5D6 | the two highest |
| `+2` | 4D6 | the two highest |
| `+1` | 3D6 | the two highest |
| `0` | 2D6 | both |
| `-1` | 3D6 | the two lowest |
| `-2` | 4D6 | the two lowest |
| `-3` or worse | 5D6 | the two lowest |

The target is **always 7**. Modifiers change the dice you roll, never the number you need. Full rules: [Dice System](dice_system.md#️-dice-pools-advantage--disadvantage).

**Double 6** on the kept dice is a **critical**. **Double 1** is a **fumble**: in combat your turn ends, out of combat it's just a fail. See [Criticals & Fumbles](dice_system.md#-criticals--fumbles).

---

## ⬆️ Bonuses

### Any test

| Bonus | Dice | Limit | Rule |
| :--- | :---: | :--- | :--- |
| **Covering trait** | `+1` | One trait per roll, even if several fit | [Traits](character_creation.md#️-trait-rules) |
| **Tool** | `+1` | One tool per roll. Stacks with a trait | [Tools](equipment.md#-tools) |
| **Helper** | `+1` | One helper. They need a covering trait (or the **Team Player** talent), must be there, and share the consequences | [Helping](character_creation.md#-helping) |
| **Easy test** | `+1` | The opposition is careless, distracted, drunk or outclassed. Sneaking and hiding in darkness | [Who rolls](actions.md#-who-rolls) |
| **Bribe** | `+1` | One social test with the person you pay. One bribe per test | [Services](equipment.md#-services) |
| **Papers** favour | `+1` | Counts as a tool, on tests to pass as someone who belongs | [Favours](exposure_and_trust.md#-favours) |
| **Field dressing** | `+1` | One Medic test. Used up | [Consumables](equipment.md#-consumables) |
| **Strike-oil** | `+1` | One sabotage or fire-starting test. Used up | [Consumables](equipment.md#-consumables) |
| **Hall III** | `+1` | Once per job, on one test. No trait needed | [Projects](community.md#-projects) |

### To Hit

| Bonus | Dice | Limit | Rule |
| :--- | :---: | :--- | :--- |
| **Brawler** (melee) or **Marksman** (ranged) | `+1` | The only traits that help in a fight. No trait covers To Wound | [Traits in combat](character_creation.md#️-traits-in-combat) |
| **Aim** | `+1` | Uses your Move. **Dead Eye** makes it `+2` | [Combat Actions](actions.md#-combat-actions) |
| **Ghost** (talent) | `+1` | Attacking from Hide. You're no longer hidden afterwards | [Talents](progression.md#-trait-talents) |

### To Wound

| Bonus | Dice | Limit | Rule |
| :--- | :---: | :--- | :--- |
| **Weapon** | `+1` or `+2` | Its rating. Never more than `+2` | [Weapons](equipment.md#️-weapons) |
| **Critical hit** | `+1` | The To Hit roll was a double 6 | [Critical effects](dice_system.md#-critical-effects) |
| **Ghost** (talent) | `+1` | Attacking from Hide | [Talents](progression.md#-trait-talents) |
| **Overpressure** (talent) | `+1` | Once per combat, with a firearm or boiler lance | [Talents](progression.md#-trait-talents) |

### Survival roll

A crewmate makes a Medic test for a Dying character after the combat.

| Bonus | Dice | Rule |
| :--- | :---: | :--- |
| Roller has the **Medic** trait | `+1` | [The survival roll](actions.md#the-survival-roll) |
| **Medic's satchel** | `+1` | |
| **Field dressing** | `+1` | |
| **Stabilised** during the combat | `+1` | [Stabilise](actions.md#-stabilise) |
| **Clinic III** | `+1` | [Projects](community.md#-projects) |
| **Hard to Kill** (the Dying character's talent) | `+1` | [General talents](progression.md#-general-talents) |

### District rolls

| Roll | Bonus | Dice | Rule |
| :--- | :--- | :---: | :--- |
| **Hardship test** | Paid at least half the Need | `+1` | [Hardship](community.md#-hardship) |
| | A character took **Help at Home** | `+1` | |
| | **Hall I** or better | `+1` | |
| | A character has a **Gang Elder** contact | `+1` | |
| **Raid test** | **Watch** I / II / III | `+1` / `+2` / `+3` | [Raids](community.md#️-raids) |
| | A character took **Help at Home** | `+1` | |

---

## ⬇️ Penalties

### Any test

| Penalty | Dice | When | Rule |
| :--- | :---: | :--- | :--- |
| **Hard test** | `-1` | The opposition is alert, skilled or expecting trouble. Tests that rely on sight, in darkness | [Who rolls](actions.md#-who-rolls) |
| **No trait, needs know-how** | `-1` | Nobody could do it untrained. Includes every Medic action without the Medic trait | [Traits](character_creation.md#️-trait-rules) |
| **Conspicuous** gear | `-1` | Sneaking, blending in or passing as respectable while you carry it openly | [Tags](equipment.md#tags) |
| **Shaken** | `-1` each | Every roll you make until the end of combat. At most `-3` from Shaken | [Injury Table](dice_system.md#-injury-table) |

### To Hit

| Penalty | Dice | When | Rule |
| :--- | :---: | :--- | :--- |
| **Long range** | `-1` | The target is more than half the weapon's range away | [Ranges](equipment.md#-ranges) |
| **Cover** | `-1` | Ranged attacks only. Darkness and a moving vehicle count as cover. They don't stack with each other | [Cover](actions.md#-cover) |
| **Smoke** | `-1` | Ranged attacks through a smoke cloud. Separate from cover, so it does stack | [Consumables](equipment.md#-consumables) |
| **Floored** | `-1` | Your next To Hit roll after an enemy's Stunt floors you | [Stunts](actions.md#-stunts) |

### To Wound

| Penalty | Dice | When | Rule |
| :--- | :---: | :--- | :--- |
| **Target's armour** | `-1` or `-2` | Its rating. **Pierce** weapons count it as one point lower | [Armour](equipment.md#️-armour) |
| **Fire** | `-1` | Every model hit by a Fire weapon | [Special rules](equipment.md#special-rules) |
| **Fireproof** armour | `-1` | An extra `-1` against Fire attacks | [Special rules](equipment.md#special-rules) |

### Survival and district rolls

| Roll | Penalty | Dice | Rule |
| :--- | :--- | :---: | :--- |
| **Survival roll** | Roller has no Medic trait | `-1` | [The survival roll](actions.md#the-survival-roll) |
| **Hardship test** | Paid nothing towards the Need | `-1` | [Hardship](community.md#-hardship) |
| **Raid test** | Exposure is **Hot** (7+) | `-1` | [Raids](community.md#️-raids) |

> 🛡️ **Raid checks work the other way round.** The Raid check asks *"is the district raided?"*, so a pass is bad news. When Exposure is Hot, the Raid check is rolled at `+1 dice`. See [Raids](community.md#️-raids).

---

## 🧢 Limits

| Limit | Rule |
| :--- | :--- |
| **One trait** per roll | Pick the best one |
| **One tool** per roll | On top of the trait |
| **One helper** per roll | They share the consequences |
| **One bribe** per test | Paying twice just makes a richer guard |
| **Gear ratings** | Weapons and armour never go beyond `+2` or `-2` |
| **Bonuses** | No cap. Each extra die is worth less than the last |
| **Penalties** | The net can never be worse than `-3`. Cancel first, then cap |
| **Shaken** | At most `-3`. Each Shaken result after that is 1 wound instead |

---

## 📖 Examples

<details open>
<summary><b>Picking a lock with a guard nearby</b></summary>

The Cutpurse has **Thief** (`+1`) and **lockpicks** (`+1`). The guard is alert, so it's a **Hard** test (`-1`).

`+2` and `-1` cancel to **net `+1`**. Roll **3D6, keep the two highest**. Need 7+.

</details>

<details>
<summary><b>Shooting at someone in cover</b></summary>

A Marksman (`+1`) aims (`+1`). The target is behind a crate (cover, `-1`), and the shooter is Shaken once (`-1`).

`+2` and `-2` cancel to **net `0`**. Roll **2D6**.

</details>

<details>
<summary><b>A rifle against plate armour</b></summary>

The attacker hits. To Wound: rifle (`+2`), plate (`-2`), and the attacker has 2 Shaken (`-2`).

`+2` and `-4` make **net `-2`**. Roll **4D6, keep the two lowest**, and read the total on the [Injury Table](dice_system.md#-injury-table).

</details>

<details>
<summary><b>Hitting the cap</b></summary>

Shaken ×3 (`-3`) and plate armour (`-2`) make `-5`. The weapon adds `+2`, so the net is `-3`.

The roll is at the cap: **5D6, keep the two lowest**. The weapon's bonus was soaked up by the penalties before the cap applied.

</details>

<details>
<summary><b>An untrained survival roll</b></summary>

Nobody with Medic is in reach. The crewmate has no trait (`-1`) but carries a satchel (`+1`) and a field dressing (`+1`).

`+2` and `-1` make **net `+1`**. Roll **3D6, keep the two highest**.

</details>

---

<sub>🧮 A summary of the other rulebooks. Last updated 2026-11-07.</sub>
