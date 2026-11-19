// Tests for engine/state.js, written from contracts/session.md before the reducer existed.

import { createSession, reduce, summarize } from '../engine/state.js';
import { clone, deepFreeze } from './harness.js';

export default async function define({ test, assertEqual, assertTrue, assertDeepEqual, loadJson }) {
  const content = deepFreeze(await loadJson('data/levels.json'));
  const key = await loadJson('tests/fixtures/answer-key.json');

  const play = (state, ...actions) => actions.reduce((s, action) => reduce(s, typeof action === 'string' ? { type: action } : action, content), state);
  const select = (optionId) => ({ type: 'select', optionId });
  const fresh = () => createSession(content);
  const inRound11 = () => play(fresh(), 'start-level');
  const rec = (state, roundId) => state.rounds[roundId];

  // Solve the current round with the answer from the hand-worked key.
  const solveCurrent = (state) => {
    const roundId = content.levels[state.levelIndex].rounds[state.roundIndex].id;
    return play(state, select(key.rounds[roundId].answer), 'submit');
  };

  test('state/AC1 a fresh session opens on the first briefing and accepts no answer', () => {
    const state = fresh();
    assertEqual(state.view, 'briefing');
    assertEqual(state.levelIndex, 0);
    assertEqual(state.roundIndex, 0);
    const after = play(state, select('o32'), 'submit');
    assertDeepEqual(after, state, 'select and submit do nothing on a briefing');
    assertEqual(play(state, 'start-level').view, 'round');
  });

  test('state/AC4 submitting with nothing selected gives guidance and counts nothing', () => {
    const state = play(inRound11(), 'submit');
    assertEqual(rec(state, 'r1-1').attempts, 0);
    assertEqual(rec(state, 'r1-1').solved, false);
    assertEqual(rec(state, 'r1-1').last, null);
    assertTrue(rec(state, 'r1-1').guidance, 'guidance is set');
    const selected = play(state, select('o32'));
    assertEqual(rec(selected, 'r1-1').guidance, null, 'selecting clears the guidance');
  });

  test('state/AC6 attempts count valid submissions until the round is solved, once', () => {
    let state = play(inRound11(), select('o64'), 'submit');
    assertEqual(rec(state, 'r1-1').attempts, 1);
    assertEqual(rec(state, 'r1-1').solved, false);
    assertEqual(rec(state, 'r1-1').last.reasonCode, 'over-max');
    assertEqual(rec(state, 'r1-1').last.optionId, 'o64');

    state = play(state, select('o16'), 'submit');
    assertEqual(rec(state, 'r1-1').attempts, 2, 'a valid design that is not the answer counts as an attempt');
    assertEqual(rec(state, 'r1-1').last.reasonCode, 'valid-not-best');

    state = play(state, select('o32'), 'submit');
    assertEqual(rec(state, 'r1-1').attempts, 3);
    assertEqual(rec(state, 'r1-1').solved, true);
    assertEqual(rec(state, 'r1-1').last.status, 'correct');

    const again = play(state, 'submit', select('o64'), 'submit');
    assertDeepEqual(again, state, 'nothing changes after the round is solved');
  });

  test('state/selecting keeps the feedback of the previous submission', () => {
    const state = play(inRound11(), select('o64'), 'submit', select('o16'));
    assertEqual(rec(state, 'r1-1').selected, 'o16');
    assertEqual(rec(state, 'r1-1').last.optionId, 'o64');
    assertEqual(rec(state, 'r1-1').attempts, 1);
  });

  test('state/selecting an option the round does not have changes nothing', () => {
    const state = inRound11();
    assertDeepEqual(play(state, select('nope')), state);
  });

  test('state/AC5 help comes in order, is recorded, and never completes the round', () => {
    let state = inRound11();
    assertDeepEqual(play(state, 'solution'), state, 'no worked solution before two hints');
    state = play(state, 'hint');
    assertEqual(rec(state, 'r1-1').hints, 1);
    assertDeepEqual(play(state, 'solution'), state, 'no worked solution after one hint');
    state = play(state, 'hint');
    assertEqual(rec(state, 'r1-1').hints, 2);
    assertDeepEqual(play(state, 'hint'), state, 'there is no third hint');
    state = play(state, 'solution');
    assertEqual(rec(state, 'r1-1').solutionViewed, true);
    assertEqual(rec(state, 'r1-1').attempts, 0);
    assertEqual(rec(state, 'r1-1').solved, false, 'the worked solution does not solve the round');
    assertDeepEqual(play(state, 'next'), state, 'Next does nothing while the round is unsolved');
    state = solveCurrent(state);
    assertEqual(rec(state, 'r1-1').solved, true);
    assertEqual(rec(state, 'r1-1').solutionViewed, true, 'recorded as solved with the worked solution');
  });

  test('state/help is unavailable once the round is solved', () => {
    const solved = solveCurrent(inRound11());
    assertDeepEqual(play(solved, 'hint', 'hint', 'solution'), solved);
  });

  test('state/AC7 Next moves through rounds, briefings and the summary', () => {
    let state = inRound11();
    assertDeepEqual(play(state, 'next'), state, 'Next needs a solved round');
    state = play(solveCurrent(state), 'next');
    assertEqual(state.view, 'round');
    assertEqual(state.levelIndex, 0);
    assertEqual(state.roundIndex, 1);
    assertEqual(state.finishedLevelId, null);

    state = play(solveCurrent(state), 'next');
    assertEqual(state.view, 'briefing', 'the next level opens with its briefing');
    assertEqual(state.levelIndex, 1);
    assertEqual(state.roundIndex, 0);
    assertEqual(state.finishedLevelId, 'level-1');

    state = play(state, 'start-level');
    assertEqual(state.finishedLevelId, null);
    state = play(solveCurrent(state), 'next');
    state = play(solveCurrent(state), 'next', 'start-level');
    assertEqual(state.levelIndex, 2);
    state = play(solveCurrent(state), 'next');
    state = play(solveCurrent(state), 'next');
    assertEqual(state.view, 'summary');
    assertDeepEqual(play(state, 'next', 'submit', 'hint', select('none')), state, 'the summary accepts no round action');
  });

  test('state/AC8 restart asks first; cancel changes nothing; confirm starts afresh', () => {
    const playing = play(inRound11(), 'hint', select('o64'), 'submit', select('o16'));
    const asking = play(playing, 'request-restart');
    assertEqual(asking.confirmingRestart, true);
    assertDeepEqual({ ...asking, confirmingRestart: false }, playing, 'asking changes only the flag');
    assertDeepEqual(play(asking, 'cancel-restart'), playing, 'cancel restores the session exactly');
    assertDeepEqual(play(asking, 'confirm-restart'), fresh(), 'confirm gives a fresh session');
    assertDeepEqual(play(playing, 'confirm-restart'), playing, 'confirm without asking does nothing');
    assertDeepEqual(play(playing, 'cancel-restart'), playing, 'cancel without asking does nothing');
  });

  test('state/unknown actions and inputs are never modified', () => {
    const state = deepFreeze(play(inRound11(), select('o64'), 'submit'));
    assertDeepEqual(play(state, 'fly-away'), state);
    assertDeepEqual(reduce(state, null, content), state);
    play(state, select('o16'), 'submit', 'hint', 'request-restart');
  });

  test('state/the summary reports attempts and help separately, with both totals', () => {
    // Round 1-1: one wrong, then right. Round 1-2: two hints and the worked solution, then right.
    // Round 2-1: one hint, then right. The other three: right at once.
    let state = inRound11();
    state = play(state, select('o64'), 'submit');
    state = play(solveCurrent(state), 'next');
    state = play(state, 'hint', 'hint', 'solution');
    state = play(solveCurrent(state), 'next', 'start-level');
    state = play(state, 'hint');
    state = play(solveCurrent(state), 'next');
    state = play(solveCurrent(state), 'next', 'start-level');
    state = play(solveCurrent(state), 'next');
    state = play(solveCurrent(state), 'next');
    assertEqual(state.view, 'summary');

    const summary = summarize(state, content);
    assertEqual(summary.levels.length, 3);
    assertDeepEqual(summary.levels[0].rounds.map((r) => [r.id, r.attempts, r.hints, r.solutionViewed, r.solved]),
      [['r1-1', 2, 0, false, true], ['r1-2', 1, 2, true, true]]);
    assertDeepEqual(summary.levels[0].totals, { rounds: 2, solved: 2, attempts: 3, hints: 2, solutionsViewed: 1 });
    assertDeepEqual(summary.levels[1].totals, { rounds: 2, solved: 2, attempts: 2, hints: 1, solutionsViewed: 0 });
    assertDeepEqual(summary.totals, {
      rounds: 6, solved: 6, attempts: 7, hints: 3, solutionsViewed: 1, solvedWithoutSolution: 5, solvedWithNoHelp: 4,
    });
    assertTrue(!('score' in summary.totals) && !('grade' in summary.totals), 'no score or grade');
  });

  test('state/the summary of an unfinished session counts only what happened', () => {
    const state = play(inRound11(), select('o64'), 'submit');
    const summary = summarize(state, content);
    assertDeepEqual(summary.totals, {
      rounds: 6, solved: 0, attempts: 1, hints: 0, solutionsViewed: 0, solvedWithoutSolution: 0, solvedWithNoHelp: 0,
    });
  });

  test('state/the session never stores anything outside itself', () => {
    const a = fresh();
    const b = fresh();
    assertDeepEqual(a, b);
    assertTrue(a !== b && a.rounds !== b.rounds, 'sessions do not share objects');
    const snapshot = clone(a);
    play(a, 'start-level', select('o64'), 'submit', 'hint');
    assertDeepEqual(a, snapshot, 'reduce returns a new state and leaves the old one alone');
  });
}
