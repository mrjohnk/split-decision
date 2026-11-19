# Split Decision · First playable specification

> **Amended by the owner's first review, 2026-11-19.** Two things in this planning input were changed after the owner played the first build, and the working specification, `specs/001-loss-budget-game/spec.md`, now governs them (its Clarifications, and decisions D11 and D12):
>
> 1. The game has **one loss window, 8 to 28 dB**, in place of the N1 (14 to 29 dB) and N2 (16 to 31 dB) classes used below. Rounds 2-1, 2-2, 3-1 and 3-2 were re-worked for it, so the hand-worked cases below are the first version's, kept as the record of what was asked at the time.
> 2. The game says **"connector"**, one mated connection on the single fiber, where this file says "connector pair".
>
> **Amended again by the owner's second review, 2026-11-19.** The owner said that 8 and 28 are the ONT's receive levels, and gave the launch power. The game now has a launch power of +5 dBm and a receive window of −28 dBm to −8 dBm, works out a receive level for every ONT, and names its outcomes too-dark, too-bright and dark-and-bright (specification, decisions D13 to D16; constitution 1.2.0). Everything below about loss windows, their limits and the hand-worked numbers is the first version's.
>
> **After the second review, 2026-11-19.** The owner confirmed the launch power, +5 dBm, and kept the loss card as it is (specification, decision D17). The Arcade card image is no longer a screenshot: the game's engine draws it (decision D18, FR-030). Neither changed the game.

## The pitch

**You are the outside-plant designer on a fiber build: choose the split, or the attenuator, so that every ONT on the PON gets neither too little light nor too much.**

The player is an outside-plant designer in the fictional Saguaro Valley fiber build. Each round shows a work order: a small PON drawn from the OLT port to its nearest and farthest ONTs, with fiber lengths, connector pairs, splices, the loss card and the PON's loss window. The round asks the player to pick one design option. A correct decision lights every ONT inside the window and shows the worked loss ledger. An incorrect decision shows which ONT fell outside the window, by how much, and the mistake that usually leads to that choice. The session ends when all six rounds are solved and the session summary is shown.

## Who this is for

- **Learner:** network engineers, sales engineers and students who know IP networking but have not designed the optical plant of a PON.
- **Assumed knowledge:** none about optics. The learner can add decimal numbers.
- **What the briefing teaches:** OLT, ONT, splitter, connector pair, splice and attenuator; the decibel as a loss you add; the loss card; the loss window of a PON class.
- **Why interaction helps:** a loss budget looks like "stay under the maximum". Playing makes three things visible: every small element counts, the farthest ONT sets the limit for everyone on the splitter, and there is also a minimum, because too little loss overloads a receiver.
- **Session target:** 10 to 15 minutes for a first playthrough, with unlimited thinking time.

## Learning outcomes and evidence

| ID | After playing, the learner can… | The game asks them to… | Evidence of success |
| --- | --- | --- | --- |
| LO1 | Calculate one ONT's optical path loss by adding fiber, connector, splice and splitter losses, and compare it with the class maximum | Choose the largest splitter a single path can carry | The largest in-window split is submitted in rounds 1-1 and 1-2 |
| LO2 | Apply the loss window to every ONT on a PON and compare competing designs, including two-stage splits | Choose among single and two-stage splitter designs for a PON with several ONTs | The design that keeps the farthest ONT in the window and serves the most homes is submitted in rounds 2-1 and 2-2 |
| LO3 | Recognize a path with less than the minimum loss and correct it with attenuation in the right place | Choose the attenuator, and where it goes, for PONs with a very short path | The only design that brings every ONT inside the window is submitted in rounds 3-1 and 3-2 |

## The technical model

