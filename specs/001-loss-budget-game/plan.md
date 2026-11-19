# Implementation Plan: Split Decision, first playable version

**Branch**: `001-loss-budget-game` (feature directory; commits are on `main`) | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-loss-budget-game/spec.md`, and the owner's planning input `StarterKit/PLAN.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Split Decision is a static browser game that teaches XGS-PON optical loss budgeting. Each of six rounds shows a small PON and asks the player to choose one design option. A pure rule engine adds every loss on each ONT's path in whole thousandths of a dB, classes each ONT as inside the window, too dark or too bright, and takes as the answer the valid option that serves the most homes. Authored content lives in one JSON file that is validated in full before play. The first slice proves the rule against the specification's hand-worked cases before any screen exists.

## Technical Context

**Language/Version**: HTML5, CSS and JavaScript (ES2020 native modules) run directly by the browser; no transpiler or bundler

**Primary Dependencies**: none at runtime. Two vendored font families (Barlow, Barlow Condensed; SIL Open Font License 1.1) are static assets, not code

**Storage**: N/A. Session state is held in memory; a reload starts a fresh session (FR-018)

**Testing**: a dependency-free browser test runner at `tests/index.html`; the same test modules run from a terminal with `node tests/run-node.mjs` (Node 20 or later); `python3 tools/oracle.py` recomputes the answer key independently; `python3 tools/e2e.py` drives a browser through the acceptance scenarios (developer-only, needs Playwright)

**Target Platform**: current desktop and laptop browsers, served as static files, including under a repository subpath such as GitHub Pages

**Project Type**: static web application, single project

**Performance Goals**: feedback text is in the page in the same task as the submission; no asset larger than the card image; nothing to download but the game's own files

**Constraints**: no request to another origin (FR-028); every total exact to 0.1 dB (FR-006); every core action operable by keyboard (FR-023); usable at 320 CSS pixels wide (FR-027); no information carried by motion or by color alone (FR-025, FR-026)

**Scale/Scope**: 3 levels, 6 rounds, 20 options; five views (loading, content error, briefing, round, summary) and three dialogs (briefing review, model and sources, restart confirmation)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | How the plan meets it | Status |
| --- | --- | --- | --- |
| I. Technical truth | Grading reproducible from a documented rule; expected results independent of the code; rounding never decides; unsupported content is not graded | Pure `evaluate` in `engine/rules.js` with integer arithmetic; `tests/fixtures/answer-key.json` transcribed from the specification's hand-worked cases; `tools/oracle.py` in another language; validator rejects inexact totals and cases U1 to U6 | Pass |
| II. Teach through a decision | Briefing before testing; all values visible; specific wrong-answer explanations; hints method first | Level briefings with a worked example; path table and loss card always shown; feedback assembled from evaluator evidence plus an authored note per option; help in fixed order | Pass |
| III. Honest progress | Complete only on a correct submission; no attempt for empty input; no double award | `engine/state.js` owns attempts, assistance and completion; Submit is disabled after success and the reducer guards as well | Pass |
| IV. Access | Keyboard, visible focus, text with color, text equivalent for diagrams, reduced motion, narrow window | Native radio group, buttons and `<dialog>`; a live region for feedback; a generated text description and an HTML path table for every diagram; `prefers-reduced-motion`; single-column layout under 960 CSS pixels | Pass |
| V. Deterministic and self-contained | No account, backend, model or API key; no external content decides an answer | Static files only; no third-party script or style; two open-licensed font families are vendored in `assets/fonts/` and served from the game's own folder (see research R-08) | Pass |
| VI. Content and logic separate | Content in data; rules apart from rendering; validation before play; notes cannot override the engine | `data/levels.json`; `engine/` has no DOM access; `engine/content.js` checks each authored note's `expect` against the evaluator | Pass |
| VII. Done is demonstrated | Reproducible commands; recorded results; failed and untested checks visible | README verification table with pass, fail or not run for each criterion; `docs/verification.md` keeps the raw results | Pass |

