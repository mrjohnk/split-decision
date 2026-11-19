# Specification Analysis Report: Split Decision, first playable version

`/speckit-analyze` is read-only. Its report was produced twice on 2026-11-19: once on the artifacts as first written, and again after the findings were fixed in the source artifacts. Both passes are kept here so the changes can be traced. The workshop's step 6 asks for exactly this: review the findings, fix the specification, plan or tasks, and run the analysis again.

## Pass 1

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| D1 | Constitution | CRITICAL | data-model.md Option.note; spec.md FR-010; constitution II | An option's authored note was optional. Principle II says a wrong answer MUST explain the specific mistake, so a wrong option with no note would violate it | Require a note on every option that is not the answer; add a validation error for a missing one |
| E1 | Coverage | HIGH | tasks.md T006, T013, T014 | Constrained fields of data-model.md were cited by group or in a loose form, and 53 of 74 had no explicit `Entity.field` citation in an implementing task | Cite every constrained field in `Entity.field` form in the validator task and the session task |
| C1 | Underspecification | MEDIUM | spec.md FR-010; constitution II | FR-010 asked for the mistake but not for the "useful next step" that principle II requires | Add the next step to FR-010 and to the feedback task and test |
| C2 | Underspecification | MEDIUM | contracts/ui.md; tasks.md T015 | No artifact said which module produces the worked solution, the one place where the answer is shown | Name `describeSolution` in `engine/feedback.js` in the contract and in T015; test it in T010 |
| E2 | Coverage | MEDIUM | spec.md SC-001, SC-002, SC-003, SC-005; tasks.md | Four success criteria were met in substance by test tasks but cited by none | Cite them in T007, T010, T035 and T008 |
| E3 | Coverage | MEDIUM | spec.md SC-004, SC-008; tasks.md T046 | Two success criteria need a person, and no task recorded them as not run | Record them in T046 as waiting for the owner |
| E4 | Coverage | MEDIUM | contracts/ui.md Layout; tasks.md T035 | Text contrast of 4.5 to 1 was required but never checked | Add a contrast check to T035 |
| E5 | Coverage | MEDIUM | spec.md FR-018; tasks.md T027 | "Reload starts a fresh session" had no browser check | Add a reload check to T027 |
| F1 | Inconsistency | MEDIUM | plan.md Constitution Check row IV; contracts/ui.md Layout; tasks.md T025, T039 | The plan said one column under 720 pixels; the contract and the tasks said 960 | Use 960 CSS pixels everywhere |
| B1 | Ambiguity | LOW | constitution IV; spec.md Assumptions | "A typical laptop" had no size | Take 1366 × 768 CSS pixels and use it in the keyboard playthrough |
| B2 | Ambiguity | LOW | spec.md FR-025; tasks.md T035 | "Animation MUST NOT delay feedback in any mode" was checked only with reduced motion | Check with and without reduced motion |
| C3 | Underspecification | LOW | spec.md FR-022; tasks.md T018 | "Stated in the briefings" had no content task citing it | Cite FR-022 in T018 |
| F2 | Inconsistency | LOW | plan.md Technical Context; contracts/ui.md Views | The plan counted four views; the contract lists five | Say five in the plan |
| F3 | Inconsistency | LOW | tasks.md T001, T044; plan.md Project Structure | `docs/gameplay.png` and `docs/verification/` were in the tasks and missing from the plan's tree | Add both to the plan |
| A1 | Duplication | LOW | spec.md Technical Model; FR-006 to FR-008 | The rule is stated twice | Keep both: the Technical Model is the plain statement, the requirements are normative. No change |
| F4 | Terminology | LOW | spec.md round 3-2 ("customers") and FR-008 ("homes") | Two words for the count an option serves | Covered by the Assumptions and by `Option.servedLabel`. No change |

**Constitution Alignment Issues:** D1 only. It was a gap in the data model, not in the specification: FR-010 already required the explanation.

**Unmapped Tasks:** none. T001 to T004 are setup; T016, T026, T034, T041, T048 and T049 run and record checks.

**Metrics (pass 1):** 37 requirements (28 functional, 9 success criteria); 49 tasks; 31 of 37 requirements cited by at least one task (84%); 21 of 74 constrained fields cited in `Entity.field` form; 2 ambiguity findings; 0 duplicate requirements needing a merge; 1 critical finding.

## Remediation

