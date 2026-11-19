// Tests for engine/content.js, written from contracts/content.md before the validator existed.

import { validateContent } from '../engine/content.js';
import { evaluate, evaluateOption } from '../engine/rules.js';
import { clone } from './harness.js';

function round(content, id) {
  for (const level of content.levels) for (const r of level.rounds) if (r.id === id) return r;
  return null;
}

function option(content, roundId, optionId) {
  return round(content, roundId).options.find((o) => o.id === optionId);
}

// Every authored text of the content, with the place it comes from. Source records are left out:
// their `claim` quotes a reference and is not computed from the loss card.
function authoredTexts(content) {
  const out = [];
  const add = (where, text) => { if (typeof text === 'string') out.push({ where, text }); };
  for (const group of ['rule', 'assumptions', 'leftOut']) content.model[group].forEach((t, i) => add(`model.${group}[${i}]`, t));
  for (const level of content.levels) {
    add(`${level.id}.title`, level.title);
    add(`${level.id}.outcome`, level.outcome);
    add(`${level.id}.practiced`, level.practiced);
    level.briefing.intro.forEach((t, i) => add(`${level.id}.intro[${i}]`, t));
    level.briefing.terms.forEach((t, i) => { add(`${level.id}.terms[${i}].term`, t.term); add(`${level.id}.terms[${i}].meaning`, t.meaning); });
    add(`${level.id}.example.title`, level.briefing.example.title);
    add(`${level.id}.example.result`, level.briefing.example.result);
    for (const r of level.rounds) {
      for (const field of ['title', 'place', 'story', 'goal', 'explain']) add(`${r.id}.${field}`, r[field]);
      r.hints.forEach((t, i) => add(`${r.id}.hints[${i}]`, t));
      for (const o of r.options) {
        add(`${r.id}.${o.id}.label`, o.label);
        add(`${r.id}.${o.id}.servedLabel`, o.servedLabel);
        add(`${r.id}.${o.id}.note`, o.note);
      }
    }
  }
  return out;
}

