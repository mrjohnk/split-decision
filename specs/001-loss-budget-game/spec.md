# Feature Specification: Split Decision, first playable version

**Feature Branch**: `001-loss-budget-game` (feature directory; work is committed on `main`, no separate branch was created)

**Created**: 2026-11-19

**Status**: Clarified (5 questions, 2026-11-19)

**Input**: User description: "Read `StarterKit/SPEC.md`. Specify this game's first playable version, preserving the learning outcomes, non-goals, and acceptance criteria."

**Source of this specification**: `StarterKit/SPEC.md`, the owner's planning input. This file is the working specification; when the two differ, this file governs and the difference is listed under Clarifications.

## Clarifications

### Session 2026-11-19

The owner chose "build it, I review after": the build agent answered each question below with its
recommended option and recorded it here. Every answer is open to change by the owner.

- Q: When a learner opens the worked solution, must they still submit the answer themselves for the round to count as solved? → A: Yes. The worked solution shows the answer's ledger, the learner still submits, and the round is recorded as solved with the worked solution.
- Q: Does a valid design that is not the answer count as an attempt? → A: Yes. It is a valid submission that is not correct, so it counts as one attempt and gets its own explanation.
- Q: After a round is solved, do the hints and the worked solution stay available for that round? → A: No. The explanation of the correct answer already shows the full ledger, and help taken after solving would distort the assistance record.
- Q: What happens to the previous feedback when the player selects a different option before submitting again? → A: It stays on screen, labeled with the option it describes, until the next submission or screen change.
- Q: How does the session summary describe help, given that hints carry no penalty? → A: Three separate figures for each round (attempts, hints used, worked solution viewed) and two totals: rounds solved without the worked solution, and rounds solved with no help at all. No score, grade or mastery label.

## User Scenarios & Testing *(mandatory)*

The player is an outside-plant designer in the fictional Saguaro Valley fiber build. Each round is a work order: a small passive optical network (PON) drawn from the OLT port to its nearest and farthest ONTs. The player picks one design option. The game shows whether every ONT ends up with the right amount of light, and why.

### User Story 1 - Make and understand a decision (Priority: P1)

As a learner, I want to apply the loss-budget rule to a work order I can see, submit one design, and understand the result.

**Why this priority**: this is the teaching loop. Without it there is no game.

**Independent Test**: play round 1-1 alone. Submit one wrong option and then the correct one, and confirm that each produces the outcome and explanation written in the hand-worked cases.

**Acceptance Scenarios**:

1. **AC1** — **Given** a fresh session, **When** the game starts, **Then** the Level 1 briefing is shown and no challenge can be answered until the player chooses to start the level.
2. **AC2** — **Given** round 1-1 (Mesquite Lane: N1 window 14 to 29 dB; ONT A with 14.0 km of fiber, 4 connector pairs and 4 splices; options 1:16, 1:32, 1:64), **When** the player submits 1:32, **Then** the round is marked solved, ONT A shows 26.9 dB inside the window, and the explanation shows the ledger 7.0 + 2.0 + 0.4 + 17.5 = 26.9 dB.
3. **AC3a** — **Given** round 1-1, **When** the player submits 1:64, **Then** feedback says ONT A is too dark, 30.4 dB being 1.4 dB over the 29 dB maximum, completion stays unchanged, and the player can retry.
4. **AC3b** — **Given** round 1-1, **When** the player submits 1:16, **Then** feedback says the design works at 23.4 dB but 1:32 also fits and serves more homes, completion stays unchanged, and the player can retry.
5. **AC4** — **Given** any open round with no option selected, **When** the player submits, **Then** input guidance appears and attempts and completion remain unchanged.

---

### User Story 2 - Learn from help and finish the game (Priority: P1)

As a learner, I want help when I am stuck and a clear view of my progress.

**Why this priority**: a learner who cannot get unstuck stops learning, and progress that hides the help used would misstate what was learned.