Every finding except A1 and F4 was fixed in the artifact where it arose: `spec.md` (FR-010, FR-020, Assumptions), `data-model.md` (Option.note), `contracts/content.md` (`missing-note`), `contracts/ui.md` (Help), `plan.md` (960 pixels, five views, the `docs/` entries) and `tasks.md` (T007, T008, T010, T013, T014, T015, T018, T027, T028, T035, T046). No principle was changed and no requirement was weakened.

## Pass 2

No CRITICAL, HIGH or MEDIUM finding remains. A1 and F4 stand as recorded, with no action.

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs |
|-----------------|-----------|----------|
| FR-001 | Yes | T021 |
| FR-002 | Yes | T021 |
| FR-003 | Yes | T020, T022, T033 |
| FR-004 | Yes | T040 |
| FR-005 | Yes | T022, T024 |
| FR-006 | Yes | T011 |
| FR-007 | Yes | T011 |
| FR-008 | Yes | T011 |
| FR-009 | Yes | T015, T023 |
| FR-010 | Yes | T010, T015, T023 |
| FR-011 | Yes | T010, T015, T023 |
| FR-012 | Yes | T014, T015, T023 |
| FR-013 | Yes | T014 |
| FR-014 | Yes | T014, T015, T029 |
| FR-015 | Yes | T014, T030 |
| FR-016 | Yes | T014, T030, T031 |
| FR-017 | Yes | T014, T032 |
| FR-018 | Yes | T014, T027 |
| FR-019 | Yes | T013, T019 |
| FR-020 | Yes | T013 |
| FR-021 | Yes | T021, T040 |
| FR-022 | Yes | T018, T040 |
| FR-023 | Yes | T036, T037 |
| FR-024 | Yes | T015, T023 |
| FR-025 | Yes | T035, T038 |
| FR-026 | Yes | T015, T023, T037 |
| FR-027 | Yes | T039 |
| FR-028 | Yes | T019 |
| SC-001 | Yes | T007 |
| SC-002 | Yes | T010 |
| SC-003 | Yes | T035 |
| SC-004 | Yes | T046 |
| SC-005 | Yes | T008 |
| SC-006 | Yes | T035 |
| SC-007 | Yes | T035 |
| SC-008 | Yes | T046 |
| SC-009 | Yes | T035 |

**Constrained-Field Coverage:** all 74 constrained fields of data-model.md are cited in `Entity.field` form: the 62 content fields by T013 (the validator, which enforces them), and the 12 session fields by T014.

**Metrics (pass 2):** 37 of 37 requirements cited by at least one task (100%); 74 of 74 constrained fields cited; 49 tasks; 0 critical findings. SC-004 and SC-008 are covered only by a recording task, because they need a person.

## Pass 3, after the owner's first review (2026-11-19)

The owner changed two things after playing the first build: one loss window of 8 to 28 dB in place of the two classes (decision D11), and "connector" in place of "connector pair" (decision D12). The constitution's governance asks for analysis to be run again after a material change. This pass was made on the amended specification, plan, tasks and constitution, and on the re-worked content.

| ID | Category | Severity | Location(s) | Summary | What was done |
|----|----------|----------|-------------|---------|---------------|
| G1 | Constitution | HIGH | constitution I, Scope and Model Boundaries; spec.md D11, D12 | The constitution named the N1 and N2 classes and "connector pairs". The owner's decisions contradict both | Constitution amended to version 1.1.0. No principle was removed or weakened: the rule is still "inside the window, limits included, most homes wins" |
| G2 | Inconsistency | HIGH | spec.md FR-002; `data/levels.json`, the worked examples of levels 2 and 3 | After the rounds were re-worked, the level 2 example's 24.0 dB was also round 2-2's ONT B with the 1:2 splitter, and the level 3 example's 5.2 dB before its attenuator was also round 3-1's ONT A as drawn. FR-002 asks for examples whose numbers differ from every challenge | Both examples changed (24.2 and 26.5 dB; 5.5 dB before the attenuator, 15.5 dB after). The unit test for FR-002 caught the first; reading the content caught the second |
| G3 | Underspecification | MEDIUM | research.md R-01; spec.md Technical Model | The first version relied on each window being 15 dB wide to imply the standard's limit on the difference between two paths. The new window is 20 dB wide, so that no longer follows | A unit test confirms that every answer keeps its paths within 15 dB of each other, and the model panel says that the limit is not graded |
| G4 | Underspecification | MEDIUM | data-model.md Source; contracts/content.md | The window's source is now the owner's decision, which has no link, and `Source.url` was required | `Source.url` is optional. A source without one is shown without a link |
| G5 | Ambiguity | MEDIUM | spec.md Clarifications, owner's review | 8 and 28 are also the usual limits of an ONT's receive level in dBm. The game measures path loss in dB, and the numbers were applied as loss limits, as written | Recorded as an open point for the owner. Not resolved by the build agent |
| G6 | Underspecification | MEDIUM | spec.md, Round 3-1 | A window 20 dB wide means that a path that is too bright by any amount lands inside the window when 20 dB is added, so the first version's "20 dB attenuator overshoots" option would have been a second valid answer | The option is a 25 dB attenuator, and the specification says why |
| G7 | Terminology | LOW | README.md, index.html: "An XGS-PON loss-budget puzzle" | The title still names XGS-PON while the window is no longer an XGS-PON class | Kept, because the owner did not ask to change it. The model panel states the difference. Flagged for the owner |
| G8 | Coverage | LOW | tasks.md | The owner's changes had no tasks | Phase 7 added: T050 to T059 |
| G9 | Inconsistency | LOW | StarterKit/SPEC.md, PLAN.md, CONSTITUTION.md | The planning inputs still describe the first version | Each carries an amendment note at its top. They are kept as the record of what was asked at the time; spec.md and the constitution govern |

