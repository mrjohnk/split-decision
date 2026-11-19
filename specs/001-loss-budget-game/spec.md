# Feature Specification: Split Decision, first playable version

**Feature Branch**: `001-loss-budget-game` (feature directory; work is committed on `main`, no separate branch was created)

**Created**: 2026-11-19

**Status**: Clarified (5 questions, 2026-11-19). Amended after the owner's first review (2 changes, 2026-11-19) and second review (the window is the ONT's receive level, with a launch power; 2026-11-19)

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

### Session 2026-11-19, the owner's first review

The owner played the first playable build and sent two changes. They are requirements changes, so they were made here first, then in the hand-worked cases, then in the content and the code.

- Q: Which loss window should the game use? → A (owner): use 8 dB and 28 dB as the limits, which is closer to what he has seen in the field. Applied as decision D11: one loss window, 8 to 28 dB, for all six rounds. It replaces the two classes of the first version (N1, 14 to 29 dB, and N2, 16 to 31 dB). The game presents it as the designer's planning window, taken from the owner's field experience, and does not call it a class of the standard; the standard's classes stay in the reference list so that nobody takes the game's window for a quotation of ITU-T G.9807.1. Rounds 2-1, 2-2, 3-1 and 3-2 and the worked examples of levels 2 and 3 were re-worked by hand so that each round still has exactly one answer.
- Open point for the owner, recorded by the build agent (closed by the second review, below): 8 and 28 are also the usual limits of an ONT's receive level, −8 to −28 dBm. The game measures path loss in dB, and the numbers were applied as loss limits, as written. If receive level was meant, the game would need a launch power on the loss card and would show dBm at each ONT.
- Q: Does "connector pair" read as two fibers? → A (owner): it can. A PON has one fiber to each ONT, the connection at the ONT included. Applied as decision D12: the game says "connector", meaning one mated connection on the single fiber (where two fiber ends plug together in an adapter), and the first briefing states that a PON runs on one fiber, with both directions on the same strand.

### Session 2026-11-19, the owner's second review

The build agent had recorded an open point: 8 and 28 could be path loss or receive level. The owner settled it, and then gave the launch power. Both are requirements changes, so they were made here first, then in the hand-worked cases, then in the tests, the content and the code.

- Q: Are 8 and 28 path loss in dB, or the ONT's receive level in dBm? → A (owner): the two figures are the ONT's receive levels. Applied as decision D13: the game's window is the level of light an ONT receives, −28 dBm to −8 dBm, limits included. It replaces the reading of D11 as a path-loss window. The game now works out a receive level for every ONT, launch power less path loss, and shows it in dBm.
- Q: What is the OLT's launch power? → A (owner): first he left the choice of a sensible value to the build agent; then he gave a five with a hyphen in front. Applied as decision D14: +5 dBm. The build agent read the hyphen as a dash and the value as plus five: +5 dBm is the top of the launch range that ITU-T G.9807.1 gives an N1 OLT (+2 to +5 dBm, reference R8) and lies inside the N2 range (+4 to +7 dBm), while −5 dBm is 7 dB below the weakest transmitter the standard allows and would leave 3 to 23 dB of usable path loss: no 1:64 design, and no path behind a splitter that could be too bright. **Open point for the owner: confirm the sign.** (Closed by his answer in the next session: plus five.)
- What followed from the two answers, worked through by the build agent: the usable path loss is now 13 to 33 dB (5 − (−8) and 5 − (−28)), so all six rounds, the three worked examples and the four boundary cases were re-worked by hand. Round 1-2 has a new lesson, because with this budget a 1:32 splitter reaches any route within 20 km and the first version's "only a 1:16 fits" cannot happen (decision D16). The outcome codes were renamed from the loss wording (over-max, under-min, over-and-under) to too-dark, too-bright and dark-and-bright, and the ONT states from over and under to dark and bright, because a receive level that is too dark is *under* its limit (decision D15).
- Left as it was, and stated to the player: the loss card. Its fiber value, 0.5 dB/km, is the figure for the upstream wavelength. The light an ONT receives travels at the downstream wavelength, where fiber loses less per km (reference R3), so on a long route the game reads a little darker than a real ONT would (decision D4, restated). Open to the owner, like the rest of the loss card. (Answered in the next session: kept, decision D17.)

### Session 2026-11-19, the owner's answers after the second review

The second review left two points with the owner. The build agent put them to him as two numbered questions, and he answered both in one message, with a question of his own about the Arcade card. Neither answer changes the game, and neither does the card: the files the game is played from are as they were after the second review. The answers close open points, so they are recorded here first and then in every document that had called the points open.

- Q: Is the launch power plus five or minus five? → A (owner): plus five is right. Decision D14 stands as it was applied, +5 dBm, and its open point is closed.
- Q: The loss card's fiber value, 0.5 dB/km, is the upstream figure, and the answers of rounds 1-1 and 2-1 rest on it. Keep it as a conservative planning number, or use the value you plan with? → A (owner): keep the card as it is. Applied as decision D17: the loss card stays as it is. The question was about the fiber value. The build agent takes his plural to cover the card as it stands, and notes that the connector, splice and splitter values were not put to him one by one.
- The owner asked to see the card image beside the other cards in the Arcade. → A (build agent): yes, and it compared badly. Beside the 13 of the Arcade's 17 cards that could be obtained (research R-12) it was the plainest: a screenshot of a whole work order, with no word on it large enough to read at the size the Arcade shows a card. The owner had said of the Arcade earlier that the plan need not change unless the other games gave a reason to do better. Applied as decision D18 and requirement FR-030: the card is a drawing made for its purpose by the game's own engine. Which card ships remains the owner's choice, so the screenshot stays in the repository as `docs/gameplay.png`, which meets the Arcade's rules for a card as well.
- Later the same afternoon the owner asked whether the game can be played on an Android phone. → A (build agent): it should, but until then the page had only been tried at phone widths in a desktop browser, with a mouse. No requirement changed: FR-027 already asks for a page that stays usable in a narrow window. A browser check, `TOUCH`, now plays the whole game with taps in an emulated phone, upright and on its side. A real phone is still untried, and the owner is the first person in a position to try one.

