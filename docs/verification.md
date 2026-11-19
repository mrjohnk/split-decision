# Verification record

Results of every check, as they were run. Times are UTC. A check that was not run says so, and a check run only by a script says that too.

Everything here was run by the build agent on 2026-11-19 in its cloud workspace: Linux, Node v22.23.5, Python 3.13.18, Playwright 1.63.0 driving headless Chrome for Testing 153.0.8010.12.

The owner reviewed the game twice on the day it was built. In the morning he looked at the first playable build and sent two changes: limits of 8 and 28 for the window, and "connector" in place of "connector pair". In the afternoon he settled the unit of those limits: they are the ONT's receive levels, −28 and −8 dBm, with a launch power he gave as a five with a hyphen in front, read as +5 dBm. Both reviews are in, and at 21:51 he answered the two points they had left open: the launch power is plus five, and the loss card keeps its values. Every result below is for the game after the second review, unless a heading or a line carries an earlier time. No one has yet played the game through, been timed, or done a keyboard-only run by hand.

## Summary

### Acceptance criteria

| ID | Criterion, in short | Result | Evidence |
| --- | --- | --- | --- |
| AC1 | A fresh session opens on the Level 1 briefing; nothing can be answered before Start | Pass | browser check `AC1`; unit test `state/AC1` |
| AC2 | Round 1-1 with 1:32: solved, 30.7 dB of loss, −25.7 dBm, ledger 9.0 + 3.5 + 0.7 + 17.5 | Pass | `AC2`; unit `feedback/AC2`; oracle |
| AC3a | Round 1-1 with 1:64: too dark, −29.2 dBm, 1.2 dB below the dark limit of −28 dBm; retry possible | Pass | `AC3a`; unit `feedback/AC3a` |
| AC3b | Round 1-1 with 1:16: works at −22.2 dBm, a larger option also fits, the answer is not named | Pass | `AC3b`, `FULL` |
| AC4 | Submitting with nothing selected gives guidance and counts nothing | Pass | `AC4`; unit `state/AC4` |
| AC5 | Hint 1, hint 2, worked solution in order; each is recorded as help; none completes the round | Pass | `AC5`; unit `state/AC5` |
| AC6 | Each graded submission is one attempt; the answer completes the round once; a repeat changes nothing | Pass | `AC6`; unit `state/AC6` |
| AC7 | Next opens the following round, the next briefing with the level summary, then the session summary | Pass | `AC7`; unit `state/AC7` |
| AC8 | Restart asks first; cancelling keeps the session exactly; confirming clears it | Pass | `AC8` (the page is compared byte for byte before and after cancelling); unit `state/AC8` |
| AC9 | Every core action works from the keyboard, with visible focus and an accessible name | Pass, by automation | `KEYBOARD`, `NAMES`, `AXE`. **Not run by a person** |
| AC10 | Feedback is text, persists, and is announced; under reduced motion the same information appears without animation | Pass, by automation | `AC10`, `MOTION`. **No screen reader was used**: the check reads the live region's text |

### Success criteria

| ID | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| SC-001 | All 20 option outcomes and 4 boundary cases match the hand-worked results | Pass | 173 of 173 unit tests; `tools/oracle.py`, 227 of 227 comparisons; `FULL` compares all 20 in the page, loss and receive level |
| SC-002 | Every incorrect submission names the ONT, its loss, its receive level, the limit and the difference | Pass | `FULL` checks each line of each of the 14 incorrect submissions |
| SC-003 | The game can be completed with the keyboard only | Pass, by automation | `KEYBOARD`: key presses only, no pointer. **Not run by a person** |
| SC-004 | A first-time player completes the game in 10 to 15 minutes | **Not run** | Needs a person. Waiting for the owner |
| SC-005 | None of the unsupported-content cases U1 to U6 can be opened or graded | Pass | unit tests `content/U1` to `U6`; `CONTENT` shows each one in the page |
| SC-006 | With reduced motion, feedback is readable as soon as a submission is made | Pass | `MOTION`: 0 animations, headline and totals present in the same step |
| SC-007 | At 320 CSS pixels, Submit, Hint and Next are reachable without scrolling sideways | Pass | `NARROW`: 36 view and width combinations |
| SC-008 | A teammate can say what each level taught and what a wrong choice showed them | **Not run** | Needs a person. Waiting for the owner |
| SC-009 | No request leaves the game's own origin | Pass | `ORIGIN`: every request of a full playthrough is under the game's path, fonts included |

