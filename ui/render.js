// The views of the game. Each function builds page elements from what the engine describes.
// Nothing here decides an answer or changes the session: see engine/rules.js and engine/state.js.

import { h, s, replaceChildren } from './dom.js';
import { drawPlant, drawTrace, stateGlyph } from './diagram.js';
import {
  describeRound, describeResult, describeSolution, describeHints, describeBriefing, describeModel,
  describeTrace, describePlant, exampleAsRound,
} from '../engine/feedback.js';
import { summarize, currentLevel, currentRound } from '../engine/state.js';

// ---------------------------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------------------------

const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

/** A state in words, with its shape: a ring, a downward chevron or a sunburst. */
function stateBadge(state, word) {
  const icon = s('svg', { class: 'state-icon', viewBox: '0 0 16 16', width: 16, height: 16, 'aria-hidden': 'true', focusable: 'false' }, stateGlyph(state, 8, 8, 5.5));
  return h('span', { class: `state state-${state}` }, icon, word);
}

/**
 * A table that may be wider than a narrow window scrolls inside its own labeled region.
 * updateScrollRegions() makes the region a keyboard stop only while it really scrolls.
 */
function scrollRegion(label, table) {
  return h('div', { class: 'scroll', role: 'region', 'aria-label': label }, table);
}

export function updateScrollRegions(root = document) {
  for (const region of root.querySelectorAll('.scroll')) {
    if (region.scrollWidth > region.clientWidth + 1) region.setAttribute('tabindex', '0');
    else region.removeAttribute('tabindex');
  }
}

/** One ONT's ledger: every loss on its path and their total, then the sum that gives its receive level. */
function ledgerTable(ont, captionPrefix = '') {
  return h('div', { class: 'ledger-block' },
    scrollRegion(`Loss ledger for ${ont.label}`, h('table', { class: 'ledger' },
      h('caption', {}, `${captionPrefix}${ont.label}`),
      h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Element'), h('th', { scope: 'col' }, 'Detail'), h('th', { scope: 'col', class: 'num' }, 'Loss, dB'))),
      h('tbody', {}, ont.ledger.map((row) => h('tr', {}, h('th', { scope: 'row' }, row.label), h('td', {}, row.detail), h('td', { class: 'num' }, row.loss)))),
      h('tfoot', {}, h('tr', {}, h('th', { scope: 'row', colspan: '2' }, 'Total loss'), h('td', { class: 'num' }, ont.totalText.replace(' dB', '')))),
    )),
    h('p', { class: 'ledger-level', 'data-testid': `level-sum-${ont.id}` }, h('span', { class: 'ledger-level-name' }, 'Receive level'), h('span', { class: 'ledger-level-sum' }, ont.sumText)),
  );
}

/** A host element that draws an SVG at its own width. redrawAll() calls it after layout and on resize. */
function drawing(className, draw) {
  const host = h('div', { class: `drawing ${className}`, 'data-draw': '' });
  host.drawAt = draw;
  return host;
}

export function redrawAll(root = document) {
  for (const host of root.querySelectorAll('[data-draw]')) {
    const width = Math.floor(host.clientWidth);
    if (width > 0 && typeof host.drawAt === 'function') host.drawAt(host, width);
  }
  updateScrollRegions(root);
}

/** A source's title: a link when the source has one. A decision of the project has none. */
function sourceTitle(source) {
  return source.url
    ? h('a', { href: source.url, target: '_blank', rel: 'noopener noreferrer' }, source.title)
    : h('span', { class: 'source-title' }, source.title);
}

function sourcesLine(sources) {
  return h('p', { class: 'sources' }, 'Sources: ', sources.map((source, index) => [
    index > 0 ? '; ' : '',
    sourceTitle(source),
    `, ${source.section}`,
  ]), '.');
}

/**
 * The legend of the trace: the launch power, where every line starts, then one row for each ONT,
 * with its receive level and state once a design is lit.
 */
