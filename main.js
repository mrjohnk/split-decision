// Entry point: load the content, validate all of it, then start the game.
// If the content cannot be read or is not valid, nothing is played or graded.

import { validateContent } from './engine/content.js';
import { createSession } from './engine/state.js';
import { render, renderContentError } from './ui/render.js';
import { replaceChildren } from './ui/dom.js';
import { startControls } from './ui/controls.js';

const app = { content: null, state: null, animateTrace: false };
const main = document.getElementById('main');
const tools = ['open-briefing', 'open-model', 'restart'].map((id) => document.getElementById(id));

const CONTENT_PATH = 'data/levels.json';

function showError(problems) {
  app.content = null;
  app.state = null;
  for (const button of tools) button.disabled = true;
  replaceChildren(document.getElementById('progress'));
  main.dataset.view = 'content-error';
  delete main.dataset.round;
  replaceChildren(main, renderContentError(problems));
  document.getElementById('announcer').textContent = 'The work orders could not be loaded. Nothing can be played or graded.';
}

async function load() {
  const path = CONTENT_PATH;
  main.dataset.view = 'loading';
  let doc;
  try {
    const response = await fetch(new URL(path, import.meta.url), { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    doc = await response.json();
  } catch (error) {
    showError([{
      code: 'load-failed',
      where: path,
      message: `The content file could not be read (${error.message}). If you opened index.html straight from a folder, serve the folder over HTTP instead; the README shows how.`,
    }]);
    return;
  }
  const result = validateContent(doc);
  if (!result.ok) {
    showError(result.errors);
    return;
  }
  app.content = result.content;
  app.state = createSession(app.content);
  for (const button of tools) button.disabled = false;
  render(app);
}

startControls(app, { reload: load });
load();
