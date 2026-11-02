# 🏠 Project Society — Community

> **Every chip is a choice.** Keep it and the crew gets stronger. Send it home and the district does.
> The community is why the crew works for Antioch. This document is what happens to it.

See also [Equipment & Chips](equipment.md), [Actions: Downtime](actions.md#-downtime), [Exposure & Trust](exposure_and_trust.md) and [Progression](progression.md).

---

## 📑 Contents

1. [The Community Track](#-the-community-track)
2. [Homecoming](#-homecoming)
3. [Sending Chips Home: the Pot](#-sending-chips-home-the-pot)
4. [Projects](#-projects)
5. [Not Sending Chips Home: Hardship](#-hardship)
6. [Raids](#️-raids)
7. [The Water](#-the-water)
8. [Collapse](#-collapse)
9. [Worked Example](#-worked-example)
10. [Design Decisions](#-design-decisions)

---

## 📊 The Community Track

**Community** is a number from **0 to 10** on the crew sheet. It is always equal to the number of **project tiers** the district has built. A clinic, a workshop, a watch: each tier is one point of Community.

A new campaign starts at **Community 3**, with three tiers already built:

- 🩺 **Clinic I**: the pump-house clinic
- 📚 **Hall I**: the ration board and meeting room
- ➕ **One tier of the crew's choice**

### Bands

| Community | Band | Need per job | What the district looks like |
| :---: | :--- | :---: | :--- |
| **0** | 💀 **Collapsed** | — | See [Collapse](#-collapse) |
| **1–2** | 🥀 **Desperate** | 5c | Empty shopfronts. People leaving for other gangs |
| **3–4** | 🧱 **Struggling** | 10c | Getting by on what the crew sends. One bad month from Desperate |
| **5–6** | 🔧 **Getting By** | 15c | Repairs get done. Kids go to the Hall instead of the street |
| **7–8** | 🌱 **Thriving** | 20c | Other districts notice. Some of them are jealous |
| **9–10** | 🏙️ **Flourishing** | 25c | A power in the Works. The houses start to notice too |

The **Need** is what the community needs from the crew after every job just to keep going. It grows as the district grows, because there's more to maintain.

---

## 🪙 Homecoming

After every job, the crew comes home. Do this in order:

| Step | What happens |
| :---: | :--- |
| **1** | 💧 **Pay the Need** from the job's pay (or the crew's savings) |
| **2** | 🎲 **Need not met?** Make a [Hardship test](#-hardship) |
| **3** | 🏺 **Fill the Pot.** Put in any extra chips the crew chooses to send home |
| **4** | 🏗️ **Build.** If the Pot has enough, raise Community and build a tier |
| **5** | 💰 **Split the rest** between the characters |

Then carry on with [downtime](actions.md#-downtime).

> 🗳️ **The crew decides together.** Nobody forces anyone to send chips home. If the crew can't agree, the DM should let the argument happen. It's one of the best scenes this game produces.

---

## 🏺 Sending Chips Home: the Pot

Chips sent home beyond the Need go into **the Pot**, which is kept on the crew sheet and carries over between jobs.

When the Pot holds enough, spend it to raise Community by 1:

> **Cost of the next Community point = the new Community × 10c**

| Community | 3 → 4 | 4 → 5 | 5 → 6 | 6 → 7 | 7 → 8 | 8 → 9 | 9 → 10 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Cost** | 40c | 50c | 60c | 70c | 80c | 90c | 100c |

Each time Community goes up, the crew **builds one project tier**. Tiers must be built in order: I, then II, then III.

> 🧮 **Pacing.** Going from Community 3 to 10 costs **490c**. A crew sending 30c a job gets there in about 16 jobs, while keeping very little for themselves. There are **18 tiers** but Community stops at **10**, so no district can have everything. Choose what your people need most.

---

## 🧱 Projects

Six projects, three tiers each.

| Project | Tier I | Tier II | Tier III |
| :--- | :--- | :--- | :--- |
| 🩺 **Clinic** | Downtime [Recovery](actions.md#-downtime) removes **2 wounds** (instead of 1) | Recovery removes **all wounds** | `+1 dice` on [survival rolls](actions.md#-dying). The clinic's runners teach the crew and stock their kit |
| 🔧 **Workshop** | Sell gear for **¾** price (instead of ½) | **Works market** items cost **20% less** (rounded up) | **Specialist market** opens, whatever the crew's level, also 20% off |
| 👁️ **Watch** | `+1 dice` on [Raid tests](#️-raids) | `+2 dice` on Raid tests | `+3 dice` on Raid tests, and the crew gets warning: they can choose to defend the district in person |
| 💧 **Cistern** | If the [water is cut](#-the-water), the first Homecoming without water costs no Community | The first **three** Homecomings without water cost nothing | **The district has its own water.** Cutting it off no longer hurts the community |
| 🏚️ **Safehouse** | The **Keep Quiet** downtime action removes **2 Exposure** (instead of 1) | **Lying low** removes **3 Exposure** (instead of 2) | **Once per campaign**, when Exposure would reach 10, set it to **8** instead. The crew disappears for a while |
| 📚 **Hall** | `+1 dice` on [Hardship tests](#-hardship) | New and replacement characters join at the **full** crew level (instead of one lower) | **Once per job**, someone from the gang turns up to help: `+1 dice` on one test, no trait needed |

> 💧 **Cistern III changes the campaign.** Antioch's real hold over the district is the water. A district with its own water can't be threatened the same way, and Antioch will notice. The DM should make that matter: it may be the first step towards [a way out](#-design-decisions).

---

## 🎲 Hardship

If the crew **doesn't pay the full Need** at Homecoming, someone makes a **Hardship test** for the community. It's a normal 2D6 roll: **7+ to pass**.

| Modifier | Dice |
| :--- | :---: |
| 🪙 Paid **at least half** the Need | `+1` |
| 🚫 Paid **nothing** | `-1` |
| 🏠 A character took **Help at Home** in the last downtime | `+1` |
| 📚 **Hall I** or better | `+1` |

| Result | Effect |
| :--- | :--- |
| ✅ **Pass** | The community makes do this time. Nothing is lost |
| 💥 **Critical** | The community pulls together. Nothing is lost, and **10c** goes into the Pot from neighbours who had a good month |
| ❌ **Fail** | **-1 Community**: the crew chooses a tier to lose (always the highest tier of that project). Then roll on the [Hardship events](#-hardship-events) table |

> 🧭 **What happens if they don't send chips home?** The district doesn't collapse at once. It makes a test, and it often passes. But each failure takes something away: the clinic closes a ward, the watch stops patrolling, families leave. And every point lost costs **more chips to rebuild** than it would have cost to protect.

### 🎲 Hardship events

Roll **1D6**.

| 1D6 | Event | Effect |
| :---: | :--- | :--- |
| **1** | 🤒 **Sickness** | Something goes through the district. If the Clinic has any tiers, the lost tier **must** be a Clinic tier |
| **2** | 🚪 **Families leave** | They go to a rival gang's district. Make a [Raid check](#️-raids) at the next Homecoming, even if one isn't due |
| **3** | 💰 **Debt** | A Sunk lender covers the shortfall. At the next Homecoming, the Need is **doubled** |
| **4** | 🔥 **Unrest** | Arguments, then fighting. The ration board burns. If the Watch or Hall has any tiers, the lost tier **must** be one of them |
| **5** | 🫂 **Close to home** | Someone from a crew member's [Ties](character_creation.md#-ties-to-home) is hurt, ill or in trouble. The DM turns it into a personal side job |
| **6** | 💧 **Pressure drop** | The pump house fails. Antioch's engineers will fix it, eventually. Pay **15c** now, or lose **1 more Community** |

---

## 🛡️ Raids

Rival gangs raid districts that look weak, rich, or tied to a house they hate.

### Is there a raid?

At Homecoming step 2, make a **Raid check** if **any** of these is true:

- **Exposure is 4 or more.** Rivals know who the crew works for.
- **Community is 7 or more.** The district is worth robbing.
- A **Families leave** Hardship event said so.
- The DM's story says so.

**Raid check:** roll 2D6. On **7+**, the district is raided. If Exposure is **Hot** (7+), roll with `+1 dice`.

### The Raid test

If there's a raid, someone makes a **Raid test** for the district: 2D6, **7+ to pass**.

| Modifier | Dice |
| :--- | :---: |
| 👁️ Watch I / II / III | `+1` / `+2` / `+3` |
| 🏠 A character took **Help at Home** in the last downtime | `+1` |
| 🔥 Exposure is **Hot** (7+) | `-1` |

| Result | Effect |
| :--- | :--- |
| ✅ **Pass** | The raiders do some damage and leave. Antioch's elite arrives, late as always. Nothing is lost |
| 💥 **Critical** | The district drives the raiders off **before Antioch arrives**. Skip the next Raid check |
| ❌ **Fail** | **-1 Community**. The **DM** chooses which tier is lost, because raiders hit what they can see |

### Defending in person

With **Watch III**, or whenever the DM sets a raid while the crew is home, the crew can **fight**. Play it as a normal combat on home ground. If the crew wins, nothing is lost and no test is needed. If the crew loses or retreats, treat it as a failed Raid test.

> ⏱️ **Antioch always comes, eventually.** That's the contract. Raids can only cost **1 Community** at a time, because an elite arrives and ends it. If the crew is [Burned](exposure_and_trust.md#-exposure-bands), nobody comes, and a failed Raid test costs **2 Community**.

---

## 💧 The Water

Antioch controls the water. Antioch **cuts the water** if:

- the crew is **Burned** (Exposure 10) and the DM decides Antioch wants the lesson learned, or
- the crew or gang **works for another house**.

While the water is cut, **every Homecoming costs 1 Community**, on top of everything else, unless the [Cistern](#-projects) covers it.

The water comes back when the crew is back in Antioch's good graces (see [Burned](exposure_and_trust.md#-exposure-bands)).

> 🕵️ **GM only.** Never tell the players whether Antioch cut only their district, or paid the Monarch for a wider cut. The players should never be sure how far Antioch would go.

---

## 💀 Collapse

At **Community 0**, the district collapses.

- Families scatter to other gangs. The people from each character's **Ties** are gone: moved away, taken in elsewhere, or worse. The DM decides.
- Downtime **Recovery** removes only **1 wound** and there are no project benefits.
- There's no Need and no Hardship test, because there's nothing left to lose.
- The crew can rebuild. Sending chips home starts again from Community 0 (the first point costs 10c).

Collapse isn't the end of the campaign, but it is the end of what the crew was fighting for. The DM should ask the players: **why are you still here?**

---

## 📖 Worked Example

<details open>
<summary><b>Three jobs on Cistern Row</b></summary>

> **Start.** Community **3** (Clinic I, Hall I, and the crew chose Watch I). Need **10c**. Pot **0c**.
>
> **Job 1, Standard (60c).** The crew pays the Need (10c), puts **30c** in the Pot, and splits 20c. Pot: **30c**. It costs 40c to reach Community 4.
>
> **Job 2, Standard (60c).** The Need is paid (10c). The crew puts **10c** in. Pot: **40c**, enough. Community goes up to **4** and they build **Clinic II**: Recovery now removes all wounds. Pot: **0c**. They split 40c.
>
> **Job 3, Simple, failed objective (15c, half pay).** One character needs a new rifle badly. The crew pays **5c** of the 10c Need and keeps the rest.
>
> **Hardship test:** half the Need was paid (`+1`), Hall I (`+1`) = **`+2`**. 🎲 `3` `2` `2` `1` → keep `3 + 2` = 5. **Fail.**
>
> **-1 Community** (down to 3). The crew decides to lose Watch I. They roll the event: **4, Unrest**. That forces the lost tier to be Watch or Hall, and they've already chosen Watch.
>
> The ration board burns. Next time the Exposure is high, the district has no watch.

</details>

---

## ✅ Design Decisions

| # | Question | Ruling |
| :---: | :--- | :--- |
| **1** | What is Community? | 🟡 **Proposed:** 0–10, always equal to the number of project tiers built. Starts at 3. |
| **2** | What happens when chips are sent home? | 🟡 **Proposed:** the Need is paid first. Extra goes into the Pot, and each new point of Community costs the new level × 10c and builds one tier. |
| **3** | What happens when they're not? | 🟡 **Proposed:** a Hardship test. Failing loses a tier and triggers an event. |
| **4** | Do raids happen? | 🟡 **Proposed:** when Exposure is 4+, Community is 7+, or the story says so. Antioch always ends them, late. |
| **5** | Way out of the contract | 🟡 **Proposed:** Cistern III removes the water threat. What else a way out needs is a story question for later. |

🟡 = proposed, not yet final.

---

<sub>🏠 Last updated 2026-11-02.</sub>
