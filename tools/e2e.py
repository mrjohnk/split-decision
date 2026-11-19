#!/usr/bin/env python3
"""Browser checks for Split Decision.

Serves this repository on a free local port, under a subpath, drives the game in headless Chrome
or Chromium with Playwright, and compares what the page shows with the hand-worked answer key in
tests/fixtures/answer-key.json. It never asks the game's own code what the right answer is.

    python3 tools/e2e.py              run every check
    python3 tools/e2e.py AC2 FULL     run only the named checks
    python3 tools/e2e.py --list       list the checks
    python3 tools/e2e.py --card       also write assets/card.webp and docs/gameplay.png (needs Pillow)
    python3 tools/e2e.py --axe FILE   also run the axe-core accessibility engine in every view; FILE is
                                      axe.min.js, for example from `npm pack axe-core`. Without it the
                                      AXE check is reported as not run

Screenshots and results.json are written to docs/verification/. The exit status is 0 only when
every check that ran has passed.

Needs: Python 3.9 or later, `pip install playwright`, and a Chrome or Chromium that Playwright can
start. This is a developer tool. Nothing here is needed to play the game.
"""

import functools
import http.server
import json
import pathlib
import re
import sys
import threading
import time
import traceback

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
KEY = json.loads((ROOT / "tests" / "fixtures" / "answer-key.json").read_text(encoding="utf-8"))
OUT = ROOT / "docs" / "verification"
PREFIX = "/play/split-decision"  # the game is served from a subpath, as it would be on a project site

# The optics, from the specification (decisions D13 and D14) by way of the answer key. Not read from the game.
OPTICS = KEY["optics"]
ROUND_IDS = list(KEY["rounds"].keys())
STATE_WORDS = {"ok": "Inside the window", "dark": "Too dark", "bright": "Too bright"}
# Each state has its own shape, counted as [circles, paths, lines]: a ring, a chevron, a sunburst.
SHAPES = {"ok": [1, 0, 0], "dark": [0, 1, 0], "bright": [1, 0, 8]}
MINUS = "\u2212"

CHECKS = []


class Failure(Exception):
    pass


class NotRun(Exception):
    """A check that could not be run here. It is reported as not run, never as a pass."""


AXE_FILE = {"path": None}


def need(condition, message):
    if not condition:
        raise Failure(message)


def check(check_id, covers, title):
    def register(function):
        CHECKS.append({"id": check_id, "covers": covers, "title": title, "run": function})
        return function
    return register


# --------------------------------------------------------------------------------------------------
# Serving the repository under a subpath
# --------------------------------------------------------------------------------------------------

class SubpathHandler(http.server.SimpleHTTPRequestHandler):
    """Serve ROOT at PREFIX and nothing anywhere else."""

    def translate_path(self, path):
        clean = path.split("?", 1)[0].split("#", 1)[0]
        if not (clean == PREFIX or clean.startswith(PREFIX + "/")):
            return str(ROOT / "__not_served__")
        return super().translate_path(clean[len(PREFIX):] or "/")

    def log_message(self, *args):
        pass


