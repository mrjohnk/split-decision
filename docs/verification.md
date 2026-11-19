# Verification record

Results of every check, as they were run. Times are UTC. A check that was not run says so, and a check run only by a script says that too.

Everything here was run by the build agent on 2026-11-19 in its cloud workspace: Linux, Node v22.23.5, Python 3.13.18, Playwright 1.63.0 driving headless Chrome for Testing 153.0.8010.12. No person has played the game yet.

## Summary

### Acceptance criteria

| ID | Criterion, in short | Result | Evidence |
| --- | --- | --- | --- |
| AC1 | A fresh session opens on the Level 1 briefing; nothing can be answered before Start | Pass | browser check `AC1`; unit tests `state/AC1` |
| AC2 | Round 1-1 with 1:32: solved, 26.9 dB, ledger 7.0 + 2.0 + 0.4 + 17.5 | Pass | `AC2`; unit `feedback/AC2`; oracle |
| AC3a | Round 1-1 with 1:64: too dark, 30.4 dB, 1.4 dB over 29 dB; retry possible | Pass | `AC3a`; unit `feedback/AC3a` |
| AC3b | Round 1-1 with 1:16: works at 23.4 dB, a larger option also fits, the answer is not named | Pass | `AC3b`, `FULL` |
| AC4 | Submitting with nothing selected gives guidance and counts nothing | Pass | `AC4`; unit `state/AC4` |
| AC5 | Hint 1, hint 2, worked solution in order; each is recorded as help; none completes the round | Pass | `AC5`; unit tests of the session |
| AC6 | Each graded submission is one attempt; the answer completes the round once; a repeat changes nothing | Pass | `AC6`; unit tests of the session |
| AC7 | Next opens the following round, the next briefing with the level summary, then the session summary | Pass | `AC7` |
| AC8 | Restart asks first; cancelling keeps the session exactly; confirming clears it | Pass | `AC8` (the page is compared byte for byte before and after cancelling) |
| AC9 | Every core action works from the keyboard, with visible focus and an accessible name | Pass, by automation | `KEYBOARD`, `NAMES`. **Not run by a person** |
| AC10 | Feedback is text, persists, and is announced; under reduced motion the same information appears without animation | Pass, by automation | `AC10`, `MOTION`. **No screen reader was used**: the check reads the live region's text |

### Success criteria

| ID | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| SC-001 | All 20 option outcomes and 4 boundary cases match the hand-worked results | Pass | 158 of 158 unit tests; `tools/oracle.py`, 169 of 169 comparisons; `FULL` compares all 20 in the page |
| SC-002 | Every incorrect submission names the ONT, its loss, the limit and the difference | Pass | `FULL` checks each line of each of the 14 incorrect submissions |
| SC-003 | The game can be completed with the keyboard only | Pass, by automation | `KEYBOARD`: 114 key presses, no pointer. **Not run by a person** |
| SC-004 | A first-time player completes the game in 10 to 15 minutes | **Not run** | Needs a person. Waiting for the owner |
| SC-005 | None of the unsupported-content cases U1 to U6 can be opened or graded | Pass | unit tests `content/U1` to `U6`; `CONTENT` shows each one in the page |
| SC-006 | With reduced motion, feedback is readable as soon as a submission is made | Pass | `MOTION`: 0 animations, headline and totals present in the same step |
| SC-007 | At 320 CSS pixels, Submit, Hint and Next are reachable without scrolling sideways | Pass | `NARROW`: 36 view and width combinations |
| SC-008 | A teammate can say what each level taught and what a wrong choice showed them | **Not run** | Needs a person. Waiting for the owner |
| SC-009 | No request leaves the game's own origin | Pass | `ORIGIN`: 19 requests in a full playthrough, all under the game's path, fonts included |

### What was not checked

