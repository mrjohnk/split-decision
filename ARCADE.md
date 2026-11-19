---
# ARCADE SUBMISSION for Split Decision. Everything between the two --- lines is machine-read.
# Filled by the build agent from docs/build-log.md and its own session. Fields marked (HUMAN)
# are left for the owner. Nothing here is estimated: what was not recorded says "unknown".
arcade_version: 1

game:
  title: "Split Decision"
  slug: split-decision
  tagline: "Pick the splitter that lights every home: not too dark, not too bright."
  summary: "You design the outside plant of a small fiber network. Each work order shows a PON, and you choose the splitter or the attenuator that gives every ONT a receive level inside its window while serving the most homes. A loss trace and a dB-by-dB ledger explain every result, right or wrong."
  topics: [PON, optical loss budget, splitters, attenuators, FTTH, XGS-PON]
  category: network-fundamentals
  skill_level: beginner        # no optics knowledge assumed; the first briefing teaches the basics
  play_minutes: 12             # the specification's target is 10 to 15 minutes; not timed with a person
  levels: 3                    # three levels of two work orders each: six rounds
  card_image: "assets/card.webp"
  card_image_alt: "The work order for Palo Verde Loop: a PON drawing with a 1:64 splitter chosen in orange, three design options, and a dark panel where a loss trace follows three ONTs down from the launch power to the receive window."
  repo: ""                     # (HUMAN) the public GitHub URL, once the repository exists
  repo_path: ""
  license: "Apache-2.0"

creator:                     # (HUMAN) every field here is the owner's to fill
  name: ""
  github: ""
  location: ""
  organization: ""
  links: []
  first_spec_project: true   # (HUMAN) the template's default, not a claim: set it to what is true
  workshop: "NAF AC6"
  consent_to_publish: false  # (HUMAN) set true only if you agree to this card appearing in the Arcade

build:
  started: "2026-11-19T14:07:13Z"    # git init and specify init
  finished: "2026-11-19T21:33:45Z"            # the last check, the fresh-copy run after the owner's second review; anything after it is not included
  wall_time: "7h26m32s"           # from started to finished, both read from the session clock. It includes about 4h26m, from 16:18 to 20:44, in which the build agent was idle and waiting for the owner's review: about 3 hours of work
  spec_driven:
    framework: "GitHub Spec Kit"
    framework_version: "specify CLI 1.4.3.dev0"
    artifacts: [constitution, spec, clarify, plan, tasks, analysis, checklists]
    task_count: 71               # 49 in the first plan, 10 more for the owner's first review, 12 more for his second
    loops_or_phases: 8         # the eight phases of specs/001-loss-budget-game/tasks.md; the seventh and eighth are the owner's two reviews
  model: "claude-fable-5-2"
  helper_models: []            # no sub-agent or second model was used
  harness: "Claude Code"       # run as a cloud session opened from the Claude app
  harness_version: "2.1.328"
  mcp_servers: ["Called: claude-artifacts (one private review build published for the owner), claude-code-remote (listing repositories), the harness's past-chat search and memory (read once each at the start)", "Connected but not called: Claude Docs, Claude in Chrome, Google Drive, remote-devices, visualize, widgets"]
  rag_and_sources: ["ITU-T G.9807.1 (02/2023), Annex B", "ITU-T G.652 (08/2024), Table 2 and Appendix I", "The FOA Reference Guide: loss estimates; attenuators", "TEC GR/TX/OPT-001/01/APR-12 (splitter insertion loss)", "NAF AC6 workshop repository: lab guide, StarterKit, three example games, the workshop deck", "The Arcade page at automateyournetwork.com/arcade", "The owner's field experience: the receive window, the launch power, and the wording about connectors"]
  skills_and_plugins: ["Spec Kit skills: speckit-constitution, speckit-specify, speckit-clarify, speckit-plan, speckit-tasks, speckit-analyze, speckit-implement", "frontend-design skill", "dataviz skill and its palette validator", "pptx skill (to read the workshop deck)"]
  other_tools: ["git", "Node 22.23.5 (unit tests)", "Python 3.13.18 (answer-key oracle, browser checks)", "Playwright 1.63.0 with Chrome for Testing 153.0.8010.12, headless", "Pillow 12.3.0 (card image)", "fontTools 4.67.0 (inspecting the vendored fonts)", "axe-core 4.14.1 (accessibility audit, run in the browser checks)", "npm (to fetch the Fontsource packages of Barlow, and axe-core)"]
  human_prompts: 11            # typed messages up to 2026-11-19T21:51Z, plus one two-question dialog
  usage:
    input_tokens: unknown
    output_tokens: unknown
    cost_note: "not available to the build agent; not estimated"
  ai_generated_assets: ["code, content and documents: written by the build agent", "drawings and icon: SVG written by the build agent", "card image and README screenshot: captures of the running game", "fonts: not AI (Barlow, SIL Open Font License)", "audio: none"]