function meterRows(trace, pathRows) {
  const lit = new Map(trace.series.map((line, index) => [line.ontId, { line, index }]));
  const launch = h('li', { class: 'meter is-launch', 'data-testid': 'meter-launch' },
    s('svg', { class: 'meter-key', viewBox: '0 0 26 12', width: 26, height: 12, 'aria-hidden': 'true', focusable: 'false' },
      s('path', { class: 'launch-key', d: 'M2,2 H12 L22,10' })),
    h('span', { class: 'meter-name' }, 'Launch power'),
    h('span', { class: 'meter-total' }, trace.launchText));
  const shared = trace.hasShared
    ? h('li', { class: 'meter is-shared', 'data-testid': 'meter-shared' },
      s('svg', { class: 'meter-key', viewBox: '0 0 26 12', width: 26, height: 12, 'aria-hidden': 'true', focusable: 'false' },
        s('line', { class: 'trace-line is-shared', x1: 1, x2: 25, y1: 6, y2: 6 })),
      h('span', { class: 'meter-name' }, 'Path the ONTs share'))
    : null;
  return h('ul', { class: 'meters' }, launch, shared, pathRows.map((row, index) => {
    const hit = lit.get(row.ontId);
    const key = s('svg', { class: 'meter-key', viewBox: '0 0 26 12', width: 26, height: 12, 'aria-hidden': 'true', focusable: 'false' },
      s('line', { class: `trace-line series-${index % 8}`, x1: 1, x2: 16, y1: 6, y2: 6 }),
      s('circle', { class: `end-dot series-${index % 8}`, cx: 19, cy: 6, r: 4.5 }));
    if (!hit) {
      return h('li', { class: 'meter', 'data-testid': `meter-${row.ontId}`, 'data-state': 'none' },
        key, h('span', { class: 'meter-name' }, row.label), h('span', { class: 'meter-wait' }, 'not lit yet'));
    }
    const { line } = hit;
    return h('li', {
      class: 'meter', 'data-testid': `meter-${row.ontId}`, 'data-state': line.state,
      'data-level': (line.levelMilli / 1000).toFixed(1), 'data-total': line.totalText.replace(' dB', ''),
    }, key, h('span', { class: 'meter-name' }, row.label), h('span', { class: 'meter-total' }, line.levelText), stateBadge(line.state, line.stateWord));
  }));
}

function instrument(title, trace, pathRows, { animate, headingTag = 'h3' }) {
  return h('section', { class: 'instrument', 'aria-label': title },
    h(headingTag, { class: 'instrument-title' }, title),
    drawing('trace-host', (host, width) => drawTrace(host, trace, width, { animate: animate && !host.dataset.drawn })),
    meterRows(trace, pathRows),
  );
}

// ---------------------------------------------------------------------------------------------
// The header
// ---------------------------------------------------------------------------------------------

export function renderHeader(app) {
  const { content, state } = app;
  const rounds = content.levels.flatMap((level) => level.rounds);
  const current = state.view === 'summary' ? null : currentRound(state, content).id;
  const solved = rounds.filter((round) => state.rounds[round.id].solved).length;
  const position = state.view === 'summary' ? 'all work orders done' : `work order ${rounds.findIndex((r) => r.id === current) + 1} of ${rounds.length}`;
  const tube = h('ol', { class: 'tube', 'aria-label': `Progress: ${position}; ${solved} solved` }, rounds.map((round, index) => {
    const isSolved = state.rounds[round.id].solved;
    const isCurrent = round.id === current && state.view === 'round';
    const status = isSolved ? 'solved' : isCurrent ? 'in progress' : 'not solved yet';
    return h('li', { class: `fiber fiber-${index + 1}${isSolved ? ' is-solved' : ''}${isCurrent ? ' is-current' : ''}`, title: `${round.title}: ${status}` },
      h('span', { class: 'visually-hidden' }, `${round.title}: ${status}`));
  }));
  replaceChildren(document.getElementById('progress'), h('span', { class: 'tube-label', 'aria-hidden': 'true' }, `${solved} of ${rounds.length} solved`), tube);
  document.getElementById('open-briefing').disabled = state.view !== 'round';
}

