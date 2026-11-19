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

## Next Actions

Implementation may begin. Two items stay with the owner: timing a first playthrough (SC-004) and saying what each level taught (SC-008).