### Session 2026-11-19, the owner's go-ahead

The owner tried the review copy and reported that it worked well for him, with no fault. He did not say how long it took or whether he finished every work order, so SC-004 and SC-008 stay open. He then decided the following.

- The game is to be made public and shared with his coworkers for a second look. The Arcade's consent flag is set on that instruction.
- He approved the drawn card (decision D18 stands).
- Creator: John Kicklighter. This is not his first spec-driven project.
- His messages are not to be quoted. Applied as decision D19.

## User Scenarios & Testing *(mandatory)*

The player is an outside-plant designer in the fictional Saguaro Valley fiber build. Each round is a work order: a small passive optical network (PON) drawn from the OLT port to its nearest and farthest ONTs. The player picks one design option. The game shows whether every ONT ends up with the right amount of light, and why.

### User Story 1 - Make and understand a decision (Priority: P1)

As a learner, I want to apply the loss-budget rule to a work order I can see, submit one design, and understand the result.

**Why this priority**: this is the teaching loop. Without it there is no game.

**Independent Test**: play round 1-1 alone. Submit one wrong option and then the correct one, and confirm that each produces the outcome and explanation written in the hand-worked cases.

**Acceptance Scenarios**:

1. **AC1** — **Given** a fresh session, **When** the game starts, **Then** the Level 1 briefing is shown and no challenge can be answered until the player chooses to start the level.
2. **AC2** — **Given** round 1-1 (Mesquite Lane: launch power +5 dBm, receive window −28 to −8 dBm; ONT A with 18.0 km of fiber, 7 connectors and 7 splices; options 1:16, 1:32, 1:64), **When** the player submits 1:32, **Then** the round is marked solved, ONT A shows a loss of 30.7 dB and a receive level of −25.7 dBm inside the window, and the explanation shows the ledger 9.0 + 3.5 + 0.7 + 17.5 = 30.7 dB and the level +5 dBm − 30.7 dB = −25.7 dBm.
3. **AC3a** — **Given** round 1-1, **When** the player submits 1:64, **Then** feedback says ONT A is too dark: it loses 34.2 dB and receives −29.2 dBm, 1.2 dB below the dark limit of −28 dBm; completion stays unchanged, and the player can retry.
4. **AC3b** — **Given** round 1-1, **When** the player submits 1:16, **Then** feedback says the design works, with ONT A receiving −22.2 dBm, and serves 16 homes, and that a larger option also fits, without naming it; completion stays unchanged, and the player can retry.
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

- A receive level exactly equal to a limit of the window is inside the window (cases B1 and B3).
- A receive level 0.1 dB beyond a limit is outside (cases B2 and B4).
- A design can be valid and still not be the answer, because a larger valid design exists (rounds 1-1, 1-2, 2-1, 2-2).
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
- **FR-003**: Each round MUST show the PON diagram, a table of each ONT's path (fiber km, connectors, splices, installed splitters), the loss card, the launch power, the receive window, the goal, and every option with the number of homes it serves.
- **FR-004**: The player MUST be able to reopen the current level's briefing during a round without changing attempts, assistance or completion.
- **FR-005**: The player MUST select exactly one option and submit it explicitly. Selecting an option MUST NOT grade it.

**The rule**

- **FR-006**: The game MUST compute each ONT's optical path loss as the sum of the losses of every element on its path: fiber km × the card's fiber value, connectors × the card's connector value, splices × the card's splice value, each splitter at the card's value for its ratio, and each attenuator at face value. Totals MUST be exact to 0.1 dB.
- **FR-007**: The game MUST class each ONT as inside the window (dark limit ≤ receive level ≤ bright limit), too dark (receive level below the dark limit) or too bright (receive level above the bright limit).
- **FR-029** *(added by decision D13)*: The game MUST compute each ONT's receive level as the launch power less its optical path loss, and MUST show it in dBm, exact to 0.1 dB, with its sign.
- **FR-008**: An option MUST be treated as valid only when every ONT in the round is inside the window. The answer to a round MUST be the valid option that serves the most homes.

**Feedback and progress**

