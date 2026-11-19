// Runs the same test modules as tests/index.html, from a terminal:  node tests/run-node.mjs
// Exits with status 1 on any failure, and when no test was found.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHarness } from './harness.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const loadJson = async (relativePath) => JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));

let suites = [];
try {
  ({ suites } = await import('./all.js'));
} catch (error) {
  console.error('Could not load the test modules:', error.message);
  process.exit(1);
}

const harness = createHarness();
for (const define of suites) await define({ ...harness, loadJson });

const result = await harness.run();
for (const failure of result.failed) console.log(`FAIL  ${failure.id}\n      ${failure.message}`);
console.log(`\n${result.passed} passed, ${result.failed.length} failed, ${result.total} total`);
if (result.total === 0) {
  console.log('No tests were found. That is a failure.');
  process.exit(1);
}
process.exit(result.failed.length === 0 ? 0 : 1);