### What was not checked

- **No person has played the game through.** SC-004 and SC-008 need one, and so does a real keyboard-only playthrough. The owner has reviewed the game twice and changed its window, one term and the unit of the window; he has not reported a full playthrough.
- **One browser.** Only headless Chrome for Testing 153 was available. Installing Firefox and WebKit for Playwright was tried and refused by the workspace's network rules. Firefox, Safari, a real phone and a touch screen were not tried.
- **No screen reader.** Accessible names, roles and the live region's text were checked through the browser's accessibility tree and with axe-core, not by listening.
- **Windows high-contrast mode.** The style sheet has rules for it; they were not exercised.
- **The loss card's values were not compared with a measurement.** The four planning values (0.5 dB/km, 0.5 dB a connector, 0.1 dB a splice, 3.5 dB a two-way split) are the build agent's choice inside published ranges. The fiber value is the upstream figure, used for a downstream level, and two answers rest on it (see "After the owner's second review"). Asked on 2026-11-19 whether it should change, the owner answered keep the card as it is. The connector, splice and splitter values were not put to him one by one.
- **The private review copy** published for the owner as a Claude artifact cannot be opened by the build agent. Whether it runs in that viewer is for the owner to report.

## The rule, the content and the session

### First build (2026-11-19 14:48)

| Check | Command | Result |
| --- | --- | --- |
| Tests written first fail without the engine | `node tests/run-node.mjs` before `engine/` existed | Failed as expected: "Cannot find module engine/rules.js" |
| Unit tests | `node tests/run-node.mjs` | 151 passed, 0 failed, 151 total |
| Independent answer-key check | `python3 tools/oracle.py` | All 169 checks agree with the hand-worked key |

By 15:36, with the page built, there were 158 unit tests, all passing: seven were added for the loss trace, the "Correct" headline, the worked examples (FR-002) and the standard's 15 dB limit on the difference between two paths.

### After the owner's first review (2026-11-19 15:47 to 16:04)

The changes went in the order the rest of the build used: the specification, then the expected results, then the content and the code.

| Step | Result |
| --- | --- |
| The hand-worked cases were re-worked in the specification for the 8 to 28 dB window, with new plants for rounds 2-1, 2-2, 3-1 and 3-2, and cross-checked with a throwaway decimal script | Every case agreed with the script |
| The cases were transcribed into `tests/fixtures/answer-key.json` and the unit tests run against the unchanged content | 52 of 158 failed, as they should |
| The content file was re-authored and validated | Valid. 28 tests still failed: 27 expected values written for the first build, and one real fault (below) |
| The expected values in the tests were rewritten from the specification, and the fault fixed | 159 passed, 0 failed, 159 total |
| `python3 tools/oracle.py` | All 172 checks agree with the hand-worked key. Three of them are new: the content has exactly one loss window, and its limits are the specification's 8 and 28 |

The fault: after the re-work the level 2 worked example totalled 24.0 dB, which is also round 2-2's ONT B with a 1:2 first stage. FR-002 asks for worked examples whose numbers differ from every challenge, and the unit test written for it earlier that morning failed. The example was changed (24.2 and 26.5 dB). Reading the content then showed the same kind of clash in level 3, where the example lost 5.2 dB before its attenuator, as round 3-1's ONT A does as drawn; that example was changed too (5.5 dB, 15.5 dB with the attenuator).

