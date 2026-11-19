---
# ARCADE SUBMISSION for Split Decision. Everything between the two --- lines is machine-read.
# Filled by the build agent from docs/build-log.md and its own session. Fields marked (HUMAN)
# are left for the owner. Nothing here is estimated: what was not recorded says "unknown".
arcade_version: 1

game:
  title: "Split Decision"
  slug: split-decision
  tagline: "Pick the splitter that lights every home: not too dark, not too bright."
  summary: "You design the outside plant of a small fiber network. Each work order shows a PON, and you choose the splitter or the attenuator that keeps every ONT inside the XGS-PON loss window while serving the most homes. A loss trace and a dB-by-dB ledger explain every result, right or wrong."
  topics: [XGS-PON, optical loss budget, splitters, attenuators, ITU-T G.9807.1, FTTH]
  category: network-fundamentals
  skill_level: beginner        # no optics knowledge assumed; the first briefing teaches the basics
  play_minutes: 12             # the specification's target is 10 to 15 minutes; not timed with a person
  levels: 3                    # three levels of two work orders each: six rounds
  card_image: "assets/card.webp"
  card_image_alt: "The work order for Palo Verde Loop: a PON drawing with a 1:64 splitter chosen in orange, three design options, and a dark panel where a loss trace follows three ONTs toward the N2 window."
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
  finished: "2026-11-19T15:42:50Z"   # the last check, the fresh-copy run; the owner's review and anything after it are not included
  wall_time: "1h35m37s"              # from started to finished, both read from the session clock
  spec_driven:
    framework: "GitHub Spec Kit"
    framework_version: "specify CLI 1.4.3.dev0"
    artifacts: [constitution, spec, clarify, plan, tasks, analysis, checklists]
    task_count: 49
    loops_or_phases: 6         # the six phases of specs/001-loss-budget-game/tasks.md
  model: "claude-fable-5-2"
  helper_models: []            # no sub-agent or second model was used
  harness: "Claude Code"       # run as a cloud session opened from the Claude app
  harness_version: "2.1.328"
  mcp_servers: ["Called: claude-artifacts (one private review build published for the owner), claude-code-remote (listing repositories), the harness's past-chat search and memory (read once each at the start)", "Connected but not called: Claude Docs, Claude in Chrome, Google Drive, remote-devices, visualize, widgets"]
  rag_and_sources: ["ITU-T G.9807.1 (02/2023), Annex B", "ITU-T G.652 (08/2024), Table 2 and Appendix I", "The FOA Reference Guide: loss estimates; attenuators", "TEC GR/TX/OPT-001/01/APR-12 (splitter insertion loss)", "NAF AC6 workshop repository: lab guide, StarterKit, three example games, the workshop deck", "The Arcade page at automateyournetwork.com/arcade"]
  skills_and_plugins: ["Spec Kit skills: speckit-constitution, speckit-specify, speckit-clarify, speckit-plan, speckit-tasks, speckit-analyze, speckit-implement", "frontend-design skill", "dataviz skill and its palette validator", "pptx skill (to read the workshop deck)"]
  other_tools: ["git", "Node 22.23.5 (unit tests)", "Python 3.13.18 (answer-key oracle, browser checks)", "Playwright 1.63.0 with Chrome for Testing 153.0.8010.12, headless", "Pillow 12.3.0 (card image)", "fontTools 4.67.0 (inspecting the vendored fonts)", "npm (to fetch the Fontsource packages of Barlow)"]
  human_prompts: 6             # typed messages up to 2026-11-19T15:34Z, plus one two-question dialog
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
  accessibility: "Tested by automation in headless Chrome only: a keyboard-only playthrough of all six work orders with visible focus; accessible names for every control; text contrast of at least 4.5 to 1; no animation under reduced motion; no sideways scrolling at 320 pixels. Each state has words and a shape. Not tested by a person, with a screen reader, or in Firefox or Safari."
  save_state: "none; reloading the page starts a fresh session"

verification:
  tests: "node tests/run-node.mjs && python3 tools/oracle.py && python3 tools/e2e.py"
  tests_passing: 181           # 158 unit tests (Node, and the same in the browser) + 23 browser checks (Playwright); the Python oracle's 169 comparisons with the hand-worked key are not counted here
  facts_sourced_from: ["ITU-T G.9807.1 (02/2023) Annex B, clause B.6.1, Table B.6.1 (loss classes N1 and N2)", "ITU-T G.9807.1 (02/2023) Annex B, clauses B.9.2.6.1 and B.9.2.8.1 (what the loss range includes; wavelengths)", "ITU-T G.652 (08/2024) Appendix I, Table I.1 (fiber attenuation)", "The FOA Reference Guide (connector and splice loss; attenuators)", "TEC GR/TX/OPT-001/01/APR-12 (splitter insertion loss)"]
  known_limits: ["No person has played or timed the game; every check was run by a script in headless Chrome", "One fiber value is used for both directions, and no repair or ageing margin is kept", "Splitters lose 3.5 dB for each two-way split, with no difference between ports", "Only the N1 and N2 loss classes; the limit on the difference between two paths is not graded", "Transmitter power, receiver sensitivity, reflectance and bend loss are not modeled", "Six fixed work orders", "The loss card's planning values were chosen by the build agent and wait for the owner's review"]
---

## In one paragraph

Split Decision is a puzzle about the first question of PON design: how far can this route be split? You are handed six work orders in the fictional Saguaro Valley. Each shows a small XGS-PON, a loss card and a loss window, and you choose the splitter, or the attenuator, that keeps every ONT inside the window while serving the most homes. A loss trace shows the light falling at each element of the path, and a ledger adds it up, so a wrong design teaches as much as a right one. It is for network engineers, sales engineers and students who know IP networking and have never budgeted an optical path; nothing about optics is assumed.

## How it was built

The owner chose the topic and asked the build agent to make the design calls from the workshop's defaults, record each one, and hand back a playable game to review. The agent read the workshop materials and the ITU-T and FOA sources, designed six work orders, and worked every option by hand before any code existed. That hand-worked key became the specification's test cases.

Spec Kit then ran in order: constitution, specify, clarify (five questions, answered with the recommended options and recorded for the owner), plan, tasks, analyze. Planning found that the specification let feedback name the answer for a design that works but is too small, and the specification was corrected. Analysis found 16 issues, one of them critical; all but two minor ones were fixed in the artifacts before any code.

Implementation began with the tests. The engine passed on its first run, which proves little, so bugs were planted to see the tests fail: 4 in the engine and 12 in the page, all caught. The first idea for the instrument, a marker on a scale for each ONT, was replaced by a loss trace that shows where the light is lost; the plan records the change. A keyboard-only browser check then found a real fault: a late close event could cancel a restart dialog that had just been reopened.

## What we'd tell the next builder

- Work your answers by hand before the code exists, and keep them in a file the code never writes. Ours is checked three ways: by the unit tests, by a second implementation in another language, and by a browser that reads the numbers off the page.
- When everything passes on the first run, plant a bug. A suite that has never failed has not shown that it can.
- Do not type numbers into sentences. Our briefings and explanations carry tokens that the engine fills, so changing the loss card cannot leave a stale sentence behind, and the validator names any work order whose answer moved.