- **No person has played the game.** SC-004 and SC-008 need one, and so does a real keyboard-only playthrough.
- **One browser.** Only headless Chrome for Testing 153 was available. Firefox, Safari, a real phone and a touch screen were not tried.
- **No screen reader.** Accessible names, roles and the live region's text were checked through the browser's accessibility tree, not by listening.
- **Windows high-contrast mode.** The style sheet has rules for it; they were not exercised.
- **The teaching content has not been reviewed by a person.** The build agent traced every stated value to a source (below). The loss card's planning values are the build agent's choice and wait for the owner, who knows this field.
- **The private review copy** published for the owner as a Claude artifact was not opened by the build agent, which cannot reach it. Whether it runs in that viewer is for the owner to report.

## The rule, the content and the session

### First run (2026-11-19 14:48)

| Check | Command | Result |
| --- | --- | --- |
| Tests written first fail without the engine | `node tests/run-node.mjs` before `engine/` existed | Failed as expected: "Cannot find module engine/rules.js" |
| Unit tests | `node tests/run-node.mjs` | 151 passed, 0 failed, 151 total |
| Independent answer-key check | `python3 tools/oracle.py` | All 169 checks agree with the hand-worked key |
| The tests catch planted bugs | Four temporary changes to the engine, each reverted | Each was caught (see below) |

### Current (2026-11-19 15:36)

| Check | Command | Result |
| --- | --- | --- |
| Unit tests | `node tests/run-node.mjs` | 158 passed, 0 failed, 158 total |
| The same tests in the browser | `http://127.0.0.1:<port>/tests/`, through `tools/e2e.py UNIT` | 158 passed, 0 failed, 158 total |
| Independent answer-key check | `python3 tools/oracle.py` | All 169 checks agree with the hand-worked key |

Seven tests were added while the page was built: the loss trace adds up to the ledger step by step and ends at each ONT's total (2); ONTs that share a feeder share the first steps of their traces, and shared steps are marked as shared (2); only the answer's headline says "Correct"; no worked example repeats a challenge's numbers (FR-002); every answer keeps the paths of its PON within 15 dB of each other.

The trial round asked for by task T043 is the test `content/a trial round is graded without changing the engine`: a seventh round added as data only validates and is graded.

## The page: browser checks (2026-11-19 15:41)

`python3 tools/e2e.py` serves the repository under a subpath (`/play/split-decision/`), as a project site would, and drives headless Chrome. Expected values come from `tests/fixtures/answer-key.json` and from the specification, never from the game's own code. Results are also in `docs/verification/results.json`.