The trial round asked for by task T043 is the test `content/a trial round is graded without changing the engine`: a seventh round added as data only validates and is graded. It passed unchanged apart from its window.

### After the owner's second review (2026-11-19 20:59 to 21:33)

The owner said that 8 and 28 are the ONT's receive levels, and gave the launch power. The rule gained a step, so the same order was followed again: the specification, then the expected results, then the content and the code.

| Step | Result |
| --- | --- |
| The standard's launch power and ONU receiver figures were read in ITU-T G.9807.1, Table B.9.3, and recorded as reference R8 | +5 dBm is inside the launch ranges of classes N1 and N2; −28 dBm equals the ONU sensitivity; −8 dBm is 1 dB above the overload figure |
| Every case was re-worked by hand in the specification with a receive level for each ONT: six rounds, three worked examples, four boundary cases. Cross-checked with a throwaway decimal script | Every case agreed with the script. Round 1-2 needed a new lesson, and round 3-1 a new plant and new attenuator values |
| The cases were transcribed into `tests/fixtures/answer-key.json`, the expected words were written into the tests, and the suite was run against the unchanged game | Failed as it should. The feedback tests could not load, because they import level formatting that did not exist yet; of the other 116 tests, 50 failed |
| The evaluator, the tokens, the feedback and the content were changed | 172 passed, 0 failed, on the first run |
| The wording for an ONT inside the window was changed to give its room before the nearer limit, with a test | 173 passed, 0 failed, 173 total |
| `python3 tools/oracle.py`, changed to recompute receive levels and the three worked examples | All 227 checks agree with the hand-worked key |

One finding of this pass was put to the owner and is not a fault. The loss card's fiber value, 0.5 dB/km, is the upstream figure. The level an ONT receives is downstream light, which loses 0.35 dB/km (reference R3). The test `rules/the upstream fiber value changes no "inside" and no "too bright" verdict` recomputes all 37 ONT results with 0.35. Every ONT the game calls inside or too bright stays so. Two that it calls too dark would be inside the window: the farthest ONT behind the 1:64 splitter in rounds 1-1 and 2-1 (−26.5 and −25.9 dBm). The answers of those two rounds therefore rest on the loss card's fiber value. The game says in Model and sources that it reads dark on long routes. The owner was asked whether to change the card and answered keep the card as it is at 21:51.

## The page: browser checks (2026-11-19 21:35)

`python3 tools/e2e.py --axe <axe.min.js>` serves the repository under a subpath (`/play/split-decision/`), as a project site would, and drives headless Chrome. Expected values come from `tests/fixtures/answer-key.json` and from the specification, never from the game's own code. Results are also in `docs/verification/results.json`. This is the run after the owner's second review; the same 25 checks passed at 16:09 on the build before it.

