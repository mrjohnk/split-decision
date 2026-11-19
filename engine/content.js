// Validation of the content file. The whole document is checked before the first screen, and a
// document with any error is never played or graded. See contracts/content.md.
//
// validateContent never throws for bad content and never changes its input.

import { toMilli, evaluateOption, evaluateRound, outcomeOf, pathsOf, OUTCOMES } from './rules.js';
import { globalScope, roundScope, optionScope, unknownTokens, fill } from './tokens.js';
import { exampleAsRound } from './feedback.js';

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = (value) => typeof value === 'string' && value.trim().length > 0;
const isCount = (value) => Number.isInteger(value) && value >= 0;
const isTextList = (value) => Array.isArray(value) && value.length > 0 && value.every(isText);
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

export function validateContent(doc) {
  const errors = [];
  const report = (code, where, message) => errors.push({ code, where, message });

  if (!isObject(doc)) {
    report('schema', 'document', 'The content file must be a JSON object.');
    return { ok: false, errors };
  }

  // --- The document and its shared tables ---------------------------------------------------

  if (doc.schemaVersion !== 1) report('schema', 'document', 'schemaVersion must be 1. This game reads version 1 content only.');
  if (!isText(doc.title)) report('schema', 'document', 'The document needs a title.');
  if (!isObject(doc.lossCard)) report('schema', 'lossCard', 'The loss card is missing.');
  if (!isObject(doc.classes) || Object.keys(doc.classes || {}).length === 0) report('schema', 'classes', 'At least one loss class is needed.');
  if (!Array.isArray(doc.sources)) report('schema', 'sources', 'The list of sources is missing.');
  if (!isObject(doc.model) || !['rule', 'assumptions', 'leftOut'].every((key) => isTextList((doc.model || {})[key]))) {
    report('schema', 'model', 'The model notes need three lists of text: rule, assumptions and leftOut.');
  }
  if (!Array.isArray(doc.levels) || doc.levels.length === 0) report('schema', 'levels', 'The content needs a list of levels.');
  if (errors.length > 0) return { ok: false, errors };

  checkLossCard(doc.lossCard, report);
  checkClasses(doc.classes, report);
  const sourceIds = checkSources(doc.sources, report);
  for (const id of Array.isArray(doc.lossCard.sourceIds) ? doc.lossCard.sourceIds : []) {
    if (!sourceIds.has(id)) report('unknown-source', 'lossCard', `The loss card cites source "${id}", which is not defined.`);
  }
  for (const [name, cls] of Object.entries(doc.classes)) {
    if (isObject(cls) && !sourceIds.has(cls.sourceId)) report('unknown-source', `class ${name}`, `Class ${name} cites source "${cls.sourceId}", which is not defined.`);
  }

  // The evaluator and the value tokens need a sound loss card and class table. Without them,
  // nothing below could be computed, so stop here and report what is wrong with the tables.
  const tablesAreSound = errors.length === 0;
  const global = tablesAreSound ? globalScope(doc) : null;
  const checkTokens = (text, scope, where, what) => {
    if (!scope || typeof text !== 'string') return;
    const unknown = unknownTokens(text, scope);
    if (unknown.length > 0) {
      report('unknown-token', where, `${what} uses ${unknown.join(', ')}, which cannot be filled there. See "Value tokens" in data-model.md.`);
    }
  };

  if (global) {
    for (const key of ['rule', 'assumptions', 'leftOut']) {
      doc.model[key].forEach((text, index) => checkTokens(text, global, 'model', `model.${key}[${index}]`));
    }
  }

  // --- Levels and rounds ----------------------------------------------------------------------

  const levelIds = new Set();
  const roundIds = new Set();
  doc.levels.forEach((level, levelIndex) => {
    const levelWhere = isObject(level) && isText(level.id) ? level.id : `level ${levelIndex + 1}`;
    if (!isObject(level)) {
      report('schema', levelWhere, 'A level must be an object.');
      return;
    }
    if (!isText(level.id)) report('schema', levelWhere, 'The level needs an id.');
    else if (levelIds.has(level.id)) report('duplicate-id', levelWhere, `Two levels share the id "${level.id}".`);
    else levelIds.add(level.id);
    for (const field of ['title', 'outcome', 'practiced']) {
      if (!isText(level[field])) report('schema', levelWhere, `The level needs a ${field}.`);
      else checkTokens(level[field], global, levelWhere, `The level's ${field}`);
    }
    checkBriefing(doc, level, levelWhere, sourceIds, global, tablesAreSound, report, checkTokens);

    if (!Array.isArray(level.rounds) || level.rounds.length !== 2) {
      report('bad-level', levelWhere, 'A level has exactly two rounds.');
    }
    for (const round of Array.isArray(level.rounds) ? level.rounds : []) {
      const before = errors.length;
      const where = `${levelWhere} / ${isObject(round) && isText(round.id) ? round.id : 'round without an id'}`;
      if (!isObject(round)) {
        report('schema', where, 'A round must be an object.');
        continue;
      }
      if (!isText(round.id)) report('schema', where, 'The round needs an id.');
      else if (roundIds.has(round.id)) report('duplicate-id', where, `Two rounds share the id "${round.id}".`);
      else roundIds.add(round.id);
      checkRoundShape(doc, round, where, report);
      // One mistake is reported once: the checks that need the evaluator run only on a round
      // whose shape, identities, references and numbers are sound.
      if (errors.length === before && tablesAreSound) checkRoundByEvaluation(doc, round, where, report, checkTokens);
    }
  });

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, content: doc };
}