| Check | Covers | Result | What it found |
| --- | --- | --- | --- |
| `AC1` A fresh session opens on the Level 1 briefing and nothing can be answered before Start | AC1, FR-001, FR-002, FR-003 | Pass | Level 1 briefing first; after Start the round shows the plant, the path table, the loss card, the window, the goal and three options with the homes they serve |
| `AC2` Round 1-1 with a 1:32 splitter: solved, 26.9 dB, ledger 7.0 + 2.0 + 0.4 + 17.5 | AC2, FR-006, FR-009 | Pass | ONT A: Fiber 7.0 + connector pairs 2.0 + splices 0.4 + splitter 17.5 = 26.9 dB |
| `AC3a` Round 1-1 with a 1:64 splitter: too dark, 30.4 dB, 1.4 dB over 29 dB, round stays open | AC3a, FR-010, SC-002 | Pass | Too dark ONT A: 30.4 dB. That is 1.4 dB over the N1 maximum of 29 dB. The retry solved the round on attempt 2. |
| `AC3b` Round 1-1 with a 1:16 splitter: works at 23.4 dB, a larger one also fits, the answer is not named | AC3b, FR-011 | Pass | This design works, and a larger one also fits. |
| `AC4` Submitting with nothing selected gives guidance and counts nothing | AC4, FR-005, FR-012 | Pass | Choose a design first, then submit. Nothing was counted. Selecting a design grades nothing. |
| `AC5` Hint 1, hint 2 and the worked solution appear in order, count as help and do not complete the round | AC5, FR-014 | Pass | Level complete: Add it up  Work orders solved 2 of 2 Attempts 2 Hints used 2 Worked solutions viewed 1 |
| `AC6` Each real submission is one attempt; the answer completes the round once; a repeat changes nothing | AC6, FR-013 | Pass | Attempts: 3. Hints used: 0. Worked solution: not viewed. |
| `AC7` Next opens the following round, then the next briefing with the level summary, then the session summary | AC7, FR-015, FR-016 | Pass | Next work order > Next level > Next work order > Next level > Next work order > See summary |
| `AC8` Restart asks first; Keep playing changes nothing; Restart the game clears the session | AC8, FR-017 | Pass | cancel and Escape keep the session; confirm clears it |
| `FULL` All 20 options of the six rounds, submitted in the page, match the hand-worked key | SC-001, SC-002, FR-006 to FR-011, FR-016, FR-026 | Pass | 20 submissions compared with the key: totals, states, outcomes, limits and differences |
| `RELOAD` Reloading the page in mid-game returns to the first briefing with no progress | FR-018 | Pass | fresh start after reload; nothing in localStorage, sessionStorage or cookies |
| `KEYBOARD` The whole game is played from the first briefing to the summary with the keyboard only, at 1366 x 768 | AC9, SC-003, FR-023 | Pass | start, select, submit, hint, solution, next, restart, confirm and cancel, all by keyboard (114 key presses, no pointer) |
| `NAMES` Every control has the accessible name the contract gives it | AC9, FR-023 | Pass | buttons, radios, group, dialog, landmarks and scroll regions are named |
| `AC10` Feedback is text, stays until the next submission or view, names its design and is announced | AC10, FR-024 | Pass | Your design: 1:64 splitter. Too dark at ONT A. ONT A: 30.4 dB. That is 1.4 dB over the N1 maximum of 29 dB. The splitter is the biggest single loss on the path. Add its loss to the 9.4 dB that is already there before comparing with the maximum. Next step: l… |
| `MOTION` The result is readable at once; the trace draws itself only when motion is allowed, and then stops | AC10, FR-025, SC-006 | Pass | reduced motion: 0 animations, result present at once; otherwise the trace draws once in under 1.5 s |
| `CONTRAST` Every piece of text has a contrast of at least 4.5 to 1 with what is behind it | principle IV, contracts/ui.md | Pass | 1726 pieces of text in 12 views, 14 color pairs; the lowest contrast is 5.01 to 1 |
| `TEXTSIZE` Running text is at least 16 CSS pixels; labels inside the drawings are at least 12 | contracts/ui.md | Pass | smallest running text 16px; smallest drawing label 12px |
| `NARROW` At 320 CSS pixels wide the page never scrolls sideways and Submit, Hint and Next can be reached | SC-007, FR-027 | Pass | 36 view and width combinations at 320, 390 and 768 pixels |
| `ORIGIN` A full playthrough makes no request outside the game's own origin, and the fonts come from the game | SC-009, FR-028 | Pass | 19 requests, all under /play/split-decision/ (css, html, js, json, svg, woff2); fonts: barlow-condensed-latin-500-normal.woff2, barlow-condensed-latin-600-normal.woff2, barlow-latin-400-normal.woff2, barlow-latin-500-normal.woff2, barlow-latin-600-normal.woff2 |
| `CONTENT` Content that cannot be graded (U1 to U6), or cannot be read, shows a content error and no challenge | SC-005, FR-019, FR-020 | Pass | U1 no-valid-option; U2 tie-for-best; U3 unknown-ratio; U4 inexact-total; U5 note-mismatch; U6 unknown-source; a missing file reports load-failed and Try loading again recovers |
| `DIALOGS` The briefing can be reviewed during a round; the model panel lists the rule, the limits of the model and every source | FR-004, FR-021, FR-022 | Pass | 6 sources, each with its section and an https link |
| `UNIT` The unit tests pass in the browser, on the same modules the game runs | SC-001 | Pass | 158 passed, 0 failed, 158 total |
| `SHOTS` Screenshots of the briefing and of level 3 for the record | FR-002 | Pass | written to docs/verification/ |

