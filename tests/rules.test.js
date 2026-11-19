// Tests for engine/rules.js, written from contracts/rules.md before the evaluator existed.
// Expected values come from tests/fixtures/answer-key.json, which transcribes the hand-worked
// cases of the specification. They are never computed by the code under test.

import {
  toMilli, pathsOf, fixedLosses, evaluateOption, evaluateRound, outcomeOf, evaluate, tracesOf, windowOf, OUTCOMES,
} from '../engine/rules.js';
import { exampleAsRound } from '../engine/feedback.js';
import { clone, deepFreeze } from './harness.js';

const milli = (decibels) => Math.round(decibels * 1000);

function findRound(content, roundId) {
  for (const level of content.levels) {
    for (const round of level.rounds) if (round.id === roundId) return round;
  }
  return null;
}

// A one-ONT round built from a boundary case of the answer key.
function boundaryRound(entry) {
  return {
    id: entry.id,
    class: entry.class,
    plant: {
      oltLabel: 'OLT port',
      trunk: {
        fiberKm: entry.path.fiberKm,
        connectors: entry.path.connectors,
        splices: entry.path.splices,
        to: {
          type: 'splitter', id: 's1', label: 'Splitter', ratio: entry.splitterRatio,
          legs: [{ fiberKm: 0, connectors: 0, splices: 0, to: { type: 'ont', id: 'A', label: 'ONT A' } }],
        },
      },
    },
    options: [{ id: 'asdrawn', label: 'Build it as drawn', served: 1, splitters: {}, attenuators: [] }],
  };
}

