# 🧰 Project Society — Character Creation

> **Who you are matters more than what you can do.**
> Pick a name and a background. Your background gives you **traits**: broad descriptions of what you're good at. There are no skill lists.

This document builds on the [Dice System](dice_system.md). Every trait is a `+1 dice` modifier from that system.

| Related rules | |
| :--- | :--- |
| 🎲 [Dice System](dice_system.md) | How every roll works |
| 🛒 [Equipment & Chips](equipment.md) | Gear, prices, special rules, job pay |
| 🏃 [Actions](actions.md) | Turns, combat actions, healing, dying, downtime |
| 🏠 [Community](community.md) | The home district and sending chips home |
| 👁️ [Exposure & Trust](exposure_and_trust.md) | Staying deniable, and the handler |
| 📈 [Progression](progression.md) | Levels, new traits, talents, unlocks |

---

## 📑 Contents

1. [Creating a Character](#-creating-a-character)
2. [Wounds](#-wounds)
3. [Traits Instead of Skills](#-traits-instead-of-skills)
4. [Trait List](#-trait-list)
5. [Backgrounds](#-backgrounds)
6. [Worked Example](#-worked-example)
7. [Design Decisions](#-design-decisions)

---

## 🪪 Creating a Character

Six steps. A new player should finish in about ten minutes.

| Step | What you do |
| :---: | :--- |
| **1** | 🪪 **Name and concept.** Who are you, in one sentence? *"A foundry hand who knows every boiler on Cistern Row."* |
| **2** | 🏭 **Background.** Choose one [background](#-backgrounds) and take **2 of its 3 traits**. |
| **3** | ✨ **Personal trait.** Take **1 more trait** from the [trait list](#-trait-list). It can come from any background. This is what makes you more than your job. |
| **4** | 🩸 **Wounds.** Every character starts with **5 wounds**. |
| **5** | 💰 **Kit and chips.** Take your background's **starting kit** and **20 chips**. Spend them on the [Works market](equipment.md#-price-lists) now or keep them. |
| **6** | 🏠 **Ties.** Answer the two questions below. |

You start at **Level 1** with **0 Marks**. See [Progression](progression.md).

### 🏠 Ties to home

Answer both. The DM will use them, and some [Hardship events](community.md#-hardship-events) target them directly.

1. **Who at home depends on you?** Name one person: a parent, a child, a sick friend, an old mentor.
2. **Why do you still work for Antioch?** Pick one, or write your own:
   - *"Because the water has to keep running."*
   - *"Because the gang took me in when nobody else would."* (good for defectors)
   - *"Because I owe someone in the gang a debt."*
   - *"Because one day I'll find a way out of the contract."*

### 📋 What goes on the sheet

```
 ┌──────────────────────────────────────────────────────────┐
 │ NAME ____________________   BACKGROUND _________________ │
 │ LEVEL ___   MARKS ___                                    │
 │                                                          │
 │ TRAITS   1. ____________  2. ____________                │
 │          3. ____________  (personal)                     │
 │          more from levelling: ____________ ____________  │
 │ TALENTS  ________________________________________        │
 │ CONTACTS ________________________________________        │
 │                                                          │
 │ WOUNDS  ☐ ☐ ☐ ☐ ☐ ┆ ☐ ☐ ☐       SHAKEN  ☐ ☐ ☐             │
 │         (base)    ┆ (unlocked)  SCARS   ______________   │
 │                                                          │
 │ CHIPS ______                                             │
 │                                                          │
 │ GEAR (name · modifier · range · rules)                   │
 │  ____________________________________________________    │
 │  ____________________________________________________    │
 │                                                          │
 │ DEPENDS ON ME ____________   WHY ANTIOCH ______________  │
 └──────────────────────────────────────────────────────────┘
```

The crew also shares one **crew sheet** with **Community**, **the Pot**, **Exposure** and **Trust**.

---

## 🩸 Wounds

Every character can take **5 wounds**. Fill one box per wound.

When the last box is filled, the character is **Dying**. They drop and can't act. After the combat, someone must make a **survival roll** (a Medic test). **If it fails, the character dies.** The full rules are in [Actions: Dying](actions.md#-dying).

### ⬆️ Raising the wound limit

A character can never have more than **8 wounds**. There are two ways to go beyond 5:

| Source | Bonus | Cost |
| :--- | :---: | :--- |
| 📈 **Hardened** at [Level 4 and Level 8](progression.md#-level-table) | `+1` each | Free. Surviving makes you harder to kill |
| ✨ **Grown sinew** ([Refined graft](equipment.md#-refined-grafts)) | `+1` | 150 chips, Level 6 market, **illegal**. A body designed to look born that way. Being found with one is +2 Exposure |

So a Level 8 character has 7 wounds, or 8 with a graft.

> 💭 **Ideas considered and rejected**
> - **A "Tough" trait.** Traits are always `+1 dice` on a roll. Making one trait do something different would break that rule.
> - **Armour adding wounds.** Armour already works through `-dice` on wound rolls, and stacking both would make armoured characters nearly unkillable.
> - **Scars adding wounds.** It's thematic, but it would reward nearly dying, and players would start chasing it.
> - **Buying wounds with chips at the clinic.** Chips should go home. Grafts are the one exception, because they're rare, illegal and dangerous to carry.

---

## 🧬 Traits Instead of Skills

There is no skill list to track. When you want to do something risky, the conversation goes like this:

> **Player:** "I want to pick the lock on the warehouse door."
> **DM:** "Do you have a trait that covers that?"
> **Player:** "I'm a **Craftsperson**. I've built locks like that, so I know how they come apart."
> **DM:** "That works. Roll with `+1 dice`."

Another player with **Thief** could make the same roll for a different reason. Several traits can cover the same action, and that's intended.

### ⚖️ Trait rules

| Rule | Detail |
| :--- | :--- |
| **A covering trait** | `+1 dice` on the roll |
| **Traits don't stack** | Only **one** trait counts per roll, even if several could apply. Pick the best one. |
| **No trait, anyone could try** | Roll a plain 2D6. Climbing a fence or lying to a guard doesn't need training. |
| **No trait, it needs know-how** | `-1 dice`. Patching a gunshot wound or bypassing a pressure valve without training is a Hard test at best. |
| **Specialist work** | Some things can't be attempted without a covering trait, like forging a house seal or surgery. The DM says so **before** the roll. |
| **Traits stack with everything else** | Tools, gear, aiming and Easy tests all add on top of the trait. |

> 🗣️ **Make the case.** If you think a trait applies, say why. The DM should usually agree when the pitch fits the character. Arguing your Brawler into a conversation by leaning on the table and cracking your knuckles is good roleplay, so reward it.

### 🤝 Helping

One crew member with a covering trait can **help** another, giving `+1 dice`. The helper has to be there and doing something, and if the roll fails, the helper shares the consequences. Only **one helper** per roll. In combat, helping uses the helper's Action (see [Actions](actions.md#-combat-actions)).

### 🗡️ Traits in combat

Combat traits (**Brawler** and **Marksman**) cover the **To Hit** roll. **No trait covers To Wound.** Damage comes from your gear, which is why chips matter in a fight.

---

## 📜 Trait List

The **Covers** column gives examples, not a complete list. The **Doesn't cover** column helps the DM rule on edge cases. Each trait also has two [talents](progression.md#-talents) that can be unlocked by levelling.

| Trait | Covers | Doesn't cover |
| :--- | :--- | :--- |
| 👊 **Brawler** | Melee To Hit, grappling, shoving, forcing doors, holding a doorway | Shooting, threatening someone without a fight |
| 🎯 **Marksman** | Ranged To Hit, trick shots, judging distance, spotting a firing position | Melee, repairing guns (that's **Mechanic**) |
| 🗝️ **Thief** | Picking locks, pickpocketing, palming items, slipping bonds, casing a building | Sneaking past people (that's **Shadow**) |
| 🔨 **Craftsperson** | Building and repairing by hand, taking locks and mechanisms apart, appraising goods, improvising tools | Engines and boilers (that's **Mechanic**) |
| ⚙️ **Mechanic** | Boilers, engines, pressure lines, vehicle repair, sabotaging machinery, repairing guns | Driving (that's **Driver**) |
| 🩹 **Medic** | Treating wounds, survival rolls, diagnosing illness, identifying drugs and poisons | Hurting people efficiently |
| 🗣️ **Smooth Talker** | Persuading, lying, haggling, charming, talking your way past a guard | Threats (that's **Intimidator**), court manners (that's **Courtier**) |
| 😠 **Intimidator** | Threatening, interrogating, breaking a crowd's nerve, staring someone down | Persuading someone who isn't afraid of you |
| 🏚️ **Streetwise** | Finding people and goods in the Works and the Sunk, reading gang signs, hearing rumours, black-market prices | Anything in the Heights |
| 🎩 **Courtier** | Etiquette in the Terraces and Heights, passing as a servant, reading Refined tells, knowing who's who in the houses | Anything in the Works |
| 🏃 **Runner** | Climbing, sprinting, chases on foot, rooftop jumps, escaping | Hiding (that's **Shadow**) |
| 🌑 **Shadow** | Sneaking, hiding, tailing someone, moving unseen | Locks (that's **Thief**) |
| 🚂 **Driver** | Steam carts, barges, crawlers, vehicle chases, knowing the routes | Fixing the vehicle (that's **Mechanic**) |
| 🖋️ **Forger** | Forged documents, invitations, seals and signatures, spotting forgeries | Disguises (the handler supplies those) |
| 📚 **Lettered** | Reading and writing well, records, maps, codes, history, finding things in archives | Speaking persuasively |

> 🔁 **Overlaps are a feature.** Locks are covered by **Thief** *and* **Craftsperson**. Gun repair by **Mechanic**. Getting past a guard by **Smooth Talker**, **Intimidator**, **Courtier** or **Shadow**, depending on *how*. The same problem can be solved more than one way.

---

## 🏭 Backgrounds

Pick one. Take **2 of its 3 traits**. Each starting kit is worth about **30 chips**. Item details are in [Equipment](equipment.md).

| Background | Who you were | Traits (pick 2) | Starting kit |
| :--- | :--- | :--- | :--- |
| 🔥 **Foundry Hand** | You poured brass and hauled slag until your hands went hard | Craftsperson · Brawler · Mechanic | Wrench (`+1`), padded apron (`-1`), tool roll |
| 🔧 **Line Fitter** | You kept the pressure lines running, crawling through ducts and up pipe stacks | Mechanic · Runner · Craftsperson | Pipe wrench (`+1`), mechanic's kit, climbing rig |
| 👛 **Cutpurse** | You grew up taking what the Terraces dropped | Thief · Shadow · Streetwise | Knife (`+1`), lockpicks, 2 smoke canisters |
| 🥊 **Enforcer** | You stood at the gang's door and made sure people paid | Brawler · Intimidator · Marksman | Cosh (`+1`), hose pistol (`+1`), padded coat (`-1`) |
| 🩹 **Clinic Hand** | You kept the pump-house clinic alive on donations and stubbornness | Medic · Lettered · Smooth Talker | Knife (`+1`), medic's satchel, 3 field dressings, 2 Boiler-black |
| 🚂 **Hauler** | You drove cargo between districts and knew every checkpoint | Driver · Runner · Streetwise | Pistol (`+1`), padded coat (`-1`) |
| 🤝 **Fixer** | You worked the Margin, finding buyers and making introductions between the upper and lower layers | Smooth Talker · Forger · Courtier | Pistol (`+1`), forger's kit |
| 🎩 **Fallen Servant** | You served in a Terraces house until you were dismissed, and you remember everything | Courtier · Lettered · Thief | Knife (`+1`), lockpicks, a good suit of clothes, 5 extra chips |
| 🎖️ **Deserter** | You fought for another house's crew or Antioch's fleet yards, then walked away *(good for defectors)* | Marksman · Medic · Intimidator | Rifle (`+2`) |
| 🛶 **Sunk Smuggler** | You moved stolen Refinement through the underworld | Forger · Driver · Shadow | Knife (`+1`), padded coat (`-1`), spyglass |

> 🧭 **Every trait appears in at least two backgrounds**, so no crew is locked out of anything. Your personal trait (step 3) covers whatever your background doesn't.

---

## 📖 Worked Example

<details open>
<summary><b>Making Dace</b></summary>

> **① Name and concept.** *Dace, a foundry hand who knows every boiler on Cistern Row.*
>
> **② Background.** 🔥 **Foundry Hand.** She takes **Mechanic** and **Brawler**, leaving Craftsperson.
>
> **③ Personal trait.** 🩹 **Medic.** She learned it the hard way, carrying people out of steam bursts.
>
> **④ Wounds.** 5.
>
> **⑤ Kit and chips.** Wrench (`+1`), padded apron (`-1`), tool roll, **20 chips**. She didn't take Craftsperson, so she sells the tool roll for **5c** (25c total). She buys a **medic's satchel (10c)** and **1 Boiler-black (8c)**, and keeps **7c**.
>
> **⑥ Ties.** *Old Merren depends on her. She works for Antioch "because the water has to keep running."*

| Dace | |
| :--- | :--- |
| **Level** | 1 (0 Marks) |
| **Traits** | Mechanic · Brawler · Medic |
| **Wounds** | 5 |
| **Gear** | Wrench (`+1`) · Padded apron (`-1`) · Medic's satchel · 1 Boiler-black |
| **Chips** | 7c |

</details>

<details>
<summary><b>Dace in play</b></summary>

> **Sabotaging a pump.** Mechanic (`+1`) with no mechanic's kit. **3D6, keep highest two.** 81%.
>
> **A survival roll for a dying crewmate.** Medic (`+1`) + medic's satchel (`+1`). **4D6, keep highest two.** 91%.
>
> **Picking a lock.** None of her traits fit, but locks need know-how. `-1 dice`. **3D6, keep lowest two.** 32%. Better to let the Cutpurse do it. Dace can't **help** either, because helping needs a covering trait.
>
> **Hitting a raider with her wrench.** To Hit with Brawler (`+1`): 81%. To Wound with the wrench (`+1`).

</details>

---

## ✅ Design Decisions

These are **final**.

| # | Question | Ruling |
| :---: | :--- | :--- |
| **1** | Skills or traits? | ✅ **Traits only.** No skill list. Traits are broad and argued for at the table. |
| **2** | How many traits does a new character have? | ✅ **3** (2 from background, 1 personal). More come from [Progression](progression.md). |
| **3** | Do traits stack with each other? | ✅ **No.** One trait per roll. Tools, gear and situation stack on top. |
| **4** | What if no trait covers a roll? | ✅ **Plain 2D6** if anyone could try. **`-1 dice`** if it needs know-how. **Not possible** for specialist work. |
| **5** | Do traits affect wound rolls? | ✅ **No.** Combat traits cover To Hit only. Damage comes from gear. |
| **6** | Can crew members help each other? | ✅ **Yes.** One helper with a covering trait gives `+1 dice` and shares the consequences. |
| **7** | Does Refined gear give bigger modifiers? | ✅ **No.** It obeys the ±2 cap. Gear can have [special rules](equipment.md#special-rules) such as **Fire**, **Pierce** or **Silent** instead. |
| **8** | Ammo, encumbrance, upkeep? | ✅ **None.** Too much micro-management. |
| **9** | How many wounds? | ✅ **5**, raised by levelling and Refined grafts, to a maximum of **8**. |
| **10** | What happens at 0 wounds left? | ✅ The character is **Dying**. A failed survival roll after the combat means **death**. |
| **11** | Currency? | ✅ **Chips**: tokens of a Refined brass alloy. Written as **c** (e.g. 15c). |

---

<sub>🧰 Last updated 2026-11-02.</sub>
