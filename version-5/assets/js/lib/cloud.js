/* Centspire V5 — optional saving across devices (browser only).
 *
 * Students: an optional save code — a random 12-character code (like K7QD-M2XA-9PTF). No email or name.
 *   Progress is stored in Supabase under that code through two database functions (v5_code_save /
 *   v5_code_load). Anyone with the code can load that progress, so students keep it to themselves.
 *   Progress always saves in this browser too.
 *
 * Needs the Supabase URL + anon key in config.js and supabase/schema.sql run once. See README.
 */
(function (root) {
  const C = root.Centsible;
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const cfg = () => root.CENTSIBLE_CONFIG || {};
  const enabled = () => !!(cfg().supabaseUrl && cfg().supabaseAnonKey);
  const url = (path) => `${cfg().supabaseUrl}${path}`;
  const headers = (token) => ({ apikey: cfg().supabaseAnonKey, Authorization: `Bearer ${token || cfg().supabaseAnonKey}`, 'Content-Type': 'application/json' });

  let store = null, demo = false, timer = null;
  const status = { lastSync: null, error: null, busy: false };
  const listeners = new Set();
  const emit = () => listeners.forEach((fn) => { try { fn(status); } catch { /* ignore */ } });

  class CloudError extends Error {}
  async function call(path, { method = 'POST', body, token, extraHeaders = {} } = {}) {
    if (!enabled()) throw new CloudError('Saving across devices isn’t set up on this site yet.');
    let res;
    try {
      res = await root.fetch(url(path), { method, headers: { ...headers(token), ...extraHeaders }, body: body === undefined ? undefined : JSON.stringify(body) });
    } catch { throw new CloudError('Couldn’t reach the server. Check your internet connection and try again.'); }
    const text = await res.text();
    let json = null; try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    if (!res.ok) {
      const msg = (json && (json.msg || json.message || json.error_description || json.error)) || '';
      if (res.status === 404 || /does not exist|could not find/i.test(msg)) throw new CloudError('Saving across devices isn’t fully set up yet — the Centspire team needs to run the V5 database setup.');
      throw new CloudError(msg || `Something went wrong (error ${res.status}).`);
    }
    return json;
  }

  // ------------------------------------------------------------ save codes
  function newCode() {
    const bytes = new Uint8Array(12);
    (root.crypto || {}).getRandomValues ? root.crypto.getRandomValues(bytes) : bytes.forEach((_, i) => { bytes[i] = Math.floor(Math.random() * 256); });
    return [...bytes].map((b) => ALPHABET[b % 32]).join('');
  }
  const normCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const fmtCode = (c) => { const n = normCode(c); return n.match(/.{1,4}/g) ? n.match(/.{1,4}/g).join('-') : n; };
  const validCode = (c) => /^[A-Z0-9]{12}$/.test(normCode(c));

  async function createCode() {
    const code = newCode();
    store.update((d) => { d.saveCode = code; });
    await call('/rest/v1/rpc/v5_code_save', { body: { p_code: code, p_data: store.get() } });
    status.lastSync = Date.now(); status.error = null; emit();
    C.Analytics.log('sync', store.get().participant, 'progress', { method: 'code', action: 'create' });
    return code;
  }

  async function loadCode(code) {
    if (!validCode(code)) throw new CloudError('Save codes have 12 letters and numbers, like K7QD-M2XA-9PTF.');
    const n = normCode(code);
    const data = await call('/rest/v1/rpc/v5_code_load', { body: { p_code: n } });
    if (!data) throw new CloudError('We couldn’t find progress for that code. Check it and try again.');
    store.mergeIn(data);
    store.update((d) => { d.saveCode = n; });
    status.lastSync = Date.now(); status.error = null; emit();
    C.Analytics.log('sync', store.get().participant, 'progress', { method: 'code', action: 'load' });
    return store.get();
  }

  function forgetCode() { store.update((d) => { d.saveCode = null; }); }

  // ------------------------------------------------------------ automatic saving
  async function syncNow() {
    if (!store || demo || !enabled()) return;
    const d = store.get();
    if (!d.saveCode) return;
    status.busy = true; emit();
    try {
      await call('/rest/v1/rpc/v5_code_save', { body: { p_code: d.saveCode, p_data: d } });
      status.lastSync = Date.now(); status.error = null;
    } catch (e) { status.error = e.message; }
    status.busy = false; emit();
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(syncNow, 1500); }

  /** Wrap the store so every change is also saved to the student's save code (debounced). */
  function attach(s, { isDemo = false } = {}) {
    store = s; demo = isDemo;
    if (demo) return;
    const update = s.update;
    s.update = (fn) => { const r = update(fn); schedule(); return r; };
  }

  C.Cloud = {
    enabled, attach, status, onChange: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    createCode, loadCode, forgetCode, fmtCode, normCode, validCode, syncNow, CloudError,
  };
})(window);
