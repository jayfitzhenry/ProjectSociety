# 🏃 Project Society — Actions

> **One Move, one Action.** That's a turn.
> Out of combat, there are no turns. Say what you do and the DM tells you whether to roll.

Builds on the [Dice System](dice_system.md). See also [Character Creation](character_creation.md), [Equipment](equipment.md), [Community](community.md), [Exposure & Trust](exposure_and_trust.md) and [Progression](progression.md).

---

## 📑 Contents

1. [Combat Turns](#️-combat-turns)
2. [Combat Actions](#-combat-actions)
3. [Position: Cover, Sight and Melee](#-position-cover-sight-and-melee)
4. [Enemies](#-enemies)
5. [Healing](#-healing)
6. [Dying](#-dying)
7. [Out of Combat](#-out-of-combat)
8. [Chases and Vehicles](#-chases-and-vehicles)
9. [Hazards](#-hazards)
10. [Downtime](#-downtime)
11. [Worked Examples](#-worked-examples)
12. [Design Decisions & Open Questions](#-design-decisions--open-questions)

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
| 🤼 **Stunt** | Grapple, trip or disarm a model in base contact. See [Stunts](#-stunts) | A test, usually Brawler |

> 🩹 **Medic actions without the trait.** Patch Up, Stabilise, [Treat Wounds](#-treat-wounds) and [survival rolls](#-dying) all need know-how, so a character without **Medic** rolls them at `-1 dice`.

### 🤼 Stunts

A Stunt does something other than damage. Describe it, then make a test with a covering trait (usually **Brawler**; **Thief** to snatch a weapon). The target must be in base contact.

| Result | Effect |
| :--- | :--- |
| ✅ Pass | Choose **one**: **Pinned** (the target can't Move in its next activation), **Disarmed** (it drops one weapon; picking it up is an Interact), or **Floored** (its next To Hit roll is at `-1 dice`) |
| 💥 Critical | Choose **two** |
| ❌ Fail | Nothing |

> 🤼 **Why so plain?** A Stunt never deals wounds or Shaken, so it doesn't compete with an Attack, **Menace** or **Shove**. It's for the times when the story needs the gun out of his hand.

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

## 🧱 Position: Cover, Sight and Melee

### 👁️ Line of sight

Get down to the model's level and look. If you can see **any part** of the target, you can attack it. If you can't see it at all, you can't.

### 🧱 Cover

A target is **in cover** if something solid hides **part** of it from the attacker: a wall, crates, a doorway, a boiler, or another model standing in the way.

| | Modifier |
| :--- | :---: |
| 🧱 Ranged attack against a target **in cover** | `-1 dice` To Hit |

- Cover only counts against **ranged** attacks. In melee, the attacker is right there.
- Cover doesn't stack. Two walls are still `-1`.
- **Shooting past your own crew** is allowed, but the target counts as in cover.
- **Smoke** works the same way, but it's a separate penalty: a target in cover behind smoke is at `-2`.

### 🌑 Darkness

Lamps are far apart in the Works, and the Sunk has none at all.

| In darkness | Effect |
| :--- | :--- |
| 🎯 Ranged attacks against a target in darkness | The target counts as **in cover** (`-1 dice` To Hit). It doesn't stack with real cover |
| 👁️ Tests that rely on sight: searching, reading, spotting, picking a lock by eye | **Hard** (`-1 dice`) |
| 🌑 Sneaking and hiding | **Easy** (`+1 dice`) |
| 🗡️ Melee | No effect. You're close enough to feel them |

A **shutter lantern** or a **Clear eye** graft removes the penalties for whoever carries it. But a lit lantern means its carrier isn't in darkness either: enemies shoot at them normally, and they can't Hide.

### 🚪 Leaving melee

A character in base contact with an enemy can **break away**: Move out of contact as normal, but they **can't Attack** in that activation. Dash counts as moving away, too.

> 🎯 **Why so simple?** There are no free strikes or reactions to track. Breaking away costs your attack, which is enough to make holding a doorway matter.

---

## 👥 Enemies

> ⚠️ **GM reference.** Enemies use the same rules as the crew, with one difference: most of them have **fewer wounds**, so fights stay fast.

| Enemy | Wounds | To Hit | Weapon | Armour | Notes |
| :--- | :---: | :---: | :--- | :---: | :--- |
| 🐀 **Raider** | 2 | `+0` | Cosh `+1` or hose pistol `+1` | — | Raids districts. Comes in groups of 4–6 |
| 🐕 **Guard dog** | 1 | `+1` | Bite `+1` | — | Moves **10"**. Barks: its first activation raises the alarm |
| 🥊 **Gang tough** | 3 | `+1` | Heavy blade `+2` or scattergun `+2` | `-1` | Rival gangs' muscle. Also the **Hired muscle** service |
| 💂 **House guard** | 3 | `+1` | Carbine `+1`, cosh `+1` | `-2` | If it sees the crew, its first activation raises the alarm |
| 🗡️ **Rival crew agent** | 5 | `+1` | Refined sidearm `+2` (Silent) | `-1` | Another house's crew. Has one [talent](progression.md#-talents). Uses finishing blows |
| ⚜️ **Antioch elite** | 5 | `+1` | Rifle `+2` or heavy blade `+2` | `-2` | Ends raids. Only fights the crew if they're Burned, or worse |

**To Hit** is the bonus from a covering trait. Enemies follow every other rule: Shaken, criticals, fumbles, cover and range.

### Rules for enemies

- **Out of the fight.** An enemy with its last wound filled is **out**: dead, unconscious or crawling away, as the story needs. Only **named** enemies (agents, elites, anyone the DM gives a name) become Dying.
- **Nerve.** When **half** of a group is out, the rest **flee** at their next activation, unless the DM decides they're fanatics or cornered.
- **Making your own.** Pick wounds (1–5), a To Hit bonus (`+0` or `+1`), and gear from the [price lists](equipment.md#-price-lists). Keep to the ±2 cap.

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
- Each character can be treated **once per job** (twice with the [Triage](progression.md#-talents) talent).
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

### 🎲 Who rolls

**Only the crew rolls tests.** When someone works against the crew, the opposition doesn't roll. It sets the difficulty instead:

| The opposition is… | The crew's test is |
| :--- | :--- |
| Careless, distracted, drunk or outclassed | **Easy** (`+1 dice`) |
| Ordinary | Normal |
| Alert, skilled, or expecting trouble | **Hard** (`-1 dice`) |

A guard doesn't roll to spot the Cutpurse. The Cutpurse rolls **Shadow**, and the guard's alertness makes it Hard or Easy. A rival haggler doesn't roll either: the Smooth Talker rolls against the haggler's skill.

In **combat**, both sides roll their own To Hit and To Wound as normal.

---

## 🏃 Chases and Vehicles

### 🏁 Chases

A chase is a run of tests. The crew rolls, whether it's chasing or being chased.

1. **Each round**, the DM describes one obstacle: a crowded market, a barge in the canal, a gate swinging shut.
2. **The crew picks who leads** the round and which trait covers it: **Runner** on foot, **Driver** in a vehicle, **Streetwise** for a shortcut, **Shadow** to vanish into a crowd. One crewmate can Help as normal.
3. **Difficulty** comes from the other side: **Hard** if they're faster, **Easy** if they're slower.
4. **Three passes before three fails** and the crew gets what it wanted (it escapes, or it catches them). **Three fails first** and the other side does. A **critical** counts as two passes.

The **Getaway** and **Shortcut** [talents](progression.md#-trait-talents) can end a chase outright. A chase through busy streets can still add [Exposure](exposure_and_trust.md#-gaining-exposure) for witnesses.

### 🚂 Vehicles

Vehicles have no stat lines. They're scenery that moves.

| Situation | Rule |
| :--- | :--- |
| 🎯 **Shooting to or from a moving vehicle** | The target counts as **in cover** (`-1 dice` To Hit). It doesn't stack with real cover |
| 🔩 **Attacking a vehicle** | To Wound at `-2` (it's iron). A **Critical Wound** (12) stops it. Any other result just leaves a mark |
| 💥 **Ramming** | The driver makes a **Driver** test instead of To Hit, then rolls To Wound against the target as a `+2` weapon |
| 🧯 **Crashing** | Everyone aboard makes a [hazard](#-hazards) roll at `+1` |
| 🔧 **Repairing** | A **Mechanic** test, or Hard without the trait. It takes a scene, not an Action |

---

## 🚧 Hazards

The world hurts too. A hazard makes a **wound roll** against the character, read on the [Injury Table](dice_system.md#-injury-table), exactly as if a weapon had hit them.

| Hazard | Wound roll |
| :--- | :---: |
| 🪜 A fall of 3" to 6", a scald, a live wire | `+0` |
| 🔥 A fall of more than 6", a steam burst, being caught in a fire, a crash | `+1` |
| 🏚️ A fall of more than 12", being crushed by machinery, a boiler explosion | `+2` |

- **Avoiding it.** If the character sees it coming, they make a test first (**Runner** to jump clear, **Mechanic** to vent the boiler). On a pass there's no wound roll.
- **Armour** only counts if it would really help. **Fireproof** armour gives its extra `-1 dice` against fire and steam.
- **Shaken from a hazard** lasts until the end of the combat, or the end of the scene out of combat.
- **No breath.** Each round underwater or in thick smoke gives **1 Shaken**. Shaken past `-3` becomes wounds, as usual. An **Iron lung** graft ignores this, and a **gas mask** ignores smoke.
- **Poison and drugs.** A poison makes **one** hazard roll at `+0` to `+2`, chosen by the DM, when it takes hold. A **Medic** test (identifying drugs and poisons) made before then stops it.

---

## 🏠 Downtime

Downtime happens **between jobs**. Do it in this order:

| Step | What happens |
| :---: | :--- |
| **0** | 🪙 **Homecoming** comes first: the Need, Hardship, raids, the water, the Pot, building and the split ([Community](community.md#-homecoming)) |
| **1** | 🩹 **Recovery.** Every character removes wounds depending on the Clinic: **1** with no Clinic, **2** with Clinic I, **all** with Clinic II or III |
| **2** | 🧑‍🔧 **Downtime actions.** Each character takes **one** (below) |
| **3** | 📈 **Level up**, if anyone has enough Marks ([Progression](progression.md)) |
| **4** | 🛒 **Shop** in any market you have access to |
| **5** | 👁️ **Things go quiet.** Exposure goes down by **1** ([Exposure](exposure_and_trust.md#-reducing-exposure)) |

### 🧑‍🔧 Downtime actions

Each character picks **one**.

| Action | Effect |
| :--- | :--- |
| 🛌 **Recover** | Remove **2 more wounds** |
| 🪙 **Odd Jobs** | Earn **5c**. Keep it or send it home |
| 🏠 **Help at Home** | `+1 dice` on the **Hardship** and **Raid** tests at the **next** Homecoming. Only `+1` in total, however many characters do this |
| 🤫 **Keep Quiet** | **-1 Exposure**. Only `-1` in total, however many characters do this |
| 🔎 **Seek Out** | A test with a covering trait (usually **Streetwise**) to find one specific person, rumour or item. On a pass you may buy one **Specialist** item before you've unlocked the market, at **double** price, or replace a [lost contact](progression.md#-contacts) |

### 🫥 Lying low

Instead of taking the next job, the crew can **lie low**: **-2 Exposure** (`-3` with [Safehouse II](community.md#-projects)), but there's **no pay** and no Marks that round.

Homecoming and downtime still happen. The **Need is still due**, so the crew has to pay it from the Pot or their own chips, or face a [Hardship test](community.md#-hardship). Things still go quiet in downtime, so lying low takes off **3 Exposure** in total (4 with Safehouse II).

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
| **7** | Cover and line of sight | 🟡 **Proposed:** see any part to target. Cover is `-1 dice` To Hit on ranged attacks only, and doesn't stack. |
| **8** | Leaving melee | 🟡 **Proposed:** allowed, but you can't Attack in that activation. |
| **9** | Enemy profiles | 🟡 **Proposed:** six profiles. Unnamed enemies have 1–3 wounds, go out instead of Dying, and flee at half strength. |
| **10** | Darkness | 🟡 **Proposed:** cover against ranged attacks, Hard for tests that rely on sight, Easy for sneaking. A lantern removes the penalty, but lights up whoever carries it. |
| **11** | Chases and vehicles | 🟡 **Proposed:** three passes before three fails. Moving vehicles count as cover, are `-2` to wound, and stop on a 12. Ramming is a Driver test, then a `+2` wound roll. |
| **12** | Hazards | 🟡 **Proposed:** a wound roll at `+0` / `+1` / `+2`, avoided with a test if seen coming. Breathless rounds give Shaken. Poison is one roll. |
| **13** | Who rolls? | 🟡 **Proposed:** only the crew rolls tests. Opposition sets the difficulty. Both sides roll in combat. |
| **14** | Stunts | 🟡 **Proposed:** a test to Pin, Disarm or Floor a model in base contact. No wounds or Shaken. |
| **15** | Medic actions without the trait | 🟡 **Proposed:** all of them are `-1 dice` (they need know-how). |

🟡 = proposed, not yet final.

### Open questions

- [x] **Cover and terrain:** now proposed above (#7).
- [x] **Line of sight:** now proposed above (#7).
- [x] **Leaving melee:** now proposed above (#8).
- [x] **Vehicles:** now proposed above (#11).
- [x] **Enemy profiles:** now proposed above (#9).
- [x] **Darkness:** now proposed above (#10). It's cover for ranged attacks, and Hard for tests that rely on sight.

---

<sub>🏃 Last updated 2026-11-02.</sub>
