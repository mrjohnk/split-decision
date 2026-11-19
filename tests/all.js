// The list of test modules. Both runners import this file. A runner that finds no test must
// report failure, so an empty list can never look like a pass.

import rules from './rules.test.js';
import content from './content.test.js';
import state from './state.test.js';
import feedback from './feedback.test.js';

export const suites = [rules, content, state, feedback];