- **Rule being taught:**
  1. An ONT's optical path loss, in dB, is the sum of every element between the OLT port and that ONT: fiber km × 0.5, connector pairs × 0.5, fusion splices × 0.1, each splitter on the path, and each attenuator on the path.
  2. An ONT is inside the window when its loss is at least the class minimum and at most the class maximum, limits included. N1 is 14 to 29 dB. N2 is 16 to 31 dB. Above the maximum the ONT is "too dark". Below the minimum it is "too bright".
  3. An option is valid when every ONT shown is inside the window.
  4. The answer is the valid option that serves the most homes.
- **Context:** XGS-PON optical distribution network, ITU-T G.9807.1 (02/2023). Loss classes N1 and N2 only.
- **Assumptions:** the loss card is given: fiber 0.5 dB/km; connector pair 0.5 dB; fusion splice 0.1 dB; splitters 1:2 3.5 dB, 1:4 7.0 dB, 1:8 10.5 dB, 1:16 14.0 dB, 1:32 17.5 dB, 1:64 21.0 dB; attenuators at face value. The ONTs shown are the nearest and the farthest on the PON, and every other home lies between them. Each option states how many homes it serves.
- **Excluded behavior:** a real design checks the upstream wavelength (1260 to 1280 nm) and the downstream wavelength (1575 to 1580 nm) separately, because fiber loses more per km upstream; the game uses one fiber value for both. A real budget also reserves margin for repairs and ageing. Transmitter power, receiver sensitivity, reflectance, dispersion, bend loss, splitter port-to-port variation, the other loss classes (B+, C+, E1, E2), the maximum fiber distance, ranging and activation are not modeled.
- **Authoritative references:**

| ID | Reference | Section | Claim it supports |
| --- | --- | --- | --- |
| R1 | ITU-T G.9807.1 (02/2023), XGS-PON. https://www.itu.int/rec/T-REC-G.9807.1-202302-I | Annex B, clause B.6.1, Table B.6.1 | Loss classes: N1 minimum 14 dB and maximum 29 dB; N2 minimum 16 dB and maximum 31 dB. Where an architecture gives less than the class minimum loss, the ODN must add optical attenuators to protect receivers. |
| R2 | ITU-T G.9807.1 (02/2023) | Annex B, clauses B.9.2.6.1 and B.9.2.8.1, Tables B.9.2, B.9.3 and B.9.4 | The attenuation range applies between the OLT and ONU reference points and includes splices, connectors, optical attenuators and other passive devices. Maximum differential optical path loss is 15 dB. Downstream 1575 to 1580 nm, upstream 1260 to 1280 nm. |
| R3 | ITU-T G.652 (08/2024), single-mode fibre and cable. https://www.itu.int/epublications/publication/itu-t-g-652-2024-08-characteristics-of-a-single-mode-optical-fibre-and-cable | Appendix I, Table I.1; clause 8, Table 2, Note 2 | Typical link attenuation is 0.5 dB/km for 1260 to 1360 nm and 0.35 dB/km for 1565 to 1625 nm. G.652.D cable maximum is 0.40 dB/km from 1310 to 1625 nm, plus 0.07 dB/km to extend to 1260 nm. Basis for the 0.5 dB/km planning value and for the one-value simplification. |
| R4 | The FOA Reference Guide, "Guidelines On What Loss To Expect When Testing Fiber Optic Cables". https://www.thefoa.org/tech/loss-est.htm | Connector and splice paragraphs | Typical connector loss is about 0.3 dB; TIA-568 allows up to 0.75 dB per mated pair and 0.3 dB per splice. The 0.5 dB connector planning value sits between typical and maximum. |
| R5 | The FOA Reference Guide, "Using Attenuators With Fiber Optic Data Links". https://www.thefoa.org/tech/ref/appln/attenuators.html | Worked example | A receiver overloads when cable plant loss is below a minimum; an attenuator adds the missing loss. |
| R6 | TEC GR/TX/OPT-001/01/APR-12, generic requirements for optical splitters. https://tec.gov.in/pdf/GRFA/TEC-GR-FA-OPT-001-01-APR-12.pdf | Insertion loss table | One published set of maximum splitter insertion losses: 4.0, 7.1, 10.5, 13.8, 17.1 and 20.5 dB for 1×2 to 1×64. The game's 3.5 dB per two-way split planning rule is within about half a dB of each. |