// ---------------------------------------------------------------------------------------------
// The briefing
// ---------------------------------------------------------------------------------------------

function levelSummary(summaryLevel) {
  const t = summaryLevel.totals;
  return h('aside', { class: 'level-done', 'data-testid': 'level-summary', 'aria-label': 'Level complete' },
    h('p', { class: 'level-done-title' }, `Level complete: ${summaryLevel.title}`),
    h('dl', { class: 'figures' },
      h('div', {}, h('dt', {}, 'Work orders solved'), h('dd', { 'data-testid': 'level-solved' }, `${t.solved} of ${t.rounds}`)),
      h('div', {}, h('dt', {}, 'Attempts'), h('dd', { 'data-testid': 'level-attempts' }, String(t.attempts))),
      h('div', {}, h('dt', {}, 'Hints used'), h('dd', { 'data-testid': 'level-hints' }, String(t.hints))),
      h('div', {}, h('dt', {}, 'Worked solutions viewed'), h('dd', { 'data-testid': 'level-solutions' }, String(t.solutionsViewed))),
    ),
  );
}

/** The body of a briefing. Shared by the briefing view and the "Review briefing" dialog. */
function briefingBody(content, level, headingTag, headingId) {
  const briefing = describeBriefing(content, level);
  const exampleRound = exampleAsRound(level);
  const exampleView = describeRound(content, exampleRound);
  const trace = describeTrace(content, exampleRound, exampleRound.options[0]);
  const number = content.levels.indexOf(level) + 1;
  const subTag = headingTag === 'h1' ? 'h2' : 'h3';
  return [
    h('p', { class: 'level-count' }, `Level ${number} of ${content.levels.length}`),
    h(headingTag, { id: headingId, tabindex: '-1', class: 'view-title' }, briefing.title),
    h('p', { class: 'outcome' }, briefing.outcome),
    h('div', { class: 'briefing-columns' },
      h('div', { class: 'prose' }, briefing.intro.map((paragraph) => h('p', {}, paragraph))),
      h('figure', { class: 'example' },
        h('figcaption', { class: 'example-title' }, briefing.example.title),
        drawing('plant-host', (host, width) => drawPlant(host, exampleRound.plant, exampleRound.options[0], width, exampleView.launchText)),
        h('p', { class: 'visually-hidden' }, describePlant(content, exampleRound, exampleRound.options[0])),
        instrument('Loss trace', trace, exampleView.pathRows, { animate: false, headingTag: subTag }),
        h('div', { class: 'ledgers' }, briefing.example.onts.map((ont) => ledgerTable(ont))),
        h('p', { class: 'example-result' }, briefing.example.result),
      ),
      h('div', { class: 'terms-block' },
        h(subTag, { class: 'terms-title' }, 'Words used in this level'),
        h('dl', { class: 'terms' }, briefing.terms.map((entry) => h('div', {}, h('dt', {}, entry.term), h('dd', {}, entry.meaning)))),
      ),
    ),
    sourcesLine(briefing.sources),
  ];
}

function renderBriefing(app) {
  const { content, state } = app;
  const level = currentLevel(state, content);
  const number = state.levelIndex + 1;
  const finished = state.finishedLevelId ? summarize(state, content).levels.find((l) => l.id === state.finishedLevelId) : null;
  return h('article', { class: 'sheet briefing' },
    finished ? levelSummary(finished) : null,
    briefingBody(content, level, 'h1', 'view-title'),
    h('div', { class: 'actions start-bar' },
      h('button', { type: 'button', class: 'primary', 'data-action': 'start-level', 'data-testid': 'start-level' }, `Start level ${number}`)),
  );
}

// ---------------------------------------------------------------------------------------------
// The round
// ---------------------------------------------------------------------------------------------

