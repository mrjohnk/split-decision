# Contract: the session (`engine/state.js`)

The session is changed only by `reduce(state, action, content)`, which returns a new state and never touches the page. The fields and the transition table are in [data-model.md](../data-model.md).

## Actions

| Action | Allowed when | Effect | Never changes |
| --- | --- | --- | --- |
| `start-level` | `view` is `briefing` | `view` becomes `round`; `finishedLevelId` cleared | attempts, hints, solved |
| `select` (option ID) | `view` is `round`, round unsolved, the ID is an option of the round | `selected` set; `guidance` cleared | attempts, solved, `last` |
| `submit` | `view` is `round`, round unsolved | Evaluates `selected`. `invalid-input`: `guidance` set. `incorrect`: attempts + 1, `last` set. `correct`: attempts + 1, `solved` true, `last` set | hints, `solutionViewed` |
| `hint` | `view` is `round`, round unsolved, `hints` below 2 | `hints` + 1 | attempts, solved |
| `solution` | `view` is `round`, round unsolved, `hints` is 2 | `solutionViewed` true | attempts, solved |
| `next` | `view` is `round`, round solved | Next round, or next level's briefing with `finishedLevelId` set, or `summary` | every round's record |
| `request-restart` | always | `confirmingRestart` true | everything else |
| `cancel-restart` | `confirmingRestart` | `confirmingRestart` false | everything else |
| `confirm-restart` | `confirmingRestart` | A fresh session at the first briefing | |

An action that is not allowed returns the state unchanged. An unknown action returns the state unchanged.

A `content-error` result from `submit` cannot occur for validated content; if it does, the state is returned unchanged with `guidance` set to a content-error message, and nothing is counted.

## `summarize(state, content)`

Returns, for each level, its rounds with `attempts`, `hints`, `solutionViewed` and `solved`, and totals for the level and the session: `rounds`, `solved`, `attempts`, `hints`, `solutionsViewed`, and for the session `solvedWithoutSolution` and `solvedWithNoHelp`.

## What the tests must establish

- AC4: `submit` with nothing selected leaves attempts and solved unchanged and sets guidance.
- AC6: each incorrect `submit` adds one attempt; the correct `submit` adds one and solves; a further `submit` changes nothing.
- A valid design that is not the answer counts as one attempt (clarification 2).
- AC5: `hint`, `hint`, `solution` record 2 hints and the solution, change neither attempts nor solved, and `solution` before two hints does nothing.
- Help does nothing once the round is solved (clarification 3).
- AC7: `next` does nothing while the round is unsolved; from round 2 of a level it opens the next briefing with `finishedLevelId`; from the last round it opens the summary.
- AC8: `request-restart` then `cancel-restart` returns a state equal to the one before; `confirm-restart` returns a state equal to a fresh session.
- The summary totals match a scripted playthrough with known attempts and help.