function checkLossCard(card, report) {
  for (const field of ['fiberDbPerKm', 'connectorPairDb', 'spliceDb']) {
    const milli = toMilli(card[field]);
    if (milli === null || milli <= 0) report('bad-number', 'lossCard', `${field} must be a number greater than 0, exact to 0.001 dB.`);
  }
  if (!isObject(card.splitterDb) || Object.keys(card.splitterDb).length === 0) {
    report('schema', 'lossCard', 'splitterDb must map split ratios to losses.');
    return;
  }
  for (const [ratio, decibels] of Object.entries(card.splitterDb)) {
    if (!/^\d+$/.test(ratio) || Number(ratio) < 2) report('bad-number', 'lossCard', `"${ratio}" is not a split ratio. Use a whole number of 2 or more.`);
    const milli = toMilli(decibels);
    if (milli === null || milli <= 0) report('bad-number', 'lossCard', `The loss of the 1:${ratio} splitter must be a number greater than 0, exact to 0.001 dB.`);
  }
  if (!Array.isArray(card.sourceIds)) report('schema', 'lossCard', 'The loss card needs sourceIds.');
}

function checkClasses(classes, report) {
  for (const [name, cls] of Object.entries(classes)) {
    const where = `class ${name}`;
    if (!isObject(cls)) {
      report('schema', where, 'A class needs minDb, maxDb and sourceId.');
      continue;
    }
    const min = toMilli(cls.minDb);
    const max = toMilli(cls.maxDb);
    if (min === null || max === null || min < 0 || max <= min) {
      report('bad-number', where, 'minDb must be 0 or more and maxDb greater than minDb, both exact to 0.001 dB.');
    }
    if (!isText(cls.sourceId)) report('schema', where, 'A class cites the source of its limits in sourceId.');
  }
}

function checkSources(sources, report) {
  const ids = new Set();
  sources.forEach((source, index) => {
    const where = `sources / ${isObject(source) && isText(source.id) ? source.id : `entry ${index + 1}`}`;
    if (!isObject(source) || !['id', 'title', 'url', 'section', 'claim'].every((key) => isText(source[key]))) {
      report('schema', where, 'A source needs an id, a title, a url, a section and the claim it supports.');
      return;
    }
    if (!source.url.startsWith('https://')) report('schema', where, 'A source url starts with https://.');
    if (ids.has(source.id)) report('duplicate-id', where, `Two sources share the id "${source.id}".`);
    ids.add(source.id);
  });
  return ids;
}