**Independent Test**: in one round, open the first hint, the second hint and the worked solution, then submit the answer twice. Confirm that assistance is recorded, the round completes once, and the summary reports attempts and assistance separately.

**Acceptance Scenarios**:

1. **AC5** — **Given** an open round, **When** the player asks for help, **Then** the first hint explains the method, the second hint shows a worked step, and the worked solution shows the answer's full ledger; each is recorded as assistance and none of them completes the round.
2. **AC6** — **Given** an unsolved round, **When** the player makes valid submissions, **Then** each counts as one attempt until the round is solved; the correct submission completes the round once, and a repeated submission after success changes nothing.
3. **AC7** — **Given** both rounds of a level are solved, **When** the player chooses Next, **Then** the next level's briefing opens with the finished level's summary; within a level Next opens the following round; after the final round Next opens the session summary.
4. **AC8** — **Given** a session in progress, **When** the player chooses Restart, **Then** the game asks for confirmation; confirming clears the session and returns to the first briefing, and cancelling preserves the session exactly.

---

### User Story 3 - Play with accessible controls (Priority: P1)

As a keyboard user, I want to inspect the challenge, choose, submit, get help and advance without a mouse.

**Why this priority**: access is part of the core game (constitution, principle IV).

**Independent Test**: complete the whole game from a fresh start using only the keyboard, then repeat one round with reduced motion requested and in a 320-pixel-wide window.

**Acceptance Scenarios**:

1. **AC9** — **Given** any screen, **When** the player uses only the keyboard, **Then** every core action (start, select, submit, hint, solution, next, restart, confirm, cancel) can be reached and operated, the focused control is visibly marked, and each control has an accessible name.
2. **AC10** — **Given** a submission, **When** feedback appears, **Then** it includes text, stays available to read until the next submission or screen change, and is announced to assistive technology; with reduced motion requested, the same information appears without animation.

---

### Edge Cases

- A path loss exactly equal to a window limit is inside the window (cases B1 and B3).
- A loss 0.1 dB beyond a limit is outside (cases B2 and B4).
- A design can be valid and still not be the answer, because a larger valid design exists (rounds 1-1, 2-1, 2-2).
- One design can leave one ONT too bright and another too dark at the same time (round 3-2, attenuator at ONT B).
- Submitting with nothing selected never counts as an attempt.
- Submitting again after the round is solved changes nothing.
- Help opens only in sequence: hint 1, then hint 2, then the worked solution. It is unavailable once the round is solved.
- After the worked solution has been viewed, the round still needs a correct submission and is recorded as solved with the worked solution.
- Content that cannot be graded (cases U1 to U6) is reported as a content error and is never shown as a challenge.
- Reloading the page starts a fresh session.

## Requirements *(mandatory)*

### Functional Requirements

**Briefing and challenge**

- **FR-001**: The game MUST open a fresh session on the Level 1 briefing, and MUST NOT accept an answer before the player starts the level. *(AC1)*
- **FR-002**: Each level MUST open with a briefing that names the level's concept, defines its new terms and shows a worked example whose numbers differ from every challenge.
- **FR-003**: Each round MUST show the PON diagram, a table of each ONT's path (fiber km, connector pairs, splices, installed splitters), the loss card, the class window, the goal, and every option with the number of homes it serves.
- **FR-004**: The player MUST be able to reopen the current level's briefing during a round without changing attempts, assistance or completion.
- **FR-005**: The player MUST select exactly one option and submit it explicitly. Selecting an option MUST NOT grade it.

**The rule**

- **FR-006**: The game MUST compute each ONT's optical path loss as the sum of the losses of every element on its path: fiber km × the card's fiber value, connector pairs × the card's connector value, splices × the card's splice value, each splitter at the card's value for its ratio, and each attenuator at face value. Totals MUST be exact to 0.1 dB.
- **FR-007**: The game MUST class each ONT as inside the window (minimum ≤ loss ≤ maximum), too dark (loss above the maximum) or too bright (loss below the minimum).
- **FR-008**: An option MUST be treated as valid only when every ONT in the round is inside the window. The answer to a round MUST be the valid option that serves the most homes.

