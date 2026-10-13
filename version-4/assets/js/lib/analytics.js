/* Centsible V4 — privacy-conscious impact analytics.
 *
 * What's collected: a random participant ID, the event type, the page, and small numeric data
 * (scores, counts, choices). Never names, emails, school IDs, or free-text comments.
 *
 * Where it goes:
 *   - Always: this browser (localStorage), so a student's own device works offline.
 *   - Optionally: Supabase, if config.js has a project URL and anon key. The database only lets the
 *     public INSERT events; nobody can read individual rows. The team dashboard calls a summary
 *     function that returns totals and averages only (see supabase/schema.sql).
 *   - Never in demo mode.
 */
(function (root, factory) {
  const mod = factory(root, root.Centsible || {});
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Centsible = root.Centsible || {};
  root.Centsible.Analytics = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root, C) {
  const KEY = 'centsible_v4_events';
  const MAX_LOCAL = 600;
  const TYPES = ['visit', 'sim_start', 'sim_complete', 'assessment', 'lesson_complete', 'mission_complete', 'feedback'];
  const TOPICS = ['college', 'budgeting', 'credit', 'saving', 'income'];

  const cfg = () => root.CENTSIBLE_CONFIG || {};
  const remoteEnabled = () => !!(cfg().supabaseUrl && cfg().supabaseAnonKey);
  let demo = false;

  function localEvents() {
    try { return JSON.parse(root.localStorage.getItem(KEY)) || []; } catch { return []; }
  }
  function saveLocal(list) {
    try { root.localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX_LOCAL))); } catch { /* storage blocked */ }
  }

  function log(type, participant, page, data = {}) {
    if (demo || !TYPES.includes(type)) return false;
    const ev = { type, participant, page: String(page || '').slice(0, 40), data, created_at: new Date().toISOString() };
    saveLocal([...localEvents(), ev]);
    if (remoteEnabled() && root.fetch) {
      root.fetch(`${cfg().supabaseUrl}/rest/v1/${cfg().table || 'v4_events'}`, {
        method: 'POST',
        headers: { apikey: cfg().supabaseAnonKey, Authorization: `Bearer ${cfg().supabaseAnonKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ type, participant, page: ev.page, data }),
        keepalive: true,
      }).catch(() => { /* offline: the local copy remains */ });
    }
    return true;
  }

  // ---- Summary (same shape as the SQL function v4_impact_summary)
  function summarize(events) {
    const by = (t) => events.filter((e) => e.type === t);
    const participants = new Set(events.map((e) => e.participant));
    const days = {};
    by('visit').forEach((e) => { (days[e.participant] = days[e.participant] || new Set()).add(String(e.created_at).slice(0, 10)); });
    const returning = Object.values(days).filter((s) => s.size > 1).length;
    const latest = (phase) => {
      const map = {};
      by('assessment').filter((e) => e.data.phase === phase).forEach((e) => { map[e.participant] = e; });
      return map;
    };
    const pre = latest('pre'), post = latest('post'), retention = latest('retention');
    const frac = (d) => (d.total ? d.score / d.total : null);
    const avg = (xs) => { const v = xs.filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
    const pairedIds = Object.keys(pre).filter((p) => post[p]);
    const topic = (map, ids, t) => avg(ids.map((p) => { const b = map[p].data.byTopic && map[p].data.byTopic[t]; return b && b.total ? b.correct / b.total : null; }));
    const byTopic = {};
    TOPICS.forEach((t) => { byTopic[t] = { pre: topic(pre, pairedIds, t), post: topic(post, pairedIds, t) }; });
    const starts = by('sim_start').length, completes = by('sim_complete').length;
    const lessons = by('lesson_complete');
    const ratings = by('feedback').map((e) => e.data.rating).filter((r) => r >= 1 && r <= 5);
    const retIds = Object.keys(retention);
    return {
      participants: participants.size,
      returning,
      simStarts: starts,
      simCompletes: completes,
      completionRate: starts ? completes / starts : null,
      preCount: Object.keys(pre).length,
      postCount: Object.keys(post).length,
      paired: {
        n: pairedIds.length,
        pre: avg(pairedIds.map((p) => frac(pre[p].data))),
        post: avg(pairedIds.map((p) => frac(post[p].data))),
        improved: pairedIds.filter((p) => frac(post[p].data) > frac(pre[p].data)).length,
        byTopic,
      },
      lessonsCompleted: lessons.length,
      lessonParticipants: new Set(lessons.map((e) => e.participant)).size,
      lessonPassRate: lessons.length ? lessons.filter((e) => e.data.passed).length / lessons.length : null,
      missionsCompleted: by('mission_complete').length,
      feedback: { n: ratings.length, avg: avg(ratings) },
      retention: { n: retIds.length, avg: avg(retIds.map((p) => frac(retention[p].data))), preAvg: avg(retIds.filter((p) => pre[p]).map((p) => frac(pre[p].data))) },
    };
  }

  async function summary() {
    if (remoteEnabled() && root.fetch) {
      try {
        const res = await root.fetch(`${cfg().supabaseUrl}/rest/v1/rpc/${cfg().summaryFunction || 'v4_impact_summary'}`, {
          method: 'POST',
          headers: { apikey: cfg().supabaseAnonKey, Authorization: `Bearer ${cfg().supabaseAnonKey}`, 'Content-Type': 'application/json' },
          body: '{}',
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return { source: 'shared', data: await res.json() };
      } catch (e) {
        return { source: 'device', error: 'The shared database could not be reached, so this shows this device only.', data: summarize(localEvents()) };
      }
    }
    return { source: 'device', data: summarize(localEvents()) };
  }

  return {
    TYPES, log, summary, summarize, localEvents, remoteEnabled,
    setDemo(v) { demo = !!v; }, isDemo: () => demo,
    clearLocal() { saveLocal([]); },
  };
});
