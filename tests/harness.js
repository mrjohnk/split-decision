// Tiny test harness shared by the browser runner (tests/index.html) and the Node runner
// (tests/run-node.mjs). No dependencies.

export function createHarness() {
  const cases = [];

  function test(id, fn) {
    cases.push({ id, fn });
  }

  function fail(message) {
    throw new Error(message);
  }

  function assertTrue(value, message) {
    if (!value) fail(message || 'expected a true value');
  }

  function assertEqual(actual, expected, message) {
    if (actual !== expected) {
      fail(`${message ? message + ': ' : ''}expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  }

  function stable(value) {
    if (Array.isArray(value)) return value.map(stable);
    if (value && typeof value === 'object') {
      const out = {};
      for (const key of Object.keys(value).sort()) out[key] = stable(value[key]);
      return out;
    }
    return value;
  }

  function assertDeepEqual(actual, expected, message) {
    const a = JSON.stringify(stable(actual));
    const b = JSON.stringify(stable(expected));
    if (a !== b) fail(`${message ? message + ': ' : ''}expected ${b}, got ${a}`);
  }

  function assertIncludes(text, part, message) {
    if (typeof text !== 'string' || !text.includes(part)) {
      fail(`${message ? message + ': ' : ''}expected text to include ${JSON.stringify(part)}, got ${JSON.stringify(text)}`);
    }
  }

  function assertNotIncludes(text, part, message) {
    if (typeof text === 'string' && text.includes(part)) {
      fail(`${message ? message + ': ' : ''}expected text not to include ${JSON.stringify(part)}, got ${JSON.stringify(text)}`);
    }
  }

  async function run() {
    const failed = [];
    let passed = 0;
    for (const { id, fn } of cases) {
      try {
        await fn();
        passed += 1;
      } catch (error) {
        failed.push({ id, message: error && error.message ? error.message : String(error) });
      }
    }
    return { total: cases.length, passed, failed };
  }

  return { test, assertTrue, assertEqual, assertDeepEqual, assertIncludes, assertNotIncludes, run, count: () => cases.length };
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) deepFreeze(value[key]);
  }
  return value;
}
