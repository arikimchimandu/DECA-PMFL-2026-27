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
      byTopic: { college: { pre: 0.55, post: 0.84 }, budgeting: { pre: 0.68, post: 0.86 }, credit: { pre: 0.38, post: 0.71 }, saving: { pre: 0.57, post: 0.80 }, income: { pre: 0.42, post: 0.69 } } },
    lessonsCompleted: 112, lessonParticipants: 29, lessonPassRate: 0.81, missionsCompleted: 38,
    feedback: { n: 33, avg: 4.4 }, retention: { n: 12, avg: 0.72, preAvg: 0.50 },
  };

  let showDemo = U.demo;

  async function render() {
    const real = await C.Analytics.summary();
    const s = showDemo ? DEMO : real.data;
    const label = showDemo
      ? `<div class="callout" style="background:var(--gold);color:var(--navy)">${icon('presentation', 22)}<p><b>DEMO DATA — fictional numbers for presentations.</b> These are not real participant results.</p></div>`
      : real.source === 'shared'
        ? `<div class="callout callout-mint">${icon('shield', 22)}<p><b>Actual data</b> from the shared database (all devices), as aggregate totals only.</p></div>`
        : `<div class="callout callout-gold">${icon('alert', 22)}<p><b>Actual data from this device only.</b> ${real.error ? esc(real.error) + ' ' : ''}Connect Supabase (see README) to combine results from every student’s device.</p></div>`;
    const p = s.paired || { n: 0, byTopic: {} };
    root.innerHTML = `
      <section class="hero on-navy"><div class="container" style="padding-top:48px;padding-bottom:40px">
        <p class="eyebrow" style="color:var(--gold)">For the Centspire team</p>
        <h1 style="max-width:22ch">Impact dashboard</h1>
        <p class="lead">Are students actually learning? Paired before-and-after scores on equivalent question sets answer that.</p>
        <div class="row" style="margin-top:14px">
          <button class="btn ${showDemo ? 'btn-ghost' : 'btn-primary'} btn-sm" data-mode="real" aria-pressed="${!showDemo}">Actual data</button>
          <button class="btn ${showDemo ? 'btn-gold' : 'btn-ghost'} btn-sm" data-mode="demo" aria-pressed="${showDemo}">Demo data</button>
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
          <div class="stat card"><span class="k">Helpfulness rating</span><span class="v">${s.feedback && s.feedback.avg != null ? (+s.feedback.avg).toFixed(1) + ' / 5' : '—'}</span><span class="s">${s.feedback ? s.feedback.n : 0} ratings</span></div>
          <div class="stat card"><span class="k">Took the first check</span><span class="v">${s.preCount}</span></div>
          <div class="stat card"><span class="k">Took the final check</span><span class="v">${s.postCount}</span></div>
        </div>
        <section class="card card-cream">
          <h2 style="font-size:1.2rem">${icon('shield', 20)} How this is measured</h2>
          <ul class="small">
            <li>Each student gets a random anonymous code. No names, emails, or school IDs are collected.</li>
            <li>Before and after the simulator, students answer 10 questions (2 per topic). Forms A and B test the same objectives with different numbers; half of students get A first, half get B first.</li>
            <li>Improvement compares the same students’ latest “before” and “after” checks. A one-week check-in measures what they remember.</li>
            <li>The public site can only add events; this dashboard reads totals and averages from a summary function, never individual records.</li>
          </ul>
          ${!showDemo && real.source === 'device' ? `<button class="btn btn-ghost btn-sm" id="clear">Clear this device’s test events</button>` : ''}
        </section>
      </div>`;
    root.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { showDemo = b.dataset.mode === 'demo'; render(); }));
    const clear = $('#clear');
    if (clear) clear.onclick = () => { if (confirm('Delete the analytics events stored on this device?')) { C.Analytics.clearLocal(); render(); } };
  }
  render();
})();
