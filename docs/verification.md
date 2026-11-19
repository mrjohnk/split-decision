# Verification record

Results of every check, as they were run. Times are UTC. A check that was not run says so.

## Phase 2 · The rule, the content and the session (2026-11-19 14:48)

Environment: Node v22.23.5 and Python 3.13.18 on Linux, in the build agent's cloud workspace.

| Check | Command | Result |
| --- | --- | --- |
| Tests written first fail without the engine | `node tests/run-node.mjs` before `engine/` existed | Failed as expected: "Cannot find module engine/rules.js" |
| Unit tests | `node tests/run-node.mjs` | 151 passed, 0 failed, 151 total |
| Independent answer-key check | `python3 tools/oracle.py` | All 169 checks agree with the hand-worked key |
| The tests catch planted bugs | Four temporary changes to the engine, each reverted | Each was caught (see below) |

Planted bugs, to confirm that a pass means something:

| Planted bug | Caught by |
| --- | --- |
| A path exactly at the maximum treated as outside the window | `rules/boundary/B1` (1 test failed) |
| Connector pairs left out of the sum | 73 tests failed |
| An empty submission counted as an attempt | `state/AC4` (1 test failed) |
| Feedback for a wrong answer names the answer | 14 tests failed |