function feedbackPanel(description) {
  if (!description || description.tone === 'guidance' || description.tone === 'error') return null;
  const correct = description.tone === 'correct';
  return h('section', { class: `feedback is-${description.tone}`, 'data-testid': 'feedback', 'data-outcome': description.outcome, 'data-option': description.optionId, 'aria-label': 'Result of your design' },
    h('p', { class: 'feedback-option' }, `Your design: ${description.optionLabel}. ${description.servedText}.`),
    h('h3', { class: 'feedback-headline', 'data-testid': 'feedback-headline' }, description.headline),
    h('ul', { class: 'feedback-lines' }, description.onts.map((ont) => h('li', { 'data-testid': `line-${ont.id}` }, stateBadge(ont.state, ont.stateWord), ' ', ont.line))),
    correct ? h('p', { class: 'feedback-explain', 'data-testid': 'feedback-explain' }, description.explain) : null,
    !correct && description.outcome === 'valid-not-best' ? h('p', { class: 'feedback-note' }, `${description.servedText}. At least one larger option also keeps every ONT inside the window.`) : null,
    !correct ? h('p', { class: 'feedback-note', 'data-testid': 'feedback-note' }, description.note) : null,
    !correct ? h('p', { class: 'feedback-next', 'data-testid': 'feedback-next' }, description.nextStep) : null,
    h('div', { class: 'ledgers' }, description.onts.map((ont) => ledgerTable(ont))),
    description.onts.map((ont) => h('p', { class: 'visually-hidden', 'data-testid': `ledger-text-${ont.id}` }, `${ont.label}: ${ont.ledgerText}`)),
  );
}

function helpPanel(content, round, record) {
  if (record.hints === 0 && !record.solutionViewed) return null;
  const hints = describeHints(content, round);
  const items = [];
  if (record.hints >= 1) items.push(h('div', { class: 'help-item', 'data-testid': 'hint-1' }, h('h3', {}, 'Hint 1: the method'), h('p', {}, hints[0])));
  if (record.hints >= 2) items.push(h('div', { class: 'help-item', 'data-testid': 'hint-2' }, h('h3', {}, 'Hint 2: a worked step'), h('p', {}, hints[1])));
  if (record.solutionViewed) {
    const solution = describeSolution(content, round);
    items.push(h('div', { class: 'help-item', 'data-testid': 'solution-text' },
      h('h3', {}, 'Worked solution'),
      h('p', {}, `The answer is: ${solution.answerLabel}. ${solution.servedText}.`),
      h('ul', {}, solution.onts.map((ont) => h('li', {}, `${ont.label}: ${ont.ledgerText}`))),
      h('p', {}, solution.explain),
      h('p', { class: 'help-reminder' }, 'Select that design and submit it to complete the work order. It will be recorded as solved with the worked solution.'),
    ));
  }
  return h('section', { class: 'help', 'data-testid': 'help', 'aria-label': 'Help' }, items);
}

function nextLabel(app) {
  const { content, state } = app;
  const level = currentLevel(state, content);
  if (state.roundIndex + 1 < level.rounds.length) return 'Next work order';
  if (state.levelIndex + 1 < content.levels.length) return 'Next level';
  return 'See summary';
}

/** The design selected right now in the current round, or null. Read at draw time, so the plant follows the selection. */
export function selectedOptionOf(app) {
  if (app.state.view !== 'round') return null;
  const round = currentRound(app.state, app.content);
  return round.options.find((o) => o.id === app.state.rounds[round.id].selected) || null;
}

/** Bring the plant drawing and its text equivalent up to date after a new selection. */
export function refreshPlant(app) {
  const figure = document.querySelector('.workorder .plant');
  if (!figure) return;
  redrawAll(figure);
  const round = currentRound(app.state, app.content);
  figure.querySelector('figcaption').textContent = describePlant(app.content, round, selectedOptionOf(app));
}

