/* Team impact dashboard: real aggregate data, clearly separated from labeled demo data. */
(function () {
  const C = window.Centsible, U = C.UI;
  const { $, icon, esc } = U;
  U.mountShell('about');
  const root = $('#impact');
  const TOPICS = C.Assessments.TOPICS;
  const pct = (x) => (x == null ? '—' : Math.round(x * 100) + '%');

  // Fictional numbers for presentations ONLY. Always shown under a "DEMO DATA" label.
  const DEMO = {
    participants: 64, returning: 21, simStarts: 58, simCompletes: 47, completionRate: 47 / 58, preCount: 55, postCount: 46,
    paired: { n: 44, pre: 0.52, post: 0.78, improved: 37,
      byTopic: { college: { pre: 0.55, post: 0.84 }, budgeting: { pre: 0.68, post: 0.86 }, credit: { pre: 0.38, post: 0.71 }, saving: { pre: 0.57, post: 0.80 }, income: { pre: 0.42, post: 0.69 }, safety: { pre: 0.61, post: 0.90 } } },
    lessonsCompleted: 112, lessonParticipants: 29, lessonPassRate: 0.81, missionsCompleted: 38,
    feedback: { n: 33, avg: 4.4, npsN: 31, nps: 42, schoolN: 30, schoolYes: 0.7 }, retention: { n: 12, avg: 0.72, preAvg: 0.50 },
    challenge: { n: 47, avg: 9420, over10k: 18 }, rewards: { claims: 21, accuracy: 9, score: 18, redeemed: 14 }, syncs: { code: 21 },
  };
  const cfg = () => window.CENTSIBLE_CONFIG || {};
  let token = null;
  async function rpc(name, body) {
    const res = await fetch(`${cfg().supabaseUrl}/rest/v1/rpc/${name}`, { method: 'POST', headers: { apikey: cfg().supabaseAnonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.status === 401 || res.status === 403) throw new Error('Only signed-in team members can check claims.');
    if (!res.ok) throw new Error(res.status === 404 ? 'The V5 database setup hasn’t been run yet.' : 'Couldn’t reach the database (error ' + res.status + ').');
    return res.json();
  }

  // Team-only gate: shown until a team member signs in (demo mode shows labeled fictional data instead).
  function gate(reason) {
    const sess = C.Cloud.getSession();
    const msg = reason === 'not-team' ? `<div class="callout callout-coral">${icon('lock', 20)}<p><b>${esc(sess && sess.user.email || 'This account')}</b> isn’t on the team list. Ask Ari to add your email in Supabase (<code>v5_team_members</code>).</p></div>`
      : reason === 'setup' ? `<div class="callout callout-gold">${icon('alert', 20)}<p>The V5 database setup hasn’t been run yet, so there’s no shared data to show.</p></div>`
        : reason === 'offline' ? `<div class="callout callout-gold">${icon('alert', 20)}<p>Couldn’t reach the database. Check your connection and refresh.</p></div>` : '';
    root.innerHTML = `
      <section class="hero on-navy"><div class="container" style="padding-top:48px;padding-bottom:40px">
        <p class="eyebrow" style="color:var(--gold)">${icon('lock', 16)} Team only</p>
        <h1 style="max-width:22ch">Impact dashboard</h1>
        <p class="lead">Sign in with your team email to see results and check reward claims.</p>
      </div></section>
      <div class="container section stack" style="max-width:640px">
        ${msg}
        <section class="card">
          ${sess ? `<p>Signed in as <b>${esc(sess.user.email)}</b>.</p><button class="btn btn-ghost btn-sm" id="tm-out">Sign out</button>`
            : `<div class="field"><label for="tm-email">Team email</label><input class="input" id="tm-email" type="email" autocomplete="email" placeholder="you@example.com"></div>
              <button class="btn btn-navy btn-sm" id="tm-send" style="margin-top:10px">${icon('mail', 16)} Email me a sign-in link</button>
              <p class="small muted" style="margin:10px 0 0">Open the link on this device. Only emails on the team list can see data.</p>`}
          <p class="error" id="tm-err" role="alert"></p>
        </section>
        <p class="small muted">Presenting? <a href="?demo=1">Show labeled demo data</a> (fictional numbers, no sign-in needed).</p>
      </div>`;
    const send = $('#tm-send');
    if (send) send.onclick = async () => {
      send.disabled = true;
      try { await C.Cloud.sendLink($('#tm-email').value, location.origin + location.pathname); send.outerHTML = `<p class="small">${icon('check', 16)} Check your inbox and open the link on this device.</p>`; }
      catch (e) { send.disabled = false; $('#tm-err').textContent = e.message; }
    };
    const out = $('#tm-out');
    if (out) out.onclick = async () => { await C.Cloud.signOut(); gate(); };
  }
  window.addEventListener('centspire:signin', () => render());

  let showDemo = U.demo;

  async function render() {
    let real = { source: 'device', data: null };
    if (!showDemo) {
      const sess = C.Analytics.remoteEnabled() ? await C.Cloud.validSession() : null;
      token = sess ? sess.access_token : null;
      real = await C.Analytics.summary({ token });
      if (real.source === 'denied') return gate(real.reason === 'signin' ? null : real.reason);
    }
    const s = showDemo ? DEMO : real.data;
    const label = showDemo
      ? `<div class="callout" style="background:var(--gold);color:var(--navy)">${icon('presentation', 22)}<p><b>DEMO DATA — fictional numbers for presentations.</b> These are not real participant results.</p></div>`
      : real.source === 'shared'
        ? `<div class="callout callout-mint">${icon('shield', 22)}<p><b>Actual data</b> from the shared database (all devices), as aggregate totals only. Team only.</p></div>`
        : `<div class="callout callout-gold">${icon('alert', 22)}<p><b>Actual data from this device only.</b> Connect Supabase (see README) to combine results from every student’s device.</p></div>`;
    const p = s.paired || { n: 0, byTopic: {} };
    root.innerHTML = `
      <section class="hero on-navy"><div class="container" style="padding-top:48px;padding-bottom:40px">
        <p class="eyebrow" style="color:var(--gold)">For the Centspire team</p>
        <h1 style="max-width:22ch">Impact dashboard</h1>
        <p class="lead">Are students actually learning? Paired before-and-after scores on equivalent question sets answer that.</p>
        <div class="row" style="margin-top:14px">
          <button class="btn ${showDemo ? 'btn-ghost' : 'btn-primary'} btn-sm" data-mode="real" aria-pressed="${!showDemo}">Actual data</button>
          <button class="btn ${showDemo ? 'btn-gold' : 'btn-ghost'} btn-sm" data-mode="demo" aria-pressed="${showDemo}">Demo data</button>
          ${token ? `<button class="btn btn-ghost btn-sm" id="tm-out2">Sign out</button>` : ''}
        </div>
      </div></section>
      <div class="container section stack">
        ${label}
        <div class="grid grid-4">
          <div class="stat card"><span class="k">Unique participants</span><span class="v">${s.participants}</span><span class="s">${s.returning} came back on another day</span></div>
          <div class="stat card"><span class="k">Simulator completions</span><span class="v">${s.simCompletes}</span><span class="s">${s.simStarts} started · ${pct(s.completionRate)} completion</span></div>
          <div class="stat card"><span class="k">Average score: before → after</span><span class="v">${pct(p.pre)} → ${pct(p.post)}</span><span class="s">${p.n} students with both checks</span></div>
          <div class="stat card"><span class="k">Students who improved</span><span class="v">${p.n ? pct(p.improved / p.n) : '—'}</span><span class="s">${p.improved || 0} of ${p.n}</span></div>
        </div>
        <section class="card" aria-labelledby="t-h">
          <h2 id="t-h" style="font-size:1.35rem">${icon('chart', 22)} Improvement by topic</h2>
          <p class="small muted">Average % correct for students who took both checks. Each student’s “before” and “after” used different but equivalent questions, and the order was randomized.</p>
          ${p.n ? `<div class="bars" style="margin-top:12px">${TOPICS.map((t) => { const b = p.byTopic[t.id] || {}; return `<div><p class="small" style="margin:6px 0 4px"><b>${t.label}</b>${b.pre != null && b.post != null ? ` <span class="muted">(${b.post - b.pre >= 0 ? '+' : ''}${Math.round((b.post - b.pre) * 100)} points)</span>` : ''}</p>
            <div class="hbar"><span>Before</span><span class="track"><i class="c-gold" style="width:${(b.pre || 0) * 100}%"></i></span><span class="n">${pct(b.pre)}</span></div>
            <div class="hbar"><span>After</span><span class="track"><i class="c-mint" style="width:${(b.post || 0) * 100}%"></i></span><span class="n">${pct(b.post)}</span></div></div>`; }).join('')}</div>`
            : '<p class="empty">No paired results yet. They appear after students finish both knowledge checks in the simulator.</p>'}
        </section>
        <div class="grid grid-3">
          <div class="stat card"><span class="k">Lessons completed</span><span class="v">${s.lessonsCompleted}</span><span class="s">by ${s.lessonParticipants} students · ${pct(s.lessonPassRate)} passed on questions</span></div>
          <div class="stat card"><span class="k">Missions completed</span><span class="v">${s.missionsCompleted}</span></div>
          <div class="stat card"><span class="k">One-week retention</span><span class="v">${pct(s.retention && s.retention.avg)}</span><span class="s">${s.retention ? s.retention.n : 0} check-ins · their pre-test average ${pct(s.retention && s.retention.preAvg)}</span></div>
          <div class="stat card"><span class="k">Average rating</span><span class="v">${s.feedback && s.feedback.avg != null ? (+s.feedback.avg).toFixed(1) + ' / 5' : '—'}</span><span class="s">${s.feedback ? s.feedback.n : 0} ratings</span></div>
          <div class="stat card"><span class="k">Net Promoter Score</span><span class="v">${s.feedback && s.feedback.nps != null ? (s.feedback.nps > 0 ? '+' : '') + s.feedback.nps : '—'}</span><span class="s">% who’d recommend (9–10) minus % who wouldn’t (0–6) · ${s.feedback ? s.feedback.npsN || 0 : 0} answers</span></div>
          <div class="stat card"><span class="k">Want it at their school</span><span class="v">${pct(s.feedback && s.feedback.schoolYes)}</span><span class="s">${s.feedback ? s.feedback.schoolN || 0 : 0} answers · a sign of real demand</span></div>
          <div class="stat card"><span class="k">Average Challenge Score</span><span class="v">${s.challenge && s.challenge.avg != null ? Math.round(s.challenge.avg).toLocaleString('en-US') : '—'}</span><span class="s">${s.challenge ? s.challenge.over10k : 0} players scored over 10,000</span></div>
          <div class="stat card"><span class="k">Rewards earned</span><span class="v">${s.rewards ? s.rewards.claims : 0}</span><span class="s">${s.rewards ? s.rewards.accuracy : 0} accuracy · ${s.rewards ? s.rewards.score : 0} score${s.rewards && s.rewards.redeemed != null ? ` · ${s.rewards.redeemed} redeemed` : ''}</span></div>
          <div class="stat card"><span class="k">Saved across devices</span><span class="v">${s.syncs ? s.syncs.code : 0}</span><span class="s">save codes created or loaded</span></div>
          <div class="stat card"><span class="k">Took the first check</span><span class="v">${s.preCount}</span></div>
          <div class="stat card"><span class="k">Took the final check</span><span class="v">${s.postCount}</span></div>
        </div>
        <section class="card" id="claims" aria-labelledby="cv-h">
          <h2 id="cv-h" style="font-size:1.35rem">${icon('award', 22)} Check a reward claim</h2>
          <p class="small muted">At the pop-up table: type the student’s claim code to see what they earned. Enter the team PIN to mark it as given out, so a code can’t be used twice.</p>
          <div class="row" style="gap:8px;align-items:flex-end">
            <div class="field" style="margin:0"><label for="cv-code">Claim code</label><input class="input" id="cv-code" placeholder="CS-XXXX-XXXX" autocomplete="off" style="max-width:200px"></div>
            <button class="btn btn-navy btn-sm" id="cv-check">Check code</button>
          </div>
          <div id="cv-out" aria-live="polite" style="margin-top:12px"></div>
        </section>
        <section class="card card-cream">
          <h2 style="font-size:1.2rem">${icon('shield', 20)} How this is measured</h2>
          <ul class="small">
            <li>Each student gets a random anonymous code. No names, emails, or school IDs are collected.</li>
            <li>Before and after the simulator, students answer 12 questions (2 per topic, including scams &amp; digital money). Forms A and B test the same objectives with different numbers; half of students get A first, half get B first.</li>
            <li>Improvement compares the same students’ latest “before” and “after” checks. A one-week check-in measures what they remember.</li>
            <li>The public site can only add events; this dashboard reads totals and averages from a summary function, never individual records.</li>
          </ul>
          ${!showDemo && real.source === 'device' ? `<button class="btn btn-ghost btn-sm" id="clear">Clear this device’s test events</button>` : ''}
        </section>
      </div>`;
    root.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { showDemo = b.dataset.mode === 'demo'; render(); }));
    const out2 = $('#tm-out2');
    if (out2) out2.onclick = async () => { await C.Cloud.signOut(); token = null; render(); };
    if (showDemo || !token) { const cl = $('#claims'); if (cl) cl.remove(); }
    const check = $('#cv-check');
    if (check) check.onclick = async () => {
      const code = $('#cv-code').value.trim().toUpperCase();
      const out = $('#cv-out');
      if (!/^CS-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) { out.innerHTML = '<p class="small" style="color:var(--coral-ink)">Claim codes look like CS-AB12-CD34.</p>'; return; }
      if (!C.Analytics.remoteEnabled()) { out.innerHTML = '<p class="small muted">Claims can only be checked when the shared database is connected.</p>'; return; }
      out.innerHTML = '<p class="small muted">Checking…</p>';
      try {
        const r = await rpc('v5_verify_claim', { p_claim: code });
        if (!r.found) { out.innerHTML = `<div class="callout callout-coral">${icon('x', 20)}<p>No reward was recorded for <b>${esc(code)}</b>.</p></div>`; return; }
        const rc = C.Rewards.config();
        const what = (r.rewards || []).map((x) => (x === 'score' ? rc.scoreReward : rc.accuracyReward)).join(' + ');
        out.innerHTML = `<div class="callout ${r.redeemed ? 'callout-gold' : 'callout-mint'}">${icon(r.redeemed ? 'alert' : 'check', 20)}<div><p><b>${esc(code)}</b> earned <b>${esc(what)}</b> · Challenge Score ${Number(r.score).toLocaleString('en-US')} · ${Math.round(r.accuracy * 100)}% correct · ${new Date(r.created_at).toLocaleString()}</p>
          ${r.redeemed ? '<p><b>Already given out.</b></p>' : `<div class="row" style="gap:8px;margin-top:8px"><input class="input" id="cv-pin" type="password" placeholder="Team PIN" autocomplete="off" style="max-width:140px"><button class="btn btn-primary btn-sm" id="cv-redeem">Mark as given out</button></div>`}</div></div>`;
        const red = $('#cv-redeem');
        if (red) red.onclick = async () => {
          const x = await rpc('v5_redeem_claim', { p_claim: code, p_pin: $('#cv-pin').value });
          const msg = x.ok ? 'Marked as given out.' : x.reason === 'wrong-pin' ? 'Wrong team PIN.' : x.reason === 'already-redeemed' ? 'This code was already given out.' : 'Code not found.';
          U.toast(msg);
          if (x.ok || x.reason === 'already-redeemed') check.click();
        };
      } catch (e) { out.innerHTML = `<p class="small" style="color:var(--coral-ink)">${esc(e.message)}</p>`; }
    };
    const clear = $('#clear');
    if (clear) clear.onclick = () => { if (confirm('Delete the analytics events stored on this device?')) { C.Analytics.clearLocal(); render(); } };
  }
  render();
})();
