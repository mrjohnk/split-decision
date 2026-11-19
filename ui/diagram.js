// The two drawings of the game, as inline SVG built from the round's data:
//   drawPlant  — the PON, from the OLT port to each ONT
//   drawTrace  — the loss trace: how each ONT's light falls on the way, against the class window
//
// Nothing here decides an answer. Every number drawn was computed by engine/rules.js and arrives
// through engine/feedback.js. Each drawing has a text equivalent on the page (the path table, the
// ledger and the feedback lines), so the SVG itself is hidden from assistive technology.

import { s, prefersReducedMotion } from './dom.js';

// ---------------------------------------------------------------------------------------------
// The plant
// ---------------------------------------------------------------------------------------------

const ROW = 74;

function layoutPlant(plant) {
  // Give every ONT a row, every splitter the middle of its legs, and every node a depth.
  const onts = [];
  let maxDepth = 1;
  const build = (segment, depth) => {
    const node = segment.to;
    maxDepth = Math.max(maxDepth, depth);
    if (node.type === 'ont') {
      const item = { kind: 'ont', node, segment, depth, row: onts.length, children: [] };
      onts.push(item);
      return item;
    }
    const children = node.legs.map((leg) => build(leg, depth + 1));
    const rows = children.map((child) => child.row);
    return { kind: 'splitter', node, segment, depth, row: (Math.min(...rows) + Math.max(...rows)) / 2, children };
  };
  const root = build(plant.trunk, 1);
  return { root, onts, maxDepth };
}

function kmText(km) {
  return `${Number(km).toFixed(1)} km`;
}

/** "2 connectors, 3 splices", or with `short` "2 conn., 3 splices" for a run with less room. */
function countsText(segment, short = false) {
  const parts = [];
  if (segment.connectors > 0) {
    const word = short ? 'conn.' : (segment.connectors === 1 ? 'connector' : 'connectors');
    parts.push(`${segment.connectors} ${word}`);
  }
  if (segment.splices > 0) parts.push(`${segment.splices} ${segment.splices === 1 ? 'splice' : 'splices'}`);
  return parts.join(', ');
}

/**
 * Draw the PON into `host`. `option` is the design currently selected, or null: its splitter
 * ratios and attenuators are drawn in the designer's orange.
 */