Tell the learner about these boundaries in plain language. Each round is authored so that exactly one option is valid and serves the most homes. A round with no valid option, or with two valid options that serve the same largest number of homes, is an authoring error: the game shows a content error and does not grade it.

## The repeatable game loop

1. **Brief:** each level opens with a briefing that introduces one concept, its terms, and a worked example with numbers different from the challenges.
2. **Inspect:** the round shows the work order: the PON diagram, a table of each ONT's path (fiber km, connector pairs, splices, installed splitters), the loss card and the class window. Every value needed to decide is visible.
3. **Choose:** the player selects one design option and explicitly submits it.
4. **Explain:** the game shows each ONT's total loss against the window, the worked ledger for the chosen design, and the rule that connects them.
5. **Retry or advance:** a wrong answer leaves the round playable; a correct answer enables Next.
6. **Reflect:** the level summary and the final summary show completed rounds, valid attempts, and assistance used.

**Worked interaction:** Round 1-2, Ocotillo Ranch Road. The work order shows an N1 PON (window 14 to 29 dB) and one ONT, the farthest home, 19.0 km of fiber from the OLT port, with 4 connector pairs and 4 splices on the way. The options are a 1:16, a 1:32 or a 1:64 splitter. A plausible wrong move is 1:32, reasoning "9.5 dB of fiber plus 17.5 dB of splitter is 27.0 dB". The feedback reads: "Too dark at ONT A. 29.4 dB is 0.4 dB over the N1 maximum of 29 dB. Fiber 9.5 + connector pairs 2.0 + splices 0.4 + splitter 17.5 = 29.4 dB. This choice usually comes from leaving out the connectors and splices: without them the path looks like 27.0 dB." The round stays open. The correct move is 1:16: 9.5 + 2.0 + 0.4 + 14.0 = 25.9 dB, inside the window, and no larger option fits.

## Required stories and acceptance criteria

### US1 · Make and understand a decision — P1

As a learner, I want to apply the rule to visible evidence and understand the result.

- **AC1:** Given a fresh session, when I start, then I see the first briefing before answering a challenge.
- **AC2:** Given round 1-1 (Mesquite Lane: N1 window 14 to 29 dB; ONT A with 14.0 km of fiber, 4 connector pairs and 4 splices; options 1:16, 1:32, 1:64), when I submit 1:32, then the round is marked solved, ONT A shows 26.9 dB inside the window, and the explanation shows the ledger 7.0 + 2.0 + 0.4 + 17.5 = 26.9 dB.
- **AC3:** Given that challenge, when I submit 1:64, then feedback says ONT A is too dark, 30.4 dB being 1.4 dB over the 29 dB maximum, completion stays unchanged, and I can retry. When I submit 1:16, then feedback says the design works at 23.4 dB and serves 16 homes, and that a larger option also fits, without naming it; completion stays unchanged, and I can retry.
- **AC4:** Given no selection, when I submit, then input guidance appears and attempts and completion remain unchanged.

### US2 · Learn from help and finish the game — P1

As a learner, I want help when stuck and a clear view of my progress.

- **AC5:** A hint first explains the method. A second hint shows a worked step. Further help can show the worked solution. Assistance is recorded without marking the round complete.
- **AC6:** Each valid submission counts as one attempt until the round is solved. A correct submission completes it once; repeated submission after success has no effect.
- **AC7:** A level completes after both of its rounds are solved. Next opens the following round or the next level's briefing; the final round opens a session summary.
- **AC8:** Restart asks for confirmation, then clears the current session and returns to the first briefing. Cancel preserves the session.

### US3 · Play with accessible controls — P1

