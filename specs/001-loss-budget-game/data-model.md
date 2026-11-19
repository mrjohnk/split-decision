# Data Model: Split Decision, first playable version

Phase 1 of `/speckit-plan`. Entities come from the specification's Key Entities. Authored entities live in `data/levels.json`; derived entities are computed and never stored.

## Authored entities

### Content document

| Field | Type | Rule |
| --- | --- | --- |
| `schemaVersion` | integer | Must be `1` |
| `title` | string | Non-empty |
| `lossCard` | Loss card | Required |
| `classes` | map of class name → Loss class | At least one |
| `sources` | list of Source | IDs unique |
| `model` | Model notes | Required |
| `levels` | list of Level | IDs unique; each has exactly two rounds |

### Loss card

| Field | Type | Rule |
| --- | --- | --- |
| `fiberDbPerKm` | number | Greater than 0; exact to 0.001 |
| `connectorPairDb` | number | Greater than 0; exact to 0.001 |
| `spliceDb` | number | Greater than 0; exact to 0.001 |
| `splitterDb` | map of ratio → number | Keys are whole numbers of 2 or more; values greater than 0 |
| `sourceIds` | list of Source ID | Each must exist |

### Loss class

| Field | Type | Rule |
| --- | --- | --- |
| `minDb` | number | 0 or more |
| `maxDb` | number | Greater than `minDb` |
| `sourceId` | Source ID | Must exist |

### Source

`id`, `title`, `url`, `section`, `claim`: all non-empty strings. `url` starts with `https://`.

### Model notes

`rule` (list of strings), `assumptions` (list of strings), `leftOut` (list of strings): the plain-language statement of the model and its simplifications shown to the player (FR-022).

### Level

| Field | Type | Rule |
| --- | --- | --- |
| `id` | string | Unique |
| `title` | string | Non-empty |
| `outcome` | string | The learning outcome, LO1 to LO3 |
| `practiced` | string | One line for the session summary: what the level practiced |
| `briefing` | Briefing | Required |
| `rounds` | list of Round | Exactly two |

### Briefing

`intro` (list of paragraphs), `terms` (list of `{ term, meaning }`), `example` (a worked example whose numbers differ from every round: `{ title, class, plant, attenuators, result }`, a small plant with no open splitter that the evaluator computes, so its ledger cannot disagree with the loss card), `sourceIds` (at least one, each must exist).

### Round

| Field | Type | Rule |
| --- | --- | --- |
| `id` | string | Unique across the document |
| `title`, `place`, `story`, `goal` | string | Non-empty |
| `class` | class name | Must exist in `classes` |
| `plant` | Plant | Required |
| `options` | list of Option | Two or more; IDs unique within the round |
| `hints` | list of string | Exactly two: the method, then a worked step |
| `explain` | string | Why the answer works; shown on the correct submission |

### Plant

A tree. `plant.oltLabel` names the OLT port. `plant.trunk` is a Segment.

- **Segment**: `fiberKm` (0 or more), `connectorPairs` and `splices` (whole numbers, 0 or more), `to` (a Node).
- **Node, splitter**: `type: "splitter"`, `id` (unique in the round), `label`, `ratio` (a ratio on the loss card, or `null` when the option chooses it), `legs` (one or more Segments).
- **Node, ONT**: `type: "ont"`, `id` (unique in the round), `label`, optional `note`.

At least one ONT must be reachable.

### Option

| Field | Type | Rule |
| --- | --- | --- |
| `id` | string | Unique in the round. This is the answer's identity |
| `label` | string | Non-empty |
| `served` | integer | 1 or more: the homes this design serves |
| `servedLabel` | string, optional | Replaces "Serves N homes" when the count needs words |
| `splitters` | map of splitter ID → ratio | Must set every open splitter and nothing else; each ratio on the loss card |
| `attenuators` | list of `{ at, db }` | `at` is `"olt"` (shared by every ONT) or an ONT ID in the round; `db` greater than 0 |
| `note` | string | Required for every option that is not the round's answer: the mistake that usually leads here. Optional for the answer |
| `expect` | outcome, required with `note` | Must equal the computed outcome |

### Value tokens in authored text

Authored text never contains a hand-typed dB value. It carries value tokens, which are filled from the loss card, the classes and the evaluator when the text is shown, so that a change to the data cannot leave a stale number in a sentence.