| Check | Covers | Result | What it found |
| --- | --- | --- | --- |
| `AC1` A fresh session opens on the Level 1 briefing and nothing can be answered before Start | AC1, FR-001, FR-002, FR-003 | Pass | Level 1 briefing first; after Start the round shows the plant, the path table, the loss card, the launch power, the receive window, the goal and three options with the homes they serve |
| `AC2` Round 1-1 with a 1:32 splitter: solved, 30.7 dB of loss, −25.7 dBm, ledger 9.0 + 3.5 + 0.7 + 17.5 | AC2, FR-006, FR-009, FR-029 | Pass | ONT A: Fiber 9.0 + connectors 3.5 + splices 0.7 + splitter 17.5 = 30.7 dB. +5 dBm − 30.7 dB = −25.7 dBm |
| `AC3a` Round 1-1 with a 1:64 splitter: too dark, −29.2 dBm, 1.2 dB below the dark limit, round stays open | AC3a, FR-010, SC-002 | Pass | Too dark ONT A loses 34.2 dB and receives −29.2 dBm. That is 1.2 dB below the dark limit of −28 dBm. The retry solved the round on attempt 2. |
| `AC3b` Round 1-1 with a 1:16 splitter: works at −22.2 dBm, a larger one also fits, the answer is not named | AC3b, FR-011 | Pass | This design works, and a larger one also fits. |
| `AC4` Submitting with nothing selected gives guidance and counts nothing | AC4, FR-005, FR-012 | Pass | Choose a design first, then submit. Nothing was counted. Selecting a design grades nothing. |
| `AC5` Hint 1, hint 2 and the worked solution appear in order, count as help and do not complete the round | AC5, FR-014 | Pass | Level complete: Add it up  Work orders solved 2 of 2 Attempts 2 Hints used 2 Worked solutions viewed 1 |
| `AC6` Each real submission is one attempt; the answer completes the round once; a repeat changes nothing | AC6, FR-013 | Pass | Attempts: 3. Hints used: 0. Worked solution: not viewed. |
| `AC7` Next opens the following round, then the next briefing with the level summary, then the session summary | AC7, FR-015, FR-016 | Pass | Next work order > Next level > Next work order > Next level > Next work order > See summary |
| `AC8` Restart asks first; Keep playing changes nothing; Restart the game clears the session | AC8, FR-017 | Pass | cancel and Escape keep the session; confirm clears it |
| `FULL` All 20 options of the six rounds, submitted in the page, match the hand-worked key | SC-001, SC-002, FR-006 to FR-011, FR-016, FR-026 | Pass | 20 submissions compared with the key: totals, states, outcomes, limits and differences |
| `RELOAD` Reloading the page in mid-game returns to the first briefing with no progress | FR-018 | Pass | fresh start after reload; nothing in localStorage, sessionStorage or cookies |
| `KEYBOARD` The whole game is played from the first briefing to the summary with the keyboard only, at 1366 x 768 | AC9, SC-003, FR-023 | Pass | start, select, submit, hint, solution, next, restart, confirm and cancel, all by keyboard (102 key presses, no pointer) |
| `NAMES` Every control has the accessible name the contract gives it | AC9, FR-023 | Pass | buttons, radios, group, dialog, landmarks and scroll regions are named |
| `AC10` Feedback is text, stays until the next submission or view, names its design and is announced | AC10, FR-024 | Pass | Your design: 1:64 splitter. Too dark at ONT A. ONT A loses 34.2 dB and receives −29.2 dBm. That is 1.2 dB below the dark limit of −28 dBm. This choice usually comes from counting only the fiber and the splitter. Those two alone lose 30.0 dB, which this network could carry. The connectors and splices add 4.2 dB, and that takes ONT A below the dark limit. Next step: look for a design that puts less loss on that path. |
| `MOTION` The result is readable at once; the trace draws itself only when motion is allowed, and then stops | AC10, FR-025, SC-006 | Pass | reduced motion: 0 animations, result present at once; otherwise the trace draws once in under 1.5 s |
| `CONTRAST` Every piece of text has a contrast of at least 4.5 to 1 with what is behind it | principle IV, contracts/ui.md | Pass | 1863 pieces of text in 12 views, 14 color pairs; the lowest contrast is 5.01 to 1 |
| `TEXTSIZE` Running text is at least 16 CSS pixels; labels inside the drawings are at least 12 | contracts/ui.md | Pass | smallest running text 16px; smallest drawing label 12px |
| `NARROW` At 320 CSS pixels wide the page never scrolls sideways and Submit, Hint and Next can be reached | SC-007, FR-027 | Pass | 36 view and width combinations at 320, 390 and 768 pixels |
| `ORIGIN` A full playthrough makes no request outside the game's own origin, and the fonts come from the game | SC-009, FR-028 | Pass | 19 requests, all under /play/split-decision/ (css, html, js, json, svg, woff2); fonts: barlow-condensed-latin-500-normal.woff2, barlow-condensed-latin-600-normal.woff2, barlow-latin-400-normal.woff2, barlow-latin-500-normal.woff2, barlow-latin-600-normal.woff2 |
| `CONTENT` Content that cannot be graded (U1 to U6), or cannot be read, shows a content error and no challenge | SC-005, FR-019, FR-020 | Pass | U1 no-valid-option; U2 tie-for-best; U3 unknown-ratio; U4 inexact-total; U5 note-mismatch; U6 unknown-source; a missing file reports load-failed and Try loading again recovers |
| `DIALOGS` The briefing can be reviewed during a round; the model panel lists the rule, the limits of the model and every source | FR-004, FR-021, FR-022 | Pass | 8 sources: 7 published ones with an https link, and the owner's decisions on the receive window and the launch power |
| `AXE` The axe-core accessibility engine reports no violation in any view | principle IV | Pass | axe-core 4.14.1: 0 violations in 12 views |
| `FOLDER` Opened straight from a folder, the page says how to serve it instead of waiting forever | README, Play locally | Pass | view 'needs-server': This page was opened straight from a folder, and a browser will not load the game that way. Serve the folder i… |
| `UNIT` The unit tests pass in the browser, on the same modules the game runs | SC-001 | Pass | 173 passed, 0 failed, 173 total |
| `SHOTS` Screenshots of the briefing and of level 3 for the record | FR-002 | Pass | written to docs/verification/ |