**Post-design re-check (after Phase 1)**: no violation introduced. The contracts add no dependency, no persistence and no scoring path outside `engine/rules.js`. Complexity Tracking stays empty.

## Contradictions resolved

The planning input and the clarified specification disagreed in these places. Each is settled here, in the open.

| # | Planning input says | Specification or constitution says | Resolution |
| --- | --- | --- | --- |
| 1 | `evaluate(challenge, answer)` | The loss depends on the loss card and the class table, which are not part of a round | `evaluate(content, round, answer)`; the content carries the card and the classes. Still a pure function |
| 2 | "Hints remain available" | Clarification 3: help is unavailable once a round is solved | Hints stay available through every retry of an open round and close when the round is solved |
| 3 | Feedback for a valid but smaller design names the answer (planning input, AC3) | Principle II: a wrong answer gives a next step; help reveals a method before a solution | Feedback says that a larger option also fits and how many homes this one serves. It does not name the answer. AC3b and FR-011 were corrected in the specification and in `StarterKit/SPEC.md` |
| 4 | `loading → briefing → awaiting-answer` | FR-002 and FR-015: one briefing for each level, carrying the summary of the level just finished | The transition table in `data-model.md` has a briefing before each level |
| 5 | Browser test runner only | Results must be reproducible by another attendee from a fresh checkout | Both runners load the same test modules and must report the same totals; the README gives both commands |
| 6 | The file list has no card image, `ARCADE.md` or verification record | The Arcade submission and principle VII need them | Added: `assets/card.webp`, `ARCADE.md`, `docs/verification.md`, `docs/build-log.md` |
| 7 | "Three.js" is the workshop deck's suggested stack | Principle IV asks for text equivalents and keyboard play; the planning input's default is DOM plus SVG | DOM and inline SVG. No rendering library |

## Project Structure

### Documentation (this feature)

```text
specs/001-loss-budget-game/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── rules.md         # The evaluator: inputs, outcomes, evidence
│   ├── content.md       # The content file and its validation errors
│   ├── session.md       # Session actions and what each may change
│   └── ui.md            # Screens, controls, focus, announcements, test hooks
├── checklists/
│   └── requirements.md  # Specification quality checklist (/speckit-specify)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
index.html                   Semantic page shell and module entry point
style.css                    Layout, focus, feedback states, reduced motion
main.js                      Load → validate → start; render loading and errors
engine/
├── rules.js                 Pure domain evaluation; no DOM or progress changes
├── content.js               Validate authored data and source references
├── state.js                 Session transitions, attempts, assistance, completion
├── tokens.js                Fill value tokens in authored text from computed values
└── feedback.js              Turn an evaluation into the words shown to the player
ui/
├── render.js                Briefing, round, feedback, summary and error views
├── diagram.js               The plant and the loss trace as SVG, from round data
├── dom.js                   Small helpers for building HTML and SVG elements
└── controls.js              Events, keyboard and focus behavior
data/
└── levels.json              Loss card, classes, sources, briefings, rounds, hints
tests/
├── index.html               Browser test runner with a visible pass/fail summary
├── run-node.mjs             Runs the same test modules from a terminal
├── harness.js               Assertion and reporting helper shared by both runners
├── all.js                   The list of test modules; an empty list is a failure
├── rules.test.js            Hand-worked cases, boundaries, the one-value simplification
├── content.test.js          Cases U1 to U6 and the other validation errors
├── state.test.js            Attempts, help, duplicate submit, progression, restart
├── feedback.test.js         Wording carries the numbers the evaluator produced
└── fixtures/
    └── answer-key.json      The specification's hand-worked results, transcribed
tools/
├── oracle.py                Independent recomputation of the answer key (Python)
└── e2e.py                   Browser checks of the acceptance scenarios (Playwright)
assets/
├── card.webp                16:9 card image, captured from the running game
├── favicon.svg              The splitter mark
└── fonts/                   Barlow and Barlow Condensed (woff2) with their OFL license texts
docs/
├── build-log.md             What the build agent did, and when
├── verification.md          Recorded results of every check
├── gameplay.png             Screenshot for the README, captured from the running game
└── verification/            Screenshots written by tools/e2e.py
StarterKit/                  The owner's three planning inputs
package.json                 Marks the .js files as modules for Node; no dependencies
ARCADE.md                    Arcade submission card
README.md                    How to play, run and test; what was verified
```