export function drawPlant(host, plant, option, width) {
  const { root, onts, maxDepth } = layoutPlant(plant);
  const narrow = width < 460;
  const padLeft = 8;
  const oltW = narrow ? 44 : 58;
  const ontW = 30;
  const padRight = narrow ? 8 : 12;
  const top = 34;
  const height = top + (onts.length - 1) * ROW + 62;
  const x0 = padLeft + oltW;
  const xEnd = width - padRight - ontW;
  const col = (xEnd - x0) / maxDepth;
  const xOf = (item) => (item.kind === 'ont' ? xEnd : x0 + item.depth * col);
  const yOf = (item) => top + item.row * ROW;
  const attenuators = (option && option.attenuators) || [];

  const svg = s('svg', { class: 'plant-svg', viewBox: `0 0 ${width} ${height}`, width, height, 'aria-hidden': 'true', focusable: 'false' });
  const lines = s('g', { class: 'plant-lines' });
  const marks = s('g', { class: 'plant-marks' });
  svg.append(lines, marks);

  // The OLT port.
  const oltY = yOf(root);
  marks.append(
    s('rect', { class: 'olt-box', x: padLeft, y: oltY - 17, width: oltW, height: 34, rx: 3 }),
    s('text', { class: 'olt-text', x: padLeft + oltW / 2, y: oltY + 5, 'text-anchor': 'middle' }, 'OLT'),
    s('text', { class: 'plant-note', x: padLeft, y: oltY + 34 }, plant.oltLabel),
  );

  const drawSegment = (fromX, fromY, item) => {
    const toX = xOf(item) - (item.kind === 'ont' ? 0 : 12);
    const toY = yOf(item);
    const elbowX = fromX + (fromY === toY ? 0 : 14);
    const d = fromY === toY ? `M${fromX},${fromY} H${toX}` : `M${fromX},${fromY} H${elbowX} V${toY} H${toX}`;
    lines.append(s('path', { class: 'fiber-line', d }));

    // The labels of a run sit in the middle of what is left of it once an attenuator has taken
    // its place at either end.
    const ontAttenuator = item.kind === 'ont' ? attenuators.find((a) => a.at === item.node.id) : null;
    const runStart = elbowX + (item === root && attenuators.some((a) => a.at === 'olt') ? 32 : 0);
    const runEnd = toX - (ontAttenuator ? 30 : 0);
    const run = runEnd - runStart;
    const mid = runStart + run / 2;
    const km = Number(item.segment.fiberKm);
    if (run > 40) {
      const noFiber = run > 84 ? 'at the splitter' : '0 km';
      marks.append(s('text', { class: 'seg-km', x: mid, y: toY - 8, 'text-anchor': 'middle' }, km > 0 ? kmText(km) : noFiber));
      // The counts are spelled out where the run has room, shortened where it has less, and left
      // to the path table where it has none.
      const counts = countsText(item.segment);
      const fits = counts.length * 5.9 + 10;
      const shown = run > fits ? counts : (run > 104 ? countsText(item.segment, true) : '');
      if (shown) marks.append(s('text', { class: 'seg-counts', x: mid, y: toY + 17, 'text-anchor': 'middle' }, shown));
    }

    if (item.kind === 'ont') {
      if (ontAttenuator) drawAttenuator(marks, toX - 26, toY, ontAttenuator.db);
      marks.append(
        s('rect', { class: 'ont-box', x: toX, y: toY - 15, width: ontW, height: 30, rx: 3 }),
        s('text', { class: 'ont-text', x: toX + ontW / 2, y: toY + 6, 'text-anchor': 'middle' }, item.node.id),
      );
      if (item.node.note) {
        marks.append(s('text', { class: 'plant-note', x: toX + ontW, y: toY + 31, 'text-anchor': 'end' }, item.node.note));
      }
      return;
    }

    // A splitter: narrow where the light enters, wide where it leaves.
    const sx = xOf(item);
    const open = item.node.ratio === null;
    const chosen = open && option && option.splitters ? option.splitters[item.node.id] : null;
    const ratio = open ? chosen : item.node.ratio;
    marks.append(
      s('polygon', {
        class: `splitter-shape${open ? ' is-open' : ''}${chosen ? ' is-chosen' : ''}`,
        points: `${sx - 12},${toY - 7} ${sx + 12},${toY - 17} ${sx + 12},${toY + 17} ${sx - 12},${toY + 7}`,
      }),
      s('text', { class: `splitter-ratio${open ? ' is-open' : ''}`, x: sx, y: toY - 24, 'text-anchor': 'middle' }, ratio ? `1:${ratio}` : '1:?'),
    );
    // Under a splitter with several legs a fiber runs down just to its right, so the note ends at
    // the splitter's edge instead of being centered on it.
    const branching = item.children.length > 1;
    if (!narrow || !branching) {
      marks.append(s('text', {
        class: `plant-note${open ? ' is-open' : ''}`, x: branching ? sx + 12 : sx, y: toY + 34, 'text-anchor': branching ? 'end' : 'middle',
      }, open ? 'your choice' : 'installed'));
    }
    for (const child of item.children) drawSegment(sx + 12, toY, child);
  };

  drawSegment(x0, oltY, root);

  const atOlt = attenuators.find((a) => a.at === 'olt');
  if (atOlt) drawAttenuator(marks, x0 + 8, oltY, atOlt.db);

  host.replaceChildren(svg);
}