def start_server():
    handler = functools.partial(SubpathHandler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, f"http://127.0.0.1:{server.server_address[1]}{PREFIX}"


# --------------------------------------------------------------------------------------------------
# Driving the game
# --------------------------------------------------------------------------------------------------

class Game:
    def __init__(self, browser, base, width=1366, height=768, reduced_motion="no-preference", mutate=None, content_status=200, scale=1):
        self.base = base
        self.context = browser.new_context(viewport={"width": width, "height": height}, reduced_motion=reduced_motion, device_scale_factor=scale)
        self.page = self.context.new_page()
        self.requests = []
        self.problems = []
        self.page.on("request", lambda request: self.requests.append(request.url))
        self.page.on("pageerror", lambda error: self.problems.append(f"page error: {error}"))
        self.page.on("console", lambda message: self.problems.append(f"console error: {message.text}") if message.type == "error" else None)
        self.mutate = mutate
        self.content_status = content_status
        if mutate is not None or content_status != 200:
            self.page.route("**/data/levels.json", self._content)

    def _content(self, route):
        if self.content_status != 200:
            route.fulfill(status=self.content_status, content_type="text/plain", body="not here")
            return
        document = json.loads((ROOT / "data" / "levels.json").read_text(encoding="utf-8"))
        if self.mutate is not None:
            self.mutate(document)
        route.fulfill(status=200, content_type="application/json", body=json.dumps(document))

    # --- reading the page
    def t(self, test_id):
        return self.page.locator(f'[data-testid="{test_id}"]')

    def view(self):
        return self.t("view").get_attribute("data-view")

    def round_id(self):
        return self.t("view").get_attribute("data-round")

    def wait_view(self, name):
        self.page.wait_for_selector(f'[data-testid="view"][data-view="{name}"]', timeout=8000)

    def tally(self):
        return self.t("tally").inner_text()

    def progress(self):
        return self.t("progress").inner_text()

    def main_html(self):
        return self.page.evaluate("document.getElementById('main').innerHTML")

    def focused(self):
        return self.page.evaluate(FOCUS_JS)

    def announced(self):
        self.page.wait_for_function("document.getElementById('announcer').textContent.length > 0", timeout=3000)
        return self.t("announcer").inner_text()

    # --- acting with the pointer
    def open(self, view="briefing"):
        self.page.goto(self.base + "/index.html")
        self.wait_view(view)
        return self

    def start(self):
        self.t("start-level").click()
        self.wait_view("round")

    def select(self, option_id):
        self.t(f"option-{option_id}").locator("input").check()

    def submit(self):
        self.t("submit").click()

    def play(self, option_id):
        self.select(option_id)
        self.submit()

    def next(self):
        self.t("next").click()

    def solve_through(self, last_round_id):
        """From a fresh briefing, solve every round up to and including last_round_id. Stops on its feedback."""
        for round_id in ROUND_IDS:
            if self.view() == "briefing":
                self.start()
            need(self.round_id() == round_id, f"expected round {round_id}, the page shows {self.round_id()}")
            self.play(KEY["rounds"][round_id]["answer"])
            if round_id == last_round_id:
                return
            self.next()

    # --- acting with the keyboard only
    def key(self, name):
        self.page.keyboard.press(name)

    def tab_to(self, test_id, back=False, limit=80):
        for _ in range(limit):
            here = self.focused()
            if here["testid"] == test_id and here["tag"] in ("BUTTON", "A", "INPUT"):
                return here
            self.key("Shift+Tab" if back else "Tab")
        raise Failure(f"the keyboard could not reach {test_id}")

    def keyboard_choose(self, option_id, back=False):
        """Move focus into the option group and choose one option with the arrow keys or Space."""
        for _ in range(80):
            here = self.focused()
            if here["tag"] == "INPUT" and here["type"] == "radio":
                break
            self.key("Shift+Tab" if back else "Tab")
        else:
            raise Failure("the keyboard could not reach the design options")
        for _ in range(12):
            here = self.focused()
            if here["value"] == option_id:
                if not here["checked"]:
                    self.key("Space")
                here = self.focused()
                need(here["checked"], f"Space did not select {option_id}")
                need(here["labelOutline"] >= 3 or here["outline"] >= 3, f"the focused option {option_id} has no visible outline")
                return
            self.key("ArrowDown")
        raise Failure(f"the arrow keys could not reach option {option_id}")

    def close(self):
        self.context.close()


FOCUS_JS = """() => {
  const e = document.activeElement;
  // Nothing in the page has focus, for example while focus is on the browser's own controls.
  if (!e || e === document.body) return { tag: 'BODY', id: null, type: null, value: null, checked: false, text: '', testid: null, outline: 0, labelOutline: 0, inDialog: false };
  const host = e.closest('[data-testid]');
  const label = e.closest('label');
  const width = (el) => { const cs = getComputedStyle(el); return cs.outlineStyle === 'none' ? 0 : parseFloat(cs.outlineWidth); };
  return {
    tag: e.tagName, id: e.id || null, type: e.type || null, value: e.value || null, checked: !!e.checked, text: (e.textContent || '').trim().slice(0, 60),
    testid: host ? host.getAttribute('data-testid') : null,
    outline: width(e), labelOutline: label ? width(label) : 0,
    inDialog: !!e.closest('dialog[open]'),
  };
}"""


def one(value):
    return f"{value:.1f}"


def sign(value):
    return MINUS if value < 0 else ("+" if value > 0 else "")


def dbm(value):
    """A receive level as the page writes it: one decimal, a true minus sign, an explicit plus."""
    return f"{sign(value)}{abs(value):.1f} dBm"


def limit(value):
    """A limit or the launch power as the page writes it: a whole number with its sign."""
    return f"{sign(value)}{abs(value):g} dBm"


LAUNCH, DARK, BRIGHT = limit(OPTICS["launch"]), limit(OPTICS["dark"]), limit(OPTICS["bright"])
WINDOW_LINE = f"Launch power: {LAUNCH} at the OLT port. Receive window: {DARK} to {BRIGHT} at each ONT, limits included."


def check_feedback(game, round_id, option_id, answer_label):
    """Compare the feedback on screen with the hand-worked key. Returns the feedback text."""
    expected_round = KEY["rounds"][round_id]
    expected = expected_round["options"][option_id]
    where = f"{round_id}/{option_id}"
    feedback = game.t("feedback")
    need(feedback.count() == 1, f"{where}: no feedback is shown")
    need(feedback.get_attribute("data-option") == option_id, f"{where}: the feedback is for another option")
    need(feedback.get_attribute("data-outcome") == expected["outcome"], f"{where}: outcome {feedback.get_attribute('data-outcome')}, the key says {expected['outcome']}")
    text = feedback.inner_text()
    need(f"Serves {expected['served']} " in text, f"{where}: the feedback does not say it serves {expected['served']}")
    for ont_id, ont in expected["onts"].items():
        meter = game.t(f"meter-{ont_id}")
        need(meter.get_attribute("data-total") == one(ont["total"]), f"{where}/{ont_id}: the meter's loss is {meter.get_attribute('data-total')}, the key says {one(ont['total'])}")
        need(meter.get_attribute("data-level") == one(ont["level"]), f"{where}/{ont_id}: the meter's level is {meter.get_attribute('data-level')}, the key says {one(ont['level'])}")
        need(abs(OPTICS["launch"] - ont["total"] - ont["level"]) < 1e-9, f"{where}/{ont_id}: the key's level is not its launch power less its loss")
        need(meter.get_attribute("data-state") == ont["state"], f"{where}/{ont_id}: the meter state is {meter.get_attribute('data-state')}, the key says {ont['state']}")
        meter_text = meter.inner_text()
        need(STATE_WORDS[ont["state"]] in meter_text and dbm(ont["level"]) in meter_text, f"{where}/{ont_id}: the meter text is '{meter_text}'")
        icon = meter.locator("svg.state-icon")
        shape = [icon.locator(tag).count() for tag in ("circle", "path", "line")] if icon.count() == 1 else None
        need(shape == SHAPES[ont["state"]], f"{where}/{ont_id}: the shape for '{ont['state']}' is drawn as {shape} (circles, paths, lines)")
        line = game.t(f"line-{ont_id}").inner_text()
        need(f"ONT {ont_id} loses {one(ont['total'])} dB and receives {dbm(ont['level'])}." in line, f"{where}/{ont_id}: the line does not name the ONT, its loss and its receive level: '{line}'")
        need(STATE_WORDS[ont["state"]] in line, f"{where}/{ont_id}: the line lacks the state words: '{line}'")
        if ont["state"] == "dark":
            need(f"{one(ont['by'])} dB below the dark limit of {DARK}" in line, f"{where}/{ont_id}: limit and difference missing: '{line}'")
        elif ont["state"] == "bright":
            need(f"{one(ont['by'])} dB above the bright limit of {BRIGHT}" in line, f"{where}/{ont_id}: limit and difference missing: '{line}'")
        else:
            to_dark, to_bright = ont["level"] - OPTICS["dark"], OPTICS["bright"] - ont["level"]
            room = f"{one(to_bright)} dB to spare before the bright limit" if to_bright < to_dark else f"{one(to_dark)} dB to spare before the dark limit"
            need(f"{DARK} to {BRIGHT}" in line and f"with {room}." in line, f"{where}/{ont_id}: window and room missing: '{line}'")
        ledger = game.t(f"ledger-text-{ont_id}").text_content()
        sum_text = f"{LAUNCH} {MINUS} {one(ont['total'])} dB = {dbm(ont['level'])}"
        need(f"= {one(ont['total'])} dB. " in ledger and ledger.strip().endswith(sum_text), f"{where}/{ont_id}: the ledger does not end with the loss and the level sum: '{ledger}'")
        need(game.t(f"level-sum-{ont_id}").inner_text().replace("\n", " ") == f"Receive level {sum_text}", f"{where}/{ont_id}: under the ledger: '{game.t(f'level-sum-{ont_id}').inner_text()}'")
    headline = game.t("feedback-headline").inner_text()
    if expected["outcome"] == "best-valid":
        need(headline.startswith("Correct."), f"{where}: the headline of the answer is '{headline}'")
        need(game.t("submit").is_disabled() and game.t("next").is_enabled(), f"{where}: after the answer, Submit should close and Next open")
        need(game.t("feedback-explain").inner_text().strip() != "", f"{where}: the answer has no explanation")
    else:
        need(not headline.startswith("Correct"), f"{where}: a wrong design is called correct")
        need(answer_label not in text, f"{where}: the feedback for a wrong design names the answer '{answer_label}'")
        need(game.t("feedback-note").inner_text().strip() != "", f"{where}: a wrong design has no note")
        need(game.t("feedback-next").inner_text().startswith("Next step:"), f"{where}: a wrong design has no next step")
        need(game.t("submit").is_enabled() and game.t("next").is_disabled(), f"{where}: after a wrong design, Submit should stay open and Next closed")
    return text


def settle(game):
    """Wait until the trace has finished drawing, and move the pointer off the drawing, before a screenshot."""
    game.page.mouse.move(2, 2)
    game.page.wait_for_function("document.getAnimations().every(a => a.playState !== 'running')", timeout=5000)


def no_problems(game, allow=()):
    left = [p for p in game.problems if not any(a in p for a in allow)]
    need(not left, f"the page reported: {left}")


# --------------------------------------------------------------------------------------------------
# User Story 1: one decision
# --------------------------------------------------------------------------------------------------

@check("AC1", "AC1, FR-001, FR-002, FR-003", "A fresh session opens on the Level 1 briefing and nothing can be answered before Start")
def ac1(new):
    g = new()
    g.open()
    need(g.t("view").locator("h1").inner_text() == "Add it up", "the first briefing is not Level 1")
    need(g.page.locator('input[name="design"]').count() == 0 and g.t("submit").count() == 0, "a challenge can be answered from the briefing")
    need(g.t("open-briefing").is_disabled(), "Review briefing should wait until a round is open")
    need("0 of 6 solved" in g.progress(), f"progress reads '{g.progress()}'")
    for part in ("Worked example", "Words used in this level", "Sources:", "A PON runs on a single fiber", f"launches it at {LAUNCH}", f"{DARK} to {BRIGHT}", "Receive level"):
        need(part in g.t("view").inner_text(), f"the briefing lacks '{part}'")
    g.start()
    need(g.round_id() == "r1-1", "Start level 1 did not open round 1-1")
    need(g.page.locator('input[name="design"]').count() == 3, "round 1-1 should offer three designs")
    need("Attempts: 0." in g.tally(), "a new round should have no attempts")
    # What a round must show (FR-003).
    need(g.page.locator(".workorder .plant-svg").count() == 1 and "16.0 km of fiber" in g.t("plant-text").text_content(), "the plant drawing or its text is missing")
    need(g.page.locator(".workorder .plant-svg .launch-note").text_content() == LAUNCH, "the plant drawing does not print the launch power at the OLT")
    need(g.t("paths").locator("tbody tr").all_inner_texts() == ["ONT A, farthest home\t18.0 km\t7\t7\tyour choice"], f"the path table reads {g.t('paths').locator('tbody tr').all_inner_texts()}")
    card = g.t("losscard").locator("div").all_inner_texts()
    need(len(card) == 9 and "1:32 splitter" in card[7] and "17.5 dB" in card[7], f"the loss card reads {card}")
    need(" ".join(g.t("window").inner_text().split()) == WINDOW_LINE, f"the launch power and receive window read '{g.t('window').inner_text()}'")
    need(g.t("meter-launch").inner_text().split("\n") == ["Launch power", LAUNCH], f"the launch row reads {g.t('meter-launch').inner_text()!r}")
    need(g.page.locator("#goal").inner_text().startswith("Choose the largest splitter"), "the goal is missing")
    need(g.t("option-o64").inner_text().split("\n") == ["1:64 splitter", "Serves 64 homes"], f"an option reads {g.t('option-o64').inner_text()!r}")
    no_problems(g)
    return "Level 1 briefing first; after Start the round shows the plant, the path table, the loss card, the launch power, the receive window, the goal and three options with the homes they serve"


@check("AC2", "AC2, FR-006, FR-009, FR-029", "Round 1-1 with a 1:32 splitter: solved, 30.7 dB of loss, −25.7 dBm, ledger 9.0 + 3.5 + 0.7 + 17.5")
def ac2(new):
    g = new()
    g.open()
    g.start()
    label = g.t("option-o32").locator(".option-label").inner_text()
    g.play("o32")
    check_feedback(g, "r1-1", "o32", label)
    ledger = g.t("ledger-text-A").text_content()
    for part in ("fiber 9.0", "connectors 3.5", "splices 0.7", "splitter 17.5", "= 30.7 dB", f"+5 dBm {MINUS} 30.7 dB = {MINUS}25.7 dBm"):
        need(part.lower() in ledger.lower(), f"the ledger lacks '{part}': {ledger}")
    need("1 of 6 solved" in g.progress(), f"progress reads '{g.progress()}'")
    settle(g)
    g.page.screenshot(path=str(OUT / "03-round-1-1-correct.png"))
    no_problems(g)
    return ledger.strip()


@check("AC3a", "AC3a, FR-010, SC-002", "Round 1-1 with a 1:64 splitter: too dark, −29.2 dBm, 1.2 dB below the dark limit, round stays open")
def ac3a(new):
    g = new()
    g.open()
    g.start()
    label = g.t("option-o32").locator(".option-label").inner_text()
    g.play("o64")
    check_feedback(g, "r1-1", "o64", label)
    need(g.t("feedback-headline").inner_text() == "Too dark at ONT A.", "the headline should say where it is too dark")
    need("Attempts: 1." in g.tally() and "0 of 6 solved" in g.progress(), "one attempt, nothing solved")
    settle(g)
    g.page.screenshot(path=str(OUT / "02-round-1-1-too-dark.png"))
    line = g.t("line-A").inner_text()
    g.play("o32")
    need("Attempts: 2." in g.tally() and "1 of 6 solved" in g.progress(), "the retry should solve the round on attempt 2")
    no_problems(g)
    return line + " The retry solved the round on attempt 2."


@check("AC3b", "AC3b, FR-011", "Round 1-1 with a 1:16 splitter: works at −22.2 dBm, a larger one also fits, the answer is not named")
def ac3b(new):
    g = new()
    g.open()
    g.start()
    label = g.t("option-o32").locator(".option-label").inner_text()
    g.play("o16")
    text = check_feedback(g, "r1-1", "o16", label)
    need("larger" in text and "Serves 16 homes" in text, "the feedback should say a larger option also fits")
    need("1:32" not in text and "32 homes" not in text, "the feedback gives the answer away")
    no_problems(g)
    return g.t("feedback-headline").inner_text()


@check("AC4", "AC4, FR-005, FR-012", "Submitting with nothing selected gives guidance and counts nothing")
def ac4(new):
    g = new()
    g.open()
    g.start()
    need(g.t("guidance").is_hidden(), "guidance should be hidden before anything happens")
    g.submit()
    need(g.t("guidance").is_visible() and "Choose a design first" in g.t("guidance").inner_text(), "no guidance after an empty submission")
    need("Nothing was counted" in g.announced(), "the guidance was not announced")
    need("Attempts: 0." in g.tally() and g.t("feedback").count() == 0 and g.t("next").is_disabled(), "an empty submission changed the round")
    need(g.t("meter-A").get_attribute("data-state") == "none", "the meter should not be lit")
    said = g.announced()
    g.select("o16")
    need(g.t("guidance").is_hidden(), "guidance should clear when a design is chosen")
    g.select("o32")
    need("Attempts: 0." in g.tally() and g.t("feedback").count() == 0 and "0 of 6 solved" in g.progress(), "selecting a design graded it")
    need(g.page.locator('input[name="design"]:checked').count() == 1, "exactly one design should be selected")
    no_problems(g)
    return said + " Selecting a design grades nothing."


# --------------------------------------------------------------------------------------------------
# User Story 2: help, progress, summaries, restart
# --------------------------------------------------------------------------------------------------

@check("AC5", "AC5, FR-014", "Hint 1, hint 2 and the worked solution appear in order, count as help and do not complete the round")
def ac5(new):
    g = new()
    g.open()
    g.start()
    need(g.t("solution").is_disabled(), "the worked solution should wait for both hints")
    need(g.t("hint").inner_text() == "Show hint 1", "the first help button should be hint 1")
    g.t("hint").click()
    need(g.t("hint-1").is_visible() and g.t("hint-2").count() == 0, "hint 1 should show alone")
    need("Hint 1: the method" in g.t("hint-1").inner_text(), "hint 1 is not labeled as the method")
    need(g.t("hint").inner_text() == "Show hint 2" and g.t("solution").is_disabled(), "after hint 1 the button should offer hint 2")
    g.t("hint").click()
    need("Hint 2: a worked step" in g.t("hint-2").inner_text() and g.t("hint-1").is_visible(), "hint 2 should join hint 1")
    need(g.t("hint").is_disabled() and g.t("solution").is_enabled(), "after hint 2 only the worked solution is left")
    g.t("solution").click()
    solution = g.t("solution-text").inner_text()
    answer_label = g.t("option-o32").locator(".option-label").inner_text()
    need(answer_label in solution and "30.7 dB" in solution and "17.5" in solution and f"{MINUS}25.7 dBm" in solution, f"the worked solution lacks the answer's ledger and level: {solution}")
    need("Hints used: 2. Worked solution: viewed." in g.tally() and "Attempts: 0." in g.tally(), f"the tally reads '{g.tally()}'")
    need(g.t("next").is_disabled() and "0 of 6 solved" in g.progress(), "help must not complete the round")
    g.play("o32")
    need(g.t("hint").is_disabled() and g.t("solution").is_disabled(), "help should close once the round is solved")
    g.next()
    g.play(KEY["rounds"]["r1-2"]["answer"])
    g.next()
    g.wait_view("briefing")
    need(g.t("level-hints").inner_text() == "2" and g.t("level-solutions").inner_text() == "1", "the level summary should count two hints and one worked solution")
    no_problems(g)
    return g.t("level-summary").inner_text().replace("\n", " ")


@check("AC6", "AC6, FR-013", "Each real submission is one attempt; the answer completes the round once; a repeat changes nothing")
def ac6(new):
    g = new()
    g.open()
    g.start()
    g.submit()
    g.play("o64")
    g.play("o16")
    need("Attempts: 2." in g.tally(), f"two submissions and an empty one should be two attempts: '{g.tally()}'")
    g.play("o32")
    need("Attempts: 3." in g.tally() and "1 of 6 solved" in g.progress(), f"the answer should be attempt 3: '{g.tally()}'")
    before = g.main_html()
    g.page.evaluate("document.querySelector('[data-testid=\"design-form\"]').requestSubmit()")
    g.page.evaluate("document.querySelector('[data-testid=\"design-form\"]').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))")
    need(g.main_html() == before, "a submission after success changed the page")
    need(all(g.page.locator('input[name="design"]').nth(i).is_disabled() for i in range(3)), "the options should close after success")
    no_problems(g)
    return g.tally()


@check("AC7", "AC7, FR-015, FR-016", "Next opens the following round, then the next briefing with the level summary, then the session summary")
def ac7(new):
    g = new()
    g.open()
    names = []
    for round_id in ROUND_IDS:
        if g.view() == "briefing":
            g.start()
        need(g.round_id() == round_id, f"expected {round_id}, got {g.round_id()}")
        need(g.t("feedback").count() == 0 and "Attempts: 0." in g.tally(), f"{round_id} did not open clean")
        g.play(KEY["rounds"][round_id]["answer"])
        names.append(g.t("next").inner_text())
        g.next()
        if round_id in ("r1-2", "r2-2"):
            g.wait_view("briefing")
            need(g.t("level-solved").inner_text() == "2 of 2" and g.t("level-attempts").inner_text() == "2", "the level summary is wrong")
            need(g.focused()["id"] == "view-title", "focus should move to the briefing's heading")
    need(names == ["Next work order", "Next level", "Next work order", "Next level", "Next work order", "See summary"], f"Next was named {names}")
    g.wait_view("summary")
    need(g.t("total-solved").inner_text() == "6 of 6" and g.t("total-attempts").inner_text() == "6", "the session totals are wrong")
    need(g.t("no-help").inner_text() == "6 of 6" and g.t("without-solution").inner_text() == "6 of 6", "the help totals are wrong")
    text = g.t("view").inner_text()
    need(not re.search(r"\b(score|grade|mastery|rank|stars?)\b", text, re.I), "the summary should not grade the player")
    g.page.screenshot(path=str(OUT / "06-summary.png"))
    no_problems(g)
    return " > ".join(names)


@check("AC8", "AC8, FR-017", "Restart asks first; Keep playing changes nothing; Restart the game clears the session")
def ac8(new):
    g = new()
    g.open()
    g.solve_through("r1-1")
    g.next()
    wrong = next(option_id for option_id in KEY["rounds"]["r1-2"]["options"] if option_id != KEY["rounds"]["r1-2"]["answer"])
    g.play(wrong)
    g.t("hint").click()
    before = g.main_html()
    progress = g.progress()
    g.t("restart").click()
    dialog = g.t("restart-dialog")
    need(dialog.is_visible() and "Restart the game?" in dialog.inner_text(), "Restart did not ask")
    need(g.focused()["testid"] == "cancel-restart", "the safe choice should have focus when the dialog opens")
    g.t("cancel-restart").click()
    need(dialog.is_hidden() and g.main_html() == before and g.progress() == progress, "Keep playing changed the session")
    g.t("restart").click()
    g.key("Escape")
    need(dialog.is_hidden() and g.main_html() == before, "Escape should cancel the restart")
    g.t("restart").click()
    g.t("confirm-restart").click()
    g.wait_view("briefing")
    need(g.t("view").locator("h1").inner_text() == "Add it up" and "0 of 6 solved" in g.progress(), "the game did not go back to a fresh start")
    need(g.t("level-summary").count() == 0, "a fresh start should carry no level summary")
    g.start()
    need(g.round_id() == "r1-1" and "Attempts: 0." in g.tally() and g.t("feedback").count() == 0, "round 1-1 kept something from before")
    no_problems(g)
    return "cancel and Escape keep the session; confirm clears it"


@check("FULL", "SC-001, SC-002, FR-006 to FR-011, FR-016, FR-026", "All 20 options of the six rounds, submitted in the page, match the hand-worked key")
def full(new):
    g = new()
    g.open()
    submitted = 0
    for round_id in ROUND_IDS:
        if g.view() == "briefing":
            g.start()
        need(g.round_id() == round_id, f"expected {round_id}, got {g.round_id()}")
        expected_round = KEY["rounds"][round_id]
        need(" ".join(g.t("window").inner_text().split()) == WINDOW_LINE, f"{round_id}: the launch power and window on screen are '{g.t('window').inner_text()}'")
        need(g.page.locator('input[name="design"]').count() == len(expected_round["options"]), f"{round_id}: the number of options differs from the key")
        answer = expected_round["answer"]
        answer_label = g.t(f"option-{answer}").locator(".option-label").inner_text()
        order = [o for o in expected_round["options"] if o != answer] + [answer]
        for number, option_id in enumerate(order, 1):
            g.play(option_id)
            check_feedback(g, round_id, option_id, answer_label)
            need(f"Attempts: {number}." in g.tally(), f"{round_id}/{option_id}: the tally reads '{g.tally()}'")
            submitted += 1
            if round_id == "r2-1" and option_id == "o64":
                settle(g)
                g.page.screenshot(path=str(OUT / "04-round-2-1-three-onts.png"))
            if round_id == "r3-2" and option_id == "ontB10":
                settle(g)
                g.page.screenshot(path=str(OUT / "05-round-3-2-bright-and-dark.png"))
        g.next()
    g.wait_view("summary")
    for round_id in ROUND_IDS:
        cells = g.t(f"summary-{round_id}").locator("td").all_inner_texts()
        need(cells == [str(len(KEY["rounds"][round_id]["options"])), "0", "Not viewed", "Yes"], f"{round_id}: the summary row reads {cells}")
    need(g.t("total-attempts").inner_text() == str(submitted) == "20", f"{submitted} submissions, the summary says {g.t('total-attempts').inner_text()}")
    no_problems(g)
    return f"{submitted} submissions compared with the key: totals, states, outcomes, limits and differences"


@check("RELOAD", "FR-018", "Reloading the page in mid-game returns to the first briefing with no progress")
def reload(new):
    g = new()
    g.open()
    g.solve_through("r1-2")
    need("2 of 6 solved" in g.progress(), "setup: two rounds should be solved")
    g.page.reload()
    g.wait_view("briefing")
    need(g.t("view").locator("h1").inner_text() == "Add it up" and "0 of 6 solved" in g.progress(), "progress survived a reload")
    stored = g.page.evaluate("[window.localStorage.length, window.sessionStorage.length, document.cookie]")
    need(stored == [0, 0, ""], f"the game stored something in the browser: {stored}")
    no_problems(g)
    return "fresh start after reload; nothing in localStorage, sessionStorage or cookies"


# --------------------------------------------------------------------------------------------------
# User Story 3: keyboard, names, announcements, motion, contrast, narrow window
# --------------------------------------------------------------------------------------------------

@check("KEYBOARD", "AC9, SC-003, FR-023", "The whole game is played from the first briefing to the summary with the keyboard only, at 1366 x 768")
def keyboard(new):
    g = new()
    g.open()
    presses = {"count": 0}
    original = g.key

    def counted(name):
        presses["count"] += 1
        original(name)
    g.key = counted

    def press_button(test_id, back=False):
        here = g.tab_to(test_id, back=back)
        need(here["outline"] >= 3, f"{test_id} has no visible focus outline ({here['outline']}px)")
        g.key("Enter")

    def at_heading(what):
        here = g.focused()
        need(here["id"] == "view-title", f"after {what}, focus should be on the view's heading, it is on {here}")

    press_button("start-level")
    g.wait_view("round")
    at_heading("Start")

    # Round 1-1: a wrong design first, then the answer by pressing Enter inside the option group.
    g.keyboard_choose("o64")
    press_button("submit")
    need(g.t("feedback").get_attribute("data-outcome") == "too-dark", "the wrong design was not graded")
    need(g.focused()["testid"] == "submit", "after a wrong design focus should stay on Submit")
    g.keyboard_choose("o32", back=True)
    g.key("Enter")
    need(g.t("feedback").get_attribute("data-outcome") == "best-valid", "Enter in the option group should submit")
    here = g.focused()
    need(here["testid"] == "next" and here["outline"] >= 3, f"after the answer focus should be on Next, visibly: {here}")
    g.key("Enter")
    need(g.round_id() == "r1-2", "Next did not open round 1-2")
    at_heading("Next")

    # Round 1-2: both hints and the worked solution from the keyboard.
    press_button("hint")
    need(g.focused()["testid"] == "hint" and g.t("hint-1").is_visible(), "after hint 1 focus should stay on the hint button")
    g.key("Enter")
    need(g.focused()["testid"] == "solution" and g.t("hint-2").is_visible(), "after hint 2 focus should move to the worked solution button")
    g.key("Enter")
    need(g.focused()["testid"] == "submit" and g.t("solution-text").is_visible(), "after the worked solution focus should move to Submit")
    g.keyboard_choose(KEY["rounds"]["r1-2"]["answer"], back=True)
    press_button("submit")
    need(g.focused()["testid"] == "next", "after the answer focus should be on Next")
    g.key("Space")
    g.wait_view("briefing")
    at_heading("Next level")

    for round_id in ROUND_IDS[2:]:
        if g.view() == "briefing":
            press_button("start-level")
            g.wait_view("round")
        need(g.round_id() == round_id, f"expected {round_id}, got {g.round_id()}")
        g.keyboard_choose(KEY["rounds"][round_id]["answer"])
        press_button("submit")
        need(g.t("feedback").get_attribute("data-outcome") == "best-valid", f"{round_id}: the answer was not accepted")
        need(g.focused()["testid"] == "next", f"{round_id}: focus should be on Next")
        g.key("Enter")
    g.wait_view("summary")
    at_heading("See summary")
    need(g.t("total-solved").inner_text() == "6 of 6", "the keyboard run did not solve six rounds")

    # The header tools and both dialogs.
    press_button("open-model")
    need(g.t("model-dialog").is_visible() and g.focused()["inDialog"], "Model and sources did not open with focus inside")
    for _ in range(12):
        g.key("Tab")
        here = g.focused()
        need(here["tag"] == "BODY" or here["inDialog"], f"Tab reached the page behind the open dialog: {here}")
    g.key("Escape")
    need(g.t("model-dialog").is_hidden() and g.focused()["testid"] == "open-model", "Escape should close the dialog and return focus to its button")
    press_button("restart", back=True)
    need(g.t("restart-dialog").is_visible() and g.focused()["testid"] == "cancel-restart", "Restart should open its dialog on Keep playing")
    g.key("Enter")
    need(g.t("restart-dialog").is_hidden() and g.view() == "summary" and g.focused()["testid"] == "restart", "Keep playing should close the dialog and return focus")
    g.key("Enter")
    press_button("confirm-restart", back=True)
    g.wait_view("briefing")
    at_heading("Restart the game")
    need("0 of 6 solved" in g.progress(), "the keyboard restart did not clear the session")
    press_button("start-level")
    press_button("open-briefing", back=True)
    need(g.t("briefing-dialog").is_visible() and "Add it up" in g.t("briefing-dialog").inner_text(), "Review briefing did not open the level's briefing")
    press_button("close-briefing")
    need(g.t("briefing-dialog").is_hidden() and g.focused()["testid"] == "open-briefing", "closing the briefing should return focus to its button")
    no_problems(g)
    return f"start, select, submit, hint, solution, next, restart, confirm and cancel, all by keyboard ({presses['count']} key presses, no pointer)"


@check("NAMES", "AC9, FR-023", "Every control has the accessible name the contract gives it")
def names(new):
    g = new()
    g.open()
    page = g.page

    def named(role, name, test_id):
        found = page.get_by_role(role, name=name, exact=True)
        need(found.count() == 1, f"no single {role} is named '{name}'")
        need(found.get_attribute("data-testid") == test_id, f"the {role} named '{name}' is not {test_id}")

    named("button", "Start level 1", "start-level")
    named("button", "Review briefing", "open-briefing")
    named("button", "Model and sources", "open-model")
    named("button", "Restart", "restart")
    g.start()
    for test_id, name in (("submit", "Submit design"), ("hint", "Show hint 1"), ("solution", "Show worked solution"), ("next", "Next work order")):
        named("button", name, test_id)
    need(page.get_by_role("group", name="Design options", exact=True).count() == 1, "the options are not a group named Design options")
    for option_id, name, serves in (("o16", "1:16 splitter", "Serves 16 homes"), ("o32", "1:32 splitter", "Serves 32 homes"), ("o64", "1:64 splitter", "Serves 64 homes")):
        radio = page.get_by_role("radio", name=name, exact=True)
        need(radio.count() == 1, f"no radio is named '{name}'")
        need(radio.get_attribute("value") == option_id, f"the radio named '{name}' is not {option_id}")
        described = page.locator(f"#{radio.get_attribute('aria-describedby')}").inner_text()
        need(described == serves, f"the radio '{name}' is described as '{described}'")
    g.t("hint").click()
    named("button", "Show hint 2", "hint")
    need(page.get_by_role("status").count() == 1 and g.t("announcer").get_attribute("aria-live") == "polite", "there should be one polite status region")
    need(page.get_by_role("main").count() == 1 and page.get_by_role("banner").count() == 1, "the page needs one main and one banner landmark")
    need(page.get_by_role("navigation", name="Game controls").count() == 1, "the header tools are not a named navigation landmark")
    for label in ("Each ONT's path from the OLT port", ):
        need(page.get_by_role("region", name=label, exact=True).count() == 1, f"no scroll region is named '{label}'")
    need(page.get_by_role("heading", level=1).count() == 1, "a view should have exactly one level-1 heading")
    g.t("restart").click()
    named("button", "Restart the game", "confirm-restart")
    named("button", "Keep playing", "cancel-restart")
    need(page.get_by_role("dialog", name="Restart the game?").count() == 1, "the restart dialog has no name")
    g.t("confirm-restart").click()
    g.solve_through("r3-2")
    named("button", "See summary", "next")
    g.next()
    named("button", "Play again", "play-again")
    levels = page.evaluate("[...document.querySelectorAll('main h1, main h2, main h3, main h4')].map(h => Number(h.tagName[1]))")
    need(all(b - a <= 1 for a, b in zip(levels, levels[1:])), f"heading levels skip: {levels}")
    no_problems(g)
    return "buttons, radios, group, dialog, landmarks and scroll regions are named"


@check("AC10", "AC10, FR-024", "Feedback is text, stays until the next submission or view, names its design and is announced")
def ac10(new):
    g = new()
    g.open()
    g.start()
    label = g.t("option-o64").locator(".option-label").inner_text()
    g.play("o64")
    feedback = g.t("feedback").inner_text()
    need(f"Your design: {label}." in feedback, "the feedback does not name the design it describes")
    announced = g.announced()
    need(label in announced and "Too dark at ONT A." in announced and f"receives {MINUS}29.2 dBm" in announced and "Next step:" in announced, f"the announcement is incomplete: {announced}")
    g.select("o16")
    g.t("hint").click()
    need(g.t("feedback").inner_text() == feedback, "the feedback should stay until the next submission")
    need(g.t("feedback").get_attribute("data-option") == "o64", "the feedback should still belong to the design that was submitted")
    g.play("o32")
    need("Correct." in g.announced() and f"receives {MINUS}25.7 dBm" in g.announced(), "the correct result was not announced")
    g.next()
    need(g.t("feedback").count() == 0, "feedback from the last round is still shown")
    need(g.t("meter-A").get_attribute("data-state") == "none", "the meter of a new round should not be lit")
    no_problems(g)
    return announced


@check("MOTION", "AC10, FR-025, SC-006", "The result is readable at once; the trace draws itself only when motion is allowed, and then stops")
def motion(new):
    still = new(reduced_motion="reduce")
    still.open()
    still.start()
    still.play("o64")
    now = still.page.evaluate("""() => ({
      text: document.querySelector('[data-testid="feedback-headline"]').textContent,
      drawing: document.querySelectorAll('.is-drawing, .is-waiting').length,
      animations: document.getAnimations().length,
      lines: document.querySelectorAll('.decide .trace-line').length,
      ends: getComputedStyle(document.querySelector('.decide .trace-ends')).opacity,
    })""")
    need(now["text"] == "Too dark at ONT A." and now["lines"] >= 1 and now["ends"] == "1", f"with reduced motion the result is not there at once: {now}")
    need(now["drawing"] == 0 and now["animations"] == 0, f"with reduced motion something still moves: {now}")
    no_problems(still)

    moving = new()
    moving.open()
    moving.start()
    moving.play("o64")
    now = moving.page.evaluate("""() => ({
      text: document.querySelector('[data-testid="feedback-headline"]').textContent,
      level: document.querySelector('[data-testid="meter-A"]').getAttribute('data-level'),
      names: [...new Set(document.getAnimations().map(a => a.animationName))].sort(),
    })""")
    need(now["text"] == "Too dark at ONT A." and now["level"] == "-29.2", f"the result should be in the page before the trace finishes: {now}")
    need(now["names"] == ["draw-trace", "show-ends"], f"the only motion should be the trace drawing and its ends appearing: {now['names']}")
    moving.page.wait_for_timeout(1500)
    later = moving.page.evaluate("""() => ({
      running: document.getAnimations().filter(a => a.playState === 'running').length,
      ends: getComputedStyle(document.querySelector('.decide .trace-ends')).opacity,
      offsets: [...document.querySelectorAll('.decide .trace-line')].map(p => getComputedStyle(p).strokeDashoffset),
    })""")
    need(later["running"] == 0 and later["ends"] == "1" and all(o in ("0px", "0") for o in later["offsets"]), f"the trace did not finish drawing: {later}")
    moving.t("hint").click()
    need(moving.page.evaluate("document.getAnimations().length") == 0, "showing a hint replayed the animation")
    moving.submit()
    moving.page.wait_for_timeout(100)
    no_problems(moving)
    return "reduced motion: 0 animations, result present at once; otherwise the trace draws once in under 1.5 s"


CONTRAST_JS = """() => {
  const parse = (value) => {
    const m = /rgba?\\(([^)]+)\\)/.exec(value || '');
    if (!m) return null;
    const p = m[1].split(/[\\s,\\/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const over = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const backgroundOf = (el) => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a === 1) break; }
    }
    let color = { r: 255, g: 255, b: 255, a: 1 };
    for (const layer of layers.reverse()) color = over(layer, color);
    return color;
  };
  const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const rows = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = node.textContent.trim();
    const el = node.parentElement;
    if (!text || !el || el.closest('.visually-hidden, script, style, noscript, title')) continue;
    if (el.closest('dialog:not([open])') || el.getClientRects().length === 0) continue;
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden') continue;
    const svg = el.closest('svg');
    const ink = parse(svg ? style.fill : style.color);
    if (!ink) continue;
    const grounds = [];
    if (svg) {
      let ground = backgroundOf(svg.parentElement);
      // Text drawn on a filled shape of the drawing stands on that shape.
      if (el.classList.contains('olt-text')) ground = parse(getComputedStyle(svg.querySelector('.olt-box')).fill);
      grounds.push(ground);
      // Any label of the trace may stand on the window band.
      const band = svg.querySelector('.window-band');
      if (band) grounds.push(over(parse(getComputedStyle(band).fill), ground));
    } else {
      grounds.push(backgroundOf(el));
    }
    const worst = Math.min(...grounds.map((ground) => ratio(ink, ground)));
    rows.push({ text: text.slice(0, 40), size: parseFloat(style.fontSize), svg: !!svg, ratio: Math.round(worst * 100) / 100, ink: hex(ink), ground: hex(grounds[0]), cls: (el.getAttribute('class') || el.tagName).slice(0, 40) });
  }
  return rows;
}"""


def text_rows(game):
    return game.page.evaluate(CONTRAST_JS)


def views_for_reading(new, width=1366, height=768):
    """Yield (name, game) for each view with as much on screen as the game can show."""
    g = new(width=width, height=height, reduced_motion="reduce")
    g.open()
    yield "level 1 briefing", g
    g.start()
    g.submit()
    yield "round 1-1 with guidance", g
    g.play("o64")
    g.t("hint").click()
    g.t("hint").click()
    g.t("solution").click()
    yield "round 1-1 after a wrong design, with all help", g
    g.play("o32")
    yield "round 1-1 solved", g
    g.next()
    g.play(KEY["rounds"]["r1-2"]["answer"])
    g.next()
    yield "level 2 briefing with level summary", g
    g.start()
    g.play("o64")
    yield "round 2-1 with three ONTs", g
    g.t("open-briefing").click()
    yield "review briefing dialog", g
    g.t("close-briefing").click()
    g.t("open-model").click()
    yield "model and sources dialog", g
    g.t("close-model").click()
    g.t("restart").click()
    yield "restart dialog", g
    g.t("cancel-restart").click()
    g.play("o32")
    g.next()
    g.play(KEY["rounds"]["r2-2"]["answer"])
    g.next()
    g.start()
    g.play("none")
    yield "round 3-1 too bright", g
    g.play(KEY["rounds"]["r3-1"]["answer"])
    g.next()
    g.play("ontB10")
    yield "round 3-2 too bright and too dark", g
    g.play(KEY["rounds"]["r3-2"]["answer"])
    g.next()
    yield "session summary", g
    no_problems(g)


@check("CONTRAST", "principle IV, contracts/ui.md", "Every piece of text has a contrast of at least 4.5 to 1 with what is behind it")
def contrast(new):
    worst = 99.0
    seen = 0
    pairs = set()
    for name, g in views_for_reading(new):
        rows = text_rows(g)
        seen += len(rows)
        for row in rows:
            pairs.add((row["ink"], row["ground"]))
            worst = min(worst, row["ratio"])
            need(row["ratio"] >= 4.5, f"{name}: '{row['text']}' ({row['cls']}) is {row['ink']} on {row['ground']}, {row['ratio']} to 1")
    return f"{seen} pieces of text in 12 views, {len(pairs)} color pairs; the lowest contrast is {worst} to 1"


@check("TEXTSIZE", "contracts/ui.md", "Running text is at least 16 CSS pixels; labels inside the drawings are at least 12")
def text_size(new):
    smallest_text = 99.0
    smallest_label = 99.0
    for name, g in views_for_reading(new):
        for row in text_rows(g):
            if row["svg"]:
                smallest_label = min(smallest_label, row["size"])
                need(row["size"] >= 12, f"{name}: the drawing label '{row['text']}' is {row['size']}px")
            else:
                smallest_text = min(smallest_text, row["size"])
                need(row["size"] >= 16, f"{name}: '{row['text']}' ({row['cls']}) is {row['size']}px")
    return f"smallest running text {smallest_text}px; smallest drawing label {smallest_label}px"


@check("NARROW", "SC-007, FR-027", "At 320 CSS pixels wide the page never scrolls sideways and Submit, Hint and Next can be reached")
def narrow(new):
    checked = []
    for width in (320, 390, 768):
        for name, g in views_for_reading(new, width=width, height=640):
            page = g.page
            sizes = page.evaluate("[document.documentElement.scrollWidth, document.documentElement.clientWidth, document.body.scrollWidth, window.scrollX]")
            need(sizes[0] <= sizes[1] and sizes[2] <= sizes[1] and sizes[3] == 0, f"{width}px, {name}: the page is {sizes[0]} wide in a window of {sizes[1]}")
            dialog = page.locator("dialog[open]")
            if dialog.count():
                box = dialog.bounding_box()
                need(box["x"] >= 0 and box["x"] + box["width"] <= width + 0.5, f"{width}px, {name}: the dialog is wider than the window")
                inner = dialog.evaluate("d => [d.scrollWidth, d.clientWidth]")
                need(inner[0] <= inner[1], f"{width}px, {name}: the dialog scrolls sideways")
            elif g.view() == "round":
                for test_id in ("submit", "hint", "solution", "next"):
                    control = g.t(test_id)
                    control.scroll_into_view_if_needed()
                    box = control.bounding_box()
                    need(box["x"] >= 0 and box["x"] + box["width"] <= width + 0.5, f"{width}px, {name}: {test_id} is outside the window")
                    need(box["height"] >= 40, f"{width}px, {name}: {test_id} is only {box['height']}px high")
                need(page.evaluate("window.scrollX") == 0, f"{width}px, {name}: reaching a control scrolled the page sideways")
            if width == 320 and name == "round 2-1 with three ONTs":
                page.evaluate("window.scrollTo(0, 0)")
                page.screenshot(path=str(OUT / "07-narrow-320.png"), full_page=True)
            checked.append((width, name))
    return f"{len(checked)} view and width combinations at 320, 390 and 768 pixels"


@check("ORIGIN", "SC-009, FR-028", "A full playthrough makes no request outside the game's own origin, and the fonts come from the game")
def origin(new):
    g = new()
    g.open()
    g.t("open-model").click()
    g.t("close-model").click()
    g.solve_through("r3-2")
    g.next()
    g.wait_view("summary")
    g.page.wait_for_timeout(300)
    origin_prefix = g.base.split(PREFIX)[0] + PREFIX + "/"
    outside = sorted({url for url in g.requests if not url.startswith(origin_prefix) and not url.startswith("data:")})
    need(not outside, f"requests left the game: {outside}")
    fonts = sorted({url.rsplit("/", 1)[1] for url in g.requests if url.endswith(".woff2")})
    need(fonts, "no font was loaded from the game's own folder")
    kinds = sorted({url.rsplit(".", 1)[-1] for url in g.requests})
    no_problems(g)
    return f"{len(g.requests)} requests, all under {PREFIX}/ ({', '.join(kinds)}); fonts: {', '.join(fonts)}"


def set_no_valid(document):
    document["levels"][0]["rounds"][0]["plant"]["trunk"]["fiberKm"] = 43.0


def set_tie(document):
    document["levels"][0]["rounds"][0]["options"][0]["served"] = 32


def set_unknown_ratio(document):
    document["levels"][0]["rounds"][0]["options"][2]["splitters"]["s1"] = 128


def set_inexact(document):
    document["levels"][0]["rounds"][0]["plant"]["trunk"]["fiberKm"] = 13.03


def set_note_mismatch(document):
    document["levels"][0]["rounds"][0]["options"][2]["expect"] = "too-bright"


def set_broken_source(document):
    document["levels"][0]["briefing"]["sourceIds"].append("R99")


@check("CONTENT", "SC-005, FR-019, FR-020", "Content that cannot be graded (U1 to U6), or cannot be read, shows a content error and no challenge")
def content(new):
    cases = (
        ("U1", set_no_valid, "no-valid-option"),
        ("U2", set_tie, "tie-for-best"),
        ("U3", set_unknown_ratio, "unknown-ratio"),
        ("U4", set_inexact, "inexact-total"),
        ("U5", set_note_mismatch, "note-mismatch"),
        ("U6", set_broken_source, "unknown-source"),
    )
    shown = []
    for case_id, mutate, code in cases:
        g = new(mutate=mutate)
        g.open(view="content-error")
        error = g.t("content-error")
        text = error.inner_text()
        need(code in [c.strip() for c in error.locator("code").all_inner_texts()], f"{case_id}: expected the error {code}, the page shows: {text}")
        need("level-1" in text, f"{case_id}: the error does not say where the problem is: {text}")
        need(g.page.locator('input[name="design"]').count() == 0 and g.t("submit").count() == 0 and g.t("start-level").count() == 0, f"{case_id}: a challenge can still be opened")
        need(g.t("restart").is_disabled() and g.t("open-model").is_disabled(), f"{case_id}: the header tools should be off")
        need("not in anything you did" in text, f"{case_id}: the error should say it is not the player's fault")
        shown.append(f"{case_id} {code}")
        if case_id == "U1":
            g.page.screenshot(path=str(OUT / "09-content-error.png"))
        no_problems(g)
        g.close()
    broken = new(content_status=404)
    broken.open(view="content-error")
    need("load-failed" in broken.t("content-error").inner_text(), "a missing content file should be reported")
    broken.content_status = 200
    broken.t("retry-load").click()
    broken.wait_view("briefing")
    need(broken.t("restart").is_enabled(), "after a good reload the header tools should work")
    no_problems(broken, allow=("404", "Failed to load resource"))
    return "; ".join(shown) + "; a missing file reports load-failed and Try loading again recovers"


@check("DIALOGS", "FR-004, FR-021, FR-022", "The briefing can be reviewed during a round; the model panel lists the rule, the limits of the model and every source")
def dialogs(new):
    g = new()
    g.open()
    g.solve_through("r1-2")
    g.next()
    title = g.t("view").locator("h1").inner_text()
    g.start()
    g.select("o16")
    before = g.main_html()
    g.t("open-briefing").click()
    dialog = g.t("briefing-dialog")
    text = dialog.inner_text()
    need(title in text and "Worked example" in text and "Words used in this level" in text and "Sources:" in text, "the review dialog is not the current level's briefing")
    need(dialog.locator(".trace-svg").count() == 1 and dialog.locator(".plant-svg").count() == 1, "the worked example in the dialog has no drawings")
    g.t("close-briefing").click()
    need(dialog.is_hidden() and g.main_html() == before, "reviewing the briefing changed the round")
    g.t("open-model").click()
    model = g.t("model-dialog")
    text = model.inner_text()
    for part in ("The rule", "Launch power and receive window", f"Launch power at the OLT port\t{LAUNCH}", f"Receive window at each ONT\t{DARK} to {BRIGHT}", "Loss card", "What the game assumes", "What the game leaves out", "Sources", "single fiber", "0.5 dB", "not quoted from the standard", "upstream wavelength", "Table B.9.3"):
        need(part in text, f"the model panel lacks '{part}'")
    need(model.locator(".source-list li").count() == 8, f"the model panel lists {model.locator('.source-list li').count()} sources, the specification has 8")
    need("The project owner's field practice" in model.locator(".source-list li").nth(6).inner_text(), "the owner's decisions on the window and the launch power are not listed as their source")
    links = model.locator(".source-list a")
    need(links.count() == 7, f"{links.count()} sources have a link; the seven published ones should")
    for index in range(links.count()):
        link = links.nth(index)
        need(link.get_attribute("href").startswith("https://") and link.get_attribute("target") == "_blank" and "noopener" in link.get_attribute("rel"), "a source link is not a safe outside link")
    g.page.screenshot(path=str(OUT / "08-model-and-sources.png"))
    g.key("Escape")
    need(model.is_hidden(), "Escape should close the model panel")
    no_problems(g)
    return "8 sources: 7 published ones with an https link, and the owner's decisions on the receive window and the launch power"


@check("AXE", "principle IV", "The axe-core accessibility engine reports no violation in any view")
def axe(new):
    if AXE_FILE["path"] is None:
        raise NotRun("needs --axe path/to/axe.min.js (for example from `npm pack axe-core`)")
    source = pathlib.Path(AXE_FILE["path"]).read_text(encoding="utf-8")
    seen = []
    version = None
    for name, g in views_for_reading(new):
        g.page.evaluate(source)
        result = g.page.evaluate("axe.run(document, { resultTypes: ['violations'] }).then(r => ({ version: r.testEngine.version, passes: r.passes.length, violations: r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map(n => n.target.join(' ')).slice(0, 4) })) }))")
        version = result["version"]
        need(not result["violations"], f"{name}: " + "; ".join(f"{v['id']} ({v['impact']}): {v['help']} at {v['nodes']}" for v in result["violations"]))
        seen.append(name)
    return f"axe-core {version}: 0 violations in {len(seen)} views"


@check("FOLDER", "README, Play locally", "Opened straight from a folder, the page says how to serve it instead of waiting forever")
def folder(new):
    g = new()
    g.page.goto((ROOT / "index.html").as_uri())
    g.page.wait_for_timeout(600)
    view = g.view()
    text = g.t("view").inner_text()
    if view == "needs-server":
        need("python3 -m http.server 8000" in text and "README" in text, f"the message does not say how to serve the folder: {text}")
    else:
        # A browser that does load modules from a folder still cannot fetch the content file.
        need(view == "content-error" and "serve the folder" in text, f"opened from a folder the page shows the view '{view}': {text[:120]}")
    need(g.page.locator('input[name="design"]').count() == 0, "a challenge was shown from a folder")
    return f"view '{view}': {text[:110]}…"


@check("UNIT", "SC-001", "The unit tests pass in the browser, on the same modules the game runs")
def unit(new):
    g = new()
    g.page.goto(g.base + "/tests/index.html")
    g.page.wait_for_selector('[data-testid="test-summary"]:not([data-status="running"])', timeout=30000)
    summary = g.t("test-summary")
    need(summary.get_attribute("data-status") == "pass", f"the browser test page reports: {summary.inner_text()}")
    no_problems(g)
    return summary.inner_text().strip()


@check("SHOTS", "FR-002", "Screenshots of the briefing and of level 3 for the record")
def shots(new):
    g = new(reduced_motion="reduce")
    g.open()
    g.page.screenshot(path=str(OUT / "01-briefing-level-1.png"))
    g.solve_through("r2-2")
    g.next()
    g.wait_view("briefing")
    g.page.screenshot(path=str(OUT / "10-briefing-level-3.png"), full_page=True)
    no_problems(g)
    return "written to docs/verification/"


# --------------------------------------------------------------------------------------------------
# The card image and the README screenshot (not a check)
# --------------------------------------------------------------------------------------------------

def write_card(browser, base):
    from PIL import Image  # imported here so the checks run without Pillow

    # 1440 x 810 CSS pixels drawn at 1600 x 900: the page fills the frame down to the foot of the trace.
    g = Game(browser, base, width=1440, height=810, reduced_motion="reduce", scale=1600 / 1440)
    g.open()
    g.solve_through("r1-2")
    g.next()
    g.start()
    g.play("o64")
    g.page.evaluate("window.scrollTo(0, 0)")
    g.page.mouse.move(5, 5)
    raw = OUT / "_card.png"
    g.page.screenshot(path=str(raw))
    image = Image.open(raw).convert("RGB")
    card = ROOT / "assets" / "card.webp"
    image.save(card, "WEBP", quality=88, method=6)
    shot = ROOT / "docs" / "gameplay.png"
    image.resize((1280, 720), Image.LANCZOS).save(shot, "PNG", optimize=True)
    raw.unlink()
    g.close()
    return f"{card.relative_to(ROOT)} {image.size[0]}x{image.size[1]}, {card.stat().st_size // 1024} KB; {shot.relative_to(ROOT)} 1280x720, {shot.stat().st_size // 1024} KB"


# --------------------------------------------------------------------------------------------------
# Running
# --------------------------------------------------------------------------------------------------

def launch(playwright):
    last = None
    for options in ({"channel": "chrome"}, {}):
        try:
            return playwright.chromium.launch(headless=True, args=["--no-sandbox"], **options)
        except Exception as error:  # try the next browser
            last = error
    raise SystemExit(f"No Chrome or Chromium could be started: {last}")


def main(argv):
    argv = list(argv)
    if "--axe" in argv:
        at = argv.index("--axe")
        if at + 1 >= len(argv):
            print("--axe needs the path of axe.min.js")
            return 2
        AXE_FILE["path"] = argv[at + 1]
        del argv[at:at + 2]
    arguments = [a for a in argv if not a.startswith("--")]
    if "--list" in argv:
        for item in CHECKS:
            print(f"{item['id']:9} {item['title']}  [{item['covers']}]")
        return 0
    wanted = [c for c in CHECKS if not arguments or c["id"] in arguments]
    unknown = [a for a in arguments if a not in {c["id"] for c in CHECKS}]
    if unknown:
        print(f"Unknown check: {', '.join(unknown)}. Use --list.")
        return 2
    OUT.mkdir(parents=True, exist_ok=True)
    server, base = start_server()
    results = []
    started = time.time()
    with sync_playwright() as playwright:
        browser = launch(playwright)
        version = f"{browser.browser_type.name} {browser.version}"
        for item in wanted:
            games = []

            def new(**options):
                game = Game(browser, base, **options)
                games.append(game)
                return game

            began = time.time()
            try:
                detail = item["run"](new)
                status = "pass"
            except NotRun as reason:
                status, detail = "not run", str(reason)
            except Failure as failure:
                status, detail = "fail", str(failure)
            except Exception as error:  # a crash in a check is a failed check, with its place
                status, detail = "fail", f"{type(error).__name__}: {error} | {traceback.format_exc().strip().splitlines()[-3].strip()}"
            finally:
                for game in games:
                    try:
                        game.close()
                    except Exception:
                        pass
            results.append({"id": item["id"], "covers": item["covers"], "title": item["title"], "status": status, "detail": detail, "seconds": round(time.time() - began, 1)})
            print(f"{status.upper():7}  {item['id']:9} {item['title']}\n         {detail}")
        card = None
        if "--card" in argv:
            card = write_card(browser, base)
            print(f"CARD  {card}")
        browser.close()
    server.shutdown()
    passed = sum(1 for r in results if r["status"] == "pass")
    failed = sum(1 for r in results if r["status"] == "fail")
    not_run = len(results) - passed - failed
    summary = {
        "ran": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "browser": version,
        "served_from": PREFIX + "/",
        "passed": passed,
        "failed": failed,
        "not_run": not_run,
        "seconds": round(time.time() - started, 1),
        "checks": results,
    }
    if not arguments:
        (OUT / "results.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(f"\n{passed} passed, {failed} failed, {not_run} not run, {len(results)} checks, {summary['seconds']} s, {version}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
