# Build log

A running record kept by the build agent while the game was made. Times are UTC and come from the session clock; a range means the step fell between two recorded clock readings. It exists so that
`ARCADE.md` and the README can be filled from what happened, not from memory.

## Session facts

| Item | Value |
| --- | --- |
| Build agent model | claude-fable-5-2 |
| Harness | Claude Code 2.1.328, running as a cloud session opened from the Claude app |
| Spec Kit | specify CLI 1.4.3.dev0, `claude` integration, skills mode |
| Owner | John (GitHub handle to be supplied) |
| Working style chosen by the owner | "Build it, I review after": the agent makes the design calls from the workshop defaults, records each one, and the owner reviews a playable game plus the answer key |

## Timeline

| Time (UTC) | Step | What happened |
| --- | --- | --- |
| 2026-11-19 13:04 | Request | Owner shared the NAF AC6 workshop repository and asked what entering would involve. |
| 2026-11-19 13:05 onward | Reading | Agent cloned the workshop repository, read the lab guide, the StarterKit, the three example games' `ARCADE.md` files and the 98-slide workshop deck, and the Arcade page. |
| 2026-11-19 13:31 | Deadline | Owner reported that submissions close on 2026-11-20. |
| 2026-11-19, before 14:07 | Decisions | Owner chose the topic (PON loss budget) and the working style (build, then review) in a two-question dialog. |
| 2026-11-19 14:07 | Start | `git init`, `specify init --here --integration claude --script sh`; StarterKit templates, attendee README and LICENSE copied from NAF_AC6. This is the recorded build start. |
| 2026-11-19 14:07–14:18 | Sources | Loss classes read from ITU-T G.9807.1 (02/2023) clause B.6.1; fiber values from ITU-T G.652 (08/2024) Table 2 and Appendix I; connector and splice guidance from the FOA guide; one published splitter table (TEC GR/TX/OPT-001). ITU-T G.671 could not be read past its abstract, so no number is attributed to it. |
| 2026-11-19 14:07–14:18 | Inputs | Six rounds designed and worked by hand; arithmetic cross-checked with a throwaway Decimal script. The three StarterKit inputs were personalized. The answer key was sent to the owner for checking. |
| 2026-11-19 14:18 | Commit | Starting point committed (5ecf5a1). |
| 2026-11-19 14:18–14:22 | 1 · constitution | `/speckit-constitution` run on `StarterKit/CONSTITUTION.md`. Seven principles carried over as v1.0.0; three conflicts flagged (below). |
| 2026-11-19 14:18–14:22 | 2 · specify | `/speckit-specify` run on `StarterKit/SPEC.md`. Feature directory `specs/001-loss-budget-game`; 28 functional requirements, 9 success criteria, 20 hand-worked option cases, 4 boundary and 6 unsupported-content cases. Quality checklist passed on the first iteration. No git extension is installed, so no feature branch was created; work stays on `main`. |
| 2026-11-19 14:18–14:22 | 3 · clarify | `/speckit-clarify` asked five questions. On the owner's instruction the agent answered each with its recommended option and recorded them in the spec's Clarifications section for owner review. |
| 2026-11-19 14:22–14:32 | 4 · plan | `/speckit-plan` run on `StarterKit/PLAN.md` and the clarified spec: `plan.md`, `research.md`, `data-model.md`, four contracts and `quickstart.md`. Seven contradictions between the planning input and the specification resolved in the plan's table. One of them changed the specification: feedback no longer names the answer. |
| 2026-11-19 14:22–14:32 | 5 · tasks | `/speckit-tasks`: 49 tasks in six phases, tests first. |
| 2026-11-19 14:22–14:32 | 6 · analyze | `/speckit-analyze`, pass 1: 16 findings (1 critical, 1 high, 7 medium, 7 low). All but two low findings fixed in the source artifacts. Pass 2: none above low. Both passes kept in `specs/001-loss-budget-game/analysis.md`. |
| 2026-11-19 14:32–14:36 | 7 · implement, start | Checklist gate: `requirements.md` 16 of 16 checked. Two things found on reading the tasks against the code about to be written, and fixed in the artifacts first: the page can load only a fully valid content file, so content is authored in one task (T006) and reviewed in the page later (T018, T028); and authored text would have carried hand-typed dB values that the validator could not check, so value tokens and evaluator-computed worked examples were added to the data model and the content contract. |
| 2026-11-19 14:36–14:48 | 7 · implement, phases 1–2 | T001 to T016. Tests and the answer-key fixture written first and seen to fail; then `engine/rules.js`, `engine/tokens.js`, `engine/content.js`, `engine/state.js`, `engine/feedback.js` and `tools/oracle.py`. 151 unit tests pass on the first run of the engine; the oracle agrees on all 169 checks. Because a first-run pass proves little, four bugs were planted one at a time and each was caught. |
| 2026-11-19 14:48–14:59 | 7 · implement, the page begins | The frontend-design and dataviz skills were read. Design direction set: light work-order sheets, the designer's marks in conduit orange, one dark instrument panel. The three line colors of the trace were validated before any drawing code. Barlow and Barlow Condensed were fetched from the Fontsource npm packages and vendored with their license texts. `index.html`, `ui/dom.js`, `ui/diagram.js`, `ui/render.js`, `ui/controls.js` and `main.js` written. |
| 2026-11-19 14:59–15:03 | 7 · implement, first run | `style.css` written. The page loaded and played through round 1-1 in headless Chrome on the first try (15:03). |
| 2026-11-19 15:03–15:17 | 7 · implement, looking at it | Screenshots at 1366, 390 and 320 pixels wide were read and the page corrected: the result is brought into view after Submit; a stretch of path shared by several ONTs is drawn once in a neutral color; the window's limits are labeled on the scale; the loss card became a compact list; the briefing's Start button stays in reach; labels in the plant drawing no longer collide. The planned "light meter with a marker" had already been replaced by the loss trace; the plan records the change. |
| 2026-11-19 15:17 | Owner | Asked whether the agent had looked at the other games in the Arcade, with no change of plan asked for. The agent read the Arcade page (17 games, none on optical access) and one game's page, and kept the plan. |
| 2026-11-19 15:18–15:28 | 7 · implement, browser checks | `tools/e2e.py` written: 23 checks against the hand-worked key, served from a subpath. First full run: 17 passed, 6 failed. Three of the failures were faults in the checks (a case-sensitive comparison, focus on the browser's own controls read as an error, a wait for the wrong status). The other three traced to the page: a hidden separator placed inside each option's label, which spoiled the option's accessible name and its label text, and a missing icon on the test page. All 23 then passed. 12 bugs were planted one at a time and all 12 were caught. The keyboard check failed about one run in six and exposed a real race in the restart dialog, fixed by listening for the dialog's `cancel` event. Every authored line was read as the player sees it and checked against the sources (task T042); three wordings changed. Commit dd0aae5 at 15:28. |
| 2026-11-19 15:28–15:32 | Packaging | Card image and README screenshot captured from the running game by `tools/e2e.py --card`. A splitter mark added to the header. A private review copy published for the owner as a Claude artifact at 15:31. |
| 2026-11-19 15:34 | Owner | Said he would review the game in the evening, and intends to submit before the deadline of 2026-11-20. |
| 2026-11-19 15:32–15:41 | Packaging | The plan, research notes, UI contract and task list brought in line with the game as built. Requirement traceability of the browser checks corrected against the specification's numbering, and three assertions added (FR-003, FR-005, FR-026). One unit test added for FR-002. README, `ARCADE.md` and the verification record written. Unit tests 158, oracle 169 comparisons, browser checks 23, all passing at 15:41. |
| 2026-11-19 15:42 | Fresh copy | Commit f5c2bfa cloned into an empty folder: 158 unit tests, 169 oracle comparisons and 23 browser checks all passed there, and the README's run command served the game. This is the recorded build finish: 15:42:50. |

## Step records

### 1 · Constitution: Sync Impact Report

The command writes this report as a comment at the top of the constitution for review and asks for it to be removed before the file is committed. It is kept here.

```text
Sync Impact Report
Version change: (template, unversioned) → 1.0.0
Bump rationale: first ratified constitution for the project (initial adoption = 1.0.0).
Source: StarterKit/CONSTITUTION.md, the owner's planning input. All seven principles carried over
with their evidence clauses; "must" was tightened to MUST, nothing was weakened or removed.
Modified principles: none renamed. The template's five principle slots were extended to seven
(I–VII correspond to C1–C7 of the planning input).
Added sections: Scope and Model Boundaries; Evidence and Workflow; Governance.
Removed sections: none.
Conflicts flagged (not silently resolved):
  1. C2 and the specification's release evidence ask for a teammate's observation and a person's
     keyboard-only playthrough. The build agent cannot supply a person. Kept as REQUIRED owner
     evidence; automated checks may supplement it but MUST be reported as automation.
  2. The planning input says "60-minute workshop build". The build ran after the workshop,
     outside the room. Scope is unchanged; the wording records the difference.
  3. C1 requires that rounding never decide an answer. This forces a content rule (every total
     exact to 0.1 dB) that the plan and the validator must carry.
Follow-up TODOs: none deferred. Ratification date is the adoption date, 2026-11-19.
```