function renderRound(app) {
  const { content, state } = app;
  const level = currentLevel(state, content);
  const round = currentRound(state, content);
  const record = state.rounds[round.id];
  const view = describeRound(content, round);
  const model = describeModel(content);
  const shownOption = record.last ? round.options.find((o) => o.id === record.last.optionId) : null;
  const selectedOption = round.options.find((o) => o.id === record.selected) || null;
  const description = record.last ? describeResult(content, round, record.last) : null;
  const trace = describeTrace(content, round, shownOption);

  const workOrder = h('section', { class: 'sheet workorder', 'aria-labelledby': 'view-title' },
    h('p', { class: 'place' }, `${view.place}, level ${state.levelIndex + 1}: ${level.title}`),
    h('h1', { id: 'view-title', tabindex: '-1', class: 'view-title' }, view.title),
    h('p', { class: 'story' }, view.story),
    // Two short lines, and a level never breaks between its number and its unit.
    h('p', { class: 'window-line', 'data-testid': 'window' },
      h('span', { class: 'window-item' }, h('strong', {}, `${view.launchLabel}: `, h('span', { class: 'nowrap' }, view.launchText)), ' at the OLT port.'),
      ' ',
      h('span', { class: 'window-item' }, h('strong', {}, `${view.windowLabel}: `, h('span', { class: 'nowrap' }, view.windowText)), ' at each ONT, limits included.')),
    h('figure', { class: 'plant' },
      drawing('plant-host', (host, width) => drawPlant(host, round.plant, selectedOptionOf(app), width, view.launchText)),
      h('figcaption', { class: 'visually-hidden', 'data-testid': 'plant-text' }, describePlant(content, round, selectedOption)),
    ),
    h('h2', { class: 'table-title' }, 'Each ONT\'s path from the OLT port'),
    scrollRegion('Each ONT\'s path from the OLT port', h('table', { class: 'paths', 'data-testid': 'paths' },
      h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'ONT'), h('th', { scope: 'col', class: 'num' }, 'Fiber'), h('th', { scope: 'col', class: 'num' }, 'Connectors'), h('th', { scope: 'col', class: 'num' }, 'Splices'), h('th', { scope: 'col' }, 'Splitters'))),
      h('tbody', {}, view.pathRows.map((row) => h('tr', {},
        h('th', { scope: 'row' }, row.label, row.note ? h('span', { class: 'row-note' }, `, ${row.note}`) : null),
        h('td', { class: 'num' }, row.km), h('td', { class: 'num' }, String(row.connectors)), h('td', { class: 'num' }, String(row.splices)), h('td', {}, row.splitters)))),
    )),
    h('h2', { class: 'table-title' }, 'Loss card'),
    h('dl', { class: 'losscard', 'data-testid': 'losscard' },
      model.lossCard.map((row) => h('div', {}, h('dt', {}, row.label), h('dd', {}, row.value)))),
    h('p', { class: 'card-note' }, 'Attenuators add the value printed on them. These are the job\'s planning values; see Model and sources.'),
  );

  const options = h('fieldset', { class: 'options' },
    h('legend', {}, 'Design options'),
    // The option's name is its label. The homes it serves are its description, so a screen reader
    // says them after the name instead of running the two together.
    view.options.map((option) => h('label', { class: 'option', 'data-testid': `option-${option.id}` },
      h('input', {
        type: 'radio', name: 'design', value: option.id, checked: record.selected === option.id, disabled: record.solved,
        'aria-labelledby': `option-${option.id}-label`, 'aria-describedby': `option-${option.id}-served`,
      }),
      h('span', { class: 'option-text' },
        h('span', { class: 'option-label', id: `option-${option.id}-label` }, option.label),
        h('span', { class: 'option-served', id: `option-${option.id}-served` }, option.servedText)),
    )),
  );

  const helpIsOpen = !record.solved;
  const decide = h('section', { class: 'decide', 'aria-labelledby': 'goal' },
    h('h2', { id: 'goal', class: 'goal' }, view.goal),
    h('form', { class: 'design-form', 'data-testid': 'design-form', novalidate: true },
      options,
      h('p', { class: 'guidance', 'data-testid': 'guidance', hidden: !record.guidance }, record.guidance || ''),
      h('div', { class: 'actions' },
        h('button', { type: 'submit', class: 'primary', 'data-testid': 'submit', disabled: record.solved }, 'Submit design'),
        h('button', { type: 'button', class: record.solved ? 'primary' : '', 'data-action': 'next', 'data-testid': 'next', disabled: !record.solved }, nextLabel(app)),
      ),
      h('div', { class: 'actions help-actions' },
        h('button', { type: 'button', 'data-action': 'hint', 'data-testid': 'hint', disabled: !helpIsOpen || record.hints >= 2 }, record.hints === 0 ? 'Show hint 1' : 'Show hint 2'),
        h('button', { type: 'button', 'data-action': 'solution', 'data-testid': 'solution', disabled: !helpIsOpen || record.hints < 2 || record.solutionViewed }, 'Show worked solution'),
      ),
      h('p', { class: 'tally', 'data-testid': 'tally' },
        `Attempts: ${record.attempts}. Hints used: ${record.hints}. Worked solution: ${record.solutionViewed ? 'viewed' : 'not viewed'}.`),
    ),
    helpPanel(content, round, record),
    instrument('Loss trace', trace, view.pathRows, { animate: app.animateTrace }),
    feedbackPanel(description),
  );

  return h('div', { class: 'round' }, workOrder, decide);
}

