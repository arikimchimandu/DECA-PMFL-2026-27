/* Centsible V4 — student progress saved in this browser (localStorage), with an in-memory
 * fallback when storage is blocked (private mode, school-managed devices).
 * No names, emails, or school IDs are ever stored. The participant ID is a random code.
 */
(function (root, factory) {
  const mod = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Centsible = root.Centsible || {};
  root.Centsible.Store = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  const KEY = 'centsible_v4_progress';
  const EVIDENCE_KEEP = 16;

  function memoryStorage() {
    const m = new Map();
    return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
  }
  function pickStorage() {
    try {
      const s = root.localStorage;
      const t = '__centsible_test__';
      s.setItem(t, '1'); s.removeItem(t);
      return s;
    } catch { return memoryStorage(); }
  }

  function uuid() {
    if (root.crypto && root.crypto.randomUUID) return root.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function blank(now = Date.now()) {
    return {
      version: 4,
      participant: uuid(),
      firstSeen: now,
      lastSeen: now,
      visitDays: [],
      counterbalance: Math.random() < 0.5 ? 'AB' : 'BA', // which assessment form comes first
      sim: null,          // in-progress simulator state
      reports: [],        // saved Financial Future Reports
      lessons: {},        // id → { done, passed, firstTry: {correct,total}, at }
      missions: {},       // id → { done, correct, total, at }
      evidence: {},       // topic → [{ c: concept, ok, src, t }]
      assessments: [],    // { phase, form, score, total, byTopic, at, runId }
      flags: {},          // concept flags raised by decisions, e.g. { 'min-payment': t }
      settings: { muted: false },
    };
  }

  function create(storage = pickStorage()) {
    let data;
    function read() {
      try {
        const raw = storage.getItem(KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        data = parsed && parsed.version === 4 ? { ...blank(), ...parsed } : blank();
      } catch { data = blank(); }
      return data;
    }
    function write() {
      try { storage.setItem(KEY, JSON.stringify(data)); return true; } catch { return false; }
    }
    read();

    const api = {
      get: () => data,
      update(fn) { fn(data); data.lastSeen = Date.now(); write(); return data; },
      reload: read,
      reset() { const keepId = data.participant; data = blank(); data.participant = keepId; write(); return data; },
      /** Record a visit; returns { returning, daysSinceFirst }. */
      touch(now = Date.now()) {
        const day = new Date(now).toISOString().slice(0, 10);
        const returning = data.visitDays.length > 0 && !data.visitDays.includes(day);
        if (!data.visitDays.includes(day)) data.visitDays.push(day);
        data.lastSeen = now; write();
        return { returning, daysSinceFirst: Math.floor((now - data.firstSeen) / 86400000) };
      },
      addEvidence(topic, concept, ok, src, now = Date.now()) {
        api.update((d) => {
          const list = (d.evidence[topic] = d.evidence[topic] || []);
          list.push({ c: concept, ok: !!ok, src, t: now });
          if (list.length > EVIDENCE_KEEP) list.splice(0, list.length - EVIDENCE_KEEP);
        });
      },
      flag(concept, now = Date.now()) { api.update((d) => { d.flags[concept] = now; }); },
      saveSim(state) { api.update((d) => { d.sim = state; }); },
      clearSim() { api.update((d) => { d.sim = null; }); },
      addReport(report) {
        api.update((d) => { d.reports.unshift(report); d.reports = d.reports.slice(0, 10); });
        return report.id;
      },
      report(id) { return data.reports.find((r) => r.id === id) || null; },
      exportJSON: () => JSON.stringify(data),
    };
    return api;
  }

  return { create, blank, uuid, KEY };
});
