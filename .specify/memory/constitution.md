# Split Decision Constitution

## Core Principles

### I. Technical truth is a release requirement

The game MUST NOT reward a technically incorrect answer. Grading MUST be reproducible from a
documented rule and the challenge inputs. Unsupported or ambiguous content is an authoring error:
the game MUST show that the challenge is unavailable and MUST NOT grade it.

The rule taught is the optical path loss window of a PON. An ONT's optical path loss is the sum, in
dB, of every element between the OLT port and that ONT: fiber, connectors, fusion splices,
splitters and fixed attenuators. A design is valid when every ONT's loss is inside the game's loss
window, limits included. Among the valid designs offered in a round, the one that serves the most
homes is the answer.

Simplifications MUST appear in the briefing and in the README wherever they affect what the player
can conclude. Fictional places and animations MAY illustrate a rule; they MUST NOT change it.

Numbers MUST stay exact: every loss shown is exact to one decimal place, rounding MUST NOT decide
an answer, and a path exactly at a window limit is inside the window.

**Evidence:** hand-checked correct, incorrect and boundary cases; a source link and section for
each networking rule; a review of every shipped briefing and explanation. Expected results MUST be
recorded independently of the implementation under test.

### II. Every round teaches through a decision

The player's main action MUST exercise the target skill. A concept MUST be introduced before it is
tested, and every value needed to reason about the answer MUST be shown. A wrong answer MUST
explain the specific mistake and give a useful next step. A correct answer MUST explain why it
works.

The learning sequence is: add up one path → apply the window to every ONT and to competing
designs → the minimum-loss limit and where attenuation belongs. Hints MUST reveal a method first,
then a worked step. A worked solution MUST be available to a stuck learner; viewing one is recorded
as assistance, never as independent mastery.

**Evidence:** a teammate can connect each player action to a learning outcome and describe what
they learned from a deliberately wrong choice.

### III. Progress is honest and retry is safe

A round MUST complete only on a valid, correct submission. Incorrect answers MUST keep the
challenge available. An empty or malformed submission MUST give input guidance without counting as
a wrong attempt. Repeated Submit actions MUST NOT award progress twice.

This version has no lives, countdown or speed bonus. Hints and retries carry no penalty. Completed
rounds, attempts and assistance MUST be shown separately; completion is not proof of independent
mastery. The specification MUST say exactly what advances a round, finishes a level and resets a
session.

**Evidence:** wrong-answer, repeated-submit, hint, completion and reset checks match the
specification.

### IV. Access is part of the core game

All core actions MUST be usable by keyboard with visible focus, readable labels and an
understandable order. Success and failure MUST be explained with text as well as color. Essential
diagrams MUST have a text equivalent. Reduced-motion preferences MUST be respected; animation MUST
NOT delay the availability of feedback or controls.

The challenge MUST stay usable on a typical laptop and in a narrow browser window. Dense technical
data MAY scroll within its own labeled container, without hiding the action buttons.

**Evidence:** a keyboard-only playthrough, a narrow-window check and a reduced-motion check. What
was actually checked MUST be recorded; full accessibility certification MUST NOT be claimed.

### V. The first version is deterministic and self-contained

The game MUST ship authored content and deterministic domain logic. It MUST NOT require an
account, backend, live device connection, model or API key. AI MAY help write code and assets
during development; its output receives the same review as any other contribution.

Runtime AI tutoring, generated questions and free-text AI grading are stretch work. Adding them
requires an explicit change to this constitution, the specification and the verification approach
before implementation.

**Evidence:** a clean browser session can play using only the project's static files; no external
content service decides an answer.

### VI. Content and logic can be reviewed separately

Level content, hints, sources and difficulty MUST live in editable data. Domain rules MUST be
separate from rendering and progress tracking. Data MUST be validated before a challenge is
presented. Feedback MUST agree with the evaluator's reasoning; a hand-authored answer key MUST NOT
silently override the rule engine.

Adding another challenge that uses the existing mechanic MUST require only a data change and its
checks, not a new scoring path or a new screen implementation.

**Evidence:** inspect one level's data, trace one answer through the evaluator, and add a trial
challenge without modifying the rule engine.

### VII. Done is demonstrated

Only the agreed scope ships. Requirements, plan, tasks and README MUST describe the same game. A
feature is complete when its acceptance criteria pass and its actual status is recorded. A
screenshot, a checked task box or the agent saying "done" is insufficient by itself.

When time is short, scope MUST be reduced explicitly. Incorrect teaching and broken core
interactions MUST be fixed before visual effects are added. Failed and untested checks MUST stay
visible.

**Evidence:** reproducible run and test commands, recorded verification results, a fresh-start
playthrough, and a README another attendee can follow.

## Scope and Model Boundaries

**Purpose:** help network engineers, sales engineers and students who are new to PON practice
optical loss budgeting by choosing the splitter or attenuator design for a passive optical network.

**First release:** one core mechanic, three short levels, a browser. The scope is the workshop's
60-minute build scope; the build itself ran after the workshop, outside the room.

**Model:** one loss window, 8 to 28 dB, for every work order. It is the designer's planning window,
set by the owner on 2026-11-19 from his field experience (specification, decision D11). It is not
a class of ITU-T G.9807.1 (02/2023): the standard's N1 (14 to 29 dB) and N2 (16 to 31 dB) classes
are cited beside it so that the difference is in the open. A PON is a single fiber, and every
element is counted once on it.

**Assumptions:** component losses are the planning values printed on the game's loss card: fiber
0.5 dB per km, connector 0.5 dB (one mated connection), fusion splice 0.1 dB, splitter 3.5 dB per two-way split,
attenuators at face value. They are stated inputs for each work order, not measurements.

**Exclusions:** one fiber planning value is used for both directions, although a real design
checks the upstream and downstream wavelengths separately. No repair or ageing margin is reserved.
Transmitter power, receiver sensitivity, reflectance, dispersion, bend loss, the standard's loss
classes, its limit on the difference between two paths, and the maximum fiber distance are not
modeled.

## Evidence and Workflow

The project follows the workshop's seven Spec Kit steps in order: constitution, specify, clarify,
plan, tasks, analyze, implement. Each step's output is read before the next step runs.

- The specification MUST contain hand-worked expected results for every option of every shipped
  round before any code is written.
- Analysis findings that touch accuracy, scope or this constitution MUST be resolved in the source
  artifact (specification, plan or tasks), then analysis is run again.
- Every required acceptance criterion MUST have a recorded result of pass, fail or not run, with
  the date, the environment and the evidence.
- Evidence that needs a person (a teammate's observation, a person's keyboard-only playthrough) is
  the owner's to supply. Automated checks MAY supplement it and MUST be reported as automation.
- The build agent MUST write "unknown" for any build fact it did not record.

## Governance

This constitution supersedes other project guidance where they conflict. For any material change,
record the reason, update the affected specification and plan, and run analysis again. A conflict
with this constitution is resolved openly; the build agent MUST NOT weaken a principle merely to
make its implementation pass.

Versioning follows semantic versioning: MAJOR for removing or redefining a principle, MINOR for a
new principle or materially expanded guidance, PATCH for clarifications. Compliance is reviewed at
the plan's Constitution Check, at analysis, and before the README's verification table is filled.

**Version**: 1.1.0 | **Ratified**: 2026-11-19 | **Last Amended**: 2026-11-19