/**
 * Check a plant and collect what it contains. Returns { ok, ontIds, open, installed }.
 * `open` lists splitters whose ratio the option chooses; `installed` maps the others to their ratio.
 */
function checkPlant(doc, plant, where, report) {
  const ontIds = new Set();
  const splitterIds = new Set();
  const open = [];
  let ok = true;
  const bad = (code, message) => { ok = false; report(code, where, message); };

  const walk = (segment, depth) => {
    if (depth > 8) return bad('schema', 'The plant is nested more deeply than a PON can be.');
    if (!isObject(segment)) return bad('schema', 'Each part of the plant is a segment with fiberKm, connectorPairs, splices and to.');
    const fiber = toMilli(segment.fiberKm);
    if (fiber === null || fiber < 0) bad('bad-number', 'fiberKm must be 0 or more, to the nearest metre.');
    if (!isCount(segment.connectorPairs)) bad('bad-number', 'connectorPairs must be a whole number, 0 or more.');
    if (!isCount(segment.splices)) bad('bad-number', 'splices must be a whole number, 0 or more.');
    const node = segment.to;
    if (!isObject(node) || !isText(node.id) || !isText(node.label)) return bad('schema', 'Each segment leads to a splitter or an ONT that has an id and a label.');
    if (node.type === 'ont') {
      if (ontIds.has(node.id)) bad('duplicate-id', `Two ONTs share the id "${node.id}".`);
      ontIds.add(node.id);
      if (own(node, 'note') && !isText(node.note)) bad('schema', `The note of ONT ${node.id} must be text.`);
      return undefined;
    }
    if (node.type !== 'splitter') return bad('schema', `"${node.type}" is not a kind of node. Use "splitter" or "ont".`);
    if (splitterIds.has(node.id)) bad('duplicate-id', `Two splitters share the id "${node.id}".`);
    splitterIds.add(node.id);
    if (node.ratio === null) open.push(node.id);
    else if (!own(doc.lossCard.splitterDb || {}, String(node.ratio))) bad('unknown-ratio', `The 1:${node.ratio} splitter "${node.id}" is not on the loss card.`);
    if (!Array.isArray(node.legs) || node.legs.length === 0) return bad('schema', `Splitter "${node.id}" needs at least one leg.`);
    for (const leg of node.legs) walk(leg, depth + 1);
    return undefined;
  };

  if (!isObject(plant) || !isText(plant.oltLabel)) bad('schema', 'The plant needs an oltLabel and a trunk.');
  if (isObject(plant)) walk(plant.trunk, 0);
  if (ok && ontIds.size === 0) bad('schema', 'The plant reaches no ONT.');
  return { ok, ontIds, open };
}

function checkAttenuators(attenuators, ontIds, where, report) {
  if (!Array.isArray(attenuators)) {
    report('schema', where, 'attenuators must be a list. Use an empty list when there are none.');
    return;
  }
  for (const attenuator of attenuators) {
    if (!isObject(attenuator)) {
      report('schema', where, 'An attenuator is written as { "at": place, "db": value }.');
      continue;
    }
    const milli = toMilli(attenuator.db);
    if (milli === null || milli <= 0) report('bad-number', where, 'An attenuator\'s db must be greater than 0, exact to 0.001 dB.');
    if (attenuator.at !== 'olt' && !ontIds.has(attenuator.at)) {
      report('attenuator-place', where, `An attenuator sits at "olt" or at an ONT of this round, not at "${attenuator.at}".`);
    }
  }
}

