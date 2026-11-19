// The evaluator. Everything that decides an answer is in this file.
//
// It has no access to the page, the clock, the network or random numbers, and it never changes
// its inputs. All arithmetic is in whole thousandths of a dB ("milli"), so 9.5 + 2.0 + 0.4 + 17.5
// is exactly 29.4 and compares exactly with a limit of 29. See contracts/rules.md.

export const OUTCOMES = ['best-valid', 'valid-not-best', 'over-max', 'under-min', 'over-and-under'];

/**
 * Convert an authored decimal to whole thousandths. Returns null when the value is not a finite
 * number or is not exact at that resolution.
 */
export function toMilli(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const scaled = value * 1000;
  const rounded = Math.round(scaled);
  return Math.abs(scaled - rounded) < 1e-6 ? rounded : null;
}

/** The loss card in thousandths of a dB. */
export function cardMilli(lossCard) {
  const splitter = {};
  for (const [ratio, decibels] of Object.entries(lossCard.splitterDb)) splitter[ratio] = toMilli(decibels);
  return {
    fiberPerKm: toMilli(lossCard.fiberDbPerKm),
    connectorPair: toMilli(lossCard.connectorPairDb),
    splice: toMilli(lossCard.spliceDb),
    splitter,
  };
}

/** The loss window of a class, in thousandths of a dB. */
export function windowOf(content, className) {
  const cls = content.classes[className];
  return { className, minMilli: toMilli(cls.minDb), maxMilli: toMilli(cls.maxDb) };
}

/**
 * Walk the plant from the OLT port and return one path for each ONT, in drawing order.
 * A path sums the fiber, connector pairs and splices on the way and lists the splitters it crosses.
 */
export function pathsOf(plant) {
  const paths = [];
  const walk = (segment, sofar) => {
    const here = {
      fiberMilliKm: sofar.fiberMilliKm + toMilli(segment.fiberKm),
      connectorPairs: sofar.connectorPairs + segment.connectorPairs,
      splices: sofar.splices + segment.splices,
      splitters: sofar.splitters,
    };
    const node = segment.to;
    if (node.type === 'ont') {
      paths.push({ ontId: node.id, label: node.label, note: node.note || null, ...here });
      return;
    }
    const splitters = [...here.splitters, { id: node.id, label: node.label, ratio: node.ratio }];
    for (const leg of node.legs) walk(leg, { ...here, splitters });
  };
  walk(plant.trunk, { fiberMilliKm: 0, connectorPairs: 0, splices: 0, splitters: [] });
  return paths;
}

function ratioText(ratio) {
  return `1:${ratio}`;
}

/**
 * The ledger of one path for one option: a line for the fiber, the connector pairs and the splices,
 * one for each splitter and one for each attenuator on the path.
 */
function ledgerOf(card, path, option) {
  const lines = [];
  const fiberLoss = (path.fiberMilliKm * card.fiberPerKm) / 1000;
  if (path.fiberMilliKm > 0) {
    lines.push({ kind: 'fiber', label: 'Fiber', quantity: path.fiberMilliKm, unitMilli: card.fiberPerKm, lossMilli: fiberLoss });
  }
  if (path.connectorPairs > 0) {
    lines.push({ kind: 'connectors', label: 'Connector pairs', quantity: path.connectorPairs, unitMilli: card.connectorPair, lossMilli: path.connectorPairs * card.connectorPair });
  }
  if (path.splices > 0) {
    lines.push({ kind: 'splices', label: 'Splices', quantity: path.splices, unitMilli: card.splice, lossMilli: path.splices * card.splice });
  }
  for (const splitter of path.splitters) {
    const chosen = splitter.ratio === null;
    const ratio = chosen ? option.splitters[splitter.id] : splitter.ratio;
    lines.push({
      kind: 'splitter', label: `${ratioText(ratio)} splitter`, splitterId: splitter.id, ratio, chosen,
      lossMilli: card.splitter[String(ratio)],
    });
  }
  for (const attenuator of option.attenuators || []) {
    if (attenuator.at === 'olt' || attenuator.at === path.ontId) {
      lines.push({
        kind: 'attenuator', label: 'Attenuator', at: attenuator.at, chosen: true,
        lossMilli: toMilli(attenuator.db),
      });
    }
  }
  const totalMilli = lines.reduce((sum, line) => sum + line.lossMilli, 0);
  return { lines, totalMilli };
}

function stateOf(totalMilli, window) {
  if (totalMilli < window.minMilli) return 'under';
  if (totalMilli > window.maxMilli) return 'over';
  return 'ok';
}

