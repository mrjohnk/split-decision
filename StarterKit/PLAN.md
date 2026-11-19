# Split Decision · Implementation plan

> **Amended by the owner's first review, 2026-11-19.** The feature plan, `specs/001-loss-budget-game/plan.md`, lists what changed after this planning input was written: one loss window of 8 to 28 dB in place of the N1 and N2 classes, the data fields `connectors` and `connectorDb` in place of `connectorPairs` and `connectorPairDb`, and the loss trace in place of the light meters. This file is kept as the planning input it was.
>
> **Amended again by the owner's second review, 2026-11-19.** The owner said that 8 and 28 are the ONT's receive levels, and gave the launch power. The game now has a launch power of +5 dBm and a receive window of −28 dBm to −8 dBm, works out a receive level for every ONT, and names its outcomes too-dark, too-bright and dark-and-bright (specification, decisions D13 to D16; constitution 1.2.0). Everything below about loss windows, their limits and the hand-worked numbers is the first version's.
>
> **After the second review, 2026-11-19.** The owner confirmed the launch power, +5 dBm, and kept the loss card as it is (specification, decision D17). The Arcade card image is no longer a screenshot: the game's engine draws it (decision D18, FR-030). Neither changed the game.

## Build target

Implement the clarified specification for Split Decision. First deliver one complete round with correct grading, explanatory feedback, retry, and advance. Then add content and polish through the same implementation.

**Hardest behavior to get right:** choosing the single answer when more than one option is inside the window, and telling "too dark" (over the maximum) from "too bright" (under the minimum) for each ONT, with arithmetic that is exact to 0.1 dB.

**First evidence we'll check:** round 1-2 from the specification: with a 1:32 splitter ONT A is at 29.4 dB, 0.4 dB over the N1 maximum, and with a 1:16 it is at 25.9 dB, inside the window. Then boundary case B1: exactly 29.0 dB is inside.

## Stack and serving

- Semantic HTML, CSS, and native JavaScript modules. No framework, bundler, backend, or runtime model.
- DOM controls, plus inline SVG for the PON diagram and the loss trace (first written as "light meters"; changed on 2026-11-19, see the feature plan). The SVG is generated from the round's data. No rendering dependency. Every value in the diagram also appears in an HTML table.
- `data/levels.json` for authored content; load it over HTTP using a relative URL.
- In-memory session state. Reload starts a fresh session, as specified. No persistence in v1.
- Static hosting, including a repository subpath such as GitHub Pages. Use relative asset paths and case-correct filenames.
- Developer-only tooling, not needed to play: Node 20 or later runs the same test modules from a terminal; Python 3 runs an independent answer-key check; Playwright drives the browser checks.

Preview from the repository root after implementation creates `index.html`:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open **http://127.0.0.1:8000**. On Windows use `py` in place of `python3`. Native modules and JSON fetching need a web server; opening the HTML with `file://` is not the supported run path. [MDN reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules).

## Proposed files and responsibilities

```text
index.html                   Semantic page shell and module entry point
style.css                    Layout, focus, feedback states, reduced motion
main.js                      Load → validate → start; render loading/errors
engine/
  rules.js                   Pure domain evaluation; no DOM or progress changes
  content.js                 Validate authored level data and source references
  state.js                   Session transitions, attempts, completion, restart
  feedback.js                Explain structured evaluation results
ui/
  render.js                  Briefing, challenge, feedback, and summary views
  diagram.js                 PON diagram and loss trace as SVG, from round data
  controls.js                Input events and keyboard/focus behavior
data/
  levels.json                Loss card, classes, briefings, rounds, hints, sources
tests/
  index.html                 Browser test runner with visible pass/fail summary
  run-node.mjs               Runs the same test modules from a terminal
  harness.js                 Tiny assertion and reporting helper
  rules.test.js              Independent expected results from the specification
  state.test.js              Attempts, assistance, duplicate submit, progression
  content.test.js            Invalid/missing/ambiguous authored data
  fixtures/answer-key.json   The specification's hand-worked results, transcribed
tools/
  oracle.py                  Independent recomputation of the answer key
  e2e.py                     Browser playthrough checks (developer-only)
README.md                    Actual run instructions, behavior, and evidence
```