export default async function define({ test, assertEqual, assertTrue, assertDeepEqual, loadJson }) {
  const shipped = await loadJson('data/levels.json');

  // Validate an altered copy and require one error code at a place.
  function expectError(id, mutate, code, whereIncludes) {
    test(`content/${id} is rejected with ${code}`, () => {
      const doc = clone(shipped);
      mutate(doc);
      const result = validateContent(doc);
      assertEqual(result.ok, false, 'ok');
      const hit = result.errors.find((e) => e.code === code && (!whereIncludes || e.where.includes(whereIncludes)));
      assertTrue(hit, `expected ${code} at ${whereIncludes || 'any place'}, got ${JSON.stringify(result.errors.map((e) => [e.code, e.where]))}`);
      assertTrue(typeof hit.message === 'string' && hit.message.length > 10, 'the error carries a message');
    });
  }

  test('content/the shipped content validates', () => {
    const result = validateContent(clone(shipped));
    assertDeepEqual(result.ok ? [] : result.errors, []);
    assertEqual(result.ok, true);
    assertEqual(result.content.levels.length, 3, 'levels');
  });

  test('content/validation does not modify its input', () => {
    const doc = clone(shipped);
    const before = JSON.stringify(doc);
    validateContent(doc);
    assertEqual(JSON.stringify(doc), before);
  });

  test('content/validation never throws on a document that is not an object', () => {
    for (const bad of [null, 42, 'levels', [], undefined]) {
      const result = validateContent(bad);
      assertEqual(result.ok, false);
      assertTrue(result.errors.length > 0);
    }
  });

  test('content/no authored text carries a hand-typed dB value', () => {
    const offenders = authoredTexts(shipped).filter(({ text }) => /\d\s*dB\b/.test(text));
    assertDeepEqual(offenders.map((o) => o.where), []);
  });

  test('content/every level has two rounds, every round two hints, every wrong option a note', () => {
    for (const level of shipped.levels) {
      assertEqual(level.rounds.length, 2, level.id);
      for (const r of level.rounds) {
        assertEqual(r.hints.length, 2, r.id);
        const answer = evaluate(shipped, r, r.options[0].id).expected.optionId;
        for (const o of r.options) if (o.id !== answer) assertTrue(o.note && o.expect, `${r.id}/${o.id} note`);
      }
    }
  });

  // --- The specification's unsupported-content cases -------------------------------------------

  expectError('U1 no valid option', (doc) => { round(doc, 'r1-1').plant.trunk.fiberKm = 60; }, 'no-valid-option', 'r1-1');
  expectError('U2 tie for the most homes', (doc) => { option(doc, 'r1-1', 'o16').served = 32; }, 'tie-for-best', 'r1-1');
  expectError('U3 unknown split ratio', (doc) => { option(doc, 'r1-1', 'o64').splitters.s1 = 128; }, 'unknown-ratio', 'r1-1');
  expectError('U3 unknown class', (doc) => { round(doc, 'r2-1').class = 'E9'; }, 'unknown-class', 'r2-1');
  expectError('U4 inexact value', (doc) => { round(doc, 'r1-1').plant.trunk.fiberKm = 13.1; }, 'inexact-total', 'r1-1');
  expectError('U5 note contradicts the rule', (doc) => { option(doc, 'r1-1', 'o64').expect = 'under-min'; }, 'note-mismatch', 'r1-1');
  expectError('U6 broken reference', (doc) => { doc.levels[0].briefing.sourceIds = ['R9']; }, 'unknown-source', 'level-1');

  // --- The remaining error codes ---------------------------------------------------------------

  expectError('missing title', (doc) => { delete round(doc, 'r2-2').title; }, 'schema', 'r2-2');
  expectError('wrong schema version', (doc) => { doc.schemaVersion = 2; }, 'schema', '');
  expectError('levels not a list', (doc) => { doc.levels = {}; }, 'schema', '');
  expectError('duplicate round ID', (doc) => { round(doc, 'r1-2').id = 'r1-1'; }, 'duplicate-id', 'level-1');
  expectError('duplicate option ID', (doc) => { option(doc, 'r3-1', 'a1').id = 'a5'; }, 'duplicate-id', 'r3-1');
  expectError('duplicate ONT ID', (doc) => { round(doc, 'r2-1').plant.trunk.to.legs[1].to.id = 'A'; }, 'duplicate-id', 'r2-1');
  expectError('open splitter left unset', (doc) => { delete option(doc, 'r1-1', 'o32').splitters.s1; }, 'open-splitter', 'r1-1');
  expectError('option sets a splitter that is not open', (doc) => { option(doc, 'r3-1', 'a5').splitters.s1 = 16; }, 'open-splitter', 'r3-1');
  expectError('attenuator at an unknown place', (doc) => { option(doc, 'r3-2', 'ontA10').attenuators[0].at = 'Z'; }, 'attenuator-place', 'r3-2');
  expectError('negative splice count', (doc) => { round(doc, 'r1-1').plant.trunk.splices = -1; }, 'bad-number', 'r1-1');
  expectError('fractional connector count', (doc) => { round(doc, 'r1-1').plant.trunk.connectors = 1.5; }, 'bad-number', 'r1-1');
  expectError('length finer than a metre', (doc) => { round(doc, 'r1-1').plant.trunk.fiberKm = 13.0005; }, 'bad-number', 'r1-1');
  expectError('served is zero', (doc) => { option(doc, 'r1-1', 'o16').served = 0; }, 'bad-number', 'r1-1');
  expectError('class minimum above maximum', (doc) => { doc.classes.design.minDb = 30; }, 'bad-number', 'design');
  expectError('wrong option without a note', (doc) => { const o = option(doc, 'r1-1', 'o64'); delete o.note; delete o.expect; }, 'missing-note', 'r1-1');
  expectError('note without expect', (doc) => { delete option(doc, 'r1-1', 'o64').expect; }, 'note-mismatch', 'r1-1');
  expectError('unknown token', (doc) => { round(doc, 'r1-1').hints[0] = 'Add {bogus} to the total.'; }, 'unknown-token', 'r1-1');
  expectError('token for an ONT that does not exist', (doc) => { round(doc, 'r1-1').hints[1] = 'The path loses {fixed:Q}.'; }, 'unknown-token', 'r1-1');
  expectError('option-only token in a hint', (doc) => { round(doc, 'r1-1').hints[1] = 'The total is {total:A}.'; }, 'unknown-token', 'r1-1');
  expectError('token for a ratio that is not on the card', (doc) => { doc.levels[0].briefing.intro[0] = 'A splitter costs {splitter:128}.'; }, 'unknown-token', 'level-1');
  expectError('one hint only', (doc) => { round(doc, 'r3-2').hints.pop(); }, 'bad-hints', 'r3-2');
  expectError('a level with one round', (doc) => { doc.levels[2].rounds.pop(); }, 'bad-level', 'level-3');
  expectError('worked example outside its window', (doc) => { doc.levels[2].briefing.example.attenuators = []; }, 'bad-example', 'level-3');
  expectError('worked example with an open splitter', (doc) => { doc.levels[0].briefing.example.plant.trunk.to.ratio = null; }, 'bad-example', 'level-1');

  test('content/one mistake is reported once', () => {
    const doc = clone(shipped);
    round(doc, 'r2-1').class = 'E9';
    const result = validateContent(doc);
    assertEqual(result.errors.filter((e) => e.where.includes('r2-1')).length, 1);
  });

  // --- Principle VI: a new challenge is a data change ------------------------------------------

  test('content/a trial round is graded without changing the engine', () => {
    // A new plant shape (an open second stage behind an installed first stage, plus an attenuator
    // option) replaces round 1-2. Hand-worked, loss window 8 to 28 dB:
    //   ONT T: fiber 3.0 + 1.0 = 4.0 km (2.0), 3 connectors (1.5), 2 splices (0.2),
    //          installed 1:4 (7.0) = 10.7 before the choice.
    //   1:4 second stage (7.0)  = 17.7 inside, serves 16
    //   1:16 second stage (14.0) = 24.7 inside, serves 64      <- the answer
    //   1:64 second stage (21.0) = 31.7, over by 3.7, serves 256
    //   1:16 second stage + 5 dB at the OLT = 29.7, over by 1.7, serves 64
    const doc = clone(shipped);
    doc.levels[0].rounds[1] = {
      id: 'trial', title: 'Trial Road', place: 'Trial work order', story: 'A trial round.',
      goal: 'Choose the design that serves the most homes inside the window.', class: 'design',
      plant: {
        oltLabel: 'OLT port',
        trunk: {
          fiberKm: 3.0, connectors: 2, splices: 1,
          to: {
            type: 'splitter', id: 'first', label: 'First stage', ratio: 4,
            legs: [{
              fiberKm: 1.0, connectors: 1, splices: 1,
              to: {
                type: 'splitter', id: 'second', label: 'Second stage', ratio: null,
                legs: [{ fiberKm: 0, connectors: 0, splices: 0, to: { type: 'ont', id: 'T', label: 'ONT T' } }],
              },
            }],
          },
        },
      },
      options: [
        { id: 't4', label: '{ratio:second} second stage', served: 16, splitters: { second: 4 }, attenuators: [], note: 'Room to spare.', expect: 'valid-not-best' },
        { id: 't16', label: '{ratio:second} second stage', served: 64, splitters: { second: 16 }, attenuators: [] },
        { id: 't64', label: '{ratio:second} second stage', served: 256, splitters: { second: 64 }, attenuators: [], note: 'Too much.', expect: 'over-max' },
        { id: 't16a', label: '{ratio:second} second stage and a {att:olt} attenuator', served: 64, splitters: { second: 16 }, attenuators: [{ at: 'olt', db: 5 }], note: 'Nothing to fix.', expect: 'over-max' },
      ],
      hints: ['Add the path.', 'Before the choice the path loses {fixed:T}.'],
      explain: 'With the {answer} ONT T is at {total:T}.',
    };
    const result = validateContent(doc);
    assertDeepEqual(result.ok ? [] : result.errors, []);
    const trial = round(result.content, 'trial');
    const totals = Object.fromEntries(trial.options.map((o) => [o.id, evaluateOption(result.content, trial, o).onts[0].totalMilli]));
    assertDeepEqual(totals, { t4: 17700, t16: 24700, t64: 31700, t16a: 29700 });
    assertEqual(evaluate(result.content, trial, 't16').status, 'correct');
    assertEqual(evaluate(result.content, trial, 't16a').reasonCode, 'over-max');
    assertEqual(evaluate(result.content, trial, 't4').reasonCode, 'valid-not-best');
  });
}
