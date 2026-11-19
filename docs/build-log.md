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