// ---------------------------------------------------------------------------------------------
// The summary and the content error
// ---------------------------------------------------------------------------------------------

function renderSummary(app) {
  const { content, state } = app;
  const summary = summarize(state, content);
  const t = summary.totals;
  return h('article', { class: 'sheet summary' },
    h('p', { class: 'level-count' }, 'Session summary'),
    h('h1', { id: 'view-title', tabindex: '-1', class: 'view-title' }, `All ${NUMBER_WORDS[t.rounds] || t.rounds} work orders are built`),
    h('p', { class: 'outcome' }, 'Attempts, hints and worked solutions are counted separately. Solving a work order with help is still solving it; it is not the same as solving it alone.'),
    scrollRegion('Summary of each work order', h('table', { class: 'summary-table', 'data-testid': 'summary-table' },
      h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Work order'), h('th', { scope: 'col', class: 'num' }, 'Attempts'), h('th', { scope: 'col', class: 'num' }, 'Hints used'), h('th', { scope: 'col' }, 'Worked solution'), h('th', { scope: 'col' }, 'Solved'))),
      h('tbody', {}, summary.levels.flatMap((level) => level.rounds.map((round) => h('tr', { 'data-testid': `summary-${round.id}` },
        h('th', { scope: 'row' }, round.title), h('td', { class: 'num' }, String(round.attempts)), h('td', { class: 'num' }, String(round.hints)),
        h('td', {}, round.solutionViewed ? 'Viewed' : 'Not viewed'), h('td', {}, round.solved ? 'Yes' : 'No'))))),
      h('tfoot', {}, h('tr', {}, h('th', { scope: 'row' }, 'Total'), h('td', { class: 'num', 'data-testid': 'total-attempts' }, String(t.attempts)), h('td', { class: 'num', 'data-testid': 'total-hints' }, String(t.hints)),
        h('td', { 'data-testid': 'total-solutions' }, `${t.solutionsViewed} viewed`), h('td', { 'data-testid': 'total-solved' }, `${t.solved} of ${t.rounds}`))),
    )),
    h('dl', { class: 'figures' },
      h('div', {}, h('dt', {}, 'Solved without the worked solution'), h('dd', { 'data-testid': 'without-solution' }, `${t.solvedWithoutSolution} of ${t.rounds}`)),
      h('div', {}, h('dt', {}, 'Solved with no help at all'), h('dd', { 'data-testid': 'no-help' }, `${t.solvedWithNoHelp} of ${t.rounds}`)),
    ),
    h('h2', {}, 'What each level practiced'),
    h('ul', { class: 'practiced' }, content.levels.map((level) => h('li', {}, h('strong', {}, `${level.title}. `), describeBriefing(content, level).practiced))),
    h('p', { class: 'card-note' }, 'A real design also checks the light going the other way, allows for the spread of real transmitters and keeps margin for repairs. Model and sources lists what this game leaves out.'),
    h('div', { class: 'actions' }, h('button', { type: 'button', class: 'primary', 'data-action': 'request-restart', 'data-testid': 'play-again' }, 'Play again')),
  );
}

