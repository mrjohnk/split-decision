// The words shown to the player. Each function turns something the evaluator computed into text and
// small tables for the page to display. Every number here comes from engine/rules.js; nothing in
// this file decides an answer, and nothing in it touches the page.

import { evaluate, evaluateOption, evaluateRound, pathsOf, windowOf, cardMilli, tracesOf, toMilli } from './rules.js';
import {
  fill, globalScope, roundScope, optionScope, fmtLoss, fmtNumber, fmtLimit, fmtPlain, fmtKm, ratioText,
} from './tokens.js';

export const GUIDANCE = {
  'no-selection': 'Choose a design first, then submit. Nothing was counted.',
  'unknown-option': 'That design is not one of this work order\'s options. Nothing was counted.',
  'content-error': 'This work order has a content error and cannot be graded. Nothing was counted.',
};

export const STATE_WORDS = { ok: 'Inside the window', over: 'Too dark', under: 'Too bright' };

const NEXT_STEPS = {
  'over-max': 'Next step: look for a design that puts less loss on that path.',
  'under-min': 'Next step: look for a design that adds loss to that path.',
  'over-and-under': 'Next step: look for a change that reaches only the ONT that needs it.',
  'valid-not-best': 'Next step: test a larger option against the ONT with the highest loss.',
};

/** A label written as a title, for use inside a sentence: "Remote OLT port" becomes "remote OLT port". */
function inSentence(label) {
  return /^[A-Z][a-z]/.test(label) ? label.charAt(0).toLowerCase() + label.slice(1) : label;
}