**23 passed, 0 failed, 23 checks**, in 41.4 s, with Chrome for Testing 153.0.8010.12 (headless).

Screenshots written by the run, in `docs/verification/`:

| File | Shows |
| --- | --- |
| `01-briefing-level-1.png` | The Level 1 briefing with its worked example |
| `02-round-1-1-too-dark.png` | Round 1-1 after submitting the 1:64 splitter |
| `03-round-1-1-correct.png` | Round 1-1 solved with the 1:32 splitter |
| `04-round-2-1-three-onts.png` | Round 2-1: three ONTs on one trace |
| `05-round-3-2-bright-and-dark.png` | Round 3-2: one ONT too bright and one too dark |
| `06-summary.png` | The session summary |
| `07-narrow-320.png` | Round 2-1 at 320 CSS pixels wide, full page |
| `08-model-and-sources.png` | The Model and sources panel |
| `09-content-error.png` | The content error for case U1 |
| `10-briefing-level-3.png` | The Level 3 briefing with Level 2's summary, full page |

## Do the checks mean anything? Planted bugs

A suite that passes on its first run has not shown that it can fail. Each bug below was planted alone, the named check was run, and the file was restored.

### In the engine (2026-11-19 14:48)

| Planted bug | Caught by |
| --- | --- |
| A path exactly at the maximum treated as outside the window | `rules/boundary/B1` (1 test failed) |
| Connector pairs left out of the sum | 73 tests failed |
| An empty submission counted as an attempt | `state/AC4` (1 test failed) |
| Feedback for a wrong answer names the answer | 14 tests failed |

### In the page (2026-11-19 15:20 to 15:25): 12 of 12 caught

| Planted bug | Caught by | What the check said |
| --- | --- | --- |
| Focus is not moved after a submission | `KEYBOARD` | focus was not on Submit after a wrong design |
| The script ignores reduced motion | `MOTION` | "with reduced motion something still moves" |
| Secondary text made too pale | `CONTRAST` | 2.18 to 1 on the header line |
| A meter shows a wrong total | `FULL` | "the meter shows 23.40, the key says 23.4" |
| The loss card made too wide for a phone | `NARROW` | "the page is 512 wide in a window of 320" |
| A font fetched from another site | `ORIGIN` | "requests left the game: fonts.googleapis.com…" |
| The tally set in 13-pixel type | `TEXTSIZE` | "(tally) is 13px" |
| A wrong design's feedback names the answer | `AC3b` | "names the answer '1:32 splitter'" |
| An empty submission counts as an attempt | `AC4` | "an empty submission changed the round" |
| Restart does not ask | `AC8` | "Restart did not ask" |
| An option has no accessible name | `NAMES` | "no radio is named '1:16 splitter'" |
| Content with no valid option is not reported | `CONTENT` | the content error never appeared |

## Faults the checks found in the game

| Found by | Fault | Fix |
| --- | --- | --- |
| `KEYBOARD`, failing about one run in six | The restart dialog listened for its `close` event to treat Escape as "Keep playing". That event arrives late. If the dialog was closed and reopened quickly, the late event from the first closing cancelled the second dialog | Listen for the dialog's `cancel` event, which belongs to one opening. `KEYBOARD` and `AC8` then passed 16 times out of 16 |
| `NAMES`, `AC5`, `AC10` | An option's accessible name read "1:16 splitter . Serves 16 homes", with a stray period from a hidden separator inside the label | The separator was removed. The name is now the label, and the homes served are the option's description |
| `UNIT` | The browser test page requested a favicon that does not exist (a 404) | The test page now names the game's icon |
| Reading the first screenshots | After Submit on a laptop screen the result was below the window | The page now moves just far enough to show the trace and the lines under it |
| Reading the first screenshots | On a PON with several ONTs the lines covered each other on the shared feeder, so only one color showed | A stretch shared by several ONTs is drawn once in a neutral color |
| Reading the 320-pixel screenshots | Labels in the plant drawing collided on short runs and beside an attenuator | Labels are placed in the free part of a run, and a zero-length run is labeled "0 km" where "at the splitter" does not fit |
| Reviewing the text (below) | A label written as a title appeared in mid-sentence ("from the Remote OLT port") | Labels used inside a sentence are lowercased |

