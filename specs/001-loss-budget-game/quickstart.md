# Quickstart: run and validate Split Decision

A guide to proving the feature works. Details of the rule, the content and the page are in [contracts/](./contracts/) and [data-model.md](./data-model.md).

## Prerequisites

- To play: a current desktop browser and Python 3 (only to serve the files).
- To run the checks from a terminal: Node 20 or later.
- For the browser checks: Python 3 with Playwright and a Chrome or Chromium it can drive. Developer-only.

## Run the game

From the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000. On Windows use `py` in place of `python3`. If port 8000 is busy, use another port in both places.

**Expected**: the Level 1 briefing, "Add it up". No challenge is visible until "Start level 1" is chosen.

## Run the checks

| Command | Expected outcome |
| --- | --- |
| `node tests/run-node.mjs` | Every test passes; the last line gives the totals; exit status 0 |
| Open http://127.0.0.1:8000/tests/ | The same totals, with a visible "all passed" summary |
| `python3 tools/oracle.py` | Every hand-worked case recomputed from `data/levels.json` agrees; exit status 0 |
| `python3 tools/e2e.py` | Each acceptance scenario reports pass; screenshots are written to `docs/verification/` |

## Validation scenarios

1. **First decision (AC1 to AC4)**. Start level 1. In round 1-1 press Submit with nothing selected: guidance appears and the attempt count stays at 0. Submit 1:64: "Too dark at ONT A", 30.4 dB, 2.4 dB over 28 dB; the round stays open. Submit 1:16: the design works but a larger option also fits. Submit 1:32: solved, 26.9 dB, the ledger 7.0 + 2.0 + 0.4 + 17.5.
2. **Help and progress (AC5 to AC7)**. In round 1-2 open hint 1, hint 2 and the worked solution, then submit 1:16. Choose Next: the Level 2 briefing opens with Level 1's summary showing the attempts, the two hints and the worked solution.
3. **Restart (AC8)**. Choose Restart, then "Keep playing": nothing changes. Choose Restart, then "Restart the game": the Level 1 briefing, with no progress.
4. **Too much light (level 3)**. In round 3-1 submit "Build it as drawn": "Too bright", 5.2 and 5.3 dB, under the 8 dB minimum. In round 3-2 submit the attenuator at the OLT port: ONT B is too dark at 36.4 dB.
5. **Keyboard only (AC9)**. Play from a fresh start to the summary without a pointer.
6. **Reduced motion and narrow window (AC10, FR-025, FR-027)**. Request reduced motion in the operating system or the browser's rendering settings and submit an answer: the feedback is there at once and nothing moves. Narrow the window to 320 pixels: the page does not scroll sideways and Submit can be reached.
7. **Unsupported content (FR-019)**. `tests/content.test.js` builds copies of the content for cases U1 to U6 and confirms that each is rejected.

## What a pass does not show

The checks establish that the code behaves as specified. A person still has to review the teaching content against the references, play the game with the keyboard, and say what they learned (SC-004, SC-008).