- **FR-009**: On the correct submission the game MUST mark the round solved once, show every ONT's loss and receive level against the window, show the worked ledger, explain why the design works, and enable Next. *(AC2)*
- **FR-010**: On an incorrect submission the game MUST name each ONT that is outside the window, its loss, its receive level, the limit it missed and the difference; show the worked ledger; give the mistake that usually leads to that choice; suggest a next step; and leave the round open with completion unchanged. *(AC3a)*
- **FR-011**: A valid design that is not the answer MUST get its own explanation: every ONT is inside the window, the design serves the stated number of homes, and at least one larger option also fits. The explanation MUST NOT name the answer. *(AC3b)*
- **FR-012**: Submitting with no option selected MUST show input guidance and MUST NOT change attempts or completion. *(AC4)*
- **FR-013**: Each valid submission in an unsolved round MUST count as one attempt, including a valid design that is not the answer. After a round is solved, further submissions MUST have no effect. *(AC6)*
- **FR-014**: Help MUST be offered in order: hint 1 (the method), hint 2 (a worked step), then the worked solution (the answer's full ledger). Each MUST be recorded as assistance for that round and MUST NOT complete the round: after viewing the worked solution the player MUST still submit the answer, and the round is then recorded as solved with the worked solution. Once a round is solved, its hints and worked solution MUST be unavailable. *(AC5)*
- **FR-015**: A level MUST complete when both of its rounds are solved. Next MUST open the following round, or the next level's briefing together with the finished level's summary, or the session summary after the final round. *(AC7)*
- **FR-016**: Level and session summaries MUST show completed rounds, attempts, hints used and worked solutions viewed as separate figures. The session summary MUST list those three figures for each round and MUST state two totals: rounds solved without the worked solution, and rounds solved with no help at all. It MUST NOT show a score, a grade or a mastery label.
- **FR-017**: Restart MUST ask for confirmation. Confirming MUST clear the session and return to the first briefing. Cancelling MUST leave the session unchanged. *(AC8)*
- **FR-018**: Progress MUST be held for the current page session only. Reloading the page MUST start a fresh session.

**Content integrity**

- **FR-019**: The game MUST validate all content before play. When any content cannot be graded (cases U1 to U6), the game MUST show a content error that names the level and round, and MUST NOT present or grade any challenge.
- **FR-020**: Every option that is not the round's answer MUST carry an authored explanation of the mistake that usually leads to it. Validation MUST reject an option that lacks one, and MUST reject an authored explanation when the outcome it was written for differs from the outcome the rule gives for that option.
- **FR-021**: Each briefing MUST cite its sources by title and section, and the list of sources MUST be available to the player.
- **FR-022**: The simplifications of the model MUST be stated to the player in plain language, in the briefings and in a panel available at any time.

**Access and delivery**

- **FR-023**: Every core action MUST be operable from the keyboard, with a visible focus mark and an accessible name. *(AC9)*
- **FR-024**: Feedback MUST be text, MUST name the option it describes, MUST stay on screen until the next submission or screen change (selecting a different option does not remove it), and MUST be announced to assistive technology. *(AC10)*
- **FR-025**: When reduced motion is requested, feedback and controls MUST appear without animation and with no loss of information. Animation MUST NOT delay feedback or controls in any mode.
- **FR-026**: Inside the window, too dark and too bright MUST each be written in words and marked with a distinct shape; color MUST NOT be the only signal.
- **FR-027**: In a window 320 CSS pixels wide the round MUST remain usable: dense tables MAY scroll inside their own labeled container, and the action buttons MUST be reachable without scrolling the page sideways.
- **FR-028**: The game MUST play from its own static files only. It MUST NOT need an account, a backend, a live device, a model or an API key, and MUST NOT request anything from another origin.

**Packaging**

- **FR-030** *(added by decision D18)*: The repository MUST carry one card image for the Arcade at the path `ARCADE.md` names: 16:9, in WebP, PNG or JPEG, and under 1 MB. Every level, limit and split shown on it MUST come from the game's engine and content file, never from a number typed for the image, and no image generator may be used to make it.

### Key Entities

- **Loss card**: the planning loss of each kind of element: fiber per km, connector, fusion splice, and each splitter ratio.
- **Optics**: the launch power at the OLT port and the receive window at the ONT, with its dark limit and its bright limit. Version one has one set: +5 dBm, and −28 to −8 dBm (decisions D13 and D14). The content format still holds optics as named classes, so content with several sets names each one to the player.
- **Plant**: the PON of a round: the OLT port, fiber segments with their connectors and splices, splitters (installed, or left open for the option to choose) and ONTs.
- **Option**: one design the player can choose: the ratios of the open splitters, the attenuators and where they sit, and the number of homes served.
- **Round**: a work order: its optics, a plant, a goal, its options, its hints and its explanations.
- **Level**: a briefing and two rounds that share one concept and one learning outcome.
- **Source**: a reference with a title, a link, a section and the claim it supports.
- **Evaluation**: for one option, each ONT's ledger, loss, receive level and state, whether the option is valid, and its outcome against the round's answer.
- **Session**: the current screen, and for each round the attempts, the assistance used and whether it is solved.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 20 option outcomes of the six rounds and all 4 boundary cases match the hand-worked results in this specification.
- **SC-002**: Every incorrect submission shows an explanation that names the ONT, its loss, its receive level, the limit and the difference.
- **SC-003**: A player can complete the game from a fresh start to the session summary using only the keyboard.
- **SC-004**: A first-time player completes the game in 10 to 15 minutes. *(Needs a person; not measured by the build.)*
- **SC-005**: None of the six unsupported-content cases (U1 to U6) can be opened as a challenge or graded.
- **SC-006**: With reduced motion requested, the feedback text is readable as soon as a submission is made.
- **SC-007**: At a width of 320 CSS pixels, Submit, Hint and Next can be reached without scrolling the page sideways.
- **SC-008**: After playing, a teammate can say what each of the three levels taught and what a deliberately wrong choice showed them. *(Needs a person.)*
- **SC-009**: During a full playthrough no request leaves the game's own origin.

## Assumptions

- Players use a current desktop or laptop browser; a phone-width window is supported for layout, without touch-specific gestures. A typical laptop window is taken as 1366 × 768 CSS pixels.
- The game is in English and uses kilometres and decibels to one decimal place.
- The ONTs shown in a round are the nearest and the farthest on that PON, and every other home lies between them.
- "Homes served" counts customer ports. In round 3-1 the four customers are shops, and in round 3-2 one of the 33 is a business.
- The loss card, the launch power and the receive window are given to the player as the job's planning values. They are not derived from a measurement.
- Developer tooling (a terminal test run, an independent answer-key check, a browser automation run) is not needed to play.

## Learning Outcomes

| ID | After playing, the learner can… | The game asks them to… | Evidence of success |
| --- | --- | --- | --- |
| LO1 | Calculate one ONT's optical path loss by adding fiber, connector, splice and splitter losses, take it from the launch power, and compare the receive level with the dark limit of the receive window | Choose the largest splitter a single path can carry | The largest in-window split is submitted in rounds 1-1 and 1-2 |
| LO2 | Apply the receive window to every ONT on a PON and compare competing designs, including two-stage splits | Choose among single and two-stage splitter designs for a PON with several ONTs | The design that keeps the farthest ONT in the window and serves the most homes is submitted in rounds 2-1 and 2-2 |
| LO3 | Recognize an ONT that receives more than the bright limit and correct it with attenuation in the right place | Choose the attenuator, and where it goes, for PONs with a very short path | The only design that brings every ONT inside the window is submitted in rounds 3-1 and 3-2 |

## Technical Model

1. An ONT's optical path loss, in dB, is the sum of every element between the OLT port and that ONT: fiber km × 0.5, connectors × 0.5, fusion splices × 0.1, each splitter on the path, and each attenuator on the path.
2. An ONT's receive level, in dBm, is the launch power at the OLT port less its optical path loss. The launch power is +5 dBm in every round (decision D14; reference R8).
3. An ONT is inside the window when its receive level is at least the dark limit and at most the bright limit, limits included. The window is −28 dBm to −8 dBm in every round (decision D13; reference R7). Below the dark limit the ONT is "too dark". Above the bright limit it is "too bright". In path-loss terms the window is 13 to 33 dB.
4. An option is valid when every ONT shown is inside the window.
5. The answer is the valid option that serves the most homes.

**Loss card**: fiber 0.5 dB/km; connector 0.5 dB; fusion splice 0.1 dB; splitters 1:2 3.5 dB, 1:4 7.0 dB, 1:8 10.5 dB, 1:16 14.0 dB, 1:32 17.5 dB, 1:64 21.0 dB; attenuators at face value. **Optics**: launch power +5 dBm; receive window −28 dBm to −8 dBm.

**Outside the model**: the game checks only the light the ONT receives, the downstream direction. A real design also checks the upstream direction, the ONT's light arriving at the OLT, and uses the fiber loss at each wavelength: 1260 to 1280 nm upstream and 1575 to 1580 nm downstream, where fiber loses less per km. The game uses the higher, upstream value. A real transmitter's power lies in a range, so a real budget takes the weakest launch for the dark limit and the strongest for the bright limit and allows for a path penalty; the standard's loss classes (reference R1) are built that way, and the game's single launch power makes its usable loss, 13 to 33 dB, wider than class N1 (14 to 29 dB) at both ends. A real budget also reserves margin for repairs and ageing. Reflectance, dispersion, bend loss, splitter port-to-port variation, the maximum fiber distance, ranging and activation are not modeled.

### References

| ID | Reference | Section | Claim it supports |
| --- | --- | --- | --- |
| R1 | ITU-T G.9807.1 (02/2023), XGS-PON. https://www.itu.int/rec/T-REC-G.9807.1-202302-I | Annex B, clause B.6.1, Table B.6.1 | The standard states the budget of a PON as classes of path loss with a minimum and a maximum: N1 minimum 14 dB and maximum 29 dB; N2 minimum 16 dB and maximum 31 dB. The game states it as a launch power and a receive window instead (decisions D13 and D14); the classes are cited so the difference is in the open. Where an architecture gives less than the minimum loss, the ODN must add optical attenuators to protect receivers. |
| R2 | ITU-T G.9807.1 (02/2023) | Annex B, clauses B.9.2.6.1 and B.9.2.8.1, Tables B.9.2, B.9.3 and B.9.4 | The attenuation range applies between the OLT and ONU reference points and includes splices, connectors, optical attenuators and other passive devices. Maximum differential optical path loss is 15 dB. Downstream 1575 to 1580 nm, upstream 1260 to 1280 nm. |
| R3 | ITU-T G.652 (08/2024), single-mode fibre and cable. https://www.itu.int/epublications/publication/itu-t-g-652-2024-08-characteristics-of-a-single-mode-optical-fibre-and-cable | Appendix I, Table I.1; clause 8, Table 2, Note 2 | Typical link attenuation is 0.5 dB/km for 1260 to 1360 nm and 0.35 dB/km for 1565 to 1625 nm. G.652.D cable maximum is 0.40 dB/km from 1310 to 1625 nm, plus 0.07 dB/km to extend to 1260 nm. |
| R4 | The FOA Reference Guide, "Guidelines On What Loss To Expect When Testing Fiber Optic Cables". https://www.thefoa.org/tech/loss-est.htm | Connector and splice paragraphs | Typical connector loss is about 0.3 dB; TIA-568 allows up to 0.75 dB per mated pair and 0.3 dB per splice. |
| R5 | The FOA Reference Guide, "Using Attenuators With Fiber Optic Data Links". https://www.thefoa.org/tech/ref/appln/attenuators.html | Worked example | A receiver overloads when cable plant loss is below a minimum; an attenuator adds the missing loss. |
| R6 | TEC GR/TX/OPT-001/01/APR-12, generic requirements for optical splitters. https://tec.gov.in/pdf/GRFA/TEC-GR-FA-OPT-001-01-APR-12.pdf | Insertion loss table | One published set of maximum splitter insertion losses: 4.0, 7.1, 10.5, 13.8, 17.1 and 20.5 dB for 1×2 to 1×64. |
| R7 | The project owner's field practice. No link: it is a decision, recorded here | Owner's reviews of 2026-11-19; decisions D11, D13 and D14 | The game's receive window, −28 dBm to −8 dBm at the ONT, as the receive levels the owner has seen in deployed networks; and its launch power, +5 dBm. |
| R8 | ITU-T G.9807.1 (02/2023). https://www.itu.int/rec/T-REC-G.9807.1-202302-I | Annex B, clause B.9.2.6.2, Table B.9.3 | For the 9.95328 Gbit/s downstream direction: the OLT's mean launched power is +2.0 to +5.0 dBm in class N1 and +4.0 to +7.0 dBm in class N2; an ONU's minimum sensitivity is −28.0 dBm and its minimum overload −9.0 dBm in every class; the maximum optical path penalty is 1.0 dB. The game's launch power is the top of the N1 range and inside the N2 range; its dark limit equals the sensitivity; its bright limit is 1 dB above the overload figure. |

## Version-one Content

Three levels, two rounds per level, six rounds in all. One new example per round and the same mechanic throughout: choose one design option for the PON shown.

| Level | Rounds | New concept | Misconception to expose |
| --- | --- | --- | --- |
| 1 · Add it up (LO1) | 1-1 Mesquite Lane, 1-2 Ocotillo Ranch Road | Path loss is the sum of every element; launch power less path loss is the receive level; compare it with the dark limit | "Only the fiber and the splitter matter", "the design that fitted the last route is the best one here" |
| 2 · The farthest home sets the limit (LO2) | 2-1 Palo Verde Loop, 2-2 Cholla Crossing | The window applies to every ONT; stage losses add | "Budget for a typical home", "two small splitters lose less than one big one" |
| 3 · Too much light (LO3) | 3-1 Ironwood Court, 3-2 Agave Works | The window has a bright limit; attenuation fixes it only in the right place | "Less loss is always safer", "an attenuator anywhere will do" |

Progression is sequential. Retry has no penalty. Completion requires a correct submission in every round. Hints stay available. There are no points, lives, timer, leaderboard or streaks.

## Hand-worked Cases

These expected results are written before the content and the code they test. All six rounds, the three worked examples and the four boundary cases were re-worked by hand on 2026-11-19 for the owner's receive window and launch power (decisions D13 and D14), before the content file was changed; the arithmetic was cross-checked with a throwaway script that is not part of the repository. Losses are in dB and receive levels in dBm. In every round the launch power is +5 dBm and the receive window is −28 to −8 dBm, limits included. A receive level is +5 minus the path loss, so the window is 13 to 33 dB of path loss. "Before the choice" is the loss from fixed elements only. Case IDs are `round/option`.

### Round 1-1 · Mesquite Lane

Plant: OLT port → 16.0 km, 4 connectors, 4 splices → splitter (chosen) → 2.0 km, 3 connectors, 3 splices → ONT A, the farthest home.
ONT A: fiber 18.0 km (9.0), 7 connectors (3.5), 7 splices (0.7). Before the choice: 13.2.

| Case | Option | Homes | ONT A loses | ONT A receives | Outcome |
| --- | --- | --- | --- | --- | --- |
| r1-1/o16 | 1:16 splitter (14.0) | 16 | 27.2 | −22.2, inside | valid-not-best |
| r1-1/o32 | 1:32 splitter (17.5) | 32 | 30.7 | −25.7, inside | **best-valid (answer)** |
| r1-1/o64 | 1:64 splitter (21.0) | 64 | 34.2 | −29.2, below the dark limit by 1.2 | too-dark. With fiber and splitter alone it would look like 30.0, which is inside; the connectors and splices add 4.2 |

### Round 1-2 · Ocotillo Ranch Road

The street layout of round 1-1 on a feeder 6 km shorter, so 3.0 dB more light arrives. With this budget every option is inside the window, and the round asks the player not to stop at the design that fitted the last route. (In the first version this round was a route so long that only a 1:16 fitted. With a +5 dBm launch and a −28 dBm dark limit a 1:32 reaches any route within 20 km, so that lesson no longer exists.)

Plant: OLT port → 10.0 km, 4 connectors, 4 splices → splitter (chosen) → 2.0 km, 3 connectors, 3 splices → ONT A, the farthest home.
ONT A: fiber 12.0 km (6.0), 7 connectors (3.5), 7 splices (0.7). Before the choice: 10.2.

| Case | Option | Homes | ONT A loses | ONT A receives | Outcome |
| --- | --- | --- | --- | --- | --- |
| r1-2/o16 | 1:16 splitter (14.0) | 16 | 24.2 | −19.2, inside | valid-not-best |
| r1-2/o32 | 1:32 splitter (17.5) | 32 | 27.7 | −22.7, inside | valid-not-best |
| r1-2/o64 | 1:64 splitter (21.0) | 64 | 31.2 | −26.2, inside, 1.8 above the dark limit | **best-valid (answer)** |

### Round 2-1 · Palo Verde Loop

Plant: OLT port → 12.0 km, 4 connectors, 2 splices → splitter (chosen) → three drops. ONT A, nearest: 0.2 km, 2 connectors, 1 splice. ONT B: 2.0 km, 2 connectors, 2 splices. ONT C, farthest: 6.0 km, 2 connectors, 4 splices.
ONT A: 12.2 km (6.1), 6 connectors (3.0), 3 splices (0.3): 9.4. ONT B: 14.0 km (7.0), 6 connectors (3.0), 4 splices (0.4): 10.4. ONT C: 18.0 km (9.0), 6 connectors (3.0), 6 splices (0.6): 12.6.

| Case | Option | Homes | Loses A / B / C | Receives A / B / C | Outcome |
| --- | --- | --- | --- | --- | --- |
| r2-1/o16 | 1:16 splitter (14.0) | 16 | 23.4 / 24.4 / 26.6 | −18.4 / −19.4 / −21.6 | valid-not-best |
| r2-1/o32 | 1:32 splitter (17.5) | 32 | 26.9 / 27.9 / 30.1 | −21.9 / −22.9 / −25.1 | **best-valid (answer)** |
| r2-1/o64 | 1:64 splitter (21.0) | 64 | 30.4 / 31.4 / 33.6 | −25.4 / −26.4 / −28.6; C is below the dark limit by 0.6 | too-dark at ONT C |

### Round 2-2 · Cholla Crossing

Plant: OLT port → 11.0 km, 5 connectors, 2 splices → first-stage splitter (chosen) → 2.0 km, 1 connector, 1 splice → second-stage 1:16 splitter (installed) → two drops. ONT A, nearest: 0.2 km, 2 connectors, 1 splice. ONT B, farthest: 1.0 km, 2 connectors, 2 splices.
ONT A: 13.2 km (6.6), 8 connectors (4.0), 4 splices (0.4): 11.0 before any splitter, 25.0 with the installed 1:16. ONT B: 14.0 km (7.0), 8 connectors (4.0), 5 splices (0.5): 11.5 before any splitter, 25.5 with the installed 1:16.

| Case | Option | Homes | Splitters | Loses A / B | Receives A / B | Outcome |
| --- | --- | --- | --- | --- | --- | --- |
| r2-2/c8x16 | 1:8 then 1:16 | 128 | 10.5 + 14.0 = 24.5 | 35.5 / 36.0 | −30.5 / −31.0; below the dark limit by 2.5 and 3.0 | too-dark |
| r2-2/c2x16 | 1:2 then 1:16 | 32 | 3.5 + 14.0 = 17.5 | 28.5 / 29.0 | −23.5 / −24.0 | valid-not-best |
| r2-2/c4x16 | 1:4 then 1:16 | 64 | 7.0 + 14.0 = 21.0 | 32.0 / 32.5 | −27.0 / −27.5 | **best-valid (answer)** |

### Round 3-1 · Ironwood Court

Plant: remote OLT port → 0.2 km, 3 connectors, 1 splice → installed 1:4 splitter (7.0) → ONT A: 0.0 km, 1 connector, 0 splices; ONT B: 0.2 km, 1 connector, 0 splices. Four shops beside the cabinet; every option serves the same 4 customers.
ONT A: 0.2 km (0.1), 4 connectors (2.0), 1 splice (0.1), splitter 7.0: 9.2, so −4.2 as drawn. ONT B: 0.4 km (0.2), 4 connectors (2.0), 1 splice (0.1), splitter 7.0: 9.3, so −4.3 as drawn.

| Case | Option | Loses A / B | Receives A / B | Outcome |
| --- | --- | --- | --- | --- |
| r3-1/none | Build it as drawn | 9.2 / 9.3 | −4.2 / −4.3; above the bright limit by 3.8 and 3.7 | too-bright |
| r3-1/a3 | 3 dB attenuator at the OLT port | 12.2 / 12.3 | −7.2 / −7.3; above the bright limit by 0.8 and 0.7 | too-bright |
| r3-1/a10 | 10 dB attenuator at the OLT port | 19.2 / 19.3 | −14.2 / −14.3 | **best-valid (answer)** |
| r3-1/a25 | 25 dB attenuator at the OLT port | 34.2 / 34.3 | −29.2 / −29.3; below the dark limit by 1.2 and 1.3 | too-dark |

Two values would not do as options here. A 5 dB attenuator would also be valid (−9.2 and −9.3), and the round would have two answers. A 20 dB attenuator would not do as the overshoot: the window is 20 dB wide, so a path that is too bright by any amount lands inside it when 20 dB is added.

### Round 3-2 · Agave Works

Plant: OLT port → 2.0 km, 2 connectors, 2 splices → installed 1:2 splitter (3.5). Leg one → 0.2 km, 1 connector, 0 splices → ONT A, a business. Leg two → 3.0 km, 1 connector, 1 splice → installed 1:32 splitter (17.5) → 1.0 km, 1 connector, 1 splice → ONT B, the farthest of 32 homes. Every option serves 33 customers. The plant is the first version's; the receive levels are new.
ONT A: 2.2 km (1.1), 3 connectors (1.5), 2 splices (0.2), splitter 3.5: 6.3, so −1.3 as drawn. ONT B: 6.0 km (3.0), 4 connectors (2.0), 4 splices (0.4), splitters 3.5 + 17.5 = 21.0: 26.4, so −21.4 as drawn.

| Case | Option | Loses A / B | Receives A / B | Outcome |
| --- | --- | --- | --- | --- |
| r3-2/olt10 | 10 dB attenuator at the OLT port | 16.3 / 36.4 | −11.3 / −31.4; B is below the dark limit by 3.4 | too-dark at ONT B |
| r3-2/ontA10 | 10 dB attenuator at ONT A | 16.3 / 26.4 | −11.3 / −21.4 | **best-valid (answer)** |
| r3-2/ontB10 | 10 dB attenuator at ONT B | 6.3 / 36.4 | −1.3, above the bright limit by 6.7 / −31.4, below the dark limit by 3.4 | dark-and-bright |
| r3-2/none | Build it as drawn | 6.3 / 26.4 | −1.3, above the bright limit by 6.7 / −21.4 | too-bright at ONT A |

### Worked examples of the briefings

Each briefing's example is computed by the same evaluator as the rounds. Its numbers differ from every challenge (FR-002).

| Example | Plant | Loses | Receives |
| --- | --- | --- | --- |
| Level 1 | OLT port → 9.0 km, 2 connectors, 1 splice → installed 1:16 (14.0) → 1.0 km, 2 connectors, 1 splice → ONT X | 10.0 km (5.0) + 4 connectors (2.0) + 2 splices (0.2) + 14.0 = 21.2 | −16.2, which is 11.8 above the dark limit |
| Level 2 | OLT port → 14.0 km, 4 connectors, 2 splices → installed 1:32 (17.5) → ONT X: 0.8 km, 2 connectors, 1 splice; ONT Y: 5.0 km, 2 connectors, 3 splices | X: 14.8 km (7.4) + 6 connectors (3.0) + 3 splices (0.3) + 17.5 = 28.2. Y: 19.0 km (9.5) + 6 connectors (3.0) + 5 splices (0.5) + 17.5 = 30.5 | X −23.2. Y −25.5, which is 2.5 above the dark limit: less than the 3.5 a larger splitter would add |
| Level 3 | OLT port with a 15 dB attenuator → 1.0 km, 2 connectors → installed 1:2 (3.5) → 0.0 km, 1 connector → ONT X | 1.0 km (0.5) + 3 connectors (1.5) + 3.5 = 5.5 as drawn; with the attenuator 20.5 | −0.5 as drawn, above the bright limit by 7.5; −15.5 with the attenuator |

### The Arcade card's work order

The card image shows three designs of one route on a single trace. The game never draws that, and a round of the game shown that way would print its result on the card, so the card has a work order of its own. It is not part of the game and is never graded. It is worked here by hand so that the image can be checked like everything else (FR-030, browser check `CARD`).

Plant: OLT port → 12.0 km, 4 connectors, 4 splices → splitter (chosen) → 6.0 km, 4 connectors, 6 splices → ONT A.
ONT A: fiber 18.0 km (9.0), 8 connectors (4.0), 10 splices (1.0). Before the choice: 14.0. The light reaches the splitter at +5 − (6.0 + 2.0 + 0.4) = −3.4.

| Case | Option | Homes | ONT A loses | ONT A receives | Outcome |
| --- | --- | --- | --- | --- | --- |
| card/o16 | 1:16 splitter (14.0) | 16 | 28.0 | −23.0, inside | valid-not-best |
| card/o32 | 1:32 splitter (17.5) | 32 | 31.5 | −26.5, inside | best-valid |
| card/o64 | 1:64 splitter (21.0) | 64 | 35.0 | −30.0, below the dark limit by 2.0 | too-dark |

### Boundary and unsupported-content cases

| Case | Input state | Player action | Expected result | Why / source |
| --- | --- | --- | --- | --- |
| B1 · At the dark limit | One ONT: 18.0 km (9.0), 5 connectors (2.5), 5 splices (0.5); option 1:64 (21.0). Loss 33.0, receive level −28.0 | Submit 1:64 | Inside the window; valid | Limits are included. D13 |
| B2 · Just below it | As B1 with 6 splices (0.6). Loss 33.1, receive level −28.1 | Submit 1:64 | Too dark, below the dark limit by 0.1 | D13 |
| B3 · At the bright limit | One ONT: 6.0 km (3.0), 5 connectors (2.5), 5 splices (0.5); installed 1:4 (7.0). Loss 13.0, receive level −8.0 | Submit "build as drawn" | Inside the window; valid | Limits are included. D13 |
| B4 · Just above it | As B3 with 4 splices (0.4). Loss 12.9, receive level −7.9 | Submit "build as drawn" | Too bright, above the bright limit by 0.1 | D13 |
| U1 · No valid option | Every option leaves an ONT outside the window | Open round | Visible content error; no grading or progress | Authoring error, not learner failure |
| U2 · Tie for most homes | Two valid options serve the same largest number of homes | Open round | Visible content error; no grading or progress | The answer would be ambiguous |
| U3 · Unknown component | A splitter ratio or class that is not on the loss card | Open round | Visible content error; no grading or progress | The loss cannot be computed |
| U4 · Inexact value | A length that makes a total that is not exact to 0.1 dB | Open round | Visible content error; no grading or progress | Rounding must never decide an answer |
| U5 · Authored note contradicts the rule | An option's authored explanation is tagged with a different outcome than the rule gives | Open round | Visible content error; no grading or progress | Feedback must agree with the evaluator |
| U6 · Broken reference | A briefing cites a source ID that is not defined | Load game | Visible content error; no grading or progress | Every rule needs its source |

## Out of Scope

No user accounts, multiplayer, backend, live infrastructure access, runtime AI, leaderboard or level editor. No saving across reloads. No simulation of the spread of real transmitters and receivers, of the upstream direction, of wavelengths, ranging, activation or bandwidth allocation. No audio. Visual polish must fit the existing mechanic.

## Decisions Recorded for Owner Review

The owner asked the build agent to make the design calls from the workshop's defaults, record each one, and present them for review with the playable game. Each decision is open to change by the owner.

| ID | Decision | Reason |
| --- | --- | --- |
| D1 | The game is called Split Decision and is set in the fictional Saguaro Valley | A name that describes the action; a fictional place may illustrate the rule without changing it |
| D2 | Loss card: fiber 0.5 dB/km, connector 0.5 dB, splice 0.1 dB, 3.5 dB per two-way split. Kept by the owner (D17) | Easy mental arithmetic; each value is traceable to R3, R4 and R6 |
| D3 | Superseded by D11. It was: classes N1 and N2 only | It was: two windows are enough to show that the window depends on the class |
| D4 | One fiber value, the higher (upstream) one. Restated after D13: the receive level is a downstream quantity, and the game still uses the upstream value | Keeps the loss card and its arithmetic; the simplification is stated to the player; a test shows that the lower downstream value would change no "inside" or "too bright" verdict. It would make two ONTs that the game calls too dark light enough, the farthest one behind the 1:64 splitter in rounds 1-1 and 2-1, so the answers of those rounds rest on this value. Put to the owner, who kept it (D17) |
| D5 | No repair or ageing margin | Every number on screen comes from a visible element; the omission is stated |
| D6 | Among valid options the most homes wins; a valid but smaller design is graded incorrect with its own explanation | Gives each round exactly one answer and matches the real question "how far can I split this route?" |
| D7 | The game says ONT; the standard says ONU | ONT is the common word in North American practice; the briefing gives both |
| D8 | Session target 10 to 15 minutes instead of the template's 5 to 10 | Each round asks for arithmetic |
| D9 | Three levels of two rounds, as in the template | Workshop scope |
| D10 | Feedback for a valid but smaller design says that a larger option also fits, and does not name it | A wrong answer should give a next step, not the answer; the answer is shown only by the worked solution or by solving the round |
| D11 | **Owner's decision, 2026-11-19; its unit was settled by D13.** One window for the whole game, with limits at 8 and 28. It replaces the N1 and N2 classes of the first version. It was first applied as path loss in dB, as written | The owner: closer to what he has seen in the field |
| D12 | **Owner's decision, 2026-11-19.** The game says "connector", one mated connection on the single fiber, not "connector pair"; the first briefing says a PON runs on one fiber | The owner: "connector pair" can be read as two fibers, and a PON is a single fiber to the ONT |
| D13 | **Owner's decision, 2026-11-19, second review.** 8 and 28 are receive levels. The game's window is the level an ONT receives: −28 dBm (dark limit) to −8 dBm (bright limit), limits included. Every ONT's receive level is shown in dBm | The owner: the two figures are the ONT's receive levels |
| D14 | **Owner's decision, 2026-11-19, second review.** Launch power at the OLT port: +5 dBm, one value for every work order. The owner first wrote a five with a hyphen in front, which the build agent read as plus five, and then confirmed the reading: plus five is right | +5 dBm is inside the standard's launch ranges (R8); −5 dBm is below them and would leave 3 to 23 dB of usable loss |
| D15 | Outcome codes too-dark, too-bright and dark-and-bright, and ONT states dark and bright, replace over-max, under-min, over-and-under, over and under. The two limits are called the dark limit and the bright limit | With negative levels "minimum" and "maximum" invite mistakes: the ONT that is too dark is under its limit, where before it was over one |
| D16 | Round 1-2 is the street of round 1-1 on a feeder 6 km shorter. Every option is inside the window and the largest is the answer | With a +5 dBm launch and a −28 dBm dark limit a 1:32 reaches any route within 20 km, so the first version's lesson ("only a 1:16 fits a long route") cannot be built honestly. The new lesson: the route decides, so do not stop at what fitted last time. The misconception "only the fiber and the splitter matter" moved to round 1-1's 1:64 option |
| D17 | **Owner's decision, 2026-11-19, after the second review.** The loss card keeps its values: fiber 0.5 dB/km, connector 0.5 dB, splice 0.1 dB, 3.5 dB per two-way split | The owner: keep the card as it is, in answer to the question whether the upstream fiber value should stay now that the level checked is a downstream one. The game goes on telling the player that it reads a little dark on long routes (D4) |
| D19 | **Owner's decision, 2026-11-19.** The repository does not quote the owner's messages. Every quotation was replaced by a paraphrase, in the documents and in the history: the history was rebuilt once, before the repository was first published, changing only Markdown files and commit messages | The owner asked for it. The commit hashes in these documents are those of the published history. The files of the game, the tests and the tools are byte for byte what the checks were run on |
| D18 | The Arcade card is a drawing made for the purpose, not a screenshot: the game's splitter mark at the scale of its own loss trace. One fiber leaves the OLT port at the launch power; the splitter, in conduit orange, spans the fall in level across it; three designs (1:16, 1:32, 1:64) of a work order made for the card leave it and end inside the receive window or below it. The title, the masthead's line, the tagline, the window and the state shapes are the game's. `tools/card.html` draws it with the game's engine, content file, style sheet and typefaces, and `tools/e2e.py --card` captures it in headless Chrome | The owner asked how the card compares with the others in the Arcade. Beside 13 of them it was the plainest, a full-page screenshot that cannot be read at card size (research R-12). No image generator was available or wanted, so the game draws its own card. The screenshot stays as `docs/gameplay.png`, 16:9 and under 1 MB: the owner can make it the card again by changing `card_image` in `ARCADE.md` |
