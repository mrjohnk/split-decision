# Research: Split Decision, first playable version

Phase 0 of `/speckit-plan`. The Technical Context had no open "NEEDS CLARIFICATION" item. These are the decisions that needed evidence or a choice between alternatives.

## R-01 · Where the loss windows come from

- **Decision**: use the N1 (14 to 29 dB) and N2 (16 to 31 dB) classes of ITU-T G.9807.1 (02/2023), Annex B, clause B.6.1, Table B.6.1. Limits are included in the window.
- **Rationale**: it is the XGS-PON standard's own table. The same clause states that an ODN whose loss is under the class minimum must add optical attenuators to protect receivers, which is the subject of level 3. Table B.9.3 gives a maximum differential optical path loss of 15 dB, which equals the width of each window, so "every ONT inside the window" already implies it.
- **How it was read**: the full Recommendation was fetched from the ITU site on 2026-11-19 and the clause read from it. The same table also appears on the ITU's publication page for the Recommendation.
- **Alternatives considered**: the G-PON B+ and C+ classes (also listed in Table B.6.1, for the optional wavelength set) were left out to keep two windows; E1 and E2 were left out for the same reason.

## R-02 · The fiber planning value

- **Decision**: 0.5 dB per km, one value for both directions.
- **Rationale**: ITU-T G.652 (08/2024), Appendix I, Table I.1 gives 0.5 dB/km as the typical link value for 1260 to 1360 nm, the band that contains the XGS-PON upstream wavelength (1260 to 1280 nm). Clause 8, Table 2 gives a G.652.D cable maximum of 0.40 dB/km from 1310 to 1625 nm, with Note 2 adding 0.07 dB/km to extend the range to 1260 nm. Half a dB per km is also easy to do in the head.
- **The simplification and its check**: downstream (1575 to 1580 nm) fiber loses less, 0.35 dB/km in Table I.1. The higher value is the conservative one for the maximum; the lower value is the conservative one for the minimum. A test recomputes every shipped option with 0.35 dB/km and asserts that no ONT's state changes, so the single value decides nothing that the two-value model would decide differently.
- **Alternatives considered**: two values with two checks for each ONT (twice the arithmetic for the same verdicts); 0.35 or 0.40 dB/km (common planning figures, lower than the published value for the upstream band).

## R-03 · Connector, splice and splitter planning values

- **Decision**: connector pair 0.5 dB; fusion splice 0.1 dB; splitters at 3.5 dB per two-way split (1:2 3.5, 1:4 7.0, 1:8 10.5, 1:16 14.0, 1:32 17.5, 1:64 21.0); attenuators at face value. All are presented to the player as the job's planning values.
- **Rationale**: the FOA guide gives about 0.3 dB as a typical connector loss, with 0.75 dB per mated pair and 0.3 dB per splice as the TIA-568 maxima; 0.5 dB and 0.1 dB sit inside those bounds. One published set of splitter maxima (TEC GR/TX/OPT-001: 4.0, 7.1, 10.5, 13.8, 17.1 and 20.5 dB for 1×2 to 1×64) is within about half a dB of the 3.5-per-stage rule at every ratio.
- **What could not be read**: ITU-T G.671 defines splitter insertion loss, but only its abstract could be retrieved on 2026-11-19. No number in the game is attributed to it.
- **Alternatives considered**: the exact values of one manufacturer's or one specification's table (harder to add mentally, and no more authoritative as a planning value); ideal 10·log10(N) splitting loss (understates every real splitter).

## R-04 · Exact arithmetic

- **Decision**: convert every authored decimal to a whole number of thousandths of a dB on load and add integers. The validator rejects any authored value that is not exact at that resolution and any ONT total that is not a whole tenth of a dB.
- **Rationale**: 9.5 + 2.0 + 0.4 + 17.5 must be exactly 29.4 and must compare correctly with 29. Binary floating point gives no such promise at a boundary, and principle I says rounding must never decide an answer.
- **Alternatives considered**: floating point with a tolerance (a tolerance is a rounding rule); decimal strings in the data file (less readable than plain numbers for a reviewer).

## R-05 · One plant description for the evaluator, the diagram and the table

- **Decision**: a round's plant is a tree: the OLT port, then segments (fiber km, connector pairs, splices) leading to splitters or ONTs. A splitter is installed (fixed ratio) or open (the option sets its ratio). The evaluator walks the tree; the diagram and the path table are drawn from the same tree.
- **Rationale**: a separate drawing description could drift from the numbers that are graded. With one tree the picture cannot disagree with the answer.
- **Alternatives considered**: a flat list of elements for each ONT plus a hand-made drawing (two sources of truth); a general graph (no PON needs it).