Three faults were in the checks themselves and were fixed there: a case-sensitive comparison of a lowercased ledger, focus on the browser's own controls read as an error, and a wait for the wrong status on the test page.

One fault in the page also weakened a check. A hidden separator was first placed inside each option's label, and the check read it as part of the label, so the comparison "feedback never names the answer" could not have failed. Once the separator was gone, the planted bug above confirmed that the comparison can fail.

## Review of the teaching content against the sources (task T042)

Done by the build agent on 2026-11-19, reading every briefing, hint, note and explanation as the player sees it (all tokens filled). **Not reviewed by a person.**

No authored sentence contains a typed dB value: the test `content/no authored text carries a hand-typed dB value` enforces it. Every number the player reads therefore comes from one of the rows below, through the loss card, the class table or the evaluator.

| Stated in the game | Value | Source | Status |
| --- | --- | --- | --- |
| N1 loss window | 14 to 29 dB | R1: ITU-T G.9807.1 (02/2023) Annex B, clause B.6.1, Table B.6.1 | Read in the standard by the build agent |
| N2 loss window | 16 to 31 dB | R1, same table | Read in the standard by the build agent |
| "The standard requires [an attenuator] wherever a path would fall below the class minimum" | | R1, clause B.6.1 | Read in the standard by the build agent |
| The window applies between the OLT and ONT and includes splices, connectors and attenuators | | R2: G.9807.1 Annex B, clause B.9.2.6.1 | Read in the standard by the build agent |
| Downstream 1575 to 1580 nm, upstream 1260 to 1280 nm | | R2: Tables B.9.2 to B.9.4 | Read in the standard by the build agent |
| Paths on one PON may differ by at most 15 dB (stated in the source list; not graded) | 15 dB | R2: clause B.9.2.8.1 | Read in the standard. The unit test `rules/every answer keeps the paths of its PON within 15 dB` confirms the game's sentence that every answer is within it |
| Fiber, per km | 0.5 dB | R3: ITU-T G.652 (08/2024) Appendix I, Table I.1, typical link value for 1260 to 1360 nm | Read in the standard. It is the higher, upstream value, used for both directions (decision D4) |
| "Fiber loses more per km upstream than downstream" | 0.5 against 0.35 dB/km | R3, same table | Read in the standard |
| Connector pair | 0.5 dB | R4: FOA guide, typical 0.3 dB per connector, TIA-568 maximum 0.75 dB per mated pair | **A planning value chosen by the build agent** inside the published range (decision D2). For the owner to confirm |
| Fusion splice | 0.1 dB | R4: FOA guide, TIA-568 maximum 0.3 dB | **A planning value chosen by the build agent** under the published maximum (decision D2). For the owner to confirm |
| Splitters | 3.5 dB for each two-way split: 3.5, 7.0, 10.5, 14.0, 17.5, 21.0 dB | R6: TEC GR/TX/OPT-001 lists maximums of 4.0, 7.1, 10.5, 13.8, 17.1 and 20.5 dB | **A planning rule chosen by the build agent**, within 0.5 dB of each published maximum (decision D2). For the owner to confirm. ITU-T G.671 could not be read, and nothing is attributed to it |
| "A signal that arrives too strong overloads [the receiver]"; an attenuator adds the missing loss | | R5: FOA guide on attenuators | Read on the FOA page |
| A two-stage split multiplies the homes and adds the losses | | Follows from the rule (FR-006) | Unit test `feedback/a two-stage ledger lists both splitters`; hand-worked round 2-2 |
| Every total, margin and difference in a ledger, a hint, a note or an explanation | | Computed by `engine/rules.js` | Matches the hand-worked key (SC-001) |

