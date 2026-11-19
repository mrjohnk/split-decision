// Tests for engine/feedback.js and engine/tokens.js. The words shown to the player must carry the
// numbers the evaluator produced, and must never give the answer away on a wrong submission.

import { evaluate } from '../engine/rules.js';
import {
  describeResult, describeSolution, describeHints, describeRound, describeBriefing, describeModel, describeTrace, GUIDANCE,
} from '../engine/feedback.js';
import { fmtLevel, fmtLevelLimit } from '../engine/tokens.js';

const MINUS = '−';
const db = (value) => `${value.toFixed(1)} dB`;
// A level as the page writes it: one decimal, a true minus sign, an explicit plus.
const dbm = (value) => `${value < 0 ? MINUS : value > 0 ? '+' : ''}${Math.abs(value).toFixed(1)} dBm`;
// A limit or the launch power: a whole number, signed the same way.
const limit = (value) => `${value < 0 ? MINUS : value > 0 ? '+' : ''}${Math.abs(value)} dBm`;
const milli = (value) => Math.round(value * 1000);

function allText(description) {
  const parts = [description.headline, description.servedText, description.note, description.nextStep, description.explain];
  for (const ont of description.onts || []) parts.push(ont.line, ont.ledgerText);
  return parts.filter(Boolean).join('\n');
}