| Token | Filled with | Where it may appear |
| --- | --- | --- |
| `{fiber}`, `{connector}`, `{splice}`, `{splitter:N}` | Loss card values | Anywhere |
| `{min:CLASS}`, `{max:CLASS}` | A class's limits | Anywhere |
| `{class}`, `{min}`, `{max}`, `{window}` | The round's or example's class | Rounds and examples |
| `{fixed:ONT}`, `{fiber:ONT}`, `{connectors:ONT}`, `{splices:ONT}`, `{installed:ONT}` | The ONT's loss from fixed elements, and its parts | Rounds and examples |
| `{total:ONT}`, `{margin:ONT}`, `{chosen:ONT}`, `{bigOnly:ONT}`, `{small:ONT}` | The ONT's total, its distance to the limit, the loss the option adds, the total without connectors and splices, and the connectors and splices alone | Option notes (for that option), explanations and worked examples (for the answer or the example) |
| `{answer}` | The answer's label | Explanations only |

An unknown token, or a token that names an ONT or class that does not exist, is a validation error.

## Derived entities

### Path

For one ONT: the ordered elements from the OLT port to it. Derived by walking the plant. Totals: fiber km, connector pairs, splices, and the splitters met on the way.

### Ledger line

`{ kind, label, detail, lossMilli }` where `kind` is `fiber`, `connectors`, `splices`, `splitter` or `attenuator`. `lossMilli` is a whole number of thousandths of a dB. One line each for fiber, connectors and splices (summed along the path), one for each splitter and one for each attenuator.

### ONT result

`{ id, label, totalMilli, state, marginMilli, ledger }`. `state` is `ok`, `over` or `under`. `marginMilli` is the distance to the limit that was missed for `over` and `under`, and for `ok` the room left before the maximum.

### Option result

`{ optionId, served, valid, onts }`. `valid` is true when every ONT is `ok`.

### Round evaluation

`{ window: { className, minMilli, maxMilli }, options: [Option result], best: { optionId, served } | null, problem: null | "no-valid-option" | "tie-for-best" }`.

### Evaluation (of one answer)

`{ status, reasonCode, expected, evidence }` as defined in [contracts/rules.md](./contracts/rules.md).

## Session state

Held in memory by `engine/state.js`. Nothing is stored.

| Field | Type | Meaning |
| --- | --- | --- |
| `view` | `"briefing"`, `"round"` or `"summary"` | The current screen |
| `levelIndex`, `roundIndex` | integers | The current level and round |
| `finishedLevelId` | level ID or `null` | Set on entering a briefing straight after finishing a level; its summary is shown there |
| `confirmingRestart` | boolean | The restart confirmation is open |
| `rounds[roundId].selected` | option ID or `null` | The current selection |
| `rounds[roundId].attempts` | integer | Valid submissions made while the round was unsolved |
| `rounds[roundId].hints` | 0, 1 or 2 | Hints revealed |
| `rounds[roundId].solutionViewed` | boolean | The worked solution was opened |
| `rounds[roundId].solved` | boolean | A correct submission was made |
| `rounds[roundId].last` | Evaluation with its option ID, or `null` | The feedback on screen |
| `rounds[roundId].guidance` | string or `null` | Input guidance after an empty submission |

### Transitions

```text
loading ──content valid──▶ briefing(level 1)
loading ──content invalid or load failed──▶ content error ──retry──▶ loading

briefing(level n) ──start──▶ round(n, 1)
round ──submit, nothing selected──▶ round            guidance shown; attempts unchanged
round ──submit, incorrect──▶ round                    attempts + 1; feedback shown; still open
round ──submit, correct──▶ round (solved)             attempts + 1; solved; Next enabled
round (solved) ──submit──▶ round (solved)             no change
round(n, 1) (solved) ──next──▶ round(n, 2)
round(n, 2) (solved) ──next──▶ briefing(level n+1)    with the summary of level n
round(3, 2) (solved) ──next──▶ summary
any ──restart──▶ same, confirmation open ──confirm──▶ briefing(level 1), fresh session
                                         ──cancel──▶ same, unchanged
```

Rules that hold in every state:

- `select`, `hint`, `solution` and reopening the briefing never submit and never change `attempts` or `solved`.
- `hint` moves `hints` from 0 to 1 to 2 and stops. `solution` works only when `hints` is 2. Both do nothing once the round is solved.
- `next` does nothing unless the current round is solved.
- `solved` never returns to false except by a confirmed restart.

## Summary figures

For each round: `attempts`, `hints`, `solutionViewed`, `solved`. For each level and for the session: rounds solved, attempts, hints used, worked solutions viewed. For the session also: rounds solved without the worked solution, and rounds solved with no help at all (`hints` is 0 and `solutionViewed` is false). No score, grade or mastery label is derived (FR-016).