As a keyboard user, I want to inspect the challenge, choose, submit, get help, and advance without a mouse.

- **AC9:** All core controls have visible focus and accessible names; keyboard interaction reaches every core action.
- **AC10:** Correct and incorrect feedback includes text, remains available to read, and is announced to assistive technology. Motion can be reduced without losing information.

## Version-one content

**Three levels, two rounds per level, six rounds total.** One new example per round and the same core mechanic throughout: choose one design option for the PON shown.

| Level | New concept | Prerequisite | Misconception to expose |
| --- | --- | --- | --- |
| 1 · Add it up | Path loss is the sum of every element; compare it with the class maximum (LO1) | Adding decimals | "Only the fiber and the splitter matter" |
| 2 · The farthest home sets the limit | The window applies to every ONT; stage losses add (LO2) | Level 1 | "Budget for a typical home", "two small splitters lose less than one big one" |
| 3 · Too much light | The window has a minimum; attenuation fixes it only in the right place (LO3) | Level 2 | "Less loss is always safer", "an attenuator anywhere will do" |

**Progression:** sequential on first playthrough; retry without penalty. Completion requires a correct submission in every round. Hints remain available. No points, lives, timer, leaderboard, or streak mechanic in v1.

**Session behavior:** progress is held for the current page session; reload starts again. Saving across reloads is a stretch feature and must be specified before it is added.

## Cases the implementation must satisfy

These are the hand-worked expected results for every option of every shipped round. They were written before any code existed. All values are in dB. "Before the choice" is the loss from fixed elements only.

### Round 1-1 · Mesquite Lane (N1, 14 to 29)

ONT A, the farthest home: fiber 14.0 km (7.0), 4 connector pairs (2.0), 4 splices (0.4). Before the choice: 9.4.

| Option | Homes | ONT A | Result |
| --- | --- | --- | --- |
| 1:16 splitter (14.0) | 16 | 23.4 inside | Valid, not the most homes: incorrect |
| 1:32 splitter (17.5) | 32 | 26.9 inside | **Correct** |
| 1:64 splitter (21.0) | 64 | 30.4, over by 1.4 | Too dark: incorrect |

### Round 1-2 · Ocotillo Ranch Road (N1, 14 to 29)

ONT A, the farthest home: fiber 19.0 km (9.5), 4 connector pairs (2.0), 4 splices (0.4). Before the choice: 11.9.

| Option | Homes | ONT A | Result |
| --- | --- | --- | --- |
| 1:16 splitter (14.0) | 16 | 25.9 inside | **Correct** |
| 1:32 splitter (17.5) | 32 | 29.4, over by 0.4 | Too dark: incorrect. Without connectors and splices it would look like 27.0 |
| 1:64 splitter (21.0) | 64 | 32.9, over by 3.9 | Too dark: incorrect |

### Round 2-1 · Palo Verde Loop (N2, 16 to 31)

Feeder 10.0 km to one splitter. ONT A, nearest: 10.2 km (5.1), 4 connector pairs (2.0), 3 splices (0.3): 7.4. ONT B: 12.0 km (6.0), 4 pairs (2.0), 4 splices (0.4): 8.4. ONT C, farthest: 16.0 km (8.0), 4 pairs (2.0), 6 splices (0.6): 10.6.

| Option | Homes | ONT A | ONT B | ONT C | Result |
| --- | --- | --- | --- | --- | --- |
| 1:16 splitter (14.0) | 16 | 21.4 | 22.4 | 24.6 | Valid, not the most homes: incorrect |
| 1:32 splitter (17.5) | 32 | 24.9 | 25.9 | 28.1 | **Correct** |
| 1:64 splitter (21.0) | 64 | 28.4 | 29.4 | 31.6, over by 0.6 | Too dark at ONT C: incorrect |

### Round 2-2 · Cholla Crossing (N2, 16 to 31)

