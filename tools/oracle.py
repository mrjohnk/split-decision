#!/usr/bin/env python3
"""Independent check of the answer key.

Recomputes every hand-worked case of tests/fixtures/answer-key.json from data/levels.json with
Python's decimal module. It shares no code with engine/: a second implementation, in another
language, of the rule written in the specification. If this script, the JavaScript evaluator and
the hand-worked key all agree, a mistake would have to be made three times the same way.

Run from anywhere:  python3 tools/oracle.py
Exit status 0 when every case agrees, 1 otherwise.
"""

import json
import pathlib
import sys
from decimal import Decimal

ROOT = pathlib.Path(__file__).resolve().parent.parent


def load(relative):
    text = (ROOT / relative).read_text(encoding="utf-8")
    return json.loads(text, parse_float=Decimal, parse_int=Decimal)


def paths(plant):
    """One record for each ONT: fiber km, connector pairs, splices and the splitters crossed."""
    found = []
    stack = [(plant["trunk"], Decimal(0), Decimal(0), Decimal(0), ())]
    while stack:
        segment, km, pairs, splices, splitters = stack.pop()
        km += segment["fiberKm"]
        pairs += segment["connectorPairs"]
        splices += segment["splices"]
        node = segment["to"]
        if node["type"] == "ont":
            found.append({"id": node["id"], "km": km, "pairs": pairs, "splices": splices, "splitters": splitters})
        else:
            for leg in node["legs"]:
                stack.append((leg, km, pairs, splices, splitters + ((node["id"], node["ratio"]),)))
    return {record["id"]: record for record in found}


def fixed_loss(card, record):
    """Loss of fixed elements only: open splitters and attenuators are left out."""
    loss = record["km"] * card["fiberDbPerKm"] + record["pairs"] * card["connectorPairDb"] + record["splices"] * card["spliceDb"]
    for _, ratio in record["splitters"]:
        if ratio is not None:
            loss += card["splitterDb"][str(ratio)]
    return loss


def total_loss(card, record, option):
    loss = fixed_loss(card, record)
    for splitter_id, ratio in record["splitters"]:
        if ratio is None:
            loss += card["splitterDb"][str(option["splitters"][splitter_id])]
    for attenuator in option.get("attenuators", []):
        if attenuator["at"] in ("olt", record["id"]):
            loss += attenuator["db"]
    return loss


def judge(total, window):
    if total > window["maxDb"]:
        return "over", total - window["maxDb"]
    if total < window["minDb"]:
        return "under", window["minDb"] - total
    return "ok", None


def outcomes(card, window, plant, options):
    """Each option's totals and states, and the outcome of each against the answer."""
    records = paths(plant)
    table = {}
    for option in options:
        onts = {}
        for ont_id, record in records.items():
            total = total_loss(card, record, option)
            state, by = judge(total, window)
            onts[ont_id] = {"total": total, "state": state, "by": by}
        table[option["id"]] = {"served": option["served"], "onts": onts, "valid": all(o["state"] == "ok" for o in onts.values())}

    valid = sorted((entry["served"], option_id) for option_id, entry in table.items() if entry["valid"])
    if not valid:
        raise SystemExit("A round has no valid option.")
    if len(valid) > 1 and valid[-1][0] == valid[-2][0]:
        raise SystemExit("A round has a tie for the most homes.")
    answer = valid[-1][1]

    for option_id, entry in table.items():
        states = {o["state"] for o in entry["onts"].values()}
        if entry["valid"]:
            entry["outcome"] = "best-valid" if option_id == answer else "valid-not-best"
        elif {"over", "under"} <= states:
            entry["outcome"] = "over-and-under"
        else:
            entry["outcome"] = "over-max" if "over" in states else "under-min"
    return answer, table


def main():
    content = load("data/levels.json")
    key = load("tests/fixtures/answer-key.json")
    card = content["lossCard"]
    rounds = {r["id"]: r for level in content["levels"] for r in level["rounds"]}
    problems = []
    checked = 0

    def expect(what, got, want):
        nonlocal checked
        checked += 1
        if got != want:
            problems.append(f"{what}: computed {got}, the key says {want}")

    if set(rounds) != set(key["rounds"]):
        problems.append(f"rounds differ: content has {sorted(rounds)}, the key has {sorted(key['rounds'])}")

    for round_id, wanted in sorted(key["rounds"].items()):
        game_round = rounds.get(round_id)
        if game_round is None:
            continue
        window = content["classes"][game_round["class"]]
        expect(f"{round_id} class", game_round["class"], wanted["class"])
        answer, table = outcomes(card, window, game_round["plant"], game_round["options"])
        expect(f"{round_id} answer", answer, wanted["answer"])
        expect(f"{round_id} options", sorted(table), sorted(wanted["options"]))

        records = paths(game_round["plant"])
        for ont_id, want_fixed in key["fixedBeforeChoice"][round_id].items():
            expect(f"{round_id} {ont_id} before the choice", fixed_loss(card, records[ont_id]), want_fixed)

        for option_id, want_option in sorted(wanted["options"].items()):
            got_option = table.get(option_id)
            if got_option is None:
                continue
            expect(f"{round_id}/{option_id} served", got_option["served"], want_option["served"])
            expect(f"{round_id}/{option_id} outcome", got_option["outcome"], want_option["outcome"])
            for ont_id, want_ont in sorted(want_option["onts"].items()):
                got_ont = got_option["onts"][ont_id]
                expect(f"{round_id}/{option_id} {ont_id} total", got_ont["total"], want_ont["total"])
                expect(f"{round_id}/{option_id} {ont_id} state", got_ont["state"], want_ont["state"])
                if want_ont["state"] != "ok":
                    expect(f"{round_id}/{option_id} {ont_id} distance to the limit", got_ont["by"], want_ont["by"])
            row = "  ".join(f"{ont_id} {got_option['onts'][ont_id]['total']:>5} {got_option['onts'][ont_id]['state']:<5}" for ont_id in sorted(got_option["onts"]))
            print(f"{round_id}/{option_id:<7} {got_option['served']:>4} homes  {row}  {got_option['outcome']}")

    for entry in key["boundary"]:
        window = content["classes"][entry["class"]]
        path = entry["path"]
        total = (path["fiberKm"] * card["fiberDbPerKm"] + path["connectorPairs"] * card["connectorPairDb"]
                 + path["splices"] * card["spliceDb"] + card["splitterDb"][str(entry["splitterRatio"])])
        state, by = judge(total, window)
        expect(f"{entry['id']} total", total, entry["total"])
        expect(f"{entry['id']} state", state, entry["state"])
        if entry["state"] != "ok":
            expect(f"{entry['id']} distance to the limit", by, entry["by"])
        print(f"{entry['id']:<15} {total:>5} {state}")

    print()
    if problems:
        for problem in problems:
            print("DIFFERENT  " + problem)
        print(f"\n{len(problems)} of {checked} checks differ from the hand-worked key.")
        return 1
    print(f"All {checked} checks agree with the hand-worked key.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