function listOf(names) {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function servedText(option) {
  if (option.servedLabel) return option.servedLabel;
  return `Serves ${option.served} ${option.served === 1 ? 'home' : 'homes'}`;
}

function windowText(window) {
  return `${fmtPlain(window.minMilli)} to ${fmtLimit(window.maxMilli)}`;
}

/** The rows of one ONT's ledger table, and the same ledger as one line of text. */
function describeLedger(ont, card) {
  const rows = ont.ledger.map((line) => {
    if (line.kind === 'fiber') {
      return { label: 'Fiber', detail: `${fmtKm(line.quantity)} × ${fmtLoss(card.fiberPerKm)}`, loss: fmtNumber(line.lossMilli), short: `fiber ${fmtNumber(line.lossMilli)}` };
    }
    if (line.kind === 'connectors') {
      return { label: 'Connector pairs', detail: `${line.quantity} × ${fmtLoss(card.connectorPair)}`, loss: fmtNumber(line.lossMilli), short: `connector pairs ${fmtNumber(line.lossMilli)}` };
    }
    if (line.kind === 'splices') {
      return { label: 'Splices', detail: `${line.quantity} × ${fmtLoss(card.splice)}`, loss: fmtNumber(line.lossMilli), short: `splices ${fmtNumber(line.lossMilli)}` };
    }
    if (line.kind === 'splitter') {
      return { label: 'Splitter', detail: `${ratioText(line.ratio)}, ${line.chosen ? 'chosen' : 'installed'}`, loss: fmtNumber(line.lossMilli), short: `splitter ${fmtNumber(line.lossMilli)}` };
    }
    return {
      label: 'Attenuator',
      detail: `${line.at === 'olt' ? 'at the OLT port' : 'at this ONT'}, chosen`,
      loss: fmtNumber(line.lossMilli),
      short: `attenuator ${fmtNumber(line.lossMilli)}`,
    };
  });
  const joined = rows.map((row) => row.short).join(' + ');
  const ledgerText = `${joined.charAt(0).toUpperCase()}${joined.slice(1)} = ${fmtLoss(ont.totalMilli)}`;
  return { rows: rows.map(({ short, ...row }) => row), ledgerText };
}

function describeOnt(ont, window, card) {
  const total = fmtLoss(ont.totalMilli);
  const margin = fmtLoss(ont.marginMilli);
  let line;
  if (ont.state === 'over') {
    line = `${ont.label}: ${total}. That is ${margin} over the ${window.className} maximum of ${fmtLimit(window.maxMilli)}.`;
  } else if (ont.state === 'under') {
    line = `${ont.label}: ${total}. That is ${margin} under the ${window.className} minimum of ${fmtLimit(window.minMilli)}.`;
  } else {
    line = `${ont.label}: ${total}. Inside the ${window.className} window of ${windowText(window)}, with ${margin} to spare before the maximum.`;
  }
  const { rows, ledgerText } = describeLedger(ont, card);
  return {
    id: ont.id,
    label: ont.label,
    state: ont.state,
    stateWord: STATE_WORDS[ont.state],
    totalMilli: ont.totalMilli,
    totalText: total,
    marginText: margin,
    line,
    ledger: rows,
    ledgerText,
  };
}

function optionLabel(content, round, option) {
  return fill(option.label, optionScope(content, round, option));
}

/** What the round view shows before any submission: the work order, its window, options and paths. */
export function describeRound(content, round) {
  const scope = roundScope(content, round);
  const window = windowOf(content, round.class);
  const pathRows = pathsOf(round.plant).map((path) => ({
    ontId: path.ontId,
    label: path.label,
    note: path.note,
    km: fmtKm(path.fiberMilliKm),
    connectorPairs: path.connectorPairs,
    splices: path.splices,
    splitters: path.splitters.map((s) => (s.ratio === null ? 'your choice' : `${ratioText(s.ratio)} installed`)).join(', then ') || 'none',
  }));
  return {
    id: round.id,
    title: fill(round.title, scope),
    place: fill(round.place, scope),
    story: fill(round.story, scope),
    goal: fill(round.goal, scope),
    className: round.class,
    windowText: windowText(window),
    window: { minMilli: window.minMilli, maxMilli: window.maxMilli, minText: fmtPlain(window.minMilli), maxText: fmtPlain(window.maxMilli) },
    options: round.options.map((option) => ({ id: option.id, label: optionLabel(content, round, option), servedText: servedText(option) })),
    pathRows,
  };
}

/** The two hints of a round, filled. */
export function describeHints(content, round) {
  const scope = roundScope(content, round);
  return round.hints.map((hint) => fill(hint, scope));
}

/**
 * The feedback for one submission. `result` is what evaluate() returned, with the option ID.
 * For an incorrect submission the text never names the answer.
 */
export function describeResult(content, round, result) {
  if (result.status === 'invalid-input' || result.status === 'content-error') {
    const code = result.status === 'content-error' ? 'content-error' : result.reasonCode;
    return { tone: result.status === 'content-error' ? 'error' : 'guidance', outcome: code, headline: GUIDANCE[code], onts: [] };
  }
  const card = cardMilli(content.lossCard);
  const option = round.options.find((o) => o.id === result.optionId);
  const scope = optionScope(content, round, option);
  const window = result.evidence.window;
  const onts = result.evidence.onts.map((ont) => describeOnt(ont, window, card));
  const dark = onts.filter((o) => o.state === 'over').map((o) => o.label);
  const bright = onts.filter((o) => o.state === 'under').map((o) => o.label);
  const outcome = result.reasonCode;

  let headline;
  if (outcome === 'best-valid') headline = onts.length === 1 ? `Correct. ${onts[0].label} is inside the window.` : 'Correct. Every ONT is inside the window.';
  else if (outcome === 'valid-not-best') headline = 'This design works, and a larger one also fits.';
  else if (outcome === 'over-max') headline = `Too dark at ${listOf(dark)}.`;
  else if (outcome === 'under-min') headline = `Too bright at ${listOf(bright)}.`;
  else headline = `Too bright at ${listOf(bright)} and too dark at ${listOf(dark)}.`;

  const correct = result.status === 'correct';
  let explain = null;
  if (correct) explain = fill(round.explain, optionScope(content, round, option, optionLabel(content, round, option)));

  return {
    tone: correct ? 'correct' : 'incorrect',
    outcome,
    optionId: option.id,
    optionLabel: optionLabel(content, round, option),
    headline,
    servedText: servedText(option),
    onts,
    note: !correct && option.note ? fill(option.note, scope) : null,
    nextStep: correct ? null : NEXT_STEPS[outcome],
    explain,
  };
}

/** The worked solution: the answer, its ledger for every ONT, and why it works. */
export function describeSolution(content, round) {
  const evaluation = evaluateRound(content, round);
  const option = round.options.find((o) => o.id === evaluation.best.optionId);
  const result = evaluate(content, round, option.id);
  const description = describeResult(content, round, { ...result, optionId: option.id });
  return {
    answerId: option.id,
    answerLabel: description.optionLabel,
    servedText: description.servedText,
    onts: description.onts,
    explain: description.explain,
  };
}

/** A level's briefing, filled, with its worked example computed by the evaluator. */
export function describeBriefing(content, level) {
  const scope = globalScope(content);
  const briefing = level.briefing;
  const exampleRound = exampleAsRound(level);
  const exampleOption = exampleRound.options[0];
  const exampleScope = optionScope(content, exampleRound, exampleOption);
  const window = windowOf(content, exampleRound.class);
  const card = cardMilli(content.lossCard);
  const evaluated = evaluateOption(content, exampleRound, exampleOption);
  return {
    id: level.id,
    title: fill(level.title, scope),
    outcome: fill(level.outcome, scope),
    practiced: fill(level.practiced, scope),
    intro: briefing.intro.map((paragraph) => fill(paragraph, scope)),
    terms: briefing.terms.map((entry) => ({ term: fill(entry.term, scope), meaning: fill(entry.meaning, scope) })),
    example: {
      title: fill(briefing.example.title, exampleScope),
      className: exampleRound.class,
      windowText: windowText(window),
      onts: evaluated.onts.map((ont) => describeOnt(ont, window, card)),
      result: fill(briefing.example.result, exampleScope),
    },
    sources: briefing.sourceIds.map((id) => content.sources.find((source) => source.id === id)),
  };
}

/** A briefing's worked example as a one-option round, so the evaluator can compute it. */
export function exampleAsRound(level) {
  const example = level.briefing.example;
  return {
    id: `${level.id}/example`,
    class: example.class,
    plant: example.plant,
    options: [{ id: 'example', label: 'Worked example', served: 1, splitters: {}, attenuators: example.attenuators || [] }],
  };
}

/** The model panel: the rule, the assumptions, what is left out, the loss card and the sources. */
export function describeModel(content) {
  const scope = globalScope(content);
  const card = cardMilli(content.lossCard);
  const lossCard = [
    { label: 'Fiber, per km', value: fmtLoss(card.fiberPerKm) },
    { label: 'Connector pair', value: fmtLoss(card.connectorPair) },
    { label: 'Fusion splice', value: fmtLoss(card.splice) },
    ...Object.keys(card.splitter)
      .map(Number)
      .sort((a, b) => a - b)
      .map((ratio) => ({ label: `${ratioText(ratio)} splitter`, value: fmtLoss(card.splitter[String(ratio)]) })),
  ];
  const classes = Object.keys(content.classes).map((name) => ({ name, text: windowText(windowOf(content, name)) }));
  return {
    rule: content.model.rule.map((text) => fill(text, scope)),
    assumptions: content.model.assumptions.map((text) => fill(text, scope)),
    leftOut: content.model.leftOut.map((text) => fill(text, scope)),
    lossCard,
    classes,
    sources: content.sources,
  };
}

/** One step of a loss trace in words, for a tooltip and for the table view. */
function describeStep(step, card) {
  const loss = fmtLoss(step.lossMilli);
  if (step.kind === 'fiber') return `Fiber, ${fmtKm(step.quantity)}: ${loss}`;
  if (step.kind === 'connectors') return `${step.quantity} connector ${step.quantity === 1 ? 'pair' : 'pairs'}: ${loss}`;
  if (step.kind === 'splices') return `${step.quantity} ${step.quantity === 1 ? 'splice' : 'splices'}: ${loss}`;
  if (step.kind === 'splitter') return `${ratioText(step.ratio)} splitter, ${step.chosen ? 'chosen' : 'installed'}: ${loss}`;
  return `Attenuator ${step.at === 'olt' ? 'at the OLT port' : 'at this ONT'}: ${loss}`;
}

/**
 * The loss trace of a design: for each ONT the losses in the order light meets them, with the
 * running total after each. `option` may be null: then only the scale and the window are returned.
 */
export function describeTrace(content, round, option) {
  const window = windowOf(content, round.class);
  const card = cardMilli(content.lossCard);
  const base = {
    className: round.class,
    minMilli: window.minMilli,
    maxMilli: window.maxMilli,
    minText: fmtLimit(window.minMilli),
    maxText: fmtLimit(window.maxMilli),
    windowText: windowText(window),
    series: [],
  };
  if (!option) return { ...base, hasShared: false, domainMaxMilli: Math.max(40000, Math.ceil((window.maxMilli + 2000) / 5000) * 5000) };

  const evaluated = evaluateOption(content, round, option);
  const traces = tracesOf(content, round, option);
  // A step that lies on the path of several ONTs is drawn once. Record who shares it.
  const users = new Map();
  for (const trace of traces) {
    for (const step of trace.steps) users.set(step.key, [...(users.get(step.key) || []), trace]);
  }
  const series = traces.map((trace) => {
    const ont = evaluated.onts.find((o) => o.id === trace.ontId);
    let running = 0;
    const steps = trace.steps.map((step) => {
      const fromMilli = running;
      running += step.lossMilli;
      const sharers = users.get(step.key);
      const who = traces.length === 1 ? '' : `${sharers.length === traces.length ? 'Every ONT' : listOf(sharers.map((t) => t.label))}: `;
      return {
        key: step.key,
        kind: step.kind,
        fromMilli,
        toMilli: running,
        sharedBy: sharers.map((t) => t.ontId),
        text: `${who}${describeStep(step, card)}. Total so far ${fmtLoss(running)}.`,
      };
    });
    return {
      ontId: trace.ontId,
      label: trace.label,
      state: ont.state,
      stateWord: STATE_WORDS[ont.state],
      totalMilli: ont.totalMilli,
      totalText: fmtLoss(ont.totalMilli),
      steps,
    };
  });
  const highest = Math.max(window.maxMilli, ...series.map((s) => s.totalMilli));
  return {
    ...base,
    series,
    hasShared: series.some((line) => line.steps.some((step) => step.sharedBy.length > 1)),
    domainMaxMilli: Math.max(40000, Math.ceil((highest + 2000) / 5000) * 5000),
  };
}

/** The plant in one sentence for each ONT, as the text equivalent of the diagram. */
export function describePlant(content, round, option = null) {
  const sentences = [];
  const partsOf = (segment) => {
    const bits = [];
    const milliKm = toMilli(segment.fiberKm);
    if (milliKm > 0) bits.push(`${fmtKm(milliKm)} of fiber`);
    if (segment.connectorPairs > 0) bits.push(`${segment.connectorPairs} connector ${segment.connectorPairs === 1 ? 'pair' : 'pairs'}`);
    if (segment.splices > 0) bits.push(`${segment.splices} ${segment.splices === 1 ? 'splice' : 'splices'}`);
    return bits.length ? listOf(bits) : 'a direct connection';
  };
  const walk = (segment, trail) => {
    const node = segment.to;
    const here = [...trail, partsOf(segment)];
    if (node.type === 'ont') {
      sentences.push(`${node.label}${node.note ? `, ${node.note}` : ''}: from the ${inSentence(round.plant.oltLabel)}, ${here.join(', then ')}.`);
      return;
    }
    let name;
    if (node.ratio !== null) name = `the installed ${ratioText(node.ratio)} splitter`;
    else if (option && option.splitters && option.splitters[node.id]) name = `the ${ratioText(option.splitters[node.id])} splitter you chose`;
    else name = 'the splitter you choose';
    for (const leg of node.legs) walk(leg, [...here.slice(0, -1), `${here[here.length - 1]} to ${name}`]);
  };
  walk(round.plant.trunk, []);
  return sentences.join(' ');
}
