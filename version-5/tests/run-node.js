/* Run the same tests in Node:  node version-5/tests/run-node.js  (Node 18+) */
const path = require('path');
const base = path.join(__dirname, '..', 'assets', 'js');
require('./harness.js');
['lib/assumptions.js', 'lib/finance.js', 'lib/store.js', 'content/concepts.js', 'content/assessments.js', 'lib/mastery.js',
  'sim/engine.js', 'content/lessons.js', 'content/missions.js', 'sim/report-builder.js', 'lib/analytics.js', 'lib/rewards.js'].forEach((f) => require(path.join(base, f)));
['finance.test.js', 'engine.test.js', 'learning.test.js', 'content.test.js', 'report.test.js', 'v5.test.js'].forEach((f) => require(path.join(__dirname, f)));
globalThis.CentsibleTest.run().then((results) => {
  const failed = results.filter((r) => !r.ok);
  results.forEach((r) => console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '\n      ' + r.error}`));
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
});
