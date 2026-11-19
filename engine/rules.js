// The evaluator. Everything that decides an answer is in this file.
//
// It has no access to the page, the clock, the network or random numbers, and it never changes
// its inputs. All arithmetic is in whole thousandths ("milli") of a dB for a loss and of a dBm for
// a level, so 9.0 + 3.5 + 0.7 + 21.0 is exactly 34.2, and +5 less 34.2 is exactly -29.2 and
// compares exactly with a limit of -28. See contracts/rules.md.
//
// The rule: an ONT's receive level is the launch power at the OLT port less its path loss, and
// the ONT is inside the window when that level is between the dark limit and the bright limit,
// both included. States and outcomes are named for what the player sees (dark, bright), not for a
// side of a limit: with negative levels the ONT that is too dark is under its limit.

export const OUTCOMES = ['best-valid', 'valid-not-best', 'too-dark', 'too-bright', 'dark-and-bright'];

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
    connector: toMilli(lossCard.connectorDb),
    splice: toMilli(lossCard.spliceDb),
    splitter,
  };
}

/**
 * The optics of a class, in thousandths of a dBm: the launch power at the OLT port and the two
 * limits of the level an ONT may receive. `named` says whether the class name is worth showing to
 * the player: with one class in the content there is nothing to tell apart, so the words say "the
 * window" and "the dark limit" without a name.
 */
export function windowOf(content, className) {
  const cls = content.classes[className];
  return {
    className,
    named: Object.keys(content.classes).length > 1,
    launchMilli: toMilli(cls.launchDbm),
    darkMilli: toMilli(cls.darkDbm),
    brightMilli: toMilli(cls.brightDbm),
  };
}

/**
 * Walk the plant from the OLT port and return one path for each ONT, in drawing order.
 * A path sums the fiber, connectors and splices on the way and lists the splitters it crosses.
 */
export function pathsOf(plant) {
  const paths = [];
  const walk = (segment, sofar) => {
    const here = {
      fiberMilliKm: sofar.fiberMilliKm + toMilli(segment.fiberKm),
      connectors: sofar.connectors + segment.connectors,
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
  walk(plant.trunk, { fiberMilliKm: 0, connectors: 0, splices: 0, splitters: [] });
  return paths;
}

function ratioText(ratio) {
  return `1:${ratio}`;
}

/**
 * The ledger of one path for one option: a line for the fiber, the connectors and the splices,
 * one for each splitter and one for each attenuator on the path.
 */
function ledgerOf(card, path, option) {
  const lines = [];
  const fiberLoss = (path.fiberMilliKm * card.fiberPerKm) / 1000;
  if (path.fiberMilliKm > 0) {
    lines.push({ kind: 'fiber', label: 'Fiber', quantity: path.fiberMilliKm, unitMilli: card.fiberPerKm, lossMilli: fiberLoss });
  }
  if (path.connectors > 0) {
    lines.push({ kind: 'connectors', label: 'Connectors', quantity: path.connectors, unitMilli: card.connector, lossMilli: path.connectors * card.connector });
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

/** The level an ONT receives: the launch power less everything its path loses (FR-029). */
function levelOf(totalMilli, window) {
  return window.launchMilli - totalMilli;
}

function stateOf(levelMilli, window) {
  if (levelMilli < window.darkMilli) return 'dark';
  if (levelMilli > window.brightMilli) return 'bright';
  return 'ok';
}

/** The distance to the limit that was missed; for an ONT inside the window, its room above the dark limit. */
function marginOf(levelMilli, state, window) {
  if (state === 'dark') return window.darkMilli - levelMilli;
  if (state === 'bright') return levelMilli - window.brightMilli;
  return levelMilli - window.darkMilli;
}

/**
 * The loss of the fixed elements of each ONT's path: fiber, connectors, splices and installed
 * splitters. Splitters left open for the option, and attenuators, are not counted.
 */
export function fixedLosses(content, round) {
  const card = cardMilli(content.lossCard);
  const out = {};
  for (const path of pathsOf(round.plant)) {
    const fiberMilli = (path.fiberMilliKm * card.fiberPerKm) / 1000;
    const connectorsMilli = path.connectors * card.connector;
    const splicesMilli = path.splices * card.splice;
    const installedMilli = path.splitters
      .filter((s) => s.ratio !== null)
      .reduce((sum, s) => sum + card.splitter[String(s.ratio)], 0);
    out[path.ontId] = {
      fiberMilliKm: path.fiberMilliKm,
      connectors: path.connectors,
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

/**
 * The same losses as the ledger, in the order light meets them on the way from the OLT port to
 * each ONT. Used to draw the loss trace, which starts at the launch power and falls by each step.
 * For every ONT the steps add up to the ledger's total.
 */
export function tracesOf(content, round, option) {
  const card = cardMilli(content.lossCard);
  const attenuators = option.attenuators || [];
  const traces = [];
  const walk = (segment, steps, place) => {
    const here = [...steps];
    const fiberMilliKm = toMilli(segment.fiberKm);
    if (fiberMilliKm > 0) {
      here.push({ key: `${place}/fiber`, kind: 'fiber', quantity: fiberMilliKm, lossMilli: (fiberMilliKm * card.fiberPerKm) / 1000 });
    }
    if (segment.connectors > 0) {
      here.push({ key: `${place}/connectors`, kind: 'connectors', quantity: segment.connectors, lossMilli: segment.connectors * card.connector });
    }
    if (segment.splices > 0) {
      here.push({ key: `${place}/splices`, kind: 'splices', quantity: segment.splices, lossMilli: segment.splices * card.splice });
    }
    const node = segment.to;
    if (node.type === 'ont') {
      for (const attenuator of attenuators) {
        if (attenuator.at === node.id) here.push({ key: `${place}/attenuator`, kind: 'attenuator', at: node.id, chosen: true, lossMilli: toMilli(attenuator.db) });
      }
      traces.push({ ontId: node.id, label: node.label, steps: here, totalMilli: here.reduce((sum, step) => sum + step.lossMilli, 0) });
      return;
    }
    const chosen = node.ratio === null;
    const ratio = chosen ? option.splitters[node.id] : node.ratio;
    here.push({ key: `${place}/${node.id}`, kind: 'splitter', splitterId: node.id, ratio, chosen, lossMilli: card.splitter[String(ratio)] });
    node.legs.forEach((leg, index) => walk(leg, here, `${place}/${node.id}.${index}`));
  };
  const start = attenuators
    .filter((attenuator) => attenuator.at === 'olt')
    .map((attenuator, index) => ({ key: `olt/attenuator.${index}`, kind: 'attenuator', at: 'olt', chosen: true, lossMilli: toMilli(attenuator.db) }));
  walk(round.plant.trunk, start, 'trunk');
  return traces;
}

/** Evaluate one option: every ONT's ledger, loss, receive level and state, and whether the option is valid. */
export function evaluateOption(content, round, option) {
  const card = cardMilli(content.lossCard);
  const window = windowOf(content, round.class);
  const onts = pathsOf(round.plant).map((path) => {
    const { lines, totalMilli } = ledgerOf(card, path, option);
    const levelMilli = levelOf(totalMilli, window);
    const state = stateOf(levelMilli, window);
    return {
      id: path.ontId,
      label: path.label,
      totalMilli,
      levelMilli,
      state,
      marginMilli: marginOf(levelMilli, state, window),
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
  const dark = result.onts.some((ont) => ont.state === 'dark');
  const bright = result.onts.some((ont) => ont.state === 'bright');
  if (dark && bright) return 'dark-and-bright';
  return dark ? 'too-dark' : 'too-bright';
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
