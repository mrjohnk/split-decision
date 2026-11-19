// The session. It is changed only by reduce(state, action, content), which returns a new state and
// never touches the page. Attempts, assistance and completion are decided here and nowhere else.
// See contracts/session.md.

import { evaluate } from './rules.js';
import { GUIDANCE } from './feedback.js';

function emptyRound() {
  return { selected: null, attempts: 0, hints: 0, solutionViewed: false, solved: false, last: null, guidance: null };
}

/** A fresh session, on the first level's briefing. */
export function createSession(content) {
  const rounds = {};
  for (const level of content.levels) for (const round of level.rounds) rounds[round.id] = emptyRound();
  return { view: 'briefing', levelIndex: 0, roundIndex: 0, finishedLevelId: null, confirmingRestart: false, rounds };
}

export function currentLevel(state, content) {
  return content.levels[state.levelIndex];
}

export function currentRound(state, content) {
  return currentLevel(state, content).rounds[state.roundIndex];
}

function withRound(state, roundId, changes) {
  return { ...state, rounds: { ...state.rounds, [roundId]: { ...state.rounds[roundId], ...changes } } };
}

/**
 * Apply one action. An action that is not allowed in the current state, or is unknown, returns the
 * state unchanged.
 */
export function reduce(state, action, content) {
  if (!action || typeof action.type !== 'string') return state;

  // Restart works from every view. It asks first.
  if (action.type === 'request-restart') return state.confirmingRestart ? state : { ...state, confirmingRestart: true };
  if (action.type === 'cancel-restart') return state.confirmingRestart ? { ...state, confirmingRestart: false } : state;
  if (action.type === 'confirm-restart') return state.confirmingRestart ? createSession(content) : state;

  if (action.type === 'start-level') {
    return state.view === 'briefing' ? { ...state, view: 'round', finishedLevelId: null } : state;
  }

  if (state.view !== 'round') return state;
  const level = currentLevel(state, content);
  const round = currentRound(state, content);
  const record = state.rounds[round.id];

  if (action.type === 'next') {
    if (!record.solved) return state;
    if (state.roundIndex + 1 < level.rounds.length) return { ...state, roundIndex: state.roundIndex + 1 };
    if (state.levelIndex + 1 < content.levels.length) {
      return { ...state, view: 'briefing', levelIndex: state.levelIndex + 1, roundIndex: 0, finishedLevelId: level.id };
    }
    return { ...state, view: 'summary' };
  }

  // Everything below needs an open round.
  if (record.solved) return state;

  switch (action.type) {
    case 'select': {
      if (!round.options.some((option) => option.id === action.optionId)) return state;
      return withRound(state, round.id, { selected: action.optionId, guidance: null });
    }
    case 'submit': {
      const result = evaluate(content, round, record.selected);
      if (result.status === 'invalid-input') {
        return withRound(state, round.id, { guidance: GUIDANCE[result.reasonCode] });
      }
      if (result.status === 'content-error') {
        return withRound(state, round.id, { guidance: GUIDANCE['content-error'] });
      }
      return withRound(state, round.id, {
        attempts: record.attempts + 1,
        solved: result.status === 'correct',
        last: { ...result, optionId: record.selected },
        guidance: null,
      });
    }
    case 'hint':
      return record.hints < 2 ? withRound(state, round.id, { hints: record.hints + 1 }) : state;
    case 'solution':
      return record.hints === 2 && !record.solutionViewed ? withRound(state, round.id, { solutionViewed: true }) : state;
    default:
      return state;
  }
}

function totalsOf(records) {
  return {
    rounds: records.length,
    solved: records.filter((r) => r.solved).length,
    attempts: records.reduce((sum, r) => sum + r.attempts, 0),
    hints: records.reduce((sum, r) => sum + r.hints, 0),
    solutionsViewed: records.filter((r) => r.solutionViewed).length,
  };
}

/**
 * The figures of the level and session summaries. Attempts, hints and worked solutions are kept
 * apart. There is no score, grade or mastery label.
 */
export function summarize(state, content) {
  const levels = content.levels.map((level) => {
    const rounds = level.rounds.map((round) => {
      const record = state.rounds[round.id];
      return {
        id: round.id,
        title: round.title,
        attempts: record.attempts,
        hints: record.hints,
        solutionViewed: record.solutionViewed,
        solved: record.solved,
      };
    });
    return { id: level.id, title: level.title, rounds, totals: totalsOf(rounds) };
  });
  const all = levels.flatMap((level) => level.rounds);
  return {
    levels,
    totals: {
      ...totalsOf(all),
      solvedWithoutSolution: all.filter((r) => r.solved && !r.solutionViewed).length,
      solvedWithNoHelp: all.filter((r) => r.solved && !r.solutionViewed && r.hints === 0).length,
    },
  };
}