export default async function define({ test, assertEqual, assertDeepEqual, assertTrue, assertIncludes, assertNotIncludes, loadJson }) {
  const content = await loadJson('data/levels.json');
  const key = await loadJson('tests/fixtures/answer-key.json');
  const rounds = content.levels.flatMap((level) => level.rounds);
  // The optics, from the specification (decisions D13 and D14) by way of the answer key. Not from the game.
  const optics = { launch: limit(key.optics.launch), dark: limit(key.optics.dark), bright: limit(key.optics.bright) };

  test('feedback/a level is written with one decimal, a true minus sign and an explicit plus', () => {
    assertEqual(fmtLevel(-25700), `${MINUS}25.7 dBm`);
    assertEqual(fmtLevel(-8000), `${MINUS}8.0 dBm`);
    assertEqual(fmtLevel(3500), '+3.5 dBm');
    assertEqual(fmtLevel(0), '0.0 dBm');
    assertEqual(fmtLevelLimit(-28000), `${MINUS}28 dBm`);
    assertEqual(fmtLevelLimit(5000), '+5 dBm');
    assertEqual(fmtLevelLimit(-8500), `${MINUS}8.5 dBm`);
    assertEqual(optics.launch, '+5 dBm');
    assertEqual(optics.dark, `${MINUS}28 dBm`);
    assertEqual(optics.bright, `${MINUS}8 dBm`);
  });

  for (const round of rounds) {
    const expectedRound = key.rounds[round.id];
    const view = describeRound(content, round);
    const answerLabel = view.options.find((o) => o.id === expectedRound.answer).label;

    test(`feedback/${round.id}/the round view fills every token and lists every option`, () => {
      for (const text of [view.title, view.story, view.goal, view.launchText, view.windowText, ...view.options.flatMap((o) => [o.label, o.servedText])]) {
        assertNotIncludes(text, '{');
        assertNotIncludes(text, 'undefined');
      }
      assertEqual(view.options.length, round.options.length);
      assertEqual(view.launchText, optics.launch);
      assertEqual(view.windowText, `${optics.dark} to ${optics.bright}`);
      assertEqual(view.windowLabel, 'Receive window');
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
          assertIncludes(ont.line, `loses ${db(want.total)}`, `${ontId} loss`);
          assertIncludes(ont.line, `receives ${dbm(want.level)}`, `${ontId} receive level`);
          assertEqual(ont.levelText, dbm(want.level), `${ontId} level text`);
          assertEqual(ont.levelMilli, milli(want.level), `${ontId} level`);
          assertIncludes(ont.ledgerText, `= ${db(want.total)}. `, `${ontId} ledger`);
          assertTrue(ont.ledgerText.endsWith(`${optics.launch} ${MINUS} ${db(want.total)} = ${dbm(want.level)}`), `${ontId} ledger ends with the level sum: ${ont.ledgerText}`);
          assertEqual(ont.state, want.state);
          if (want.state === 'dark') {
            assertIncludes(ont.line, `${db(want.by)} below the dark limit of ${optics.dark}`, `${ontId} below by`);
            assertEqual(ont.stateWord, 'Too dark');
          } else if (want.state === 'bright') {
            assertIncludes(ont.line, `${db(want.by)} above the bright limit of ${optics.bright}`, `${ontId} above by`);
            assertEqual(ont.stateWord, 'Too bright');
          } else {
            assertEqual(ont.stateWord, 'Inside the window');
            assertIncludes(ont.line, `${optics.dark} to ${optics.bright}`);
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
        if (expected.outcome === 'too-dark') assertIncludes(description.headline, 'Too dark');
        if (expected.outcome === 'too-bright') assertIncludes(description.headline, 'Too bright');
        if (expected.outcome === 'dark-and-bright') {
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
        assertIncludes(ont.ledgerText, `= ${dbm(want.level)}`);
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
    assertEqual(description.onts[0].ledgerText, `Fiber 9.0 + connectors 3.5 + splices 0.7 + splitter 17.5 = 30.7 dB. +5 dBm ${MINUS} 30.7 dB = ${MINUS}25.7 dBm`);
    assertEqual(description.onts[0].sumText, `+5 dBm ${MINUS} 30.7 dB = ${MINUS}25.7 dBm`);
    assertIncludes(description.onts[0].line, `ONT A loses 30.7 dB and receives ${MINUS}25.7 dBm`);
    assertIncludes(description.onts[0].line, '2.3 dB to spare before the dark limit');
    assertIncludes(description.headline, 'inside the window');
    assertIncludes(description.servedText, '32');
  });

  test('feedback/AC3a round 1-1 with a 1:64 splitter is too dark by 1.2 dB', () => {
    const round = rounds.find((r) => r.id === 'r1-1');
    const description = describeResult(content, round, { ...evaluate(content, round, 'o64'), optionId: 'o64' });
    assertEqual(description.headline, 'Too dark at ONT A.');
    assertEqual(description.onts[0].line, `ONT A loses 34.2 dB and receives ${MINUS}29.2 dBm. That is 1.2 dB below the dark limit of ${MINUS}28 dBm.`);
  });

  test('feedback/round 1-1\'s 1:64 option exposes "only the fiber and the splitter matter"', () => {
    const round = rounds.find((r) => r.id === 'r1-1');
    const description = describeResult(content, round, { ...evaluate(content, round, 'o64'), optionId: 'o64' });
    assertEqual(description.onts[0].ledgerText, `Fiber 9.0 + connectors 3.5 + splices 0.7 + splitter 21.0 = 34.2 dB. +5 dBm ${MINUS} 34.2 dB = ${MINUS}29.2 dBm`);
    // Hand-worked: fiber 9.0 + splitter 21.0 = 30.0, which +5 dBm would carry; 3.5 + 0.7 = 4.2 more.
    assertIncludes(description.note, '30.0 dB');
    assertIncludes(description.note, '4.2 dB');
  });

  test('feedback/a brighter ONT in round 3-1 is measured against the bright limit', () => {
    const round = rounds.find((r) => r.id === 'r3-1');
    const description = describeResult(content, round, { ...evaluate(content, round, 'a3'), optionId: 'a3' });
    assertEqual(description.headline, 'Too bright at ONT A and ONT B.');
    assertEqual(description.onts[0].line, `ONT A loses 12.2 dB and receives ${MINUS}7.2 dBm. That is 0.8 dB above the bright limit of ${MINUS}8 dBm.`);
  });

  test('feedback/a two-stage ledger lists both splitters', () => {
    const round = rounds.find((r) => r.id === 'r2-2');
    const description = describeResult(content, round, { ...evaluate(content, round, 'c4x16'), optionId: 'c4x16' });
    const b = description.onts.find((o) => o.id === 'B');
    assertEqual(b.ledgerText, `Fiber 7.0 + connectors 4.0 + splices 0.5 + splitter 7.0 + splitter 14.0 = 32.5 dB. +5 dBm ${MINUS} 32.5 dB = ${MINUS}27.5 dBm`);
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

  // Worked examples, from the specification's table (launch +5 dBm, window −28 to −8 dBm):
  //   Level 1: 10.0 km (5.0) + 4 connectors (2.0) + 2 splices (0.2) + 1:16 (14.0) = 21.2; 5 − 21.2 = −16.2; 11.8 above −28
  //   Level 2: X 14.8 km (7.4) + 6 connectors (3.0) + 3 splices (0.3) + 1:32 (17.5) = 28.2; −23.2
  //            Y 19.0 km (9.5) + 6 connectors (3.0) + 5 splices (0.5) + 1:32 (17.5) = 30.5; −25.5; 2.5 above −28
  //   Level 3: 1.0 km (0.5) + 3 connectors (1.5) + 1:2 (3.5) = 5.5, −0.5; + 15 = 20.5, −15.5
  const examples = [
    { level: 'level-1', includes: ['21.2 dB', '+5 dBm', `${MINUS}16.2 dBm`, '11.8 dB', `${MINUS}28 dBm`], ledger: [`Fiber 5.0 + connectors 2.0 + splices 0.2 + splitter 14.0 = 21.2 dB. +5 dBm ${MINUS} 21.2 dB = ${MINUS}16.2 dBm`], title: '10.0 km' },
    { level: 'level-2', includes: ['28.2 dB', `${MINUS}23.2 dBm`, '30.5 dB', `${MINUS}25.5 dBm`, '2.5 dB', `${MINUS}28 dBm to ${MINUS}8 dBm`], ledger: ['Fiber 7.4 + connectors 3.0 + splices 0.3 + splitter 17.5 = 28.2 dB', 'Fiber 9.5 + connectors 3.0 + splices 0.5 + splitter 17.5 = 30.5 dB'], title: '1:32' },
    { level: 'level-3', includes: ['5.5 dB', `${MINUS}0.5 dBm`, `${MINUS}8 dBm`, '15.0 dB', '20.5 dB', `${MINUS}15.5 dBm`], ledger: ['Fiber 0.5 + connectors 1.5 + splitter 3.5 + attenuator 15.0 = 20.5 dB'], title: '15 dB' },
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
      for (const [ontId, want] of Object.entries(key.examples[example.level])) {
        const ont = briefing.example.onts.find((o) => o.id === ontId);
        assertEqual(ont.totalText, db(want.total), `${example.level} ${ontId} loss`);
        assertEqual(ont.levelText, dbm(want.level), `${example.level} ${ontId} level`);
        assertEqual(ont.state, want.state);
      }
      assertEqual(briefing.example.onts.length, Object.keys(key.examples[example.level]).length);
      assertTrue(briefing.sources.length >= 2 && briefing.sources.every((s) => s.title && s.section && (s.url === undefined || s.url.startsWith('https://'))), 'sources are cited');
      assertTrue(briefing.sources.some((s) => s.url), 'at least one cited source is a published one');
      assertEqual(briefing.sources[0].id, 'R7', 'the window\'s own source, the owner\'s decision, is cited first');
    });
  }

  test('feedback/level 1 teaches the receive level and states the simplifications in plain language (FR-022)', () => {
    const briefing = describeBriefing(content, content.levels[0]);
    const text = briefing.intro.join(' ');
    assertIncludes(text, 'single fiber');
    assertIncludes(text, `launches it at ${optics.launch}`);
    assertIncludes(text, 'receive level');
    assertIncludes(text, `${optics.dark} to ${optics.bright}`);
    assertIncludes(text, 'one launch power');
    assertIncludes(text, 'no spare margin');
    const terms = briefing.terms.map((t) => t.term);
    for (const term of ['dB', 'dBm', 'Receive level', 'Receive window']) assertTrue(terms.includes(term), `the term ${term} is defined`);
    assertIncludes(briefing.sources.map((s) => s.id).join(','), 'R8', 'the launch power\'s source is cited');
  });

  test('feedback/the model panel is filled and lists every source', () => {
    const model = describeModel(content);
    for (const text of [...model.rule, ...model.assumptions, ...model.leftOut]) assertNotIncludes(text, '{');
    assertIncludes(model.rule.join(' '), `${optics.dark} to ${optics.bright}`);
    assertIncludes(model.rule.join(' '), optics.launch);
    assertDeepEqual(model.optics, [
      { label: 'Launch power at the OLT port', value: optics.launch },
      { label: 'Receive window at each ONT', value: `${optics.dark} to ${optics.bright}` },
    ], 'one set of optics, shown without a class name');
    assertIncludes(model.assumptions.join(' '), '0.5 dB per km');
    assertIncludes(model.leftOut.join(' '), 'upstream');
    assertEqual(model.sources.length, content.sources.length);
    assertEqual(model.sources.length, 8, 'R1 to R8');
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

  test('feedback/the trace starts at the launch power, falls by exactly each step and ends at each ONT\'s receive level', () => {
    const launch = milli(key.optics.launch);
    for (const round of rounds) {
      for (const option of round.options) {
        const trace = describeTrace(content, round, option);
        const expected = key.rounds[round.id].options[option.id].onts;
        assertEqual(trace.series.length, Object.keys(expected).length, `${round.id}/${option.id}: one line for each ONT`);
        assertEqual(trace.launchMilli, launch);
        assertEqual(trace.launchText, optics.launch);
        assertEqual(trace.darkMilli, milli(key.optics.dark));
        assertEqual(trace.brightMilli, milli(key.optics.bright));
        assertEqual(trace.topMilli, launch, 'the scale starts at the launch power');
        for (const line of trace.series) {
          assertEqual(line.totalText, db(expected[line.ontId].total), `${round.id}/${option.id}/${line.ontId} loss`);
          assertEqual(line.levelText, dbm(expected[line.ontId].level), `${round.id}/${option.id}/${line.ontId} level`);
          assertEqual(line.state, expected[line.ontId].state);
          assertEqual(line.steps[0].fromMilli, launch, 'a trace starts at the launch power');
          line.steps.forEach((step, index) => {
            if (index > 0) assertEqual(step.fromMilli, line.steps[index - 1].toMilli, 'each step starts where the last one ended');
            assertTrue(step.toMilli < step.fromMilli, 'light only falls');
          });
          assertEqual(line.steps[line.steps.length - 1].toMilli, line.levelMilli, 'the last step ends at the receive level');
          assertEqual(line.levelMilli, launch - line.totalMilli, 'the level is the launch power less the loss');
          assertTrue(trace.bottomMilli < line.levelMilli, 'the scale reaches below every level');
        }
        assertTrue(trace.bottomMilli < trace.darkMilli && trace.topMilli > trace.brightMilli, 'the scale shows both zones outside the window');
      }
    }
  });

  test('feedback/a step of the trace says what the light meets and the level after it', () => {
    const round = rounds.find((r) => r.id === 'r1-1');
    const trace = describeTrace(content, round, round.options.find((o) => o.id === 'o32'));
    // Hand-worked: +5 dBm less 16.0 km of feeder fiber (8.0 dB) is −3.0 dBm.
    assertEqual(trace.series[0].steps[0].text, `Fiber, 16.0 km: 8.0 dB. Level after it ${MINUS}3.0 dBm.`);
    const last = trace.series[0].steps[trace.series[0].steps.length - 1];
    assertTrue(last.text.endsWith(`Level after it ${MINUS}25.7 dBm.`), last.text);
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
    assertEqual(unlit.topMilli, milli(key.optics.launch));
    assertTrue(unlit.bottomMilli < unlit.darkMilli);
  });
}
