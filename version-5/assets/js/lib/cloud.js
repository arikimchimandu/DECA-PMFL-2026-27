/* Centspire V5 — optional saving across devices (browser only).
 *
 * Students: an optional save code — a random 12-character code (like K7QD-M2XA-9PTF). No email or name.
 *   Progress is stored in Supabase under that code through two database functions (v5_code_save /
 *   v5_code_load). Anyone with the code can load that progress, so students keep it to themselves.
 *   Progress always saves in this browser too.
 *
 * Team only: email sign-in links (Supabase Auth) for the impact dashboard. Students never sign in.
 *
 * Needs the Supabase URL + anon key in config.js and supabase/schema.sql run once. See README.
 */
(function (root) {
  const C = root.Centsible;
  const SESSION_KEY = 'centsible_v5_session';
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
      if (res.status === 429 || /rate limit/i.test(msg)) throw new CloudError('Too many sign-in emails were sent recently. Please try again later, or use a save code instead.');
      if (res.status === 404 || /does not exist|could not find/i.test(msg)) throw new CloudError('Saving across devices isn’t fully set up yet — the Centspire team needs to run the V5 database setup.');
      throw new CloudError(msg || `Something went wrong (error ${res.status}).`);
    }
    return json;
  }

  // ------------------------------------------------------------ team sign-in (Supabase Auth, impact dashboard only)
  const decodeJwt = (t) => { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch { return {}; } };
  function sessionFrom(tokens) {
    const claims = decodeJwt(tokens.access_token);
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at ? +tokens.expires_at : Math.floor(Date.now() / 1000) + (+tokens.expires_in || 3600),
      user: { id: (tokens.user && tokens.user.id) || claims.sub, email: (tokens.user && tokens.user.email) || claims.email || '' },
    };
  }
  function getSession() { try { return JSON.parse(root.localStorage.getItem(SESSION_KEY)); } catch { return null; } }
  function setSession(s) { try { if (s) root.localStorage.setItem(SESSION_KEY, JSON.stringify(s)); else root.localStorage.removeItem(SESSION_KEY); } catch { /* storage blocked */ } }

  async function validSession() {
    const s = getSession();
    if (!s) return null;
    if (s.expires_at * 1000 - 60000 > Date.now()) return s;
    try {
      const fresh = sessionFrom(await call('/auth/v1/token?grant_type=refresh_token', { body: { refresh_token: s.refresh_token } }));
      setSession(fresh);
      return fresh;
    } catch { setSession(null); return null; }
  }

  /** Email a sign-in link. The link returns to `returnTo` (must be allowed in Supabase Auth → URL Configuration). */
  async function sendLink(email, returnTo = root.location.origin + root.location.pathname) {
    const clean = String(email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) throw new CloudError('Enter a valid email address.');
    await call(`/auth/v1/otp?redirect_to=${encodeURIComponent(returnTo)}`, { body: { email: clean, create_user: true } });
    return true;
  }

  /** If this page was opened from a sign-in link, save the session and clean the address bar. */
  function captureRedirect() {
    const hash = root.location.hash.startsWith('#') ? root.location.hash.slice(1) : '';
    if (!/access_token=|error_description=/.test(hash)) return null;
    const p = new URLSearchParams(hash);
    root.history.replaceState(null, '', root.location.pathname + root.location.search);
    if (p.get('error_description')) return { error: p.get('error_description').replace(/\+/g, ' ') };
    const s = sessionFrom({ access_token: p.get('access_token'), refresh_token: p.get('refresh_token'), expires_at: p.get('expires_at'), expires_in: p.get('expires_in') });
    setSession(s);
    return { session: s };
  }

  async function signOut() {
    const s = getSession();
    setSession(null);
    if (s) { try { await call('/auth/v1/logout', { token: s.access_token }); } catch { /* already signed out */ } }
    emit();
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
    getSession, validSession, sendLink, captureRedirect, signOut,
    createCode, loadCode, forgetCode, fmtCode, normCode, validCode, syncNow, CloudError,
  };
})(window);