**25 passed, 0 failed, 0 not run, 25 checks**, in 49.0 s, with Chrome for Testing 153.0.8010.12 (headless).

Without `--axe` the `AXE` check is reported as not run and the others are unaffected.

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

### In the engine (first build, 14:48)

| Planted bug | Caught by |
| --- | --- |
| A path exactly at the maximum treated as outside the window | `rules/boundary/B1` (1 test failed) |
| Connectors left out of the sum | 73 tests failed |
| An empty submission counted as an attempt | `state/AC4` (1 test failed) |
| Feedback for a wrong answer names the answer | 14 tests failed |

### In the page: 14 of 14 caught (run again at 16:05, after the owner's changes)

The first twelve were also planted against the first build between 15:20 and 15:25, when all twelve were caught. The last two are new.

| Planted bug | Caught by | What the check said |
| --- | --- | --- |
| Focus is not moved after a submission | `KEYBOARD` | "after a wrong design focus should stay on Submit" |
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
| The window's maximum set back to 29 dB | `FULL` | the game refused to start: with that limit round 2-1 has a different answer, and the validator reports it |
| "Connector pairs" comes back in the ledger | `AC2` | "the ledger lacks 'connectors 2.0'" |

### After the owner's second review: 26 of 26 caught (21:27 to 21:31)

Run on the final build. Eleven are in the rule, the words or the content and are caught by the unit tests; fifteen are in the page and are caught by the browser check named.

| Planted bug | Caught by |
| --- | --- |
| The dark limit is not included in the window | unit, `rules/boundary/B1` |
| The bright limit is not included | unit, `rules/boundary/B3` |
| The loss is added to the launch power instead of taken from it | unit, `rules/r1-1/the answer is o32` and others |
| Too dark and too bright are swapped in the outcome | unit, `rules/r1-1/o64` and others |
| The distance to the dark limit has the wrong sign | unit, `rules/r1-1/o64` and others |
| A level is written with a hyphen instead of a minus sign | unit, `feedback/a level is written with one decimal, a true minus sign and an explicit plus` |
| The room of an ONT inside the window is always measured to the dark limit | unit, `feedback/r3-1/a10` |
| The trace starts at zero instead of at the launch power | unit, `feedback/the trace starts at the launch power...` |
| A level typed by hand into a hint | unit, `content/no authored text carries a hand-typed dB or dBm value` |
| The launch power is 4 dBm in the content | unit, `rules/the game has one set of optics, the specification's` |
| A class without a launch power is accepted | unit, `content/class without a launch power` |
| Focus is not moved after a submission | `KEYBOARD` |
| Reduced motion is ignored by the script | `MOTION` |
| Secondary text is too pale | `CONTRAST` |
| A meter shows a wrong receive level | `FULL` |
| A meter shows the loss where the level belongs | `FULL` |
| The level sum under a ledger is empty | `FULL` |
| The work order does not give the launch power | `AC1` |
| The drawing does not print the launch power at the OLT | `AC1` |
| The dark limit is −29 dBm in the content | `FULL` |
| The loss card is too wide for a phone | `NARROW` |
| The tally is set in small type | `TEXTSIZE` |
| Restart does not ask | `AC8` |
| An option has no accessible name | `NAMES` |
| The model panel leaves out the launch power | `DIALOGS` |
| Content with no valid option is not reported | `CONTENT` |

