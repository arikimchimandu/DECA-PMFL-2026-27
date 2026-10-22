/* My Progress: learning scores, pathways, quiz history, review areas, recommendations, reports, retention check. */
(function () {
  const C = window.Centsible, U = C.UI, M = C.Mastery, F = C.Finance;
  const { $, icon, esc, store } = U;
  U.mountShell('progress');
  const root = $('#progress');
  const RETENTION_DAYS = 7;

  function render() {
    const d = store.get();
    const L = C.Lessons, TOPICS = C.Assessments.TOPICS;
    const mastery = M.topicMastery(d.evidence);
    const lessonsDone = L.LESSONS.filter((x) => d.lessons[x.id] && d.lessons[x.id].done);
    const missionsDone = C.Missions.MISSIONS.filter((x) => d.missions[x.id] && d.missions[x.id].done);
    const allAnswers = Object.entries(d.evidence).flatMap(([t, list]) => list.map((e) => ({ topic: t, concept: e.c, correct: e.ok })));
    const missed = M.missedConcepts(allAnswers);
    const weakTopics = Object.entries(mastery).filter(([, v]) => v.n >= 2 && v.score < 0.7).map(([t]) => t);
    const recs = M.recommend(L.LESSONS, { missed, flags: Object.keys(d.flags), weakTopics }, d.lessons, 3);
    const lastPre = [...d.assessments].reverse().find((a) => a.phase === 'pre');
    const lastPost = [...d.assessments].reverse().find((a) => a.phase === 'post');
    const retention = [...d.assessments].reverse().find((a) => a.phase === 'retention');
    const improvement = lastPre && lastPost ? M.improvement(lastPre, lastPost) : null;
    const totalAnswers = allAnswers.length;
    const reviewMission = C.Missions.MISSIONS.find((m) => weakTopics.includes(m.topic)) || C.Missions.missionOfWeek();

    const levelColor = (v) => (v.level === 'strong' ? 'var(--mint)' : v.level === 'developing' ? 'var(--gold)' : v.level === 'review' ? 'var(--coral)' : 'var(--cream-3)');

    // Retention check eligibility
    let retentionHtml = '';
    if (lastPost && !retention) {
      const due = lastPost.at + RETENTION_DAYS * 86400000;
      retentionHtml = Date.now() >= due
        ? `<div class="callout callout-navy">${icon('clock', 20)}<div><p><b>Your one-week check-in is ready.</b> 10 quick questions (about 2 minutes) to see how much you remember. It helps our team measure whether Centspire works.</p><button class="btn btn-primary btn-sm" id="ret-go" style="margin-top:10px">Start the check-in</button></div></div><div id="ret-box"></div>`
        : `<div class="callout callout-gold">${icon('clock', 20)}<p>A short one-week check-in unlocks on <b>${new Date(due).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</b>. Come back then to see how much you remember.</p></div>`;
    } else if (retention) {
      retentionHtml = `<div class="callout callout-mint">${icon('check', 20)}<p>One-week check-in complete: <b>${retention.score}/${retention.total}</b>${lastPost ? ` (right after the game: ${lastPost.score}/${lastPost.total})` : ''}.</p></div>`;
    }

    root.innerHTML = `
      <section class="hero on-navy"><div class="container" style="padding-top:48px;padding-bottom:44px">
        <p class="eyebrow" style="color:var(--gold)">My Progress</p>
        <h1 style="max-width:20ch">${lessonsDone.length || d.reports.length || missionsDone.length ? 'Look how far you’ve come' : 'Your progress starts here'}</h1>
        <p class="lead">Saved privately in this browser — no account needed. <a href="#sync" style="color:var(--mint)">Save it across devices</a></p>
        <div class="grid grid-4" style="margin-top:20px">
          <div class="stat" style="background:var(--navy-2)"><span class="k" style="color:var(--muted-on-navy)">Lessons</span><span class="v">${lessonsDone.length}/${L.LESSONS.length}</span></div>
          <div class="stat" style="background:var(--navy-2)"><span class="k" style="color:var(--muted-on-navy)">Missions</span><span class="v">${missionsDone.length}/${C.Missions.MISSIONS.length}</span></div>
          <div class="stat" style="background:var(--navy-2)"><span class="k" style="color:var(--muted-on-navy)">Simulator reports</span><span class="v">${d.reports.length}</span></div>
          <div class="stat" style="background:var(--navy-2)"><span class="k" style="color:var(--muted-on-navy)">Questions answered</span><span class="v">${totalAnswers}</span></div>
          <div class="stat" style="background:var(--navy-2)"><span class="k" style="color:var(--muted-on-navy)">Credit points</span><span class="v">${store.credits().toLocaleString('en-US')}</span></div>
          <div class="stat" style="background:var(--navy-2)"><span class="k" style="color:var(--muted-on-navy)">Best Challenge Score</span><span class="v">${(() => { const b = Math.max(0, ...d.reports.map((r) => (r.challenge ? r.challenge.challenge.total : 0))); return b ? b.toLocaleString('en-US') : '—'; })()}</span></div>
        </div>
      </div></section>

      <div class="container section stack">
        ${retentionHtml}
        <section class="card" id="sync" aria-labelledby="sync-h"></section>
        ${(d.claims || []).length ? `<section class="card card-cream" aria-labelledby="cl-h"><h2 id="cl-h" style="font-size:1.35rem">${icon('award', 22)} Your reward claim codes</h2>
          <p class="small muted">Show a code at the Centspire table to claim your reward.</p>
          <div class="kv">${d.claims.slice().reverse().map((c) => `<div><span class="k"><code class="claim-inline">${esc(c.claim)}</code> · ${new Date(c.at).toLocaleDateString()}</span><span>${c.rewards.map((x) => (x === 'score' ? esc(C.Rewards.config().scoreReward) : esc(C.Rewards.config().accuracyReward))).join(' + ')}</span></div>`).join('')}</div></section>` : ''}
        <section class="grid grid-2" style="align-items:start">
          <div class="card" aria-labelledby="m-h">
            <h2 id="m-h" style="font-size:1.35rem">${icon('target', 22)} Learning scores</h2>
            <p class="small muted">From your most recent answers in the simulator, lessons, and missions. A topic needs at least ${M.MIN_EVIDENCE} answers before we call it strong.</p>
            ${TOPICS.map((t) => { const v = mastery[t.id]; return `<div class="topic-score"><span class="name"><span class="medal medal-cream" style="width:34px;height:34px">${icon(t.icon, 18)}</span>${t.label}</span>
              <span class="small">${v.n ? `<b>${U.pct(v.score)}</b> · ${v.label}` : '<span class="muted">No answers yet</span>'}</span>
              <div class="progress" role="img" aria-label="${t.label}: ${v.n ? U.pct(v.score) : 'no answers yet'}"><i style="width:${(v.score || 0) * 100}%;background:${levelColor(v)}"></i></div>
              ${v.n ? `<span class="small muted" style="grid-column:1/-1">Based on ${v.n} answer${v.n === 1 ? '' : 's'}</span>` : ''}</div>`; }).join('')}
          </div>
          <div class="stack">
            <div class="card" aria-labelledby="r-h">
              <h2 id="r-h" style="font-size:1.35rem">${icon('star', 22)} Recommended next</h2>
              ${recs.length ? recs.map((x) => `<div class="decision-impact"><span class="medal medal-mint" style="width:40px;height:40px">${icon('notebook', 18)}</span><div style="flex:1"><a href="lesson.html?id=${x.lesson.id}"><b>${esc(x.lesson.title)}</b></a><p class="small" style="margin:4px 0 0">${esc(M.reasonText(x))}</p></div></div>`).join('')
                : `<p class="muted">${totalAnswers ? 'No gaps found in your recent answers. Explore a new pathway to keep growing.' : 'Play the simulator or try a lesson, and we’ll suggest what to learn next.'}</p>`}
              <div class="row" style="margin-top:12px">
                ${!d.reports.length ? `<a class="btn btn-primary btn-sm" href="simulator.html">${icon('play', 16)} Play the simulator</a>` : ''}
                <a class="btn btn-ghost btn-sm" href="mission.html?id=${reviewMission.id}">${icon('target', 16)} Practice: ${esc(reviewMission.title)}</a>
              </div>
            </div>
            <div class="card" aria-labelledby="a-h">
              <h2 id="a-h" style="font-size:1.35rem">${icon('alert', 22)} Areas to review</h2>
              ${missed.length ? `<ul style="margin:0">${missed.map((c) => { const lesson = L.LESSONS.find((x) => x.concepts.includes(c)); return `<li>${esc(C.Concepts[c].label)}${lesson ? ` — <a href="lesson.html?id=${lesson.id}">review</a>` : ''}</li>`; }).join('')}</ul>`
                : '<p class="muted" style="margin:0">Nothing to review right now.</p>'}
            </div>
          </div>
        </section>

        <section class="card" aria-labelledby="q-h">
          <h2 id="q-h" style="font-size:1.35rem">${icon('chart', 22)} Knowledge checks</h2>
          ${d.assessments.length ? `
            ${improvement ? `<div class="bars" style="margin:10px 0 16px">${TOPICS.map((t) => `<div><p class="small" style="margin:0 0 4px"><b>${t.label}</b></p>
              <div class="hbar"><span>Before</span><span class="track"><i class="c-gold" style="width:${(improvement[t.id].pre || 0) * 100}%"></i></span><span class="n">${U.pct(improvement[t.id].pre)}</span></div>
              <div class="hbar"><span>After</span><span class="track"><i class="c-mint" style="width:${(improvement[t.id].post || 0) * 100}%"></i></span><span class="n">${U.pct(improvement[t.id].post)}</span></div></div>`).join('')}</div>` : ''}
            <div class="table-wrap"><table class="data"><thead><tr><th>Date</th><th>Check</th><th class="num">Score</th></tr></thead><tbody>
            ${[...d.assessments].reverse().map((a) => `<tr><td>${new Date(a.at).toLocaleDateString()}</td><td>${a.phase === 'pre' ? 'Before the simulator' : a.phase === 'post' ? 'After the simulator' : 'One-week check-in'} (set ${a.form})</td><td class="num">${a.score}/${a.total}</td></tr>`).join('')}</tbody></table></div>`
            : '<p class="muted">Play the simulator to take your first knowledge check.</p>'}
        </section>

        <section class="card" aria-labelledby="p-h">
          <h2 id="p-h" style="font-size:1.35rem">${icon('notebook', 22)} Learning pathways</h2>
          ${L.PATHWAYS.map((p) => { const ls = L.LESSONS.filter((x) => x.pathway === p.id); const n = ls.filter((x) => d.lessons[x.id] && d.lessons[x.id].done).length;
            return `<div class="meter-row"><span class="label">${icon(p.icon, 18)} ${p.title}</span><div class="progress"><i style="width:${(n / ls.length) * 100}%"></i></div><span class="val">${n}/${ls.length}</span></div>`; }).join('')}
          ${lessonsDone.length ? `<details class="more" style="margin-top:12px"><summary>Completed lessons (${lessonsDone.length})</summary><ul>${lessonsDone.map((x) => { const s = d.lessons[x.id]; return `<li><a href="lesson.html?id=${x.id}">${esc(x.title)}</a> — first try ${s.firstTry.correct}/${s.firstTry.total}${s.passed ? '' : ' · <span class="tag tag-gold">review suggested</span>'}</li>`; }).join('')}</ul></details>` : ''}
        </section>

        <section class="grid grid-2" style="align-items:start">
          <div class="card" aria-labelledby="mi-h"><h2 id="mi-h" style="font-size:1.35rem">${icon('target', 22)} Missions</h2>
            ${C.Missions.MISSIONS.map((m) => { const s = d.missions[m.id]; return `<div class="meter-row" style="grid-template-columns:1fr auto"><a href="mission.html?id=${m.id}">${esc(m.title)}</a>${s && s.done ? `<span class="tag tag-mint">${icon('check', 14)} Done</span>` : '<span class="tag">Not yet</span>'}</div>`; }).join('')}</div>
          <div class="card" aria-labelledby="rep-h"><h2 id="rep-h" style="font-size:1.35rem">${icon('chart', 22)} Saved reports</h2>
            ${d.reports.length ? d.reports.map((r) => `<div class="meter-row" style="grid-template-columns:1fr auto"><a href="report.html?id=${encodeURIComponent(r.id)}">${new Date(r.createdAt).toLocaleDateString()} · ${esc(r.college)}</a><span class="small muted">${F.money(r.money.studentDebt)} debt</span></div>`).join('')
              : `<p class="muted">No reports yet.</p><a class="btn btn-primary btn-sm" href="simulator.html">${icon('play', 16)} Play the simulator</a>`}</div>
        </section>

        <section class="card card-cream" aria-labelledby="dc-h">
          <h2 id="dc-h" style="font-size:1.2rem">${icon('shield', 20)} Your data</h2>
          <p class="small">Your progress is stored in this browser${d.saveCode || (C.Cloud && C.Cloud.getSession()) ? ', and also saved to your save code or account' : '. If you clear your browser data or switch devices, it starts fresh unless you use a save code or sign in'}. Anonymous participant code: <code>${esc(d.participant.slice(0, 8))}</code>${d.importedFromV4 ? ' · Your Version 4 progress was brought over.' : ''}</p>
          <div class="row"><button class="btn btn-ghost btn-sm" id="reset">${icon('replay', 16)} Reset all progress</button><a class="small" href="about.html#privacy">How Centspire handles data</a></div>
        </section>
      </div>`;

    renderSync();
    $('#reset').onclick = () => {
      if (confirm('Reset all lessons, missions, scores, and reports on this device? This can’t be undone.')) { store.reset(); U.toast('Progress reset'); render(); }
    };
    const go = $('#ret-go');
    if (go) go.onclick = () => runRetention(lastPre ? lastPre.form : (d.counterbalance === 'BA' ? 'B' : 'A'));
  }

  // ------------------------------------------------------------ save across devices
  function renderSync() {
    const box = $('#sync');
    if (!box) return;
    const Cl = C.Cloud;
    const d = store.get();
    if (U.demo) { box.innerHTML = `<h2 id="sync-h" style="font-size:1.35rem">${icon('shield', 22)} Save across devices</h2><p class="muted">Not available in presentation demo mode.</p>`; return; }
    if (!Cl || !Cl.enabled()) { box.innerHTML = `<h2 id="sync-h" style="font-size:1.35rem">${icon('shield', 22)} Save across devices</h2><p class="muted">Saving across devices isn’t set up on this site yet. Your progress is still saved in this browser.</p>`; return; }
    const sess = Cl.getSession();
    const st = Cl.status;
    box.innerHTML = `
      <h2 id="sync-h" style="font-size:1.35rem">${icon('shield', 22)} Save across devices</h2>
      <p class="small muted">Optional. Pick up where you left off on a phone, a school Chromebook, or at home. Both options work at the same time.</p>
      <div class="grid grid-2" style="margin-top:12px;align-items:start">
        <div class="card card-cream">
          <h3 style="margin-top:0">${icon('lock', 18)} Save code <span class="tag tag-mint">No email needed</span></h3>
          ${d.saveCode ? `<p class="small" style="margin:0 0 6px">Your save code:</p><p class="claim-code" style="font-size:1.4rem">${esc(Cl.fmtCode(d.saveCode))}</p>
            <p class="small">Write it down or take a screenshot. Your progress saves to it automatically. Anyone with this code can open your progress, so keep it to yourself.</p>
            <div class="row"><button class="btn btn-ghost btn-sm" id="sc-copy">${icon('link', 16)} Copy code</button><button class="link-btn small" id="sc-forget">Stop using this code on this device</button></div>`
            : `<p class="small">Get a code like <b>K7QD-M2XA-9PTF</b>. Type it on any device to load your progress.</p><button class="btn btn-navy btn-sm" id="sc-new">${icon('lock', 16)} Get a save code</button>`}
          <div class="field" style="margin-top:14px"><label for="sc-in">Have a code from another device?</label>
            <div class="row" style="gap:8px"><input class="input" id="sc-in" autocomplete="off" autocapitalize="characters" placeholder="XXXX-XXXX-XXXX" style="max-width:220px"><button class="btn btn-ghost btn-sm" id="sc-load">Load</button></div>
            <span class="error" id="sc-err" role="alert"></span></div>
        </div>
        <div class="card card-cream">
          <h3 style="margin-top:0">${icon('mail', 18)} Sign in with email</h3>
          ${sess ? `<p class="small" style="margin:0 0 10px">Signed in as <b>${esc(sess.user.email || 'your account')}</b>. Your progress syncs automatically.</p>
              <div class="row"><button class="btn btn-ghost btn-sm" id="em-sync">${icon('replay', 16)} Sync now</button><button class="link-btn small" id="em-out">Sign out</button></div>`
            : `<p class="small">We’ll email you a sign-in link — no password. Use your personal email if your school email blocks outside messages.</p>
              <div class="field"><label for="em-in">Email</label><input class="input" id="em-in" type="email" autocomplete="email" value="${esc(Cl.pendingEmail())}" placeholder="you@example.com"></div>
              <div class="row" style="margin-top:10px"><button class="btn btn-navy btn-sm" id="em-send">${icon('mail', 16)} Email me a sign-in link</button></div>
              <details class="more" style="margin-top:10px"><summary class="small">Got a 6-digit code instead?</summary>
                <div class="row" style="gap:8px;margin-top:8px"><input class="input" id="em-code" inputmode="numeric" autocomplete="one-time-code" placeholder="123456" style="max-width:140px"><button class="btn btn-ghost btn-sm" id="em-verify">Sign in</button></div></details>
              <p class="small muted" style="margin:10px 0 0">Your email is used only to sign you in. It is never added to our learning data. Under 13? Ask a parent or guardian first.</p>`}
          <span class="error" id="em-err" role="alert"></span>
        </div>
      </div>
      <p class="small muted" id="sync-status" style="margin:12px 0 0">${st.busy ? 'Saving…' : st.error ? `${icon('alert', 14)} ${esc(st.error)}` : st.lastSync ? `${icon('check', 14)} Saved ${new Date(st.lastSync).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}</p>`;

    const fail = (id) => (e) => { const el = $('#' + id); if (el) el.textContent = e.message || 'Something went wrong.'; };
    const busy = (btn, on) => { if (btn) { btn.disabled = on; btn.setAttribute('aria-busy', on); } };
    const on = (id, fn) => { const el = $('#' + id); if (el) el.addEventListener('click', () => fn(el)); };
    on('sc-new', async (btn) => { busy(btn, true); try { await Cl.createCode(); U.toast('Save code created'); render(); } catch (err) { busy(btn, false); fail('sc-err')(err); store.update((x) => { x.saveCode = null; }); } });
    on('sc-copy', async () => { try { await navigator.clipboard.writeText(Cl.fmtCode(d.saveCode)); U.toast('Code copied'); } catch { U.toast('Select the code and copy it'); } });
    on('sc-forget', () => { if (confirm('Stop saving to this code on this device? Your progress stays in this browser, and the code still works on other devices.')) { Cl.forgetCode(); render(); } });
    on('sc-load', async (btn) => {
      const code = $('#sc-in').value;
      if (!Cl.validCode(code)) { $('#sc-err').textContent = 'Save codes have 12 letters and numbers, like K7QD-M2XA-9PTF.'; return; }
      busy(btn, true);
      try { await Cl.loadCode(code); U.toast('Progress loaded and combined with this device'); render(); } catch (err) { busy(btn, false); fail('sc-err')(err); }
    });
    on('em-send', async (btn) => {
      busy(btn, true);
      try { await Cl.sendLink($('#em-in').value, location.origin + location.pathname); $('#em-err').textContent = ''; btn.outerHTML = `<p class="small" style="margin:0">${icon('check', 16)} Check your inbox for a link from Supabase. Open it on <b>this</b> device to finish signing in.</p>`; }
      catch (err) { busy(btn, false); fail('em-err')(err); }
    });
    on('em-verify', async (btn) => {
      busy(btn, true);
      try { await Cl.verifyCode($('#em-in').value, $('#em-code').value); await Cl.afterSignIn(); U.toast('Signed in'); render(); } catch (err) { busy(btn, false); fail('em-err')(err); }
    });
    on('em-sync', async (btn) => { busy(btn, true); try { await Cl.afterSignIn(); U.toast('Synced'); render(); } catch (err) { busy(btn, false); fail('em-err')(err); } });
    on('em-out', async () => { await Cl.signOut(); U.toast('Signed out. Your progress stays in this browser.'); render(); });
  }
  window.addEventListener('centspire:signin', () => render());
  if (C.Cloud) C.Cloud.onChange(() => { const el = $('#sync-status'); const st = C.Cloud.status; if (el) el.innerHTML = st.busy ? 'Saving…' : st.error ? `${icon('alert', 14)} ${esc(st.error)}` : st.lastSync ? `${icon('check', 14)} Saved ${new Date(st.lastSync).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''; });

  function runRetention(formId) {
    const form = C.Assessments.forms[formId], answers = [];
    const box = $('#ret-box');
    const next = () => {
      if (answers.length === form.length) {
        const res = M.scoreAssessment(formId, answers);
        store.update((d) => { d.assessments.push({ phase: 'retention', form: formId, score: res.score, total: res.total, byTopic: res.byTopic, items: res.items, at: Date.now() }); });
        C.Analytics.log('assessment', store.get().participant, 'progress', { phase: 'retention', form: formId, score: res.score, total: res.total, byTopic: res.byTopic, items: res.items.map((x) => (x.correct ? 1 : 0)) });
        U.toast(`Check-in complete: ${res.score}/${res.total}`);
        render(); return;
      }
      box.innerHTML = `<div class="card" style="margin-top:12px"><p class="eyebrow">One-week check-in · ${answers.length + 1} of ${form.length}</p><div id="ret-q"></div></div>`;
      U.question($('#ret-q'), form[answers.length], { feedback: false, onAnswer: (ok, text) => { answers.push(text); setTimeout(next, 200); } });
    };
    $('#ret-go').closest('.callout').remove();
    next();
  }

  render();
  if (location.hash === '#sync') { const el = $('#sync'); if (el) el.scrollIntoView(); }
})();