Two splitter stages; the second stage is a 1:16 in every option. ONT A, nearest: 8.2 km (4.1), 5 connector pairs (2.5), 4 splices (0.4): 7.0. ONT B, farthest: 9.0 km (4.5), 5 pairs (2.5), 5 splices (0.5): 7.5.

| Option | Homes | Splitters | ONT A | ONT B | Result |
| --- | --- | --- | --- | --- | --- |
| 1:8 then 1:16 | 128 | 10.5 + 14.0 = 24.5 | 31.5, over by 0.5 | 32.0, over by 1.0 | Too dark: incorrect |
| 1:2 then 1:16 | 32 | 3.5 + 14.0 = 17.5 | 24.5 | 25.0 | Valid, not the most homes: incorrect |
| 1:4 then 1:16 | 64 | 7.0 + 14.0 = 21.0 | 28.0 | 28.5 | **Correct** |

### Round 3-1 · Ironwood Court (N1, 14 to 29)

An 8-unit building beside a remote OLT cabinet, with its 1:8 splitter (10.5) already installed. ONT A: 0.2 km (0.1), 3 connector pairs (1.5), 1 splice (0.1), splitter 10.5: 12.2. ONT B: 0.4 km (0.2), 3 pairs (1.5), 1 splice (0.1), splitter 10.5: 12.3. Every option serves 8 homes.

| Option | ONT A | ONT B | Result |
| --- | --- | --- | --- |
| Build it as drawn | 12.2, under by 1.8 | 12.3, under by 1.7 | Too bright: incorrect |
| 1 dB attenuator at the OLT port | 13.2, under by 0.8 | 13.3, under by 0.7 | Too bright: incorrect |
| 5 dB attenuator at the OLT port | 17.2 | 17.3 | **Correct** |
| 20 dB attenuator at the OLT port | 32.2, over by 3.2 | 32.3, over by 3.3 | Too dark: incorrect |

### Round 3-2 · Agave Works (N1, 14 to 29)

A 1:2 first stage. One leg goes straight to a business, ONT A: 4.2 km (2.1), 3 connector pairs (1.5), 2 splices (0.2), splitter 3.5: 7.3. The other leg feeds a 1:32 for 32 homes; ONT B is the farthest: 8.0 km (4.0), 4 pairs (2.0), 4 splices (0.4), splitters 3.5 + 17.5 = 21.0: 27.4. Every option serves 33 customers.

| Option | ONT A | ONT B | Result |
| --- | --- | --- | --- |
| 10 dB attenuator at the OLT port | 17.3 | 37.4, over by 8.4 | Too dark at ONT B: incorrect |
| 10 dB attenuator at ONT A | 17.3 | 27.4 | **Correct** |
| 10 dB attenuator at ONT B | 7.3, under by 6.7 | 37.4, over by 8.4 | Too bright at A and too dark at B: incorrect |
| Build it as drawn | 7.3, under by 6.7 | 27.4 | Too bright at ONT A: incorrect |

### Boundary and unsupported-content cases

| Case | Input state | Player action | Expected result | Why / source |
| --- | --- | --- | --- | --- |
| B1 · At the maximum | N1; one ONT: 18.0 km (9.0), 4 pairs (2.0), 5 splices (0.5); option 1:32 (17.5). Total 29.0 | Submit 1:32 | Inside the window; valid | Limits are included. R1 |
| B2 · Just over | As B1 with 6 splices (0.6). Total 29.1 | Submit 1:32 | Too dark, over by 0.1 | R1 |
| B3 · At the minimum | N1; one ONT: 2.0 km (1.0), 4 pairs (2.0), 5 splices (0.5); installed 1:8 (10.5). Total 14.0 | Submit "build as drawn" | Inside the window; valid | Limits are included. R1 |
| B4 · Just under | As B3 with 4 splices (0.4). Total 13.9 | Submit "build as drawn" | Too bright, under by 0.1 | R1 |
| U1 · No valid option | Every option leaves an ONT outside the window | Open round | Visible content error; no grading or progress | Authoring error, not learner failure |
| U2 · Tie for most homes | Two valid options serve the same largest number of homes | Open round | Visible content error; no grading or progress | The answer would be ambiguous |
| U3 · Unknown component | A splitter ratio or class that is not on the loss card | Open round | Visible content error; no grading or progress | The loss cannot be computed |
| U4 · Inexact value | A length that makes a total that is not exact to 0.1 dB | Open round | Visible content error; no grading or progress | Rounding must never decide an answer |
| U5 · Authored note contradicts the rule | An option's authored explanation is tagged with a different outcome than the evaluator computes | Open round | Visible content error; no grading or progress | Feedback must agree with the evaluator |
| U6 · Broken reference | A briefing cites a source ID that is not defined | Load game | Visible content error; no grading or progress | Every rule needs its source |

