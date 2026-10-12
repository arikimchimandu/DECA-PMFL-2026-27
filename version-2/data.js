/* centsible. — event storage shared by the game and the dashboard.
 * Every event is saved on this device; if Supabase is configured it is also sent there.
 * Event types: visit, start, finish.
 */
window.CentsibleData = (() => {
  const KEY = 'centsible_v2_events';
  const cfg = window.CENTSIBLE_CONFIG || {};
  const remote = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);

  function local() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
  }
  function saveLocal(events) {
    try { localStorage.setItem(KEY, JSON.stringify(events)); } catch { /* storage unavailable */ }
  }

  function headers() {
    return {
      apikey: cfg.supabaseAnonKey,
      Authorization: `Bearer ${cfg.supabaseAnonKey}`,
      'Content-Type': 'application/json',
    };
  }

  function log(type, src, data = {}) {
    const ev = { type, src, data, created_at: new Date().toISOString() };
    const all = local(); all.push(ev); saveLocal(all);
    if (remote) {
      fetch(`${cfg.supabaseUrl}/rest/v1/${cfg.table}`, {
        method: 'POST',
        headers: { ...headers(), Prefer: 'return=minimal' },
        body: JSON.stringify({ type, src, data }),
        keepalive: true,
      }).catch(() => { /* offline: the local copy still has it */ });
    }
  }

  async function fetchAll() {
    if (!remote) return { events: local(), source: 'device' };
    try {
      const out = [];
      for (let from = 0; ; from += 1000) {
        const res = await fetch(`${cfg.supabaseUrl}/rest/v1/${cfg.table}?select=type,src,data,created_at&order=created_at.asc`, {
          headers: { ...headers(), Range: `${from}-${from + 999}` },
        });
        if (!res.ok) throw new Error(res.status);
        const page = await res.json();
        out.push(...page);
        if (page.length < 1000) break;
      }
      return { events: out, source: 'shared' };
    } catch {
      return { events: local(), source: 'device (shared database unreachable)' };
    }
  }

  function clearLocal() { saveLocal([]); }

  return { log, fetchAll, clearLocal, remote };
})();
