# 🏠 Project Society — Community

> **Every chip is a choice.** Keep it and the crew gets stronger. Send it home and the district does.
> The community is why the crew works for Antioch. This document is what happens to it.

See also [Equipment & Chips](equipment.md), [Actions: Downtime](actions.md#-downtime), [Exposure & Trust](exposure_and_trust.md) and [Progression](progression.md).

---

## 📑 Contents

1. [Community at a Glance](#-community-at-a-glance)
2. [The Campaign Loop](#-the-campaign-loop)
3. [The Community Track](#-the-community-track)
4. [Homecoming](#-homecoming)
5. [The Need](#-the-need)
6. [The Pot and Building](#-the-pot-and-building)
7. [Projects](#-projects)
8. [Hardship](#-hardship)
9. [Raids](#️-raids)
10. [The Water](#-the-water)
11. [Losing Tiers](#-losing-tiers)
12. [Collapse](#-collapse)
13. [Worked Example](#-worked-example)
14. [Quick Answers](#-quick-answers)
15. [Design Decisions](#-design-decisions)

---

## 👀 Community at a Glance

The whole system in five lines:

1. The district has a **Community** score from 0 to 10. Each point is one **project tier** that has been built, such as a clinic or a watch.
2. After every job, the district needs some chips just to keep going. This is **the Need**.
3. **Pay the Need** and nothing bad happens. **Don't pay it** and the district makes a **Hardship test**. If that fails, it loses a tier.
4. Chips sent home on top of the Need go into **the Pot**. When the Pot is full enough, the district **builds** a new tier.
5. **Raids** and **the water** can also cost tiers. That's how Exposure and Antioch reach the district.

### On the crew sheet

| Track | What it is | Starts at |
| :--- | :--- | :---: |
| 🏠 **Community** | 0–10, the number of project tiers built | **3** |
| 🧱 **Projects** | Which tiers are built. They always add up to Community | Clinic I, Hall I, + one more |
| 💧 **Need** | Chips due at every Homecoming. Set by Community | **10c** |
| 🏺 **Pot** | Chips saved up for the next tier | **0c** |
| 🚱 **Water** | On or cut | On |

---

## 🔁 The Campaign Loop

The campaign moves in a loop. Each time round is one **job**:

```
 ┌───────────┐    ┌──────────┐    ┌──────────────┐    ┌────────────┐
 │ 1 BRIEFING│ ─▶ │ 2 THE JOB│ ─▶ │ 3 HOMECOMING │ ─▶ │ 4 DOWNTIME │ ─┐
 └───────────┘    └──────────┘    └──────────────┘    └────────────┘  │
       ▲                                                              │
       └──────────────────────────────────────────────────────────────┘
```

| Step | What happens | Rules |
| :---: | :--- | :--- |
| **1** | 📜 **Briefing.** The handler offers a job. The crew asks for favours | [Exposure & Trust](exposure_and_trust.md#-favours) |
| **2** | 💼 **The job.** Exposure rises as things go wrong | [Exposure](exposure_and_trust.md#-gaining-exposure) |
| **3** | 🪙 **Homecoming.** The pay comes home. The district takes its share, or suffers | [Below](#-homecoming) |
| **4** | 🌙 **Downtime.** Recover, take one downtime action each, level up, shop | [Actions](actions.md#-downtime) |

**Lying low** replaces steps 1 and 2: there's no job and no pay. Homecoming and downtime still happen, so **the Need is still due**.

**Burned crews** get no jobs from the handler, but the loop still turns. A job can come from somewhere else (a rival house, a side job, a penance job), or the crew can lie low. Homecoming follows either way.

---

## 📊 The Community Track

**Community** is always equal to the number of **project tiers** built. Build a tier and it goes up by 1. Lose a tier and it goes down by 1.

A new campaign starts at **Community 3**, with three tiers already built:

- 🩺 **Clinic I**: the pump-house clinic
- 📚 **Hall I**: the ration board and meeting room
- ➕ **Tier I of one other project**, chosen by the crew

### Bands

| Community | Band | Need | What the district looks like |
| :---: | :--- | :---: | :--- |
| **0** | 💀 **Collapsed** | — | See [Collapse](#-collapse) |
| **1–2** | 🥀 **Desperate** | 5c | Empty shopfronts. People leaving for other gangs |
| **3–4** | 🧱 **Struggling** | 10c | Getting by on what the crew sends. One bad month from Desperate |
| **5–6** | 🔧 **Getting By** | 15c | Repairs get done. Kids go to the Hall instead of the street |
| **7–8** | 🌱 **Thriving** | 20c | Other districts notice. Some of them are jealous |
| **9–10** | 🏙️ **Flourishing** | 25c | A power in the Works. The houses start to notice too |

Community 7 or more also makes the district a target: see [Raids](#️-raids).

---

## 🪙 Homecoming

After every job (or a round of lying low), the crew comes home. **Do these steps in order.** Skip any step that doesn't apply.

| Step | | What happens | Can it cost Community? |
| :---: | :--- | :--- | :---: |
| **1** | 💧 **Pay the Need** | Pay the [Need](#-the-need) for the current band | — |
| **2** | 🎲 **Hardship** | Only if the Need wasn't paid in full. Make a [Hardship test](#-hardship) | ❌ on a fail |
| **3** | 🛡️ **Raids** | Only if a raid is due. Make a [Raid check](#️-raids), then a Raid test if raided | ❌ on a fail |
| **4** | 🚱 **Water** | Only if [the water is cut](#-the-water). Lose 1 Community unless the Cistern covers it | ❌ |
| **5** | 🏺 **Fill the Pot** | Put in any chips the crew chooses to send home | — |
| **6** | 🏗️ **Build** | If the Pot holds enough, [build a tier](#-the-pot-and-building) | — |
| **7** | 💰 **Split the rest** | Share what's left between the characters, however the crew agrees | — |

Then go on to [downtime](actions.md#-downtime).

> 🧭 **Why this order?** Losses (steps 2–4) come **before** building (step 6). If the district loses a tier, the crew can see it and decide whether to send more home to rebuild it straight away.

> 🗳️ **The crew decides together.** Nobody forces anyone to send chips home. If the crew can't agree, the DM should let the argument happen. It's one of the best scenes this game produces.

---

## 💧 The Need

The **Need** is what the district must have after every job just to keep going. It's set by the Community band (5c to 25c), because a bigger district has more to maintain.

**Paying it.** The Need can be paid from **any mix** of:

- the job's pay,
- the **Pot**,
- characters' own chips.

**Paying part of it** still helps: paying at least half gives `+1 dice` on the Hardship test.

**Debt.** The *Debt* [Hardship event](#-hardship-events) doubles the Need at the **next** Homecoming only. After that it goes back to normal.

**No pay?** If the crew lay low or the job paid nothing, the Need is still due. Pay it from the Pot or from characters' chips, or make the Hardship test.

---

## 🏺 The Pot and Building

Chips sent home on top of the Need go into **the Pot**. The Pot is kept on the crew sheet and carries over from job to job.

**The Pot belongs to the district.** Once chips are in it, the crew can't take them back for themselves. The Pot can only be spent on:

- 🏗️ building a tier,
- 💧 paying the Need,
- 💧 paying for the *Pressure drop* [Hardship event](#-hardship-events).

### Building a tier

At step 6 of Homecoming, if the Pot holds enough, the crew can spend it to **build one tier**. Community goes up by 1.

> **Cost of a tier = the Community it brings you to × 10c**

| New Community | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Cost** | 10c | 20c | 30c | 40c | 50c | 60c | 70c | 80c | 90c | 100c |

- **Tiers are built in order** within a project: I, then II, then III.
- **More than one tier** can be built in the same Homecoming, if the Pot pays for each in turn.
- **The crew can save.** There's no need to build as soon as the Pot is full.
- **Rebuilding costs the same** as building. A tier lost at Community 5 costs 50c to get back.

> 🧮 **Pacing.** Going from Community 3 to 10 costs **490c**. A crew sending 30c a job gets there in about 16 jobs, keeping very little for themselves. There are **18 tiers** but Community stops at **10**, so no district can have everything. Choose what your people need most.

At **Community 10** there's nothing left to build. Keep sending chips home anyway: a full Pot pays the Need when a job goes badly.

---

## 🧱 Projects

Six projects, three tiers each. Each tier is one point of Community.

### Which project solves which problem?

| If the crew… | Build | Because |
| :--- | :--- | :--- |
| keeps getting hurt | 🩺 **Clinic** | Faster healing between jobs, and fewer deaths |
| needs better gear | 🔧 **Workshop** | Cheaper gear, and the Specialist market early |
| works loud, with high Exposure | 👁️ **Watch** | Raids stop costing Community |
| is in trouble with Antioch | 💧 **Cistern** | Antioch can't threaten the water any more |
| keeps getting noticed | 🏚️ **Safehouse** | Exposure goes down faster |
| often misses the Need | 📚 **Hall** | Hardship tests pass more often |

### Tiers

| Project | Tier I | Tier II | Tier III |
| :--- | :--- | :--- | :--- |
| 🩺 **Clinic** | Downtime [Recovery](actions.md#-downtime) removes **2 wounds** (instead of 1) | Recovery removes **all wounds** | `+1 dice` on [survival rolls](actions.md#-dying) |
| 🔧 **Workshop** | Sell gear for **¾** price (instead of ½). Doesn't stack with a Fence | **Works market** items cost **20% less** (rounded up) | The **Specialist market** opens, whatever the crew's level. Its items are also 20% off |
| 👁️ **Watch** | `+1 dice` on [Raid tests](#️-raids) | `+2 dice` on Raid tests | `+3 dice` on Raid tests, and the crew is warned in time to [defend in person](#defending-in-person) |
| 💧 **Cistern** | Each time [the water is cut](#-the-water), the **first** Homecoming without water costs nothing | The first **three** Homecomings without water cost nothing | **The district has its own water.** A water cut costs nothing |
| 🏚️ **Safehouse** | **Keep Quiet** removes **2 Exposure** (instead of 1) | **Lying low** removes **3 Exposure** (instead of 2) | **Once per campaign**, when Exposure would reach 10, it becomes **8** instead |
| 📚 **Hall** | `+1 dice` on [Hardship tests](#-hardship) | New and replacement characters join at the **full** crew level (instead of one lower) | **Once per job**, someone from the gang turns up to help: `+1 dice` on one test, no trait needed |

A tier's effect works as long as the tier is built. If it's lost, the effect stops at once. If it's rebuilt, the effect comes back.

> 💧 **Cistern III changes the campaign.** Antioch's real hold over the district is the water. A district with its own water can't be threatened the same way, and Antioch will notice. The DM should make that matter: it may be the first step towards [a way out](#-design-decisions).

---

## 🎲 Hardship

At Homecoming step 2, if the Need **wasn't paid in full**, someone makes a **Hardship test** for the district. It's a normal 2D6 test: **7+ to pass**.

| Modifier | Dice |
| :--- | :---: |
| 🪙 Paid **at least half** the Need | `+1` |
| 🚫 Paid **nothing** | `-1` |
| 🏠 A character took **Help at Home** in the last downtime | `+1` |
| 📚 **Hall I** or better | `+1` |
| 🧓 A character has a **Gang Elder** [contact](progression.md#-contacts) | `+1` |

| Result | Effect |
| :--- | :--- |
| ✅ **Pass** | The district makes do. Nothing is lost |
| 💥 **Critical** | The district pulls together. Nothing is lost, and neighbours who had a good month put **10c** in the Pot |
| ❌ **Fail** | Roll on the **Hardship events** table below, then **lose 1 tier**. The crew chooses which, unless the event says otherwise |

> 🧭 **What if the crew never sends chips home?** The district doesn't collapse at once. It makes a test, and it often passes. But each failure takes something away: the clinic closes a ward, the watch stops patrolling, families leave. And every tier lost costs **more chips to rebuild** than it would have cost to protect.

### 🎲 Hardship events

Roll **1D6** after a failed Hardship test. Roll the event **before** choosing the lost tier, because some events decide it.

| 1D6 | Event | Effect |
| :---: | :--- | :--- |
| **1** | 🤒 **Sickness** | Something goes through the district. If the Clinic has any tiers, the lost tier **must** be a Clinic tier |
| **2** | 🚪 **Families leave** | They go to a rival gang's district. Make a [Raid check](#️-raids) at step 3 of **this** Homecoming, even if one isn't due |
| **3** | 💰 **Debt** | A Sunk lender covers the shortfall. At the **next** Homecoming, the Need is **doubled** |
| **4** | 🔥 **Unrest** | Arguments, then fighting. The ration board burns. If the Watch or Hall has any tiers, the lost tier **must** be one of them |
| **5** | 🫂 **Close to home** | Someone from a crew member's [Ties](character_creation.md#-ties-to-home) is hurt, ill or in trouble. The DM turns it into a personal side job |
| **6** | 💧 **Pressure drop** | The pump house fails. Antioch's engineers will fix it, eventually. Pay **15c** now (from the pay, the Pot or anyone's chips), or lose **1 more tier** |

---

## 🛡️ Raids

Rival gangs raid districts that look weak, rich, or tied to a house they hate. Raids happen at Homecoming step 3.

### Is a raid due?

A raid is **due** if **any** of these is true:

| Reason | Why |
| :--- | :--- |
| 🔦 **Exposure 4+** | Rivals know who the crew works for |
| 🌱 **Community 7+** | The district is worth robbing |
| 🚪 A **Families leave** event this Homecoming | The leavers talked |
| 📖 **The DM says so** | The story calls for it |

If a raid is due, make **one Raid check** (never more than one per Homecoming).

### Step 1: the Raid check

Roll 2D6. **On 7+, the district is raided.** If Exposure is **Hot** (7+), roll with `+1 dice`.

If the last Raid test was a **critical**, skip this Raid check entirely.

### Step 2: the Raid test

If the district is raided, someone makes a **Raid test** for it: 2D6, **7+ to pass**.

| Modifier | Dice |
| :--- | :---: |
| 👁️ Watch I / II / III | `+1` / `+2` / `+3` |
| 🏠 A character took **Help at Home** in the last downtime | `+1` |
| 🔥 Exposure is **Hot** (7+) | `-1` |

| Result | Effect |
| :--- | :--- |
| ✅ **Pass** | The raiders do some damage and leave. Antioch's elite arrives, late as always. Nothing is lost |
| 💥 **Critical** | The district drives the raiders off **before Antioch arrives**. Skip the next Raid check |
| ❌ **Fail** | **Lose 1 tier.** The **DM** chooses which, because raiders hit what they can see. If the crew is **Burned**, lose **2 tiers** |

### Defending in person

With **Watch III**, or whenever the DM sets a raid while the crew is at home, the crew can **fight** instead of making the Raid test. Play it as a normal combat on home ground, against [raiders](actions.md#-enemies).

- **The crew wins:** nothing is lost.
- **The crew loses or retreats:** treat it as a failed Raid test.

Wounds from the fight carry over into downtime, where Recovery heals them as normal.

> ⏱️ **Antioch always comes, eventually.** That's the contract. A raid costs only **1 tier**, because an elite arrives and ends it. If the crew is [Burned](exposure_and_trust.md#-exposure-bands), nobody comes, and a failed Raid test costs **2 tiers**.

---

## 💧 The Water

Antioch controls the water. Antioch **cuts the water** if:

- the crew is **Burned** (Exposure 10) and the DM decides Antioch wants the lesson learned, or
- the crew or gang **works for another house**.

While the water is cut, Homecoming step 4 costs **1 tier** every time (the crew chooses which), unless the [Cistern](#-projects) covers it.

**The water comes back** when the crew completes a **penance job** (see [Burned](exposure_and_trust.md#-burned)), or when the DM decides Antioch has made its point. When it comes back, the Cistern's count of covered Homecomings starts again from zero.

> 🕵️ **GM only.** Never tell the players whether Antioch cut only their district, or paid the Monarch for a wider cut. The players should never be sure how far Antioch would go.

---

## 📉 Losing Tiers

When the district loses a tier, it's always the **highest** tier of a project (lose Clinic II before Clinic I). Community goes down by 1 for each tier lost.

| Cause | Tiers lost | Who chooses the project |
| :--- | :---: | :--- |
| ❌ Failed Hardship test | 1 | The crew, unless *Sickness* or *Unrest* says otherwise |
| 💧 *Pressure drop*, not paid | 1 more | The crew |
| ❌ Failed Raid test | 1 (2 if Burned) | The DM |
| 🚱 Water cut, not covered | 1 | The crew |

The Pot is never lost. Whatever is in it stays there for rebuilding.

---

## 💀 Collapse

At **Community 0**, the district collapses.

- Families scatter to other gangs. The people from each character's **Ties** are gone: moved away, taken in elsewhere, or worse. The DM decides.
- Downtime **Recovery** removes only **1 wound**, and there are no project benefits.
- There's **no Need** and **no Hardship test**, because there's nothing left to lose. Raids and the water can't take anything either.
- **The crew can rebuild.** Chips sent home still go into the Pot. The first tier costs **10c**, and it can be Tier I of any project.

Collapse isn't the end of the campaign, but it is the end of what the crew was fighting for. The DM should ask the players: **why are you still here?**

---

## 📖 Worked Example

<details open>
<summary><b>Three jobs on Cistern Row</b></summary>

> **Start.** Community **3** (Clinic I, Hall I, and the crew chose Watch I). Need **10c**. Pot **0c**. Exposure 2.

**Job 1: Standard, objective completed (60c)**

| Step | What happens |
| :---: | :--- |
| 1 💧 | Pay the Need: **10c**. 50c left |
| 2 🎲 | Need paid, so no Hardship test |
| 3 🛡️ | Exposure 2, Community 3: no raid due |
| 5 🏺 | The crew sends **30c** home. Pot **30c** |
| 6 🏗️ | Community 4 costs 40c. Not enough yet |
| 7 💰 | Split the last **20c** |

**Job 2: Standard, objective completed (60c)**

| Step | What happens |
| :---: | :--- |
| 1 💧 | Pay the Need: **10c**. 50c left |
| 5 🏺 | The crew sends **10c**. Pot **40c** |
| 6 🏗️ | Enough for Community 4. They build **Clinic II**: Recovery now removes all wounds. Pot **0c**. The Need is still 10c (Struggling) |
| 7 💰 | Split **40c** |

**Job 3: Simple, objective failed (15c, half pay)**

One character badly needs a new rifle. The crew pays only **5c** of the 10c Need and keeps the rest.

| Step | What happens |
| :---: | :--- |
| 1 💧 | **5c** of 10c paid |
| 2 🎲 | **Hardship test.** Paid half (`+1`), Hall I (`+1`) = **`+2`**. 🎲 `3` `2` `2` `1` → keep `3 + 2` = 5. **Fail.** Event: 🎲 **4, Unrest.** The lost tier must be Watch or Hall. They lose **Watch I**. Community **3** |
| 3 🛡️ | Exposure is 2: no raid due. *Next time Exposure is 4+, there's no Watch.* |
| 7 💰 | Split **10c** |

> The ration board burns. Rebuilding Watch I would cost **40c**: four times what the missing 5c would have been.

</details>

---

## ❓ Quick Answers

| Question | Answer |
| :--- | :--- |
| Can we pay the Need from our own chips? | **Yes.** From the pay, the Pot, or characters' chips, in any mix |
| Can we take chips back out of the Pot? | **No.** The Pot belongs to the district. It pays for tiers, the Need and *Pressure drop* |
| Do we have to build as soon as the Pot is full? | **No.** You can save up and build at a later Homecoming |
| Can we build two tiers in one Homecoming? | **Yes**, if the Pot pays for each one in turn |
| We lay low. Is the Need still due? | **Yes.** Pay it from the Pot or your chips, or make the Hardship test |
| Who picks which tier is lost? | The crew, except after a failed **Raid test** (the DM picks) and the *Sickness* and *Unrest* events. See [Losing Tiers](#-losing-tiers) |
| Can more than one thing cost Community in one Homecoming? | **Yes.** A failed Hardship test, a failed Raid test and a water cut can all happen at once |
| Can there be two raids in one Homecoming? | **No.** One Raid check at most |
| When does Help at Home count? | It's taken in downtime and counts at the **next** Homecoming, on both the Hardship test and the Raid test |
| What's the most Community we can have? | **10.** So a district has at most 10 of the 18 tiers |
| Does Debt stack? | **No.** It doubles one Homecoming's Need, once |

---

## ✅ Design Decisions

| # | Question | Ruling |
| :---: | :--- | :--- |
| **1** | What is Community? | 🟡 **Proposed:** 0–10, always equal to the number of project tiers built. Starts at 3. |
| **2** | What happens when chips are sent home? | 🟡 **Proposed:** the Need is paid first. Extra goes into the Pot, and each new tier costs the new Community × 10c. |
| **3** | What happens when they're not? | 🟡 **Proposed:** a Hardship test. Failing triggers an event and loses a tier. |
| **4** | Do raids happen? | 🟡 **Proposed:** when Exposure is 4+, Community is 7+, or the story says so. One Raid check per Homecoming. Antioch always ends them, late. |
| **5** | Way out of the contract | 🟡 **Proposed:** Cistern III removes the water threat. What else a way out needs is a story question for later. |
| **6** | Homecoming order | 🟡 **Proposed:** Need → Hardship → Raids → Water → Pot → Build → Split. Losses come before building. |
| **7** | Can the crew take chips back out of the Pot? | 🟡 **Proposed:** no. The Pot can pay for tiers, the Need and *Pressure drop*, nothing else. |
| **8** | Who chooses lost tiers? | 🟡 **Proposed:** the crew, except for raids (the DM) and the Sickness and Unrest events. Always the highest tier of a project. |
| **9** | How long does Debt last? | 🟡 **Proposed:** one Homecoming. |
| **10** | Does the Cistern's count reset? | 🟡 **Proposed:** yes, each time the water comes back. |

🟡 = proposed, not yet final.

---

<sub>🏠 Last updated 2026-11-02.</sub>
