# Contract: the content file (`data/levels.json`) and its validation (`engine/content.js`)

The shape of the document is in [data-model.md](../data-model.md). This contract fixes how it is checked.

## `validateContent(doc)`

Returns `{ ok: true, content }` or `{ ok: false, errors }`. It never throws for bad content and never returns a partly valid document. Each error is `{ code, where, message }`; `where` names the level and round, for example `level-2 / r2-1 / option o64`.

The whole file is validated before the first screen. When `ok` is false the game shows the content error view and nothing is graded (FR-019).

## Error codes

| Code | Raised when | Specification case |
| --- | --- | --- |
| `schema` | A required field is missing, has the wrong type, or is empty | |
| `duplicate-id` | Two levels, rounds, sources, or two ONTs, splitters or options in one round, share an ID | |
| `unknown-class` | A round names a class that is not defined | U3 |
| `unknown-ratio` | A splitter ratio is not on the loss card | U3 |
| `open-splitter` | An option leaves an open splitter unset, or sets a splitter that is not open or does not exist | |
| `attenuator-place` | An attenuator sits at a place that is neither `"olt"` nor an ONT of the round | |
| `bad-number` | A length, count, loss or `served` is negative, not finite, not whole where it must be, or not exact to 0.001 | |
| `inexact-total` | An ONT's total for some option is not a whole tenth of a dB | U4 |
| `no-valid-option` | Every option leaves an ONT outside the window | U1 |
| `tie-for-best` | Two valid options serve the same largest number of homes | U2 |
| `note-mismatch` | An option's `expect` differs from its computed outcome, or a `note` has no `expect` | U5 |
| `missing-note` | An option that is not the round's answer has no `note` | |
| `unknown-source` | A briefing, class or loss card cites a source ID that is not defined | U6 |
| `bad-hints` | A round does not have exactly two hints | |
| `bad-level` | A level does not have exactly two rounds | |

## Order of checks

Shape first, then identities, then references, then numbers, then the evaluation-based checks (`inexact-total`, `no-valid-option`, `tie-for-best`, `note-mismatch`, `missing-note`). Evaluation-based checks run only for rounds whose earlier checks passed, so that one mistake is reported once.

## What the tests must establish

- The shipped `data/levels.json` validates with no error.
- A copy of the shipped content altered to produce each of U1 to U6 fails with the code in the table, and `where` names the altered round.
- Each remaining code is produced by at least one altered copy.
- The shipped content is not modified by validation.