export function renderContentError(problems, title = 'The work orders could not be loaded') {
  return h('article', { class: 'sheet content-error', 'data-testid': 'content-error' },
    h('h1', { id: 'view-title', tabindex: '-1', class: 'view-title' }, title),
    h('p', {}, 'Nothing can be played or graded until the content file is correct. This is a fault in the game\'s content, not in anything you did.'),
    h('ul', { class: 'error-list' }, problems.map((problem) => h('li', {}, h('strong', {}, `${problem.where}: `), problem.message, ' ', h('code', {}, problem.code)))),
    h('div', { class: 'actions' }, h('button', { type: 'button', class: 'primary', 'data-action': 'retry-load', 'data-testid': 'retry-load' }, 'Try loading again')),
  );
}

// ---------------------------------------------------------------------------------------------
// Dialogs
// ---------------------------------------------------------------------------------------------

export function fillBriefingDialog(dialog, app) {
  const level = currentLevel(app.state, app.content);
  replaceChildren(dialog,
    h('div', { class: 'dialog-body briefing' }, briefingBody(app.content, level, 'h2', 'briefing-dialog-title')),
    h('div', { class: 'actions' }, h('button', { type: 'button', class: 'primary', 'data-close': '', 'data-testid': 'close-briefing' }, 'Back to the work order')),
  );
}

export function fillModelDialog(dialog, app) {
  const model = describeModel(app.content);
  const list = (items) => h('ul', {}, items.map((item) => h('li', {}, item)));
  replaceChildren(dialog,
    h('div', { class: 'dialog-body model' },
      h('h2', { id: 'model-dialog-title', tabindex: '-1' }, 'Model and sources'),
      h('h3', {}, 'The rule'), list(model.rule),
      h('h3', {}, 'Launch power and receive window'),
      h('table', { class: 'model-table' }, h('tbody', {}, model.optics.map((row) => h('tr', {}, h('th', { scope: 'row' }, row.label), h('td', { class: 'num' }, row.value))))),
      h('h3', {}, 'Loss card'),
      h('table', { class: 'model-table' }, h('tbody', {}, model.lossCard.map((row) => h('tr', {}, h('th', { scope: 'row' }, row.label), h('td', { class: 'num' }, row.value))))),
      h('h3', {}, 'What the game assumes'), list(model.assumptions),
      h('h3', {}, 'What the game leaves out'), list(model.leftOut),
      h('h3', {}, 'Sources'),
      h('ol', { class: 'source-list' }, model.sources.map((source) => h('li', {},
        sourceTitle(source), `. ${source.section}. `, h('span', { class: 'claim' }, source.claim)))),
    ),
    h('div', { class: 'actions' }, h('button', { type: 'button', class: 'primary', 'data-close': '', 'data-testid': 'close-model' }, 'Close')),
  );
}

// ---------------------------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------------------------

/** Render the current view into <main> and update the header. */
export function render(app) {
  const main = document.getElementById('main');
  const view = app.state.view;
  let body;
  if (view === 'briefing') body = renderBriefing(app);
  else if (view === 'round') body = renderRound(app);
  else body = renderSummary(app);
  main.dataset.view = view;
  if (view === 'round') main.dataset.round = currentRound(app.state, app.content).id;
  else delete main.dataset.round;
  replaceChildren(main, body);
  renderHeader(app);
  redrawAll(main);
  for (const host of main.querySelectorAll('[data-draw]')) host.dataset.drawn = 'true';
}

/** The text announced to assistive technology after a submission or an empty submission. */
export function announcementFor(app) {
  const { content, state } = app;
  if (state.view !== 'round') return '';
  const round = currentRound(state, content);
  const record = state.rounds[round.id];
  if (record.guidance) return record.guidance;
  if (!record.last) return '';
  const d = describeResult(content, round, record.last);
  const tail = d.tone === 'correct' ? d.explain : `${d.note} ${d.nextStep}`;
  return `Your design: ${d.optionLabel}. ${d.headline} ${d.onts.map((ont) => ont.line).join(' ')} ${tail}`;
}