**Feedback and progress**

- **FR-009**: On the correct submission the game MUST mark the round solved once, show every ONT's total against the window, show the worked ledger, explain why the design works, and enable Next. *(AC2)*
- **FR-010**: On an incorrect submission the game MUST name each ONT that is outside the window, its loss, the limit it missed and the difference; show the worked ledger; give the mistake that usually leads to that choice; and leave the round open with completion unchanged. *(AC3a)*
- **FR-011**: A valid design that is not the answer MUST get its own explanation, naming the larger valid design and the homes each serves. *(AC3b)*
- **FR-012**: Submitting with no option selected MUST show input guidance and MUST NOT change attempts or completion. *(AC4)*
- **FR-013**: Each valid submission in an unsolved round MUST count as one attempt, including a valid design that is not the answer. After a round is solved, further submissions MUST have no effect. *(AC6)*
- **FR-014**: Help MUST be offered in order: hint 1 (the method), hint 2 (a worked step), then the worked solution (the answer's full ledger). Each MUST be recorded as assistance for that round and MUST NOT complete the round: after viewing the worked solution the player MUST still submit the answer, and the round is then recorded as solved with the worked solution. Once a round is solved, its hints and worked solution MUST be unavailable. *(AC5)*
- **FR-015**: A level MUST complete when both of its rounds are solved. Next MUST open the following round, or the next level's briefing together with the finished level's summary, or the session summary after the final round. *(AC7)*
- **FR-016**: Level and session summaries MUST show completed rounds, attempts, hints used and worked solutions viewed as separate figures. The session summary MUST list those three figures for each round and MUST state two totals: rounds solved without the worked solution, and rounds solved with no help at all. It MUST NOT show a score, a grade or a mastery label.
- **FR-017**: Restart MUST ask for confirmation. Confirming MUST clear the session and return to the first briefing. Cancelling MUST leave the session unchanged. *(AC8)*
- **FR-018**: Progress MUST be held for the current page session only. Reloading the page MUST start a fresh session.

**Content integrity**

- **FR-019**: The game MUST validate all content before play. When any content cannot be graded (cases U1 to U6), the game MUST show a content error that names the level and round, and MUST NOT present or grade any challenge.
- **FR-020**: An authored explanation attached to an option MUST be rejected at validation when the outcome it was written for differs from the outcome the rule gives for that option.
- **FR-021**: Each briefing MUST cite its sources by title and section, and the list of sources MUST be available to the player.
- **FR-022**: The simplifications of the model MUST be stated to the player in plain language, in the briefings and in a panel available at any time.

**Access and delivery**

- **FR-023**: Every core action MUST be operable from the keyboard, with a visible focus mark and an accessible name. *(AC9)*
- **FR-024**: Feedback MUST be text, MUST name the option it describes, MUST stay on screen until the next submission or screen change (selecting a different option does not remove it), and MUST be announced to assistive technology. *(AC10)*
- **FR-025**: When reduced motion is requested, feedback and controls MUST appear without animation and with no loss of information. Animation MUST NOT delay feedback or controls in any mode.
- **FR-026**: Inside the window, too dark and too bright MUST each be written in words and marked with a distinct shape; color MUST NOT be the only signal.
- **FR-027**: In a window 320 CSS pixels wide the round MUST remain usable: dense tables MAY scroll inside their own labeled container, and the action buttons MUST be reachable without scrolling the page sideways.
- **FR-028**: The game MUST play from its own static files only. It MUST NOT need an account, a backend, a live device, a model or an API key, and MUST NOT request anything from another origin.

### Key Entities

- **Loss card**: the planning loss of each kind of element: fiber per km, connector pair, fusion splice, and each splitter ratio.
- **Loss class**: a named window with a minimum and a maximum optical path loss (N1, N2).
- **Plant**: the PON of a round: the OLT port, fiber segments with their connector pairs and splices, splitters (installed, or left open for the option to choose) and ONTs.
- **Option**: one design the player can choose: the ratios of the open splitters, the attenuators and where they sit, and the number of homes served.
- **Round**: a work order: a class, a plant, a goal, its options, its hints and its explanations.
- **Level**: a briefing and two rounds that share one concept and one learning outcome.
- **Source**: a reference with a title, a link, a section and the claim it supports.
- **Evaluation**: for one option, each ONT's ledger, total and state, whether the option is valid, and its outcome against the round's answer.
- **Session**: the current screen, and for each round the attempts, the assistance used and whether it is solved.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 20 option outcomes of the six rounds and all 4 boundary cases match the hand-worked results in this specification.
- **SC-002**: Every incorrect submission shows an explanation that names the ONT, its loss, the limit and the difference.
- **SC-003**: A player can complete the game from a fresh start to the session summary using only the keyboard.
- **SC-004**: A first-time player completes the game in 10 to 15 minutes. *(Needs a person; not measured by the build.)*
- **SC-005**: None of the six unsupported-content cases (U1 to U6) can be opened as a challenge or graded.
- **SC-006**: With reduced motion requested, the feedback text is readable as soon as a submission is made.
- **SC-007**: At a width of 320 CSS pixels, Submit, Hint and Next can be reached without scrolling the page sideways.
- **SC-008**: After playing, a teammate can say what each of the three levels taught and what a deliberately wrong choice showed them. *(Needs a person.)*
- **SC-009**: During a full playthrough no request leaves the game's own origin.

## Assumptions

- Players use a current desktop or laptop browser; a phone-width window is supported for layout, without touch-specific gestures.
- The game is in English and uses kilometres and decibels to one decimal place.
- The ONTs shown in a round are the nearest and the farthest on that PON, and every other home lies between them.
- "Homes served" counts customer ports. In round 3-2 one of the 33 is a business.
- The loss card is given to the player as the job's planning values. It is not derived from a measurement.
- Developer tooling (a terminal test run, an independent answer-key check, a browser automation run) is not needed to play.

## Learning Outcomes

| ID | After playing, the learner can… | The game asks them to… | Evidence of success |
| --- | --- | --- | --- |
| LO1 | Calculate one ONT's optical path loss by adding fiber, connector, splice and splitter losses, and compare it with the class maximum | Choose the largest splitter a single path can carry | The largest in-window split is submitted in rounds 1-1 and 1-2 |
| LO2 | Apply the loss window to every ONT on a PON and compare competing designs, including two-stage splits | Choose among single and two-stage splitter designs for a PON with several ONTs | The design that keeps the farthest ONT in the window and serves the most homes is submitted in rounds 2-1 and 2-2 |
| LO3 | Recognize a path with less than the minimum loss and correct it with attenuation in the right place | Choose the attenuator, and where it goes, for PONs with a very short path | The only design that brings every ONT inside the window is submitted in rounds 3-1 and 3-2 |

## Technical Model

1. An ONT's optical path loss, in dB, is the sum of every element between the OLT port and that ONT: fiber km × 0.5, connector pairs × 0.5, fusion splices × 0.1, each splitter on the path, and each attenuator on the path.
2. An ONT is inside the window when its loss is at least the class minimum and at most the class maximum, limits included. N1 is 14 to 29 dB. N2 is 16 to 31 dB. Above the maximum the ONT is "too dark". Below the minimum it is "too bright".
3. An option is valid when every ONT shown is inside the window.
4. The answer is the valid option that serves the most homes.

**Loss card**: fiber 0.5 dB/km; connector pair 0.5 dB; fusion splice 0.1 dB; splitters 1:2 3.5 dB, 1:4 7.0 dB, 1:8 10.5 dB, 1:16 14.0 dB, 1:32 17.5 dB, 1:64 21.0 dB; attenuators at face value.

**Outside the model**: a real design checks the upstream wavelength (1260 to 1280 nm) and the downstream wavelength (1575 to 1580 nm) separately, because fiber loses more per km upstream; the game uses one fiber value for both. A real budget also reserves margin for repairs and ageing. Transmitter power, receiver sensitivity, reflectance, dispersion, bend loss, splitter port-to-port variation, the other loss classes (B+, C+, E1, E2), the maximum fiber distance, ranging and activation are not modeled.

### References

| ID | Reference | Section | Claim it supports |
| --- | --- | --- | --- |
| R1 | ITU-T G.9807.1 (02/2023), XGS-PON. https://www.itu.int/rec/T-REC-G.9807.1-202302-I | Annex B, clause B.6.1, Table B.6.1 | Loss classes: N1 minimum 14 dB and maximum 29 dB; N2 minimum 16 dB and maximum 31 dB. Where an architecture gives less than the class minimum loss, the ODN must add optical attenuators to protect receivers. |
| R2 | ITU-T G.9807.1 (02/2023) | Annex B, clauses B.9.2.6.1 and B.9.2.8.1, Tables B.9.2, B.9.3 and B.9.4 | The attenuation range applies between the OLT and ONU reference points and includes splices, connectors, optical attenuators and other passive devices. Maximum differential optical path loss is 15 dB. Downstream 1575 to 1580 nm, upstream 1260 to 1280 nm. |
| R3 | ITU-T G.652 (08/2024), single-mode fibre and cable. https://www.itu.int/epublications/publication/itu-t-g-652-2024-08-characteristics-of-a-single-mode-optical-fibre-and-cable | Appendix I, Table I.1; clause 8, Table 2, Note 2 | Typical link attenuation is 0.5 dB/km for 1260 to 1360 nm and 0.35 dB/km for 1565 to 1625 nm. G.652.D cable maximum is 0.40 dB/km from 1310 to 1625 nm, plus 0.07 dB/km to extend to 1260 nm. |
| R4 | The FOA Reference Guide, "Guidelines On What Loss To Expect When Testing Fiber Optic Cables". https://www.thefoa.org/tech/loss-est.htm | Connector and splice paragraphs | Typical connector loss is about 0.3 dB; TIA-568 allows up to 0.75 dB per mated pair and 0.3 dB per splice. |
| R5 | The FOA Reference Guide, "Using Attenuators With Fiber Optic Data Links". https://www.thefoa.org/tech/ref/appln/attenuators.html | Worked example | A receiver overloads when cable plant loss is below a minimum; an attenuator adds the missing loss. |
| R6 | TEC GR/TX/OPT-001/01/APR-12, generic requirements for optical splitters. https://tec.gov.in/pdf/GRFA/TEC-GR-FA-OPT-001-01-APR-12.pdf | Insertion loss table | One published set of maximum splitter insertion losses: 4.0, 7.1, 10.5, 13.8, 17.1 and 20.5 dB for 1×2 to 1×64. |

## Version-one Content

Three levels, two rounds per level, six rounds in all. One new example per round and the same mechanic throughout: choose one design option for the PON shown.

| Level | Rounds | New concept | Misconception to expose |
| --- | --- | --- | --- |
| 1 · Add it up (LO1) | 1-1 Mesquite Lane, 1-2 Ocotillo Ranch Road | Path loss is the sum of every element; compare it with the class maximum | "Only the fiber and the splitter matter" |
| 2 · The farthest home sets the limit (LO2) | 2-1 Palo Verde Loop, 2-2 Cholla Crossing | The window applies to every ONT; stage losses add | "Budget for a typical home", "two small splitters lose less than one big one" |
| 3 · Too much light (LO3) | 3-1 Ironwood Court, 3-2 Agave Works | The window has a minimum; attenuation fixes it only in the right place | "Less loss is always safer", "an attenuator anywhere will do" |

Progression is sequential. Retry has no penalty. Completion requires a correct submission in every round. Hints stay available. There are no points, lives, timer, leaderboard or streaks.

## Hand-worked Cases

These expected results were written before any code existed. All values are in dB. "Before the choice" is the loss from fixed elements only. Case IDs are `round/option`.

### Round 1-1 · Mesquite Lane (N1, 14 to 29)

Plant: OLT port → 13.0 km, 2 connector pairs, 3 splices → splitter (chosen) → 1.0 km, 2 connector pairs, 1 splice → ONT A, the farthest home.
ONT A: fiber 14.0 km (7.0), 4 connector pairs (2.0), 4 splices (0.4). Before the choice: 9.4.

| Case | Option | Homes | ONT A | Outcome |
| --- | --- | --- | --- | --- |
| r1-1/o16 | 1:16 splitter (14.0) | 16 | 23.4 inside | valid-not-best |
| r1-1/o32 | 1:32 splitter (17.5) | 32 | 26.9 inside | **best-valid (answer)** |
| r1-1/o64 | 1:64 splitter (21.0) | 64 | 30.4, over by 1.4 | over-max |

### Round 1-2 · Ocotillo Ranch Road (N1, 14 to 29)

Plant: OLT port → 18.0 km, 2 connector pairs, 3 splices → splitter (chosen) → 1.0 km, 2 connector pairs, 1 splice → ONT A, the farthest home.
ONT A: fiber 19.0 km (9.5), 4 connector pairs (2.0), 4 splices (0.4). Before the choice: 11.9.

| Case | Option | Homes | ONT A | Outcome |
| --- | --- | --- | --- | --- |
| r1-2/o16 | 1:16 splitter (14.0) | 16 | 25.9 inside | **best-valid (answer)** |
| r1-2/o32 | 1:32 splitter (17.5) | 32 | 29.4, over by 0.4 | over-max. Without connectors and splices it would look like 27.0 |
| r1-2/o64 | 1:64 splitter (21.0) | 64 | 32.9, over by 3.9 | over-max |

### Round 2-1 · Palo Verde Loop (N2, 16 to 31)

Plant: OLT port → 10.0 km, 2 connector pairs, 2 splices → splitter (chosen) → three drops. ONT A, nearest: 0.2 km, 2 pairs, 1 splice. ONT B: 2.0 km, 2 pairs, 2 splices. ONT C, farthest: 6.0 km, 2 pairs, 4 splices.
ONT A: 10.2 km (5.1), 4 pairs (2.0), 3 splices (0.3): 7.4. ONT B: 12.0 km (6.0), 4 pairs (2.0), 4 splices (0.4): 8.4. ONT C: 16.0 km (8.0), 4 pairs (2.0), 6 splices (0.6): 10.6.

| Case | Option | Homes | ONT A | ONT B | ONT C | Outcome |
| --- | --- | --- | --- | --- | --- | --- |
| r2-1/o16 | 1:16 splitter (14.0) | 16 | 21.4 | 22.4 | 24.6 | valid-not-best |
| r2-1/o32 | 1:32 splitter (17.5) | 32 | 24.9 | 25.9 | 28.1 | **best-valid (answer)** |
| r2-1/o64 | 1:64 splitter (21.0) | 64 | 28.4 | 29.4 | 31.6, over by 0.6 | over-max at ONT C |

### Round 2-2 · Cholla Crossing (N2, 16 to 31)

Plant: OLT port → 6.0 km, 2 connector pairs, 2 splices → first-stage splitter (chosen) → 2.0 km, 1 pair, 1 splice → second-stage 1:16 splitter (installed) → two drops. ONT A, nearest: 0.2 km, 2 pairs, 1 splice. ONT B, farthest: 1.0 km, 2 pairs, 2 splices.
ONT A: 8.2 km (4.1), 5 pairs (2.5), 4 splices (0.4): 7.0 before any splitter. ONT B: 9.0 km (4.5), 5 pairs (2.5), 5 splices (0.5): 7.5 before any splitter.

| Case | Option | Homes | Splitters | ONT A | ONT B | Outcome |
| --- | --- | --- | --- | --- | --- | --- |
| r2-2/c8x16 | 1:8 then 1:16 | 128 | 10.5 + 14.0 = 24.5 | 31.5, over by 0.5 | 32.0, over by 1.0 | over-max |
| r2-2/c2x16 | 1:2 then 1:16 | 32 | 3.5 + 14.0 = 17.5 | 24.5 | 25.0 | valid-not-best |
| r2-2/c4x16 | 1:4 then 1:16 | 64 | 7.0 + 14.0 = 21.0 | 28.0 | 28.5 | **best-valid (answer)** |

### Round 3-1 · Ironwood Court (N1, 14 to 29)

Plant: remote OLT port → 0.2 km, 2 connector pairs, 1 splice → installed 1:8 splitter (10.5) → ONT A: 0.0 km, 1 pair, 0 splices; ONT B: 0.2 km, 1 pair, 0 splices. An 8-unit building; every option serves 8 homes.
ONT A: 0.2 km (0.1), 3 pairs (1.5), 1 splice (0.1), splitter 10.5: 12.2. ONT B: 0.4 km (0.2), 3 pairs (1.5), 1 splice (0.1), splitter 10.5: 12.3.

| Case | Option | ONT A | ONT B | Outcome |
| --- | --- | --- | --- | --- |
| r3-1/none | Build it as drawn | 12.2, under by 1.8 | 12.3, under by 1.7 | under-min |
| r3-1/a1 | 1 dB attenuator at the OLT port | 13.2, under by 0.8 | 13.3, under by 0.7 | under-min |
| r3-1/a5 | 5 dB attenuator at the OLT port | 17.2 | 17.3 | **best-valid (answer)** |
| r3-1/a20 | 20 dB attenuator at the OLT port | 32.2, over by 3.2 | 32.3, over by 3.3 | over-max |

### Round 3-2 · Agave Works (N1, 14 to 29)

Plant: OLT port → 4.0 km, 2 connector pairs, 2 splices → installed 1:2 splitter (3.5). Leg one → 0.2 km, 1 pair, 0 splices → ONT A, a business. Leg two → 3.0 km, 1 pair, 1 splice → installed 1:32 splitter (17.5) → 1.0 km, 1 pair, 1 splice → ONT B, the farthest of 32 homes. Every option serves 33 customers.
ONT A: 4.2 km (2.1), 3 pairs (1.5), 2 splices (0.2), splitter 3.5: 7.3. ONT B: 8.0 km (4.0), 4 pairs (2.0), 4 splices (0.4), splitters 3.5 + 17.5 = 21.0: 27.4.

| Case | Option | ONT A | ONT B | Outcome |
| --- | --- | --- | --- | --- |
| r3-2/olt10 | 10 dB attenuator at the OLT port | 17.3 | 37.4, over by 8.4 | over-max at ONT B |
| r3-2/ontA10 | 10 dB attenuator at ONT A | 17.3 | 27.4 | **best-valid (answer)** |
| r3-2/ontB10 | 10 dB attenuator at ONT B | 7.3, under by 6.7 | 37.4, over by 8.4 | over-and-under |
| r3-2/none | Build it as drawn | 7.3, under by 6.7 | 27.4 | under-min at ONT A |

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
| U5 · Authored note contradicts the rule | An option's authored explanation is tagged with a different outcome than the rule gives | Open round | Visible content error; no grading or progress | Feedback must agree with the evaluator |
| U6 · Broken reference | A briefing cites a source ID that is not defined | Load game | Visible content error; no grading or progress | Every rule needs its source |

## Out of Scope

No user accounts, multiplayer, backend, live infrastructure access, runtime AI, leaderboard or level editor. No saving across reloads. No simulation of transmitter power, receiver sensitivity, wavelengths, ranging, activation or bandwidth allocation. No audio. Visual polish must fit the existing mechanic.

## Decisions Recorded for Owner Review

The owner asked the build agent to make the design calls from the workshop's defaults, record each one, and present them for review with the playable game. Each decision is open to change by the owner.

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
