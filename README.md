# Split Decision

**Pick the splitter that lights every home: not too dark, not too bright.**

Split Decision is a browser game for network engineers, sales engineers and students who know IP networking but have never designed the optical plant of a PON. You play the outside-plant designer for Saguaro Valley's new fiber network. Each work order shows a small PON, and you choose the splitter, or the attenuator, that keeps every ONT inside the XGS-PON loss window. Each work order explains the result decibel by decibel, so you can use it on the next one.

A project from **NAF AC6 — Loop Engineering, Spec-Driven Development & the Future of VibeOps**.

| Project | Details |
| --- | --- |
| Status | Playable. Verified by automated checks in headless Chrome. Not yet played or timed by a person (see [Verification](#verification)) |
| Networking topic | XGS-PON optical loss budgeting: path loss, the N1 and N2 loss classes of ITU-T G.9807.1, splitters in one and two stages, attenuators |
| Typical session | 10 to 15 minutes is the target. It has not been timed with a person |
| Live demo | Not published yet |
| Built by | [OWNER: your name and GitHub handle], with Claude Code (model `claude-fable-5-2`) as the build agent |

![Work order 2-1, Palo Verde Loop: the plant with a 1:64 splitter chosen, three design options, and the loss trace showing ONT C below the N2 window](docs/gameplay.png)

## The challenge

Work order 1-1, Mesquite Lane: the farthest home is 14.0 km from the OLT port, behind 4 connector pairs and 4 splices. The optics are class N1, so the path may lose between 14 and 29 dB. You choose a 1:16, 1:32 or 1:64 splitter and submit.

The game then draws a loss trace, the light falling at each element of the path, and says where the ONT landed. With the 1:64 splitter the path loses 30.4 dB: too dark, 1.4 dB over the maximum. With the 1:16 it works at 23.4 dB, but a larger splitter also fits. The 1:32 is the answer: 7.0 + 2.0 + 0.4 + 17.5 = 26.9 dB, and it serves the most homes.

## What you'll learn

| By the end, you can… | You'll practice by… |
| --- | --- |
| Calculate one ONT's optical path loss by adding fiber, connector, splice and splitter losses, and compare it with the class maximum | Choosing the largest splitter a single path can carry (level 1) |
| Apply the loss window to every ONT on a PON and compare competing designs, including two-stage splits | Choosing among one-stage and two-stage splitter designs for a PON with several ONTs (level 2) |
| Recognize a path with less than the minimum loss and correct it with attenuation in the right place | Choosing an attenuator, and where it goes, for PONs with a very short path (level 3) |

**Before playing:** no knowledge of optics is needed. The first briefing teaches the basics, and each level's briefing has a worked example. You need to be able to add decimal numbers.

## Play locally

Download this repository or clone it using the URL from GitHub's **Code** button, then open a terminal in the project root.

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

On Windows with the Python launcher:

```powershell
py -m http.server 8000 --bind 127.0.0.1
```

Open **http://127.0.0.1:8000** in your browser. Keep the terminal running; **Ctrl+C** stops the server. If port 8000 is busy, use 8001 in both the command and the URL.

The game loads JavaScript modules and a JSON file over HTTP, so it has to be served. Opening `index.html` straight from a folder shows a message that says so. [Why modules need serving](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules). There is nothing to install, and the game requests nothing from any other site.

## How to play

1. Read the level's briefing and its worked example, then choose **Start level**.
2. Read the work order: the plant drawing, the path table, the loss window and the loss card.
3. Select one design and choose **Submit design**.
4. Read the result. The loss trace shows each ONT's light falling along its path. A wrong design tells you which ONT is outside the window, by how much, and a next step, and you can try again. The answer opens **Next**.
5. Use **Show hint 1**, **Show hint 2** and **Show worked solution** when you need help. Help is counted separately from solving.
6. Finish three levels, six work orders, to reach the session summary.

| Control | Action |
| --- | --- |
| Click or tap an option, then **Submit design** | Select a design and submit it |
| Tab, Shift+Tab | Move between controls. The focused control has a 3-pixel outline |
| Arrow keys, Space | Move between the design options and select one |
| Enter | Press the focused button. In the option group, Enter submits the selected design |
| **Show hint 1**, **Show hint 2**, **Show worked solution** | Reveal help in that order: the method, a worked step, then the answer with its full ledger. You still submit the answer yourself. Help closes once the work order is solved |
| **Review briefing**, **Model and sources** | Reopen the level's briefing during a work order; read the rule, what the game assumes and leaves out, and the six sources |
| **Restart** | Asks first. **Keep playing** (or Escape) changes nothing; **Restart the game** clears the session |

**Progress:** each submitted design is one attempt, including a design that works but is not the largest. Submitting with nothing selected counts nothing. A work order is solved only by submitting its answer. Attempts, hints and worked solutions are counted separately and shown in the level and session summaries; there is no score or grade. Nothing is stored in the browser, so reloading the page starts a fresh session.

## What this game models

An ONT's optical path loss is the sum, in dB, of everything between the OLT port and that ONT: fiber, connector pairs, fusion splices, splitters and attenuators. Every ONT must land inside the loss window of the PON's class, limits included: 14 to 29 dB for N1 and 16 to 31 dB for N2. Among the designs that keep every ONT inside the window, the one that serves the most homes is the answer.

The loss card holds planning values, not measurements: fiber 0.5 dB/km, a connector pair 0.5 dB, a fusion splice 0.1 dB, 3.5 dB for each two-way split (so 1:32 is 17.5 dB), and attenuators at the value printed on them. All arithmetic is done in whole thousandths of a dB, and the content is rejected if any total is not exact to 0.1 dB, so rounding never decides an answer.

**Outside the model:** a real design checks each direction at its own wavelength, and the game uses one fiber value, the higher one, for both. A real budget keeps margin for repairs and ageing, and the game keeps none. Transmitter power, receiver sensitivity, reflectance, bend loss and the differences between a splitter's ports are not modeled. The other XGS-PON loss classes and the maximum fiber distance are not used. The standard's limit on the difference between two paths on one PON is not graded, though a test confirms every answer in the game is within it. The game says so in its briefings and in **Model and sources**.

| Reference | What it supports |
| --- | --- |
| [ITU-T G.9807.1 (02/2023)](https://www.itu.int/rec/T-REC-G.9807.1-202302-I), Annex B, clause B.6.1, Table B.6.1 | Loss classes: N1 from 14 to 29 dB, N2 from 16 to 31 dB. Attenuators are required where a path would fall below the class minimum |
| ITU-T G.9807.1 (02/2023), Annex B, clauses B.9.2.6.1 and B.9.2.8.1; Tables B.9.2 to B.9.4 | The loss range includes splices, connectors, attenuators and other passive devices. Paths on one PON may differ by at most 15 dB. Downstream is 1575 to 1580 nm, upstream 1260 to 1280 nm |
| [ITU-T G.652 (08/2024)](https://www.itu.int/epublications/publication/itu-t-g-652-2024-08-characteristics-of-a-single-mode-optical-fibre-and-cable), Appendix I, Table I.1; clause 8, Table 2, Note 2 | Typical link attenuation of 0.5 dB/km for 1260 to 1360 nm and 0.35 dB/km for 1565 to 1625 nm |
| [The FOA Reference Guide: what loss to expect](https://www.thefoa.org/tech/loss-est.htm), connector and splice paragraphs | A typical connector loses about 0.3 dB; TIA-568 allows up to 0.75 dB for a mated pair and 0.3 dB for a splice. The card's 0.5 and 0.1 dB sit inside those figures |
| [The FOA Reference Guide: using attenuators](https://www.thefoa.org/tech/ref/appln/attenuators.html), worked example | A receiver overloads when the cable plant loses less than a minimum; an attenuator adds the missing loss |
| [TEC GR/TX/OPT-001/01/APR-12](https://tec.gov.in/pdf/GRFA/TEC-GR-FA-OPT-001-01-APR-12.pdf), insertion loss table | One published set of maximum splitter losses (4.0, 7.1, 10.5, 13.8, 17.1 and 20.5 dB for 1×2 to 1×64). The game's 3.5 dB for each two-way split is within about half a dB of each |

ITU-T G.671, the usual reference for splitter loss, could not be read past its abstract during the build, so no number in the game is attributed to it.

## How it was built

The project follows the workshop's Spec Kit workflow: **constitution → specify → clarify → plan → tasks → analyze → implement**. The owner chose the topic and asked the build agent to make the design calls from the workshop's defaults, record each one, and present them with a playable game for review. Those decisions are listed as D1 to D10 at the end of [the specification](specs/001-loss-budget-game/spec.md). The verification section below records which behaviors have actually been checked.

- **Stack:** HTML, CSS and JavaScript (native ES modules), inline SVG for the two drawings. No framework, no build step, no runtime dependency.
- **Build tools:** Claude Code 2.1.328 as a cloud session, model `claude-fable-5-2`; GitHub Spec Kit (specify CLI 1.4.3.dev0); Node 22 for the unit tests; Python 3.13 with Playwright 1.63 and Chrome for Testing 153 for the browser checks.
- **Runtime:** a current browser and any static web server. No account, backend, model or API key. No request leaves the game's own folder.
- **Planning inputs:** `StarterKit/CONSTITUTION.md`, `StarterKit/SPEC.md`, `StarterKit/PLAN.md`.
- **Working artifacts:** `.specify/memory/constitution.md`; in `specs/001-loss-budget-game/`: `spec.md` (with its clarifications), `checklists/requirements.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`, `tasks.md`, `analysis.md`. The build agent's own record is `docs/build-log.md`.
- **One useful design decision:** the first specification had the feedback for a design that works but is too small name the correct answer. Planning caught that this contradicts the constitution's rule that a wrong answer gives a next step, not the answer. The specification was changed: the feedback says a larger option also fits and does not name it. A unit test and a browser check now fail if any wrong design's feedback contains the answer.

Two more things worth knowing if you read the code:

- **Authored text carries no typed dB values.** Sentences in `data/levels.json` use tokens such as `{total:A}` and `{max}` that are filled from the loss card and the evaluator, and each briefing's worked example is a small plant the evaluator computes. If you change the loss card, every sentence follows, and the validator reports any work order whose answer changed.
- **The answer key is independent of the code.** The six work orders were worked by hand in the specification before the evaluator existed. The unit tests compare the evaluator with that key, a second implementation in Python (`tools/oracle.py`, decimal arithmetic) recomputes it, and the browser checks compare what the page shows with it.

## Verification

**Last checked:** 2026-11-19, by the build agent, in headless Chrome for Testing 153.0.8010.12 on Linux, with Node 22.23.5 and Python 3.13.18. The full record, with every command, result and screenshot, is in [docs/verification.md](docs/verification.md).

To run the checks yourself, from the repository root:

```sh
node tests/run-node.mjs       # 158 unit tests; needs Node 20 or later
python3 tools/oracle.py       # recomputes the hand-worked answer key in Python
python3 tools/e2e.py          # 23 browser checks; needs: pip install playwright, and Chrome or Chromium
```

The unit tests also run in the browser: start the local server and open **http://127.0.0.1:8000/tests/**.

| Check | Result | Evidence / notes |
| --- | --- | --- |
| Correct, incorrect, and boundary cases | Pass | All 20 options of the six work orders and 4 boundary cases (29.0 and 29.1 dB, 14.0 and 13.9 dB) match the hand-worked key: 158 of 158 unit tests; `tools/oracle.py` agrees on all 169 comparisons; the browser check `FULL` submits all 20 options in the page |
| Unsupported content is not graded | Pass | Cases U1 to U6 are rejected by the validator (unit tests) and show a content error with no challenge in the page (browser check `CONTENT`) |
| Briefings and explanations checked against sources | Pass by the build agent; **not reviewed by a person** | Every stated value was traced to references R1 to R6 on 2026-11-19 (see the record). The loss card's planning values are the build agent's choice and wait for the owner's review |
| Retry, hint, duplicate Submit, completion, restart | Pass | Browser checks `AC3a`, `AC5`, `AC6`, `AC7`, `AC8`; unit tests of the session |
| Keyboard-only core playthrough | Pass by automation; **not run by a person** | Browser check `KEYBOARD`: from the first briefing to the summary with key presses only, at 1366 × 768, checking focus after every action |
| Accessible names, contrast, text size | Pass by automation | `NAMES`; `CONTRAST` (lowest 5.01 to 1); `TEXTSIZE` (running text at least 16 px). No screen reader was used |
| Narrow layout and reduced motion | Pass by automation | `NARROW` at 320, 390 and 768 px: no sideways page scroll, controls reachable; `MOTION`: no animation under reduced motion and the result present at once |
| No request outside the game | Pass | `ORIGIN`: every request of a full playthrough stays under the game's own path, fonts included |
| The checks can fail | Pass | 4 planted bugs caught by the unit tests and 12 of 12 by the browser checks, each reverted |
| Fresh checkout run instructions | FRESH_COPY_RESULT | FRESH_COPY_NOTE |
| A first-time player finishes in 10 to 15 minutes (SC-004) | **Not run** | Needs a person. Waiting for the owner |
| A teammate can say what each level taught (SC-008) | **Not run** | Needs a person. Waiting for the owner |
| Firefox, Safari, a real phone, a screen reader | **Not run** | Only headless Chrome was available to the build |
| Published demo | Not run | Not published |

## Known limitations and next steps

- **Known limitation:** no person has played the game yet. Everything above marked "by automation" was done by a script in one browser.
- **Known limitation:** the model is deliberately small. See "Outside the model" above. In particular the game uses one fiber value for both directions and keeps no margin, so its answers are right for the game's loss card and are not a design rule.
- **Known limitation:** six fixed work orders. Once you know the answers there is nothing new to solve.
- **Known limitation:** the loss trace has three line colors that were checked for color-vision deficiency. A work order with more than three ONTs would draw the rest in the text color, told apart by their labels only.
- **Next improvement:** add a seventh work order that needs both ends of the window at once, a design where the nearest ONT needs an attenuator and the farthest needs a smaller split. It is data only: the engine already grades any round the validator accepts, and a unit test proves that with a trial round.

Found an incorrect answer or unclear explanation? Open an issue with the level and work order, the values shown, your choice, the expected result, the actual result, and a reference if you have one.

## Credits

Created by [OWNER: your name], with Claude Code (`claude-fable-5-2`) as the build agent. Workshop by John Capobianco, Joksan Flores, and Elliot Conner. Adapted from the [NAF AC6 workshop materials](https://github.com/automateyournetwork/NAF_AC6) and [Networking Video Game Starter Kit](https://github.com/automateyournetwork/NetworkingVideoGameStarterKit), using [GitHub Spec Kit](https://github.com/github/spec-kit).

**Assets and dependencies:** the code, the content, the drawings, the icon and the card image are original to this project; the card image and the README screenshot are captures of the running game. The typefaces are [Barlow and Barlow Condensed](https://github.com/jpt/barlow) by The Barlow Project Authors, included in `assets/fonts/` under the SIL Open Font License 1.1 (`assets/fonts/OFL-Barlow.txt`, `assets/fonts/OFL-Barlow-Condensed.txt`). The game has no other dependency.

**License:** Apache License 2.0. See [LICENSE](LICENSE). The font files keep their own license, named above.