Wording changed by this review: the term "Connector pair" now reads "0.5 dB for the pair" instead of "0.5 dB each", which could be read as each connector. A line in "What the game leaves out" that only repeated the ONT and ONU note was replaced by the standard's limit on the difference between two paths, which the game does not grade. The tagline was shortened.

## Quickstart scenarios (task T049)

The seven scenarios of `specs/001-loss-budget-game/quickstart.md`, each as run by the browser checks. **None was walked through by a person.**

| # | Scenario | Result | Run as |
| --- | --- | --- | --- |
| 1 | First decision (AC1 to AC4) | Pass | `AC1`, `AC2`, `AC3a`, `AC3b`, `AC4` |
| 2 | Help and progress (AC5 to AC7) | Pass | `AC5`, `AC7` |
| 3 | Restart (AC8) | Pass | `AC8` |
| 4 | Too much light: round 3-1 as drawn is too bright at 12.2 and 12.3 dB; round 3-2 with the attenuator at the OLT port leaves ONT B too dark at 37.4 dB | Pass | `FULL` submits both and compares them with the key |
| 5 | Keyboard only (AC9) | Pass | `KEYBOARD` |
| 6 | Reduced motion and narrow window | Pass | `MOTION`, `NARROW` |
| 7 | Unsupported content (FR-019) | Pass | unit tests `content/U1` to `U6`; `CONTENT` |

## Fresh copy (task T048)

Run on 2026-11-19 from 15:42:05 to 15:42:50, on commit `f5c2bfa`, cloned with `git clone` into a new, empty folder (97 tracked files). Commits after `f5c2bfa` change documents only.

| Step | Command, in the fresh copy | Result |
| --- | --- | --- |
| Unit tests | `node tests/run-node.mjs` | 158 passed, 0 failed, 158 total |
| Independent answer-key check | `python3 tools/oracle.py` | All 169 checks agree with the hand-worked key |
| Browser checks | `python3 tools/e2e.py` | 23 passed, 0 failed, 23 checks, 42.1 s |
| The README's own instructions | `python3 -m http.server <free port> --bind 127.0.0.1`, then the address opened in headless Chrome | The Level 1 briefing "Add it up" appeared; round 1-1 with the 1:32 splitter gave "Correct. ONT A is inside the window." at 26.9 dB; `/tests/` reported 158 passed, 0 failed; no failed request and no page error |

After the run the fresh copy differed from the commit only in `docs/verification/results.json`, which records the time of the run: the ten screenshots came out byte for byte the same.

## The line colors of the loss trace

The three line colors were checked on the panel's background with the data-visualization skill's validator before any drawing code was written:

```text
$ node validate_palette.js "#3987e5,#d95926,#199e70" --mode dark --surface "#10323F" --pairs all

Palette (dark, surface #10323F, categorical): 3 slots
  [PASS] Lightness band         all 3 inside L 0.48–0.67
  [PASS] Chroma floor           all 3 >= 0.1
  [PASS] CVD separation         worst all-pairs #199e70↔#d95926 ΔE 9.4 (deutan) · tritan 4.0
  [PASS] Normal-vision floor    worst all-pairs #199e70↔#3987e5 ΔE 20.9 (normal)
  [PASS] Contrast vs surface    all 3 >= 3:1

  → ALL CHECKS PASS
```

Re-run on 2026-11-19 at about 15:38 with the same result. Text on the panel never takes a line's color, and each ONT is also named at the end of its line and in its meter row, so color is never the only way to tell the lines apart. The pale line for a stretch that several ONTs share is not one of the three: it is the panel's secondary text color, and the legend names it.
