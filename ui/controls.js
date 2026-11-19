// Events, keyboard and focus. This module turns what the player does into session actions and
// decides where focus goes afterwards. It never decides an answer: see engine/rules.js.

import { reduce } from '../engine/state.js';
import { render, redrawAll, refreshPlant, fillBriefingDialog, fillModelDialog, announcementFor } from './render.js';

export function startControls(app, { reload }) {
  const main = document.getElementById('main');
  const announcer = document.getElementById('announcer');
  const restartDialog = document.getElementById('restart-dialog');
  const briefingDialog = document.getElementById('briefing-dialog');
  const modelDialog = document.getElementById('model-dialog');

  const byTestId = (id) => main.querySelector(`[data-testid="${id}"]`);
  const focusTitle = () => {
    const title = document.getElementById('view-title');
    if (title) title.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  };
  const focusFirstEnabled = (...ids) => {
    for (const id of ids) {
      const element = byTestId(id);
      if (element && !element.disabled) {
        element.focus();
        return;
      }
    }
  };
  // After a submission the answer is the instrument and the lines under it. If they are below the
  // window, move the page just far enough to show them, and never so far that the trace leaves.
  // The move is instant: the game has one motion, and it is the trace.
  const revealResult = () => {
    const feedback = byTestId('feedback');
    const panel = main.querySelector('.decide .instrument');
    if (!feedback || !panel) return;
    const texts = feedback.querySelectorAll('.feedback-lines, .feedback-explain, .feedback-note, .feedback-next');
    const last = texts.length ? texts[texts.length - 1] : feedback;
    const need = last.getBoundingClientRect().bottom + 16 - window.innerHeight;
    const room = panel.getBoundingClientRect().top - 12;
    const by = Math.min(need, room);
    if (by > 0) window.scrollBy({ top: by, left: 0, behavior: 'auto' });
  };
  const announce = (text) => {
    // Clear first, so the same message said twice is announced twice.
    announcer.textContent = '';
    if (text) window.setTimeout(() => { announcer.textContent = text; }, 30);
  };

  function dispatch(action) {
    if (!app.state) return false;
    const before = app.state;
    const after = reduce(before, action, app.content);
    if (after === before) return false;
    app.state = after;
    return true;
  }

  const attemptsNow = () => Object.values(app.state.rounds).reduce((sum, record) => sum + record.attempts, 0);

  function act(type, extra = {}) {
    switch (type) {
      case 'start-level':
      case 'next':
        if (dispatch({ type })) {
          app.animateTrace = false;
          render(app);
          announce('');
          focusTitle();
        }
        break;
      case 'select':
        if (dispatch({ type, optionId: extra.optionId })) {
          const guidance = byTestId('guidance');
          if (guidance) guidance.hidden = true;
          refreshPlant(app);
        }
        break;
      case 'submit': {
        const attemptsBefore = attemptsNow();
        if (dispatch({ type })) {
          // The trace draws itself only when a design was really submitted, not on an empty submission.
          app.animateTrace = attemptsNow() > attemptsBefore;
          render(app);
          app.animateTrace = false;
          announce(announcementFor(app));
          // After a correct submission Submit is disabled, so focus moves to Next.
          focusFirstEnabled('submit', 'next');
          if (attemptsNow() > attemptsBefore) revealResult();
        }
        break;
      }
      case 'hint':
      case 'solution':
        if (dispatch({ type })) {
          render(app);
          const shown = main.querySelector('[data-testid="help"] .help-item:last-child');
          announce(shown ? shown.textContent : '');
          focusFirstEnabled(type, 'solution', 'submit');
          if (shown) shown.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        }
        break;
      case 'request-restart':
        if (dispatch({ type })) restartDialog.showModal();
        break;
      case 'cancel-restart':
        dispatch({ type });
        if (restartDialog.open) restartDialog.close();
        break;
      case 'confirm-restart':
        if (dispatch({ type })) {
          restartDialog.close();
          app.animateTrace = false;
          render(app);
          announce('The game was restarted.');
          focusTitle();
        }
        break;
      case 'retry-load':
        reload();
        break;
      default:
        break;
    }
  }

  // One listener for every button that carries data-action, in the page and in the header.
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (button && !button.disabled) act(button.dataset.action);
    const closer = event.target.closest('[data-close]');
    if (closer) closer.closest('dialog').close();
  });

  main.addEventListener('submit', (event) => {
    event.preventDefault();
    act('submit');
  });

  main.addEventListener('change', (event) => {
    if (event.target.matches('input[name="design"]')) act('select', { optionId: event.target.value });
  });

  document.getElementById('restart').addEventListener('click', () => act('request-restart'));
  document.getElementById('confirm-restart').addEventListener('click', () => act('confirm-restart'));
  document.getElementById('cancel-restart').addEventListener('click', () => act('cancel-restart'));
  // Escape closes the dialog without a button: treat it as "Keep playing". The dialog's cancel
  // event belongs to this opening of it. Its close event arrives later and could be mistaken for
  // the closing of a dialog that was opened again in the meantime.
  restartDialog.addEventListener('cancel', () => act('cancel-restart'));

  document.getElementById('open-briefing').addEventListener('click', () => {
    if (!app.state || app.state.view !== 'round') return;
    fillBriefingDialog(briefingDialog, app);
    briefingDialog.showModal();
    redrawAll(briefingDialog);
    briefingDialog.scrollTop = 0;
    document.getElementById('briefing-dialog-title').focus({ preventScroll: true });
  });

  document.getElementById('open-model').addEventListener('click', () => {
    if (!app.content) return;
    fillModelDialog(modelDialog, app);
    modelDialog.showModal();
    modelDialog.scrollTop = 0;
    document.getElementById('model-dialog-title').focus({ preventScroll: true });
  });

  // Drawings are sized to their container, so redraw them when the layout changes width.
  let pending = null;
  let lastWidth = main.clientWidth;
  new ResizeObserver(() => {
    if (main.clientWidth === lastWidth) return;
    lastWidth = main.clientWidth;
    window.clearTimeout(pending);
    pending = window.setTimeout(() => redrawAll(document), 80);
  }).observe(main);
}
