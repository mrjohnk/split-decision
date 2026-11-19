---
description: "Task list for Split Decision, first playable version"
---

# Tasks: Split Decision, first playable version

**Input**: Design documents from `/specs/001-loss-budget-game/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are included. The specification requires hand-worked expected results before code (constitution, principle I), and the plan's first slice proves the rule before any screen exists. Within each phase the tests are written first and must fail before the implementation they cover.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Every task names the file it creates or changes

## Path Conventions

One static project at the repository root: `index.html`, `style.css`, `main.js`, `engine/`, `ui/`, `data/`, `tests/`, `tools/`, `assets/`, `docs/`. Paths below are relative to the repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create the directories `engine/`, `ui/`, `data/`, `tests/fixtures/`, `tools/`, `assets/` and `docs/verification/` at the repository root, as laid out in plan.md
- [X] T002 [P] Create `index.html`: the page shell with a header, a main region carrying `data-testid="view"`, a status region with `role="status"` and `aria-live="polite"`, three `<dialog>` elements, and `main.js` as the only module entry (contracts/ui.md)
- [X] T003 [P] Create `tests/harness.js` (case registration, `assertEqual`, `assertDeepEqual`, `assertTrue`, result collection) and `tests/all.js` (the list of test modules)
- [X] T004 [P] Create `tests/run-node.mjs` and `tests/index.html`: both import `tests/all.js`, run every case, report totals and failed case IDs, and report failure when no test was found; the Node runner exits non-zero on failure

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The rule, the content and the session logic. Nothing on the page may be built before these pass, because the page only displays what they decide.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests first

- [X] T005 Transcribe the specification's Hand-worked Cases into `tests/fixtures/answer-key.json`: for each of the 20 `round/option` cases the total and state of every ONT and the outcome; and boundary cases B1 to B4 with their inputs and expected results
- [X] T006 Author `data/levels.json` in full: `schemaVersion`, `lossCard`, `classes`, sources R1 to R6, the model notes, and for each of the six rounds its class, plant and options exactly as written in the specification; and the authored text of all three levels (briefings with their worked examples, stories, goals, hints, option notes with `expect`, explanations), with every dB value written as a value token. The whole file must be valid before any screen can load, so the text is authored here and reviewed in the running page in T018 and T028
- [X] T007 Write `tests/rules.test.js` from contracts/rules.md: the 20 cases and B1 to B4 against `tests/fixtures/answer-key.json`; `invalid-input` for no selection and for an unknown option; the 0.35 dB/km recomputation that must change no ONT's state; repeat calls return equal results and leave inputs unchanged (SC-001). Confirm it fails
- [X] T008 Write `tests/content.test.js` from contracts/content.md: the shipped content validates; altered copies produce each of U1 to U6 with the listed code and place; each remaining error code, including `missing-note` and `unknown-token`, is produced at least once; no authored text contains a hand-typed dB value; validation does not modify its input (SC-005). Confirm it fails
- [X] T009 Write `tests/state.test.js` from contracts/session.md: AC4, AC5, AC6, AC7, AC8, clarifications 1 to 3, and the summary totals of a scripted playthrough. Confirm it fails
- [X] T010 Write `tests/feedback.test.js`: for every shipped option the feedback text contains each ONT's total, the limit and the difference produced by the evaluator; feedback for an incorrect submission never contains the answer's label (FR-011) and ends with a next step (FR-010); the worked solution names the answer and carries its ledger; guidance text exists for `no-selection` (SC-002). Confirm it fails

### Implementation

- [X] T011 Implement `engine/rules.js` per contracts/rules.md: `toMilli`, `pathsOf`, `evaluateOption`, `evaluateRound`, `outcomeOf`, `evaluate`, all in whole thousandths of a dB (FR-006, FR-007, FR-008)
- [X] T012 [P] Write `tools/oracle.py`: recompute every case of `tests/fixtures/answer-key.json` from `data/levels.json` with Python's `decimal` module, sharing no code with `engine/`, and exit non-zero on any difference
- [X] T013 Implement `engine/content.js` per contracts/content.md: `validateContent` with every error code, in the stated order of checks (FR-019, FR-020). It enforces every constraint of data-model.md: Content document.schemaVersion, Content document.title, Content document.lossCard, Content document.classes, Content document.sources, Content document.model, Content document.levels; Loss card.fiberDbPerKm, Loss card.connectorPairDb, Loss card.spliceDb, Loss card.splitterDb, Loss card.sourceIds; Loss class.minDb, Loss class.maxDb, Loss class.sourceId; Source.id, Source.title, Source.url, Source.section, Source.claim; Model notes.rule, Model notes.assumptions, Model notes.leftOut; Level.id, Level.title, Level.outcome, Level.briefing, Level.rounds; Briefing.intro, Briefing.terms, Briefing.example, Briefing.sourceIds; Round.id, Round.title, Round.place, Round.story, Round.goal, Round.class, Round.plant, Round.options, Round.hints, Round.explain; Plant.oltLabel, Plant.trunk; Segment.fiberKm, Segment.connectorPairs, Segment.splices, Segment.to; Node.type, Node.id, Node.label, Node.ratio, Node.legs, Node.note; Option.id, Option.label, Option.served, Option.servedLabel, Option.splitters, Option.attenuators, Option.note, Option.expect
- [X] T014 Implement `engine/state.js` per contracts/session.md: `createSession`, `reduce`, `summarize` (FR-012 to FR-018; data-model.md: Session state.view, Session state.levelIndex, Session state.roundIndex, Session state.finishedLevelId, Session state.confirmingRestart, and for each round Session state.selected, Session state.attempts, Session state.hints, Session state.solutionViewed, Session state.solved, Session state.last, Session state.guidance)
- [X] T015 Implement `engine/feedback.js`: `describeResult` turns an evaluation into a headline, one line for each ONT, the ledger, the option's note and a next step by outcome; `describeSolution` names the answer and prints its ledger; and the guidance text (FR-009 to FR-012, FR-014, FR-024, FR-026)
- [X] T016 Run `node tests/run-node.mjs` and `python3 tools/oracle.py`; record the totals and any failure in `docs/verification.md`

**Checkpoint**: The rule is proven against the hand-worked cases by two implementations. User story work can begin.

---

## Phase 3: User Story 1 - Make and understand a decision (Priority: P1) 🎯 MVP

**Goal**: A learner reads the Level 1 briefing, plays round 1-1, and gets an explanation for a wrong choice and for the correct one.

**Independent Test**: Play round 1-1 alone: submit nothing, then 1:64, then 1:16, then 1:32, and compare each result with AC1 to AC4.

### Tests for User Story 1

- [X] T017 [US1] Write the AC1, AC2, AC3a, AC3b and AC4 scenarios for round 1-1 in `tools/e2e.py`, reading expected totals from `tests/fixtures/answer-key.json`; confirm they fail before the page exists

### Implementation for User Story 1

- [X] T018 [US1] Review in the running page, and correct in `data/levels.json` where needed, the Level 1 briefing (introduction, terms, worked example, sources, and the simplifications in plain language, FR-022) and the story, goal, option notes and explanation of rounds 1-1 and 1-2
- [X] T019 [US1] Implement `main.js`: fetch `data/levels.json` by relative URL, validate it, create the session, render; show the loading view, and the content error view with "Try loading again" when loading or validation fails (FR-019, FR-028)
- [X] T020 [P] [US1] Implement `ui/diagram.js`: draw the plant as inline SVG with a generated text description, and the loss trace with one line for each ONT and the class window marked (FR-003; contracts/ui.md, Drawings)
- [X] T021 [US1] Implement the briefing view in `ui/render.js`: level title and outcome, introduction, terms, worked example, sources cited, "Start level" (FR-001, FR-002, FR-021)
- [X] T022 [US1] Implement the round view in `ui/render.js`: work order, diagram, path table, class window, loss card, and the option group with the homes each option serves (FR-003, FR-005)
- [X] T023 [US1] Implement feedback and guidance in `ui/render.js`: the status region, the headline with its state word and shape, one line for each ONT, the ledger table, the note, and the loss trace and meter rows updated from the evaluation (FR-009 to FR-012, FR-024, FR-026)
- [X] T024 [US1] Implement `ui/controls.js` for `start-level`, `select` and `submit`, with Enter in the option group submitting the form (FR-005)
- [X] T025 [P] [US1] Create `style.css`: two columns at 960 CSS pixels and wider, the type scale, the work order, options, instrument panel, ledger and feedback styles, and the three state shapes (contracts/ui.md, Layout)
- [X] T026 [US1] Run the US1 scenarios in `tools/e2e.py` and record the result in `docs/verification.md`

**Checkpoint**: User Story 1 is functional and testable on its own.

---

## Phase 4: User Story 2 - Learn from help and finish the game (Priority: P1)

**Goal**: A learner can take hints and the worked solution, play all six rounds, see level and session summaries, and restart.

**Independent Test**: In one round open hint 1, hint 2 and the worked solution, submit the answer twice, and check the level summary; then play to the session summary and restart.

### Tests for User Story 2

- [X] T027 [US2] Add to `tools/e2e.py` the AC5, AC6, AC7 and AC8 scenarios and a full six-round playthrough that submits every option of every round and compares each on-screen total, state and outcome with `tests/fixtures/answer-key.json`; and a reload in mid-game that must return to the first briefing with no progress (FR-018); confirm the new scenarios fail

### Implementation for User Story 2

- [X] T028 [US2] Review in the running page, and correct in `data/levels.json` where needed, the Level 2 and Level 3 briefings, the story, goal, option notes and explanation of rounds 2-1 to 3-2, and the two hints of each of the six rounds
- [X] T029 [US2] Render the Hint and Worked solution buttons and the revealed help in `ui/render.js`, and wire `hint` and `solution` in `ui/controls.js`; both are unavailable once the round is solved (FR-014)
- [X] T030 [US2] Render Next with its three names and wire `next` in `ui/controls.js`; show the finished level's summary at the top of the next briefing (FR-015, FR-016)
- [X] T031 [US2] Implement the session summary view in `ui/render.js`: one row for each round, the totals including "solved without the worked solution" and "solved with no help at all", what each level practiced, "Play again" (FR-016)
- [X] T032 [US2] Implement Restart in `ui/render.js` and `ui/controls.js` with the confirmation dialog: `request-restart`, `confirm-restart`, `cancel-restart` (FR-017)
- [X] T033 [US2] Implement the progress indicator in the header in `ui/render.js`: level, round and one marker for each of the six rounds (FR-003)
- [X] T034 [US2] Run the US2 scenarios and the full playthrough in `tools/e2e.py` and record the result in `docs/verification.md`

**Checkpoint**: User Stories 1 and 2 both work.

---

## Phase 5: User Story 3 - Play with accessible controls (Priority: P1)

**Goal**: The whole game can be played from the keyboard, read without color or motion, and used in a narrow window.

**Independent Test**: Complete the game from a fresh start with the keyboard only; repeat one round with reduced motion requested and at 320 CSS pixels wide.

### Tests for User Story 3

- [X] T035 [US3] Add to `tools/e2e.py`: a keyboard-only playthrough from the first briefing to the summary at 1366 × 768 (AC9, SC-003); an accessible-name check for every control in contracts/ui.md; a check that feedback is inside the status region and names its option (AC10); runs with and without reduced motion that read the feedback immediately after Submit (FR-025, SC-006); a contrast check of every text color against its background, at least 4.5 to 1; a 320-pixel run that asserts no sideways page scroll and that Submit, Hint and Next are reachable (SC-007); a request log that asserts no request to another origin (SC-009). Confirm the new scenarios fail or are not yet met

### Implementation for User Story 3

- [X] T036 [US3] Implement focus management in `ui/controls.js`: focus the view's heading after a change of view, Next after a correct submission, Submit otherwise; dialogs return focus to the control that opened them (FR-023)
- [X] T037 [US3] Add to `style.css` the visible focus outline (3 pixels, offset), control sizes, and text contrast of at least 4.5 to 1 (FR-023, FR-026)
- [X] T038 [US3] Implement motion in `ui/diagram.js` and `style.css`: write the result first, then let the loss trace draw itself once, only when reduced motion is not requested (FR-025)
- [X] T039 [US3] Add the narrow layout to `style.css`: one column below 960 CSS pixels, labeled scroll containers for the path table, loss card and ledger, and no sideways page scroll at 320 CSS pixels (FR-027)
- [X] T040 [US3] Implement the "Review briefing" and "Model and sources" dialogs in `ui/render.js` and `ui/controls.js`, with the model's rule, assumptions, what is left out, and every source with its section and link (FR-004, FR-021, FR-022)
- [X] T041 [US3] Run the US3 scenarios in `tools/e2e.py` and record the result in `docs/verification.md`

**Checkpoint**: All three user stories work.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Evidence, packaging and the checks that span the stories

- [X] T042 Review every briefing, hint, note and explanation in `data/levels.json` against references R1 to R6 and record the review, line by line where a number is stated, in `docs/verification.md`
- [X] T043 Add a trial seventh round as data only in `tests/content.test.js` and confirm that it validates and is graded without any change under `engine/` (constitution, principle VI)
- [X] T044 Capture `assets/card.webp` (16:9, under 1 MB) and `docs/gameplay.png` from the running game with `tools/e2e.py`
- [ ] T045 Write the root `README.md` from the attendee template: actual status, the challenge, what is learned, how to run and play, controls, the model and its references, how it was built, the verification table, known limits, credits and license
- [ ] T046 Complete `docs/verification.md`: every acceptance criterion and success criterion with pass, fail or not run, the date, the environment and the evidence; keep failed and untested checks visible; record SC-004 and SC-008, which need a person, as not run by the build and waiting for the owner
- [ ] T047 Fill `ARCADE.md` from `docs/build-log.md`; write "unknown" for anything not recorded; leave the creator block and `consent_to_publish` for the owner
- [ ] T048 Fresh-copy check: clone the repository into a new directory, serve it on a free port, run `node tests/run-node.mjs`, `python3 tools/oracle.py` and `python3 tools/e2e.py` there, and record the result in `docs/verification.md`
- [ ] T049 Walk through quickstart.md scenarios 1 to 7 and record each in `docs/verification.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: needs Setup. Blocks every user story
- **User Story 1 (Phase 3)**: needs Foundational
- **User Story 2 (Phase 4)**: needs User Story 1's round view and controls, which it extends
- **User Story 3 (Phase 5)**: needs the views of User Stories 1 and 2, which it makes operable and readable in every mode
- **Polish (Phase 6)**: needs all three user stories