function checkRoundShape(doc, round, where, report) {
  for (const field of ['title', 'place', 'story', 'goal', 'explain']) {
    if (!isText(round[field])) report('schema', where, `The round needs a ${field}.`);
  }
  if (!isText(round.class) || !own(doc.classes, round.class)) {
    report('unknown-class', where, `The class "${round.class}" is not defined.`);
  }
  if (!Array.isArray(round.hints) || round.hints.length !== 2 || !round.hints.every(isText)) {
    report('bad-hints', where, 'A round has exactly two hints: the method, then a worked step.');
  }
  const plant = checkPlant(doc, round.plant, where, report);

  if (!Array.isArray(round.options) || round.options.length < 2) {
    report('schema', where, 'A round needs at least two options.');
    return;
  }
  const optionIds = new Set();
  for (const option of round.options) {
    const optionWhere = `${where} / option ${isObject(option) && isText(option.id) ? option.id : 'without an id'}`;
    if (!isObject(option) || !isText(option.id) || !isText(option.label)) {
      report('schema', optionWhere, 'An option needs an id and a label.');
      continue;
    }
    if (optionIds.has(option.id)) report('duplicate-id', optionWhere, `Two options share the id "${option.id}".`);
    optionIds.add(option.id);
    if (!Number.isInteger(option.served) || option.served < 1) report('bad-number', optionWhere, 'served must be a whole number of homes, 1 or more.');
    if (own(option, 'servedLabel') && !isText(option.servedLabel)) report('schema', optionWhere, 'servedLabel must be text.');
    if (own(option, 'note') && !isText(option.note)) report('schema', optionWhere, 'note must be text.');
    if (!isObject(option.splitters)) {
      report('schema', optionWhere, 'splitters must be an object. Use {} when the round has no open splitter.');
    } else if (plant.ok) {
      for (const id of plant.open) {
        if (!own(option.splitters, id)) report('open-splitter', optionWhere, `The option does not set the open splitter "${id}".`);
      }
      for (const [id, ratio] of Object.entries(option.splitters)) {
        if (!plant.open.includes(id)) report('open-splitter', optionWhere, `The option sets "${id}", which is not an open splitter of this round.`);
        else if (!own(doc.lossCard.splitterDb || {}, String(ratio))) report('unknown-ratio', optionWhere, `A 1:${ratio} splitter is not on the loss card.`);
      }
    }
    checkAttenuators(option.attenuators, plant.ontIds, optionWhere, report);
  }
}

function inexactTotal(result) {
  return result.onts.find((ont) => !Number.isInteger(ont.totalMilli) || ont.totalMilli % 100 !== 0) || null;
}

function checkRoundByEvaluation(doc, round, where, report, checkTokens) {
  for (const option of round.options) {
    const odd = inexactTotal(evaluateOption(doc, round, option));
    if (odd) {
      report('inexact-total', `${where} / option ${option.id}`,
        `The total for ${odd.label} is ${odd.totalMilli / 1000} dB, which is not exact to 0.1 dB. Rounding must never decide an answer; change a length or a count.`);
      return;
    }
  }

  const scope = roundScope(doc, round);
  for (const field of ['title', 'place', 'story', 'goal']) checkTokens(round[field], scope, where, `The round's ${field}`);
  round.hints.forEach((hint, index) => checkTokens(hint, scope, where, `Hint ${index + 1}`));
  for (const option of round.options) {
    const optionScopeHere = optionScope(doc, round, option);
    const optionWhere = `${where} / option ${option.id}`;
    checkTokens(option.label, optionScopeHere, optionWhere, 'The option\'s label');
    checkTokens(option.servedLabel, optionScopeHere, optionWhere, 'The option\'s servedLabel');
    checkTokens(option.note, optionScopeHere, optionWhere, 'The option\'s note');
  }

  const evaluation = evaluateRound(doc, round);
  if (evaluation.problem === 'no-valid-option') {
    report('no-valid-option', where, 'Every option leaves an ONT outside the window, so the round has no answer.');
    return;
  }
  if (evaluation.problem === 'tie-for-best') {
    report('tie-for-best', where, 'Two valid options serve the same largest number of homes, so the answer would be ambiguous.');
    return;
  }

  for (const option of round.options) {
    const optionWhere = `${where} / option ${option.id}`;
    const outcome = outcomeOf(evaluation, option.id);
    const hasNote = own(option, 'note');
    const hasExpect = own(option, 'expect');
    if (outcome !== 'best-valid' && !hasNote) {
      report('missing-note', optionWhere, 'An option that is not the answer needs a note that names the mistake behind it.');
    } else if (hasNote && !hasExpect) {
      report('note-mismatch', optionWhere, `The note has no "expect". The rule gives this option the outcome "${outcome}".`);
    } else if (hasExpect && (!OUTCOMES.includes(option.expect) || option.expect !== outcome)) {
      report('note-mismatch', optionWhere, `The note was written for "${option.expect}", but the rule gives this option "${outcome}".`);
    }
  }

  const answer = round.options.find((option) => option.id === evaluation.best.optionId);
  const answerScope = optionScope(doc, round, answer);
  const unknownInLabel = unknownTokens(answer.label, answerScope);
  if (unknownInLabel.length === 0) {
    checkTokens(round.explain, optionScope(doc, round, answer, fill(answer.label, answerScope)), where, 'The explanation');
  }
}