export default async function define({ test, assertEqual, assertTrue, assertDeepEqual, loadJson }) {
  const content = await loadJson('data/levels.json');
  const key = await loadJson('tests/fixtures/answer-key.json');

  test('rules/toMilli converts exact decimals and rejects inexact ones', () => {
    assertEqual(toMilli(0.1), 100);
    assertEqual(toMilli(17.5), 17500);
    assertEqual(toMilli(29), 29000);
    assertEqual(toMilli(-28), -28000, 'a level may be negative');
    assertEqual(toMilli(-8.5), -8500);
    assertEqual(toMilli(0.0005), null, 'half a thousandth is not exact');
    assertEqual(toMilli(Number.NaN), null);
    assertEqual(toMilli('3.5'), null, 'a string is not a number');
  });

  test('rules/the game has one set of optics, the specification\'s: +5 dBm, and -28 to -8 dBm (decisions D13 and D14)', () => {
    assertDeepEqual(Object.keys(content.classes), [key.optics.class]);
    const cls = content.classes[key.optics.class];
    assertEqual(cls.launchDbm, 5);
    assertEqual(cls.darkDbm, -28);
    assertEqual(cls.brightDbm, -8);
    assertEqual(key.optics.launch, 5);
    assertEqual(key.optics.dark, -28);
    assertEqual(key.optics.bright, -8);
    assertDeepEqual(windowOf(content, key.optics.class), { className: 'design', named: false, launchMilli: 5000, darkMilli: -28000, brightMilli: -8000 });
    for (const level of content.levels) {
      for (const round of level.rounds) assertEqual(round.class, key.optics.class, `${round.id} uses the one set`);
    }
  });

  test('rules/the outcomes are named for what the player sees (decision D15)', () => {
    assertDeepEqual(OUTCOMES, ['best-valid', 'valid-not-best', 'too-dark', 'too-bright', 'dark-and-bright']);
  });

  test('rules/the answer key covers 20 option cases and 4 boundary cases', () => {
    let options = 0;
    for (const roundId of Object.keys(key.rounds)) options += Object.keys(key.rounds[roundId].options).length;
    assertEqual(options, 20, 'option cases');
    assertEqual(key.boundary.length, 4, 'boundary cases');
    assertEqual(Object.keys(key.rounds).length, 6, 'rounds');
  });

  test('rules/every shipped round is in the answer key and the other way round', () => {
    const shipped = content.levels.flatMap((level) => level.rounds.map((round) => round.id)).sort();
    assertDeepEqual(shipped, Object.keys(key.rounds).sort());
    for (const roundId of shipped) {
      const round = findRound(content, roundId);
      assertDeepEqual(round.options.map((o) => o.id).sort(), Object.keys(key.rounds[roundId].options).sort(), roundId);
      assertEqual(round.class, key.rounds[roundId].class, `${roundId} class`);
    }
  });

  for (const roundId of Object.keys(key.rounds)) {
    const expectedRound = key.rounds[roundId];

    test(`rules/${roundId}/paths list the ONTs of the plant`, () => {
      const round = findRound(content, roundId);
      const ids = pathsOf(round.plant).map((p) => p.ontId).sort();
      const expected = Object.keys(Object.values(expectedRound.options)[0].onts).sort();
      assertDeepEqual(ids, expected);
    });

    test(`rules/${roundId}/loss before the choice matches the specification`, () => {
      const round = findRound(content, roundId);
      const fixed = fixedLosses(content, round);
      for (const [ontId, decibels] of Object.entries(key.fixedBeforeChoice[roundId])) {
        assertEqual(fixed[ontId].fixedMilli, milli(decibels), `${roundId} ${ontId}`);
      }
    });

    test(`rules/${roundId}/the answer is ${expectedRound.answer}`, () => {
      const round = findRound(content, roundId);
      const evaluation = evaluateRound(content, round);
      assertEqual(evaluation.problem, null);
      assertEqual(evaluation.best.optionId, expectedRound.answer);
    });

    for (const [optionId, expected] of Object.entries(expectedRound.options)) {
      test(`rules/${roundId}/${optionId} gives the hand-worked totals, states and outcome`, () => {
        const round = findRound(content, roundId);
        const option = round.options.find((o) => o.id === optionId);
        const result = evaluateOption(content, round, option);
        assertEqual(result.served, expected.served, 'homes served');
        assertEqual(result.onts.length, Object.keys(expected.onts).length, 'number of ONTs');
        for (const ont of result.onts) {
          const want = expected.onts[ont.id];
          assertTrue(want, `unexpected ONT ${ont.id}`);
          assertEqual(ont.totalMilli, milli(want.total), `${ont.id} total`);
          assertEqual(ont.levelMilli, milli(want.level), `${ont.id} receive level`);
          assertEqual(ont.levelMilli, milli(key.optics.launch) - ont.totalMilli, `${ont.id} level is launch power less loss (FR-029)`);
          assertEqual(ont.state, want.state, `${ont.id} state`);
          if (want.state !== 'ok') assertEqual(ont.marginMilli, milli(want.by), `${ont.id} distance to the limit`);
          else assertEqual(ont.marginMilli, ont.levelMilli - milli(key.optics.dark), `${ont.id} room above the dark limit`);
          const sum = ont.ledger.reduce((total, line) => total + line.lossMilli, 0);
          assertEqual(sum, ont.totalMilli, `${ont.id} ledger adds up to the total`);
        }
        const wantValid = Object.values(expected.onts).every((o) => o.state === 'ok');
        assertEqual(result.valid, wantValid, 'valid');
        assertEqual(outcomeOf(evaluateRound(content, round), optionId), expected.outcome, 'outcome');

        const verdict = evaluate(content, round, optionId);
        assertEqual(verdict.status, expected.outcome === 'best-valid' ? 'correct' : 'incorrect', 'status');
        assertEqual(verdict.reasonCode, expected.outcome, 'reason code');
        assertEqual(verdict.expected.optionId, expectedRound.answer, 'expected answer');
        assertEqual(verdict.evidence.largerValidExists, expected.outcome === 'valid-not-best', 'largerValidExists');
      });
    }
  }

  for (const entry of key.boundary) {
    test(`rules/boundary/${entry.id} ${entry.about}`, () => {
      const round = boundaryRound(entry);
      const result = evaluateOption(content, round, round.options[0]);
      const ont = result.onts[0];
      assertEqual(ont.totalMilli, milli(entry.total), 'total');
      assertEqual(ont.levelMilli, milli(entry.level), 'receive level');
      assertEqual(ont.state, entry.state, 'state');
      if (entry.state !== 'ok') assertEqual(ont.marginMilli, milli(entry.by), 'distance to the limit');
      assertEqual(result.valid, entry.state === 'ok', 'valid');
    });
  }

  test('rules/the boundary cases sit exactly on the two limits and 0.1 dB outside them', () => {
    const levels = Object.fromEntries(key.boundary.map((entry) => [entry.id, entry.level]));
    assertDeepEqual(levels, { B1: key.optics.dark, B2: key.optics.dark - 0.1, B3: key.optics.bright, B4: key.optics.bright + 0.1 });
  });

  for (const levelId of ['level-1', 'level-2', 'level-3']) {
    test(`rules/${levelId}/the worked example gives the hand-worked totals and receive levels`, () => {
      const level = content.levels.find((l) => l.id === levelId);
      const round = exampleAsRound(level);
      const result = evaluateOption(content, round, round.options[0]);
      const expected = key.examples[levelId];
      assertDeepEqual(result.onts.map((o) => o.id).sort(), Object.keys(expected).sort());
      for (const ont of result.onts) {
        assertEqual(ont.totalMilli, milli(expected[ont.id].total), `${ont.id} total`);
        assertEqual(ont.levelMilli, milli(expected[ont.id].level), `${ont.id} receive level`);
        assertEqual(ont.state, expected[ont.id].state, `${ont.id} state`);
      }
    });
  }

  test('rules/nothing selected is invalid input, not a wrong answer', () => {
    const round = findRound(content, 'r1-1');
    for (const answer of [null, undefined, '']) {
      const verdict = evaluate(content, round, answer);
      assertEqual(verdict.status, 'invalid-input');
      assertEqual(verdict.reasonCode, 'no-selection');
      assertEqual(verdict.expected, null);
    }
  });

  test('rules/an option the round does not have is invalid input', () => {
    const verdict = evaluate(content, findRound(content, 'r1-1'), 'o128');
    assertEqual(verdict.status, 'invalid-input');
    assertEqual(verdict.reasonCode, 'unknown-option');
  });

  test('rules/a round with no valid option is a content error', () => {
    const round = clone(findRound(content, 'r1-1'));
    round.plant.trunk.fiberKm = 60;
    assertEqual(evaluateRound(content, round).problem, 'no-valid-option');
    const verdict = evaluate(content, round, 'o16');
    assertEqual(verdict.status, 'content-error');
    assertEqual(verdict.reasonCode, 'no-valid-option');
  });

  test('rules/a tie for the most homes is a content error', () => {
    const round = clone(findRound(content, 'r1-1'));
    round.options.find((o) => o.id === 'o16').served = 32;
    assertEqual(evaluateRound(content, round).problem, 'tie-for-best');
    assertEqual(evaluate(content, round, 'o32').status, 'content-error');
  });

  test('rules/the upstream fiber value changes no "inside" and no "too bright" verdict', () => {
    // research.md R-02: the light an ONT receives is downstream light, and downstream fiber loses
    // 0.35 dB/km (ITU-T G.652, Table I.1), less than the loss card's upstream value. Recompute
    // everything with 0.35. An ONT the game calls inside or too bright must stay so. An ONT the
    // game calls too dark may be light enough at the downstream value: the game says so.
    const downstream = clone(content);
    downstream.lossCard.fiberDbPerKm = 0.35;
    let compared = 0;
    const lighter = [];
    for (const level of content.levels) {
      for (const round of level.rounds) {
        const other = findRound(downstream, round.id);
        for (const option of round.options) {
          const a = evaluateOption(content, round, option);
          const b = evaluateOption(downstream, other, other.options.find((o) => o.id === option.id));
          for (let i = 0; i < a.onts.length; i += 1) {
            assertEqual(b.onts[i].state === 'bright', a.onts[i].state === 'bright', `${round.id}/${option.id}/${a.onts[i].id} bright limit`);
            if (a.onts[i].state === 'ok') assertTrue(b.onts[i].state === 'ok', `${round.id}/${option.id}/${a.onts[i].id} stays inside`);
            if (a.onts[i].state === 'dark' && b.onts[i].state !== 'dark') lighter.push(`${round.id}/${option.id}/${a.onts[i].id}`);
            compared += 1;
          }
        }
      }
    }
    assertEqual(compared, 37, 'ONT results compared');
    // Hand-checked: two cases, both 18.0 km behind a 1:64 splitter. At 0.35 dB/km the fiber loses
    // 6.3 dB, not 9.0. Round 1-1: 31.5 dB, -26.5 dBm. Round 2-1, ONT C: 30.9 dB, -25.9 dBm. Both
    // would be inside the window. The 1:8 cascade of round 2-2 and every overshoot stay too dark.
    assertDeepEqual(lighter, ['r1-1/o64/A', 'r2-1/o64/C'], 'the ONTs that are too dark only because of the upstream fiber value');
  });

  test('rules/the loss trace of every option adds up to the ledger total, step by step', () => {
    let traces = 0;
    for (const level of content.levels) {
      for (const round of level.rounds) {
        for (const option of round.options) {
          const result = evaluateOption(content, round, option);
          const drawn = tracesOf(content, round, option);
          assertEqual(drawn.length, result.onts.length, `${round.id}/${option.id}`);
          for (const trace of drawn) {
            const ont = result.onts.find((o) => o.id === trace.ontId);
            assertEqual(trace.totalMilli, ont.totalMilli, `${round.id}/${option.id}/${trace.ontId} total`);
            const byKind = (lines, kind) => lines.filter((l) => l.kind === kind).reduce((sum, l) => sum + l.lossMilli, 0);
            for (const kind of ['fiber', 'connectors', 'splices', 'splitter', 'attenuator']) {
              assertEqual(byKind(trace.steps, kind), byKind(ont.ledger, kind), `${round.id}/${option.id}/${trace.ontId} ${kind}`);
            }
            assertTrue(trace.steps.every((step) => step.lossMilli > 0), 'every step loses something');
            traces += 1;
          }
        }
      }
    }
    assertEqual(traces, 37);
  });

  test('rules/ONTs that share a feeder share the first steps of their traces', () => {
    const round = findRound(content, 'r2-1');
    const [a, b, c] = tracesOf(content, round, round.options[1]);
    const shared = (x, y) => { let n = 0; while (n < x.steps.length && n < y.steps.length && x.steps[n].key === y.steps[n].key) n += 1; return n; };
    assertEqual(shared(a, b), 4, 'feeder fiber, connectors, splices and the splitter');
    assertEqual(shared(b, c), 4);
    assertTrue(a.steps[4].key !== b.steps[4].key, 'the drops differ');
  });

  // ITU-T G.9807.1 (02/2023) Annex B limits the difference between two paths on one PON to 15 dB
  // (reference R2). The game does not grade that limit, and says so in Model and sources, where it
  // also says that every answer is within it. This test is what makes that sentence true.
  test('rules/every answer keeps the paths of its PON within 15 dB of each other', () => {
    for (const level of content.levels) {
      for (const round of level.rounds) {
        const answer = round.options.find((option) => option.id === key.rounds[round.id].answer);
        const totals = evaluateOption(content, round, answer).onts.map((ont) => ont.totalMilli);
        const spread = Math.max(...totals) - Math.min(...totals);
        assertTrue(spread <= milli(15), `${round.id}: the answer's paths differ by ${spread / 1000} dB`);
      }
    }
  });

  test('rules/the evaluator is pure: equal results, inputs unchanged', () => {
    const frozen = deepFreeze(clone(content));
    const before = JSON.stringify(frozen);
    for (const level of frozen.levels) {
      for (const round of level.rounds) {
        const first = evaluateRound(frozen, round);
        const second = evaluateRound(frozen, round);
        assertDeepEqual(first, second, round.id);
        for (const option of round.options) {
          assertDeepEqual(evaluate(frozen, round, option.id), evaluate(frozen, round, option.id), `${round.id}/${option.id}`);
        }
      }
    }
    assertEqual(JSON.stringify(frozen), before, 'content unchanged');
  });
}