### User Story Dependencies

- **US1** depends only on Foundational and is the MVP.
- **US2** adds help, progression, summaries and restart to the round view of US1. Its logic (attempts, help, progression) is already proven in `tests/state.test.js` in Foundational, so only its rendering and wiring depend on US1.
- **US3** has no logic of its own. It constrains how US1 and US2 are rendered.

### Within Each Phase

- T005 and T006 before T007; T007 before T011; T008 before T013; T009 before T014; T010 before T015.
- T011 before T013, T014 and T015, which call the evaluator.
- T006 before every view, because the page loads only a fully valid content file. T019 before any view can be seen.
- T018 after T021 to T023 and T028 after T029 to T031, because they review wording in the running page.
- In every phase the last task runs the checks and records them.

### Parallel Opportunities

- T002, T003 and T004 touch different files.
- T012 (Python) is independent of the JavaScript tasks once T005 and T006 exist.
- T020 (`ui/diagram.js`) and T025 (`style.css`) are independent of T021 to T024.

---

## Parallel Example: User Story 1

```text
# After T019, these touch different files and can proceed together:
Task: "T020 Implement ui/diagram.js: plant as inline SVG, text description, loss trace"
Task: "T025 Create style.css: columns, type scale, work order, options, instrument panel, ledger, feedback, state shapes"

# Then, in order, because they share ui/render.js:
Task: "T021 Briefing view" → "T022 Round view" → "T023 Feedback and guidance"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup.
2. Phase 2: Foundational. Stop and confirm that the rule passes the hand-worked cases in Node and that the oracle agrees.
3. Phase 3: User Story 1. Stop and play round 1-1.

### Incremental Delivery

1. Foundational: the rule is proven.
2. User Story 1: one complete round, with briefing, decision, explanation and retry.
3. User Story 2: all six rounds, help, summaries and restart.
4. User Story 3: keyboard, reduced motion and narrow window.
5. Polish: evidence and packaging.

If time runs short, stop after a complete phase and reduce the specification's scope explicitly. Correct grading and explanations come before visual effects.

### Single Builder

One build agent works through the phases in order. The `[P]` markers show which tasks do not share a file; they do not imply parallel workers.

---

## Notes

- A task is done when its acceptance evidence exists, not when its box is ticked (constitution, principle VII).
- Expected values in tests come from `tests/fixtures/answer-key.json`, which transcribes the specification. They are never computed by the code under test.
- A check that needs a person (SC-004, SC-008, and a person's own keyboard-only playthrough) is recorded as "not run by the build" until the owner supplies it.