## Faults the checks found in the game

| Found by | Fault | Fix |
| --- | --- | --- |
| `KEYBOARD`, failing about one run in six | The restart dialog listened for its `close` event to treat Escape as "Keep playing". That event arrives late. If the dialog was closed and reopened quickly, the late event from the first closing cancelled the second dialog | Listen for the dialog's `cancel` event, which belongs to one opening. `KEYBOARD` and `AC8` then passed 16 times out of 16 |
| `NAMES`, `AC5`, `AC10` | An option's accessible name read "1:16 splitter . Serves 16 homes", with a stray period from a hidden separator inside the label | The separator was removed. The name is now the label, and the homes served are the option's description |
| `AXE` | Heading levels skipped from 2 to 4 at a revealed hint | The hint headings are level 3 |
| `UNIT` | The browser test page requested a favicon that does not exist (a 404) | The test page now names the game's icon |
| Unit test for FR-002 | After the owner's change, a worked example repeated a challenge's total | Both affected examples were changed (see above) |
| Hand-working round 3-1 | With a window 20 dB wide, a 20 dB attenuator on a path that is too bright always lands inside the window, so the first build's overshoot option would have been a second valid answer | The option is a 25 dB attenuator; the specification says why |
| Reading the first screenshots | After Submit on a laptop screen the result was below the window | The page moves just far enough to show the trace and the lines under it |
| Reading the first screenshots | On a PON with several ONTs the lines covered each other on the shared feeder, so only one color showed | A stretch shared by several ONTs is drawn once in a neutral color |
| Analysis, pass 4 | The rule "no hand-typed dB value in authored text" was tested with a pattern that a dBm value did not match | The pattern covers dBm; a planted bug confirmed it |
| Recomputing with the downstream fiber value | Two "too dark" verdicts, and so two answers, rest on the loss card's upstream fiber value | Not changed: stated in the game and put to the owner, who kept the value |
| Reading the screenshots of the second review | On the work order the receive window broke between "−8" and "dBm"; the launch row of the meters wrapped | Two short lines, with each level kept whole; the row reads "Launch power" |
| Reading the 320-pixel screenshots | In round 3-1 the note under ONT A ran into the fiber beside it | A shorter note |
| Reading the 320-pixel screenshots | Labels in the plant drawing collided on short runs and beside an attenuator; a zone name sat on a trace | Labels are placed in the free part of a run; a zone name is drawn only where no trace runs |
| Reviewing the text | A label written as a title appeared in mid-sentence ("from the Remote OLT port") | Labels used inside a sentence are lowercased |
| Trying the page from a folder | Opened as a file, the page waited forever on "Loading the work orders", because a browser will not load modules that way | A plain script now says how to serve the folder; check `FOLDER` |

Three faults were in the checks themselves and were fixed there: a case-sensitive comparison of a lowercased ledger, focus on the browser's own controls read as an error, and a wait for the wrong status on the test page.

One fault in the page also weakened a check. A hidden separator was first placed inside each option's label, and the check read it as part of the label, so the comparison "feedback never names the answer" could not have failed. Once the separator was gone, the planted bug above confirmed that the comparison can fail.

