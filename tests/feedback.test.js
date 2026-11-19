// Tests for engine/feedback.js and engine/tokens.js. The words shown to the player must carry the
// numbers the evaluator produced, and must never give the answer away on a wrong submission.

import { evaluate } from '../engine/rules.js';
import {
  describeResult, describeSolution, describeHints, describeRound, describeBriefing, describeModel, describeTrace, GUIDANCE,
} from '../engine/feedback.js';

const db = (value) => `${value.toFixed(1)} dB`;

function allText(description) {
  const parts = [description.headline, description.servedText, description.note, description.nextStep, description.explain];
  for (const ont of description.onts || []) parts.push(ont.line, ont.ledgerText);
  return parts.filter(Boolean).join('\n');
}

export default async function define({ test, assertEqual, assertDeepEqual, assertTrue, assertIncludes, assertNotIncludes, loadJson }) {
  const content = await loadJson('data/levels.json');
  const key = await loadJson('tests/fixtures/answer-key.json');
  const rounds = content.levels.flatMap((level) => level.rounds);
  // The loss window, from the specification (decision D11) by way of the answer key. Not from the game.
  const limits = { [key.window.class]: { min: `${key.window.min} dB`, max: `${key.window.max} dB` } };

  for (const round of rounds) {
    const expectedRound = key.rounds[round.id];
    const view = describeRound(content, round);
    const answerLabel = view.options.find((o) => o.id === expectedRound.answer).label;

    test(`feedback/${round.id}/the round view fills every token and lists every option`, () => {
      for (const text of [view.title, view.story, view.goal, view.windowText, ...view.options.flatMap((o) => [o.label, o.servedText])]) {
        assertNotIncludes(text, '{');
        assertNotIncludes(text, 'undefined');
      }
      assertEqual(view.options.length, round.options.length);
      assertIncludes(view.windowText, limits[round.class].min.replace(' dB', ''));
      assertIncludes(view.windowText, limits[round.class].max);
      assertEqual(view.pathRows.length, Object.keys(Object.values(expectedRound.options)[0].onts).length);
    });

    for (const [optionId, expected] of Object.entries(expectedRound.options)) {
      test(`feedback/${round.id}/${optionId} says what the evaluator found`, () => {
        const description = describeResult(content, round, { ...evaluate(content, round, optionId), optionId });
        const text = allText(description);
        assertNotIncludes(text, '{', 'no unfilled token');
        assertNotIncludes(text, 'undefined');
        assertEqual(description.tone, expected.outcome === 'best-valid' ? 'correct' : 'incorrect');
        assertEqual(description.outcome, expected.outcome);
        assertEqual(description.optionLabel, view.options.find((o) => o.id === optionId).label);

        for (const [ontId, want] of Object.entries(expected.onts)) {
          const ont = description.onts.find((o) => o.id === ontId);
          assertIncludes(ont.line, db(want.total), `${ontId} total`);
          assertIncludes(ont.ledgerText, `= ${db(want.total)}`, `${ontId} ledger`);
          assertEqual(ont.state, want.state);
          if (want.state === 'over') {
            assertIncludes(ont.line, `${db(want.by)} over`, `${ontId} over by`);
            assertIncludes(ont.line, `maximum of ${limits[round.class].max}`);
            assertEqual(ont.stateWord, 'Too dark');
          } else if (want.state === 'under') {
            assertIncludes(ont.line, `${db(want.by)} under`, `${ontId} under by`);
            assertIncludes(ont.line, `minimum of ${limits[round.class].min}`);
            assertEqual(ont.stateWord, 'Too bright');
          } else {
            assertEqual(ont.stateWord, 'Inside the window');
          }
        }

        if (expected.outcome === 'best-valid') {
          assertTrue(description.explain && description.explain.length > 20, 'the correct answer is explained');
          assertEqual(description.nextStep, null);
        } else {
          assertNotIncludes(text, answerLabel, 'a wrong submission never names the answer (FR-011)');
          assertTrue(description.note && description.note.length > 20, 'the mistake is named (FR-010)');
          assertTrue(description.nextStep && description.nextStep.length > 20, 'a next step is given (FR-010)');
          assertEqual(description.explain, null);
        }
        if (expected.outcome === 'valid-not-best') {
          assertIncludes(description.headline, 'larger');
          assertIncludes(text, String(expected.served));
        }
        if (expected.outcome === 'over-max') assertIncludes(description.headline, 'Too dark');
        if (expected.outcome === 'under-min') assertIncludes(description.headline, 'Too bright');
        if (expected.outcome === 'over-and-under') {
          assertIncludes(description.headline, 'Too bright');
          assertIncludes(description.headline, 'too dark');
        }
      });
    }

    test(`feedback/${round.id}/the worked solution names the answer and carries its ledger`, () => {
      const solution = describeSolution(content, round);
      assertEqual(solution.answerLabel, answerLabel);
      assertNotIncludes(solution.explain, '{');
      for (const [ontId, want] of Object.entries(expectedRound.options[expectedRound.answer].onts)) {
        const ont = solution.onts.find((o) => o.id === ontId);
        assertIncludes(ont.ledgerText, `= ${db(want.total)}`);
      }
    });

    test(`feedback/${round.id}/both hints are filled, and neither names the answer`, () => {
      const hints = describeHints(content, round);
      assertEqual(hints.length, 2);
      for (const hint of hints) {
        assertNotIncludes(hint, '{');
        assertNotIncludes(hint, 'undefined');
        assertNotIncludes(hint, answerLabel);
      }
      const fixed = key.fixedBeforeChoice[round.id];
      for (const [, decibels] of Object.entries(fixed)) assertIncludes(hints[1], db(decibels), 'hint 2 shows the loss before the choice');
    });
  }

  test('feedback/AC2 the ledger of round 1-1 with a 1:32 splitter', () => {
    const round = rounds.find((r) => r.id === 'r1-1');
    const description = describeResult(content, round, { ...evaluate(content, round, 'o32'), optionId: 'o32' });
    assertEqual(description.onts[0].ledgerText, 'Fiber 7.0 + connectors 2.0 + splices 0.4 + splitter 17.5 = 26.9 dB');
    assertIncludes(description.onts[0].line, 'ONT A: 26.9 dB');
    assertIncludes(description.headline, 'inside the window');
    assertIncludes(description.servedText, '32');
  });

  test('feedback/AC3a round 1-1 with a 1:64 splitter is too dark by 2.4 dB', () => {
    const round = rounds.find((r) => r.id === 'r1-1');
    const description = describeResult(content, round, { ...evaluate(content, round, 'o64'), optionId: 'o64' });
    assertEqual(description.headline, 'Too dark at ONT A.');
    assertIncludes(description.onts[0].line, '30.4 dB');
    assertIncludes(description.onts[0].line, '2.4 dB over the maximum of 28 dB');
  });

  test('feedback/the specification\'s worked interaction for round 1-2', () => {
    const round = rounds.find((r) => r.id === 'r1-2');
    const description = describeResult(content, round, { ...evaluate(content, round, 'o32'), optionId: 'o32' });
    assertIncludes(description.onts[0].line, '1.4 dB over the maximum of 28 dB');
    assertEqual(description.onts[0].ledgerText, 'Fiber 9.5 + connectors 2.0 + splices 0.4 + splitter 17.5 = 29.4 dB');
    assertIncludes(description.note, 'Without them the path looks like 27.0 dB');
    assertIncludes(description.note, 'they add 2.4 dB');
  });

  test('feedback/a two-stage ledger lists both splitters', () => {
    const round = rounds.find((r) => r.id === 'r2-2');
    const description = describeResult(content, round, { ...evaluate(content, round, 'c4x16'), optionId: 'c4x16' });
    const b = description.onts.find((o) => o.id === 'B');
    assertEqual(b.ledgerText, 'Fiber 3.5 + connectors 2.5 + splices 0.5 + splitter 7.0 + splitter 14.0 = 27.5 dB');
    assertIncludes(description.explain, '7.0 dB + 14.0 dB');
  });

  test('feedback/an attenuator at one ONT appears only in that ONT\'s ledger', () => {
    const round = rounds.find((r) => r.id === 'r3-2');
    const description = describeResult(content, round, { ...evaluate(content, round, 'ontA10'), optionId: 'ontA10' });
    assertIncludes(description.onts.find((o) => o.id === 'A').ledgerText, 'attenuator 10.0');
    assertNotIncludes(description.onts.find((o) => o.id === 'B').ledgerText, 'attenuator');
    assertEqual(description.optionLabel, 'Add a 10 dB attenuator at ONT A');
  });

  test('feedback/guidance exists for an empty submission and for an unknown option', () => {
    assertTrue(GUIDANCE['no-selection'].length > 20);
    assertTrue(GUIDANCE['unknown-option'].length > 20);
    const round = rounds[0];
    const description = describeResult(content, round, { ...evaluate(content, round, null), optionId: null });
    assertEqual(description.tone, 'guidance');
    assertEqual(description.headline, GUIDANCE['no-selection']);
  });

  // Worked examples, hand-checked here against the 8 to 28 dB window:
  //   Level 1: 10.0 km (5.0) + 4 connectors (2.0) + 2 splices (0.2) + 1:16 (14.0) = 21.2; 28 - 21.2 = 6.8
  //   Level 2: X 8.8 km (4.4) + 4 connectors (2.0) + 3 splices (0.3) + 1:32 (17.5) = 24.2
  //            Y 13.0 km (6.5) + 4 connectors (2.0) + 5 splices (0.5) + 1:32 (17.5) = 26.5; 28 - 26.5 = 1.5
  //   Level 3: 1.0 km (0.5) + 3 connectors (1.5) + 1:2 (3.5) = 5.5; + 10 = 15.5
  const examples = [
    { level: 'level-1', includes: ['21.2 dB', '6.8 dB', '28 dB'], ledger: ['Fiber 5.0 + connectors 2.0 + splices 0.2 + splitter 14.0 = 21.2 dB'], title: '10.0 km' },
    { level: 'level-2', includes: ['24.2 dB', '26.5 dB', '1.5 dB', '8 to 28 dB'], ledger: ['Fiber 4.4 + connectors 2.0 + splices 0.3 + splitter 17.5 = 24.2 dB', 'Fiber 6.5 + connectors 2.0 + splices 0.5 + splitter 17.5 = 26.5 dB'], title: '1:32' },
    { level: 'level-3', includes: ['5.5 dB', '15.5 dB', '10.0 dB', '8 dB'], ledger: ['Fiber 0.5 + connectors 1.5 + splitter 3.5 + attenuator 10.0 = 15.5 dB'], title: '10 dB' },
  ];
  for (const example of examples) {
    test(`feedback/${example.level}/the briefing is filled and its worked example is computed`, () => {
      const level = content.levels.find((l) => l.id === example.level);
      const briefing = describeBriefing(content, level);
      const texts = [briefing.title, briefing.outcome, ...briefing.intro, ...briefing.terms.flatMap((t) => [t.term, t.meaning]), briefing.example.title, briefing.example.result];
      for (const text of texts) {
        assertNotIncludes(text, '{');
        assertNotIncludes(text, 'undefined');
      }
      for (const part of example.includes) assertIncludes(briefing.example.result, part);
      assertIncludes(briefing.example.title, example.title);
      const ledgers = briefing.example.onts.map((o) => o.ledgerText).join('\n');
      for (const part of example.ledger) assertIncludes(ledgers, part);
      assertTrue(briefing.sources.length >= 2 && briefing.sources.every((s) => s.title && s.section && (s.url === undefined || s.url.startsWith('https://'))), 'sources are cited');
      assertTrue(briefing.sources.some((s) => s.url), 'at least one cited source is a published one');
      assertEqual(briefing.sources[0].id, 'R7', 'the window\'s own source, the owner\'s decision, is cited first');
    });
  }

  test('feedback/level 1 states the simplifications in plain language (FR-022)', () => {
    const briefing = describeBriefing(content, content.levels[0]);
    const text = briefing.intro.join(' ');
    assertIncludes(text, 'one fiber value for both directions');
    assertIncludes(text, 'no spare margin');
  });

  test('feedback/the model panel is filled and lists every source', () => {
    const model = describeModel(content);
    for (const text of [...model.rule, ...model.assumptions, ...model.leftOut]) assertNotIncludes(text, '{');
    assertIncludes(model.rule.join(' '), '8 dB to 28 dB');
    assertDeepEqual(model.classes, [{ name: 'design', label: 'Loss window', text: '8 to 28 dB' }], 'one window, shown without a class name');
    assertIncludes(model.assumptions.join(' '), '0.5 dB per km');
    assertEqual(model.sources.length, content.sources.length);
    assertEqual(model.lossCard.length, 9, 'fiber, connector, splice and six splitters');
    assertIncludes(model.lossCard.map((row) => `${row.label} ${row.value}`).join('; '), '1:32 splitter 17.5 dB');
  });

  test('feedback/no worked example repeats the numbers of a challenge (FR-002)', () => {
    const challengeTotals = new Set();
    for (const round of rounds) {
      for (const option of round.options) {
        const result = evaluate(content, round, option.id);
        for (const ont of describeResult(content, round, { ...result, optionId: option.id }).onts) challengeTotals.add(ont.totalText);
      }
    }
    assertTrue(challengeTotals.size >= 30, 'the challenges were collected');
    for (const level of content.levels) {
      for (const ont of describeBriefing(content, level).example.onts) {
        assertTrue(!challengeTotals.has(ont.totalText), `${level.id}: the example total ${ont.totalText} is also a challenge total`);
      }
    }
  });

  test('feedback/only the answer gets a headline that says Correct', () => {
    for (const round of rounds) {
      for (const option of round.options) {
        const result = evaluate(content, round, option.id);
        const description = describeResult(content, round, { ...result, optionId: option.id });
        const saysCorrect = description.headline.startsWith('Correct.');
        assertEqual(saysCorrect, option.id === key.rounds[round.id].answer, `${round.id}/${option.id}: ${description.headline}`);
      }
    }
  });

  test('feedback/the trace ends at each ONT\'s total and climbs by exactly each step', () => {
    for (const round of rounds) {
      for (const option of round.options) {
        const trace = describeTrace(content, round, option);
        const expected = key.rounds[round.id].options[option.id].onts;
        assertEqual(trace.series.length, Object.keys(expected).length, `${round.id}/${option.id}: one line for each ONT`);
        for (const line of trace.series) {
          assertEqual(line.totalText, db(expected[line.ontId].total), `${round.id}/${option.id}/${line.ontId}`);
          assertEqual(line.steps[0].fromMilli, 0, 'a trace starts at no loss');
          line.steps.forEach((step, index) => {
            if (index > 0) assertEqual(step.fromMilli, line.steps[index - 1].toMilli, 'each step starts where the last one ended');
            assertTrue(step.toMilli > step.fromMilli, 'loss only adds up');
          });
          assertEqual(line.steps[line.steps.length - 1].toMilli, line.totalMilli, 'the last step ends at the total');
          assertTrue(trace.domainMaxMilli > line.totalMilli, 'the scale reaches past every total');
        }
      }
    }
  });

  test('feedback/a stretch of path used by several ONTs is marked as shared by them', () => {
    const loop = rounds.find((r) => r.id === 'r2-1');
    const trace = describeTrace(content, loop, loop.options[0]);
    assertEqual(trace.hasShared, true);
    const [a, b, c] = trace.series;
    assertEqual(a.steps[0].sharedBy.join(','), 'A,B,C', 'the trunk is on every path');
    assertEqual(a.steps[0].key, c.steps[0].key);
    assertIncludes(a.steps[0].text, 'Every ONT: ');
    const lastA = a.steps[a.steps.length - 1];
    assertEqual(lastA.sharedBy.join(','), 'A', 'the last stretch to ONT A is its own');
    assertIncludes(lastA.text, 'ONT A: ');
    assertTrue(b.steps.some((step) => step.sharedBy.join(',') === 'B'), 'ONT B has a stretch of its own');

    const single = rounds.find((r) => r.id === 'r1-1');
    const one = describeTrace(content, single, single.options[0]);
    assertEqual(one.hasShared, false);
    assertTrue(one.series[0].steps.every((step) => step.sharedBy.length === 1 && !step.text.startsWith('ONT')), 'one ONT: nothing shared, no name needed');

    const unlit = describeTrace(content, single, null);
    assertEqual(unlit.series.length, 0);
    assertEqual(unlit.hasShared, false);
  });
}