**Constitution Alignment Issues:** G1 only, resolved by the amendment.

**Hand-worked cases:** the 20 option cases and 4 boundary cases in the specification, the fixture, the content file and the evaluator agree: 159 unit tests, and 172 oracle comparisons, three of which now compare the content's window with the specification's.

**Metrics (pass 3):** 37 requirements (28 functional, 9 success criteria), all cited by at least one task; 59 tasks; 74 constrained fields (the fields `connectorPairs` and `connectorPairDb` renamed; `Source.url` now optional); 0 critical findings; 1 open point for the owner (G5).

## Pass 4, after the owner's second review (2026-11-19)

The owner closed the open point of pass 3 (G5): 8 and 28 are ONT receive levels, and the launch power is a five with a hyphen in front, read as +5 dBm. The rule the game teaches gained a step (receive level = launch power − path loss), so this pass was made on the amended specification, plan, tasks and constitution, and on the re-worked content.

| ID | Category | Severity | Location(s) | Summary | What was done |
|----|----------|----------|-------------|---------|---------------|
| H1 | Constitution | HIGH | constitution I, Scope and Model Boundaries; spec.md D13, D14 | The constitution stated the rule as a loss window of 8 to 28 dB and excluded transmitter power and receiver sensitivity from the model. The owner's decisions put both in the model | Constitution 1.2.0: the rule is read at the ONT as a receive level; the model names the launch power and the receive window; the exclusions say what is still left out |
| H2 | Ambiguity | HIGH | spec.md Clarifications, D14 | The owner wrote a five with a hyphen in front. A launch power of −5 dBm is 7 dB below the weakest transmitter the standard allows (R8) and leaves 3 to 23 dB of usable loss, with which neither level 1's 1:64 option nor level 3 can be built | Read as +5 dBm, the top of the standard's N1 range and inside N2. **Open point for the owner: confirm the sign.** The value is one field of the content file, but the plants were designed for it. *Closed on 2026-11-19: plus five is right* |
| H3 | Inconsistency | HIGH | spec.md, Hand-worked Cases; all rounds | The usable loss moved from 8–28 to 13–33 dB. No round kept exactly one answer, and round 1-2's lesson ("only a 1:16 fits a long route") cannot occur within 20 km | All cases re-worked by hand before the content changed; round 1-2 redesigned (D16); the misconception it exposed moved to round 1-1's 1:64 option |
| H4 | Terminology | MEDIUM | contracts/rules.md; engine; fixture | `over`, `under`, `over-max`, `under-min` were named for sides of the loss window. For a receive level the sides are reversed | Renamed to `dark`, `bright`, `too-dark`, `too-bright`, `dark-and-bright`; the limits are the dark limit and the bright limit (D15) |
| H5 | Underspecification | MEDIUM | spec.md D4; research.md R-02 | The fiber value was justified as the higher of two directions. The game now checks one direction, downstream, with the upstream value | Kept, because the owner did not change the loss card, and stated to the player: on a long route the game reads darker than a real ONT. The unit test that recomputes with 0.35 dB/km shows which verdicts would differ: the 1:64 option of rounds 1-1 and 2-1 would be inside the window, so those two answers rest on the loss card's fiber value. **Open point for the owner, with the loss card**. *Closed on 2026-11-19: keep the card as it is (decision D17)* |
| H6 | Coverage | MEDIUM | contracts/content.md; tests/content.test.js | The rule "no hand-typed dB value in authored text" did not catch a hand-typed dBm value | The test's pattern now covers dBm, and the contract says so |
| H7 | Underspecification | LOW | spec.md, reference R8 | The owner's bright limit, −8 dBm, is 1 dB above the minimum overload the standard requires of an ONU (−9 dBm) | Kept as the owner's figure; the difference is stated in the source list |
| H8 | Terminology | LOW | README.md, index.html: "An XGS-PON loss-budget puzzle" | Pass 3's G7 asked whether the title should still name XGS-PON | Closed: the launch power is inside the standard's XGS-PON ranges and the dark limit equals its ONU sensitivity |
| H9 | Coverage | LOW | tasks.md | The owner's changes had no tasks | Phase 8 added: T060 to T071 |