## Review of the teaching content against the sources (task T042)

Done by the build agent on 2026-11-19, reading every briefing, hint, note and explanation as the player sees it (all tokens filled): once for the first build, again after the owner's first review, and again after his second. The owner set or changed the items marked below. **No one else has reviewed it.**

No authored sentence contains a typed dB or dBm value: the test `content/no authored text carries a hand-typed dB or dBm value` enforces it. Every number the player reads therefore comes from one of the rows below, through the loss card, the optics or the evaluator.

| Stated in the game | Value | Source | Status |
| --- | --- | --- | --- |
| The receive window | −28 dBm to −8 dBm at the ONT | R7: the project owner's field practice (decisions D11 and D13) | **Set by the owner on 2026-11-19**, in two steps: the limits in his first review, their unit in his second. Not quoted from a published source, and the game says so |
| The launch power | +5 dBm at the OLT port | R7 (decision D14) | **Given by the owner on 2026-11-19** as a five with a hyphen in front, read by the build agent as plus five, and **confirmed by him** the same day: plus five is right. +5 dBm is inside the ranges of R8 |
| The standard's own figures, listed in the sources for comparison | OLT launch +2 to +5 dBm (N1) and +4 to +7 dBm (N2); ONU sensitivity −28 dBm, overload −9 dBm; path penalty 1 dB | R8: ITU-T G.9807.1 (02/2023) Annex B, clause B.9.2.6.2, Table B.9.3 | Read in the standard by the build agent on 2026-11-19. They reproduce the loss classes of R1: 2 + 28 − 1 = 29 and 5 + 9 = 14 for N1 |
| The standard's classes, listed in the sources for comparison | N1 14 to 29 dB, N2 16 to 31 dB | R1: ITU-T G.9807.1 (02/2023) Annex B, clause B.6.1, Table B.6.1 | Read in the standard by the build agent |
| "The standard requires [an attenuator] wherever a path would lose too little to protect the receiver" | | R1, clause B.6.1 | Read in the standard by the build agent |
| "The standard's loss classes ... are narrower than the game's window" | 14 to 29 and 16 to 31 dB against 13 to 33 dB | R1; the game's 13 and 33 are 5 − (−8) and 5 − (−28) | Arithmetic by the build agent |
| "A PON runs on a single fiber", both directions on one strand | | The owner, 2026-11-19 (decision D12); the wavelengths of the two directions are in R2 | **Added at the owner's request** |
| The loss range of the standard applies between the OLT and ONT and includes splices, connectors and attenuators | | R2: G.9807.1 Annex B, clause B.9.2.6.1 | Read in the standard by the build agent |
| Downstream 1575 to 1580 nm, upstream 1260 to 1280 nm | | R2: Tables B.9.2 to B.9.4 | Read in the standard by the build agent |
| Paths on one PON may differ by at most 15 dB (stated in the source list; not graded) | 15 dB | R2: clause B.9.2.8.1 | Read in the standard. The unit test `rules/every answer keeps the paths of its PON within 15 dB of each other` makes the game's sentence "every answer in the game is within it" true |
| Fiber, per km | 0.5 dB | R3: ITU-T G.652 (08/2024) Appendix I, Table I.1, typical link value for 1260 to 1360 nm | Read in the standard. It is the upstream value, used for the level an ONT receives, which is downstream light (decision D4, restated). Two answers rest on it. **Kept by the owner** on 2026-11-19: keep the card as it is (decision D17) |
| "Fiber loses more per km upstream than downstream" | 0.5 against 0.35 dB/km | R3, same table | Read in the standard |
| Connector | 0.5 dB | R4: FOA guide, typical 0.3 dB per connector, TIA-568 maximum 0.75 dB for one mated connection | **A planning value chosen by the build agent** inside the published range (decision D2). Kept by the owner with the loss card (D17); not put to him on its own |
| Fusion splice | 0.1 dB | R4: FOA guide, TIA-568 maximum 0.3 dB | **A planning value chosen by the build agent** under the published maximum (decision D2). Kept by the owner with the loss card (D17); not put to him on its own |
| Splitters | 3.5 dB for each two-way split: 3.5, 7.0, 10.5, 14.0, 17.5, 21.0 dB | R6: TEC GR/TX/OPT-001 lists maximums of 4.0, 7.1, 10.5, 13.8, 17.1 and 20.5 dB | **A planning rule chosen by the build agent**, within 0.5 dB of each published maximum (decision D2). Kept by the owner with the loss card (D17); not put to him on its own. ITU-T G.671 could not be read, and nothing is attributed to it |
| "A signal that arrives too strong overloads [the receiver]"; an attenuator adds the missing loss | | R5: FOA guide on attenuators | Read on the FOA page |
| A two-stage split multiplies the homes and adds the losses | | Follows from the rule (FR-006) | Unit test `feedback/a two-stage ledger lists both splitters`; hand-worked round 2-2 |
| Every total, margin and difference in a ledger, a hint, a note or an explanation | | Computed by `engine/rules.js` | Matches the hand-worked key (SC-001) |