Use `data/` and `tests/` at the root alongside `engine/` and `ui/`. Keep modules small enough to understand.

## Data contract

One document containing `schemaVersion`, `sources`, `lossCard`, `classes` and `levels`. Each level has a unique ID, title, learning outcome, briefing, source IDs, and two ordered rounds. Each round has a unique ID, a title, a class, a goal sentence, the plant, the options, and ordered hints.

**Domain fields:**

- `lossCard`: `fiberDbPerKm`, `connectorPairDb`, `spliceDb` (dB, greater than zero), and `splitterDb`, a map from split ratio (2, 4, 8, 16, 32, 64) to dB.
- `classes`: a map from class name to `minDb` and `maxDb`, with `minDb` less than `maxDb`.
- `plant`: a tree. `plant.trunk` is a segment from the OLT port. A segment has `fiberKm` (0 or more), `connectorPairs` and `splices` (whole numbers, 0 or more) and `to`, a node. A node is a splitter (`id`, `label`, a fixed `ratio` or `ratio: null` when the option chooses it, and `legs`, a list of segments) or an ONT (`id`, `label`, optional `note`).
- `options`: each has `id`, `label`, `served` (whole number of homes, 1 or more), `splitters` (a map from open splitter ID to ratio), `attenuators` (a list of `{ at, db }` where `at` is `"olt"` for the OLT port, shared by every ONT, or an ONT ID) and an optional authored `note` with the `expect` outcome it was written for.

**Choice representation:** the option's stable `id`. The answer is never a list position or a label.

**Validation rules:** reject the whole file when any of these is found, naming the level and round: a missing or mistyped field; duplicate level, round, ONT, splitter or option IDs; a class or split ratio that is not defined; an open splitter that an option does not set, or an option that sets an unknown splitter; an attenuator at an unknown place; a negative length or count; a value that makes any total inexact at 0.1 dB; a round with no valid option; a tie between valid options for the most homes; an authored note whose `expect` differs from the evaluator's outcome for that option; a source ID that is not defined; fewer than two hints; a level without exactly two rounds.

The loader must validate the whole content file before starting. Show a useful content error with the level/round ID; do not count it as a learner attempt. Briefings and hints reference source records with a title, URL, section, and supported claim. Fixed wording and per-level content live in data; numeric reasoning is assembled from evaluator results.

## Domain evaluation contract

```text
evaluate(content, round, answer) → {
  status: "correct" | "incorrect" | "invalid-input" | "content-error",
  expected: { optionId } for the answer, or null,
  reasonCode: "best-valid" | "valid-not-best" | "over-max" | "under-min" |
              "over-and-under" | "no-selection" | "unknown-option" | content error code,
  evidence: { window, served, onts: [{ id, totalDb, state, marginDb, ledger }], best }
}
```

- This is a pure function: same inputs, same result; no DOM, timer, network, random choice, or score changes.
- Algorithm: for the chosen option, walk the plant from the OLT port to each ONT and add, in whole thousandths of a dB, the fiber, connector, splice, splitter and attenuator losses on that path. Mark each ONT `ok` when minimum ≤ total ≤ maximum, `over` when above the maximum, `under` when below the minimum. The option is valid when every ONT is `ok`. Do the same for every option of the round; the answer is the valid option with the largest `served`. The UI must not choose the correct answer by position, label, or animation destination.
- Outcome of the chosen option: `best-valid` when it is the answer; `valid-not-best` when valid but another valid option serves more; `over-max` when at least one ONT is over and none is under; `under-min` when at least one is under and none is over; `over-and-under` when both occur.
- Distinguish a learner's incorrect decision from invalid input (nothing selected, or an option ID that the round does not have) and broken authored content.
- Expected answers in tests come from the specification's hand-worked cases. They are never calculated by calling the evaluator under test. `tools/oracle.py` recomputes the same cases independently, in another language.

**Feedback example:** round 1-2, option 1:32, reason code `over-max`: "Too dark at ONT A. 29.4 dB is 0.4 dB over the N1 maximum of 29 dB. Fiber 9.5 + connector pairs 2.0 + splices 0.4 + splitter 17.5 = 29.4 dB. This choice usually comes from leaving out the connectors and splices: without them the path looks like 27.0 dB."

