/* Centspire V5 — student progress saved in this browser (localStorage), with an in-memory
 * fallback when storage is blocked (private mode, school-managed devices).
 * No names or school IDs are stored in progress. The participant ID is a random code.
 * V5 imports a student's V4 progress the first time, and can merge progress from two devices
 * (used by save codes and optional email sign-in — see cloud.js).
 */
(function (root, factory) {
  const mod = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Centsible = root.Centsible || {};
  root.Centsible.Store = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  const KEY = 'centsible_v5_progress';
  const OLD_KEY = 'centsible_v4_progress';
  const VERSION = 5;
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
      version: VERSION,
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
      credits: [],        // reward credit points: { id, amount, reason, at }
      claims: [],         // reward claim codes earned: { claim, rewards, score, at, reportId }
      saveCode: null,     // optional save code (cloud.js)
      settings: { muted: false },
    };
  }

  // ---------- merging progress from two devices (newest information wins, nothing is lost)
  const byKey = (list, key) => { const m = new Map(); (list || []).forEach((x) => m.set(key(x), x)); return m; };
  function merge(a, b) {
    if (!a) return b; if (!b) return a;
    const out = { ...blank(), ...a };
    out.version = VERSION;
    out.participant = b.participant || a.participant;   // keep one anonymous ID across devices
    out.counterbalance = b.counterbalance || a.counterbalance;
    out.firstSeen = Math.min(a.firstSeen || Infinity, b.firstSeen || Infinity);
    out.lastSeen = Math.max(a.lastSeen || 0, b.lastSeen || 0);
    out.visitDays = [...new Set([...(a.visitDays || []), ...(b.visitDays || [])])].sort();
    const sims = [a.sim, b.sim].filter((x) => x && x.state);
    out.sim = sims.sort((x, y) => (y.state.order || []).length - (x.state.order || []).length)[0] || null;
    out.reports = [...byKey([...(a.reports || []), ...(b.reports || [])], (r) => r.id).values()].sort((x, y) => y.createdAt - x.createdAt).slice(0, 10);
    out.lessons = { ...(a.lessons || {}) };
    Object.entries(b.lessons || {}).forEach(([id, l]) => {
      const cur = out.lessons[id];
      if (!cur || (l.passed && !cur.passed) || (!!l.passed === !!cur.passed && (l.at || 0) > (cur.at || 0))) out.lessons[id] = l;
    });
    out.missions = { ...(a.missions || {}) };
    Object.entries(b.missions || {}).forEach(([id, x]) => { const cur = out.missions[id]; if (!cur || (x.done && !cur.done) || (x.at || 0) > (cur.at || 0)) out.missions[id] = x; });
    out.evidence = {};
    new Set([...Object.keys(a.evidence || {}), ...Object.keys(b.evidence || {})]).forEach((t) => {
      const all = [...((a.evidence || {})[t] || []), ...((b.evidence || {})[t] || [])];
      out.evidence[t] = [...byKey(all, (e) => `${e.c}|${e.t}|${e.ok}`).values()].sort((x, y) => x.t - y.t).slice(-EVIDENCE_KEEP);
    });
    out.assessments = [...byKey([...(a.assessments || []), ...(b.assessments || [])], (x) => `${x.phase}|${x.at}`).values()].sort((x, y) => x.at - y.at);
    out.flags = { ...(a.flags || {}) };
    Object.entries(b.flags || {}).forEach(([k, t]) => { out.flags[k] = Math.max(out.flags[k] || 0, t); });
    out.credits = [...byKey([...(a.credits || []), ...(b.credits || [])], (x) => x.id).values()];
    out.claims = [...byKey([...(a.claims || []), ...(b.claims || [])], (x) => x.claim).values()];
    out.feedbackReports = [...new Set([...(a.feedbackReports || []), ...(b.feedbackReports || [])])];
    out.saveCode = a.saveCode || b.saveCode || null;
    return out;
  }

  function create(storage = pickStorage()) {
    let data;
    function read() {
      try {
        const raw = storage.getItem(KEY);
        let parsed = raw ? JSON.parse(raw) : null;
        if (!parsed) { // first V5 visit: bring over V4 progress if this browser has it
          const old = storage.getItem(OLD_KEY);
          const v4 = old ? JSON.parse(old) : null;
          if (v4 && v4.version === 4) parsed = { ...v4, version: VERSION, sim: null, importedFromV4: true };
        }
        data = parsed && parsed.version === VERSION ? { ...blank(), ...parsed } : blank();
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
      /** Merge progress from another device into this one and save. */
      mergeIn(other) { data = merge(data, other); write(); return data; },
      replace(next) { data = { ...blank(), ...next, version: VERSION }; write(); return data; },
      credits: () => (data.credits || []).reduce((t, c) => t + (c.amount || 0), 0),
      exportJSON: () => JSON.stringify(data),
    };
    return api;
  }

  return { create, blank, uuid, merge, KEY, OLD_KEY, VERSION };
});
