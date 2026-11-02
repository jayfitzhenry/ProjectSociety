# 🏃 Project Society — Actions

> **One Move, one Action.** That's a turn.
> Out of combat, there are no turns. Say what you do and the DM tells you whether to roll.

Builds on the [Dice System](dice_system.md). See also [Character Creation](character_creation.md), [Equipment](equipment.md), [Community](community.md), [Exposure & Trust](exposure_and_trust.md) and [Progression](progression.md).

---

## 📑 Contents

1. [Combat Turns](#️-combat-turns)
2. [Combat Actions](#-combat-actions)
3. [Healing](#-healing)
4. [Dying](#-dying)
5. [Out of Combat](#-out-of-combat)
6. [Downtime](#-downtime)
7. [Worked Examples](#-worked-examples)
8. [Design Decisions & Open Questions](#-design-decisions--open-questions)

---

## ⚔️ Combat Turns

### 🔁 Rounds and activations

1. **Who starts?** The crew, unless they're **ambushed**, in which case the ambushers start.
2. **Alternate.** The crew activates **one** character, then the DM activates **one** enemy, and so on.
3. **One side runs out?** The other side activates all its remaining characters, one after another.
4. **End of the round.** When everyone has activated, the round ends. Start a new one.
5. **End of combat.** When one side is beaten, flees or surrenders. **All Shaken clears.**

> 🧑‍🤝‍🧑 The crew chooses which of its characters activates next. Plan together.

### 🎬 Your activation

You get **one Move** and **one Action**, in either order.

| Part | What it is |
| :--- | :--- |
| 🦶 **Move** | Up to **6"**. Climbing, jumping and squeezing through gaps may need a test. You can give up your Move to **Aim**. |
| ✋ **Action** | One of the [combat actions](#-combat-actions) below. |

> 💀 **Fumbles** (double 1 on the kept dice) end your activation **immediately**. Any Move or Action you haven't used is lost.
>
> ⚡ **Free attacks** from a critical wound happen **straight away**, on top of your normal Action ([dice system](dice_system.md#-injury-table)).

---

## ✋ Combat Actions

| Action | What it does | Roll |
| :--- | :--- | :--- |
| 🗡️ **Attack** | Melee against a model in base contact, or ranged against a model within range and in sight | To Hit, then To Wound |
| 🎯 **Aim** *(uses your Move)* | `+1 dice` To Hit on an Attack this activation | — |
| 🏃 **Dash** | Move another **6"** | — |
| 🩹 **Patch Up** | Yourself or an ally in base contact: remove Shaken | Medic test |
| 🫀 **Stabilise** | A **Dying** ally in base contact: improve their survival roll | Medic test |
| 🧪 **Use Item** | Use a consumable such as Boiler-black, Stitch-glue or smoke. Throwing a bomb is an **Attack** | Usually none |
| 🌑 **Hide** | Out of sight or in deep shadow: enemies can't target you until you Attack or end a Move in the open | Stealth test |
| 🤝 **Help** | An ally within 6": your covering trait gives `+1 dice` on their next **test** this round. Not attacks | — |
| 🔧 **Interact** | Open a door, pull a lever, pick a lock, start an engine | A test if it's risky |

### 🩹 Patch Up

| Result | Effect |
| :--- | :--- |
| ✅ Pass | Remove **1 Shaken** |
| 💥 Critical | Remove **all Shaken** |
| ❌ Fail | Nothing |

Patch Up doesn't remove wounds in combat. Only Stitch-glue, Mending salve and the [Field Surgeon](progression.md#-talents) talent can do that.

### 🫀 Stabilise

| Result | Effect |
| :--- | :--- |
| ✅ Pass | `+1 dice` on the Dying character's [survival roll](#-dying). Only once per Dying character |
| 💥 Critical | As a pass, and the Dying character is no longer at risk from [finishing blows](#-dying) |
| ❌ Fail | Nothing. You can try again next activation |

---

## 🩹 Healing

Healing happens at three speeds.

| When | How | Effect |
| :--- | :--- | :--- |
| ⚔️ **In combat** | **Patch Up** | Removes Shaken, not wounds |
| | **Boiler-black** | Remove 1 Shaken |
| | **Stitch-glue** *(Specialist)* | Remove 1 wound |
| | **Mending salve** *(Refined)* | Remove 2 wounds |
| | **Field Surgeon** talent | Patch Up can remove 1 wound instead |
| 🔚 **End of combat** | Automatic | **All Shaken clears** |
| | **Mending** armour | Remove 1 wound |
| 🧰 **During a job** | **Treat Wounds** (below) | Remove 2 wounds, or all on a critical |
| 🏠 **Between jobs** | **Recovery** at the district clinic | Remove 1 / 2 / all wounds, depending on the [Clinic](community.md#-projects) |
| | **Recover** downtime action | Remove 2 more wounds |
| | **Street doctor** | Remove 2 wounds for 10c |

### 🧰 Treat Wounds

Out of combat, during a job, someone can spend about ten minutes treating a character.

- It's a **Medic test**. Without the Medic trait it's `-1 dice` (it needs know-how).
- A medic's satchel and field dressings add dice as normal.
- Each character can be treated **once per job**.
- Ten minutes is a long time on some jobs. The DM may say the guards' rounds come by, or Exposure is at risk.

| Result | Effect |
| :--- | :--- |
| ✅ Pass | Remove **2 wounds** |
| 💥 Critical | Remove **all wounds** |
| ❌ Fail | Nothing, and this character can't be treated again this job |

> 🎯 **Why healing is slow in combat.** A character takes 1 wound per hit and has 5 wounds. If a Medic could remove a wound with every Action, fights would drag on. In combat, medics keep people **steady** (Shaken) and **alive** (Stabilise). Between fights, they put them back together.

---

## 🫀 Dying

When a character's **last wound box fills**, they are **Dying**.

### While Dying

- Lay the model down. The character **can't act** and **can't take more wounds**.
- Most enemies move on to targets that are still fighting.
- 🗡️ **Finishing blow.** An enemy in base contact can use its Action to **kill** a Dying character outright. Raiders rarely bother. Assassins, a rival house's crew and anyone with a grudge might. The DM should warn the table when an enemy *could* do this.
- Allies can **Stabilise** them (above).

### The survival roll

When the combat ends, a crew member in reach of the Dying character makes a **Medic test**. Each Dying character gets **one** survival roll.

| Modifier | Dice |
| :--- | :---: |
| 🩹 Roller has the **Medic** trait | `+1` |
| ❓ Roller has no Medic trait (it needs know-how) | `-1` |
| 🎒 Medic's satchel | `+1` |
| 🩹 Field dressing (consumable) | `+1` |
| 🫀 Stabilised during the combat | `+1` |
| 🏥 [Clinic III](community.md#-projects) | `+1` |

| Result | Effect |
| :--- | :--- |
| ✅ **Pass** | The character **survives**. Remove **1 wound**, and the character gains a **Scar** |
| 💥 **Critical** | The character **survives**. Remove **2 wounds**, and there's no Scar |
| ❌ **Fail** | The character **dies** |

✨ A **Quickening draught** passes the survival roll automatically.

🚫 **Nobody to roll?** If the whole crew is down, captured or fled, the Dying character **dies or is taken prisoner**. The DM decides, based on who they were fighting.

> 🎲 **The odds.** A Medic with a satchel rolls at `+2` (**91%**). A crewmate with no training and no kit rolls at `-1` (**32%**). Give the untrained crewmate a satchel and a field dressing and they're at `+1` (**81%**). Every crew should carry a satchel.

### 🩻 Scars

A Scar is a lasting mark from nearly dying. Write it on the sheet and describe it: a burned hand, a limp, a voice that never came back. Scars have no rules effect. They're part of the story, and the DM can use them.

### ⚰️ When a character dies

Make a new character. They join the crew at the **crew's level minus one**, with the advances for that level ([Progression](progression.md#-new-and-replacement-characters)). The gang always has someone else who wants the work.

---

## 🧭 Out of Combat

There are no turns. Say what your character does.

1. **Does it need a roll?** Only if failure is possible **and** interesting. Walking into a market doesn't.
2. **Which trait covers it?** See [traits](character_creation.md#️-trait-rules): `+1` with a trait, `0` if anyone could try, `-1` if it needs know-how, or no roll at all for specialist work.
3. **Add the rest.** Tools, Easy or Hard, help, bribes.
4. **Roll once.** A failed test can only be tried again if **something changes**: a new tool, a helper, a different approach, or taking more time when time is dangerous.

> 💀 **Fumbles out of combat are just a fail.** Nothing extra happens.

---

## 🏠 Downtime

Downtime happens **between jobs**. Do it in this order:

| Step | What happens |
| :---: | :--- |
| **1** | 🪙 **Homecoming.** Pay the Need, fill the Pot, split the rest ([Community](community.md#-homecoming)) |
| **2** | 🛡️ **Raid check**, if one is due ([Community](community.md#️-raids)) |
| **3** | 🩹 **Recovery.** Every character removes wounds depending on the Clinic: **1** with no Clinic, **2** with Clinic I, **all** with Clinic II or III |
| **4** | 🧑‍🔧 **Downtime actions.** Each character takes **one** (below) |
| **5** | 📈 **Level up**, if anyone has enough Marks ([Progression](progression.md)) |
| **6** | 🛒 **Shop** in any market you have access to |
| **7** | 👁️ **Things go quiet.** Exposure goes down by **1** ([Exposure](exposure_and_trust.md#-reducing-exposure)) |

### 🧑‍🔧 Downtime actions

Each character picks **one**.

| Action | Effect |
| :--- | :--- |
| 🛌 **Recover** | Remove **2 more wounds** |
| 🪙 **Odd Jobs** | Earn **5c**. Keep it or send it home |
| 🏠 **Help at Home** | `+1 dice` on the community's next **Hardship** or **Raid** test. Only `+1` in total, however many characters do this |
| 🤫 **Keep Quiet** | **-1 Exposure**. Only `-1` in total, however many characters do this |
| 🔎 **Seek Out** | A test with a covering trait (usually **Streetwise**) to find one specific person, rumour or item. On a pass you may buy one **Specialist** item before you've unlocked the market, at **double** price |

### 🫥 Lying low

Instead of taking the next job, the crew can **lie low**: **-2 Exposure**, but there's **no pay** that round. The community still needs its **Need**, so the crew has to pay it from savings or face a [Hardship test](community.md#-hardship).

---

## 📖 Worked Examples

<details open>
<summary><b>Example 1: A full activation</b></summary>

> Jonah has a rifle (`+2`, Long, **Unwieldy**). A raider is 30" away, beyond half range (24"), so Jonah is at long range.
>
> Unwieldy means he can't Move and Attack, but he **can** use his Move to Aim.
>
> **Move → Aim** (`+1`) · **Action → Attack**
>
> To Hit: Aim `+1`, long range `-1` = **net 0**. 🎲 `5` `4` = 9. **Hit.**
> To Wound: rifle `+2`, no armour = **net +2**. 🎲 `6` `3` `2` `1` → keep `6 + 3` = 9. 🟠 **1 wound.**

</details>

<details>
<summary><b>Example 2: Keeping someone alive</b></summary>

> Mara takes her fifth wound and is **Dying**. Dace is 5" away.
>
> **Dace's activation:** Move 5" into base contact. Action: **Stabilise**. Medic `+1`, satchel `+1` = `+2`. 🎲 `4` `4` `2` `1` → keep `4 + 4` = 8. **Pass.** Mara gets `+1 dice` on her survival roll.
>
> **After the fight,** Dace makes the survival roll: Medic `+1`, satchel `+1`, Stabilised `+1`, and a field dressing `+1` = **`+4`**. 🎲 6D6 → `5` `3` `3` `2` `2` `1` → keep `5 + 3` = 8. **Pass.** Mara survives with 4 wounds filled and gains a Scar: *"Two fingers on her left hand don't bend any more."*

</details>

<details>
<summary><b>Example 3: Healing across a job</b></summary>

> Mara starts the next part of the job with 4 wounds filled.
>
> **During the job:** Dace takes ten minutes in a stairwell to **Treat Wounds**. Medic + satchel = `+2`. 🎲 Pass. Mara removes 2 wounds (2 filled).
>
> **Downtime:** the district has **Clinic I**, so Recovery removes 2 more. Mara is back to full.

</details>

---

## ✅ Design Decisions & Open Questions

| # | Question | Ruling |
| :---: | :--- | :--- |
| **1** | What happens at 5 wounds? | ✅ **Dying.** A Medic test after the combat; failure means death. |
| **2** | Turn structure | 🟡 **Proposed:** alternating activations, one Move (6") and one Action. |
| **3** | Does Aim cost anything? | 🟡 **Proposed:** it uses your Move. |
| **4** | Healing in combat | 🟡 **Proposed:** Shaken only, except for consumables and the Field Surgeon talent. |
| **5** | Finishing blows | 🟡 **Proposed:** possible, but rare, and the DM warns the table. |
| **6** | Scars | 🟡 **Proposed:** story only, no rules effect. |

🟡 = proposed, not yet final.

### Open questions

- [ ] **Cover and terrain:** should cover give `-1 dice` To Hit? It isn't in the dice system yet.
- [ ] **Line of sight:** what blocks it, and can you shoot past your own crew?
- [ ] **Leaving melee:** can a character walk away from an enemy in base contact freely?
- [ ] **Vehicles:** movement, chases and ramming.
- [ ] **Enemy profiles:** wounds and gear for raiders, elites and rival crews.

---

<sub>🏃 Last updated 2026-11-02.</sub>