function marginOf(totalMilli, state, window) {
  if (state === 'over') return totalMilli - window.maxMilli;
  if (state === 'under') return window.minMilli - totalMilli;
  return window.maxMilli - totalMilli;
}

/**
 * The loss of the fixed elements of each ONT's path: fiber, connector pairs, splices and installed
 * splitters. Splitters left open for the option, and attenuators, are not counted.
 */
export function fixedLosses(content, round) {
  const card = cardMilli(content.lossCard);
  const out = {};
  for (const path of pathsOf(round.plant)) {
    const fiberMilli = (path.fiberMilliKm * card.fiberPerKm) / 1000;
    const connectorsMilli = path.connectorPairs * card.connectorPair;
    const splicesMilli = path.splices * card.splice;
    const installedMilli = path.splitters
      .filter((s) => s.ratio !== null)
      .reduce((sum, s) => sum + card.splitter[String(s.ratio)], 0);
    out[path.ontId] = {
      fiberMilliKm: path.fiberMilliKm,
      connectorPairs: path.connectorPairs,
      splices: path.splices,
      fiberMilli,
      connectorsMilli,
      splicesMilli,
      installedMilli,
      fixedMilli: fiberMilli + connectorsMilli + splicesMilli + installedMilli,
    };
  }
  return out;
}

/** Evaluate one option: every ONT's ledger, total and state, and whether the option is valid. */
export function evaluateOption(content, round, option) {
  const card = cardMilli(content.lossCard);
  const window = windowOf(content, round.class);
  const onts = pathsOf(round.plant).map((path) => {
    const { lines, totalMilli } = ledgerOf(card, path, option);
    const state = stateOf(totalMilli, window);
    return {
      id: path.ontId,
      label: path.label,
      totalMilli,
      state,
      marginMilli: marginOf(totalMilli, state, window),
      ledger: lines,
    };
  });
  return {
    optionId: option.id,
    served: option.served,
    valid: onts.every((ont) => ont.state === 'ok'),
    onts,
  };
}

/**
 * Evaluate every option of a round and find the answer: the valid option that serves the most
 * homes. A round with no valid option, or with a tie for the most homes, has a problem and no answer.
 */
export function evaluateRound(content, round) {
  const window = windowOf(content, round.class);
  const options = round.options.map((option) => evaluateOption(content, round, option));
  const valid = options.filter((o) => o.valid).sort((a, b) => b.served - a.served);
  let best = null;
  let problem = null;
  if (valid.length === 0) problem = 'no-valid-option';
  else if (valid.length > 1 && valid[0].served === valid[1].served) problem = 'tie-for-best';
  else best = { optionId: valid[0].optionId, served: valid[0].served };
  return { window, options, best, problem };
}

/** The outcome of one option against the round's answer. Null when the round has a problem. */
export function outcomeOf(roundEvaluation, optionId) {
  const result = roundEvaluation.options.find((o) => o.optionId === optionId);
  if (!result || roundEvaluation.problem) return null;
  if (result.valid) return roundEvaluation.best.optionId === optionId ? 'best-valid' : 'valid-not-best';
  const over = result.onts.some((ont) => ont.state === 'over');
  const under = result.onts.some((ont) => ont.state === 'under');
  if (over && under) return 'over-and-under';
  return over ? 'over-max' : 'under-min';
}

/**
 * Judge one answer. `answer` is an option ID, or null when nothing is selected.
 * Returns { status, reasonCode, expected, evidence }.
 */
export function evaluate(content, round, answer) {
  const roundEvaluation = evaluateRound(content, round);
  if (roundEvaluation.problem) {
    return { status: 'content-error', reasonCode: roundEvaluation.problem, expected: null, evidence: null };
  }
  if (answer === null || answer === undefined || answer === '') {
    return { status: 'invalid-input', reasonCode: 'no-selection', expected: null, evidence: null };
  }
  const result = roundEvaluation.options.find((o) => o.optionId === answer);
  if (!result) {
    return { status: 'invalid-input', reasonCode: 'unknown-option', expected: null, evidence: null };
  }
  const outcome = outcomeOf(roundEvaluation, answer);
  return {
    status: outcome === 'best-valid' ? 'correct' : 'incorrect',
    reasonCode: outcome,
    expected: { optionId: roundEvaluation.best.optionId },
    evidence: {
      optionId: result.optionId,
      window: roundEvaluation.window,
      served: result.served,
      valid: result.valid,
      onts: result.onts,
      largerValidExists: outcome === 'valid-not-best',
    },
  };
}
