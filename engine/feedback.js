// The words shown to the player. Each function turns something the evaluator computed into text and
// small tables for the page to display. Every number here comes from engine/rules.js; nothing in
// this file decides an answer, and nothing in it touches the page.

import { evaluate, evaluateOption, evaluateRound, pathsOf, windowOf, cardMilli, tracesOf, toMilli } from './rules.js';
import {
  fill, globalScope, roundScope, optionScope, fmtLoss, fmtNumber, fmtKm, ratioText, fmtLevel, fmtLevelLimit, fmtWindow,
} from './tokens.js';

export const GUIDANCE = {
  'no-selection': 'Choose a design first, then submit. Nothing was counted.',
  'unknown-option': 'That design is not one of this work order\'s options. Nothing was counted.',
  'content-error': 'This work order has a content error and cannot be graded. Nothing was counted.',
};

export const STATE_WORDS = { ok: 'Inside the window', dark: 'Too dark', bright: 'Too bright' };

const NEXT_STEPS = {
  'too-dark': 'Next step: look for a design that puts less loss on that path.',
  'too-bright': 'Next step: look for a design that adds loss to that path.',
  'dark-and-bright': 'Next step: look for a change that reaches only the ONT that needs it.',
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

/** "N1 " when the content has several classes to tell apart, and nothing when it has one. */
function classWord(window) {
  return window.named ? `${window.className} ` : '';
}

/** "+5 dBm − 30.7 dB = −25.7 dBm": how an ONT's receive level comes out of its loss. */
function levelSum(ont, window) {
  return `${fmtLevelLimit(window.launchMilli)} \u2212 ${fmtLoss(ont.totalMilli)} = ${fmtLevel(ont.levelMilli)}`;
}

/** The rows of one ONT's ledger table, and the same ledger as one line of text. */
function describeLedger(ont, card) {
  const rows = ont.ledger.map((line) => {
    if (line.kind === 'fiber') {
      return { label: 'Fiber', detail: `${fmtKm(line.quantity)} × ${fmtLoss(card.fiberPerKm)}`, loss: fmtNumber(line.lossMilli), short: `fiber ${fmtNumber(line.lossMilli)}` };
    }
    if (line.kind === 'connectors') {
      return { label: 'Connectors', detail: `${line.quantity} × ${fmtLoss(card.connector)}`, loss: fmtNumber(line.lossMilli), short: `connectors ${fmtNumber(line.lossMilli)}` };
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
  const lossText = `${joined.charAt(0).toUpperCase()}${joined.slice(1)} = ${fmtLoss(ont.totalMilli)}`;
  return { rows: rows.map(({ short, ...row }) => row), lossText };
}

/**
 * One ONT's result in words: what its path loses, what it receives, and where that level sits
 * against the window. The ledger text ends with the sum that turns the loss into the level.
 */
function describeOnt(ont, window, card) {
  const total = fmtLoss(ont.totalMilli);
  const level = fmtLevel(ont.levelMilli);
  const margin = fmtLoss(ont.marginMilli);
  const found = `${ont.label} loses ${total} and receives ${level}.`;
  let line;
  if (ont.state === 'dark') {
    line = `${found} That is ${margin} below the ${classWord(window)}dark limit of ${fmtLevelLimit(window.darkMilli)}.`;
  } else if (ont.state === 'bright') {
    line = `${found} That is ${margin} above the ${classWord(window)}bright limit of ${fmtLevelLimit(window.brightMilli)}.`;
  } else {
    line = `${found} Inside the ${classWord(window)}window of ${fmtWindow(window)}, with ${margin} to spare before the dark limit.`;
  }
  const { rows, lossText } = describeLedger(ont, card);
  const sumText = levelSum(ont, window);
  return {
    id: ont.id,
    label: ont.label,
    state: ont.state,
    stateWord: STATE_WORDS[ont.state],
    totalMilli: ont.totalMilli,
    totalText: total,
    levelMilli: ont.levelMilli,
    levelText: level,
    marginText: margin,
    line,
    ledger: rows,
    sumText,
    ledgerText: `${lossText}. ${sumText}`,
  };
}

function optionLabel(content, round, option) {
  return fill(option.label, optionScope(content, round, option));
}

/** What the round view shows before any submission: the work order, its optics, options and paths. */
export function describeRound(content, round) {
  const scope = roundScope(content, round);
  const window = windowOf(content, round.class);
  const pathRows = pathsOf(round.plant).map((path) => ({
    ontId: path.ontId,
    label: path.label,
    note: path.note,
    km: fmtKm(path.fiberMilliKm),
    connectors: path.connectors,
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
    launchLabel: window.named ? `${round.class} launch power` : 'Launch power',
    launchText: fmtLevelLimit(window.launchMilli),
    windowLabel: window.named ? `${round.class} receive window` : 'Receive window',
    windowText: fmtWindow(window),
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
  const dark = onts.filter((o) => o.state === 'dark').map((o) => o.label);
  const bright = onts.filter((o) => o.state === 'bright').map((o) => o.label);
  const outcome = result.reasonCode;

  let headline;
  if (outcome === 'best-valid') headline = onts.length === 1 ? `Correct. ${onts[0].label} is inside the window.` : 'Correct. Every ONT is inside the window.';
  else if (outcome === 'valid-not-best') headline = 'This design works, and a larger one also fits.';
  else if (outcome === 'too-dark') headline = `Too dark at ${listOf(dark)}.`;
  else if (outcome === 'too-bright') headline = `Too bright at ${listOf(bright)}.`;
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
      launchText: fmtLevelLimit(window.launchMilli),
      windowText: fmtWindow(window),
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

/** The model panel: the rule, the optics, the assumptions, what is left out, the loss card and the sources. */
export function describeModel(content) {
  const scope = globalScope(content);
  const card = cardMilli(content.lossCard);
  const lossCard = [
    { label: 'Fiber, per km', value: fmtLoss(card.fiberPerKm) },
    { label: 'Connector', value: fmtLoss(card.connector) },
    { label: 'Fusion splice', value: fmtLoss(card.splice) },
    ...Object.keys(card.splitter)
      .map(Number)
      .sort((a, b) => a - b)
      .map((ratio) => ({ label: `${ratioText(ratio)} splitter`, value: fmtLoss(card.splitter[String(ratio)]) })),
  ];
  // Two rows for each class: its launch power and its receive window. A single class has no name to show.
  const optics = Object.keys(content.classes).flatMap((name) => {
    const window = windowOf(content, name);
    const of = window.named ? `, class ${name}` : '';
    return [
      { label: `Launch power at the OLT port${of}`, value: fmtLevelLimit(window.launchMilli) },
      { label: `Receive window at each ONT${of}`, value: fmtWindow(window) },
    ];
  });
  return {
    rule: content.model.rule.map((text) => fill(text, scope)),
    assumptions: content.model.assumptions.map((text) => fill(text, scope)),
    leftOut: content.model.leftOut.map((text) => fill(text, scope)),
    lossCard,
    optics,
    sources: content.sources,
  };
}

/** One step of a loss trace in words, for a tooltip and for the table view. */
function describeStep(step, card) {
  const loss = fmtLoss(step.lossMilli);
  if (step.kind === 'fiber') return `Fiber, ${fmtKm(step.quantity)}: ${loss}`;
  if (step.kind === 'connectors') return `${step.quantity} ${step.quantity === 1 ? 'connector' : 'connectors'}: ${loss}`;
  if (step.kind === 'splices') return `${step.quantity} ${step.quantity === 1 ? 'splice' : 'splices'}: ${loss}`;
  if (step.kind === 'splitter') return `${ratioText(step.ratio)} splitter, ${step.chosen ? 'chosen' : 'installed'}: ${loss}`;
  return `Attenuator ${step.at === 'olt' ? 'at the OLT port' : 'at this ONT'}: ${loss}`;
}

/** The lowest level the trace's scale must show: at least 12 dB below the dark limit, in steps of 5. */
function bottomOf(window, levels) {
  const lowest = Math.min(window.darkMilli, ...levels);
  return Math.min(window.darkMilli - 12000, Math.floor((lowest - 2000) / 5000) * 5000);
}

/**
 * The loss trace of a design, on a scale of light level in dBm. Every ONT's line starts at the
 * launch power and falls by each loss in the order light meets it, down to the level the ONT
 * receives. `option` may be null: then only the scale and the window are returned.
 */
export function describeTrace(content, round, option) {
  const window = windowOf(content, round.class);
  const card = cardMilli(content.lossCard);
  const base = {
    className: round.class,
    windowName: window.named ? `${round.class} receive window` : 'Receive window',
    launchMilli: window.launchMilli,
    launchText: fmtLevelLimit(window.launchMilli),
    darkMilli: window.darkMilli,
    brightMilli: window.brightMilli,
    darkText: fmtLevelLimit(window.darkMilli),
    brightText: fmtLevelLimit(window.brightMilli),
    windowText: fmtWindow(window),
    topMilli: window.launchMilli,
    series: [],
  };
  if (!option) return { ...base, hasShared: false, bottomMilli: bottomOf(window, []) };

  const evaluated = evaluateOption(content, round, option);
  const traces = tracesOf(content, round, option);
  // A step that lies on the path of several ONTs is drawn once. Record who shares it.
  const users = new Map();
  for (const trace of traces) {
    for (const step of trace.steps) users.set(step.key, [...(users.get(step.key) || []), trace]);
  }
  const series = traces.map((trace) => {
    const ont = evaluated.onts.find((o) => o.id === trace.ontId);
    let level = window.launchMilli;
    const steps = trace.steps.map((step) => {
      const fromMilli = level;
      level -= step.lossMilli;
      const sharers = users.get(step.key);
      const who = traces.length === 1 ? '' : `${sharers.length === traces.length ? 'Every ONT' : listOf(sharers.map((t) => t.label))}: `;
      return {
        key: step.key,
        kind: step.kind,
        fromMilli,
        toMilli: level,
        sharedBy: sharers.map((t) => t.ontId),
        text: `${who}${describeStep(step, card)}. Level after it ${fmtLevel(level)}.`,
      };
    });
    return {
      ontId: trace.ontId,
      label: trace.label,
      state: ont.state,
      stateWord: STATE_WORDS[ont.state],
      totalMilli: ont.totalMilli,
      totalText: fmtLoss(ont.totalMilli),
      levelMilli: ont.levelMilli,
      levelText: fmtLevel(ont.levelMilli),
      steps,
    };
  });
  return {
    ...base,
    series,
    hasShared: series.some((line) => line.steps.some((step) => step.sharedBy.length > 1)),
    bottomMilli: bottomOf(window, series.map((line) => line.levelMilli)),
  };
}

/** The plant in one sentence for each ONT, as the text equivalent of the diagram. */
export function describePlant(content, round, option = null) {
  const sentences = [];
  const partsOf = (segment) => {
    const bits = [];
    const milliKm = toMilli(segment.fiberKm);
    if (milliKm > 0) bits.push(`${fmtKm(milliKm)} of fiber`);
    if (segment.connectors > 0) bits.push(`${segment.connectors} ${segment.connectors === 1 ? 'connector' : 'connectors'}`);
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