function drawAttenuator(group, x, y, db) {
  group.append(
    s('rect', { class: 'att-box', x, y: y - 8, width: 18, height: 16, rx: 2 }),
    s('text', { class: 'att-text', x: x + 9, y: y - 13, 'text-anchor': 'middle' }, `${db} dB`),
  );
}

// ---------------------------------------------------------------------------------------------
// The loss trace
// ---------------------------------------------------------------------------------------------

const UNITS = { fiber: 4, connectors: 1, splices: 1, splitter: 2, attenuator: 2 };
const DRAW_MS = 900;

/** The shape that goes with a state: a ring, a downward chevron or a sunburst. */
export function stateGlyph(state, cx, cy, r = 5) {
  const g = s('g', { class: `glyph glyph-${state}` });
  if (state === 'ok') {
    g.append(s('circle', { cx, cy, r, fill: 'none' }));
  } else if (state === 'over') {
    g.append(s('path', { d: `M${cx - r},${cy - r * 0.6} L${cx},${cy + r * 0.7} L${cx + r},${cy - r * 0.6}`, fill: 'none' }));
  } else {
    g.append(s('circle', { cx, cy, r: r * 0.36, class: 'glyph-fill' }));
    for (let i = 0; i < 8; i += 1) {
      const a = (Math.PI / 4) * i;
      g.append(s('line', {
        x1: cx + Math.cos(a) * r * 0.62, y1: cy + Math.sin(a) * r * 0.62,
        x2: cx + Math.cos(a) * r * 1.05, y2: cy + Math.sin(a) * r * 1.05,
      }));
    }
  }
  return g;
}

/** Every straight piece of every trace, as [x1, y1, x2, y2]. */
function traceSegments(trace, left, unit, y) {
  const segments = [];
  for (const line of trace.series) {
    let x = left;
    for (const step of line.steps) {
      const w = UNITS[step.kind] * unit;
      const y0 = y(step.fromMilli);
      const y1 = y(step.toMilli);
      if (step.kind === 'fiber') segments.push([x, y0, x + w, y1]);
      else segments.push([x, y0, x, y1], [x, y1, x + w, y1]);
      x += w;
    }
  }
  return segments;
}

/** True when no trace comes within `gap` pixels of the box. Pieces are sampled along their length. */
function isClear(box, segments, gap = 4) {
  const x1 = box.x - gap;
  const y1 = box.y - gap;
  const x2 = box.x + box.w + gap;
  const y2 = box.y + box.h + gap;
  return segments.every(([ax, ay, bx, by]) => {
    for (let i = 0; i <= 16; i += 1) {
      const px = ax + ((bx - ax) * i) / 16;
      const py = ay + ((by - ay) * i) / 16;
      if (px >= x1 && px <= x2 && py >= y1 && py <= y2) return false;
    }
    return true;
  });
}

/**
 * Draw the loss trace into `host`. `trace` comes from describeTrace(): the scale, the window, and
 * for each ONT the steps of its path with running totals. With no series, only the scale and the
 * window are drawn. When `animate` is true and motion is allowed, each trace draws itself once.
 */
