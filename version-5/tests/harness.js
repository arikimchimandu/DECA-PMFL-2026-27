/* Tiny test harness that works in a browser (tests/index.html) and in Node (tests/run-node.js). */
(function (root) {
  const tests = [];
  const T = {
    test(name, fn) { tests.push({ name, fn }); },
    assert: {
      ok(v, msg) { if (!v) throw new Error(msg || 'expected truthy, got ' + v); },
      equal(a, b, msg) { if (a !== b) throw new Error((msg ? msg + ': ' : '') + `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); },
      approx(a, b, tol = 0.01, msg) { if (!(Math.abs(a - b) <= tol)) throw new Error((msg ? msg + ': ' : '') + `expected ≈${b} (±${tol}), got ${a}`); },
      deepEqual(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg ? msg + ': ' : '') + `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); },
      throws(fn, msg) { let threw = false; try { fn(); } catch { threw = true; } if (!threw) throw new Error(msg || 'expected function to throw'); },
    },
    async run() {
      const results = [];
      for (const t of tests) {
        try { await t.fn(); results.push({ name: t.name, ok: true }); }
        catch (e) { results.push({ name: t.name, ok: false, error: e.message }); }
      }
      return results;
    },
  };
  root.CentsibleTest = T;
})(typeof globalThis !== 'undefined' ? globalThis : this);