**Structure Decision**: one static project at the repository root, as the planning input proposed, so that the folder that contains `index.html` can be served as it is by any web server, including GitHub Pages from the root of a branch. `engine/` holds everything that decides an answer and never touches the page; `ui/` holds everything that touches the page and never decides an answer.

## Changes made during implementation

Recorded on 2026-11-19, when the page was built. Each one was applied to the artifact it touches, so the artifacts describe the game as built.

| # | The plan said | The build does | Why | Where it is recorded |
| --- | --- | --- | --- | --- |
| 1 | One light meter for each ONT: a scale with a marker | One loss trace with a line for each ONT, and a meter row for each ONT under it | The trace shows where the light is lost, not only how much is left | research R-08, contracts/ui.md |
| 2 | A light pulse and a sliding marker | The trace draws itself once | One motion, tied to the result | research R-10, contracts/ui.md |
| 3 | System fonts | Barlow and Barlow Condensed, vendored under the Open Font License | Label widths and character; still no request to another origin | research R-08 |
| 4 | Authored text with dB values typed in | Value tokens filled from the loss card and the evaluator; worked examples computed by the evaluator | An owner can change the loss card without leaving a stale sentence behind | research R-07, data-model.md, contracts/content.md |
| 5 | Next is named "Next round" | "Next work order", because the game calls a round a work order everywhere the player reads | Consistent words | contracts/ui.md |
| 6 | An option's accessible name is its label and the homes it serves | The name is the label; the homes it serves are the description | A screen reader says the two apart instead of running them together | contracts/ui.md |
| 7 | "Text is at least 16 CSS pixels" | Running text is at least 16; labels inside the two drawings are at least 12, and every value a player needs from a drawing is also in a table or a line of text | Labels of that size do not fit a drawing at 320 pixels | contracts/ui.md |
| 8 | Nothing about where the result appears | After a submission the page moves just far enough to show the trace and the lines under it; the move is instant | On a laptop the result was below the window | contracts/ui.md |
| 9 | The briefing ends with Start | Start stays at the bottom of the window while the briefing scrolls | A returning player should not have to scroll a page to start | contracts/ui.md |
| 10 | The correct result's headline describes the state | It begins with "Correct." | The headline should say it | contracts/ui.md |

## Implementation order

| Slice | Deliverable | Evidence before the next slice |
| --- | --- | --- |
| 1 · Prove the rule | `engine/rules.js`, the answer-key fixture, `tests/rules.test.js`, `tools/oracle.py` | The 20 option cases and B1 to B4 pass in Node, and the oracle agrees |
| 2 · Complete one round | Content file with round 1-1, validator, session reducer, briefing, round view, feedback, Next | AC1 to AC4 work in the browser for round 1-1 |
| 3 · Add the curriculum | All six rounds, hints, worked solutions, level and session summaries, restart | AC5 to AC8; every shipped round agrees with its cases; U1 to U6 are rejected |
| 4 · Make it usable | Keyboard and focus, live region, reduced motion, narrow layout, model and sources panel | AC9 and AC10; SC-006, SC-007 and SC-009 recorded |
| 5 · Package the result | README, verification record, card image, `ARCADE.md` | A fresh copy of the repository runs with the README's commands |

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. This table is intentionally empty.