runtime:
  kind: static-web
  stack: [HTML, CSS, JavaScript ES modules, inline SVG]
  start: "python3 -m http.server 8000 --bind 127.0.0.1"
  url_after_start: "http://127.0.0.1:8000"
  hosted_url: ""
  static_root: "."
  requires_install: false
  requires_network: false
  requires_api_key: false
  uses_ai_at_runtime: false
  browsers: ["Chrome for Testing 153 (headless, Playwright)"]
  accessibility: "Tested by automation in headless Chrome only: a keyboard-only playthrough of all six work orders with visible focus; accessible names for every control; text contrast of at least 4.5 to 1; no violation reported by axe-core 4.14.1 in 12 views; no animation under reduced motion; no sideways scrolling at 320 pixels. Each state has words and a shape. Not tested by a person, with a screen reader, or in Firefox or Safari."
  save_state: "none; reloading the page starts a fresh session"

verification:
  tests: "node tests/run-node.mjs && python3 tools/oracle.py && python3 tools/e2e.py"
  tests_passing: 198           # 173 unit tests (Node, and the same in the browser) + 25 browser checks (Playwright; one of them, the axe-core audit, needs --axe); the Python oracle's 227 comparisons with the hand-worked key are not counted here
  facts_sourced_from: ["The project owner's field practice (the game's receive window, -28 to -8 dBm, and its launch power, +5 dBm; decisions D13 and D14 in the specification)", "ITU-T G.9807.1 (02/2023) Annex B, clause B.9.2.6.2, Table B.9.3 (the standard's OLT launch power and ONU receiver figures, shown for comparison)", "ITU-T G.9807.1 (02/2023) Annex B, clause B.6.1, Table B.6.1 (the standard's N1 and N2 loss classes, shown for comparison; attenuators below the class minimum)", "ITU-T G.9807.1 (02/2023) Annex B, clauses B.9.2.6.1 and B.9.2.8.1 (what the loss range includes; wavelengths)", "ITU-T G.652 (08/2024) Appendix I, Table I.1 (fiber attenuation)", "The FOA Reference Guide (connector and splice loss; attenuators)", "TEC GR/TX/OPT-001/01/APR-12 (splitter insertion loss)"]
  known_limits: ["No person has played or timed the game; every check was run by a script in headless Chrome", "Only the level an ONT receives is checked, with the upstream fiber value; the upstream direction is not checked, and no repair or ageing margin is kept", "One launch power stands for the range of a real transmitter, with no path penalty", "Splitters lose 3.5 dB for each two-way split, with no difference between ports", "The receive window and the launch power are the owner's field values, not figures quoted from ITU-T G.9807.1", "The standard's limit on the difference between two paths is not graded", "Reflectance and bend loss are not modeled", "Six fixed work orders", "The loss card's planning values were chosen by the build agent inside published ranges; asked about the fiber value, the owner kept the card as it is"]
---

## In one paragraph

Split Decision is a puzzle about the first question of PON design: how far can this route be split? You are handed six work orders in the fictional Saguaro Valley. Each shows a small XGS-PON, a loss card, the launch power at the OLT and the window of light an ONT can work with, and you choose the splitter, or the attenuator, that puts every ONT's receive level inside that window while serving the most homes. A loss trace shows the light level falling at each element of the path, and a ledger adds it up, so a wrong design teaches as much as a right one. It is for network engineers, sales engineers and students who know IP networking and have never budgeted an optical path; nothing about optics is assumed.

## How it was built

The owner chose the topic and asked the build agent to make the design calls from the workshop's defaults, record each one, and hand back a playable game to review. The agent read the workshop materials and the ITU-T and FOA sources, designed six work orders, and worked every option by hand before any code existed. That hand-worked key became the specification's test cases.

Spec Kit ran in order: constitution, specify, clarify, plan, tasks, analyze. Planning found that the specification let feedback name the answer for a design that works but is too small, and the specification was corrected. Analysis found 16 issues, one critical; all but two minor ones were fixed in the artifacts before any code.

Implementation began with the tests. The engine passed on its first run, which proves little, so bugs were planted to see the tests fail; in the final build that was 26 bugs, all caught. A keyboard-only browser check found a real fault, a late close event that could cancel a restart dialog just reopened.

Then the owner reviewed it, twice. First he set the window's limits at 8 and 28 and had "connector pair" changed to "connector", because a PON is a single fiber. The agent applied 8 and 28 as path loss, as written, and recorded the other reading. In the second review he said they are the ONT's receive levels and gave the launch power, so the game now works out a receive level in dBm for every ONT. Two points were left with him, the sign of that launch power and the loss card's fiber value, and he settled both: plus five, and keep the card. Each time the change went into the specification and the constitution first; the work orders were re-worked by hand, the tests were seen to fail, and then the content and the code changed.

## What we'd tell the next builder

- Work your answers by hand before the code exists, and keep them in a file the code never writes. Ours is checked three ways: by the unit tests, by a second implementation in another language, and by a browser that reads the numbers off the page. When the owner changed the window, and then its unit, that file changed first and the tests failed, which is what told us exactly what to re-work.
- When everything passes on the first run, plant a bug. A suite that has never failed has not shown that it can.
- Do not type numbers into sentences. Our briefings and explanations carry tokens that the engine fills, so changing the loss card cannot leave a stale sentence behind, and the validator names any work order whose answer moved.