**Constitution Alignment Issues:** H1 only, resolved by the amendment.

**Hand-worked cases:** the 20 option cases, 3 worked examples and 4 boundary cases in the specification, the fixture, the content file and the evaluator agree: 173 unit tests, and 227 oracle comparisons, which now compare every receive level as well as every loss.

**Metrics (pass 4):** 38 requirements (29 functional, 9 success criteria), all cited by at least one task; 71 tasks; 0 critical findings; 2 open points for the owner (H2 and H5).

## Pass 5, after the owner's answers (2026-11-19)

The owner closed H2 and H5, and asked how the Arcade card compares with the others. The card became a drawing made by the engine (decision D18, FR-030). This pass was made on the amended specification, plan and tasks, before the card page or its check were added to the repository. A first sketch of the page existed by then: it was drawn to find out whether a stronger card was possible, before the decision was written down.

| ID | Category | Severity | Location(s) | Summary | What was done |
|----|----------|----------|-------------|---------|---------------|
| I1 | Coverage | MEDIUM | spec.md; plan.md | The Arcade requires a card image and task T044 made one, but no requirement named it and nothing checked its shape or its size | FR-030 added; browser check `CARD` planned (T076) |
| I2 | Constitution | MEDIUM | constitution, Principle I; contracts/content.md | A card with levels on it could carry numbers typed for the picture. Principle I wants expected results recorded independently of the implementation, and the content contract allows no hand-typed dB or dBm value | The card page takes every level, limit and split from the engine and the content file. Its work order is hand-worked in the specification, so the check has expected values that the page did not produce |
| I3 | Inconsistency | LOW | plan.md, project tree; README, credits; ARCADE.md | Three places say that the card is a capture of the running game | plan.md corrected in this pass; README and `ARCADE.md` to be corrected with the card (T079) |
| I4 | Ambiguity | LOW | spec.md D18 | The card shows three designs on one trace, which the game never draws, so it could be taken for a screenshot | Stated in research R-12 and in the image's description; the work order is not one of the six rounds, so no result of the game is printed on the card |
| I5 | Underspecification | LOW | tools/e2e.py | Nothing checks that the stored image is the page's current drawing. A comparison of pixels would differ from one machine to another by the rendering of type | Left unchecked by a script, and recorded as such: the image is written by `tools/e2e.py --card`, and each capture is recorded in docs/verification.md |

**Constitution Alignment Issues:** none. The constitution needed no amendment: nothing about the game changed.

**Metrics (pass 5):** 39 requirements (30 functional, 9 success criteria), all cited by at least one task; 79 tasks; 0 critical findings; no open point.

## Next Actions

Implementation may begin. Two items stay with the owner: timing a first playthrough (SC-004) and saying what each level taught (SC-008).

After pass 3, three items stayed with the owner: the two above, and the open point G5 (path loss in dB, or receive level in dBm). The owner closed G5 in his second review.

After pass 4, three items stay with the owner: timing a first playthrough (SC-004), saying what each level taught (SC-008), and the open points H2 (the sign of the launch power) and H5 (the fiber value, now that the level checked is a downstream one).

The owner answered both open points on 2026-11-19 at 21:51 UTC. H2: plus five is right. H5: keep the card as it is, recorded as decision D17. Neither answer changes the game. Two items stay with him: timing a first playthrough (SC-004) and saying what each level taught (SC-008).

After pass 5, one more choice is his: which card ships, the drawing or the screenshot (decision D18).