## Quickstart scenarios (task T049)

The seven scenarios of `specs/001-loss-budget-game/quickstart.md`, each as run by the browser checks. **None was walked through by a person.**

| # | Scenario | Result | Run as |
| --- | --- | --- | --- |
| 1 | First decision (AC1 to AC4) | Pass | `AC1`, `AC2`, `AC3a`, `AC3b`, `AC4` |
| 2 | Help and progress (AC5 to AC7) | Pass | `AC5`, `AC7` |
| 3 | Restart (AC8) | Pass | `AC8` |
| 4 | Too much light: round 3-1 as drawn is too bright at −4.2 and −4.3 dBm; round 3-2 with the attenuator at the OLT port leaves ONT B too dark at −31.4 dBm | Pass | `FULL` submits both and compares them with the key |
| 5 | Keyboard only (AC9) | Pass | `KEYBOARD` |
| 6 | Reduced motion and narrow window | Pass | `MOTION`, `NARROW` |
| 7 | Unsupported content (FR-019) | Pass | unit tests `content/U1` to `U6`; `CONTENT` |

## Fresh copy (task T048)

Run on 2026-11-19 from 21:32:48 to 21:33:36, on commit `d417bd8`, cloned with `git clone` into a new, empty folder (97 tracked files). Commits after `d417bd8` change documents only. The same check was run on the first build at 15:42 (commit `f5c2bfa`: 158, 169 and 23, all passing) and after the owner's first review at 16:10 (commit `493a690`: 159, 172 and 25).

| Step | Command, in the fresh copy | Result |
| --- | --- | --- |
| Unit tests | `node tests/run-node.mjs` | 173 passed, 0 failed, 173 total |
| Independent answer-key check | `python3 tools/oracle.py` | All 227 checks agree with the hand-worked key |
| Browser checks, as a reader would run them | `python3 tools/e2e.py` | 24 passed, 0 failed, 1 not run (the axe-core audit, which needs the engine), 43.1 s |
| The axe-core audit | `python3 tools/e2e.py --axe <axe.min.js> AXE` | Pass: axe-core 4.14.1, 0 violations in 12 views |
| The README's own instructions | `python3 -m http.server <free port> --bind 127.0.0.1`, then the address opened in headless Chrome | The Level 1 briefing "Add it up" appeared; round 1-1 with the 1:32 splitter gave "Correct. ONT A is inside the window." at 30.7 dB of loss and −25.7 dBm; `/tests/` reported 173 passed, 0 failed; no failed request and no script error |

After the run the fresh copy differed from the commit only in `docs/verification/results.json`, which records the time of the run.

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