## Session transitions

```text
loading → level briefing → awaiting-answer
                           ├─ invalid input → guidance → awaiting-answer
                           ├─ incorrect → feedback → retry same round
                           └─ correct → feedback → Next → next round / next level briefing / summary
loading/content failure → error screen → retry loading
confirmed Restart → fresh first briefing
```

The state module owns attempts, assistance, completed round IDs, current round, and current view. Selection and hints do not submit an answer. Count valid submissions only while a round is unsolved. Disable Submit after success; guard in state logic as well. Advance only through explicit Next. Restart requires confirmation; cancellation changes nothing.

## Interaction and visual direction

Translate "light that dims at every element" into a compact challenge area, labeled controls, and a persistent explanation area. The PON is drawn left to right, from the OLT port to the ONTs. A loss trace shows each ONT's light falling along its path, with the class window marked on the scale, and a meter row for each ONT gives its total and state (first written as one light meter with a marker for each ONT; changed on 2026-11-19, see the feature plan). Use a clear type hierarchy and one consistent visual language. Motion reveals the consequence: on Submit, light travels the route and each marker moves to its total.

Use native controls where possible, move focus deliberately after screen changes, and announce feedback through a live region. Respect `prefers-reduced-motion`. Display textual values alongside diagrams. A learner must not need animation, color vision, pointer precision, or hover to reason about the answer. "Inside the window", "too dark" and "too bright" are always written as words and marked with different shapes, not only with color.

## Implementation order

| Slice | Deliverable | Evidence before the next slice |
| --- | --- | --- |
| 1 · Prove the rule | Pure evaluator plus the spec's hand-worked and boundary cases | Expected results pass independently of the UI |
| 2 · Complete one round | Briefing, challenge, feedback, retry, Next | One correct and one wrong path work in the browser |
| 3 · Add the curriculum | All six rounds, validation, hints, session summary | Each shipped round agrees with its reviewed cases |
| 4 · Make it usable | Keyboard/focus, reduced motion, narrow layout, clear error states | Checks are recorded |
| 5 · Package the result | README, card image, ARCADE.md, optional hosting | Another attendee can run and explain the game |

Generate `tasks.md` from these slices and the actual acceptance criteria. Do not create a large task tree for hypothetical stretch features.

## Verification and reporting

Implement a dependency-free browser test runner at `tests/index.html` that imports the pure modules, runs all assertions, and shows totals plus failed case IDs. It must report zero discovered tests as failure. Open **http://127.0.0.1:8000/tests/** after starting the same server. `node tests/run-node.mjs` runs the same modules from a terminal.

| Check | What must be established |
| --- | --- |
| Domain cases | Every option of every shipped round, and boundary cases B1 to B4, match the hand-worked results |
| Model simplification | Rechecking the minimum with the downstream fiber value (0.35 dB/km) changes no shipped verdict |
| Input/content failures | Invalid submissions do not consume attempts; cases U1 to U6 cannot be graded |
| State transitions | Retry, hints, duplicate submission, level completion, final summary, restart/cancel |
| Source review | Each briefing and explanation agrees with the cited technical rule |
| Browser playthrough | Fresh start to summary, keyboard-only core actions, readable feedback |
| Layout/motion | Typical laptop, narrow viewport, reduced motion |
| Hosting, if used | Assets and data load under the published repository path |

For each required acceptance criterion, record **pass / fail / not run**, the date, environment, and evidence in the README or a linked verification note. The test runner checks code behavior; a human still reviews the teaching content and actual interaction.

## Scope controls

No persistence, multiplayer, runtime AI, procedural scenario generator, editor, or audio in v1. If time runs short, propose the smallest coherent reduction to the specification and update the tasks. Do not hide skipped checks or silently weaken correctness.

---

Adapted from the NAF AC6 workshop StarterKit (`WORKSHOP/LAB/StarterKit/PLAN.md` in [automateyournetwork/NAF_AC6](https://github.com/automateyournetwork/NAF_AC6), Apache-2.0).
