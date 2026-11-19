# Contract: the evaluator (`engine/rules.js`)

Everything that decides an answer is here. The module has no access to the page, the clock, the network or random numbers. The same inputs give the same result.

## Units

All arithmetic is in whole thousandths ("milli"): of a dB for a loss, of a dBm for a level. `toMilli(x)` converts an authored decimal and reports a value that is not exact at that resolution. A level may be negative. Display divides by 1000 and shows one decimal place; validation guarantees that every displayed total, and so every displayed level, is a whole tenth.

## `pathsOf(plant)`

Walks the plant and returns one path for each ONT, in the order the ONTs appear:

```text
{ ontId, label, note, fiberMilliKm, connectors, splices, splitters: [{ id, label, ratio | null }] }
```

`fiberMilliKm` is the summed fiber length in thousandths of a km.

## `evaluateOption(content, round, option)`

For each path:

```text
total = fiberKm × card.fiberDbPerKm
      + connectors × card.connectorDb
      + splices × card.spliceDb
      + Σ card.splitterDb[ratio]            ratio is fixed, or option.splitters[id] for an open splitter
      + Σ attenuator.db                     for attenuators at "olt" and at this ONT
level = window.launch − total               the receive level, in dBm (FR-029)
state = "dark"   when level < window.dark
        "bright" when level > window.bright
        "ok"     otherwise                   both limits are inside the window
```

Returns `{ optionId, served, valid, onts: [{ id, label, totalMilli, levelMilli, state, marginMilli, ledger }] }`. `valid` is true when every ONT is `ok`.

`marginMilli`: for `dark`, dark − level; for `bright`, level − bright; for `ok`, level − dark, the room left above the dark limit.

The window of a class is `{ className, named, launchMilli, darkMilli, brightMilli }`: the launch power at the OLT port and the two limits of the receive level at an ONT. The states are named for what the player sees, not for a side of a limit: with negative levels the ONT that is too dark is under its limit (decision D15).

## `evaluateRound(content, round)`

Evaluates every option and finds the answer.

```text
valid options, most homes first
  none                       → problem "no-valid-option", best null
  two share the largest      → problem "tie-for-best", best null
  otherwise                  → best = { optionId, served } of the first
```

Returns `{ window: { className, named, launchMilli, darkMilli, brightMilli }, options, best, problem }`. `named` is true when the content has more than one class, and only then do the words shown to the player carry the class name.

## `outcomeOf(roundEvaluation, optionId)`

| Outcome | When |
| --- | --- |
| `best-valid` | The option is the round's answer |
| `valid-not-best` | The option is valid and another valid option serves more homes |
| `too-dark` | At least one ONT is `dark` and none is `bright` |
| `too-bright` | At least one ONT is `bright` and none is `dark` |
| `dark-and-bright` | At least one ONT is `dark` and at least one is `bright` |

## `evaluate(content, round, answer)`

`answer` is an option ID, or `null` when nothing is selected.

| Condition | `status` | `reasonCode` | `expected` |
| --- | --- | --- | --- |
| The round has a problem | `content-error` | `no-valid-option` or `tie-for-best` | `null` |
| `answer` is `null` or empty | `invalid-input` | `no-selection` | `null` |
| `answer` is not an option of the round | `invalid-input` | `unknown-option` | `null` |
| The option is the answer | `correct` | `best-valid` | `{ optionId }` |
| Otherwise | `incorrect` | the option's outcome | `{ optionId }` of the answer |

`evidence` for `correct` and `incorrect`:

```text
{ optionId, window, served, valid, onts, largerValidExists }
```

`largerValidExists` is true for `valid-not-best`. The evidence never carries the answer's label; `expected` is for the state module and the tests, and the feedback module must not print it for an incorrect submission (FR-011).

## What the tests must establish

- Each of the 20 `round/option` cases in the specification gives the hand-worked totals, receive levels, states and outcome.
- B1 and B3 are inside the window, exactly on a limit; B2 and B4 are outside by 0.1 dB.
- `evaluate` returns `invalid-input` for `null` and for an unknown option ID.
- Recomputing the shipped rounds with a fiber value of 0.35 dB/km, the downstream figure, leaves every ONT that the game calls inside or too bright in that state.
- Calling any function twice with the same inputs returns equal results, and the inputs are unchanged afterwards.
