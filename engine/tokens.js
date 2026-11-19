// Value tokens in authored text.
//
// Authored text never carries a hand-typed dB value. It carries tokens such as {max} or {total:A},
// which are filled here from the loss card, the classes and the evaluator at the moment the text is
// shown. If the data changes, every sentence follows it. See data-model.md, "Value tokens".
//
// This module does not decide an answer. It only formats what engine/rules.js computed.

import { cardMilli, windowOf, fixedLosses, evaluateOption, pathsOf, toMilli } from './rules.js';

const TOKEN = /\{([A-Za-z]+)(?::([^{}:]+))?\}/g;

/** "26.9" — a loss, always with one decimal place. */
export function fmtNumber(milli) {
  return (Math.round(milli / 100) / 10).toFixed(1);
}

/** "26.9 dB" */
export function fmtLoss(milli) {
  return `${fmtNumber(milli)} dB`;
}

/** "29" or "29.5" — a limit or a face value: whole numbers are written without a decimal. */
export function fmtPlain(milli) {
  const tenths = Math.round(milli / 100);
  return tenths % 10 === 0 ? String(tenths / 10) : (tenths / 10).toFixed(1);
}

/** "29 dB" */
export function fmtLimit(milli) {
  return `${fmtPlain(milli)} dB`;
}

/** "14.0 km" from thousandths of a km. */
export function fmtKm(milliKm) {
  return `${(milliKm / 1000).toFixed(1)} km`;
}

export function ratioText(ratio) {
  return `1:${ratio}`;
}

/** Every token of a text, in order: [{ raw, name, arg }]. */
export function tokensIn(text) {
  const out = [];
  if (typeof text !== 'string') return out;
  for (const match of text.matchAll(TOKEN)) out.push({ raw: match[0], name: match[1], arg: match[2] ?? null });
  return out;
}

/**
 * Tokens available everywhere: the loss card and the class limits.
 * A scope is a function (name, arg) → string, or undefined when it does not know the token.
 */
export function globalScope(content) {
  const card = cardMilli(content.lossCard);
  return (name, arg) => {
    if (arg === null) {
      if (name === 'fiber') return fmtLoss(card.fiberPerKm);
      if (name === 'connector') return fmtLoss(card.connectorPair);
      if (name === 'splice') return fmtLoss(card.splice);
      return undefined;
    }
    if (name === 'splitter') {
      return Object.prototype.hasOwnProperty.call(card.splitter, arg) ? fmtLoss(card.splitter[arg]) : undefined;
    }
    if (name === 'min' || name === 'max') {
      if (!Object.prototype.hasOwnProperty.call(content.classes, arg)) return undefined;
      const window = windowOf(content, arg);
      return fmtLimit(name === 'min' ? window.minMilli : window.maxMilli);
    }
    return undefined;
  };
}

function installedSplitters(plant) {
  const out = {};
  for (const path of pathsOf(plant)) for (const s of path.splitters) if (s.ratio !== null) out[s.id] = s.ratio;
  return out;
}

/** Tokens for a round's own text (story, goal, hints): its class, and each ONT's fixed losses. */
export function roundScope(content, round) {
  const base = globalScope(content);
  const window = windowOf(content, round.class);
  const fixed = fixedLosses(content, round);
  const installed = installedSplitters(round.plant);
  return (name, arg) => {
    if (arg === null) {
      if (name === 'class') return round.class;
      if (name === 'min') return fmtLimit(window.minMilli);
      if (name === 'max') return fmtLimit(window.maxMilli);
      if (name === 'window') return `${fmtPlain(window.minMilli)} to ${fmtLimit(window.maxMilli)}`;
      return base(name, arg);
    }
    if (name === 'ratio') {
      return Object.prototype.hasOwnProperty.call(installed, arg) ? ratioText(installed[arg]) : undefined;
    }
    const ont = Object.prototype.hasOwnProperty.call(fixed, arg) ? fixed[arg] : null;
    if (ont) {
      if (name === 'fixed') return fmtLoss(ont.fixedMilli);
      if (name === 'fiber') return fmtLoss(ont.fiberMilli);
      if (name === 'connectors') return fmtLoss(ont.connectorsMilli);
      if (name === 'splices') return fmtLoss(ont.splicesMilli);
      if (name === 'installed') return fmtLoss(ont.installedMilli);
      if (name === 'km') return fmtKm(ont.fiberMilliKm);
    }
    return base(name, arg);
  };
}

/**
 * Tokens for text that belongs to one design: an option's label and note, the explanation of the
 * answer (with `answerLabel`), and a worked example.
 */
export function optionScope(content, round, option, answerLabel = null) {
  const base = roundScope(content, round);
  const result = evaluateOption(content, round, option);
  const byId = Object.fromEntries(result.onts.map((ont) => [ont.id, ont]));
  const sum = (ont, pick) => ont.ledger.filter(pick).reduce((total, line) => total + line.lossMilli, 0);
  return (name, arg) => {
    if (arg === null) {
      if (name === 'answer' && answerLabel !== null) return answerLabel;
      return base(name, arg);
    }
    if (name === 'ratio' && option.splitters && Object.prototype.hasOwnProperty.call(option.splitters, arg)) {
      return ratioText(option.splitters[arg]);
    }
    if (name === 'att') {
      const attenuator = (option.attenuators || []).find((a) => a.at === arg);
      return attenuator ? fmtLimit(toMilli(attenuator.db)) : undefined;
    }
    const ont = Object.prototype.hasOwnProperty.call(byId, arg) ? byId[arg] : null;
    if (ont) {
      if (name === 'total') return fmtLoss(ont.totalMilli);
      if (name === 'margin') return fmtLoss(ont.marginMilli);
      if (name === 'chosen') return fmtLoss(sum(ont, (line) => line.chosen === true));
      if (name === 'small') return fmtLoss(sum(ont, (line) => line.kind === 'connectors' || line.kind === 'splices'));
      if (name === 'bigOnly') return fmtLoss(sum(ont, (line) => line.kind !== 'connectors' && line.kind !== 'splices'));
    }
    return base(name, arg);
  };
}

/** The tokens of a text that a scope cannot fill. */
export function unknownTokens(text, scope) {
  return tokensIn(text).filter((token) => scope(token.name, token.arg) === undefined).map((token) => token.raw);
}

/** Fill every token of a text. An unknown token is an error: validation should have caught it. */
export function fill(text, scope) {
  if (typeof text !== 'string') return text;
  return text.replace(TOKEN, (raw, name, arg) => {
    const value = scope(name, arg ?? null);
    if (value === undefined) throw new Error(`Unknown value token ${raw}`);
    return value;
  });
}