export function drawTrace(host, trace, width, { animate = false } = {}) {
  const narrow = width < 460;
  const left = narrow ? 34 : 44;
  const right = narrow ? 78 : 104;
  const top = 18;
  const bottom = 22;
  const plotH = narrow ? 176 : 200;
  const height = top + plotH + bottom;
  const plotW = Math.max(60, width - left - right);
  const y = (milli) => top + (milli / trace.domainMaxMilli) * plotH;
  const yMin = y(trace.minMilli);
  const yMax = y(trace.maxMilli);

  const svg = s('svg', { class: 'trace-svg', viewBox: `0 0 ${width} ${height}`, width, height, 'aria-hidden': 'true', focusable: 'false' });

  // Scale: a recessive hairline for each 10 dB. The two limits of the window are always labeled;
  // a 10 dB line is labeled only where its number would not touch one of them.
  const edges = [trace.minMilli, trace.maxMilli];
  const grid = s('g', { class: 'trace-grid' });
  for (let tick = 0; tick <= trace.domainMaxMilli; tick += 10000) {
    grid.append(s('line', { x1: left, x2: left + plotW, y1: y(tick), y2: y(tick) }));
    if (edges.every((edge) => Math.abs(edge - tick) >= 4000)) {
      grid.append(s('text', { class: 'tick', x: left - 8, y: y(tick) + 4, 'text-anchor': 'end' }, String(tick / 1000)));
    }
  }
  for (const edge of edges) {
    grid.append(s('text', { class: 'tick tick-edge', x: left - 8, y: y(edge) + 4, 'text-anchor': 'end' }, String(edge / 1000)));
  }
  grid.append(s('text', { class: 'tick axis-title', x: left - 8, y: top - 8, 'text-anchor': 'end' }, 'dB'));
  svg.append(grid);

  const longest = Math.max(1, ...trace.series.map((line) => line.steps.reduce((sum, step) => sum + UNITS[step.kind], 0)));
  const unit = plotW / longest;

  // Where the traces run, so that a label is never drawn on top of one.
  const segments = traceSegments(trace, left, unit, y);
  const labelBox = (text, x, baseline, anchor = 'start') => {
    const w = text.length * 6.4;
    return { text, x, baseline, anchor, box: { x: anchor === 'end' ? x - w : x, y: baseline - 11, w, h: 14 } };
  };
  const firstClear = (candidates) => candidates.find((candidate) => candidate && isClear(candidate.box, segments));

  // The window's name sits inside the band at the top left: the long name if no trace crosses it,
  // else the short one, else none. The limits are on the scale either way.
  const windowLabel = firstClear([
    labelBox(`${trace.windowName}, ${trace.windowText}`, left + 8, yMin + 16),
    labelBox(trace.windowName, left + 8, yMin + 16),
  ]);
  // "Too bright" sits at the top right, where light that only falls does not usually run. When a
  // trace does end up there, it moves to the left, just above the window.
  const brightLabel = firstClear([
    labelBox('Too bright', left + plotW - 8, top + 15, 'end'),
    yMin - top >= 28 ? labelBox('Too bright', left + 8, yMin - 7) : null,
  ]);
  const darkLabel = firstClear([labelBox('Too dark', left + 8, top + plotH - 8)]);
  const zoneText = (label, extra = '') => (label
    ? s('text', { class: `zone-name${extra}`, x: label.x, y: label.baseline, 'text-anchor': label.anchor }, label.text)
    : null);

  const zones = s('g', { class: 'trace-zones' });
  zones.append(
    s('rect', { class: 'window-band', x: left, y: yMin, width: plotW, height: yMax - yMin }),
    s('line', { class: 'window-edge', x1: left, x2: left + plotW, y1: yMin, y2: yMin }),
    s('line', { class: 'window-edge', x1: left, x2: left + plotW, y1: yMax, y2: yMax }),
    ...[zoneText(brightLabel), zoneText(windowLabel, ' zone-window'), zoneText(darkLabel)].filter(Boolean),
  );
  svg.append(zones);

  if (trace.series.length === 0) {
    svg.append(s('text', { class: 'trace-empty', x: left + plotW / 2, y: (yMin + yMax) / 2 + 22, 'text-anchor': 'middle' }, narrow ? 'Submit a design to see the light.' : 'Submit a design to see where each ONT lands.'));
    host.replaceChildren(svg);
    return;
  }

  const moving = animate && !prefersReducedMotion();
  const chains = [];
  const columns = new Map();
  const drawn = new Set();
  const ends = [];

  // A stretch of path that several ONTs share is drawn once, in the shared color. From the point
  // where an ONT's path is its own, the line takes that ONT's color.
  trace.series.forEach((line, index) => {
    let x = left;
    let chain = null;
    for (const step of line.steps) {
      const w = UNITS[step.kind] * unit;
      if (drawn.has(step.key)) {
        chain = null;
      } else {
        drawn.add(step.key);
        const group = step.sharedBy.join(' ');
        if (!chain || chain.group !== group) {
          chain = { group, className: step.sharedBy.length > 1 ? 'is-shared' : `series-${index % 8}`, d: `M${x},${y(step.fromMilli)}`, from: x, to: x, length: 0 };
          chains.push(chain);
        }
        const fall = y(step.toMilli) - y(step.fromMilli);
        if (step.kind === 'fiber') {
          chain.d += ` L${x + w},${y(step.toMilli)}`;
          chain.length += Math.hypot(w, fall);
        } else {
          chain.d += ` V${y(step.toMilli)} H${x + w}`;
          chain.length += fall + w;
        }
        chain.to = x + w;
        const column = `${Math.round(x)} ${Math.round(w)}`;
        if (!columns.has(column)) columns.set(column, { x, w, texts: [] });
        columns.get(column).texts.push(step.text);
      }
      x += w;
    }
    ends.push({ line, index, x, y: y(line.totalMilli) });
  });

  // Shared stretches go underneath, so an ONT's own color lies on top where lines meet.
  const lines = s('g', { class: 'trace-lines' });
  for (const chain of [...chains.filter((c) => c.className === 'is-shared'), ...chains.filter((c) => c.className !== 'is-shared')]) {
    const path = s('path', { class: `trace-line ${chain.className}`, d: chain.d });
    if (moving) {
      // The light travels left to right in DRAW_MS: each stretch starts when the light reaches it.
      const length = Math.ceil(chain.length) + 2;
      path.style.strokeDasharray = String(length);
      path.style.strokeDashoffset = String(length);
      path.style.animationDelay = `${Math.round(((chain.from - left) / plotW) * DRAW_MS)}ms`;
      path.style.animationDuration = `${Math.max(80, Math.round(((chain.to - chain.from) / plotW) * DRAW_MS))}ms`;
      path.classList.add('is-drawing');
    }
    lines.append(path);
  }
  svg.append(lines);

  // One hover target for each column of the trace, with what the light meets there.
  const tips = s('g', { class: 'trace-tips' });
  for (const column of columns.values()) {
    const tip = s('rect', { class: 'tip', x: column.x, y: top, width: column.w, height: plotH });
    tip.append(s('title', {}, column.texts.join('\n')));
    tips.append(tip);
  }

  // End markers, then their labels. Labels that would touch are moved apart and joined to their
  // marker by a leader line, so a label never sits on another one.
  const labels = [...ends].sort((a, b) => a.y - b.y).map((end) => ({ ...end, labelY: end.y }));
  for (let i = 1; i < labels.length; i += 1) {
    if (labels[i].labelY - labels[i - 1].labelY < 17) labels[i].labelY = labels[i - 1].labelY + 17;
  }
  const overflow = labels.length ? labels[labels.length - 1].labelY - (top + plotH + 6) : 0;
  if (overflow > 0) for (const label of labels) label.labelY -= overflow;

  const endGroup = s('g', { class: `trace-ends${moving ? ' is-waiting' : ''}` });
  for (const label of labels) {
    const { line, index, x: ex, y: ey, labelY } = label;
    const lx = left + plotW + 14;
    if (Math.abs(labelY - ey) > 2 || lx - ex > 22) {
      endGroup.append(s('path', { class: 'leader', d: `M${ex + 6},${ey} L${lx - 4},${labelY}` }));
    }
    endGroup.append(
      s('circle', { class: `end-dot series-${index % 8}`, cx: ex, cy: ey, r: 5 }),
      s('text', { class: 'end-label', x: lx, y: labelY + 4 }, `${line.ontId} ${line.totalText.replace(' dB', '')}`),
      stateGlyph(line.state, lx + (narrow ? 50 : 54), labelY, 5),
    );
  }
  svg.append(endGroup, tips);
  host.replaceChildren(svg);
}