function checkBriefing(doc, level, where, sourceIds, global, tablesAreSound, report, checkTokens) {
  const briefing = level.briefing;
  if (!isObject(briefing)) {
    report('schema', where, 'The level needs a briefing.');
    return;
  }
  if (!isTextList(briefing.intro)) report('schema', where, 'The briefing needs an introduction: a list of paragraphs.');
  else briefing.intro.forEach((text, index) => checkTokens(text, global, where, `Paragraph ${index + 1} of the briefing`));

  if (!Array.isArray(briefing.terms) || !briefing.terms.every((t) => isObject(t) && isText(t.term) && isText(t.meaning))) {
    report('schema', where, 'The briefing\'s terms are a list of { term, meaning }.');
  } else {
    for (const entry of briefing.terms) checkTokens(entry.meaning, global, where, `The meaning of "${entry.term}"`);
  }

  if (!Array.isArray(briefing.sourceIds) || briefing.sourceIds.length === 0) {
    report('schema', where, 'The briefing cites at least one source.');
  } else {
    for (const id of briefing.sourceIds) {
      if (!sourceIds.has(id)) report('unknown-source', where, `The briefing cites source "${id}", which is not defined.`);
    }
  }

  const example = briefing.example;
  if (!isObject(example) || !isText(example.title) || !isText(example.result)) {
    report('schema', where, 'The briefing needs a worked example with a title, a class, a plant and a result.');
    return;
  }
  const before = { count: 0 };
  const exampleWhere = `${where} / worked example`;
  const collect = (code, place, message) => { before.count += 1; report(code, place, message); };
  if (!isText(example.class) || !own(doc.classes, example.class)) collect('unknown-class', exampleWhere, `The class "${example.class}" is not defined.`);
  const plant = checkPlant(doc, example.plant, exampleWhere, collect);
  checkAttenuators(example.attenuators, plant.ontIds, exampleWhere, collect);
  if (plant.ok && plant.open.length > 0) collect('bad-example', exampleWhere, 'A worked example has no open splitter: every element is given.');
  if (before.count > 0 || !tablesAreSound) return;

  const exampleRound = exampleAsRound(level);
  const exampleOption = exampleRound.options[0];
  const result = evaluateOption(doc, exampleRound, exampleOption);
  const odd = inexactTotal(result);
  if (odd) {
    report('inexact-total', exampleWhere, `The total for ${odd.label} is not exact to 0.1 dB.`);
    return;
  }
  if (!result.valid) {
    report('bad-example', exampleWhere, 'The worked example leaves an ONT outside its window. An example must show a design that works.');
    return;
  }
  const scope = optionScope(doc, exampleRound, exampleOption);
  checkTokens(example.title, scope, exampleWhere, 'The example\'s title');
  checkTokens(example.result, scope, exampleWhere, 'The example\'s result');
}