## R-06 · The answer rule and its outcomes

- **Decision**: the answer is the valid option with the most homes. The chosen option's outcome is one of `best-valid`, `valid-not-best`, `over-max`, `under-min`, `over-and-under`. A round with no valid option (`no-valid-option`) or with a tie for the most homes (`tie-for-best`) is a content error.
- **Rationale**: "how far can I split this route?" has one answer when "valid" is followed by "most homes". Five outcomes are enough to give each kind of mistake its own explanation.
- **Alternatives considered**: exactly one valid option in every round (forces contrived option lists in levels 1 and 2); several accepted answers (the planning input asks to remove that ambiguity from the first version).

## R-07 · Authored explanations that cannot contradict the engine

- **Decision**: an option may carry an authored `note` (the mistake that usually leads to it, or why it works) together with `expect`, the outcome the note was written for. Validation fails when `expect` differs from the computed outcome. Every number in the feedback comes from the evaluator's evidence, never from the note.
- **Rationale**: principle VI. If a length is edited and the outcome changes, the note is caught at load instead of telling the player something false.
- **Extension decided at implementation**: authored text carries value tokens instead of hand-typed dB values, and a briefing's worked example is a small plant that the evaluator computes. A test asserts that no authored text contains a number followed by "dB". If the owner changes the loss card, every sentence follows it, and the validator reports any round whose answer or note outcome changed.
- **Alternatives considered**: free-text feedback for each option (can silently go stale); generated text only (cannot name a misconception).

## R-08 · Rendering

- **Decision**: DOM with native controls, and inline SVG generated from the round's data for two drawings: the plant, and the loss trace (how each ONT's light falls on the way from the OLT port, against the class window). No library.
- **Rationale**: native radio buttons, buttons and `<dialog>` give keyboard behavior and focus handling without custom code; SVG scales to a narrow window; nothing is fetched from another origin.
- **Changed at implementation, 2026-11-19**: (1) The planning input asked for one light meter for each ONT, a scale with a marker. The build draws one loss trace instead, with a line for each ONT, and keeps a meter row for each ONT under it (name, total, state word and shape). The trace shows where on the path the light is lost, which is the thing the game teaches; a marker on a scale shows only the total. A stretch of path that several ONTs share is drawn once, in a neutral color. (2) The plan said system fonts. The build vendors two open-licensed families, Barlow and Barlow Condensed (SIL Open Font License 1.1), in `assets/fonts/` with their license texts, because label widths in the drawings and the page's character depend on the typeface. They are served from the game's own folder, so FR-028 and SC-009 still hold; `tools/e2e.py` checks that every request stays under the game's own path.
- **Alternatives considered**: Three.js, the workshop deck's suggestion (a 3D scene adds a dependency and needs a parallel accessible view for no teaching gain here); Canvas 2D (no text equivalent without duplicating the scene in the DOM).

## R-09 · Tests that run in two places

- **Decision**: test modules are plain ES modules that register cases with a shared harness. `tests/index.html` runs them in the browser and shows totals and failed case IDs; `tests/run-node.mjs` runs the same modules in Node and exits non-zero on any failure or when no test was found. Expected values come from `tests/fixtures/answer-key.json`, transcribed from the specification's hand-worked tables. `tools/oracle.py` recomputes that key from `data/levels.json` with Python's `decimal` module.
- **Rationale**: the planning input asks for a dependency-free browser runner; a terminal run makes the result reproducible by a script. Two implementations in two languages agreeing with a hand-worked key is stronger evidence than one.
- **Alternatives considered**: a test framework (a dependency for a few dozen assertions); expected values computed by the evaluator (the planning input forbids it).

## R-10 · Motion and state signals

- **Decision**: on Submit the result is written to the page at once; the loss trace then draws itself once, from left to right in under a second, and the end markers appear. With `prefers-reduced-motion: reduce` nothing is animated: the script does not start the drawing, and the style sheet cancels it as a second guard. Each state has a word and a shape: a ring for inside the window, a downward chevron for too dark, a sunburst for too bright.
- **Changed at implementation, 2026-11-19**: the plan named a light pulse on the diagram and a sliding marker. With the loss trace (R-08) the one motion is the trace drawing itself. It is the only animation in the game; `tools/e2e.py` asserts that the only animation names are `draw-trace` and `show-ends`, and that there are none under reduced motion.
- **Rationale**: FR-025 and FR-026. Motion is decoration over information that is already present.
- **Alternatives considered**: revealing the result at the end of the animation (delays feedback); color-only states.