## Experience direction

- **Visual metaphor:** light leaves the OLT and dims at each element. A loss trace shows each ONT's light falling along its path, with the loss window marked on the scale, and a meter row for each ONT gives its total and its state. *(Changed on 2026-11-19, during implementation: the first version of this line asked for one light meter with a marker for each ONT. See the plan, "Changes made during implementation".)*
- **One memorable moment:** on Submit, light travels the route and each ONT's marker settles inside the window, short of it (too bright) or past it (too dark).
- **Always visible:** the class window, the loss card, each ONT's fiber km, connector pairs and splices, and the homes each option serves.
- **Feedback voice:** patient and specific; explain the observed choice before offering the next step.
- **Layout:** challenge first, action next, explanation beside or below it. Technical values are never hidden behind hover-only interactions.

## Non-goals

No user accounts, multiplayer, backend, live infrastructure access, runtime AI, leaderboard, or level editor. No simulation of transmitter power, receiver sensitivity, wavelengths, ranging, activation or bandwidth allocation. Visual polish must fit the existing mechanic.

## Decisions recorded for owner review

The owner asked the build agent to make the design calls from the workshop's defaults, record each one, and present them for review with the playable game. Each decision below is open to change by the owner.

| ID | Decision | Reason |
| --- | --- | --- |
| D1 | The game is called Split Decision and is set in the fictional Saguaro Valley | A name that describes the action; a fictional place may illustrate the rule without changing it |
| D2 | Loss card: fiber 0.5 dB/km, connector pair 0.5 dB, splice 0.1 dB, 3.5 dB per two-way split | Easy mental arithmetic; each value is traceable to R3, R4 and R6 |
| D3 | Classes N1 and N2 only | Two windows are enough to show that the window depends on the class |
| D4 | One fiber value for both directions | Halves the arithmetic; the simplification is stated to the player, and a test proves it changes no shipped verdict |
| D5 | No repair or ageing margin | Every number on screen comes from a visible element; the omission is stated |
| D6 | Among valid options the most homes wins; a valid but smaller design is graded incorrect with its own explanation | Gives each round exactly one answer and matches the real question "how far can I split this route?" |
| D7 | The game says ONT; the standard says ONU | ONT is the common word in North American practice; the briefing gives both |
| D8 | Session target 10 to 15 minutes instead of the template's 5 to 10 | Each round asks for arithmetic |
| D9 | Three levels of two rounds, as in the template | Workshop scope |
| D10 | Feedback for a valid but smaller design says that a larger option also fits, and does not name it | A wrong answer should give a next step, not the answer |

## Release evidence

All required acceptance criteria must have a recorded result. All six rounds and their explanations must be checked against the references. A teammate must complete the core flow using only the keyboard. The README must describe implemented behavior, exact run/test commands, and any remaining limits.

---

Adapted from the NAF AC6 workshop StarterKit (`WORKSHOP/LAB/StarterKit/SPEC.md` in [automateyournetwork/NAF_AC6](https://github.com/automateyournetwork/NAF_AC6), Apache-2.0).
